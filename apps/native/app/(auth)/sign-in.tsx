// Sign-in screen. Social-first hierarchy, divider, then email/password
// with per-field onBlur validation and a Forgot link on the password
// row. Auth-level errors render in a banner above the form, distinct
// from inline Zod errors.

import { Button, Input } from "@north/native-ui";
import { getTokens } from "@north/tokens";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthShell } from "@/components/auth/AuthShell";
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
	if (/invalid login credentials/i.test(raw)) {
		return "We couldn't sign you in. Check your email and password.";
	}
	if (/email not confirmed/i.test(raw)) {
		return "Confirm your email first — check your inbox for the link.";
	}
	if (/rate limit/i.test(raw)) {
		return "Too many attempts. Give it a moment, then try again.";
	}
	return raw;
}

export default function SignInScreen() {
	const { p, t, d } = getTokens("warm", "humanist", "calm");
	const router = useRouter();
	const [authError, setAuthError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: { email: "", password: "" },
		onSubmit: async ({ value }) => {
			setAuthError(null);
			const { error } = await supabase.auth.signInWithPassword({
				email: value.email.trim(),
				password: value.password,
			});
			if (error) {
				setAuthError(friendlyAuthError(error.message || "Failed to sign in"));
			}
		},
	});

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
					Welcome back.
				</Text>
				<Text style={[styles.sub, { color: p.inkMid, fontFamily: t.ui }]}>
					Pick up where you left off.
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
					validators={{ onBlur: ({ value }) => validateEmail(value) }}
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
							error={field.state.meta.errors[0]?.toString()}
						/>
					)}
				</form.Field>

				<View style={{ gap: 6 }}>
					<View style={styles.labelRow}>
						<Text
							style={[styles.fieldLabel, { color: p.inkMid, fontFamily: t.ui }]}
						>
							Password
						</Text>
						<Pressable
							onPress={() => router.push("/(auth)/forgot-password")}
							hitSlop={10}
							accessibilityRole="link"
							accessibilityLabel="Forgot password"
						>
							{({ pressed }) => (
								<Text
									style={[
										styles.forgot,
										{
											color: p.accent,
											fontFamily: t.ui,
											opacity: pressed ? 0.6 : 1,
										},
									]}
								>
									Forgot?
								</Text>
							)}
						</Pressable>
					</View>
					<form.Field
						name="password"
						validators={{ onBlur: ({ value }) => validatePassword(value) }}
					>
						{(field) => (
							<Input
								p={p}
								t={t}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChangeText={(v) => {
									field.handleChange(v);
									if (authError) setAuthError(null);
								}}
								placeholder="••••••••"
								secureTextEntry
								autoCapitalize="none"
								autoComplete="current-password"
								textContentType="password"
								returnKeyType="go"
								onSubmitEditing={() => {
									void form.handleSubmit();
								}}
								error={field.state.meta.errors[0]?.toString()}
							/>
						)}
					</form.Field>
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
							Sign in
						</Button>
					)}
				</form.Subscribe>

				<Pressable
					onPress={() => router.replace("/(auth)/sign-up")}
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
							New here?{" "}
							<Text style={{ color: p.accent }}>Create an account.</Text>
						</Text>
					)}
				</Pressable>
			</View>
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
	labelRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	fieldLabel: { fontSize: 12, fontWeight: "500" },
	forgot: { fontSize: 12, fontWeight: "600" },
	switchRow: { alignItems: "center", paddingTop: 8 },
	switchText: { fontSize: 14, textAlign: "center" },
});
