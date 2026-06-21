"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/auth-client";

// ─────────────────────────────────────────────────────────────────────────────
// Journal, "Signal & Noise" Stitch design, WIRED to the real reflect backend.
//
// Light editorial canvas matching the Stitch mockup (gradient-border composer +
// bento analysis grid), but every action hits Supabase:
//   • compose → reflect Edge Function (writes user_reflections + analysis)
//   • grid    → past reflections, flattened into real signal / noise observations
//   • filter  → All / Signals / Noise (client-side over real analysis data)
// Styling uses inline tokens + a scoped <style> (no Play-CDN), so the layout is
// correct before paint and never leaks into other routes.
// ─────────────────────────────────────────────────────────────────────────────

export type JournalEntry = {
	id: string;
	dateLabel: string;
	body: string;
	read: string;
	signal: string[];
	noise: string[];
};

type Analysis = { signal: string[]; noise: string[]; read: string };

const PRIMARY = "#005ac2";
const SIGNAL = "#0E9E73"; // on-course, what moved you toward your direction
const NOISE = "#7B61FF"; // drift, what pulled you away
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

type Filter = "all" | "signal" | "noise";
type PartOfDay = "morning" | "afternoon" | "evening";

// The reflect model returns phrases lowercase ("lowercase unless a proper
// noun"); capitalize the first letter so every observation reads as a sentence.
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

type Observation = {
	key: string;
	kind: "signal" | "noise";
	text: string;
	read: string;
	dateLabel: string;
};

// ── Web Speech API (not in the standard TS DOM lib) ──────────────────────────
type SpeechResult = { isFinal: boolean; 0: { transcript: string } };
type SpeechEvent = { resultIndex: number; results: ArrayLike<SpeechResult> };
type Recognition = {
	lang: string;
	continuous: boolean;
	interimResults: boolean;
	start: () => void;
	stop: () => void;
	onresult: ((e: SpeechEvent) => void) | null;
	onend: (() => void) | null;
	onerror: (() => void) | null;
};
type RecognitionCtor = new () => Recognition;

