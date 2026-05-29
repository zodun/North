// Q2 — current season (single-select). Maps to profiles.season_label
// + onboarding_responses.what_feels_missing.

import { useRouter } from "expo-router";
import { useState } from "react";

import { ChoiceSelector } from "@/components/onboarding/ChoiceSelector";
import { QuestionShell } from "@/components/onboarding/QuestionShell";
import { ONBOARDING_QUESTIONS } from "@/lib/onboarding/questions";
import { useOnboardingState } from "@/lib/onboarding/use-onboarding-state";

const Q = ONBOARDING_QUESTIONS[1];

export default function OnboardingSeasonScreen() {
	const router = useRouter();
	const { answers, saveSeason } = useOnboardingState();
	const [saving, setSaving] = useState(false);

	return (
		<QuestionShell
			index={1}
			prompt={Q.prompt}
			sub={Q.sub}
			nextDisabled={!answers.season}
			nextLoading={saving}
			onNext={async () => {
				if (!answers.season) return;
				setSaving(true);
				try {
					router.push("/onboarding/3-focus");
				} finally {
					setSaving(false);
				}
			}}
		>
			<ChoiceSelector
				options={Q.options ?? []}
				value={answers.season}
				onChange={(next) => {
					void saveSeason(next);
				}}
			/>
		</QuestionShell>
	);
}
