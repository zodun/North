import type { Metadata } from "next";
import { getServerSupabase } from "@/lib/supabase-server";
import { MonthlyMissionView } from "./monthly-mission-view";

export const metadata: Metadata = { title: "Mission" };

export default async function MissionPage() {
	const supabase = await getServerSupabase();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return (
			<div className="flex h-full items-center justify-center p-8 text-center">
				<p className="text-[#0E1420]/55 text-sm">
					Sign in to see your mission.
				</p>
			</div>
		);
	}

	// Make sure this month's goal exists (covers users created after the
	// migration's one-time backfill, and the first load of a new month).
	await supabase.rpc("ensure_monthly_mission", { p_user: user.id });

	const today = new Date().toISOString().slice(0, 10);

	const [missionRes, profileRes, streakRes] = await Promise.all([
		supabase
			.from("monthly_missions")
			.select(
				"id, goal_title, goal_intent, focus_area_id, month_start, generated_by",
			)
			.eq("user_id", user.id)
			.order("month_start", { ascending: false })
			.limit(1)
			.maybeSingle(),
		supabase
			.from("profiles")
			.select(
				"mission_cadence, goal_prompt_dismissed_month, display_name, purpose_mode",
			)
			.eq("user_id", user.id)
			.maybeSingle(),
		supabase
			.from("streaks")
			.select("state")
			.eq("user_id", user.id)
			.eq("day", today)
			.maybeSingle(),
	]);

	const mission = missionRes.data ?? null;

	const { data: steps } = mission
		? await supabase
				.from("monthly_mission_steps")
				.select(
					"id, cadence, week_index, due_date, title, detail, estimate_label, done",
				)
				.eq("monthly_mission_id", mission.id)
				.order("sort_order")
		: { data: [] };

	const cadence =
		profileRes.data?.mission_cadence === "weekly" ? "weekly" : "daily";

	// The week the user is actually on follows progress, not the calendar: steps
	// unlock one at a time, so the active step is the FIRST undone day. A fresh
	// mission opens on week 1 and only advances as steps get completed. (Once the
	// whole plan is done, fall back to the last step.)
	const dailySteps = (
		(steps ?? []) as {
			cadence: string;
			due_date: string | null;
			week_index: number;
			done: boolean;
		}[]
	).filter((s) => s.cadence === "daily");
	const activeStep =
		dailySteps.find((s) => !s.done) ??
		dailySteps[dailySteps.length - 1] ??
		dailySteps[0];
	const currentWeekIndex = mission ? (activeStep?.week_index ?? 0) : 0;

	// Prompt the user to author their own goal when this month's mission is
	// still the seeded template and they haven't dismissed the prompt this month.
	const promptGoal =
		!!mission &&
		mission.generated_by === "template" &&
		profileRes.data?.goal_prompt_dismissed_month !== mission.month_start;

	// Greet by first name + time of day (Jamaica, UTC-5), matching the other tabs.
	const firstName = (profileRes.data?.display_name ?? "there").split(/\s+/)[0];
	const hour = (new Date().getUTCHours() + 19) % 24; // UTC-5
	const greeting =
		hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

	const purposeMode =
		profileRes.data?.purpose_mode === "explorer" ||
		profileRes.data?.purpose_mode === "builder"
			? profileRes.data.purpose_mode
			: null;

	return (
		<MonthlyMissionView
			mission={mission}
			steps={steps ?? []}
			cadence={cadence}
			today={today}
			currentWeekIndex={currentWeekIndex}
			streakState={streakRes.data?.state ?? null}
			promptGoal={promptGoal}
			firstName={firstName}
			greeting={greeting}
			purposeMode={purposeMode}
		/>
	);
}
