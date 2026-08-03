// Data hooks for the Community spaces (communities, groups, mentors,
// events, challenges, DMs, achievements, creator profiles).
//
// Bypass mode: a single in-memory store seeded from fixtures.ts —
// mutations update it and every subscribed hook re-renders, so e.g.
// "Request intro" in the mentor sheet shows up in Messages.
// Real mode: supabase against the community-spaces tables
// (20260731T114217_community_spaces.sql); every query degrades to an
// empty list if a table is missing so the tab never crashes.

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { supabase, useSession } from "../auth-client";
import { useAuthBypass } from "../dev-bypass";
import {
	FIXTURE_CHALLENGES,
	FIXTURE_COMMUNITIES,
	FIXTURE_CREATOR_BIOS,
	FIXTURE_DEFAULT_BIO,
	FIXTURE_DM_THREADS,
	FIXTURE_EVENTS,
	FIXTURE_GROUP_NOTES,
	FIXTURE_GROUPS,
	FIXTURE_MENTORS,
} from "./fixtures";
import type {
	Achievement,
	Challenge,
	CommunityEvent,
	CreatorProfile,
	DmThread,
	GroupNote,
	InterestCommunity,
	Mentor,
	MissionGroup,
} from "./types";

// ── Bypass store ──────────────────────────────────────────────────────

type SpacesState = {
	communities: InterestCommunity[];
	groups: MissionGroup[];
	groupNotes: GroupNote[];
	mentors: Mentor[];
	events: CommunityEvent[];
	challenges: Challenge[];
	threads: DmThread[];
	follows: Record<string, boolean>;
};

function seed(): SpacesState {
	return {
		communities: FIXTURE_COMMUNITIES.map((c) => ({ ...c })),
		groups: FIXTURE_GROUPS.map((g) => ({ ...g, members: [...g.members] })),
		groupNotes: FIXTURE_GROUP_NOTES.map((n) => ({ ...n })),
		mentors: FIXTURE_MENTORS.map((m) => ({
			...m,
			focusAreas: [...m.focusAreas],
		})),
		events: FIXTURE_EVENTS.map((e) => ({ ...e })),
		challenges: FIXTURE_CHALLENGES.map((c) => ({
			...c,
			topThree: [...c.topThree],
		})),
		threads: FIXTURE_DM_THREADS.map((t) => ({
			...t,
			messages: t.messages.map((m) => ({ ...m })),
		})),
		follows: {},
	};
}

let state: SpacesState | null = null;
const subscribers = new Set<() => void>();

function getState(): SpacesState {
	if (!state) state = seed();
	return state;
}

function mutate(fn: (prev: SpacesState) => SpacesState) {
	state = fn(getState());
	for (const notify of subscribers) notify();
}

function useSpacesStore(): SpacesState {
	return useSyncExternalStore(
		(cb) => {
			subscribers.add(cb);
			return () => subscribers.delete(cb);
		},
		getState,
		getState,
	);
}

// ── Shared real-mode helpers ──────────────────────────────────────────

async function profileNames(
	userIds: string[],
): Promise<Record<string, string>> {
	if (userIds.length === 0) return {};
	const { data } = await supabase
		.from("public_profiles")
		.select("user_id, display_name")
		.in("user_id", userIds);
	return Object.fromEntries(
		((data ?? []) as { user_id: string; display_name: string | null }[]).map(
			(p) => [p.user_id, p.display_name?.trim() || "Someone"],
		),
	);
}

// ── Communities by interest ───────────────────────────────────────────

