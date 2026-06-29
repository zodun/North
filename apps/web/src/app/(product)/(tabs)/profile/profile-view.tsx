"use client";

import { PreferencesSection } from "./preferences-section";
import { PurposeBadge } from "./purpose-badge";
import { TelegramReminders } from "./telegram-reminders";

// ─────────────────────────────────────────────────────────────────────────────
// Profile, Stitch "Signal & Noise" editorial design, WIRED to the real profile
// backend. Light canvas, glass cards, Sora + Libre Caslon, consistent with the
// Journal and Community screens. All data is real (profiles, streaks, signal
// scores, monthly mission, saved opportunities); the editable PreferencesSection
// keeps its own Supabase wiring.
// ─────────────────────────────────────────────────────────────────────────────

const PRIMARY = "#005ac2";
const AMBER = "#ee9800";
const VIOLET = "#7B61FF";
const TEAL = "#3ECFBF";
const GOLD = "#F5C842";
const ON_SURFACE = "#131313";
const ON_VARIANT = "#424754";
const SERIF = "'Libre Caslon Text', Georgia, serif";
const SANS = "'Sora', system-ui, sans-serif";
const FONT_SHEET =
	"https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&display=swap";
const ICON_SHEET =
	"https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block";

const NAV = [
	{ href: "/for-you", label: "For You", icon: "auto_awesome" },
	{ href: "/mission", label: "Mission", icon: "target" },
	{ href: "/opportunities", label: "Opportunities", icon: "trending_up" },
	{ href: "/journal", label: "Journal", icon: "menu_book" },
	{ href: "/community", label: "Community", icon: "group" },
];

// 7-segment band: drifting (violet) · finding (teal) · aligned (gold), these
// hues carry meaning per the brand and are kept even in the blue/amber screen.
const SEGMENTS = [
	{ id: "d1", color: VIOLET },
	{ id: "d2", color: VIOLET },
	{ id: "f1", color: TEAL },
	{ id: "f2", color: TEAL },
	{ id: "a1", color: GOLD },
	{ id: "a2", color: GOLD },
	{ id: "cap", color: "rgba(0,0,0,0.06)" },
];

type Props = {
	displayName: string;
	statementOfIntent: string | null;
	seasonLabel: string | null;
	timeBudgetLabel: string | null;
	goalTitle: string | null;
	goalMonth: string | null;
	goalDone: number;
	goalTotal: number;
	goalUnit: string;
	goalHue: string;
	focusAreas: { id: string; label: string; hue: string }[];
	streaks28: number[];
	dayLabels28: string[];
	rhythmStreak: number;
	tasksCompleted: number;
	tasksTotal: number;
	signalScore: number | null;
	signalBand: string | null;
	signalTrend: "climbing" | "holding" | "easing" | null;
	savedCount: number;
	savedOpportunities: { id: string; title: string; org: string }[];
	isPremium: boolean;
	hasSubscription: boolean;
	userId: string;
	careerStage: string | null;
	fields: string[];
	country: string | null;
	openToRemote: boolean;
	openToRelocate: boolean;
	telegramLinked: boolean;
	telegramEnabled: boolean;
	telegramFrequency: "daily" | "weekdays" | "weekly";
	purposeMode: "explorer" | "builder" | null;
};

