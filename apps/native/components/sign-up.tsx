import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import {
	ActivityIndicator,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import z from "zod";

import { supabase } from "@/lib/auth-client";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

const signUpSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Name is required")
		.min(2, "Name must be at least 2 characters"),
	email: z
		.string()
		.trim()
		.min(1, "Email is required")
		.email("Enter a valid email address"),
	password: z
		.string()
		.min(1, "Password is required")
		.min(8, "Use at least 8 characters"),
});

function SignUp() {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;
	const [error, setError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: { name: "", email: "", password: "" },
		validators: { onSubmit: signUpSchema },
		onSubmit: async ({ value, formApi }) => {
			const { error: authError } = await supabase.auth.signUp({
				email: value.email.trim(),
				password: value.password,
				options: { data: { display_name: value.name.trim() } },
			});
			if (authError) {
				setError(authError.message || "Failed to sign up");
				return;
			}
			setError(null);
			formApi.reset();
		},
	});

	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: theme.card, borderColor: theme.border },
			]}
		>
			<Text style={[styles.title, { color: theme.text }]}>Create account</Text>

			{error ? (
				<View
					style={[
						styles.errorContainer,
						{ backgroundColor: `${theme.notification}20` },
					]}
				>
					<Text style={[styles.errorText, { color: theme.notification }]}>
						{error}
					</Text>
				</View>
			) : null}

			<form.Field name="name">
				{(field) => (
					<TextInput
						style={[
							styles.input,
							{
								color: theme.text,
								borderColor: theme.border,
								backgroundColor: theme.background,
							},
						]}
						placeholder="Name"
						placeholderTextColor={theme.text}
						value={field.state.value}
						onBlur={field.handleBlur}
						onChangeText={(value) => {
							field.handleChange(value);
							if (error) setError(null);
						}}
					/>
				)}
			</form.Field>

			<form.Field name="email">
				{(field) => (
					<TextInput
						style={[
							styles.input,
							{
								color: theme.text,
								borderColor: theme.border,
								backgroundColor: theme.background,
							},
						]}
						placeholder="Email"
						placeholderTextColor={theme.text}
						value={field.state.value}
						onBlur={field.handleBlur}
						onChangeText={(value) => {
							field.handleChange(value);
							if (error) setError(null);
						}}
						keyboardType="email-address"
						autoCapitalize="none"
					/>
				)}
			</form.Field>

			<form.Field name="password">
				{(field) => (
					<TextInput
						style={[
							styles.input,
							{
								color: theme.text,
								borderColor: theme.border,
								backgroundColor: theme.background,
							},
						]}
						placeholder="Password"
						placeholderTextColor={theme.text}
						value={field.state.value}
						onBlur={field.handleBlur}
						onChangeText={(value) => {
							field.handleChange(value);
							if (error) setError(null);
						}}
						secureTextEntry
						onSubmitEditing={form.handleSubmit}
					/>
				)}
			</form.Field>

			<form.Subscribe
				selector={(state) => ({ isSubmitting: state.isSubmitting })}
			>
				{({ isSubmitting }) => (
					<TouchableOpacity
						onPress={form.handleSubmit}
						disabled={isSubmitting}
						style={[
							styles.button,
							{
								backgroundColor: theme.primary,
								opacity: isSubmitting ? 0.5 : 1,
							},
						]}
					>
						{isSubmitting ? (
							<ActivityIndicator size="small" color="#ffffff" />
						) : (
							<Text style={styles.buttonText}>Sign up</Text>
						)}
					</TouchableOpacity>
				)}
			</form.Subscribe>
		</View>
	);
}

const styles = StyleSheet.create({
	card: { marginTop: 16, padding: 16, borderWidth: 1 },
	title: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
	errorContainer: { marginBottom: 12, padding: 8 },
	errorText: { fontSize: 14 },
	input: { borderWidth: 1, padding: 12, fontSize: 16, marginBottom: 12 },
	button: { padding: 12, alignItems: "center", justifyContent: "center" },
	buttonText: { color: "#ffffff", fontSize: 16 },
});

export { SignUp };
