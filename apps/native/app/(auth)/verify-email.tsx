// Post-signup email confirmation. Only routed to from sign-up when
// Supabase has email confirmation enabled (data.session === null on
// signUp). If the confirmation link returns the user to the app, the
// auth gate routes forward automatically; the buttons here are
// recovery paths if that doesn't happen.

import { Button } from "@north/native-ui";
import { getTokens } from "@north/tokens";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AuthShell } from "@/components/auth/AuthShell";
import { supabase } from "@/lib/auth-client";

export default function VerifyEmailScreen() {
	const { p, t, d } = getTokens("warm", "humanist", "calm");
	const router = useRouter();
	const params = useLocalSearchParams<{ email?: string }>();
	const email = typeof params.email === "string" ? params.email : "your inbox";
	const [checking, setChecking] = useState(false);
	const [resending, setResending] = useState(false);
	const [resent, setResent] = useState(false);
	const [statusMsg, setStatusMsg] = useState<string | null>(null);

	const onIveVerified = async () => {
		setChecking(true);
		setStatusMsg(null);
		try {
			const { data } = await supabase.auth.getSession();
			if (data.session) {
				// Auth gate will route forward via useOnboardingStatus.
				return;
			}
			setStatusMsg(
				"Still waiting on the confirmation. Tap the link in your email, then try again.",
			);
		} finally {
			setChecking(false);
		}
	};

	const onResend = async () => {
		if (!params.email) return;
		setResending(true);
		setStatusMsg(null);
		try {
			const { error } = await supabase.auth.resend({
				type: "signup",
				email: params.email,
			});
			if (error) {
				setStatusMsg(error.message || "Couldn't resend. Try again shortly.");
				return;
			}
			setResent(true);
		} finally {
			setResending(false);
		}
	};

	const onUseDifferent = async () => {
		await supabase.auth.signOut();
		router.replace("/(auth)/sign-up");
	};

	return (
		<AuthShell canGoBack>
			<View style={{ gap: d.gap }}>
				<Text
					style={[
						styles.title,
						{
							color: p.ink,
							fontFamily: t.display,
							fontWeight: String(t.displayWeight) as "400",
						},
					]}
				>
					Check your email.
				</Text>
				<Text style={[styles.sub, { color: p.inkMid, fontFamily: t.ui }]}>
					We sent a confirmation link to{" "}
					<Text style={{ color: p.ink, fontWeight: "600" }}>{email}</Text>. Tap
					it from your phone, then come back to keep going.
				</Text>
			</View>

			{statusMsg ? (
				<View
					style={[
						styles.banner,
						{
							backgroundColor: `${p.warn}1A`,
							borderColor: `${p.warn}55`,
						},
					]}
					accessibilityLiveRegion="polite"
				>
					<Text
						style={[styles.bannerText, { color: p.warn, fontFamily: t.ui }]}
					>
						{statusMsg}
					</Text>
				</View>
			) : null}

			{resent ? (
				<View
					style={[
						styles.banner,
						{
							backgroundColor: `${p.accent}1A`,
							borderColor: `${p.accent}55`,
						},
					]}
					accessibilityLiveRegion="polite"
				>
					<Text
						style={[styles.bannerText, { color: p.accent, fontFamily: t.ui }]}
					>
						Sent again. Check your inbox.
					</Text>
				</View>
			) : null}

			<View style={{ gap: d.gap }}>
				<Button
					p={p}
					t={t}
					variant="primary"
					loading={checking}
					onPress={onIveVerified}
				>
					I've verified
				</Button>
				<Button
					p={p}
					t={t}
					variant="outline"
					loading={resending}
					disabled={!params.email}
					onPress={onResend}
				>
					Resend email
				</Button>
				<Button p={p} t={t} variant="ghost" onPress={onUseDifferent}>
					Use a different email
				</Button>
			</View>
		</AuthShell>
	);
}

const styles = StyleSheet.create({
	title: { fontSize: 28, lineHeight: 34, letterSpacing: -0.4 },
	sub: { fontSize: 15, lineHeight: 22 },
	banner: {
		borderWidth: 1,
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 12,
	},
	bannerText: { fontSize: 13, lineHeight: 18 },
});
