// Q1 — display name.

import { Input } from "@north/native-ui";
import { getNorthTokens } from "@north/tokens";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { QuestionShell } from "@/components/onboarding/QuestionShell";
import { useSession } from "@/lib/auth-client";
import { ONBOARDING_QUESTIONS } from "@/lib/onboarding/questions";
import { useOnboardingState } from "@/lib/onboarding/use-onboarding-state";

const Q = ONBOARDING_QUESTIONS[0];

export default function OnboardingNameScreen() {
	const router = useRouter();
	const { p, t } = getNorthTokens();
	const { answers, loaded, saveName } = useOnboardingState();
	const { data: session } = useSession();
	const [value, setValue] = useState("");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!loaded) return;
		if (answers.name) {
			setValue(answers.name);
			return;
		}
		// For Google/Apple signups, prefill from OAuth user_metadata so
		// the user sees their name already filled in. They can edit.
		const meta = session?.user.user_metadata ?? {};
		const oauthName =
			(meta.display_name as string | undefined) ??
			(meta.full_name as string | undefined) ??
			(meta.name as string | undefined) ??
			"";
		if (oauthName) setValue(oauthName);
	}, [loaded, answers.name, session]);

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