export function ProfileView({
	displayName,
	statementOfIntent,
	seasonLabel,
	timeBudgetLabel,
	goalTitle,
	goalMonth,
	goalDone,
	goalTotal,
	goalUnit,
	focusAreas,
	streaks28,
	rhythmStreak,
	tasksCompleted,
	tasksTotal,
	signalScore,
	signalBand,
	signalTrend,
	savedCount,
	savedOpportunities,
	isPremium,
	hasSubscription,
	userId,
	careerStage,
	fields,
	country,
	openToRemote,
	openToRelocate,
	telegramLinked,
	telegramEnabled,
	telegramFrequency,
	purposeMode,
}: Props) {
	const litCount =
		signalScore != null
			? Math.min(7, Math.max(1, Math.round((signalScore / 100) * 7)))
			: 0;
	const goalPct = goalTotal > 0 ? Math.round((goalDone / goalTotal) * 100) : 0;
	const statement = statementOfIntent ?? seasonLabel;
	const trendLabel =
		signalTrend === "climbing"
			? "Climbing"
			: signalTrend === "easing"
				? "Easing"
				: signalTrend === "holding"
					? "Holding"
					: null;

	return (
		<div style={{ background: "#fcfdfe", color: ON_SURFACE, fontFamily: SANS }}>
			<link rel="preconnect" href="https://fonts.googleapis.com" />
			<link
				rel="preconnect"
				href="https://fonts.gstatic.com"
				crossOrigin="anonymous"
			/>
			<link rel="stylesheet" href={FONT_SHEET} precedence="default" />
			<link rel="stylesheet" href={ICON_SHEET} precedence="default" />
			<style>{SCOPED_CSS}</style>

			<Sidebar />

			<div className="ch-main relative min-h-screen">
				<TopBar isPremium={isPremium} />
				<div className="cm-aura" aria-hidden="true" />
				<div className="grain-overlay" aria-hidden="true" />
				<div className="relative z-[1] px-5 pb-6 sm:px-6 lg:px-8">
					<div className="mx-auto max-w-6xl">
						{/* ── Identity ────────────────────────────────────────── */}
						<header className="mt-4 mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-7">
							<div
								className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full font-bold text-3xl"
								style={{
									background:
										"linear-gradient(135deg, rgba(0,90,194,0.18), rgba(62,207,191,0.22))",
									border: "1px solid rgba(0,90,194,0.18)",
									color: PRIMARY,
									fontFamily: SERIF,
								}}
							>
								{displayName[0]?.toUpperCase()}
							</div>
							<div className="min-w-0">
								<span
									className="mb-1 block font-bold text-[11px] uppercase tracking-[0.2em]"
									style={{ color: PRIMARY }}
								>
									Your profile
								</span>
								<h1
									className="font-bold text-4xl tracking-tight sm:text-5xl"
									style={{ fontFamily: SERIF }}
								>
									{displayName}
								</h1>
								{timeBudgetLabel && (
									<p
										className="mt-1 text-sm"
										style={{ color: ON_VARIANT, opacity: 0.7 }}
									>
										{timeBudgetLabel} a day
									</p>
								)}
							</div>
						</header>

						{statement && (
							<p
								className="mb-8 max-w-3xl text-lg italic leading-relaxed"
								style={{ color: ON_VARIANT, fontFamily: SERIF }}
							>
								“{statement}”
							</p>
						)}

						{focusAreas.length > 0 && (
							<div className="mb-8 flex flex-wrap gap-2">
								{focusAreas.map((fa) => (
									<span
										key={fa.id}
										className="rounded-full border px-4 py-1.5 font-bold text-xs"
										style={{
											color: ON_SURFACE,
											backgroundColor: `${fa.hue}24`,
											borderColor: `${fa.hue}66`,
										}}
									>
										{fa.label}
									</span>
								))}
							</div>
						)}

						<PurposeBadge userId={userId} initialMode={purposeMode} />

						{/* ── Stat cards ──────────────────────────────────────── */}
						<div className="mb-6 grid grid-cols-12 gap-6">
							{/* Where you are, signal */}
							<section className="glass-card signal-glow-blue col-span-12 flex flex-col rounded-[2rem] p-8 lg:col-span-7">
								<div className="mb-6 flex items-start justify-between gap-4">
									<div>
										<span
											className="mb-1 block font-bold text-[11px] uppercase tracking-[0.2em]"
											style={{ color: PRIMARY }}
										>
											Where you are
										</span>
										<h2
											className="font-bold text-2xl tracking-tight"
											style={{ fontFamily: SERIF }}
										>
											{signalBand ?? "Building your signal"}
										</h2>
									</div>
									{trendLabel && (
										<span
											className="shrink-0 rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-wider"
											style={{
												color: PRIMARY,
												background: "rgba(0,90,194,0.1)",
											}}
										>
											{trendLabel}
										</span>
									)}
								</div>
								<div className="mt-auto">
									<div className="mb-2 flex justify-end">
										{signalScore != null && (
											<span
												className="font-bold text-sm"
												style={{ color: ON_VARIANT }}
											>
												Score {signalScore}
											</span>
										)}
									</div>
									<div className="flex h-2 gap-1 overflow-hidden rounded-full">
										{SEGMENTS.map((seg, i) => (
											<div
												key={seg.id}
												className="h-full flex-1 rounded-full"
												style={{
													backgroundColor: seg.color,
													opacity: i === 6 ? 1 : i < litCount ? 1 : 0.18,
												}}
											/>
										))}
									</div>
								</div>
							</section>

							{/* Rhythm */}
							<section className="glass-card col-span-12 flex flex-col rounded-[2rem] p-8 lg:col-span-5">
								<span
									className="mb-1 block font-bold text-[11px] uppercase tracking-[0.2em]"
									style={{ color: PRIMARY }}
								>
									Rhythm
								</span>
								<div className="mb-5 flex items-baseline gap-2">
									<span
										className="font-bold text-4xl tracking-tight"
										style={{ fontFamily: SERIF }}
									>
										{rhythmStreak}
									</span>
									<span
										className="text-sm"
										style={{ color: ON_VARIANT, opacity: 0.7 }}
									>
										{rhythmStreak === 1 ? "day" : "days"} in rhythm
									</span>
								</div>
								<div className="flex h-16 items-end gap-[3px]">
									{streaks28.map((state, i) => {
										const inRhythm = state >= 2;
										const height = state >= 2 ? 100 : state === 1 ? 55 : 22;
										return (
											<div
												// biome-ignore lint/suspicious/noArrayIndexKey: fixed-length positional 28-day chart
												key={i}
												className="rhythm-bar flex-1 rounded-full"
												style={{
													height: `${height}%`,
													background: inRhythm
														? PRIMARY
														: state === 1
															? "rgba(0,90,194,0.4)"
															: "rgba(0,0,0,0.08)",
												}}
											/>
										);
									})}
								</div>
								<div className="mt-3 flex items-center justify-between">
									<span
										className="text-xs"
										style={{ color: ON_VARIANT, opacity: 0.55 }}
									>
										Last 28 days
									</span>
									{tasksTotal > 0 && (
										<span
											className="text-xs"
											style={{ color: ON_VARIANT, opacity: 0.7 }}
										>
											{tasksCompleted} of {tasksTotal} tasks this week
										</span>
									)}
								</div>
							</section>

							{/* This month's goal */}
							{goalTitle && (
								<section className="glass-card signal-glow-amber col-span-12 flex flex-col rounded-[2rem] p-8 lg:col-span-7">
									<span
										className="mb-1 block font-bold text-[11px] uppercase tracking-[0.2em]"
										style={{ color: AMBER }}
									>
										{goalMonth} goal
									</span>
									<h2
										className="mb-5 font-bold text-2xl leading-snug tracking-tight"
										style={{ fontFamily: SERIF }}
									>
										{goalTitle}
									</h2>
									<div className="mt-auto">
										<div className="mb-2 flex items-center justify-between">
											<span
												className="text-sm"
												style={{ color: ON_VARIANT, opacity: 0.7 }}
											>
												{goalDone} of {goalTotal} {goalUnit}
											</span>
											<span
												className="font-bold text-sm"
												style={{ color: AMBER }}
											>
												{goalPct}%
											</span>
										</div>
										<div className="h-2 overflow-hidden rounded-full bg-black/10">
											<div
												className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
												style={{
													width: `${goalPct}%`,
													background: `linear-gradient(90deg, ${AMBER}, ${GOLD})`,
												}}
											/>
										</div>
									</div>
								</section>
							)}

							{/* Premium */}
							<section
								className={`glass-card col-span-12 flex flex-col rounded-[2rem] p-8 ${
									goalTitle ? "lg:col-span-5" : "lg:col-span-7"
								}`}
							>
								<span
									className="mb-1 block font-bold text-[11px] uppercase tracking-[0.2em]"
									style={{ color: VIOLET }}
								>
									Premium
								</span>
								{isPremium ? (
									<>
										<div className="mb-2 flex items-center gap-2">
											<h2
												className="font-bold text-xl tracking-tight"
												style={{ fontFamily: SERIF }}
											>
												North Premium
											</h2>
											<span
												className="rounded-full px-2 py-0.5 font-bold text-[10px] uppercase tracking-wider"
												style={{
													color: VIOLET,
													background: "rgba(123,97,255,0.14)",
												}}
											>
												Active
											</span>
										</div>
										<p
											className="text-sm leading-relaxed"
											style={{ color: ON_VARIANT, opacity: 0.8 }}
										>
											AI tailors your feed and opportunities to you.
										</p>
										{hasSubscription ? (
											<a
												href="/api/billing/portal"
												className="mt-auto pt-5 font-semibold text-xs underline-offset-2 hover:underline"
												style={{ color: ON_VARIANT }}
											>
												Manage subscription
											</a>
										) : (
											<a
												href="/api/billing/checkout"
												className="mt-auto pt-5 font-semibold text-xs underline-offset-2 hover:underline"
												style={{ color: ON_VARIANT }}
											>
												Upgrade to keep Premium
											</a>
										)}
									</>
								) : (
									<>
										<h2
											className="mb-2 font-bold text-xl leading-snug tracking-tight"
											style={{ fontFamily: SERIF }}
										>
											Make North truly yours
										</h2>
										<p
											className="text-sm leading-relaxed"
											style={{ color: ON_VARIANT, opacity: 0.8 }}
										>
											Premium uses AI to rank your feed and opportunities around
											your focus, goal, and interests, with a reason for every
											pick.
										</p>
										<a
											href="/api/billing/checkout"
											className="mt-auto inline-flex w-fit items-center rounded-xl px-6 py-3 font-bold text-sm text-white uppercase tracking-wider"
											style={{
												background: VIOLET,
												marginTop: "1.25rem",
											}}
										>
											Upgrade to Premium
										</a>
									</>
								)}
							</section>
						</div>

						{/* ── How North sustains itself (business model) ──────── */}
						<section className="glass-card mb-6 rounded-[2rem] p-8">
							<span
								className="mb-2 block font-bold text-[11px] uppercase tracking-[0.2em]"
								style={{ color: "#8A6A00" }}
							>
								How North sustains itself
							</span>
							<p
								className="mb-5 max-w-2xl text-sm leading-relaxed"
								style={{ color: ON_VARIANT, opacity: 0.85 }}
							>
								North earns from your direction, never your attention. Three
								streams fund the work, none of them engagement bait.
							</p>
							<ul className="flex flex-col gap-3">
								{[
									{
										color: VIOLET,
										ink: "#5B43E0",
										name: "Premium subscriptions",
										desc: "AI ranks your feed and opportunities to your focus, goal, and interests.",
										status: "Live",
									},
									{
										color: TEAL,
										ink: "#0A8F7F",
										name: "Opportunity placements",
										desc: "Scholarships, programs, and employers reach the right people by fit, not by bidding for eyeballs.",
										status: "Planned",
									},
									{
										color: GOLD,
										ink: "#8A6A00",
										name: "Ads",
										desc: "Calm, contextual placements matched to your direction, clearly labeled, never the doom-scroll kind.",
										status: "Coming",
									},
								].map((s) => (
									<li
										key={s.name}
										className="flex items-start gap-3 rounded-2xl border border-black/5 p-4"
									>
										<span
											className="mt-[7px] h-2.5 w-2.5 shrink-0 rounded-full"
											style={{ background: s.color }}
										/>
										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<span
													className="font-bold text-sm"
													style={{ color: ON_SURFACE }}
												>
													{s.name}
												</span>
												<span
													className="rounded-full px-2 py-0.5 font-bold text-[10px] uppercase tracking-wider"
													style={{ color: s.ink, background: `${s.color}24` }}
												>
													{s.status}
												</span>
											</div>
											<p
												className="mt-1 text-[13px] leading-relaxed"
												style={{ color: ON_VARIANT, opacity: 0.8 }}
											>
												{s.desc}
											</p>
										</div>
									</li>
								))}
							</ul>
						</section>

						{/* ── Saved ───────────────────────────────────────────── */}
						<section className="glass-card mb-6 rounded-[2rem] p-8">
							<span
								className="mb-5 block font-bold text-[11px] uppercase tracking-[0.2em]"
								style={{ color: PRIMARY }}
							>
								Saved opportunities
							</span>
							{savedCount === 0 ? (
								<p
									className="text-sm leading-relaxed"
									style={{ color: ON_VARIANT }}
								>
									Bookmark an opportunity and it lands here, so the moves you're
									weighing stay in one place.{" "}
									<a
										href="/opportunities"
										className="font-bold"
										style={{ color: PRIMARY }}
									>
										Browse opportunities
									</a>
								</p>
							) : (
								<div className="grid gap-3 sm:grid-cols-2">
									{savedOpportunities.map((opp) => (
										<a
											key={opp.id}
											href="/opportunities"
											className="group flex items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white/60 px-5 py-4 transition-colors hover:border-[#005ac2]/30"
										>
											<div className="min-w-0">
												<p className="truncate font-bold text-sm">
													{opp.title}
												</p>
												<p
													className="truncate text-xs"
													style={{ color: ON_VARIANT, opacity: 0.6 }}
												>
													{opp.org}
												</p>
											</div>
											<span
												className="material-symbols-outlined transition-transform group-hover:translate-x-1"
												style={{ color: PRIMARY }}
											>
												arrow_forward
											</span>
										</a>
									))}
								</div>
							)}
						</section>

						{/* ── Telegram reminders (connect via bot) ────────────── */}
						<section className="glass-card mb-6 rounded-[2rem] p-8">
							<TelegramReminders
								userId={userId}
								initialLinked={telegramLinked}
								initialEnabled={telegramEnabled}
								initialFrequency={telegramFrequency}
							/>
						</section>

						{/* ── Preferences (editable; steers For You + Opportunities) ── */}
						<section className="glass-card mb-8 rounded-[2rem] p-8">
							<PreferencesSection
								userId={userId}
								careerStage={careerStage}
								fields={fields}
								country={country}
								openToRemote={openToRemote}
								openToRelocate={openToRelocate}
							/>
						</section>

						{/* ── Sign out ────────────────────────────────────────── */}
						<form action="/auth/signout" method="POST" className="text-center">
							<button
								type="submit"
								className="font-semibold text-xs transition-colors hover:underline"
								style={{ color: ON_VARIANT, opacity: 0.6 }}
							>
								Sign out
							</button>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
}

function TopBar({ isPremium }: { isPremium: boolean }) {
	return (
		<header
			className="sticky top-0 z-40 px-5 py-3 backdrop-blur-md sm:px-6 lg:px-8"
			style={{ background: "rgba(248,249,250,0.7)" }}
		>
			<div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
				<span
					className="font-bold text-xl tracking-tight md:hidden"
					style={{ fontFamily: SERIF, color: ON_SURFACE }}
				>
					Profile
				</span>
				<span className="hidden md:block" />
				<div className="flex items-center gap-4">
					{isPremium && (
						<span
							className="hidden rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-wider sm:inline"
							style={{ color: VIOLET, background: "rgba(123,97,255,0.12)" }}
						>
							Premium
						</span>
					)}
					<a href="/for-you" aria-label="Home" className="relative">
						<span
							className="material-symbols-outlined"
							style={{ color: ON_VARIANT }}
						>
							home
						</span>
					</a>
				</div>
			</div>
		</header>
	);
}

function Sidebar() {
	return (
		<aside className="ch-rail px-6 py-8">
			<a
				href="/for-you"
				aria-label="North home"
				className="mb-12 flex items-center gap-3 px-2"
			>
				<svg
					className="h-9 w-9 shrink-0"
					viewBox="0 0 100 100"
					fill={PRIMARY}
					aria-hidden="true"
				>
					<path d="M50 3 L58 42 L97 50 L58 58 L50 97 L42 58 L3 50 L42 42 Z" />
				</svg>
				<span
					className="font-bold text-3xl tracking-tighter"
					style={{ fontFamily: SERIF, color: ON_SURFACE }}
				>
					North
				</span>
			</a>
			<nav className="flex-1 space-y-1">
				{NAV.map((n) => (
					<a
						key={n.href}
						href={n.href}
						className="flex items-center gap-4 rounded-xl px-4 py-3 transition-colors"
						style={{ color: ON_VARIANT }}
					>
						<span className="material-symbols-outlined">{n.icon}</span>
						<span className="font-medium text-sm">{n.label}</span>
					</a>
				))}
			</nav>
			<div className="space-y-1 border-black/5 border-t pt-8">
				<a
					href="/profile"
					aria-current="page"
					className="flex items-center gap-4 rounded-xl px-4 py-3"
					style={{
						color: PRIMARY,
						fontWeight: 700,
						background: "rgba(0,90,194,0.05)",
					}}
				>
					<span
						className="material-symbols-outlined"
						style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}
					>
						person
					</span>
					<span className="font-bold text-sm">Profile</span>
				</a>
			</div>
		</aside>
	);
}

