"use client";

import { Button } from "@north/ui/components/button";
import { Input } from "@north/ui/components/input";
import { Label } from "@north/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { supabase } from "@/lib/auth-client";

export default function SignInForm() {
	const [sent, setSent] = useState(false);

	const redirectTo = () =>
		typeof window !== "undefined"
			? `${window.location.origin}/auth/callback`
			: undefined;

	const oauth = async (provider: "google" | "apple") => {
		const { error } = await supabase.auth.signInWithOAuth({
			provider,
			options: { redirectTo: redirectTo() },
		});
		if (error) toast.error(error.message);
	};

	const form = useForm({
		defaultValues: { email: "" },
		onSubmit: async ({ value }) => {
			const { error } = await supabase.auth.signInWithOtp({
				email: value.email,
				options: { emailRedirectTo: redirectTo() },
			});
			if (error) {
				toast.error(error.message);
				return;
			}
			setSent(true);
			toast.success("Magic link sent. Check your email.");
		},
		validators: {
			onSubmit: z.object({ email: z.email("Invalid email address") }),
		},
	});

	if (sent) {
		return (
			<div className="mx-auto mt-10 w-full max-w-md p-6 text-center">
				<h1 className="mb-2 font-semibold text-2xl">Check your email</h1>
				<p className="text-muted-foreground text-sm">
					We sent a magic sign-in link. Open it on this device to continue.
				</p>
			</div>
		);
	}

	return (
		<div className="mx-auto mt-10 w-full max-w-md p-6">
			<h1 className="mb-2 text-center font-semibold text-3xl">North admin</h1>
			<p className="mb-6 text-center text-muted-foreground text-sm">
				Sign in to the admin. Access is granted by allow-list.
			</p>
			<div className="space-y-2">
				<Button
					type="button"
					variant="outline"
					className="w-full"
					onClick={() => oauth("google")}
				>
					Continue with Google
				</Button>
				<Button
					type="button"
					variant="outline"
					className="w-full"
					onClick={() => oauth("apple")}
				>
					Continue with Apple
				</Button>
			</div>
			<div className="my-4 flex items-center gap-3 text-muted-foreground text-xs">
				<div className="h-px flex-1 bg-border" />
				<span>or magic link</span>
				<div className="h-px flex-1 bg-border" />
			</div>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-4"
			>
				<form.Field name="email">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor={field.name}>Email</Label>
							<Input
								id={field.name}
								name={field.name}
								type="email"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
							/>
							{field.state.meta.errors.map((error) => (
								<p key={error?.message} className="text-red-500">
									{error?.message}
								</p>
							))}
						</div>
					)}
				</form.Field>
				<form.Subscribe
					selector={(state) => ({
						canSubmit: state.canSubmit,
						isSubmitting: state.isSubmitting,
					})}
				>
					{({ canSubmit, isSubmitting }) => (
						<Button
							type="submit"
							className="w-full"
							disabled={!canSubmit || isSubmitting}
						>
							{isSubmitting ? "Sending..." : "Send magic link"}
						</Button>
					)}
				</form.Subscribe>
			</form>
		</div>
	);
}