export function useCommunities() {
	const bypass = useAuthBypass();
	const { data: session } = useSession();
	const store = useSpacesStore();
	const [rows, setRows] = useState<InterestCommunity[]>([]);
	const [loading, setLoading] = useState(true);
	const userId = session?.user.id;

	const refresh = useCallback(async () => {
		if (bypass) {
			setLoading(false);
			return;
		}
		const [{ data: comms, error }, { data: mems }] = await Promise.all([
			supabase.from("interest_communities").select("id, name, about"),
			supabase.from("community_memberships").select("community_id, user_id"),
		]);
		if (error) {
			setRows([]);
			setLoading(false);
			return;
		}
		const memberships = (mems ?? []) as {
			community_id: string;
			user_id: string;
		}[];
		setRows(
			((comms ?? []) as { id: string; name: string; about: string }[]).map(
				(c) => ({
					id: c.id,
					name: c.name,
					about: c.about ?? "",
					memberCount: memberships.filter((m) => m.community_id === c.id)
						.length,
					joined: memberships.some(
						(m) => m.community_id === c.id && m.user_id === userId,
					),
				}),
			),
		);
		setLoading(false);
	}, [bypass, userId]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	const toggleJoin = useCallback(
		async (id: string) => {
			if (bypass) {
				mutate((s) => ({
					...s,
					communities: s.communities.map((c) =>
						c.id === id
							? {
									...c,
									joined: !c.joined,
									memberCount: c.memberCount + (c.joined ? -1 : 1),
								}
							: c,
					),
				}));
				return;
			}
			if (!userId) return;
			const current = rows.find((c) => c.id === id);
			if (!current) return;
			if (current.joined) {
				await supabase
					.from("community_memberships")
					.delete()
					.eq("community_id", id)
					.eq("user_id", userId);
			} else {
				await supabase
					.from("community_memberships")
					.insert({ community_id: id, user_id: userId });
			}
			await refresh();
		},
		[bypass, userId, rows, refresh],
	);

	return {
		communities: bypass ? store.communities : rows,
		loading: bypass ? false : loading,
		toggleJoin,
	};
}

// ── Mission groups ────────────────────────────────────────────────────

export function useMissionGroups() {
	const bypass = useAuthBypass();
	const { data: session } = useSession();
	const store = useSpacesStore();
	const [rows, setRows] = useState<MissionGroup[]>([]);
	const [loading, setLoading] = useState(true);
	const userId = session?.user.id;

	const refresh = useCallback(async () => {
		if (bypass) {
			setLoading(false);
			return;
		}
		const [{ data: groups, error }, { data: members }] = await Promise.all([
			supabase.from("mission_groups").select("id, name, goal, cadence"),
			supabase.from("mission_group_members").select("group_id, user_id"),
		]);
		if (error) {
			setRows([]);
			setLoading(false);
			return;
		}
		const mems = (members ?? []) as { group_id: string; user_id: string }[];
		const names = await profileNames([...new Set(mems.map((m) => m.user_id))]);
		setRows(
			(
				(groups ?? []) as {
					id: string;
					name: string;
					goal: string;
					cadence: string;
				}[]
			).map((g) => ({
				id: g.id,
				name: g.name,
				goal: g.goal ?? "",
				cadence: g.cadence ?? "",
				members: mems
					.filter((m) => m.group_id === g.id)
					.map((m) => names[m.user_id] ?? "Someone"),
				joined: mems.some((m) => m.group_id === g.id && m.user_id === userId),
			})),
		);
		setLoading(false);
	}, [bypass, userId]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	const toggleJoin = useCallback(
		async (id: string) => {
			if (bypass) {
				mutate((s) => ({
					...s,
					groups: s.groups.map((g) =>
						g.id === id
							? {
									...g,
									joined: !g.joined,
									members: g.joined
										? g.members.filter((m) => m !== "Zoe")
										: [...g.members, "Zoe"],
								}
							: g,
					),
				}));
				return;
			}
			if (!userId) return;
			const current = rows.find((g) => g.id === id);
			if (!current) return;
			if (current.joined) {
				await supabase
					.from("mission_group_members")
					.delete()
					.eq("group_id", id)
					.eq("user_id", userId);
			} else {
				await supabase
					.from("mission_group_members")
					.insert({ group_id: id, user_id: userId });
			}
			await refresh();
		},
		[bypass, userId, rows, refresh],
	);

	return {
		groups: bypass ? store.groups : rows,
		loading: bypass ? false : loading,
		toggleJoin,
	};
}

export function useGroupNotes(groupId: string | null) {
	const bypass = useAuthBypass();
	const { data: session } = useSession();
	const store = useSpacesStore();
	const [rows, setRows] = useState<GroupNote[]>([]);
	const [submitting, setSubmitting] = useState(false);
	const userId = session?.user.id;

	const refresh = useCallback(async () => {
		if (bypass || !groupId) return;
		const { data, error } = await supabase
			.from("mission_group_notes")
			.select("id, group_id, user_id, body, created_at")
			.eq("group_id", groupId)
			.order("created_at", { ascending: false })
			.limit(50);
		if (error) {
			setRows([]);
			return;
		}
		const notes = (data ?? []) as {
			id: string;
			group_id: string;
			user_id: string;
			body: string;
			created_at: string;
		}[];
		const names = await profileNames([...new Set(notes.map((n) => n.user_id))]);
		setRows(
			notes.map((n) => ({
				id: n.id,
				groupId: n.group_id,
				author: names[n.user_id] ?? "Someone",
				body: n.body,
				createdAt: n.created_at,
				isMine: n.user_id === userId,
			})),
		);
	}, [bypass, groupId, userId]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	const submit = useCallback(
		async (body: string): Promise<boolean> => {
			const text = body.trim();
			if (!text || !groupId || submitting) return false;
			setSubmitting(true);
			try {
				if (bypass) {
					mutate((s) => ({
						...s,
						groupNotes: [
							{
								id: `local-note-${Date.now()}`,
								groupId,
								author: "Zoe",
								body: text,
								createdAt: new Date().toISOString(),
								isMine: true,
							},
							...s.groupNotes,
						],
					}));
					return true;
				}
				if (!userId) return false;
				const { error } = await supabase
					.from("mission_group_notes")
					.insert({ group_id: groupId, user_id: userId, body: text });
				if (error) return false;
				await refresh();
				return true;
			} finally {
				setSubmitting(false);
			}
		},
		[bypass, groupId, userId, submitting, refresh],
	);

	const notes = bypass
		? store.groupNotes.filter((n) => n.groupId === groupId)
		: rows;

	return { notes, submitting, submit };
}

// ── Mentor directory ──────────────────────────────────────────────────

export function useMentors() {
	const bypass = useAuthBypass();
	const { data: session } = useSession();
	const store = useSpacesStore();
	const [rows, setRows] = useState<Mentor[]>([]);
	const [loading, setLoading] = useState(true);
	const userId = session?.user.id;

	const refresh = useCallback(async () => {
		if (bypass) {
			setLoading(false);
			return;
		}
		const [{ data: mentors, error }, { data: threads }] = await Promise.all([
			supabase
				.from("mentors")
				.select("id, name, role, org, focus_areas, availability"),
			userId
				? supabase
						.from("dm_threads")
						.select("mentor_id")
						.eq("a_user", userId)
						.not("mentor_id", "is", null)
				: Promise.resolve({ data: [] as { mentor_id: string }[] }),
		]);
		if (error) {
			setRows([]);
			setLoading(false);
			return;
		}
		const requested = new Set(
			((threads ?? []) as { mentor_id: string | null }[]).map(
				(t) => t.mentor_id,
			),
		);
		setRows(
			(
				(mentors ?? []) as {
					id: string;
					name: string;
					role: string;
					org: string;
					focus_areas: string[] | null;
					availability: string;
				}[]
			).map((m) => ({
				id: m.id,
				name: m.name,
				role: m.role ?? "",
				org: m.org ?? "",
				focusAreas: m.focus_areas ?? [],
				availability:
					m.availability === "limited" || m.availability === "full"
						? m.availability
						: "open",
				introRequested: requested.has(m.id),
			})),
		);
		setLoading(false);
	}, [bypass, userId]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	const requestIntro = useCallback(
		async (mentor: Mentor): Promise<boolean> => {
			const intro = `Hi ${mentor.name.split(" ")[0]} — I'd love a short intro chat about ${mentor.focusAreas[0]?.toLowerCase() ?? "your work"}.`;
			if (bypass) {
				mutate((s) => ({
					...s,
					mentors: s.mentors.map((m) =>
						m.id === mentor.id ? { ...m, introRequested: true } : m,
					),
					threads: [
						{
							id: `dm-mentor-${mentor.id}`,
							personName: mentor.name,
							messages: [
								{
									id: `dm-intro-${Date.now()}`,
									fromMe: true,
									body: intro,
									at: new Date().toISOString(),
								},
							],
						},
						...s.threads.filter((t) => t.id !== `dm-mentor-${mentor.id}`),
					],
				}));
				return true;
			}
			if (!userId) return false;
			const { data, error } = await supabase
				.from("dm_threads")
				.insert({ a_user: userId, mentor_id: mentor.id })
				.select("id")
				.single();
			if (error || !data) return false;
			await supabase.from("dm_messages").insert({
				thread_id: (data as { id: string }).id,
				sender_id: userId,
				body: intro,
			});
			await refresh();
			return true;
		},
		[bypass, userId, refresh],
	);

	return {
		mentors: bypass ? store.mentors : rows,
		loading: bypass ? false : loading,
		requestIntro,
	};
}

// ── Events & meetups ──────────────────────────────────────────────────

export function useEvents() {
	const bypass = useAuthBypass();
	const { data: session } = useSession();
	const store = useSpacesStore();
	const [rows, setRows] = useState<CommunityEvent[]>([]);
	const [loading, setLoading] = useState(true);
	const userId = session?.user.id;

	const refresh = useCallback(async () => {
		if (bypass) {
			setLoading(false);
			return;
		}
		const [{ data: events, error }, { data: rsvps }] = await Promise.all([
			supabase
				.from("community_events")
				.select("id, title, starts_at, city, is_online, host")
				.gte("starts_at", new Date().toISOString())
				.order("starts_at"),
			userId
				? supabase.from("event_rsvps").select("event_id").eq("user_id", userId)
				: Promise.resolve({ data: [] as { event_id: string }[] }),
		]);
		if (error) {
			setRows([]);
			setLoading(false);
			return;
		}
		const mine = new Set(
			((rsvps ?? []) as { event_id: string }[]).map((r) => r.event_id),
		);
		setRows(
			(
				(events ?? []) as {
					id: string;
					title: string;
					starts_at: string;
					city: string | null;
					is_online: boolean;
					host: string;
				}[]
			).map((e) => ({
				id: e.id,
				title: e.title,
				startsAt: e.starts_at,
				city: e.city,
				online: e.is_online,
				host: e.host ?? "",
				rsvped: mine.has(e.id),
			})),
		);
		setLoading(false);
	}, [bypass, userId]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	const toggleRsvp = useCallback(
		async (id: string) => {
			if (bypass) {
				mutate((s) => ({
					...s,
					events: s.events.map((e) =>
						e.id === id ? { ...e, rsvped: !e.rsvped } : e,
					),
				}));
				return;
			}
			if (!userId) return;
			const current = rows.find((e) => e.id === id);
			if (!current) return;
			if (current.rsvped) {
				await supabase
					.from("event_rsvps")
					.delete()
					.eq("event_id", id)
					.eq("user_id", userId);
			} else {
				await supabase
					.from("event_rsvps")
					.insert({ event_id: id, user_id: userId });
			}
			await refresh();
		},
		[bypass, userId, rows, refresh],
	);

	return {
		events: bypass ? store.events : rows,
		loading: bypass ? false : loading,
		toggleRsvp,
	};
}

// ── Challenges ────────────────────────────────────────────────────────

export function useChallenges() {
	const bypass = useAuthBypass();
	const { data: session } = useSession();
	const store = useSpacesStore();
	const [rows, setRows] = useState<Challenge[]>([]);
	const [loading, setLoading] = useState(true);
	const userId = session?.user.id;

	const refresh = useCallback(async () => {
		if (bypass) {
			setLoading(false);
			return;
		}
		const [{ data: challenges, error }, { data: parts }] = await Promise.all([
			supabase
				.from("challenges")
				.select("id, title, tagline, ends_at")
				.gte("ends_at", new Date().toISOString().slice(0, 10))
				.order("ends_at"),
			supabase
				.from("challenge_participants")
				.select("challenge_id, user_id, days_held, last_held_on"),
		]);
		if (error) {
			setRows([]);
			setLoading(false);
			return;
		}
		const participants = (parts ?? []) as {
			challenge_id: string;
			user_id: string;
			days_held: number;
			last_held_on: string | null;
		}[];
		const weekStart = new Date();
		weekStart.setDate(weekStart.getDate() - weekStart.getDay());
		const weekStartKey = weekStart.toISOString().slice(0, 10);
		const names = await profileNames([
			...new Set(participants.map((p) => p.user_id)),
		]);
		setRows(
			(
				(challenges ?? []) as {
					id: string;
					title: string;
					tagline: string;
					ends_at: string;
				}[]
			).map((c) => {
				const inChallenge = participants.filter((p) => p.challenge_id === c.id);
				const mine = inChallenge.find((p) => p.user_id === userId);
				const steady = [...inChallenge]
					.sort((a, b) => (b.days_held ?? 0) - (a.days_held ?? 0))
					.slice(0, 3)
					.map((p) => (names[p.user_id] ?? "Someone").split(" ")[0]);
				return {
					id: c.id,
					title: c.title,
					tagline: c.tagline ?? "",
					endsAt: c.ends_at,
					joined: !!mine,
					participants: inChallenge.length,
					heldThisWeek: inChallenge.filter(
						(p) => p.last_held_on && p.last_held_on >= weekStartKey,
					).length,
					topThree: steady,
					yourStanding: mine
						? `You're holding day ${Math.max(1, mine.days_held ?? 0)} — steady.`
						: null,
				};
			}),
		);
		setLoading(false);
	}, [bypass, userId]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	const toggleJoin = useCallback(
		async (id: string) => {
			if (bypass) {
				mutate((s) => ({
					...s,
					challenges: s.challenges.map((c) =>
						c.id === id
							? {
									...c,
									joined: !c.joined,
									participants: c.participants + (c.joined ? -1 : 1),
									yourStanding: c.joined
										? null
										: "You're in — day 1 starts tomorrow morning.",
								}
							: c,
					),
				}));
				return;
			}
			if (!userId) return;
			const current = rows.find((c) => c.id === id);
			if (!current) return;
			if (current.joined) {
				await supabase
					.from("challenge_participants")
					.delete()
					.eq("challenge_id", id)
					.eq("user_id", userId);
			} else {
				await supabase
					.from("challenge_participants")
					.insert({ challenge_id: id, user_id: userId });
			}
			await refresh();
		},
		[bypass, userId, rows, refresh],
	);

	return {
		challenges: bypass ? store.challenges : rows,
		loading: bypass ? false : loading,
		toggleJoin,
	};
}

// ── Direct messages ───────────────────────────────────────────────────

export function useMessages() {
	const bypass = useAuthBypass();
	const { data: session } = useSession();
	const store = useSpacesStore();
	const [rows, setRows] = useState<DmThread[]>([]);
	const [loading, setLoading] = useState(true);
	const userId = session?.user.id;

	const refresh = useCallback(async () => {
		if (bypass) {
			setLoading(false);
			return;
		}
		if (!userId) {
			setLoading(false);
			return;
		}
		const { data: threads, error } = await supabase
			.from("dm_threads")
			.select("id, a_user, b_user, mentor_id")
			.or(`a_user.eq.${userId},b_user.eq.${userId}`);
		if (error) {
			setRows([]);
			setLoading(false);
			return;
		}
		const threadRows = (threads ?? []) as {
			id: string;
			a_user: string;
			b_user: string | null;
			mentor_id: string | null;
		}[];
		const threadIds = threadRows.map((t) => t.id);
		const otherUserIds = threadRows
			.map((t) => (t.a_user === userId ? t.b_user : t.a_user))
			.filter((id): id is string => !!id);
		const mentorIds = threadRows
			.map((t) => t.mentor_id)
			.filter((id): id is string => !!id);
		const [names, mentorsRes, messagesRes] = await Promise.all([
			profileNames([...new Set(otherUserIds)]),
			mentorIds.length > 0
				? supabase.from("mentors").select("id, name").in("id", mentorIds)
				: Promise.resolve({ data: [] as { id: string; name: string }[] }),
			threadIds.length > 0
				? supabase
						.from("dm_messages")
						.select("id, thread_id, sender_id, body, created_at")
						.in("thread_id", threadIds)
						.order("created_at")
				: Promise.resolve({
						data: [] as {
							id: string;
							thread_id: string;
							sender_id: string;
							body: string;
							created_at: string;
						}[],
					}),
		]);
		const mentorNames = Object.fromEntries(
			((mentorsRes.data ?? []) as { id: string; name: string }[]).map((m) => [
				m.id,
				m.name,
			]),
		);
		const messages = (messagesRes.data ?? []) as {
			id: string;
			thread_id: string;
			sender_id: string;
			body: string;
			created_at: string;
		}[];
		setRows(
			threadRows.map((t) => {
				const other = t.a_user === userId ? t.b_user : t.a_user;
				const personName = t.mentor_id
					? (mentorNames[t.mentor_id] ?? "Mentor")
					: other
						? (names[other] ?? "Someone")
						: "Someone";
				return {
					id: t.id,
					personName,
					messages: messages
						.filter((m) => m.thread_id === t.id)
						.map((m) => ({
							id: m.id,
							fromMe: m.sender_id === userId,
							body: m.body,
							at: m.created_at,
						})),
				};
			}),
		);
		setLoading(false);
	}, [bypass, userId]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	const send = useCallback(
		async (threadId: string, body: string): Promise<boolean> => {
			const text = body.trim();
			if (!text) return false;
			if (bypass) {
				mutate((s) => ({
					...s,
					threads: s.threads.map((t) =>
						t.id === threadId
							? {
									...t,
									messages: [
										...t.messages,
										{
											id: `local-dm-${Date.now()}`,
											fromMe: true,
											body: text,
											at: new Date().toISOString(),
										},
									],
								}
							: t,
					),
				}));
				return true;
			}
			if (!userId) return false;
			const { error } = await supabase
				.from("dm_messages")
				.insert({ thread_id: threadId, sender_id: userId, body: text });
			if (error) return false;
			await refresh();
			return true;
		},
		[bypass, userId, refresh],
	);

	return {
		threads: bypass ? store.threads : rows,
		loading: bypass ? false : loading,
		send,
	};
}

// ── Achievements ──────────────────────────────────────────────────────
//
// Quiet badges derived from what the user has actually done — no XP,
// no levels. Bypass derives from fixture-ish state; real mode reads the
// existing person_check_ins table so it works without new persistence.

export function useAchievements(): Achievement[] {
	const bypass = useAuthBypass();
	const { data: session } = useSession();
	const [real, setReal] = useState<Achievement[]>([]);
	const userId = session?.user.id;

	useEffect(() => {
		if (bypass || !userId) return;
		let cancelled = false;
		(async () => {
			const { data, error } = await supabase
				.from("person_check_ins")
				.select("week_ending, signal")
				.limit(200);
			if (error || cancelled) return;
			const checkIns = (data ?? []) as {
				week_ending: string;
				signal: string | null;
			}[];
			const weeks = new Set(checkIns.map((c) => c.week_ending)).size;
			const helped = checkIns.filter((c) => c.signal).length;
			setReal(buildAchievements(checkIns.length >= 1, weeks >= 4, helped >= 5));
		})();
		return () => {
			cancelled = true;
		};
	}, [bypass, userId]);

	if (bypass) {
		// Mock circle: has checked in (Renae, this week), circle has held
		// 4+ weeks, and 3 of 5 helpful notes are in.
		return buildAchievements(true, true, false);
	}
	return real;
}

function buildAchievements(
	first: boolean,
	fourWeeks: boolean,
	helpedFive: boolean,
): Achievement[] {
	const list: Achievement[] = [
		{
			key: "first_check_in",
			label: "First check-in",
			detail: "Left your first weekly note on someone's week.",
			earned: first,
			newest: false,
		},
		{
			key: "four_week_circle",
			label: "4-week circle",
			detail: "Checked in with your circle four weeks running.",
			earned: fourWeeks,
			newest: false,
		},
		{
			key: "helped_five",
			label: "Helped 5 people",
			detail: "Five signal notes that helped someone hold course.",
			earned: helpedFive,
			newest: false,
		},
	];
	// Gold goes to the most recently earnable badge — the last earned one.
	for (let i = list.length - 1; i >= 0; i--) {
		const item = list[i];
		if (item?.earned) {
			item.newest = true;
			break;
		}
	}
	return list;
}

// ── Creator profiles ──────────────────────────────────────────────────

export function useCreatorProfile(
	name: string | null,
	userId?: string | null,
): CreatorProfile & { toggleFollow: () => Promise<void> } {
	const bypass = useAuthBypass();
	const { data: session } = useSession();
	const store = useSpacesStore();
	const [real, setReal] = useState<CreatorProfile | null>(null);
	const me = session?.user.id;

	useEffect(() => {
		if (bypass || !name) return;
		let cancelled = false;
		(async () => {
			let bio = FIXTURE_DEFAULT_BIO;
			let following = false;
			if (userId) {
				const [{ data: profile }, { data: follow }] = await Promise.all([
					supabase
						.from("public_profiles")
						.select("display_name, country")
						.eq("user_id", userId)
						.maybeSingle(),
					me
						? supabase
								.from("creator_follows")
								.select("creator_id")
								.eq("follower_id", me)
								.eq("creator_id", userId)
								.maybeSingle()
						: Promise.resolve({ data: null }),
				]);
				const country = (profile as { country: string | null } | null)?.country;
				if (country) bio = `Moving with North from ${country}.`;
				following = !!follow;
			}
			if (!cancelled) setReal({ name, bio, goal: null, following });
		})();
		return () => {
			cancelled = true;
		};
	}, [bypass, name, userId, me]);

	const toggleFollow = useCallback(async () => {
		if (!name) return;
		if (bypass) {
			mutate((s) => ({
				...s,
				follows: { ...s.follows, [name]: !s.follows[name] },
			}));
			return;
		}
		if (!me || !userId || me === userId) return;
		if (real?.following) {
			await supabase
				.from("creator_follows")
				.delete()
				.eq("follower_id", me)
				.eq("creator_id", userId);
			setReal((prev) => (prev ? { ...prev, following: false } : prev));
		} else {
			await supabase
				.from("creator_follows")
				.insert({ follower_id: me, creator_id: userId });
			setReal((prev) => (prev ? { ...prev, following: true } : prev));
		}
	}, [bypass, name, me, userId, real?.following]);

	if (bypass) {
		const fixture = name ? FIXTURE_CREATOR_BIOS[name] : undefined;
		return {
			name: name ?? "",
			bio: fixture?.bio ?? FIXTURE_DEFAULT_BIO,
			goal: fixture?.goal ?? null,
			following: name ? !!store.follows[name] : false,
			toggleFollow,
		};
	}
	return {
		name: name ?? "",
		bio: real?.bio ?? FIXTURE_DEFAULT_BIO,
		goal: real?.goal ?? null,
		following: real?.following ?? false,
		toggleFollow,
	};
}
