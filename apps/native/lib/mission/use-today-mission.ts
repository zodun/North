import { useCallback, useEffect, useState } from "react";

import { supabase, useSession } from "../auth-client";

export type MissionTask = {
	id: string;
	label: string;
	kind: string | null;
	estimate_label: string | null;
	done: boolean;
	abandon_count: number;
};

export type TodayMission = {
	id: string;
	title: string | null;
	intent: string | null;
	tasks: MissionTask[];
};

// Current AST date (UTC-4, no DST). Matches todayInAST() in the Edge Function.
export function todayInAST(): string {
	const astMs = Date.now() - 4 * 60 * 60 * 1000;
	return new Date(astMs).toISOString().slice(0, 10);
}

// Fetches today's mission and tasks for the authenticated user.
// Returns undefined while loading, null when no mission exists yet
// (user joined between cron runs — Edge Function will assign one at 08:00 UTC).
export function useTodayMission() {
	const { data: session } = useSession();
	const [mission, setMission] = useState<TodayMission | null | undefined>(
		undefined,
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		if (!session) return;
		setError(null);
		const today = todayInAST();

		const { data, error: err } = await supabase
			.from("missions")
			.select(
				"id, title, intent, user_mission_tasks(id, label, kind, estimate_label, done, abandon_count)",
			)
			.eq("user_id", session.user.id)
			.eq("mission_date", today)
			.maybeSingle();

		if (err) {
			setError(err.message);
		} else if (!data) {
			setMission(null);
		} else {
			setMission({
				id: data.id,
				title: data.title,
				intent: data.intent,
				// Preserve server insertion order (tasks were inserted as a batch).
				tasks: (data.user_mission_tasks as MissionTask[] | null)?.slice() ?? [],
			});
		}
		setLoading(false);
	}, [session]);

	useEffect(() => {
		setLoading(true);
		void refresh();
	}, [refresh]);

	return { mission, loading, error, refresh };
}
