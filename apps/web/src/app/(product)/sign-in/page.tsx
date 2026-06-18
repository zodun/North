import type { Metadata } from "next";
import { ProductSignIn } from "./form";

export const metadata: Metadata = { title: "North | Join the Collective" };

const SERIF = "'Libre Caslon Text', Georgia, serif";
const SANS = "'Sora', system-ui, sans-serif";
const FONT_SHEET =
	"https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Sora:wght@300;400;500;600&display=swap";

// Brand-side imagery from the Stitch mockup (the obsidian spire).
const SPIRE_IMG =
	"https://lh3.googleusercontent.com/aida-public/AB6AXuAT7hg6KUcsEOdI3UKNhMzwXzndWWdnsFTuvyZd_Rdh3CrAG-jjKL5YxFykAeRw6mvmsjGehhDKWeYGDzVEQo8LFd3C6KEsSvRlE69KxW717osJkV8dwN0Dn6GnhJ8th1WjQSi7w8AtTgDl-mqrsXGIwo1VRXXAjazxIiPM3NU-LNhKUMzSflJZIO8uJfWWmKTC0kp0NfRWz5I3b2gCuv5GTbpowEhAWLDEWCqKjPjBjAK-FeYTL1mDDzGZQ5tlCRteMUR62Vrv1dA";

const SCOPED_CSS = `
@keyframes signin-drift { from { transform: scale(1.1); } to { transform: scale(1.2); } }
.signin-drift { animation: signin-drift 60s linear infinite alternate; }
@media (prefers-reduced-motion: reduce) { .signin-drift { animation: none; } }
`;

export default async function SignInPage({
	searchParams,
}: {
	searchParams: Promise<{ mode?: string }>;
}) {
	// /sign-in?mode=signup opens straight on the sign-up view (SSR, no flash).
	const { mode } = await searchParams;
	const initialMode = mode === "signup" ? "signup" : undefined;

	return (
		<div
			className="min-h-svh w-full overflow-hidden bg-[#1a1a1a] text-[#e5e2e1]"
			style={{ fontFamily: SANS }}
		>
			<link rel="preconnect" href="https://fonts.googleapis.com" />
			<link
				rel="preconnect"
				href="https://fonts.gstatic.com"
				crossOrigin="anonymous"
			/>
			<link rel="stylesheet" href={FONT_SHEET} precedence="default" />
			<style>{SCOPED_CSS}</style>

			<main className="flex min-h-svh w-full flex-col overflow-hidden md:flex-row">
				{/* ── Brand visual side ──────────────────────────────────────── */}
				<section className="relative flex min-h-[36vh] w-full flex-col justify-between overflow-hidden bg-black p-8 md:min-h-svh md:w-[45%] md:p-16 lg:w-[40%]">
					<div className="absolute inset-0 z-0">
						{/* Dark scrim so the light wording stays readable over the photo,
						    strongest at top (logo) and bottom (headline). */}
						<div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/55 to-black/45" />
						<div
							className="signin-drift h-full w-full bg-center bg-cover opacity-60"
							style={{ backgroundImage: `url('${SPIRE_IMG}')` }}
						/>
					</div>

					{/* Logo / wordmark, pinned to the top. */}
					<div className="relative z-20 flex items-center gap-3">
						<svg
							className="h-9 w-9 shrink-0"
							viewBox="0 0 100 100"
							fill="#F5C842"
							aria-hidden="true"
						>
							<path d="M50 3 L58 42 L97 50 L58 58 L50 97 L42 58 L3 50 L42 42 Z" />
						</svg>
						<span
							className="font-bold text-3xl tracking-tight"
							style={{ fontFamily: SERIF }}
						>
							North
						</span>
					</div>

					{/* Headline + subcopy + members, grouped low on the panel. */}
					<div className="relative z-20 max-w-lg">
						<h1
							className="mb-6 text-balance font-bold text-[44px] leading-[1.08] tracking-tight md:text-[56px] lg:text-[64px]"
							style={{ fontFamily: SERIF }}
						>
							Join the Top 1% of{" "}
							<span className="italic">Strategic Thinkers.</span>
						</h1>
						<p
							className="max-w-sm text-[#d4d7e0] text-[17px] leading-relaxed"
							style={{ fontWeight: 300 }}
						>
							Access elite insights, advanced networks, and the tools required
							to navigate the ascendant path.
						</p>
					</div>
				</section>

				{/* ── Form side ──────────────────────────────────────────────── */}
				<section className="flex w-full flex-1 items-center justify-center bg-[#f4f5f8] p-6 md:w-[55%] md:p-12 lg:w-[60%] lg:p-24">
					<div className="w-full max-w-md">
						<ProductSignIn initialMode={initialMode} />
					</div>
				</section>
			</main>
		</div>
	);
}
