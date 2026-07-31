// Forgot password. Two states share one screen: form (email entry)
// → success (instructions to check email).
//
// The reset email links back into the app via a deep link rather than
// Supabase's hosted page, so the user sets their new password in North and
// stays signed in afterwards. The target URL must be allow-listed in
// supabase/config.toml → auth.additional_redirect_urls, or Supabase quietly
// falls back to site_url and the link opens a browser instead.

import { Button, Input } from "@north/native-ui";
import { getNorthTokens } from "@north/tokens";
import { useForm } from "@tanstack/react-form";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AuthShell } from "@/components/auth/AuthShell";
import { supabase } from "@/lib/auth-client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(value: string): string | undefined {
	const trimmed = value.trim();
	if (!trimmed) return "Email is required";
	if (!EMAIL_RE.test(trimmed)) return "Enter a valid email";
	return undefined;
}

export default function ForgotPasswordScreen() {
	const { p, t, d } = getNorthTokens();
	const router = useRouter();
	const [sentTo, setSentTo] = useState<string | null>(null);
	const [authError, setAuthError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: { email: "" },
		onSubmit: async ({ value }) => {
			setAuthError(null);
			const email = value.email.trim();
			// createURL adapts to the runtime: north:// in a standalone build,
			// exp+north:// under the dev client. Both are allow-listed.
			const { error } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: Linking.createURL("/reset-password"),
			});
			if (error) {
				setAuthError(error.message || "Couldn't send reset link. Try again.");
				return;
			}
			setSentTo(email);
		},
	});

	if (sentTo) {
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
						We sent a link to{" "}
						<Text style={{ color: p.ink, fontWeight: "600" }}>{sentTo}</Text>.
						Open it from your phone to set a new password.
					</Text>
				</View>

				<View style={{ gap: d.gap, marginTop: d.gap }}>
					<Button
						p={p}
						t={t}
						variant="primary"
						onPress={() => router.replace("/(auth)/sign-in")}
					>
						Back to sign in
					</Button>
					<Button
						p={p}
						t={t}
						variant="ghost"
						onPress={() => {
							setSentTo(null);
						}}
					>
						Use a different email
					</Button>
				</View>
			</AuthShell>
		);
	}

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
					Reset your password.
				</Text>
				<Text style={[styles.sub, { color: p.inkMid, fontFamily: t.ui }]}>
					Enter the email you used to sign up. We'll send a link to set a new
					password.
				</Text>
			</View>

			<View style={{ gap: d.gap }}>
				{authError ? (
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
				) : null}

				<form.Field
					name="email"
					validators={{
						onBlur: ({ value }) => validateEmail(value),
						onChange: ({ value }) => validateEmail(value),
					}}
				>
					{(field) => (
						<Input
							p={p}
							t={t}
							label="Email"
							value={field.state.value}
							onBlur={field.handleBlur}
							onChangeText={(v) => {
								field.handleChange(v);
								if (authError) setAuthError(null);
							}}
							placeholder="you@example.com"
							keyboardType="email-address"
							autoCapitalize="none"
							autoCorrect={false}
							autoComplete="email"
							textContentType="emailAddress"
							returnKeyType="go"
							onSubmitEditing={() => {
								void form.handleSubmit();
							}}
							error={
								field.state.meta.isBlurred
									? field.state.meta.errors[0]?.toString()
									: undefined
							}
						/>
					)}
				</form.Field>

				<form.Subscribe selector={(s) => s.isSubmitting}>
					{(isSubmitting) => (
						<Button
							p={p}
							t={t}
							variant="primary"
							loading={isSubmitting}
							onPress={() => {
								void form.handleSubmit();
							}}
						>
							Send reset link
						</Button>
					)}
				</form.Subscribe>
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
