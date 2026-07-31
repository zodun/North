// Q9 — Layer 1 weekly pulse (1..5). Held in memory; the value is
// flushed atomically by complete_onboarding() at Q10.

import { ScaleSelector } from "@north/native-ui";
import { getNorthTokens } from "@north/tokens";
import { useRouter } from "expo-router";

import { QuestionShell } from "@/components/onboarding/QuestionShell";
import {
	BASELINE_SCALE_LABELS,
	ONBOARDING_QUESTIONS,
} from "@/lib/onboarding/questions";
import { useOnboardingState } from "@/lib/onboarding/use-onboarding-state";

const Q = ONBOARDING_QUESTIONS[8];

export default function OnboardingBaselineScreen() {
	const router = useRouter();
	const { p, t } = getNorthTokens();
	const { answers, setBaseline } = useOnboardingState();

	return (
		<QuestionShell
			index={8}
			prompt={Q.prompt}
			sub={Q.sub}
			nextDisabled={answers.baseline == null}
			onNext={() => {
				if (answers.baseline == null) return;
				router.push({
					pathname: "/onboarding/10-consent",
					params: { baseline: answers.baseline },
				});
			}}
		>
			<ScaleSelector
				p={p}
				t={t}
				value={answers.baseline}
				onChange={setBaseline}
				labels={BASELINE_SCALE_LABELS}
			/>
		</QuestionShell>
	);
}
