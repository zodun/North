// Step completion with offline retry and PostHog events (MSN-04/05
// posture, carried over from the daily-task model).
//
// Optimistic-first: UI updates immediately; the monthly_mission_steps
// write retries up to 3× with backoff. On persistent failure the toggle
// reverts so state stays consistent with the server. This covers brief
// network hiccups (lift/basement) without a full offline queue.

import { usePostHog } from "posthog-react-native";
import { useCallback, useEffect, useRef, useState } from "react";

import { supabase, useSession } from "../auth-client";
import { useAuthBypass } from "../dev-bypass";
import { setMockStepDone } from "./fixtures";
import type { MissionStep } from "./use-monthly-mission";

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
	let lastErr: unknown;
	for (let i = 0; i < retries; i++) {
		try {
			return await fn();
		} catch (err) {
			lastErr = err;
			if (i < retries - 1) {
				await new Promise((r) => setTimeout(r, 400 * 2 ** i));
			}
		}
	}
	throw lastErr;
}

export function useStepCompletion(
	missionId: string | null,
	initialSteps: MissionStep[],
) {
	const { data: session } = useSession();
	const bypass = useAuthBypass();
	const posthog = usePostHog();
	const [steps, setSteps] = useState<MissionStep[]>(initialSteps);
	// Keep a ref to avoid stale-closure reads inside toggleDone.
	const stepsRef = useRef(steps);
	useEffect(() => {
		stepsRef.current = steps;
	}, [steps]);

	// Re-sync when the parent reloads (e.g., refresh after a goal re-plan).
	useEffect(() => {
		setSteps(initialSteps);
	}, [initialSteps]);

	const toggleDone = useCallback(
		async (stepId: string) => {
			const current = stepsRef.current.find((s) => s.id === stepId);
			if (!current) return;
			const newDone = !current.done;

			// Design-review bypass: toggle in memory only (fixtures keep the state
			// so it survives remounts within the session).
			if (bypass) {
				setSteps((prev) =>
					prev.map((s) => (s.id === stepId ? { ...s, done: newDone } : s)),
				);
				setMockStepDone(stepId, newDone);
				return;
			}
			if (!session || !missionId) return;

			const completedAt = newDone ? new Date().toISOString() : null;

			// Optimistic update — feels instant even on slow connections.
			setSteps((prev) =>
				prev.map((s) => (s.id === stepId ? { ...s, done: newDone } : s)),
			);

			try {
				await withRetry(async () => {
					const { error } = await supabase
						.from("monthly_mission_steps")
						.update({ done: newDone, completed_at: completedAt })
						.eq("id", stepId);
					if (error) throw new Error(error.message);
				});

				// PostHog — best-effort, never raises.
				posthog?.capture(newDone ? "step_completed" : "step_uncompleted", {
					step_id: stepId,
					mission_id: missionId,
					cadence: current.cadence,
					week_index: current.week_index,
				});
			} catch {
				// All retries failed — revert optimistic update.
				setSteps((prev) =>
					prev.map((s) => (s.id === stepId ? { ...s, done: !newDone } : s)),
				);
			}
		},
		[session, bypass, missionId, posthog],
	);

	return { steps, toggleDone };
}
