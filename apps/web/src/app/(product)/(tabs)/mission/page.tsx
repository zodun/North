import type { Metadata } from "next";
import { getServerSupabase } from "@/lib/supabase-server";
import { MissionView } from "./mission-view";

export const metadata: Metadata = { title: "Mission" };

export default async function MissionPage() {
	const supabase = await getServerSupabase();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return (
			<div className="flex h-full items-center justify-center p-8 text-center">
				<p className="text-sm text-white/40">Sign in to see your mission.</p>
			</div>
		);
	}

	const today = new Date().toISOString().slice(0, 10);

	const { data: mission } = await supabase
		.from("missions")
		.select("id, title, intent, mission_date")
		.eq("user_id", user.id)
		.eq("mission_date", today)
		.single();

	const { data: tasks } = mission
		? await supabase
				.from("user_mission_tasks")
				.select("id, label, kind, estimate_label, done")
				.eq("mission_id", mission.id)
				.order("created_at")
		: { data: [] };

	const { data: streakRow } = await supabase
		.from("streaks")
		.select("state")
		.eq("user_id", user.id)
		.eq("day", today)
		.single();

	return (
		<MissionView
			mission={mission ?? null}
			tasks={tasks ?? []}
			streakState={streakRow?.state ?? null}
		/>
	);
}
