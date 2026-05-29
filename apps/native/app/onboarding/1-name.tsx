// Q1 — display name.

import { Input } from "@north/native-ui";
import { getTokens } from "@north/tokens";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { QuestionShell } from "@/components/onboarding/QuestionShell";
import { ONBOARDING_QUESTIONS } from "@/lib/onboarding/questions";
import { useOnboardingState } from "@/lib/onboarding/use-onboarding-state";

const Q = ONBOARDING_QUESTIONS[0];

export default function OnboardingNameScreen() {
	const router = useRouter();
	const { p, t } = getTokens("warm", "humanist", "calm");
	const { answers, loaded, saveName } = useOnboardingState();
	const [value, setValue] = useState("");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (loaded && answers.name) setValue(answers.name);
	}, [loaded, answers.name]);

	const trimmed = value.trim();
	const canContinue = trimmed.length > 0;

	return (
		<QuestionShell
			index={0}
			prompt={Q.prompt}
			sub={Q.sub}
			nextDisabled={!canContinue}
			nextLoading={saving}
			canGoBack={false}
			onNext={async () => {
				if (!canContinue) return;
				setSaving(true);
				try {
					await saveName(trimmed);
					router.push("/onboarding/2-season");
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
				autoFocus
				autoCapitalize="words"
				returnKeyType="next"
			/>
		</QuestionShell>
	);
}
