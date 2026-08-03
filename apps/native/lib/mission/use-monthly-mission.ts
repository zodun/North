// The monthly mission: one goal per rolling 28-day cycle, broken into
// 4 weekly milestones + one small daily step (see migrations 0040/0074).
//
// Real mode mirrors the web Mission page: ensure_monthly_mission seeds a
// template cycle if none is active, then the latest monthly_missions row
// and its monthly_mission_steps are loaded. Bypass serves the fixture
// cycle (or one re-planned through the Set Goal flow this session).

import { useCallback, useEffect, useState } from "react";

import { supabase, useSession } from "../auth-client";
import { useAuthBypass } from "../dev-bypass";
import { getMockMonthlyMission } from "./fixtures";

export type StepCadence = "daily" | "weekly";

export type MissionStep = {
	id: string;
	cadence: StepCadence;
	week_index: number;
	due_date: string | null;
	title: string;
	detail: string | null;
	estimate_label: string | null;
	done: boolean;
};

export type MonthlyMission = {
	id: string;
	goal_title: string;
	goal_intent: string | null;
	focus_area_id: string | null;
	month_start: string;
	generated_by: string;
};

export type MonthlyMissionData = {
	mission: MonthlyMission;
	steps: MissionStep[];
	/** True once the "make this starter goal yours" nudge was waved off this cycle. */
	promptDismissed: boolean;
};

// Current AST date (UTC-4, no DST). Matches todayInAST() in the Edge Functions.
export function todayInAST(): string {
	const astMs = Date.now() - 4 * 60 * 60 * 1000;
	return new Date(astMs).toISOString().slice(0, 10);
}

export type MissionView = {
	weekly: MissionStep[];
	currentWeekIndex: number;
	/** Today's one small step: due today, else the first undone day this week. */
	focalStep: MissionStep | null;
	weeksDone: number;
};

// currentWeekIndex follows PROGRESS, not the calendar: the week of the first
// unfinished day. A fresh or behind mission opens on Week 1 and advances only
// as steps complete — same sequential unlock as the web Mission page.
export function deriveMissionView(
	steps: MissionStep[],
	today: string,
): MissionView {
	const daily = steps
		.filter((s) => s.cadence === "daily")
		.sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""));
	const weekly = steps
		.filter((s) => s.cadence === "weekly")
		.sort((a, b) => a.week_index - b.week_index);

	const firstUndone = daily.find((s) => !s.done);
	const currentWeekIndex = firstUndone?.week_index ?? 0;
	const weekDays = daily.filter((s) => s.week_index === currentWeekIndex);
	const focalStep =
		weekDays.find((s) => s.due_date === today) ??
		weekDays.find((s) => !s.done) ??
		weekDays[weekDays.length - 1] ??
		null;

	return {
		weekly,
		currentWeekIndex,
		focalStep,
		weeksDone: weekly.filter((s) => s.done).length,
	};
}

export function useMonthlyMission() {
	const { data: session } = useSession();
	const bypass = useAuthBypass();
	const [data, setData] = useState<MonthlyMissionData | null | undefined>(
		undefined,
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		if (bypass) {
			setData(getMockMonthlyMission());
			setLoading(false);
			return;
		}
		if (!session) return;
		setError(null);

		// Seed a template cycle if none is active (idempotent server-side, same
		// call the web page makes). Best-effort: a failure just means the reads
		// below may come back empty.
		await supabase.rpc("ensure_monthly_mission", { p_user: session.user.id });

		const [missionRes, profileRes] = await Promise.all([
			supabase
				.from("monthly_missions")
				.select(
					"id, goal_title, goal_intent, focus_area_id, month_start, generated_by",
				)
				.eq("user_id", session.user.id)
				.order("month_start", { ascending: false })
				.limit(1)
				.maybeSingle(),
			supabase
				.from("profiles")
				.select("goal_prompt_dismissed_month")
				.eq("user_id", session.user.id)
				.maybeSingle(),
		]);

		if (missionRes.error) {
			setError(missionRes.error.message);
			setLoading(false);
			return;
		}
		const mission = missionRes.data as MonthlyMission | null;
		if (!mission) {
			setData(null);
			setLoading(false);
			return;
		}

		const { data: steps, error: stepsErr } = await supabase
			.from("monthly_mission_steps")
			.select(
				"id, cadence, week_index, due_date, title, detail, estimate_label, done",
			)
			.eq("monthly_mission_id", mission.id)
			.order("sort_order");

		if (stepsErr) {
			setError(stepsErr.message);
		} else {
			setData({
				mission,
				steps: (steps ?? []) as MissionStep[],
				promptDismissed:
					profileRes.data?.goal_prompt_dismissed_month === mission.month_start,
			});
		}
		setLoading(false);
	}, [session, bypass]);

	useEffect(() => {
		setLoading(true);
		void refresh();
	}, [refresh]);

	// Quietly remember the starter-goal nudge was waved off for this cycle.
	const dismissPrompt = useCallback(async () => {
		setData((prev) => (prev ? { ...prev, promptDismissed: true } : prev));
		if (bypass || !session || !data?.mission) return;
		await supabase
			.from("profiles")
			.update({ goal_prompt_dismissed_month: data.mission.month_start })
			.eq("user_id", session.user.id);
	}, [session, bypass, data?.mission]);

	return { data, loading, error, refresh, dismissPrompt };
}
