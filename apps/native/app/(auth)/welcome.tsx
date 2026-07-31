// Welcome — the cold-start surface for unauthenticated users. It renders
// the same NightScene as the launch overlay, so the splash design IS the
// first screen: the overlay's progress bar fades out and these CTAs rise
// in over an identical scene. No back button here; this is the root of
// the (auth) stack.

import { Button } from "@north/native-ui";
import { getNorthTokens } from "@north/tokens";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

import { DevSkip } from "@/components/auth/DevSkip";
import {
	NIGHT_INK,
	NIGHT_MUTED,
	NightScene,
} from "@/components/launch/NightScene";

export default function WelcomeScreen() {
	const { p, t, d } = getNorthTokens();
	const router = useRouter();

	// The scene is night; the shared palette is daylight. Lift the ghost
	// button's text to night ink so it stays legible on the dark ground.
	const nightP = { ...p, inkMid: NIGHT_INK };

	return (
		<>
			{/* The one night surface in a daylight app. */}
			<StatusBar style="light" />
			<NightScene
				footer={
					<View style={{ gap: d.gap }}>
						<Button
							p={p}
							t={t}
							variant="primary"
							onPress={() => router.push("/(auth)/intro")}
						>
							Let's Begin
						</Button>
						<Button
							p={nightP}
							t={t}
							variant="ghost"
							onPress={() => router.push("/(auth)/sign-in")}
						>
							I have an account
						</Button>
						<DevSkip color={NIGHT_MUTED} />
						<Text
							style={[styles.terms, { fontFamily: t.ui }]}
							accessibilityRole="text"
						>
							Continuing means you accept our Terms and Privacy.
						</Text>
					</View>
				}
			/>
		</>
	);
}

const styles = StyleSheet.create({
	terms: {
		color: NIGHT_MUTED,
		fontSize: 11,
		lineHeight: 16,
		textAlign: "center",
		paddingHorizontal: 24,
		marginTop: 4,
	},
});
