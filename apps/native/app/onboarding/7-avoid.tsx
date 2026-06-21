// Q7 — biggest distraction (optional free text). Maps to
// profiles.avoid_note + onboarding_responses.biggest_distraction.

import { Input } from "@north/native-ui";
import { getTokens } from "@north/tokens";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { QuestionShell } from "@/components/onboarding/QuestionShell";
import { ONBOARDING_QUESTIONS } from "@/lib/onboarding/questions";
import { useOnboardingState } from "@/lib/onboarding/use-onboarding-state";

const Q = ONBOARDING_QUESTIONS[6];

export default function OnboardingAvoidScreen() {
	const router = useRouter();
	const { p, t } = getTokens("warm", "humanist", "calm");
	const { answers, loaded, saveAvoid } = useOnboardingState();
	const [value, setValue] = useState("");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (loaded && answers.avoid) setValue(answers.avoid);
	}, [loaded, answers.avoid]);

	const nextLabel = value.trim().length === 0 ? "Skip" : "Continue";

	return (
		<QuestionShell
			index={6}
			prompt={Q.prompt}
			sub={Q.sub}
			nextLabel={nextLabel}
			nextLoading={saving}
			onNext={async () => {
				setSaving(true);
				try {
					await saveAvoid(value);
					router.push("/onboarding/8-purpose");
				} finally {
					setSaving(false);
				}
			}}
		>
			<Input
				p={p}
				t={t}
				value={value}
				onChangeText={setValue}
				placeholder={Q.placeholder}
				multiline
				numberOfLines={3}
				autoCapitalize="sentences"
				returnKeyType="done"
			/>
		</QuestionShell>
	);
}
