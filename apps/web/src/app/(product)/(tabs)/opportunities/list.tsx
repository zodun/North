"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/auth-client";
import { SubmitOpportunityForm } from "./submit-form";

// ─────────────────────────────────────────────────────────────────────────────
// Opportunities, Stitch "Discovery Hub" design, WIRED to the real backend.
// Sleek-light language (glass cards, blue/serif), consistent with the other
// tabs. Every action hits Supabase; the fabricated finance content (Quantum
// Equity, IRR%, $250k allocations) is dropped, cards show real opportunity
// fields (type, org, location, deadline) + the AI match reason.
//   • filter / search → client-side over the server-ranked list
//   • save            → user_saved_opportunities (upsert/delete, optimistic)
//   • apply           → user_saved_opportunities (applied=true) + open link
//   • submit          → SubmitOpportunityForm (opportunity_submissions)
// ─────────────────────────────────────────────────────────────────────────────

type Category = { id: string; label: string };

type Item = {
	id: string;
	title: string;
	org: string;
	opportunity_type: string | null;
	location: string | null;
	deadline: string | null;
	external_url: string | null;
	why: string | null;
	category_id: string | null;
	source: string | null;
	focus_area_tags: string[];
	matchScore: number;
};

const PRIMARY = "#005ac2";
const SECONDARY = "#ee9800";
const ON_SURFACE = "#1a1a1a";
const ON_VARIANT = "#5f6368";
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

// Per-category accent + icon. Drives the card header tint and chip.
const CAT: Record<string, { color: string; icon: string; label: string }> = {
	job: { color: "#0E9E73", icon: "work", label: "Jobs" },
	internship: { color: "#7B61FF", icon: "school", label: "Internships" },
	scholarship: { color: PRIMARY, icon: "menu_book", label: "Scholarships" },
	accelerator: {
		color: "#c864f5",
		icon: "rocket_launch",
		label: "Accelerators",
	},
	grant: { color: "#34a853", icon: "volunteer_activism", label: "Grants" },
	community: { color: "#3ECFBF", icon: "group", label: "Communities" },
	event: { color: SECONDARY, icon: "event", label: "Events" },
	"creator-programme": {
		color: "#7B61FF",
		icon: "videocam",
		label: "Creator Programmes",
	},
};
const catMeta = (id: string | null) =>
	(id && CAT[id]) || {
		color: PRIMARY,
		icon: "trending_up",
		label: "Opportunity",
	};

const FOCUS_LABELS: Record<string, string> = {
	craft: "Craft",
	venture: "Venture",
	mind: "Mind",
	people: "People",
	money: "Money",
	learn: "Learning",
};

function daysLeft(deadline: string | null): number | null {
	if (!deadline) return null;
	const t = Date.parse(deadline);
	if (Number.isNaN(t)) return null;
	const d = Math.ceil((t - Date.now()) / 86_400_000);
	return d >= 0 ? d : null;
}
function closesLabel(deadline: string | null, mounted: boolean): string {
	if (!deadline) return "Rolling";
	if (!mounted) return "";
	const d = daysLeft(deadline);
	if (d == null) return "Closed";
	if (d === 0) return "Closes today";
	return `${d} day${d === 1 ? "" : "s"} left`;
}

