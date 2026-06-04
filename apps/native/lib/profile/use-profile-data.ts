import type { StreakState } from "@north/native-ui";
import { useCallback, useEffect, useState } from "react";
import { supabase, useSession } from "../auth-client";
import { todayInAST } from "../mission/use-today-mission";
import { FOCUS_AREAS } from "../onboarding/questions";

export type FocusAreaSummary = {
	id: string;
	label: string;
	hue: string;
};

export type SignalBand = "Drifting" | "Finding" | "Aligned";

export type SavedOpportunitySummary = {
	id: string;
	title: string;
	org: string;
};

export type ProfileData = {
	displayName: string | null;
	focusAreas: FocusAreaSummary[];
	/** 28 streak states, oldest first. 0 = miss, 1 = active, 2 = directed, 3 = rest. */
	streaks28: StreakState[];
	/** Day-of-week letter labels for the last 28 days (for ConsistencyGrid). */
	dayLabels28: string[];
	/** Day-of-week letters for the last 7 days (for RhythmStreakCard). */
	dayLabels7: string[];
	/** Current running count of directed-or-rest days from today backwards. */
	rhythmStreak: number;
	directedDaysThisWeek: number;
	tasksCompletedThisWeek: number;
	totalTasksThisWeek: number;
	/** null = no score computed yet */
	signalBand: SignalBand | null;
	signalTrend: "climbing" | "holding" | "easing" | null;
	savedCount: number;
	savedOpportunities: SavedOpportunitySummary[];
};

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

// Returns letter labels for the `count` days ending on `endDateStr` (AST date).
function dayLetters(endDateStr: string, count: number): string[] {
	const end = new Date(`${endDateStr}T12:00:00Z`);
	return Array.from({ length: count }, (_, i) => {
		const d = new Date(end);
		d.setUTCDate(end.getUTCDate() - (count - 1 - i));
		return DAY_LETTERS[d.getUTCDay()] ?? "?";
	});
}

// Compute the current rhythm streak (directed=2 or rest=3 run from the end).
function computeRhythm(states: StreakState[]): number {
	let n = 0;
	for (let i = states.length - 1; i >= 0; i--) {
		if (states[i] === 2 || states[i] === 3) n++;
		else break;
	}
	return n;
}

// ISO week-start (Monday) for a given AST date string.
function weekStartAST(dateStr: string): string {
	const d = new Date(`${dateStr}T12:00:00Z`);
	const day = d.getUTCDay(); // 0=Sun
	const offset = day === 0 ? 6 : day - 1; // back to Monday
	d.setUTCDate(d.getUTCDate() - offset);
	return d.toISOString().slice(0, 10);
}

