// Shared layout for every screen of the (auth) flow. Mirrors
// QuestionShell's skeleton minus the progress bar: SafeAreaView +
// KeyboardAvoidingView + scrollable body + optional back affordance.
// Single source of truth for safe area + keyboard behavior, so each
// screen file stays focused on its own content.

import { Button } from "@north/native-ui";
import { getTokens } from "@north/tokens";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import {
	KeyboardAvoidingView,
	Platform,
	Pressable,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";

export type AuthShellProps = {
	children: ReactNode;
	canGoBack?: boolean;
	centered?: boolean; // welcome screen wants vertical centering
	footer?: ReactNode; // optional sticky footer (terms, links)
};

export function AuthShell({
	children,
	canGoBack = false,
	centered = false,
	footer,
}: AuthShellProps) {
	const { p, t, d } = getTokens("warm", "humanist", "calm");
	const router = useRouter();
	const showBack = canGoBack && router.canGoBack();

	return (
		<SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={styles.flex}
			>
				<View
					style={[
						styles.header,
						{ paddingHorizontal: d.scrnPad, paddingTop: 4 },
					]}
				>
					{showBack ? (
						<Pressable
							onPress={() => router.back()}
							hitSlop={12}
							accessibilityRole="button"
							accessibilityLabel="Go back"
							style={({ pressed }) => [
								styles.backBtn,
								{ opacity: pressed ? 0.6 : 1 },
							]}
						>
							<Text
								style={[
									styles.backLabel,
									{ color: p.inkMid, fontFamily: t.ui },
								]}
							>
								← Back
							</Text>
						</Pressable>
					) : (
						<View style={styles.backBtn} />
					)}
				</View>

				<ScrollView
					contentContainerStyle={[
						styles.body,
						{
							paddingHorizontal: d.scrnPad,
							gap: d.gapLg,
							justifyContent: centered ? "center" : "flex-start",
							flexGrow: 1,
						},
					]}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					{children}
				</ScrollView>

				{footer ? (
					<View
						style={[
							styles.footer,
							{ paddingHorizontal: d.scrnPad, paddingBottom: d.gap },
						]}
					>
						{footer}
					</View>
				) : null}
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

// Re-export Button so screens can build inline footers without an extra
// import chain.
export { Button };

const styles = StyleSheet.create({
	safe: { flex: 1 },
	flex: { flex: 1 },
	header: { height: 44, justifyContent: "center" },
	backBtn: { minWidth: 88, minHeight: 44, justifyContent: "center" },
	backLabel: { fontSize: 15, fontWeight: "500" },
	body: { paddingTop: 12, paddingBottom: 28 },
	footer: { paddingTop: 8 },
});
