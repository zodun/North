import { Button, Column, Text as ExpoUIText, Host } from "@expo/ui";
import { ScrollView, StyleSheet, View } from "react-native";

import { Container } from "@/components/container";
import { SignIn } from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";
import { supabase, useSession } from "@/lib/auth-client";
import { NAV_THEME } from "@/lib/constants";
import { useRegisterPushToken } from "@/lib/notifications";
import { useColorScheme } from "@/lib/use-color-scheme";

export default function Home() {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;
	const { data: session } = useSession();
	// Register the device's FCM/APNs push token once per signed-in
	// session (DEC-21). No-op when there's no session, on simulators,
	// or when the user denies the permission prompt.
	useRegisterPushToken();
	const displayName =
		(session?.user.user_metadata?.display_name as string | undefined) ?? null;

	return (
		<Container>
			<ScrollView
				style={styles.scrollView}
				contentInsetAdjustmentBehavior="never"
			>
				<View style={styles.content}>
					<Host style={styles.titleHost}>
						<ExpoUIText
							textStyle={{
								color: theme.text,
								fontSize: 24,
								fontWeight: "bold",
								textAlign: "center",
							}}
						>
							North
						</ExpoUIText>
					</Host>

					{session?.user ? (
						<View
							style={[
								styles.userCard,
								{ backgroundColor: theme.card, borderColor: theme.border },
							]}
						>
							<Host
								style={styles.userHeader}
								matchContents={{ vertical: true }}
							>
								<Column spacing={8}>
									<ExpoUIText textStyle={{ color: theme.text, fontSize: 16 }}>
										{`Welcome${displayName ? `, ${displayName}` : ""}`}
									</ExpoUIText>
									<ExpoUIText
										textStyle={{ color: theme.text, fontSize: 14 }}
										style={{ opacity: 0.7 }}
									>
										{session.user.email ?? ""}
									</ExpoUIText>
								</Column>
							</Host>
							<Host matchContents={{ vertical: true }}>
								<Button
									label="Sign out"
									variant="outlined"
									onPress={() => {
										void supabase.auth.signOut();
									}}
								/>
							</Host>
						</View>
					) : (
						<>
							<SignIn />
							<SignUp />
						</>
					)}
				</View>
			</ScrollView>
		</Container>
	);
}

const styles = StyleSheet.create({
	scrollView: { flex: 1 },
	content: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 32 },
	titleHost: { alignSelf: "stretch", height: 34, marginBottom: 24 },
	userCard: { marginBottom: 16, padding: 16, borderWidth: 1, borderRadius: 16 },
	userHeader: { marginBottom: 8 },
});