export function OpportunitiesList({
	items,
	categories,
	initialSaved,
	initialApplied,
	userFocusAreas,
	preview = false,
}: {
	items: Item[];
	categories: Category[];
	initialSaved: string[];
	initialApplied: string[];
	userFocusAreas: string[];
	preview?: boolean;
}) {
	const [search, setSearch] = useState("");
	const [activeCategory, setActiveCategory] = useState<string | null>(null);
	const [saved, setSaved] = useState<Set<string>>(new Set(initialSaved));
	const [applied, setApplied] = useState<Set<string>>(new Set(initialApplied));
	const [saving, setSaving] = useState<Set<string>>(new Set());
	const [showSubmit, setShowSubmit] = useState(false);
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	const filtered = useMemo(() => {
		const f = items.filter((item) => {
			const q = search.toLowerCase();
			const matchSearch =
				!search ||
				item.title.toLowerCase().includes(q) ||
				item.org.toLowerCase().includes(q);
			const matchCategory =
				!activeCategory || item.category_id === activeCategory;
			return matchSearch && matchCategory;
		});
		return [...f].sort((a, b) => b.matchScore - a.matchScore);
	}, [items, search, activeCategory]);

	const hero = filtered[0] ?? null;
	const rest = filtered.slice(1);

	async function toggleSave(item: Item) {
		if (saving.has(item.id)) return;
		setSaving((prev) => new Set([...prev, item.id]));
		const isSaved = saved.has(item.id);
		if (isSaved) {
			setSaved((prev) => {
				const n = new Set(prev);
				n.delete(item.id);
				return n;
			});
			await supabase
				.from("user_saved_opportunities")
				.delete()
				.eq("opportunity_id", item.id);
		} else {
			setSaved((prev) => new Set([...prev, item.id]));
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (user) {
				await supabase
					.from("user_saved_opportunities")
					.upsert(
						{ user_id: user.id, opportunity_id: item.id },
						{ onConflict: "user_id,opportunity_id" },
					);
			}
		}
		setSaving((prev) => {
			const n = new Set(prev);
			n.delete(item.id);
			return n;
		});
	}

	async function markApplied(item: Item) {
		if (!applied.has(item.id)) {
			setApplied((prev) => new Set([...prev, item.id]));
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (user) {
				await supabase.from("user_saved_opportunities").upsert(
					{
						user_id: user.id,
						opportunity_id: item.id,
						applied: true,
						applied_at: new Date().toISOString(),
					},
					{ onConflict: "user_id,opportunity_id" },
				);
				setSaved((prev) => new Set([...prev, item.id]));
			}
		}
		if (item.external_url)
			window.open(item.external_url, "_blank", "noopener,noreferrer");
	}

	const filterPills = categories.filter((c) => CAT[c.id]);

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

			<div className="op-main min-h-screen">
				<TopBar search={search} onSearch={setSearch} />
				<div className="px-5 pb-6 sm:px-6 lg:px-8">
					<div className="mx-auto max-w-[1280px]">
						{/* ── Header + filters ────────────────────────────── */}
						<section className="mt-4 mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
							<div>
								<h1
									className="mb-2 font-bold text-4xl tracking-tight sm:text-5xl"
									style={{ fontFamily: SERIF }}
								>
									Discovery Hub
								</h1>
								<p className="max-w-xl text-base" style={{ color: ON_VARIANT }}>
									Real opportunities like scholarships, jobs, and programmes,
									ranked to your direction.
								</p>
							</div>
							<button
								type="button"
								onClick={() => setShowSubmit(true)}
								className="inline-flex w-fit items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2.5 font-bold text-sm transition-colors hover:border-[#005ac2]/40"
								style={{ color: ON_SURFACE }}
							>
								<span className="material-symbols-outlined text-lg">add</span>
								Submit one
							</button>
						</section>

						<div className="mb-10 flex flex-wrap gap-2">
							<FilterPill
								active={activeCategory === null}
								onClick={() => setActiveCategory(null)}
								label="All matches"
							/>
							{filterPills.map((c) => (
								<FilterPill
									key={c.id}
									active={activeCategory === c.id}
									onClick={() => setActiveCategory(c.id)}
									label={catMeta(c.id).label}
								/>
							))}
						</div>

						{hero ? (
							<>
								<HeroCard
									item={hero}
									preview={preview}
									saved={saved.has(hero.id)}
									applied={applied.has(hero.id)}
									closes={closesLabel(hero.deadline, mounted)}
									onSave={() => void toggleSave(hero)}
									onApply={() => void markApplied(hero)}
								/>

								{rest.length > 0 && (
									<section className="mt-10">
										<div className="mb-6 flex items-center justify-between">
											<h2
												className="font-bold text-[11px] uppercase tracking-[0.2em]"
												style={{ color: ON_VARIANT }}
											>
												Recommended for you
											</h2>
											<span
												className="text-xs"
												style={{ color: ON_VARIANT, opacity: 0.7 }}
											>
												Sorted by match
											</span>
										</div>
										<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
											{rest.map((item) => (
												<OppCard
													key={item.id}
													item={item}
													locked={preview}
													saved={saved.has(item.id)}
													applied={applied.has(item.id)}
													closes={closesLabel(item.deadline, mounted)}
													userFocusAreas={userFocusAreas}
													onSave={() => void toggleSave(item)}
													onApply={() => void markApplied(item)}
												/>
											))}
										</div>
										{preview && <UpgradeNote count={rest.length} />}
									</section>
								)}
							</>
						) : (
							<EmptyState onSubmit={() => setShowSubmit(true)} />
						)}
					</div>
				</div>
			</div>

			{showSubmit && (
				<SubmitOpportunityForm onClose={() => setShowSubmit(false)} />
			)}
		</div>
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
			className="rounded-full border px-5 py-2 font-bold text-xs uppercase tracking-wider transition-colors"
			style={
				active
					? {
							background: PRIMARY,
							color: "#fff",
							borderColor: PRIMARY,
							boxShadow: "0 4px 12px rgba(0,90,194,0.25)",
						}
					: { color: ON_VARIANT, borderColor: "rgba(0,0,0,0.1)" }
			}
		>
			{label}
		</button>
	);
}

