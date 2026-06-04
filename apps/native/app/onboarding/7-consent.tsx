// Q7 — consent + completion. The footer's "I agree" button calls the
// complete_onboarding RPC, which atomically creates the starter
// mission + 3 tasks, weekly pulse, baseline_endpoint_responses, and
// flips profile.onboarded_at + consent_given_at.

import { Button, Icon } from "@north/native-ui";
import { getTokens } from "@north/tokens";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { QuestionShell } from "@/components/onboarding/QuestionShell";
import { completeOnboarding } from "@/lib/onboarding/complete-onboarding";
import {
	CONSENT_BULLETS,
	CONSENT_DISCLOSURE,
	ONBOARDING_QUESTIONS,
} from "@/lib/onboarding/questions";
import { useOnboardingState } from "@/lib/onboarding/use-onboarding-state";

const Q = ONBOARDING_QUESTIONS[6];

export default function OnboardingConsentScreen() {
	const router = useRouter();
	const { p, t, d } = getTokens("warm", "humanist", "calm");
	const { answers } = useOnboardingState();
	const params = useLocalSearchParams<{ baseline?: string }>();
	const baseline =
		params.baseline != null ? Number(params.baseline) : answers.baseline;
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const canSubmit = answers.focus.length > 0 && baseline != null && !submitting;

	console.log(
		"[7-consent] focus:",
		answers.focus,
		"baseline:",
		baseline,
		"canSubmit:",
		canSubmit,
	);

	return (
		<QuestionShell
			index={6}
			prompt={Q.prompt}
			sub={Q.sub}
			onNext={() => {}}
			footer={
				<View style={{ gap: d.gap }}>
					{error ? (
						<Text style={[styles.error, { color: p.warn, fontFamily: t.ui }]}>
							{error}
						</Text>
					) : null}
					{!canSubmit && !submitting ? (
						<Text
							style={{
								color: p.inkDim,
								fontFamily: t.ui,
								fontSize: 11,
								textAlign: "center",
							}}
						>
							{`focus:${answers.focus.length} baseline:${baseline ?? "null"}`}
						</Text>
					) : null}
					<Button
						p={p}
						t={t}
						variant="primary"
						disabled={!canSubmit}
						loading={submitting}
						onPress={async () => {
							if (!canSubmit || baseline == null) return;
							setSubmitting(true);
							setError(null);
							try {
								console.log("[7-consent] calling completeOnboarding...");
								await completeOnboarding({
									focusAreaIds: answers.focus,
									pulseScore: baseline,
								});
								console.log("[7-consent] RPC success, navigating...");
								router.replace("/(drawer)/(tabs)/for-you");
							} catch (e) {
								const msg =
									e instanceof Error
										? e.message
										: "Something went wrong. Please try again.";
								console.error("[7-consent] error:", msg);
								setError(msg);
							} finally {
								setSubmitting(false);
							}
						}}
					>
						I agree, take me in
					</Button>
				</View>
			}
		>
			<View style={{ gap: d.gapLg }}>
				<View style={{ gap: d.gap }}>
					{CONSENT_BULLETS.map((bullet) => (
						<View key={bullet} style={styles.bulletRow}>
							<Icon name="check" size={20} color={p.accent} />
							<Text style={[styles.bullet, { color: p.ink, fontFamily: t.ui }]}>
								{bullet}
							</Text>
						</View>
					))}
				</View>
				<Text
					style={[styles.disclosure, { color: p.inkDim, fontFamily: t.ui }]}
				>
					{CONSENT_DISCLOSURE}
				</Text>
			</View>
		</QuestionShell>
	);
}

const styles = StyleSheet.create({
	bulletRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
	bullet: { flex: 1, fontSize: 15, lineHeight: 22 },
	disclosure: { fontSize: 12, lineHeight: 18 },
	error: { fontSize: 13 },
});
