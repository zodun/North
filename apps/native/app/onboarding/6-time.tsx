// Q6 — daily time budget (single-select). Maps to
// profiles.time_budget_label.

import { useRouter } from "expo-router";
import { useState } from "react";

import { ChoiceSelector } from "@/components/onboarding/ChoiceSelector";
import { QuestionShell } from "@/components/onboarding/QuestionShell";
import { ONBOARDING_QUESTIONS } from "@/lib/onboarding/questions";
import { useOnboardingState } from "@/lib/onboarding/use-onboarding-state";

const Q = ONBOARDING_QUESTIONS[5];

export default function OnboardingTimeScreen() {
	const router = useRouter();
	const { answers, saveTime } = useOnboardingState();
	const [saving, setSaving] = useState(false);

	return (
		<QuestionShell
			index={5}
			prompt={Q.prompt}
			sub={Q.sub}
			nextDisabled={!answers.time}
			nextLoading={saving}
			onNext={async () => {
				if (!answers.time) return;
				setSaving(true);
				try {
					router.push("/onboarding/7-avoid");
				} finally {
					setSaving(false);
				}
			}}
		>
			<ChoiceSelector
				options={Q.options ?? []}
				value={answers.time}
				onChange={(next) => {
					void saveTime(next);
				}}
			/>
		</QuestionShell>
	);
}