function getRecognitionCtor(): RecognitionCtor | null {
	if (typeof window === "undefined") return null;
	const w = window as unknown as {
		SpeechRecognition?: RecognitionCtor;
		webkitSpeechRecognition?: RecognitionCtor;
	};
	return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function flatten(entries: JournalEntry[]): Observation[] {
	const out: Observation[] = [];
	for (const e of entries) {
		e.signal.forEach((text, i) => {
			out.push({
				key: `${e.id}-s-${i}`,
				kind: "signal",
				text,
				read: e.read,
				dateLabel: e.dateLabel,
			});
		});
		e.noise.forEach((text, i) => {
			out.push({
				key: `${e.id}-n-${i}`,
				kind: "noise",
				text,
				read: e.read,
				dateLabel: e.dateLabel,
			});
		});
	}
	return out;
}

export function JournalView({
	firstName,
	greeting,
	partOfDay,
	todayLabel,
	entryDate,
	band,
	entryCount,
	daysThisWeek,
	initialEntries,
}: {
	firstName: string;
	greeting: string;
	partOfDay: PartOfDay;
	todayLabel: string;
	entryDate: string;
	band: string | null;
	entryCount: number;
	daysThisWeek: number;
	initialEntries: JournalEntry[];
}) {
	const [entries, setEntries] = useState(initialEntries);
	const [text, setText] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [listening, setListening] = useState(false);
	const [voiceSupported, setVoiceSupported] = useState(false);
	const [filter, setFilter] = useState<Filter>("all");
	const [latest, setLatest] = useState<Analysis | null>(
		initialEntries[0]
			? {
					signal: initialEntries[0].signal,
					noise: initialEntries[0].noise,
					read: initialEntries[0].read,
				}
			: null,
	);
	const recognitionRef = useRef<Recognition | null>(null);

	useEffect(() => {
		setVoiceSupported(getRecognitionCtor() !== null);
	}, []);

	function toggleVoice() {
		if (listening) {
			recognitionRef.current?.stop();
			return;
		}
		const Ctor = getRecognitionCtor();
		if (!Ctor) return;
		const rec = new Ctor();
		rec.lang = "en-US";
		rec.continuous = true;
		rec.interimResults = false;
		rec.onresult = (e) => {
			let chunk = "";
			for (let i = e.resultIndex; i < e.results.length; i++) {
				const r = e.results[i];
				if (r.isFinal) chunk += r[0].transcript;
			}
			const clean = chunk.trim();
			if (clean) setText((prev) => (prev ? `${prev} ${clean}` : clean));
		};
		rec.onend = () => setListening(false);
		rec.onerror = () => setListening(false);
		recognitionRef.current = rec;
		rec.start();
		setListening(true);
	}

	async function submit() {
		const body = text.trim();
		if (!body || submitting) return;
		recognitionRef.current?.stop();
		setSubmitting(true);
		try {
			const { data, error } = await supabase.functions.invoke("reflect", {
				body: { body, entry_date: entryDate },
			});
			if (!error && data?.analysis) {
				const a = data.analysis as Analysis;
				setLatest(a);
				const entryId =
					(data.reflection_id as string | undefined) ??
					`local-${entries.length}`;
				setEntries((prev) => [
					{
						id: entryId,
						dateLabel: todayLabel,
						body,
						read: a.read,
						signal: a.signal,
						noise: a.noise,
					},
					...prev.filter((e) => e.dateLabel !== todayLabel),
				]);
				setText("");
			}
		} finally {
			setSubmitting(false);
		}
	}

	const observations = useMemo(() => {
		const all = flatten(entries);
		if (filter === "all") return all;
		return all.filter((o) => o.kind === filter);
	}, [entries, filter]);

	const signalCount = useMemo(
		() => entries.reduce((n, e) => n + e.signal.length, 0),
		[entries],
	);
	const noiseCount = useMemo(
		() => entries.reduce((n, e) => n + e.noise.length, 0),
		[entries],
	);

	const bandLabel = band ?? (entryCount > 0 ? "Finding" : "New");

	// Speak to the person, not "the user". Fall back gracefully when we don't
	// have a real name (the server passes "there" as a placeholder).
	const name = firstName && firstName !== "there" ? firstName : null;
	const tail = name ? `, ${name}` : "";
	// Time-aware opener so the prompt meets the person where their day is.
	const composerPrompt =
		partOfDay === "morning"
			? `What's on your mind this morning${tail}?`
			: partOfDay === "evening"
				? `How did today go${tail}?`
				: `What pulled your attention today${tail}?`;
	const returning = entryCount > 0;
	const rhythm =
		daysThisWeek > 0
			? `You've reflected ${daysThisWeek} ${daysThisWeek === 1 ? "day" : "days"} this week. Keep the thread going.`
			: "Talk through your day and North separates what moved you forward from what pulled you off course.";

	return (
		<div style={{ background: "#F8F9FA", color: ON_SURFACE, fontFamily: SANS }}>
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

			<div className="ch-main min-h-screen">
				<TopBar bandLabel={bandLabel} todayLabel={todayLabel} />
				<div className="px-5 pb-6 sm:px-6 lg:px-8">
					{/* ── Page header ─────────────────────────────────────────── */}
					<header className="mx-auto mt-4 mb-10 max-w-6xl">
						<span
							className="mb-2 block font-bold text-[11px] uppercase tracking-[0.2em]"
							style={{ color: PRIMARY }}
						>
							{greeting}
							{name ? `, ${name}` : ""}
						</span>
						<div className="flex flex-wrap items-end justify-between gap-4">
							<h1
								className="font-bold text-4xl tracking-tight sm:text-5xl"
								style={{ fontFamily: SERIF }}
							>
								Signal &amp; Noise
							</h1>
							<div className="flex gap-2 sm:hidden">
								<Pill tone="primary">{bandLabel}</Pill>
								<Pill tone="muted">{todayLabel}</Pill>
							</div>
						</div>
						<p
							className="mt-3 text-sm"
							style={{ color: ON_VARIANT, opacity: 0.7 }}
						>
							{rhythm}
						</p>
					</header>

					{/* ── Composer ────────────────────────────────────────────── */}
					<section className="mx-auto mb-16 max-w-4xl">
						<div className="glass-gradient-border signal-glow-primary rounded-[2rem] p-7 sm:p-10">
							<div className="mb-7 flex items-start justify-between gap-4">
								<div>
									<span
										className="mb-1.5 block font-bold text-[11px] uppercase tracking-[0.2em]"
										style={{ color: PRIMARY }}
									>
										{returning ? "New reflection" : "First reflection"}
									</span>
									<h3
										className="font-bold text-2xl tracking-tight"
										style={{ fontFamily: SERIF }}
									>
										{composerPrompt}
									</h3>
								</div>
								{listening && (
									<div
										className="flex shrink-0 items-center gap-2"
										style={{ color: PRIMARY }}
									>
										<span className="rec-dot relative flex h-2 w-2">
											<span
												className="absolute inline-flex h-full w-full rounded-full opacity-75"
												style={{ background: PRIMARY }}
											/>
											<span
												className="relative inline-flex h-2 w-2 rounded-full"
												style={{ background: PRIMARY }}
											/>
										</span>
										<span className="font-bold text-[11px] uppercase tracking-widest">
											Recording context
										</span>
									</div>
								)}
							</div>

							<textarea
								value={text}
								onChange={(e) => setText(e.target.value)}
								placeholder={
									listening
										? "Listening, talk through your day…"
										: "Identify what mattered today, and what didn't…"
								}
								maxLength={1000}
								rows={5}
								className="min-h-[140px] w-full resize-none border-none bg-transparent text-lg leading-relaxed outline-none placeholder:text-black/30"
								style={{ color: ON_SURFACE }}
							/>

							<div className="mt-5 flex items-start gap-2.5 rounded-xl bg-black/[0.03] px-4 py-3">
								<span
									className="material-symbols-outlined mt-0.5 shrink-0 text-base"
									style={{ color: ON_VARIANT, opacity: 0.45 }}
								>
									tips_and_updates
								</span>
								<p
									className="text-xs leading-relaxed"
									style={{ color: ON_VARIANT, opacity: 0.65 }}
								>
									To maximize{" "}
									<span style={{ color: SIGNAL, opacity: 1, fontWeight: 700 }}>
										signals
									</span>
									, write about specific things you did that moved your goal
									forward. To minimize{" "}
									<span style={{ color: NOISE, opacity: 1, fontWeight: 700 }}>
										noise
									</span>
									, name what grabbed your attention but didn't serve your
									direction. The more honest and specific you are, the cleaner
									the separation.
								</p>
							</div>

							<div className="mt-6 flex items-center justify-between gap-4 border-black/5 border-t pt-7">
								{voiceSupported ? (
									<button
										type="button"
										onClick={toggleVoice}
										aria-label={listening ? "Stop recording" : "Record voice"}
										aria-pressed={listening}
										className="flex items-center gap-2 rounded-full border px-5 py-2.5 font-bold text-xs uppercase tracking-wider transition-colors"
										style={{
											borderColor: listening ? PRIMARY : "rgba(0,0,0,0.08)",
											background: listening
												? "rgba(0,90,194,0.08)"
												: "rgba(255,255,255,0.4)",
											color: listening ? PRIMARY : ON_VARIANT,
										}}
									>
										<span className="material-symbols-outlined text-[18px]">
											{listening ? "stop" : "mic"}
										</span>
										{listening ? "Stop" : "Talk it out"}
									</button>
								) : (
									<span
										className="text-xs"
										style={{ color: ON_VARIANT, opacity: 0.6 }}
									>
										A quiet mirror, not a coach.
									</span>
								)}
								<button
									type="button"
									onClick={() => void submit()}
									disabled={!text.trim() || submitting}
									className="rounded-xl px-9 py-3.5 font-bold text-sm text-white uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40"
									style={{
										background: PRIMARY,
										boxShadow: "0 10px 30px rgba(0,90,194,0.25)",
									}}
								>
									{submitting ? "Reading your day…" : "Read my day"}
								</button>
							</div>

							{latest && (
								<div className="mt-7 border-black/5 border-t pt-7">
									<p
										className="mb-4 text-sm"
										style={{ color: ON_VARIANT, opacity: 0.7 }}
									>
										Here's what stood out{name ? `, ${name}` : ""}.
									</p>
									<div className="grid gap-5 sm:grid-cols-2">
										<ObsList
											label="Signal"
											color={SIGNAL}
											items={latest.signal}
										/>
										<ObsList label="Noise" color={NOISE} items={latest.noise} />
										{latest.read && (
											<p
												className="text-sm italic leading-relaxed sm:col-span-2"
												style={{ color: ON_VARIANT }}
											>
												{latest.read}
											</p>
										)}
										<p
											className="font-medium text-sm sm:col-span-2"
											style={{ color: SIGNAL }}
										>
											One small step is enough today.
										</p>
									</div>
								</div>
							)}
						</div>
					</section>

					{/* ── Signal vs. Noise analysis ───────────────────────────── */}
					<section className="mx-auto max-w-6xl">
						<div className="mb-10 flex flex-wrap items-end justify-between gap-4">
							<div>
								<span
									className="mb-2 block font-bold text-[11px] uppercase tracking-[0.2em]"
									style={{ color: ON_VARIANT, opacity: 0.55 }}
								>
									Analysis engine
								</span>
								<h2
									className="font-bold text-3xl tracking-tight"
									style={{ fontFamily: SERIF }}
								>
									Signal vs. Noise Analysis
								</h2>
							</div>
							<div className="flex rounded-full border border-black/5 bg-white/60 p-1 shadow-sm">
								<FilterPill
									active={filter === "all"}
									onClick={() => setFilter("all")}
									label="All entries"
								/>
								<FilterPill
									active={filter === "signal"}
									onClick={() => setFilter("signal")}
									label={`Signals · ${signalCount}`}
								/>
								<FilterPill
									active={filter === "noise"}
									onClick={() => setFilter("noise")}
									label={`Noise · ${noiseCount}`}
								/>
							</div>
						</div>

						{observations.length > 0 ? (
							<div
								className="grid gap-6"
								style={{
									gridTemplateColumns:
										"repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
								}}
							>
								{observations.map((o, i) => (
									<ObservationCard
										key={o.key}
										obs={o}
										featured={i === 0}
										showRead={i === 0}
									/>
								))}
							</div>
						) : (
							<EmptyState
								hasEntries={entries.length > 0}
								filter={filter}
								name={name}
							/>
						)}
					</section>
				</div>
			</div>
		</div>
	);
}

function Pill({
	tone,
	children,
}: {
	tone: "primary" | "muted";
	children: React.ReactNode;
}) {
	return (
		<span
			className="rounded-full border px-3 py-1 font-bold text-[10px] uppercase tracking-wider"
			style={
				tone === "primary"
					? {
							color: PRIMARY,
							background: "rgba(0,90,194,0.06)",
							borderColor: "rgba(0,90,194,0.12)",
						}
					: {
							color: ON_VARIANT,
							opacity: 0.7,
							background: "transparent",
							borderColor: "rgba(0,0,0,0.08)",
						}
			}
		>
			{children}
		</span>
	);
}

function FilterPill({
	active,
	onClick,
	label,
}: {
	active: boolean;
	onClick: () => void;
	label: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="rounded-full px-5 py-2 font-bold text-xs uppercase tracking-wider transition-colors"
			style={
				active
					? {
							background: PRIMARY,
							color: "#fff",
							boxShadow: "0 4px 12px rgba(0,90,194,0.25)",
						}
					: { color: ON_VARIANT }
			}
		>
			{label}
		</button>
	);
}

function ObservationCard({
	obs,
	featured,
	showRead,
}: {
	obs: Observation;
	featured: boolean;
	showRead: boolean;
}) {
	const accent = obs.kind === "signal" ? SIGNAL : NOISE;
	const tag = obs.kind === "signal" ? "Signal" : "Noise";
	const eyebrow = featured
		? `${tag} • Latest reflection`
		: obs.kind === "signal"
			? "Signal"
			: "Noise filtered";
	return (
		<article
			className={`${
				featured ? "glass-gradient-border" : "glass-panel"
			} group relative flex flex-col rounded-[2rem] p-8`}
		>
			{featured && (
				<span
					className="material-symbols-outlined absolute top-8 right-8 text-2xl"
					style={{
						color: accent,
						fontVariationSettings: "'FILL' 1, 'wght' 700",
					}}
				>
					star
				</span>
			)}
			<span
				className="mb-5 block pr-8 font-bold text-[11px] uppercase tracking-[0.2em]"
				style={{ color: accent }}
			>
				{eyebrow}
			</span>
			<h3
				className={`font-bold leading-tight tracking-tight transition-colors ${
					featured ? "text-xl sm:text-2xl" : "text-lg"
				}`}
				style={{ fontFamily: SERIF }}
			>
				{cap(obs.text)}
			</h3>
			{showRead && obs.read && (
				<p
					className="mt-4 text-sm leading-relaxed"
					style={{ color: ON_VARIANT, opacity: 0.78 }}
				>
					{obs.read}
				</p>
			)}
			<div className="mt-auto flex items-center justify-between border-black/5 border-t pt-6">
				<span
					className="font-bold text-[10px] uppercase tracking-widest"
					style={{ color: ON_VARIANT, opacity: 0.5 }}
				>
					{obs.dateLabel}
				</span>
				{featured ? (
					<span
						className="material-symbols-outlined transition-transform group-hover:translate-x-1"
						style={{ color: accent }}
					>
						arrow_forward
					</span>
				) : (
					<span
						className="h-1.5 w-1.5 rounded-full"
						style={{ background: accent }}
					/>
				)}
			</div>
		</article>
	);
}

function ObsList({
	label,
	color,
	items,
}: {
	label: string;
	color: string;
	items: string[];
}) {
	if (items.length === 0) return null;
	return (
		<div>
			<div className="mb-2 flex items-center gap-1.5">
				<Triangle up={label === "Signal"} color={color} />
				<span
					className="font-bold text-[10px] uppercase tracking-[0.18em]"
					style={{ color }}
				>
					{label}
				</span>
			</div>
			<ul className="flex flex-col gap-1.5">
				{items.map((item) => (
					<li
						key={item}
						className="flex items-start gap-2 text-sm leading-snug"
						style={{ color: ON_VARIANT }}
					>
						<span
							className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
							style={{ background: color }}
						/>
						{cap(item)}
					</li>
				))}
			</ul>
		</div>
	);
}

function EmptyState({
	hasEntries,
	filter,
	name,
}: {
	hasEntries: boolean;
	filter: Filter;
	name: string | null;
}) {
	const msg = hasEntries
		? filter === "signal"
			? "No signal surfaced yet. Keep reflecting."
			: "No noise surfaced yet. Keep reflecting."
		: `Your first reflection will live here${name ? `, ${name}` : ""}, sorted into signal and noise.`;
	return (
		<div className="glass-panel rounded-[2rem] p-14 text-center">
			<span
				className="material-symbols-outlined text-5xl"
				style={{ color: PRIMARY, opacity: 0.35 }}
			>
				menu_book
			</span>
			<p className="mt-3 font-bold text-xl" style={{ fontFamily: SERIF }}>
				Nothing here yet
			</p>
			<p
				className="mx-auto mt-1 max-w-sm text-sm"
				style={{ color: ON_VARIANT, opacity: 0.7 }}
			>
				{msg}
			</p>
		</div>
	);
}

function Triangle({ up, color }: { up: boolean; color: string }) {
	return (
		<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
			<path d={up ? "M5 1l4 7H1z" : "M5 9L1 2h8z"} fill={color} />
		</svg>
	);
}

function TopBar({
	bandLabel,
	todayLabel,
}: {
	bandLabel: string;
	todayLabel: string;
}) {
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
					Signal &amp; Noise
				</span>
				<span className="hidden md:block" />
				<div className="flex items-center gap-4">
					<span className="hidden items-center gap-2 sm:flex">
						<Pill tone="primary">{bandLabel}</Pill>
						<Pill tone="muted">{todayLabel}</Pill>
					</span>
					<a
						href="/profile"
						aria-label="Your profile"
						className="flex h-9 w-9 items-center justify-center rounded-full border border-black/5 bg-white shadow-sm"
					>
						<span
							className="material-symbols-outlined text-xl"
							style={{ color: ON_VARIANT }}
						>
							person
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
				{NAV.map((n) => {
					const active = n.href === "/journal";
					return (
						<a
							key={n.href}
							href={n.href}
							aria-current={active ? "page" : undefined}
							className="flex items-center gap-4 rounded-xl px-4 py-3 transition-colors"
							style={
								active
									? {
											color: PRIMARY,
											fontWeight: 700,
											background: "rgba(0,90,194,0.05)",
										}
									: { color: ON_VARIANT }
							}
						>
							<span
								className="material-symbols-outlined"
								style={
									active
										? { fontVariationSettings: "'FILL' 1, 'wght' 700" }
										: undefined
								}
							>
								{n.icon}
							</span>
							<span
								className="text-sm"
								style={{ fontWeight: active ? 700 : 500 }}
							>
								{n.label}
							</span>
						</a>
					);
				})}
			</nav>
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
/* Subtle gradient hairline border on white (matches the Stitch mockup), no
   colored stripe. */
.glass-gradient-border {
	border: 1px solid transparent;
	background:
		linear-gradient(rgba(255,255,255,0.85), rgba(255,255,255,0.85)) padding-box,
		linear-gradient(135deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.02) 100%) border-box;
	transition: border-color .3s, box-shadow .3s, transform .3s;
}
.glass-gradient-border:hover {
	background:
		linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)) padding-box,
		linear-gradient(135deg, rgba(0,90,194,0.25) 0%, rgba(0,90,194,0.05) 100%) border-box;
	box-shadow: 0 18px 44px rgba(0,0,0,0.07);
	transform: translateY(-2px);
}
.signal-glow-primary { box-shadow: 0 10px 40px rgba(0,90,194,0.10); }
.glass-panel { background: rgba(255,255,255,0.72); border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 8px 26px rgba(0,0,0,0.04); transition: border-color .3s, box-shadow .3s, transform .3s; }
.glass-panel:hover { border-color: rgba(0,90,194,0.2); box-shadow: 0 16px 38px rgba(0,0,0,0.07); transform: translateY(-2px); }
.rec-dot > span:first-child { animation: rec-ping 1.4s cubic-bezier(0,0,0.2,1) infinite; }
@keyframes rec-ping { 75%, 100% { transform: scale(2.2); opacity: 0; } }
/* Critical layout, server-rendered: fixed sidebar + content offset before fonts
   load, so content never sits behind the nav. Phones use the bottom tab bar. */
.ch-rail { position: fixed; left: 0; top: 0; height: 100%; width: 280px; z-index: 50; display: none; flex-direction: column; background: rgba(255,255,255,0.85); border-right: 1px solid rgba(0,0,0,0.06); backdrop-filter: blur(12px); }
.ch-main { margin-left: 0; padding-bottom: 7rem; }
@media (min-width: 768px) { .ch-rail { display: flex; } .ch-main { margin-left: 280px; padding-bottom: 2.5rem; } }
@media (prefers-reduced-motion: reduce) { .glass-gradient-border, .glass-panel { transition: none; } .rec-dot > span:first-child { animation: none; } }
`;
