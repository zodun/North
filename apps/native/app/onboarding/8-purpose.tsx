// Q8 — Builder or Explorer stance. Maps to profiles.purpose_mode.

import { useRouter } from "expo-router";
import { useState } from "react";

import { PurposeSelector } from "@/components/onboarding/PurposeSelector";
import { QuestionShell } from "@/components/onboarding/QuestionShell";
import { ONBOARDING_QUESTIONS } from "@/lib/onboarding/questions";
import { useOnboardingState } from "@/lib/onboarding/use-onboarding-state";

const Q = ONBOARDING_QUESTIONS[7];

export default function OnboardingPurposeScreen() {
	const router = useRouter();
	const { answers, savePurposeMode } = useOnboardingState();
	const [saving, setSaving] = useState(false);

	return (
		<QuestionShell
			index={7}
			prompt={Q.prompt}
			sub={Q.sub}
			nextDisabled={!answers.purposeMode}
			nextLoading={saving}
			onNext={async () => {
				if (!answers.purposeMode) return;
				setSaving(true);
				try {
					router.push("/onboarding/9-baseline");
				} finally {
					setSaving(false);
				}
			}}
		>
			<PurposeSelector
				value={answers.purposeMode}
				onChange={(next) => {
					void savePurposeMode(next);
				}}
			/>
		</QuestionShell>
	);
}