const SCOPED_CSS = `
.material-symbols-outlined {
	font-family: 'Material Symbols Outlined';
	font-weight: normal; font-style: normal; line-height: 1; letter-spacing: normal;
	text-transform: none; display: inline-block; white-space: nowrap; word-wrap: normal;
	direction: ltr; -webkit-font-feature-settings: 'liga'; font-feature-settings: 'liga';
	-webkit-font-smoothing: antialiased; width: 1em; overflow: hidden;
}
/* Exact Stitch recipe: frosted glass over the colour aura, with a top-left
   sheen. backdrop-filter needs something behind it, the .cm-aura provides it. */
.glass-card { position: relative; overflow: hidden; background: rgba(255,255,255,0.55); backdrop-filter: blur(40px) saturate(180%); -webkit-backdrop-filter: blur(40px) saturate(180%); border: 0.5px solid rgba(255,255,255,0.8); box-shadow: 0 8px 32px -4px rgba(0,0,0,0.05); transition: box-shadow .3s, transform .3s; }
.glass-card::before { content: ""; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%); pointer-events: none; }
.glass-card > * { position: relative; }
.glass-card:hover { box-shadow: 0 18px 44px -8px rgba(0,0,0,0.09); transform: translateY(-2px); }
.grain-overlay { position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: 0.02; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
.signal-glow-blue { box-shadow: 0 20px 50px -12px rgba(0,90,194,0.25); }
.signal-glow-amber { box-shadow: 0 20px 50px -12px rgba(238,152,0,0.18); }
.rhythm-bar { transition: height 1s cubic-bezier(0.4, 0, 0.2, 1); min-height: 6px; }
.cm-aura { position: absolute; top: 0; left: 0; right: 0; height: 460px; z-index: 0; pointer-events: none;
	background:
		radial-gradient(60% 80% at 12% -12%, rgba(0,90,194,0.12), transparent 60%),
		radial-gradient(50% 75% at 96% -8%, rgba(62,207,191,0.14), transparent 60%),
		radial-gradient(42% 60% at 62% -22%, rgba(245,200,66,0.12), transparent 55%);
}
/* Critical layout, server-rendered: fixed sidebar + content offset before fonts
   load. Phones use the bottom tab bar. */
.ch-rail { position: fixed; left: 0; top: 0; height: 100%; width: 280px; z-index: 50; display: none; flex-direction: column; background: rgba(255,255,255,0.85); border-right: 1px solid rgba(0,0,0,0.06); backdrop-filter: blur(12px); }
.ch-main { margin-left: 0; padding-bottom: 7rem; }
@media (min-width: 768px) { .ch-rail { display: flex; } .ch-main { margin-left: 280px; padding-bottom: 2.5rem; } }
@media (prefers-reduced-motion: reduce) { .glass-card, .rhythm-bar { transition: none; } }
`;
