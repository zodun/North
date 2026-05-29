// Atomic completion: calls the public.complete_onboarding RPC, which
// creates the starter mission + 3 tasks, the weekly pulse row, the
// baseline_endpoint_responses row, and flips onboarded_at +
// consent_given_at on the profile. All in one Postgres transaction.

import { supabase } from "../auth-client";
import { FOCUS_AREAS } from "./questions";

export type CompleteOnboardingInput = {
	focusAreaIds: string[];
	pulseScore: number; // 1..5 conceptual
};

export async function completeOnboarding({
	focusAreaIds,
	pulseScore,
}: CompleteOnboardingInput): Promise<void> {
	const topFocusId = focusAreaIds[0];
	if (!topFocusId) {
		throw new Error(
			"at least one focus area is required to complete onboarding",
		);
	}
	const topFocusLabel =
		FOCUS_AREAS.find((f) => f.id === topFocusId)?.label ?? topFocusId;

	const { error } = await supabase.rpc("complete_onboarding", {
		p_focus_area_id: topFocusId,
		p_focus_area_label: topFocusLabel,
		p_pulse_score: pulseScore,
	});
	if (error) {
		throw new Error(error.message);
	}
}