function HeroCard({
	item,
	preview,
	saved,
	applied,
	closes,
	onSave,
	onApply,
}: {
	item: Item;
	preview: boolean;
	saved: boolean;
	applied: boolean;
	closes: string;
	onSave: () => void;
	onApply: () => void;
}) {
	const cat = catMeta(item.category_id);
	return (
		<section className="glass-card signal-glow relative overflow-hidden rounded-[2rem] p-8 sm:p-10 lg:p-12">
			<div
				aria-hidden="true"
				className="absolute inset-0"
				style={{
					background: `radial-gradient(120% 100% at 100% 0%, ${cat.color}22, transparent 55%)`,
				}}
			/>
			<div className="relative max-w-2xl">
				<div className="mb-5 flex flex-wrap items-center gap-3">
					<span
						className="rounded-full border px-3 py-1 font-bold text-[10px] uppercase tracking-widest"
						style={{
							color: cat.color,
							background: `${cat.color}14`,
							borderColor: `${cat.color}33`,
						}}
					>
						{preview ? "Your top match" : "Top match"}
					</span>
					<span className="flex items-center gap-1.5">
						<span
							className="pulse-signal h-2 w-2 rounded-full"
							style={{ background: cat.color }}
						/>
						<span className="font-bold text-xs" style={{ color: cat.color }}>
							{cat.label}
						</span>
					</span>
				</div>

				<h2
					className="mb-3 font-bold text-3xl leading-tight tracking-tight sm:text-5xl"
					style={{ fontFamily: SERIF }}
				>
					{item.title}
				</h2>
				<p className="mb-8 text-lg" style={{ color: ON_VARIANT }}>
					{item.org}
				</p>

				{item.why && (
					<p
						className="mb-8 max-w-xl text-base leading-relaxed"
						style={{ color: ON_VARIANT }}
					>
						{item.why}
					</p>
				)}

				<div className="mb-9 flex flex-wrap items-center gap-x-10 gap-y-4">
					<HeroStat label="Type" value={item.opportunity_type ?? cat.label} />
					{item.location && <HeroStat label="Location" value={item.location} />}
					<HeroStat label="Deadline" value={closes} accent={cat.color} />
				</div>

				<div className="flex flex-wrap gap-3">
					<button
						type="button"
						onClick={onApply}
						className="inline-flex items-center gap-2 rounded-full px-9 py-3.5 font-bold text-sm text-white uppercase tracking-wider transition-all active:scale-95"
						style={{
							background: PRIMARY,
							boxShadow: "0 12px 30px rgba(0,90,194,0.3)",
						}}
					>
						{applied ? "Applied" : "Apply"}
						<span className="material-symbols-outlined text-base">
							{applied ? "check" : "arrow_forward"}
						</span>
					</button>
					<button
						type="button"
						onClick={onSave}
						aria-pressed={saved}
						className="inline-flex items-center gap-2 rounded-full border bg-white/60 px-7 py-3.5 font-bold text-sm transition-colors"
						style={{
							borderColor: saved ? PRIMARY : "rgba(0,0,0,0.1)",
							color: saved ? PRIMARY : ON_SURFACE,
						}}
					>
						<span
							className="material-symbols-outlined text-lg"
							style={{ fontVariationSettings: saved ? "'FILL' 1" : "'FILL' 0" }}
						>
							bookmark
						</span>
						{saved ? "Saved" : "Save for later"}
					</button>
				</div>
			</div>
		</section>
	);
}

function HeroStat({
	label,
	value,
	accent,
}: {
	label: string;
	value: string;
	accent?: string;
}) {
	return (
		<div>
			<p
				className="mb-1 font-bold text-[10px] uppercase tracking-widest"
				style={{ color: ON_VARIANT, opacity: 0.7 }}
			>
				{label}
			</p>
			<p
				className="font-bold text-lg tracking-tight"
				style={{ color: accent ?? ON_SURFACE, fontFamily: SERIF }}
			>
				{value}
			</p>
		</div>
	);
}

