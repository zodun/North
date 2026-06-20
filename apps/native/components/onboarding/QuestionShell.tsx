// Shared layout for every screen of the 7-step onboarding flow.
// Renders the progress bar, prompt + sub-copy, the question slot
// supplied by the caller, and a Back / Next footer. Owns the safe
// area + keyboard avoidance so each screen file stays focused on its
// own input.

import { Button, ProgressBar } from "@north/native-ui";
import { getTokens } from "@north/tokens";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TOTAL_QUESTIONS } from "@/lib/onboarding/questions";

export type QuestionShellProps = {
	index: number; // 0..6
	prompt: string;
	sub: string;
	children: ReactNode;
	onNext: () => void | Promise<void>;
	nextLabel?: string;
	nextDisabled?: boolean;
	nextLoading?: boolean;
	canGoBack?: boolean;
	footer?: ReactNode; // overrides Back/Next when supplied (e.g. consent)
};

export function QuestionShell({
	index,
	prompt,
	sub,
	children,
	onNext,
	nextLabel = "Continue",
	nextDisabled = false,
	nextLoading = false,
	canGoBack = true,
	footer,
}: QuestionShellProps) {
	const { p, t, d } = getTokens("warm", "humanist", "calm");
	const router = useRouter();
	const progress = (index + 1) / TOTAL_QUESTIONS;

	return (
		<SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={styles.flex}
			>
				<View
					style={[
						styles.header,
						{ paddingHorizontal: d.scrnPad, paddingTop: 8 },
					]}
				>
					<View style={styles.progressRow}>
						<ProgressBar p={p} value={progress} height={4} />
						<Text style={[styles.step, { color: p.inkDim, fontFamily: t.ui }]}>
							{index + 1} / {TOTAL_QUESTIONS}
						</Text>
					</View>
				</View>

				<ScrollView
					contentContainerStyle={[
						styles.body,
						{ paddingHorizontal: d.scrnPad, gap: d.gapLg },
					]}
					keyboardShouldPersistTaps="handled"
				>
					<View style={{ gap: d.gap }}>
						<Text
							style={[
								styles.prompt,
								{
									color: p.ink,
									fontFamily: t.display,
									fontWeight: String(t.displayWeight) as "400",
									fontStyle: t.editorialItalic ? "italic" : "normal",
								},
							]}
						>
							{prompt}
						</Text>
						<Text style={[styles.sub, { color: p.inkMid, fontFamily: t.ui }]}>
							{sub}
						</Text>
					</View>

					<View style={styles.slot}>{children}</View>
				</ScrollView>

				<View
					style={[
						styles.footer,
						{
							paddingHorizontal: d.scrnPad,
							paddingBottom: d.gap,
							gap: d.gap,
						},
					]}
				>
					{footer ?? (
						<View style={styles.footerRow}>
							{canGoBack && router.canGoBack() ? (
								<View style={styles.backBtn}>
									<Button
										p={p}
										t={t}
										variant="ghost"
										onPress={() => router.back()}
									>
										Back
									</Button>
								</View>
							) : (
								<View style={styles.backBtn} />
							)}
							<View style={styles.nextBtn}>
								<Button
									p={p}
									t={t}
									variant="primary"
									disabled={nextDisabled}
									loading={nextLoading}
									onPress={() => {
										void onNext();
									}}
								>
									{nextLabel}
								</Button>
							</View>
						</View>
					)}
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1 },
	flex: { flex: 1 },
	header: { gap: 12 },
	progressRow: { gap: 6 },
	step: { fontSize: 11, textAlign: "right" },
	body: { flexGrow: 1, paddingTop: 28, paddingBottom: 28 },
	prompt: { fontSize: 28, lineHeight: 34 },
	sub: { fontSize: 15, lineHeight: 22 },
	slot: { flexShrink: 1 },
	footer: { paddingTop: 12 },
	footerRow: { flexDirection: "row", gap: 12, alignItems: "center" },
	backBtn: { minWidth: 88 },
	nextBtn: { flex: 1 },
});
