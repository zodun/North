"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/auth-client";

type Mode = "password" | "magic" | "signup";

// ── Light "Collective" form on a white panel (paired with the dark photo side) ─

const inputCls =
	"h-14 w-full rounded-full border border-[#0E1420]/15 bg-white px-5 text-[15px] font-semibold text-[#0E1420] outline-none transition-all placeholder:font-normal placeholder:text-[#0E1420]/35 focus:border-[#005ac2] focus:shadow-[0_0_0_1px_#005ac2]";

const labelCls =
	"mb-2 ml-1 block font-bold text-[11px] text-[#0E1420]/70 uppercase tracking-[0.15em]";

const primaryBtnCls =
	"flex h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-full font-bold text-[14px] text-white uppercase tracking-[0.2em] transition-all hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50";

const primaryBtnStyle: React.CSSProperties = {
	background: "linear-gradient(135deg, #4d8eff 0%, #005ac2 100%)",
	boxShadow: "0 4px 20px rgba(0,90,194,0.25)",
};

const eyebrowCls =
	"mb-3 block font-bold text-[12px] text-[#005ac2] uppercase tracking-[0.15em]";

const switchLinkCls =
	"ml-1 cursor-pointer font-bold text-[#005ac2] transition-colors hover:text-[#0E1420]";

const headingCls = "mb-2 font-bold text-[#0E1420] text-[30px] leading-[1.2]";
const subCls = "text-[15px] text-[#0E1420]/65";
const SERIF = "'Libre Caslon Text', Georgia, serif";

// ── Icons ───────────────────────────────────────────────────────────────────

function ArrowIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2.4}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M5 12h14M13 6l6 6-6 6" />
		</svg>
	);
}