function OppCard({
	item,
	locked,
	saved,
	applied,
	closes,
	userFocusAreas,
	onSave,
	onApply,
}: {
	item: Item;
	locked: boolean;
	saved: boolean;
	applied: boolean;
	closes: string;
	userFocusAreas: string[];
	onSave: () => void;
	onApply: () => void;
}) {
	const cat = catMeta(item.category_id);
	const matchedTags = item.focus_area_tags.filter((t) =>
		userFocusAreas.includes(t),
	);
	return (
		<article className="glass-card group flex flex-col overflow-hidden rounded-[2rem]">
			{/* Accent header (replaces the mockup's stock photo) */}
			<div
				className="relative flex h-28 items-end p-5"
				style={{
					background: `linear-gradient(135deg, ${cat.color}24, ${cat.color}08)`,
				}}
			>
				<span
					aria-hidden="true"
					className="material-symbols-outlined absolute top-3 right-3 text-[64px]"
					style={{ color: cat.color, opacity: 0.18 }}
				>
					{cat.icon}
				</span>
				<span
					className="rounded-full bg-white/80 px-3 py-1 font-bold text-[10px] uppercase tracking-wider backdrop-blur-sm"
					style={{ color: cat.color }}
				>
					{cat.label}
				</span>
				<button
					type="button"
					onClick={onSave}
					aria-label={saved ? "Saved" : "Save"}
					className="absolute top-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-colors"
					style={{ color: saved ? PRIMARY : ON_VARIANT }}
				>
					<span
						className="material-symbols-outlined text-xl"
						style={{ fontVariationSettings: saved ? "'FILL' 1" : "'FILL' 0" }}
					>
						bookmark
					</span>
				</button>
			</div>

			<div className="flex flex-1 flex-col p-7">
				<h4
					className="mb-1 font-bold text-xl leading-snug tracking-tight transition-colors group-hover:text-[#005ac2]"
					style={{ fontFamily: SERIF }}
				>
					{item.title}
				</h4>
				<p className="text-sm" style={{ color: ON_VARIANT, opacity: 0.8 }}>
					{item.org}
				</p>

				{item.why ? (
					<p
						className="mt-4 line-clamp-2 text-sm leading-relaxed"
						style={{ color: ON_VARIANT }}
					>
						{item.why}
					</p>
				) : (
					matchedTags.length > 0 && (
						<div className="mt-4 flex flex-wrap gap-1.5">
							{matchedTags.slice(0, 3).map((t) => (
								<span
									key={t}
									className="rounded-full px-2 py-0.5 font-bold text-[10px] uppercase tracking-wider"
									style={{ background: "rgba(0,90,194,0.08)", color: PRIMARY }}
								>
									{FOCUS_LABELS[t] ?? t}
								</span>
							))}
						</div>
					)
				)}

				<div className="mt-auto grid grid-cols-2 gap-4 border-black/5 border-t pt-5">
					<div className="min-w-0">
						<p
							className="font-bold text-[9px] uppercase tracking-widest"
							style={{ color: ON_VARIANT, opacity: 0.6 }}
						>
							Location
						</p>
						<p className="truncate font-bold text-sm">
							{item.location ?? "Flexible"}
						</p>
					</div>
					<div>
						<p
							className="font-bold text-[9px] uppercase tracking-widest"
							style={{ color: ON_VARIANT, opacity: 0.6 }}
						>
							Deadline
						</p>
						<p className="font-bold text-sm">{closes}</p>
					</div>
				</div>

				<button
					type="button"
					onClick={onApply}
					className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-sm uppercase tracking-wider transition-all active:scale-95"
					style={
						applied
							? { background: "rgba(0,90,194,0.08)", color: PRIMARY }
							: { background: PRIMARY, color: "#fff" }
					}
				>
					{applied ? "Applied" : locked ? "Open" : "Apply"}
					<span className="material-symbols-outlined text-base">
						{applied ? "check" : "arrow_forward"}
					</span>
				</button>
			</div>
		</article>
	);
}

function UpgradeNote({ count }: { count: number }) {
	return (
		<div
			className="mt-6 flex flex-col items-center gap-3 rounded-[2rem] border border-dashed p-8 text-center sm:flex-row sm:justify-between sm:text-left"
			style={{ borderColor: "rgba(123,97,255,0.3)" }}
		>
			<div>
				<p className="font-bold text-lg" style={{ fontFamily: SERIF }}>
					{count} more matches, ranked for you
				</p>
				<p className="text-sm" style={{ color: ON_VARIANT, opacity: 0.8 }}>
					Premium ranks every opportunity to your direction, with a reason for
					each.
				</p>
			</div>
			<a
				href="/api/billing/checkout"
				className="shrink-0 rounded-xl px-6 py-3 font-bold text-sm text-white uppercase tracking-wider"
				style={{ background: "#7B61FF" }}
			>
				Upgrade
			</a>
		</div>
	);
}

