// Social sign-in buttons (DEC-18). Renders Google + Apple only when the
// respective OAuth credentials / device capabilities are present.
//
// Google: expo-auth-session's Google provider opens the OAuth flow,
// returns an ID token, and we hand it to Supabase via signInWithIdToken
// — that bypasses the redirect dance Supabase's signInWithOAuth would
// require on native.
//
// Apple: expo-apple-authentication uses Sign in with Apple directly on
// iOS. Returns an identity token straight to us; same Supabase handoff.
// Android is skipped (Apple SDK isn't available; iOS-only).

import { env } from "@north/env/native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Google from "expo-auth-session/providers/google";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Platform,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

import { supabase } from "@/lib/auth-client";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

WebBrowser.maybeCompleteAuthSession();

export function SocialSignIn({ onError }: { onError: (msg: string) => void }) {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;

	const [appleAvailable, setAppleAvailable] = useState(false);
	const [googlePending, setGooglePending] = useState(false);
	const [applePending, setApplePending] = useState(false);

	useEffect(() => {
		if (Platform.OS !== "ios") return;
		AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
	}, []);

	const [, response, promptGoogle] = Google.useAuthRequest({
		iosClientId: env.EXPO_PUBLIC_GOOGLE_OAUTH_IOS_CLIENT_ID,
		androidClientId: env.EXPO_PUBLIC_GOOGLE_OAUTH_ANDROID_CLIENT_ID,
		webClientId: env.EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID,
	});

	useEffect(() => {
		if (response?.type !== "success") return;
		const idToken = response.params.id_token;
		if (!idToken) return;
		(async () => {
			const { error } = await supabase.auth.signInWithIdToken({
				provider: "google",
				token: idToken,
			});
			if (error) onError(error.message);
			setGooglePending(false);
		})();
	}, [response, onError]);

	const onGoogle = async () => {
		if (!env.EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID) {
			onError("Google sign-in not configured");
			return;
		}
		setGooglePending(true);
		await promptGoogle();
	};

	const onApple = async () => {
		setApplePending(true);
		try {
			const rawNonce = Crypto.randomUUID();
			const hashedNonce = await Crypto.digestStringAsync(
				Crypto.CryptoDigestAlgorithm.SHA256,
				rawNonce,
			);
			const credential = await AppleAuthentication.signInAsync({
				requestedScopes: [
					AppleAuthentication.AppleAuthenticationScope.EMAIL,
					AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
				],
				nonce: hashedNonce,
			});
			if (!credential.identityToken) {
				onError("Apple sign-in returned no identity token");
				return;
			}
			const { error } = await supabase.auth.signInWithIdToken({
				provider: "apple",
				token: credential.identityToken,
				nonce: rawNonce,
			});
			if (error) onError(error.message);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			if (!message.includes("ERR_REQUEST_CANCELED")) onError(message);
		} finally {
			setApplePending(false);
		}
	};

	const googleConfigured = Boolean(env.EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID);
	if (!googleConfigured && !appleAvailable) return null;

	return (
		<View style={styles.wrap}>
			{googleConfigured ? (
				<TouchableOpacity
					onPress={onGoogle}
					disabled={googlePending}
					style={[
						styles.button,
						{ borderColor: theme.border, backgroundColor: theme.background },
					]}
				>
					{googlePending ? (
						<ActivityIndicator size="small" color={theme.text} />
					) : (
						<Text style={[styles.label, { color: theme.text }]}>
							Continue with Google
						</Text>
					)}
				</TouchableOpacity>
			) : null}

			{appleAvailable ? (
				<TouchableOpacity
					onPress={onApple}
					disabled={applePending}
					style={[
						styles.button,
						{ borderColor: theme.border, backgroundColor: theme.background },
					]}
				>
					{applePending ? (
						<ActivityIndicator size="small" color={theme.text} />
					) : (
						<Text style={[styles.label, { color: theme.text }]}>
							Continue with Apple
						</Text>
					)}
				</TouchableOpacity>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: { gap: 8, marginBottom: 12 },
	button: {
		padding: 12,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	label: { fontSize: 15, fontWeight: "500" },
});
