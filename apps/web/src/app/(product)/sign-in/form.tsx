"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/auth-client";

type Mode = "password" | "magic" | "signup";

export function ProductSignIn() {
	const router = useRouter();
	const [mode, setMode] = useState<Mode>("password");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [sent, setSent] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const redirectTo =
		typeof window !== "undefined"
			? `${window.location.origin}/auth/callback`
			: undefined;

	const handlePassword = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});
		setLoading(false);
		if (error) {
			setError(error.message);
			return;
		}
		router.push("/for-you");
	};

	const handleMagicLink = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);
		const { error } = await supabase.auth.signInWithOtp({
			email,
			options: { emailRedirectTo: redirectTo },
		});
		setLoading(false);
		if (error) {
			setError(error.message);
			return;
		}
		setSent(true);
	};

	const handleGoogle = async () => {
		await supabase.auth.signInWithOAuth({
			provider: "google",
			options: { redirectTo },
		});
	};

	const handleSignUp = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		if (password !== confirmPassword) {
			setError("Passwords don't match.");
			return;
		}
		if (password.length < 6) {
			setError("Password must be at least 6 characters.");
			return;
		}
		setLoading(true);
		const { error } = await supabase.auth.signUp({ email, password });
		setLoading(false);
		if (error) {
			setError(error.message);
			return;
		}
		// Use hard navigation so the proxy re-checks auth and redirects appropriately
		window.location.href = "/onboarding";
	};

	if (sent) {
		return (
			<div className="text-center">
				<div className="mb-3 text-3xl">📬</div>
				<h2 className="font-semibold text-lg text-white">Check your email</h2>
				<p className="mt-2 text-[13px] text-white/50">
					We sent a sign-in link to <span className="text-white">{email}</span>
				</p>
			</div>
		);
	}

	return (
		<div className="w-full max-w-xs">
			<button
				type="button"
				onClick={handleGoogle}
				className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/8 py-3 font-medium text-sm text-white"
			>
				<GoogleIcon />
				Continue with Google
			</button>

			<div className="my-4 flex items-center gap-3 text-[11px] text-white/25">
				<div className="h-px flex-1 bg-white/10" />
				or
				<div className="h-px flex-1 bg-white/10" />
			</div>

			{mode === "signup" ? (
				<form onSubmit={handleSignUp} className="flex flex-col gap-3">
					<input
						type="email"
						required
						placeholder="your@email.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="w-full rounded-xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
					/>
					<input
						type="password"
						required
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="w-full rounded-xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
					/>
					<input
						type="password"
						required
						placeholder="Confirm password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						className="w-full rounded-xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
					/>
					{error && <p className="text-[12px] text-red-400">{error}</p>}
					<button
						type="submit"
						disabled={loading}
						className="w-full rounded-xl bg-white py-3 font-semibold text-black text-sm disabled:opacity-50"
					>
						{loading ? "Creating account…" : "Create account"}
					</button>
					<button
						type="button"
						onClick={() => {
							setError(null);
							setMode("password");
						}}
						className="text-center text-[12px] text-white/40 hover:text-white/60"
					>
						Already have an account? Sign in
					</button>
				</form>
			) : mode === "password" ? (
				<form onSubmit={handlePassword} className="flex flex-col gap-3">
					<input
						type="email"
						required
						placeholder="your@email.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="w-full rounded-xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
					/>
					<input
						type="password"
						required
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="w-full rounded-xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
					/>
					{error && <p className="text-[12px] text-red-400">{error}</p>}
					<button
						type="submit"
						disabled={loading}
						className="w-full rounded-xl bg-white py-3 font-semibold text-black text-sm disabled:opacity-50"
					>
						{loading ? "Signing in..." : "Sign in"}
					</button>
					<div className="flex items-center justify-between">
						<button
							type="button"
							onClick={() => {
								setError(null);
								setMode("magic");
							}}
							className="text-[12px] text-white/40 hover:text-white/60"
						>
							Magic link instead
						</button>
						<button
							type="button"
							onClick={() => {
								setError(null);
								setMode("signup");
							}}
							className="text-[12px] text-white/40 hover:text-white/60"
						>
							Create account
						</button>
					</div>
				</form>
			) : (
				<form onSubmit={handleMagicLink} className="flex flex-col gap-3">
					<input
						type="email"
						required
						placeholder="your@email.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="w-full rounded-xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
					/>
					{error && <p className="text-[12px] text-red-400">{error}</p>}
					<button
						type="submit"
						disabled={loading}
						className="w-full rounded-xl bg-white py-3 font-semibold text-black text-sm disabled:opacity-50"
					>
						{loading ? "Sending..." : "Send magic link"}
					</button>
					<button
						type="button"
						onClick={() => {
							setError(null);
							setMode("password");
						}}
						className="text-center text-[12px] text-white/40 hover:text-white/60"
					>
						Sign in with password instead
					</button>
				</form>
			)}
		</div>
	);
}

function GoogleIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
			<path
				d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
				fill="#4285F4"
			/>
			<path
				d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
				fill="#34A853"
			/>
			<path
				d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
				fill="#FBBC05"
			/>
			<path
				d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
				fill="#EA4335"
			/>
		</svg>
	);
}
