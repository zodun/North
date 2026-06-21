// Q4 — career stage (single-select). Maps to profiles.career_stage.

import { useRouter } from "expo-router";
import { useState } from "react";

import { CareerSelector } from "@/components/onboarding/CareerSelector";
import { QuestionShell } from "@/components/onboarding/QuestionShell";
import { ONBOARDING_QUESTIONS } from "@/lib/onboarding/questions";
import { useOnboardingState } from "@/lib/onboarding/use-onboarding-state";

const Q = ONBOARDING_QUESTIONS[3];

export default function OnboardingCareerScreen() {
	const router = useRouter();
	const { answers, saveCareerStage } = useOnboardingState();
	const [saving, setSaving] = useState(false);

	return (
		<QuestionShell
			index={3}
			prompt={Q.prompt}
			sub={Q.sub}
			nextDisabled={!answers.careerStage}
			nextLoading={saving}
			onNext={async () => {
				if (!answers.careerStage) return;
				setSaving(true);
				try {
					router.push("/onboarding/5-location");
				} finally {
					setSaving(false);
				}
			}}
		>
			<CareerSelector
				value={answers.careerStage}
				onChange={(next) => {
					void saveCareerStage(next);
				}}
			/>
		</QuestionShell>
	);
}
