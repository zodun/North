// Habits: small recurring rituals with one check circle per day of the
// current (Monday-start) week.
//
// Real mode: `habits` + `habit_checks` tables (20260731T162412 migration),
// owner-only RLS. Toggles are optimistic; a failed write reverts.
// Bypass: seeded fixtures + module-level store so state survives remounts.

import { useCallback, useEffect, useRef, useState } from "react";

import { supabase, useSession } from "../auth-client";
import { useAuthBypass } from "../dev-bypass";
import {
	addMockHabit,
	astDateKey,
	checkKey,
	currentWeekDays,
	getMockHabitChecks,
	getMockHabits,
	toggleMockHabitCheck,
} from "./fixtures";

export type Habit = { id: string; name: string };

export function useHabits() {
	const { data: session } = useSession();
	const bypass = useAuthBypass();
	const [habits, setHabits] = useState<Habit[]>([]);
	/** Membership = checked, keys from checkKey(habitId, day). */
	const [checks, setChecks] = useState<Set<string>>(new Set());
	const [loading, setLoading] = useState(true);
	const checksRef = useRef(checks);
	useEffect(() => {
		checksRef.current = checks;
	}, [checks]);

	const weekDays = currentWeekDays();
	const today = astDateKey(0);

	const refresh = useCallback(async () => {
		if (bypass) {
			setHabits(getMockHabits());
			setChecks(getMockHabitChecks());
			setLoading(false);
			return;
		}
		if (!session) return;
		const week = currentWeekDays();
		const [habitRes, checkRes] = await Promise.all([
			supabase
				.from("habits")
				.select("id, name")
				.eq("user_id", session.user.id)
				.is("archived_at", null)
				.order("created_at", { ascending: true }),
			supabase
				.from("habit_checks")
				.select("habit_id, day")
				.eq("user_id", session.user.id)
				.gte("day", week[0] ?? "")
				.lte("day", week[6] ?? ""),
		]);

		// Degrade quietly: the section just shows its empty state.
		if (!habitRes.error && habitRes.data) {
			setHabits(habitRes.data as Habit[]);
		}
		if (!checkRes.error && checkRes.data) {
			setChecks(
				new Set(
					(checkRes.data as { habit_id: string; day: string }[]).map((r) =>
						checkKey(r.habit_id, r.day),
					),
				),
			);
		}
		setLoading(false);
	}, [session, bypass]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	const toggleCheck = useCallback(
		async (habitId: string, day: string) => {
			// Never mark the future.
			if (day > astDateKey(0)) return;

			const key = checkKey(habitId, day);
			const wasChecked = checksRef.current.has(key);

			// Optimistic flip.
			setChecks((prev) => {
				const next = new Set(prev);
				if (wasChecked) next.delete(key);
				else next.add(key);
				return next;
			});

			if (bypass) {
				toggleMockHabitCheck(habitId, day);
				return;
			}
			if (!session) return;

			const { error } = wasChecked
				? await supabase
						.from("habit_checks")
						.delete()
						.eq("habit_id", habitId)
						.eq("day", day)
				: await supabase
						.from("habit_checks")
						.insert({ habit_id: habitId, user_id: session.user.id, day });

			if (error) {
				// Revert on failure.
				setChecks((prev) => {
					const next = new Set(prev);
					if (wasChecked) next.add(key);
					else next.delete(key);
					return next;
				});
			}
		},
		[session, bypass],
	);

	const addHabit = useCallback(
		async (name: string): Promise<boolean> => {
			const trimmed = name.trim();
			if (!trimmed) return false;

			if (bypass) {
				addMockHabit(trimmed);
				setHabits(getMockHabits());
				return true;
			}
			if (!session) return false;

			const { data, error } = await supabase
				.from("habits")
				.insert({ user_id: session.user.id, name: trimmed })
				.select("id, name")
				.single();
			if (error || !data) return false;
			setHabits((prev) => [...prev, data as Habit]);
			return true;
		},
		[session, bypass],
	);

	return { habits, checks, weekDays, today, loading, toggleCheck, addHabit };
}
