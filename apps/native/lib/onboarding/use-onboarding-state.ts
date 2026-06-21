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
	careerStage: string | null;
	country: string | null;
	openToRemote: boolean;
	openToRelocate: boolean;
	time: string | null;
	avoid: string | null;
	purposeMode: string | null;
	baseline: number | null;
};

const emptyAnswers: OnboardingAnswers = {
	name: null,
	season: null,
	focus: [],
	careerStage: null,
	country: null,
	openToRemote: false,
	openToRelocate: false,
	time: null,
	avoid: null,
	purposeMode: null,
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
					.select(
						"display_name, season_label, time_budget_label, avoid_note, career_stage, country, open_to_remote, open_to_relocate, purpose_mode",
					)
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
				careerStage: profile?.career_stage ?? null,
				country: profile?.country ?? null,
				openToRemote: profile?.open_to_remote ?? false,
				openToRelocate: profile?.open_to_relocate ?? false,
				time: profile?.time_budget_label ?? null,
				avoid: profile?.avoid_note ?? responses?.biggest_distraction ?? null,
				purposeMode: profile?.purpose_mode ?? null,
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

	const saveCareerStage = useCallback(
		async (careerStage: string) => {
			if (!userId) return;
			await supabase
				.from("profiles")
				.update({
					career_stage: careerStage,
					updated_at: new Date().toISOString(),
				})
				.eq("user_id", userId);
			setAnswers((prev) => ({ ...prev, careerStage }));
		},
		[userId],
	);

	const saveLocation = useCallback(
		async (country: string, openToRemote: boolean, openToRelocate: boolean) => {
			if (!userId) return;
			await supabase
				.from("profiles")
				.update({
					country: country || null,
					open_to_remote: openToRemote,
					open_to_relocate: openToRelocate,
					updated_at: new Date().toISOString(),
				})
				.eq("user_id", userId);
			setAnswers((prev) => ({
				...prev,
				country,
				openToRemote,
				openToRelocate,
			}));
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

	const savePurposeMode = useCallback(
		async (purposeMode: string) => {
			if (!userId) return;
			await supabase
				.from("profiles")
				.update({
					purpose_mode: purposeMode,
					updated_at: new Date().toISOString(),
				})
				.eq("user_id", userId);
			setAnswers((prev) => ({ ...prev, purposeMode }));
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
		saveCareerStage,
		saveLocation,
		saveTime,
		saveAvoid,
		savePurposeMode,
		setBaseline,
	};
}

// Returns the index of the first question whose stored value is empty.
// Used by the onboarding stack's resume logic.
export function firstIncompleteIndex(answers: OnboardingAnswers): number {
	if (!answers.name) return 0;
	if (!answers.season) return 1;
	if (answers.focus.length === 0) return 2;
	if (!answers.careerStage) return 3;
	if (!answers.country) return 4;
	if (!answers.time) return 5;
	// avoid (6) is optional — land there so user can skip explicitly.
	// purpose (7) is required; baseline (8) lives in memory.
	if (!answers.purposeMode) return 7;
	return 6;
}
