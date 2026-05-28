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

	const form = useForm({
		defaultValues: { email: "" },
		onSubmit: async ({ value }) => {
			const redirectTo =
				typeof window !== "undefined"
					? `${window.location.origin}/auth/callback`
					: undefined;
			const { error } = await supabase.auth.signInWithOtp({
				email: value.email,
				options: { emailRedirectTo: redirectTo },
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
				Magic-link sign-in. Admin access is granted by allow-list.
			</p>
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
