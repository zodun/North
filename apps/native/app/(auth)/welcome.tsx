// Welcome — the cold-start surface for unauthenticated users. Brand
// mark + tagline + two CTAs (Begin / I have an account). No back
// button here; this is the root of the (auth) stack.

import { Button } from "@north/native-ui";
import { getTokens } from "@north/tokens";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { AuthShell } from "@/components/auth/AuthShell";
import { BrandMark } from "@/components/auth/BrandMark";

export default function WelcomeScreen() {
	const { p, t, d } = getTokens("warm", "humanist", "calm");
	const router = useRouter();

	return (
		<AuthShell
			centered
			footer={
				<Text
					style={[styles.terms, { color: p.inkDim, fontFamily: t.ui }]}
					accessibilityRole="text"
				>
					Continuing means you accept our Terms and Privacy.
				</Text>
			}
		>
			<View style={{ gap: d.gapLg, alignItems: "stretch" }}>
				<BrandMark />

				<Text style={[styles.tagline, { color: p.inkMid, fontFamily: t.ui }]}>
					Intentional direction.{"\n"}One step at a time.
				</Text>

				<View style={{ gap: d.gap, marginTop: d.gapLg }}>
					<Button
						p={p}
						t={t}
						variant="primary"
						onPress={() => router.push("/(auth)/sign-up")}
					>
						Begin
					</Button>
					<Button
						p={p}
						t={t}
						variant="ghost"
						onPress={() => router.push("/(auth)/sign-in")}
					>
						I have an account
					</Button>
				</View>
			</View>
		</AuthShell>
	);
}

const styles = StyleSheet.create({
	tagline: {
		fontSize: 16,
		lineHeight: 24,
		textAlign: "center",
	},
	terms: {
		fontSize: 11,
		lineHeight: 16,
		textAlign: "center",
		paddingHorizontal: 24,
	},
});
