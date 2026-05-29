// Authenticated home. The (auth) flow owns sign-in/sign-up — this
// surface only renders for fully-onboarded users now.

import { Button, Card } from "@north/native-ui";
import { getTokens } from "@north/tokens";
import {
	Alert,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";

import { BrandMark } from "@/components/auth/BrandMark";
import { supabase, useSession } from "@/lib/auth-client";
import { useRegisterPushToken } from "@/lib/notifications";

export default function Home() {
	const { p, t, d } = getTokens("warm", "humanist", "calm");
	const { data: session } = useSession();
	// Register the device's FCM/APNs push token once per signed-in
	// session (DEC-21). No-op when there's no session, on simulators,
	// or when the user denies the permission prompt.
	useRegisterPushToken();

	const displayName =
		(session?.user.user_metadata?.display_name as string | undefined) ?? null;
	const email = session?.user.email ?? "";

	const confirmSignOut = () => {
		Alert.alert(
			"Sign out?",
			"You can sign back in any time.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Sign out",
					style: "destructive",
					onPress: () => {
						void supabase.auth.signOut();
					},
				},
			],
			{ cancelable: true },
		);
	};

	return (
		<SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]}>
			<ScrollView
				style={styles.flex}
				contentContainerStyle={[
					styles.content,
					{ paddingHorizontal: d.scrnPad, gap: d.gapLg },
				]}
			>
				<View style={{ alignItems: "center", paddingTop: 8 }}>
					<BrandMark size="sm" />
				</View>

				<Card p={p} padding={d.pad}>
					<View style={{ gap: 4 }}>
						<Text
							style={[
								styles.greeting,
								{
									color: p.ink,
									fontFamily: t.display,
									fontWeight: String(t.displayWeight) as "400",
								},
							]}
						>
							{`Welcome${displayName ? `, ${displayName}` : ""}.`}
						</Text>
						{email ? (
							<Text
								style={[styles.email, { color: p.inkDim, fontFamily: t.ui }]}
							>
								{email}
							</Text>
						) : null}
					</View>
				</Card>

				<View style={{ gap: d.gap }}>
					<Button p={p} t={t} variant="outline" onPress={confirmSignOut}>
						Sign out
					</Button>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1 },
	flex: { flex: 1 },
	content: { paddingTop: 28, paddingBottom: 32 },
	greeting: { fontSize: 24, lineHeight: 30, letterSpacing: -0.3 },
	email: { fontSize: 14 },
});
