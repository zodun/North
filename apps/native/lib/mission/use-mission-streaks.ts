// Streak data for the Mission tab: the compact rhythm chip near the
// greeting and the month-calendar sheet both read from here.
//
// Real mode fetches ~12 weeks from the `streaks` table (same day/state
// rollup use-profile-data reads) into a date→state map. Rhythm = the
// current run of directed (2) or rest (3) days scanning back from today;
// if today hasn't rolled up yet, the run may start from yesterday.

import type { StreakState } from "@north/native-ui";
import { useCallback, useEffect, useState } from "react";

import { supabase, useSession } from "../auth-client";
import { useAuthBypass } from "../dev-bypass";
import { astDateKey, MOCK_RHYTHM_STREAK, mockStreakDays } from "./fixtures";

export type StreakDayMap = Record<string, StreakState>;

const WINDOW_DAYS = 84;

function computeRhythm(days: StreakDayMap): number {
	let n = 0;
	// Today counts if it's already directed/rest; otherwise start yesterday
	// so an in-progress day doesn't zero out a real run.
	const todayState = days[astDateKey(0)];
	let ago = todayState === 2 || todayState === 3 ? 0 : 1;
	for (; ago <= WINDOW_DAYS; ago++) {
		const state = days[astDateKey(ago)];
		if (state === 2 || state === 3) n++;
		else break;
	}
	return n;
}

export function useMissionStreaks() {
	const { data: session } = useSession();
	const bypass = useAuthBypass();
	const [days, setDays] = useState<StreakDayMap>({});
	const [loading, setLoading] = useState(true);

	const refresh = useCallback(async () => {
		// Design-review bypass: 12 weeks of believable history.
		if (bypass) {
			setDays(mockStreakDays());
			setLoading(false);
			return;
		}
		if (!session) return;

		const { data, error } = await supabase
			.from("streaks")
			.select("day, state")
			.eq("user_id", session.user.id)
			.gte("day", astDateKey(WINDOW_DAYS))
			.lte("day", astDateKey(0));

		// Degrade quietly — the chip just reads 0 and the calendar is empty.
		if (!error && data) {
			const map: StreakDayMap = {};
			for (const row of data as { day: string; state: number }[]) {
				map[row.day] = row.state as StreakState;
			}
			setDays(map);
		}
		setLoading(false);
	}, [session, bypass]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	const rhythm = bypass ? MOCK_RHYTHM_STREAK : computeRhythm(days);

	return { days, rhythm, loading, refresh };
}
