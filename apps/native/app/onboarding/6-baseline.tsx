// Q6 — Layer 1 weekly pulse (1..5). Held in memory; the value is
// flushed atomically by complete_onboarding() at Q7.

import { ScaleSelector } from "@north/native-ui";
import { getTokens } from "@north/tokens";
import { useRouter } from "expo-router";

import { QuestionShell } from "@/components/onboarding/QuestionShell";
import {
	BASELINE_SCALE_LABELS,
	ONBOARDING_QUESTIONS,
} from "@/lib/onboarding/questions";
import { useOnboardingState } from "@/lib/onboarding/use-onboarding-state";

const Q = ONBOARDING_QUESTIONS[5];

export default function OnboardingBaselineScreen() {
	const router = useRouter();
	const { p, t } = getTokens("warm", "humanist", "calm");
	const { answers, setBaseline } = useOnboardingState();

	return (
		<QuestionShell
			index={5}
			prompt={Q.prompt}
			sub={Q.sub}
			nextDisabled={answers.baseline == null}
			onNext={() => {
				if (answers.baseline == null) return;
				router.push("/onboarding/7-consent");
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
