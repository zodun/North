"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/auth-client";

type Mode = "password" | "magic" | "signup";

// ── Shared styles ──────────────────────────────────────────────────────────

const inputCls =
	"w-full rounded-[10px] border border-[#0E1420]/10 bg-white px-[13px] py-[10px] text-[13px] text-[#0E1420] placeholder:text-[#0E1420]/35 outline-none transition-all focus:border-[#3ECFBF] focus:bg-[rgba(62,207,191,0.05)]";

const labelCls =
	"mb-1 block font-bold text-[9px] text-[#0E1420]/60 uppercase tracking-[0.1em]";

const primaryBtnCls =
	"relative mt-2 mb-3 w-full cursor-pointer overflow-hidden rounded-xl bg-[#F5C842] py-[13px] font-black text-[15px] text-[#05050E] tracking-tight shadow-[0_2px_12px_rgba(245,200,66,0.30)] transition-all active:scale-[0.98] hover:bg-[#FFD966] hover:shadow-[0_3px_16px_rgba(245,200,66,0.40)] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100";

const switchLinkCls =
	"cursor-pointer font-bold text-[12px] text-[#0A8F7F] transition-colors hover:text-[#0E1420]";

// ── Trust items ────────────────────────────────────────────────────────────

const TRUST_ITEMS = [
	{ dot: "#F5C842", text: "Free to join" },
	{ dot: "#3ECFBF", text: "Built for you" },
	{ dot: "#7B61FF", text: "Private" },
];

// ── Compass logo ───────────────────────────────────────────────────────────

function CompassLogo() {
	return (
		<svg
			width="32"
			height="32"
			viewBox="0 0 32 32"
			fill="none"
			aria-hidden="true"
		>
			{/* Outer circle */}
			<circle
				cx="16"
				cy="16"
				r="14"
				stroke="rgba(245,200,66,0.6)"
				strokeWidth="1"
			/>
			{/* Middle dashed circle */}
			<circle
				cx="16"
				cy="16"
				r="9"
				stroke="rgba(245,200,66,0.25)"
				strokeWidth="0.8"
				strokeDasharray="2 4"
			/>
			{/* Inner circle */}
			<circle
				cx="16"
				cy="16"
				r="5"
				stroke="rgba(62,207,191,0.5)"
				strokeWidth="0.8"
			/>
			{/* Cross lines */}
			<line
				x1="16"
				y1="2"
				x2="16"
				y2="30"
				stroke="rgba(245,200,66,0.2)"
				strokeWidth="0.5"
			/>
			<line
				x1="2"
				y1="16"
				x2="30"
				y2="16"
				stroke="rgba(245,200,66,0.2)"
				strokeWidth="0.5"
			/>
			{/* North needle — gold */}
			<polygon points="16,5 13,16 19,16" fill="rgba(245,200,66,1)" />
			{/* South needle — teal 80% */}
			<polygon points="16,27 13,16 19,16" fill="rgba(62,207,191,0.8)" />
			{/* East needle — ink 35% */}
			<polygon points="27,16 16,13 16,19" fill="rgba(14,20,32,0.35)" />
			{/* West needle — ink 35% */}
			<polygon points="5,16 16,13 16,19" fill="rgba(14,20,32,0.35)" />
			{/* Center dot — gold */}
			<circle cx="16" cy="16" r="2.2" fill="rgba(245,200,66,1)" />
			{/* Center dot — dark inner */}
			<circle cx="16" cy="16" r="0.9" fill="#05050E" />
		</svg>
	);
}

// ── Google icon ────────────────────────────────────────────────────────────

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

// ── Reusable sub-components ────────────────────────────────────────────────

function BrandRow() {
	return (
		<div className="mb-3 flex items-center gap-3">
			<div className="shrink-0 animate-logo-pulse">
				<CompassLogo />
			</div>
			<div className="leading-none">
				<div className="font-black text-[#0E1420] text-[18px] tracking-tight">
					North<span style={{ color: "#8A6A00" }}>.</span>
				</div>
				<div className="mt-0.5 font-bold text-[#0E1420]/50 text-[8px] uppercase tracking-[0.18em]">
					Find your direction
				</div>
			</div>
		</div>
	);
}

