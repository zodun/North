"use client";

import { Button } from "@north/ui/components/button";
import { toast } from "sonner";

import { supabase } from "@/lib/auth-client";

export default function SignInForm() {
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
		</div>
	);
}