function EmptyState({ onSubmit }: { onSubmit: () => void }) {
	return (
		<div className="glass-card rounded-[2rem] p-14 text-center">
			<span
				className="material-symbols-outlined text-5xl"
				style={{ color: PRIMARY, opacity: 0.35 }}
			>
				travel_explore
			</span>
			<p className="mt-3 font-bold text-2xl" style={{ fontFamily: SERIF }}>
				Nothing matches yet
			</p>
			<p
				className="mx-auto mt-1 max-w-sm text-sm"
				style={{ color: ON_VARIANT, opacity: 0.8 }}
			>
				Try a different filter or search, or submit an opportunity you know
				about.
			</p>
			<button
				type="button"
				onClick={onSubmit}
				className="mt-6 rounded-xl px-7 py-3 font-bold text-sm text-white uppercase tracking-wider"
				style={{ background: PRIMARY }}
			>
				Submit an opportunity
			</button>
		</div>
	);
}

function TopBar({
	search,
	onSearch,
}: {
	search: string;
	onSearch: (v: string) => void;
}) {
	return (
		<header
			className="sticky top-0 z-40 px-5 py-3 backdrop-blur-md sm:px-6 lg:px-8"
			style={{ background: "rgba(248,249,250,0.7)" }}
		>
			<div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-3">
				<div className="relative w-full max-w-lg">
					<span
						className="material-symbols-outlined absolute top-1/2 left-4 -translate-y-1/2"
						style={{ color: "rgba(95,99,104,0.6)" }}
					>
						search
					</span>
					<input
						type="text"
						value={search}
						onChange={(e) => onSearch(e.target.value)}
						placeholder="Search opportunities or organisations…"
						className="w-full rounded-full border border-black/5 bg-white/90 py-2.5 pr-4 pl-12 font-medium text-sm outline-none transition-all focus:border-[#005ac2] focus:ring-2 focus:ring-[#005ac2]/20"
					/>
				</div>
				<div className="flex shrink-0 items-center gap-4">
					<a href="/profile" className="relative" aria-label="Notifications">
						<span
							className="material-symbols-outlined"
							style={{ color: ON_VARIANT }}
						>
							notifications
						</span>
					</a>
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
		<aside className="op-rail px-6 py-8">
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
					const active = n.href === "/opportunities";
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
			<div className="border-black/5 border-t pt-8">
				<a
					href="/api/billing/checkout"
					className="flex items-center justify-between rounded-xl px-4 py-3 font-bold text-sm transition-colors hover:bg-black/5"
					style={{ color: ON_SURFACE }}
				>
					Go Beyond
					<span
						className="material-symbols-outlined"
						style={{ color: PRIMARY }}
					>
						arrow_forward
					</span>
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
.glass-card { position: relative; background: rgba(255,255,255,0.7); backdrop-filter: blur(20px); border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 4px 24px -1px rgba(0,0,0,0.04); transition: border-color .25s, box-shadow .25s, transform .25s; }
.glass-card:hover { border-color: rgba(0,90,194,0.25); box-shadow: 0 16px 38px rgba(0,0,0,0.07); transform: translateY(-2px); }
.signal-glow { box-shadow: 0 20px 50px -10px rgba(0,90,194,0.14); }
@keyframes pulse-signal { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.25); opacity: 0.7; } }
.pulse-signal { animation: pulse-signal 2s infinite ease-in-out; }
/* Critical layout, server-rendered: fixed sidebar + content offset before fonts
   load. Phones use the bottom tab bar. */
.op-rail { position: fixed; left: 0; top: 0; height: 100%; width: 280px; z-index: 50; display: none; flex-direction: column; background: rgba(255,255,255,0.85); border-right: 1px solid rgba(0,0,0,0.06); backdrop-filter: blur(12px); }
.op-main { margin-left: 0; padding-bottom: 7rem; }
@media (min-width: 768px) { .op-rail { display: flex; } .op-main { margin-left: 280px; padding-bottom: 2.5rem; } }
@media (prefers-reduced-motion: reduce) { .glass-card { transition: none; } .pulse-signal { animation: none; } }
`;
