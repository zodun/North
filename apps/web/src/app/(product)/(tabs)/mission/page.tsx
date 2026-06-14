import type { Metadata } from "next";
import { getServerSupabase } from "@/lib/supabase-server";
import { JournalCard } from "../signal/journal-card";
import { loadSignalData } from "../signal/load-signal-data";
import { MonthlyMissionView } from "./monthly-mission-view";

export const metadata: Metadata = { title: "Mission" };

const DAY_MS = 86_400_000;

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
			.select("mission_cadence, goal_prompt_dismissed_month")
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

	const currentWeekIndex = mission
		? Math.min(
				3,
				Math.max(
					0,
					Math.floor(
						(Date.parse(today) - Date.parse(mission.month_start)) /
							(7 * DAY_MS),
					),
				),
			)
		: 0;

	// Prompt the user to author their own goal when this month's mission is
	// still the seeded template and they haven't dismissed the prompt this month.
	const promptGoal =
		!!mission &&
		mission.generated_by === "template" &&
		profileRes.data?.goal_prompt_dismissed_month !== mission.month_start;

	// The Signal / Direction Score now lives on Profile; Mission keeps only the
	// daily Signal-and-Noise journal. The signal data is still loaded (unchanged)
	// and we use its latest reflection to seed the journal.
	const signal = await loadSignalData(supabase, user.id);

	return (
		<div className="min-h-full pb-24 font-jakarta">
			<MonthlyMissionView
				mission={mission}
				steps={steps ?? []}
				cadence={cadence}
				today={today}
				currentWeekIndex={currentWeekIndex}
				streakState={streakRes.data?.state ?? null}
				promptGoal={promptGoal}
				journalSlot={
					<>
						<p className="mt-2 mb-3 font-bold text-[#0E1420]/50 text-[10px] uppercase tracking-[0.12em]">
							Signal &amp; Noise
						</p>
						<JournalCard entryDate={today} initialEntry={signal.lastJournal} />
					</>
				}
			/>
		</div>
	);
}
