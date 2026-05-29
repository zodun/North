// Q3 — focus areas (multi-select, max 3). Maps to user_focus_areas
// rows + a comma-joined summary in onboarding_responses.desired_future.

import { useRouter } from "expo-router";
import { useState } from "react";

import { FocusMultiSelect } from "@/components/onboarding/FocusMultiSelect";
import { QuestionShell } from "@/components/onboarding/QuestionShell";
import { ONBOARDING_QUESTIONS } from "@/lib/onboarding/questions";
import { useOnboardingState } from "@/lib/onboarding/use-onboarding-state";

const Q = ONBOARDING_QUESTIONS[2];

export default function OnboardingFocusScreen() {
	const router = useRouter();
	const { answers, saveFocus } = useOnboardingState();
	const [saving, setSaving] = useState(false);

	return (
		<QuestionShell
			index={2}
			prompt={Q.prompt}
			sub={Q.sub}
			nextDisabled={answers.focus.length === 0}
			nextLoading={saving}
			onNext={async () => {
				if (answers.focus.length === 0) return;
				setSaving(true);
				try {
					router.push("/onboarding/4-time");
				} finally {
					setSaving(false);
				}
			}}
		>
			<FocusMultiSelect
				value={answers.focus}
				onChange={(next) => {
					void saveFocus(next);
				}}
			/>
		</QuestionShell>
	);
}