function EyeButton({
	shown,
	onClick,
}: {
	shown: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={shown ? "Hide password" : "Show password"}
			className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-[#0E1420]/40 transition-colors hover:text-[#005ac2]"
		>
			<svg
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
			>
				{shown ? (
					<>
						<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
						<path d="M1 1l22 22" />
					</>
				) : (
					<>
						<circle cx="12" cy="12" r="3" />
						<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
					</>
				)}
			</svg>
		</button>
	);
}

// ── Main component ───────────────────────────────────────────────────────────

export function ProductSignIn({ initialMode }: { initialMode?: Mode }) {
	const router = useRouter();
	const [mode, setMode] = useState<Mode>(initialMode ?? "password");
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
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

	const handleSignUp = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		if (password.length < 6) {
			setError("Password must be at least 6 characters.");
			return;
		}
		setLoading(true);
		// Stash the name in user metadata so onboarding's first step prefills it.
		const { error } = await supabase.auth.signUp({
			email,
			password,
			options: { data: { display_name: name.trim() || undefined } },
		});
		setLoading(false);
		if (error) {
			setError(error.message);
			return;
		}
		// Hard navigation so the proxy re-checks auth and routes to onboarding.
		window.location.href = "/onboarding";
	};

	const switchMode = (next: Mode) => {
		setError(null);
		setMode(next);
	};

	const errorBox = error ? (
		<p className="rounded-2xl bg-red-500/10 px-4 py-2.5 font-semibold text-[13px] text-red-600">
			{error}
		</p>
	) : null;

	// ── Sent state ───────────────────────────────────────────────────────────
	if (sent) {
		return (
			<div className="text-center">
				<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#005ac2]/10">
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="#005ac2"
						strokeWidth={2}
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<rect x="2" y="4" width="20" height="16" rx="2" />
						<path d="M2 7l10 7 10-7" />
					</svg>
				</div>
				<p className="font-bold text-[#0E1420] text-[18px]">Check your email</p>
				<p className="mt-1.5 text-[#0E1420]/65 text-[14px]">
					Magic link sent to <span className="text-[#0E1420]">{email}</span>
				</p>
				<button
					type="button"
					onClick={() => {
						setSent(false);
						switchMode("password");
					}}
					className="mt-6 cursor-pointer font-semibold text-[#0E1420]/60 text-[13px] transition-colors hover:text-[#0E1420]"
				>
					Back to sign in
				</button>
			</div>
		);
	}

	// ── Magic link mode ──────────────────────────────────────────────────────
	if (mode === "magic") {
		return (
			<div>
				<span className={eyebrowCls}>Passwordless</span>
				<h2 className={headingCls} style={{ fontFamily: SERIF }}>
					Magic link
				</h2>
				<form onSubmit={handleMagicLink} className="mt-8 space-y-6">
					<div>
						<label htmlFor="magic-email" className={labelCls}>
							Email
						</label>
						<input
							id="magic-email"
							type="email"
							required
							autoComplete="email"
							placeholder="you@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className={inputCls}
						/>
					</div>
					{errorBox}
					<button
						type="submit"
						disabled={loading}
						className={primaryBtnCls}
						style={primaryBtnStyle}
					>
						{loading ? "Sending…" : "Send magic link"}
						<ArrowIcon />
					</button>
				</form>
				<button
					type="button"
					onClick={() => switchMode("password")}
					className="mt-6 w-full cursor-pointer text-center font-semibold text-[#0E1420]/60 text-[13px] transition-colors hover:text-[#0E1420]"
				>
					Sign in with a password instead
				</button>
			</div>
		);
	}

	// ── Sign-up mode (the "Collective" form) ─────────────────────────────────
	if (mode === "signup") {
		return (
			<div>
				<div className="mb-10 text-center md:text-left">
					<span className={eyebrowCls}>New Collective Application</span>
					<h2 className={headingCls} style={{ fontFamily: SERIF }}>
						Create your North identity
					</h2>
					<p className={subCls}>The first step toward intentional growth.</p>
				</div>
				<form onSubmit={handleSignUp} className="space-y-6">
					<div>
						<label htmlFor="signup-name" className={labelCls}>
							Full name
						</label>
						<input
							id="signup-name"
							type="text"
							required
							autoComplete="name"
							placeholder="Alexander Thorne"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className={inputCls}
						/>
					</div>
					<div>
						<label htmlFor="signup-email" className={labelCls}>
							Email
						</label>
						<input
							id="signup-email"
							type="email"
							required
							autoComplete="email"
							placeholder="you@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className={inputCls}
						/>
					</div>
					<div>
						<label htmlFor="signup-password" className={labelCls}>
							Secure password
						</label>
						<div className="relative">
							<input
								id="signup-password"
								type={showPassword ? "text" : "password"}
								required
								autoComplete="new-password"
								placeholder="At least 6 characters"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className={`${inputCls} pr-12`}
							/>
							<EyeButton
								shown={showPassword}
								onClick={() => setShowPassword((v) => !v)}
							/>
						</div>
					</div>
					{errorBox}
					<button
						type="submit"
						disabled={loading}
						className={primaryBtnCls}
						style={primaryBtnStyle}
					>
						{loading ? "Creating account…" : "Join the Collective"}
						<ArrowIcon />
					</button>
				</form>
				<div className="mt-10 border-[#0E1420]/10 border-t pt-8 text-center">
					<p className="font-medium text-[#0E1420]/60 text-[14px]">
						Already have access?
						<button
							type="button"
							onClick={() => switchMode("password")}
							className={switchLinkCls}
						>
							Sign in
						</button>
					</p>
				</div>
			</div>
		);
	}

	// ── Password (sign-in) mode, default ─────────────────────────────────────
	return (
		<div>
			<div className="mb-10 text-center md:text-left">
				<span className={eyebrowCls}>Member Access</span>
				<h2 className={headingCls} style={{ fontFamily: SERIF }}>
					Welcome back
				</h2>
				<p className={subCls}>Sign in to continue your direction.</p>
			</div>
			<form onSubmit={handlePassword} className="space-y-6">
				<div>
					<label htmlFor="signin-email" className={labelCls}>
						Email
					</label>
					<input
						id="signin-email"
						type="email"
						required
						autoComplete="email"
						placeholder="you@example.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className={inputCls}
					/>
				</div>
				<div>
					<label htmlFor="signin-password" className={labelCls}>
						Password
					</label>
					<div className="relative">
						<input
							id="signin-password"
							type={showPassword ? "text" : "password"}
							required
							autoComplete="current-password"
							placeholder="Your password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className={`${inputCls} pr-12`}
						/>
						<EyeButton
							shown={showPassword}
							onClick={() => setShowPassword((v) => !v)}
						/>
					</div>
				</div>
				{errorBox}
				<button
					type="submit"
					disabled={loading}
					className={primaryBtnCls}
					style={primaryBtnStyle}
				>
					{loading ? "Signing in…" : "Sign in to North"}
					<ArrowIcon />
				</button>
			</form>
			<div className="mt-10 border-[#0E1420]/10 border-t pt-8 text-center text-[14px]">
				<p className="font-medium text-[#0E1420]/60">
					New here?
					<button
						type="button"
						onClick={() => switchMode("signup")}
						className={switchLinkCls}
					>
						Join the Collective
					</button>
				</p>
				<button
					type="button"
					onClick={() => switchMode("magic")}
					className="mt-2 cursor-pointer font-medium text-[#0E1420]/45 text-[13px] transition-colors hover:text-[#0E1420]/80"
				>
					Use a magic link instead
				</button>
			</div>
		</div>
	);
}
