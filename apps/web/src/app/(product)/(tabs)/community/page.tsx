import type { Metadata } from "next";
import { countryFlag } from "@/lib/flag";
import { getServerSupabase } from "@/lib/supabase-server";
import {
	type CommunityCountry,
	CommunityHub,
	type CommunityHubPost,
} from "./community-hub";

export const metadata: Metadata = { title: "Community" };

// Server component: fetches the real peer-community data (peer_posts + authors +
// the viewer's likes + active members) and hands it to the "Community Hub"
// presentation, which is wired to post / like against the same backend.
export default async function CommunityPage() {
	const supabase = await getServerSupabase();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return (
			<div className="flex h-full items-center justify-center p-8 text-center">
				<p className="text-[#0E1420]/55 text-sm">
					Sign in to join the community.
				</p>
			</div>
		);
	}

	const { data: focusRows } = await supabase
		.from("focus_areas")
		.select("id, label");
	const focusLabel: Record<string, string> = {};
	for (const f of focusRows ?? [])
		focusLabel[f.id as string] = f.label as string;

	const { data: me } = await supabase
		.from("public_profiles")
		.select("display_name, focus_area_ids")
		.eq("user_id", user.id)
		.maybeSingle();

	const { data: postRows } = await supabase
		.from("peer_posts")
		.select(
			"id, user_id, category, title, body, is_anonymous, likes_count, replies_count, created_at",
		)
		.order("created_at", { ascending: false })
		.limit(20);
	const posts = postRows ?? [];

	const authorIds = [...new Set(posts.map((p) => p.user_id as string))];
	const postIds = posts.map((p) => p.id as string);
	const [{ data: authorRows }, { data: likeRows }] = await Promise.all([
		authorIds.length
			? supabase
					.from("public_profiles")
					.select("user_id, display_name, country")
					.in("user_id", authorIds)
			: Promise.resolve({ data: [] as { user_id: string }[] }),
		postIds.length
			? supabase
					.from("peer_likes")
					.select("post_id")
					.eq("user_id", user.id)
					.in("post_id", postIds)
			: Promise.resolve({ data: [] as { post_id: string }[] }),
	]);
	const authorById = new Map(
		(
			(authorRows ?? []) as {
				user_id: string;
				display_name: string | null;
				country: string | null;
			}[]
		).map((a) => [a.user_id, a]),
	);
	const liked = new Set(
		((likeRows ?? []) as { post_id: string }[]).map((r) => r.post_id),
	);

	const initialPosts: CommunityHubPost[] = posts.map((p) => {
		const anon = p.is_anonymous as boolean;
		const a = authorById.get(p.user_id as string);
		const name = anon ? "Anonymous" : (a?.display_name ?? "Member");
		return {
			id: p.id as string,
			category: p.category as string,
			title: (p.title as string | null) ?? null,
			body: p.body as string,
			authorName: name,
			authorInitial: (name[0] ?? "·").toUpperCase(),
			authorDetail: anon ? null : (a?.country ?? null),
			flag: anon ? "" : countryFlag(a?.country),
			likesCount: p.likes_count as number,
			repliesCount: p.replies_count as number,
			liked: liked.has(p.id as string),
			createdAt: p.created_at as string,
		};
	});

	// ── Personalisation ─────────────────────────────────────────────────────────
	// Greet by first name + time of day (Jamaica, UTC-5), and connect the user to
	// people on the same focus path.
	const myFocus = (me?.focus_area_ids as string[] | null) ?? [];
	const firstName = (me?.display_name ?? "there").split(/\s+/)[0];
	const focusTopLabel = myFocus.length
		? (focusLabel[myFocus[0]] ?? null)
		: null;
	const hour = (new Date().getUTCHours() + 19) % 24; // UTC-5
	const greeting =
		hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

	const { data: memberRows } = await supabase
		.from("public_profiles")
		.select("user_id, country, focus_area_ids");
	const typedMembers = (memberRows ?? []) as {
		user_id: string;
		country: string | null;
		focus_area_ids: string[] | null;
	}[];

	const samePathCount = typedMembers.filter(
		(m) =>
			myFocus.length > 0 &&
			(m.focus_area_ids ?? []).some((f) => myFocus.includes(f)),
	).length;

	const countryTotals: Record<string, number> = {};
	for (const m of typedMembers) {
		if (!m.country) continue;
		countryTotals[m.country] = (countryTotals[m.country] ?? 0) + 1;
	}
	const countryCounts: CommunityCountry[] = Object.entries(countryTotals)
		.sort((a, b) => b[1] - a[1])
		.map(([country, count]) => ({
			country,
			flag: countryFlag(country),
			count,
		}));

	const { count: memberCount } = await supabase
		.from("public_profiles")
		.select("user_id", { count: "exact", head: true });

	// One discussion per user per day (Jamaica, UTC-5), mirroring the peer_posts
	// daily-limit trigger so the composer can gate itself before the insert fails.
	const startOfJamaicaDay = (() => {
		const shifted = new Date(Date.now() - 5 * 60 * 60 * 1000);
		shifted.setUTCHours(0, 0, 0, 0);
		return new Date(shifted.getTime() + 5 * 60 * 60 * 1000).toISOString();
	})();
	const { count: postedToday } = await supabase
		.from("peer_posts")
		.select("id", { count: "exact", head: true })
		.eq("user_id", user.id)
		.gte("created_at", startOfJamaicaDay);

	return (
		<CommunityHub
			userId={user.id}
			displayName={me?.display_name ?? "You"}
			initialPosts={initialPosts}
			countryCounts={countryCounts}
			memberCount={memberCount ?? typedMembers.length + 1}
			greeting={greeting}
			firstName={firstName}
			focusLabel={focusTopLabel}
			samePathCount={samePathCount}
			canPostToday={(postedToday ?? 0) === 0}
		/>
	);
}
