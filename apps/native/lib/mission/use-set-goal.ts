// Set-your-goal flow: the user names one measurable goal for the cycle and
// the plan-month Edge Function rewrites the mission and its 28-day step set
// around it (AI plan with a deterministic server fallback). Suggest mode
// proposes a goal from the user's onboarding without writing anything.
//
// Bypass: re-plans the fixture cycle in memory so the flow is reviewable.

import { useCallback, useState } from "react";

import { supabase, useSession } from "../auth-client";
import { useAuthBypass } from "../dev-bypass";
import { MOCK_GOAL_SUGGESTION, setMockMonthlyGoal } from "./fixtures";

export type SetGoalInput = {
	/** The user's own goal, e.g. "Ship the first version of my side project". */
	title: string;
	/** Completes "I'll know it's done when…" — the measurable finish line. */
	measure: string;
	/** The mission's cycle anchor (monthly_missions.month_start). */
	monthStart: string;
};

export type SetGoalResult = { ok: true } | { ok: false; message: string };

export function useSetGoal() {
	const { data: session } = useSession();
	const bypass = useAuthBypass();
	const [submitting, setSubmitting] = useState(false);

	// Propose a goal from focus areas + onboarding answers. Best-effort:
	// null just means the field stays empty.
	const suggest = useCallback(
		async (monthStart: string): Promise<string | null> => {
			if (bypass) return MOCK_GOAL_SUGGESTION;
			if (!session) return null;
			try {
				const { data } = await supabase.functions.invoke("plan-month", {
					body: { mode: "suggest", month_start: monthStart },
				});
				const s = data?.suggestion as { goal_title?: string } | undefined;
				return s?.goal_title?.trim() || null;
			} catch {
				return null;
			}
		},
		[session, bypass],
	);

	const setGoal = useCallback(
		async (input: SetGoalInput): Promise<SetGoalResult> => {
			const title = input.title.trim();
			const measure = input.measure.trim();
			if (!title) return { ok: false, message: "Name the goal first." };
			if (!measure) {
				return { ok: false, message: "Say how you'll know it's done." };
			}

			setSubmitting(true);
			try {
				const intent = `I'll know it's done when ${measure}`;
				if (bypass) {
					setMockMonthlyGoal(title, intent);
					return { ok: true };
				}
				if (!session) {
					return { ok: false, message: "Sign in to set a goal." };
				}

				const { data, error } = await supabase.functions.invoke("plan-month", {
					body: {
						goal_title: title,
						goal_intent: intent,
						cadence: "daily",
						month_start: input.monthStart,
					},
				});
				if (error || !data?.ok) {
					return {
						ok: false,
						message:
							(data?.error as string) ||
							error?.message ||
							"Couldn't plan your month. Check your connection and try again.",
					};
				}
				return { ok: true };
			} finally {
				setSubmitting(false);
			}
		},
		[session, bypass],
	);

	return { suggest, setGoal, submitting };
}
