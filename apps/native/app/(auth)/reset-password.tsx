// Reset password. Landing screen for the recovery deep link sent by
// forgot-password.
//
// Three states share this screen:
//   opening  — waiting on the link, exchanging its tokens for a session
//   form     — session established, user picks a new password
//   done     — password changed, session is live, straight into the app
//
// Why a session must be established first: updateUser() acts on the *current*
// user, so without setSession() from the link's tokens there is nobody to
// update and Supabase rejects the call.

import { Button, Input, Rise, staggerDelay } from "@north/native-ui";
import { getNorthTokens } from "@north/tokens";
import { useForm } from "@tanstack/react-form";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AuthShell } from "@/components/auth/AuthShell";
import { parseRecoveryLink } from "@/lib/auth/recovery-link";
import { supabase } from "@/lib/auth-client";

function validatePassword(value: string): string | undefined {
	if (!value) return "Password is required";
	if (value.length < 8) return "Use at least 8 characters";
	return undefined;
}

export default function ResetPasswordScreen() {
	const { p, t, d } = getNorthTokens();
	const router = useRouter();

	// useURL covers both cases: the app cold-starting from the link, and the
	// link arriving while it is already running in the background.
	const url = Linking.useURL();
	const [ready, setReady] = useState(false);
	const [linkError, setLinkError] = useState<string | null>(null);
	const [authError, setAuthError] = useState<string | null>(null);

	useEffect(() => {
		const parsed = parseRecoveryLink(url);
		if (parsed.kind === "error") {
			setLinkError(parsed.message);
			return;
		}
		if (parsed.kind !== "tokens") return;

		let cancelled = false;
		supabase.auth
			.setSession({
				access_token: parsed.accessToken,
				refresh_token: parsed.refreshToken,
			})
			.then(({ error }) => {
				if (cancelled) return;
				if (error) {
					setLinkError("That link didn't work. Request a new one.");
					return;
				}
				setReady(true);
			});
		return () => {
			cancelled = true;
		};
	}, [url]);

	const form = useForm({
		defaultValues: { password: "" },
		onSubmit: async ({ value }) => {
			setAuthError(null);
			const { error } = await supabase.auth.updateUser({
				password: value.password,
			});
			if (error) {
				setAuthError(
					/should be different/i.test(error.message)
						? "Pick a password you haven't used before."
						: error.message || "Couldn't update your password. Try again.",
				);
				return;
			}
			// setSession already signed them in, so there is nowhere to send them
			// but forward. The root layout decides onboarding vs drawer.
			router.replace("/");
		},
	});

	if (linkError) {
		return (
			<AuthShell canGoBack>
				<Rise delay={staggerDelay(0)} style={{ gap: d.gap }}>
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
						This link is done.
					</Text>
					<Text style={[styles.sub, { color: p.inkMid, fontFamily: t.ui }]}>
						{linkError}
					</Text>
				</Rise>
				<Rise delay={staggerDelay(1)} style={{ marginTop: d.gap }}>
					<Button
						p={p}
						t={t}
						variant="primary"
						onPress={() => router.replace("/(auth)/forgot-password")}
					>
						Send a new link
					</Button>
				</Rise>
			</AuthShell>
		);
	}

	if (!ready) {
		return (
			<AuthShell canGoBack>
				<Rise delay={staggerDelay(0)} style={{ gap: d.gap }}>
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
						One moment.
					</Text>
					<Text style={[styles.sub, { color: p.inkMid, fontFamily: t.ui }]}>
						Checking your link.
					</Text>
				</Rise>
			</AuthShell>
		);
	}

	return (
		<AuthShell canGoBack>
			<Rise delay={staggerDelay(0)} style={{ gap: d.gap }}>
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
					Set a new password.
				</Text>
				<Text style={[styles.sub, { color: p.inkMid, fontFamily: t.ui }]}>
					Once it's saved you'll be signed in.
				</Text>
			</Rise>

			{authError ? (
				<Rise delay={staggerDelay(1)}>
					<View
						style={[
							styles.banner,
							{
								backgroundColor: `${p.warn}1A`,
								borderColor: `${p.warn}55`,
							},
						]}
						accessibilityLiveRegion="polite"
						accessibilityRole="alert"
					>
						<Text
							style={[styles.bannerText, { color: p.warn, fontFamily: t.ui }]}
						>
							{authError}
						</Text>
					</View>
				</Rise>
			) : null}

			<Rise delay={staggerDelay(2)} style={{ gap: d.gap, marginTop: d.gap }}>
				<form.Field
					name="password"
					validators={{ onBlur: ({ value }) => validatePassword(value) }}
				>
					{(field) => (
						<Input
							p={p}
							t={t}
							label="New password"
							value={field.state.value}
							onChangeText={field.handleChange}
							onBlur={field.handleBlur}
							error={field.state.meta.errors[0] as string | undefined}
							secureTextEntry
							autoCapitalize="none"
							autoComplete="new-password"
							textContentType="newPassword"
							returnKeyType="done"
							onSubmitEditing={() => {
								void form.handleSubmit();
							}}
						/>
					)}
				</form.Field>

				<form.Subscribe
					selector={(s) => [s.canSubmit, s.isSubmitting] as const}
				>
					{([canSubmit, isSubmitting]) => (
						<Button
							p={p}
							t={t}
							variant="primary"
							disabled={!canSubmit}
							loading={isSubmitting}
							onPress={() => {
								void form.handleSubmit();
							}}
						>
							Save password
						</Button>
					)}
				</form.Subscribe>
			</Rise>
		</AuthShell>
	);
}

const styles = StyleSheet.create({
	title: { fontSize: 28, lineHeight: 34 },
	sub: { fontSize: 15, lineHeight: 22 },
	banner: { borderRadius: 10, borderWidth: 1, padding: 12 },
	bannerText: { fontSize: 13, lineHeight: 19 },
});