function OrDivider({ label = "or email" }: { label?: string }) {
	return (
		<div className="my-3 flex items-center gap-2.5">
			<div className="h-px flex-1 bg-[rgba(14,20,32,0.12)]" />
			<span className="text-[#0E1420]/50 text-[11px]">{label}</span>
			<div className="h-px flex-1 bg-[rgba(14,20,32,0.12)]" />
		</div>
	);
}

function TrustBar() {
	return (
		<div className="flex items-center justify-center gap-[14px] border-[#0E1420]/10 border-t pt-3">
			{TRUST_ITEMS.map(({ dot, text }) => (
				<div key={text} className="flex items-center gap-1.5">
					<div
						className="h-1.5 w-1.5 rounded-full"
						style={{ backgroundColor: dot }}
					/>
					<span className="font-medium text-[#0E1420]/55 text-[10px]">
						{text}
					</span>
				</div>
			))}
		</div>
	);
}

// ── Main component ─────────────────────────────────────────────────────────

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
		// Hard navigation so the proxy re-checks auth and redirects appropriately
		window.location.href = "/onboarding";
	};

	const switchMode = (next: Mode) => {
		setError(null);
		setMode(next);
	};

	// ── Sent state ───────────────────────────────────────────────────────────

	if (sent) {
		return (
			<>
				<BrandRow />
				<div className="py-5 text-center">
					<div className="mb-3 flex justify-center">
						<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3ECFBF]/10">
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="#0A8F7F"
								strokeWidth={1.8}
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<rect x="2" y="4" width="20" height="16" rx="2" />
								<path d="M2 7l10 7 10-7" />
							</svg>
						</div>
					</div>
					<p className="font-bold text-[#0E1420] text-[17px]">
						Check your email
					</p>
					<p className="mt-1.5 text-[#0E1420]/65 text-[13px]">
						Magic link sent to <span className="text-[#0E1420]">{email}</span>
					</p>
					<button
						type="button"
						onClick={() => {
							setSent(false);
							switchMode("password");
						}}
						className="mt-5 cursor-pointer text-[#0E1420]/55 text-[12px] transition-colors hover:text-[#0E1420]/70"
					>
						Back to sign in
					</button>
				</div>
				<TrustBar />
			</>
		);
	}

	// ── Magic link mode ──────────────────────────────────────────────────────

	if (mode === "magic") {
		return (
			<>
				<BrandRow />
				<p className="mb-3 font-black text-[#0E1420] text-[18px] tracking-tight">
					Magic link
				</p>
				<form onSubmit={handleMagicLink} className="flex flex-col gap-2.5">
					<div>
						<label htmlFor="magic-email" className={labelCls}>
							Email
						</label>
						<input
							id="magic-email"
							type="email"
							required
							autoComplete="email"
							placeholder="your@email.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className={inputCls}
						/>
					</div>
					{error && (
						<p className="rounded-lg bg-red-500/10 px-3 py-1.5 text-[12px] text-red-600">
							{error}
						</p>
					)}
					<button type="submit" disabled={loading} className={primaryBtnCls}>
						<span className="relative z-10">
							{loading ? "Sending…" : "Send magic link"}
						</span>
					</button>
					<button
						type="button"
						onClick={() => switchMode("password")}
						className="cursor-pointer text-center text-[#0E1420]/55 text-[12px] transition-colors hover:text-[#0E1420]/70"
					>
						Sign in with password instead
					</button>
				</form>
				<TrustBar />
			</>
		);
	}

	// ── Sign-up mode ─────────────────────────────────────────────────────────

	if (mode === "signup") {
		return (
			<>
				<BrandRow />
				<p className="mb-3 font-black text-[#0E1420] text-[18px] tracking-tight">
					Create account
				</p>
				<button
					type="button"
					onClick={handleGoogle}
					className="mb-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-[#0E1420]/12 border-[1.5px] bg-white py-[11px] font-bold text-[#0E1420] text-[14px] transition-colors hover:bg-[#F4F7FC]"
				>
					<GoogleIcon />
					Continue with Google
				</button>
				<OrDivider label="or email" />
				<form onSubmit={handleSignUp} className="flex flex-col gap-2.5">
					<div>
						<label htmlFor="signup-email" className={labelCls}>
							Email
						</label>
						<input
							id="signup-email"
							type="email"
							required
							autoComplete="email"
							placeholder="your@email.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className={inputCls}
						/>
					</div>
					<div>
						<label htmlFor="signup-password" className={labelCls}>
							Password
						</label>
						<input
							id="signup-password"
							type="password"
							required
							autoComplete="new-password"
							placeholder="Minimum 6 characters"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className={inputCls}
						/>
					</div>
					<div>
						<label htmlFor="signup-confirm" className={labelCls}>
							Confirm password
						</label>
						<input
							id="signup-confirm"
							type="password"
							required
							autoComplete="new-password"
							placeholder="Repeat password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							className={inputCls}
						/>
					</div>
					{error && (
						<p className="rounded-lg bg-red-500/10 px-3 py-1.5 text-[12px] text-red-600">
							{error}
						</p>
					)}
					<button type="submit" disabled={loading} className={primaryBtnCls}>
						<span className="relative z-10">
							{loading ? "Creating account…" : "Create account"}
						</span>
					</button>
					<button
						type="button"
						onClick={() => switchMode("password")}
						className="cursor-pointer text-center text-[#0E1420]/55 text-[12px] transition-colors hover:text-[#0E1420]/70"
					>
						Already have an account? Sign in
					</button>
				</form>
				<TrustBar />
			</>
		);
	}

	// ── Password mode (default) ──────────────────────────────────────────────

	return (
		<>
			{/* 1. Brand row */}
			<BrandRow />

			{/* 2. Hero */}
			<div className="mb-4">
				<div className="font-black text-[#0E1420] text-[22px] leading-[1.15] tracking-tight">
					Your future
				</div>
				<div
					className="font-black text-[22px] leading-[1.15] tracking-tight"
					style={{ color: "#F5C842" }}
				>
					starts now.
				</div>
			</div>

			{/* 3. Google */}
			<button
				type="button"
				onClick={handleGoogle}
				className="mb-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-[#0E1420]/12 border-[1.5px] bg-white py-[11px] font-bold text-[#0E1420] text-[14px] transition-colors hover:bg-[#F4F7FC]"
			>
				<GoogleIcon />
				Continue with Google
			</button>

			{/* 4. Divider */}
			<OrDivider label="or email" />

			{/* 5 & 6. Inputs */}
			<form onSubmit={handlePassword} className="flex flex-col gap-2.5">
				<div>
					<label htmlFor="signin-email" className={labelCls}>
						Email
					</label>
					<input
						id="signin-email"
						type="email"
						required
						autoComplete="email"
						placeholder="your@email.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className={inputCls}
					/>
				</div>
				<div>
					<label htmlFor="signin-password" className={labelCls}>
						Password
					</label>
					<input
						id="signin-password"
						type="password"
						required
						autoComplete="current-password"
						placeholder="Your password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className={inputCls}
					/>
				</div>

				{error && (
					<p className="rounded-lg bg-red-500/10 px-3 py-1.5 text-[12px] text-red-600">
						{error}
					</p>
				)}

				{/* 7. CTA */}
				<button type="submit" disabled={loading} className={primaryBtnCls}>
					<span className="relative z-10">
						{loading ? "Signing in…" : "Sign in to North"}
					</span>
					{/* Shimmer sweep */}
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-y-0 w-[50%] animate-shimmer"
						style={{
							background:
								"linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
						}}
					/>
				</button>
			</form>

			{/* 8. Footer */}
			<div className="mb-3.5 flex items-center justify-center gap-2 text-[12px]">
				<span className="text-[#0E1420]/55">New here?</span>
				<button
					type="button"
					onClick={() => switchMode("signup")}
					className={switchLinkCls}
				>
					Create your account
				</button>
				<span className="text-[#0E1420]/40">·</span>
				<button
					type="button"
					onClick={() => switchMode("magic")}
					className="cursor-pointer text-[#0E1420]/50 text-[12px] transition-colors hover:text-[#0E1420]/70"
				>
					Magic link
				</button>
			</div>

			{/* 9. Trust bar */}
			<TrustBar />
		</>
	);
}