export function useProfileData() {
	const { data: session } = useSession();
	const [data, setData] = useState<ProfileData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		if (!session) return;
		setError(null);
		const userId = session.user.id;
		const today = todayInAST();
		const windowStart = (() => {
			const d = new Date(`${today}T12:00:00Z`);
			d.setUTCDate(d.getUTCDate() - 27);
			return d.toISOString().slice(0, 10);
		})();
		const weekStart = weekStartAST(today);

		const [profileRes, focusRes, streakRes, missionRes, signalRes, savedRes] =
			await Promise.all([
				supabase
					.from("profiles")
					.select("display_name")
					.eq("user_id", userId)
					.maybeSingle<{ display_name: string | null }>(),

				supabase
					.from("user_focus_areas")
					.select("focus_area_id")
					.eq("user_id", userId),

				supabase
					.from("streaks")
					.select("day, state")
					.eq("user_id", userId)
					.gte("day", windowStart)
					.lte("day", today)
					.order("day", { ascending: true }),

				supabase
					.from("missions")
					.select("id, mission_date, user_mission_tasks(done)")
					.eq("user_id", userId)
					.gte("mission_date", weekStart)
					.lte("mission_date", today),

				// Latest two signal scores to derive band + trend.
				supabase
					.from("signal_scores")
					.select("band, raw_score")
					.eq("user_id", userId)
					.lte("week_ending", today)
					.order("week_ending", { ascending: false })
					.limit(2),

				// Saved opportunities — count + last 3 titles.
				supabase
					.from("user_saved_opportunities")
					.select("opportunity_id, opportunities(id, title, org)")
					.eq("user_id", userId)
					.order("saved_at", { ascending: false })
					.limit(3),
			]);

		if (profileRes.error) {
			setError(profileRes.error.message);
			return;
		}
		if (focusRes.error) {
			setError(focusRes.error.message);
			return;
		}
		if (streakRes.error) {
			setError(streakRes.error.message);
			return;
		}
		if (missionRes.error) {
			setError(missionRes.error.message);
			return;
		}

		// Focus areas: look up label/hue from the client-side constant.
		const focusAreas: FocusAreaSummary[] = (
			(focusRes.data ?? []) as { focus_area_id: string }[]
		)
			.map((r) => FOCUS_AREAS.find((f) => f.id === r.focus_area_id))
			.filter((f): f is FocusAreaSummary => Boolean(f));

		// Build a dense 28-day array (missing days = 0/miss).
		const streakMap = new Map<string, StreakState>(
			((streakRes.data ?? []) as { day: string; state: number }[]).map((r) => [
				r.day,
				r.state as StreakState,
			]),
		);
		const streaks28: StreakState[] = Array.from({ length: 28 }, (_, i) => {
			const d = new Date(`${today}T12:00:00Z`);
			d.setUTCDate(d.getUTCDate() - (27 - i));
			return streakMap.get(d.toISOString().slice(0, 10)) ?? 0;
		});

		// Mission stats for the current ISO week.
		const missionData = (missionRes.data ?? []) as {
			id: string;
			user_mission_tasks: { done: boolean }[];
		}[];
		let tasksTotal = 0;
		let tasksDone = 0;
		for (const m of missionData) {
			for (const t of m.user_mission_tasks) {
				tasksTotal++;
				if (t.done) tasksDone++;
			}
		}

		const week7 = streaks28.slice(-7);

		// Signal band + trend.
		const scoreRows = (signalRes.data ?? []) as {
			band: SignalBand;
			raw_score: number;
		}[];
		const signalBand = scoreRows[0]?.band ?? null;
		let signalTrend: "climbing" | "holding" | "easing" | null = null;
		if (scoreRows.length >= 2) {
			const delta = scoreRows[0].raw_score - scoreRows[1].raw_score;
			signalTrend = delta > 2 ? "climbing" : delta < -2 ? "easing" : "holding";
		} else if (scoreRows.length === 1) {
			signalTrend = "holding";
		}

		// Saved opportunities. Supabase returns the FK join as an array.
		type SavedRow = {
			opportunity_id: string;
			opportunities: { id: string; title: string; org: string }[] | null;
		};
		const savedRows = (savedRes.data ?? []) as unknown as SavedRow[];
		const savedOpportunities: SavedOpportunitySummary[] = savedRows
			.flatMap((r) => r.opportunities ?? [])
			.filter((o): o is SavedOpportunitySummary => Boolean(o?.id));

		setData({
			displayName: profileRes.data?.display_name ?? null,
			focusAreas,
			streaks28,
			dayLabels28: dayLetters(today, 28),
			dayLabels7: dayLetters(today, 7),
			rhythmStreak: computeRhythm(streaks28),
			directedDaysThisWeek: week7.filter((s) => s === 2).length,
			tasksCompletedThisWeek: tasksDone,
			totalTasksThisWeek: tasksTotal,
			signalBand,
			signalTrend,
			savedCount: savedRows.length,
			savedOpportunities,
		});
		setLoading(false);
	}, [session]);

	useEffect(() => {
		setLoading(true);
		void refresh();
	}, [refresh]);

	return { data, loading, error, refresh };
}
