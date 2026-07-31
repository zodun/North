// Sign-up screen. No name field — onboarding Q1 collects display_name
// and pre-fills from user_metadata for Google/Apple signups.
//
// If Supabase has email confirmation enabled, signUp returns
// session === null with the user record. We route to /verify-email
// in that case; otherwise the (drawer) gate naturally bounces to
// onboarding once the session arrives.

import { Button, Input } from "@north/native-ui";
import { getNorthTokens } from "@north/tokens";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthShell } from "@/components/auth/AuthShell";
import { DevSkip } from "@/components/auth/DevSkip";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { supabase } from "@/lib/auth-client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(value: string): string | undefined {
	const trimmed = value.trim();
	if (!trimmed) return "Email is required";
	if (!EMAIL_RE.test(trimmed)) return "Enter a valid email";
	return undefined;
}

function validatePassword(value: string): string | undefined {
	if (!value) return "Password is required";
	if (value.length < 8) return "Use at least 8 characters";
	return undefined;
}

function friendlyAuthError(raw: string): string {
	if (/user already registered/i.test(raw) || /already registered/i.test(raw)) {
		return "That email is already in use. Try signing in instead.";
	}
	if (/password should be at least/i.test(raw)) {
		return "Use at least 8 characters for your password.";
	}
	if (/rate limit/i.test(raw)) {
		return "Too many attempts. Give it a moment, then try again.";
	}
	return raw;
}

export default function SignUpScreen() {
	const { p, t, d } = getNorthTokens();
	const router = useRouter();
	const [authError, setAuthError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: { email: "", password: "" },
		onSubmit: async ({ value }) => {
			setAuthError(null);
			const email = value.email.trim();
			const { data, error } = await supabase.auth.signUp({
				email,
				password: value.password,
				options: { emailRedirectTo: "north://auth/verify" },
			});
			if (error) {
				setAuthError(friendlyAuthError(error.message || "Failed to sign up"));
				return;
			}
			// If email confirmation is required, signUp returns user with
			// no session; route to verify-email. Otherwise the auth gate
			// will route us into onboarding automatically.
			if (data.session === null && data.user && !data.user.email_confirmed_at) {
				router.replace({
					pathname: "/(auth)/verify-email",
					params: { email },
				});
			}
		},
	});

	return (
		<AuthShell
			footer={
				<Text style={[styles.terms, { color: p.inkDim, fontFamily: t.ui }]}>
					Continuing means you accept our Terms and Privacy.
				</Text>
			}
		>
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
					Let's begin.
				</Text>
				<Text style={[styles.sub, { color: p.inkMid, fontFamily: t.ui }]}>
					Create your account in a minute.
				</Text>
			</View>

			<View style={{ gap: d.gap }}>
				<SocialButtons
					onError={(msg) => setAuthError(friendlyAuthError(msg))}
				/>

				<View style={styles.dividerRow}>
					<View style={[styles.dividerLine, { backgroundColor: p.line }]} />
					<Text
						style={[styles.dividerLabel, { color: p.inkDim, fontFamily: t.ui }]}
					>
						or with email
					</Text>
					<View style={[styles.dividerLine, { backgroundColor: p.line }]} />
				</View>

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
						// onChange keeps the message honest while typing; the error
						// only *shows* after first blur (see `error` below).
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
							returnKeyType="next"
							error={
								field.state.meta.isBlurred
									? field.state.meta.errors[0]?.toString()
									: undefined
							}
						/>
					)}
				</form.Field>

				<View style={{ gap: 6 }}>
					<form.Field
						name="password"
						validators={{
							onBlur: ({ value }) => validatePassword(value),
							onChange: ({ value }) => validatePassword(value),
						}}
					>
						{(field) => (
							<Input
								p={p}
								t={t}
								label="Password"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChangeText={(v) => {
									field.handleChange(v);
									if (authError) setAuthError(null);
								}}
								placeholder="At least 8 characters"
								secureTextEntry
								autoCapitalize="none"
								// "oneTimeCode" suppresses iOS's Automatic Strong Password
								// overlay, which covers the field with a yellow banner.
								// Restore "new-password"/"newPassword" to re-enable it.
								autoComplete="off"
								textContentType="oneTimeCode"
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
					<Text style={[styles.hint, { color: p.inkDim, fontFamily: t.ui }]}>
						We'll never share your email.
					</Text>
				</View>

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
							Create account
						</Button>
					)}
				</form.Subscribe>

				<Pressable
					onPress={() => router.replace("/(auth)/sign-in")}
					hitSlop={8}
					accessibilityRole="link"
					style={styles.switchRow}
				>
					{({ pressed }) => (
						<Text
							style={[
								styles.switchText,
								{
									color: p.inkMid,
									fontFamily: t.ui,
									opacity: pressed ? 0.6 : 1,
								},
							]}
						>
							Already have an account?{" "}
							<Text style={{ color: p.goldInk, fontWeight: "600" }}>
								Sign in.
							</Text>
						</Text>
					)}
				</Pressable>
			</View>
			<DevSkip />
		</AuthShell>
	);
}

const styles = StyleSheet.create({
	title: { fontSize: 28, lineHeight: 34, letterSpacing: -0.4 },
	sub: { fontSize: 15, lineHeight: 22 },
	dividerRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingVertical: 4,
	},
	dividerLine: { flex: 1, height: 1 },
	dividerLabel: { fontSize: 12, letterSpacing: 0.3 },
	banner: {
		borderWidth: 1,
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 12,
	},
	bannerText: { fontSize: 13, lineHeight: 18 },
	hint: { fontSize: 12 },
	switchRow: { alignItems: "center", paddingTop: 8 },
	switchText: { fontSize: 14, textAlign: "center" },
	terms: {
		fontSize: 11,
		lineHeight: 16,
		textAlign: "center",
		paddingHorizontal: 24,
	},
});
