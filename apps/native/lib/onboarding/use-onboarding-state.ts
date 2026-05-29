// Per-question persistence for the 7-screen onboarding flow.
//
// Loads the current user's accumulated answers from `profiles`,
// `onboarding_responses`, and `user_focus_areas` into one normalised
// shape, and exposes per-question save functions. Saves UPSERT to the
// matching table(s) so the resume-if-interrupted path (ONB-03) can
// read where the user left off across kill/relaunch.
//
// Q6 (baseline pulse) deliberately lives in client state — it's
// flushed atomically by complete-onboarding.ts at the end of Q7 so the
// weekly_pulses + baseline_endpoint_responses rows land together.

import { useCallback, useEffect, useState } from "react";

import { supabase, useSession } from "../auth-client";
import { FOCUS_AREAS } from "./questions";

export type OnboardingAnswers = {
	name: string | null;
	season: string | null;
	focus: string[];
	time: string | null;
	avoid: string | null;
	baseline: number | null;
};

const emptyAnswers: OnboardingAnswers = {
	name: null,
	season: null,
	focus: [],
	time: null,
	avoid: null,
	baseline: null,
};

export function useOnboardingState() {
	const { data: session } = useSession();
	const userId = session?.user.id ?? null;
	const [answers, setAnswers] = useState<OnboardingAnswers>(emptyAnswers);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		if (!userId) {
			setAnswers(emptyAnswers);
			setLoaded(false);
			return;
		}
		let cancelled = false;
		void (async () => {
			const [profileRes, respRes, ufaRes] = await Promise.all([
				supabase
					.from("profiles")
					.select("display_name, season_label, time_budget_label, avoid_note")
					.eq("user_id", userId)
					.maybeSingle(),
				supabase
					.from("onboarding_responses")
					.select("what_feels_missing, biggest_distraction")
					.eq("user_id", userId)
					.maybeSingle(),
				supabase
					.from("user_focus_areas")
					.select("focus_area_id")
					.eq("user_id", userId),
			]);
			if (cancelled) return;
			const profile = profileRes.data;
			const responses = respRes.data;
			const focusRows = ufaRes.data ?? [];
			setAnswers({
				name: profile?.display_name ?? null,
				season: profile?.season_label ?? responses?.what_feels_missing ?? null,
				focus: focusRows.map((r) => r.focus_area_id as string),
				time: profile?.time_budget_label ?? null,
				avoid: profile?.avoid_note ?? responses?.biggest_distraction ?? null,
				baseline: null,
			});
			setLoaded(true);
		})();
		return () => {
			cancelled = true;
		};
	}, [userId]);

	const saveName = useCallback(
		async (name: string) => {
			if (!userId) return;
			await supabase
				.from("profiles")
				.update({ display_name: name, updated_at: new Date().toISOString() })
				.eq("user_id", userId);
			setAnswers((prev) => ({ ...prev, name }));
		},
		[userId],
	);

	const saveSeason = useCallback(
		async (season: string) => {
			if (!userId) return;
			await Promise.all([
				supabase
					.from("profiles")
					.update({
						season_label: season,
						updated_at: new Date().toISOString(),
					})
					.eq("user_id", userId),
				supabase
					.from("onboarding_responses")
					.upsert(
						{ user_id: userId, what_feels_missing: season },
						{ onConflict: "user_id" },
					),
			]);
			setAnswers((prev) => ({ ...prev, season }));
		},
		[userId],
	);

	const saveFocus = useCallback(
		async (focus: string[]) => {
			if (!userId) return;
			// Replace the selection set: delete current rows, insert new.
			await supabase.from("user_focus_areas").delete().eq("user_id", userId);
			if (focus.length > 0) {
				await supabase
					.from("user_focus_areas")
					.insert(
						focus.map((focus_area_id) => ({ user_id: userId, focus_area_id })),
					);
			}
			// Stash a human-readable summary in onboarding_responses for
			// future mission generation (FR-ONB-03).
			const summary = focus
				.map((id) => FOCUS_AREAS.find((f) => f.id === id)?.label ?? id)
				.join(", ");
			await supabase
				.from("onboarding_responses")
				.upsert(
					{ user_id: userId, desired_future: summary || null },
					{ onConflict: "user_id" },
				);
			setAnswers((prev) => ({ ...prev, focus }));
		},
		[userId],
	);

	const saveTime = useCallback(
		async (time: string) => {
			if (!userId) return;
			await supabase
				.from("profiles")
				.update({
					time_budget_label: time,
					updated_at: new Date().toISOString(),
				})
				.eq("user_id", userId);
			setAnswers((prev) => ({ ...prev, time }));
		},
		[userId],
	);

	const saveAvoid = useCallback(
		async (avoid: string) => {
			if (!userId) return;
			const trimmed = avoid.trim();
			const value = trimmed.length === 0 ? null : trimmed;
			await Promise.all([
				supabase
					.from("profiles")
					.update({
						avoid_note: value,
						updated_at: new Date().toISOString(),
					})
					.eq("user_id", userId),
				supabase
					.from("onboarding_responses")
					.upsert(
						{ user_id: userId, biggest_distraction: value },
						{ onConflict: "user_id" },
					),
			]);
			setAnswers((prev) => ({ ...prev, avoid: value }));
		},
		[userId],
	);

	const setBaseline = useCallback((baseline: number) => {
		setAnswers((prev) => ({ ...prev, baseline }));
	}, []);

	return {
		answers,
		loaded,
		userId,
		saveName,
		saveSeason,
		saveFocus,
		saveTime,
		saveAvoid,
		setBaseline,
	};
}

// Returns the index of the first question whose stored value is empty.
// Used by the onboarding stack's resume logic.
export function firstIncompleteIndex(answers: OnboardingAnswers): number {
	if (!answers.name) return 0;
	if (!answers.season) return 1;
	if (answers.focus.length === 0) return 2;
	if (!answers.time) return 3;
	// Q5 is optional — always require an explicit advance, never auto-skip past.
	// Q6 (baseline) lives in memory; resume always lands on it after Q5.
	// Q7 (consent) is the terminal screen.
	return 4;
}
