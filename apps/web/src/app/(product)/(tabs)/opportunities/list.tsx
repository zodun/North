"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/auth-client";
import { SubmitOpportunityForm } from "./submit-form";

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

const GOLD = "#F5C842";
const TEAL = "#3ECFBF";
const VIOLET = "#7B61FF";

// Per-category accent. Drives every coloured element on a card: the gradient,
// the badge, the accent rail, the apply button and the compass-rose art.
const CAT_COLOR: Record<string, string> = {
	job: GOLD,
	grant: "rgba(80,200,120,0.9)",
	internship: "#7B61FF",
	event: "rgba(245,150,80,0.9)",
	accelerator: "rgba(200,100,245,0.9)",
	community: TEAL,
	scholarship: "rgba(62,130,200,0.9)",
	"creator-programme": "rgba(123,97,255,0.85)",
};
const catColor = (id: string | null) =>
	(id && CAT_COLOR[id]) || "rgba(255,255,255,0.3)";

// Categories that read as fast-moving roles — surfaced in a horizontal rail.
const COMPACT_CATEGORIES = new Set(["job", "internship"]);

const CAT_LABELS: Record<string, string> = {
	job: "Jobs",
	internship: "Internships",
	scholarship: "Scholarships",
	accelerator: "Accelerators",
	grant: "Grants",
	community: "Communities",
	event: "Events",
	"creator-programme": "Creator Programmes",
};
const catLabelFor = (id: string | null): string | null =>
	(id && (CAT_LABELS[id] ?? id)) || null;

const FOCUS_LABELS: Record<string, string> = {
	craft: "Craft",
	venture: "Venture",
	mind: "Mind",
	people: "People",
	money: "Money",
	learn: "Learning",
};

const SOURCE_LABELS: Record<string, string> = {
	"opportunity-desk": "Opportunity Desk",
	scholars4dev: "Scholars4Dev",
	youthop: "Youth Op",
	"afterschool-africa": "After School Africa",
	"world-scholarship-forum": "World Scholarships",
	"opportunities-for-africans": "Opps for Africans",
	youth4work: "Devex",
};

// ── Colour helpers ───────────────────────────────────────────────────────────
// Accents arrive as either #hex or rgba(); normalise to channels so we can
// derive tints, deep gradients and a readable foreground for apply buttons.

function channels(color: string): [number, number, number] {
	if (color.startsWith("#")) {
		const h = color.slice(1);
		return [
			Number.parseInt(h.slice(0, 2), 16),
			Number.parseInt(h.slice(2, 4), 16),
			Number.parseInt(h.slice(4, 6), 16),
		];
	}
	const m = color.match(/[\d.]+/g);
	if (m && m.length >= 3) return [Number(m[0]), Number(m[1]), Number(m[2])];
	return [255, 255, 255];
}
function withAlpha(color: string, a: number): string {
	const [r, g, b] = channels(color);
	return `rgba(${r}, ${g}, ${b}, ${a})`;
}
function darken(color: string, f: number): string {
	const [r, g, b] = channels(color);
	return `rgb(${Math.round(r * f)}, ${Math.round(g * f)}, ${Math.round(b * f)})`;
}
// Light accents (gold, teal, green) need ink-dark text; deep ones take white.
function inkOn(color: string): string {
	const [r, g, b] = channels(color);
	return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#05050E" : "#FFFFFF";
}
const heroGradient = (accent: string) =>
	`linear-gradient(135deg, ${darken(accent, 0.2)} 0%, ${darken(accent, 0.08)} 48%, #05050E 100%)`;
const cardGradient = (accent: string) =>
	`linear-gradient(135deg, ${darken(accent, 0.13)} 0%, #0a0a0f 70%)`;

function daysLeft(deadline: string | null): number | null {
	if (!deadline) return null;
	const t = Date.parse(deadline);
	if (Number.isNaN(t)) return null;
	const d = Math.ceil((t - Date.now()) / 86_400_000);
	return d >= 0 ? d : null;
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

	// Filter (unchanged logic), then surface best matches first.
	const filtered = useMemo(() => {
		const f = items.filter((item) => {
			const matchSearch =
				!search ||
				item.title.toLowerCase().includes(search.toLowerCase()) ||
				item.org.toLowerCase().includes(search.toLowerCase());
			const matchCategory =
				!activeCategory || item.category_id === activeCategory;
			return matchSearch && matchCategory;
		});
		return [...f].sort((a, b) => b.matchScore - a.matchScore);
	}, [items, search, activeCategory]);

	// Purely presentational regroup of the already-filtered list: the strongest
	// match becomes the hero, fast-moving roles collapse into a scroll rail, the
	// rest stack as full-width cards. No item is added, dropped or re-fetched.
	const { hero, compact, rest } = useMemo(() => {
		const [first, ...others] = filtered;
		const compactRow: Item[] = [];
		const restRows: Item[] = [];
		for (const it of others) {
			if (it.category_id && COMPACT_CATEGORIES.has(it.category_id))
				compactRow.push(it);
			else restRows.push(it);
		}
		return { hero: first ?? null, compact: compactRow, rest: restRows };
	}, [filtered]);

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
		if (applied.has(item.id)) return;
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
		if (item.external_url)
			window.open(item.external_url, "_blank", "noopener,noreferrer");
	}

	const cardProps = (item: Item) => ({
		isSaved: saved.has(item.id),
		isApplied: applied.has(item.id),
		isSaving: saving.has(item.id),
		daysRemaining: mounted ? daysLeft(item.deadline) : null,
		userFocusAreas,
		onSave: () => void toggleSave(item),
		onApply: () => void markApplied(item),
	});

	// Deterministic running index for the staggered entrance (hero, then the
	// rail, then the stack) — computed up front so render stays side-effect free.
	const heroOffset = hero ? 1 : 0;
	const compactBase = heroOffset;
	const restBase = heroOffset + compact.length;

	return (
		<div className="h-full overflow-y-auto overflow-x-hidden bg-[#05050E] pb-24 font-jakarta">
			<style>{ANIM}</style>

			{/* Header */}
			<header className="px-[18px] pt-[18px]">
				<p className="mb-1 font-bold text-[9px] text-white/30 uppercase tracking-[0.15em]">
					Discover
				</p>
				<h1 className="mb-1 font-black text-[24px] text-white tracking-[-0.8px]">
					Opportunities
				</h1>
				<p className="mb-4 text-[12px] text-white/35">
					Built for where you are headed.
				</p>
			</header>

			{/* Search */}
			<div className="mx-[18px] mb-3 flex items-center gap-3 rounded-[14px] border border-white/10 bg-white/5 px-4 py-[10px]">
				<SearchIcon />
				<label htmlFor="opp-search" className="sr-only">
					Search opportunities
				</label>
				<input
					id="opp-search"
					type="search"
					autoComplete="off"
					placeholder="Search opportunities"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="min-w-0 flex-1 border-none bg-transparent font-medium text-[13px] text-white outline-none placeholder:text-white/20"
				/>
			</div>

			{/* Category filter */}
			<div
				className="mb-[14px] flex gap-2 overflow-x-auto scroll-smooth px-[18px] [&::-webkit-scrollbar]:hidden"
				style={{ scrollbarWidth: "none" }}
			>
				<CategoryPill
					label="All"
					active={!activeCategory}
					onClick={() => setActiveCategory(null)}
				/>
				{categories.map((cat) => (
					<CategoryPill
						key={cat.id}
						label={cat.label}
						active={activeCategory === cat.id}
						onClick={() =>
							setActiveCategory(cat.id === activeCategory ? null : cat.id)
						}
					/>
				))}
			</div>

			{/* List */}
			{filtered.length === 0 ? (
				<EmptyState />
			) : (
				<>
					{hero && <HeroCard item={hero} index={0} {...cardProps(hero)} />}

					{preview && hero && <UpsellCard />}

					{compact.length > 0 && (
						<section>
							<h2 className="px-[18px] pt-0.5 pb-[10px] font-bold text-[10px] text-white/25 uppercase tracking-[0.12em]">
								Roles &amp; internships
							</h2>
							<div
								className="mb-[14px] flex gap-3 overflow-x-auto px-[18px] pb-1 [&::-webkit-scrollbar]:hidden"
								style={{ scrollbarWidth: "none" }}
							>
								{compact.map((item, i) => (
									<CompactCard
										key={item.id}
										item={item}
										index={compactBase + i}
										{...cardProps(item)}
									/>
								))}
							</div>
						</section>
					)}

					{rest.length > 0 && (
						<section>
							{(hero || compact.length > 0) && (
								<h2 className="px-[18px] pt-0.5 pb-[10px] font-bold text-[10px] text-white/25 uppercase tracking-[0.12em]">
									More to explore
								</h2>
							)}
							{rest.map((item, i) => (
								<FullCard
									key={item.id}
									item={item}
									index={restBase + i}
									{...cardProps(item)}
								/>
							))}
						</section>
					)}
				</>
			)}

			{/* Submit CTA */}
			<button
				type="button"
				onClick={() => setShowSubmit(true)}
				className="mx-[18px] mt-1 mb-4 flex w-[calc(100%-36px)] cursor-pointer items-center gap-3 rounded-[16px] border border-white/10 border-dashed p-[14px] transition-all hover:border-white/20 hover:bg-white/[0.02] motion-reduce:transition-none"
			>
				<span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-white/5">
					<PlusCircleIcon />
				</span>
				<span className="text-left">
					<span className="block font-bold text-[12px] text-white/30">
						Submit an opportunity
					</span>
					<span className="mt-0.5 block text-[10px] text-white/[0.18]">
						Know something worth sharing?
					</span>
				</span>
			</button>

			{showSubmit && (
				<SubmitOpportunityForm onClose={() => setShowSubmit(false)} />
			)}
		</div>
	);
}

// Props shared by every card variant.
type CardCommon = {
	item: Item;
	index: number;
	isSaved: boolean;
	isApplied: boolean;
	isSaving: boolean;
	daysRemaining: number | null;
	userFocusAreas: string[];
	onSave: () => void;
	onApply: () => void;
};

// ── Featured hero card ───────────────────────────────────────────────────────

function HeroCard({
	item,
	index,
	isSaved,
	isApplied,
	isSaving,
	daysRemaining,
	onSave,
	onApply,
}: CardCommon) {
	const accent = catColor(item.category_id);
	const ink = inkOn(accent);
	const catLabel = catLabelFor(item.category_id);
	const urgent = daysRemaining != null && daysRemaining < 7;

	return (
		<article
			tabIndex={-1}
			className="opp-card relative mx-[18px] mb-[14px] min-h-[195px] cursor-pointer overflow-hidden rounded-[22px] outline-none focus-visible:ring-2 focus-visible:ring-[#F5C842]"
			style={{
				background: heroGradient(accent),
				border: `1px solid ${withAlpha(accent, 0.22)}`,
				animationDelay: `${Math.min(index, 8) * 60}ms`,
			}}
		>
			<CompassRose accent={accent} />

			{/* Category badge */}
			{catLabel && (
				<span
					className="absolute top-[14px] left-[14px] z-10 rounded-full px-[11px] py-1 font-bold text-[9px] uppercase tracking-[0.12em] backdrop-blur-sm"
					style={{
						color: accent,
						backgroundColor: withAlpha(accent, 0.25),
						border: `1px solid ${withAlpha(accent, 0.5)}`,
					}}
				>
					{catLabel}
				</span>
			)}

			{/* Save */}
			<button
				type="button"
				onClick={onSave}
				disabled={isSaving}
				aria-label={isSaved ? "Remove from saved" : "Save opportunity"}
				aria-pressed={isSaved}
				className="absolute top-[12px] right-[12px] z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-white/15 disabled:opacity-50 motion-reduce:transition-none"
				style={{
					backgroundColor: isSaved
						? withAlpha(accent, 0.2)
						: "rgba(255,255,255,0.1)",
					border: `1px solid ${isSaved ? withAlpha(accent, 0.4) : "rgba(255,255,255,0.15)"}`,
				}}
			>
				<BookmarkIcon active={isSaved} accent={accent} />
			</button>

			{/* Content */}
			<div className="relative z-10 flex min-h-[195px] flex-col justify-end p-5">
				<p className="mb-1.5 font-semibold text-[10px] text-white/40">
					{item.org}
				</p>
				<h2 className="mb-2 line-clamp-2 font-black text-[19px] text-white leading-[1.2] tracking-[-0.5px]">
					{item.title}
				</h2>

				{(item.location || item.opportunity_type) && (
					<div className="mb-3 flex flex-wrap items-center gap-2">
						{item.opportunity_type && (
							<span className="font-medium text-[10px] text-white/50">
								{item.opportunity_type}
							</span>
						)}
						{item.location && item.opportunity_type && <Dot />}
						{item.location && (
							<span className="font-medium text-[10px] text-white/50">
								{item.location}
							</span>
						)}
					</div>
				)}

				<div className="flex flex-wrap items-center gap-3">
					{item.external_url && (
						<button
							type="button"
							onClick={onApply}
							className="flex cursor-pointer items-center gap-1.5 rounded-[11px] border-none px-[18px] py-[9px] font-extrabold text-[13px] transition-transform active:scale-95 motion-reduce:transition-none"
							style={{
								backgroundColor: isApplied ? withAlpha(accent, 0.15) : accent,
								color: isApplied ? accent : ink,
								boxShadow: isApplied
									? "none"
									: `0 4px 14px ${withAlpha(accent, 0.4)}`,
							}}
						>
							{isApplied && <CheckIcon />}
							{isApplied ? "Applied" : "Apply now"}
						</button>
					)}
					{daysRemaining != null && (
						<DaysPill days={daysRemaining} urgent={urgent} />
					)}
				</div>
			</div>
		</article>
	);
}

// ── Compact card (horizontal rail) ───────────────────────────────────────────

function CompactCard({
	item,
	index,
	isApplied,
	daysRemaining,
	onApply,
}: CardCommon) {
	const accent = catColor(item.category_id);
	const typeLabel = item.opportunity_type ?? catLabelFor(item.category_id);

	return (
		<article
			tabIndex={-1}
			className="opp-card relative min-h-[130px] w-[200px] shrink-0 cursor-pointer overflow-hidden rounded-[18px] outline-none focus-visible:ring-2 focus-visible:ring-[#F5C842]"
			style={{
				background: cardGradient(accent),
				border: `1px solid ${withAlpha(accent, 0.2)}`,
				animationDelay: `${Math.min(index, 8) * 60}ms`,
			}}
		>
			<span
				aria-hidden="true"
				className="absolute inset-x-0 top-0 h-0.5"
				style={{
					background: `linear-gradient(90deg, ${accent}, transparent)`,
				}}
			/>
			<div className="relative z-[2] flex h-full min-h-[130px] flex-col p-[14px]">
				{typeLabel && (
					<p
						className="mb-1.5 font-bold text-[8px] uppercase tracking-[0.12em]"
						style={{ color: withAlpha(accent, 0.7) }}
					>
						{typeLabel}
					</p>
				)}
				<h3 className="mb-1 line-clamp-2 font-black text-[13px] text-white leading-[1.3]">
					{item.title}
				</h3>
				<p className="mb-3 line-clamp-1 text-[10px] text-white/40">
					{item.org}
				</p>
				<div className="mt-auto flex items-center justify-between gap-2">
					{daysRemaining != null ? (
						<span className="font-medium text-[9px] text-white/50">
							{daysRemaining === 0 ? "Closes today" : `${daysRemaining}d left`}
						</span>
					) : (
						<span />
					)}
					{item.external_url && (
						<button
							type="button"
							onClick={onApply}
							className="cursor-pointer rounded-[8px] px-[11px] py-[5px] font-black text-[10px] transition-colors motion-reduce:transition-none"
							style={{
								color: accent,
								backgroundColor: withAlpha(accent, 0.15),
								border: `1px solid ${withAlpha(accent, 0.3)}`,
							}}
						>
							{isApplied ? "Applied" : "Apply"}
						</button>
					)}
				</div>
			</div>
		</article>
	);
}

// ── Full-width card ──────────────────────────────────────────────────────────

function FullCard({
	item,
	index,
	isSaved,
	isApplied,
	isSaving,
	daysRemaining,
	userFocusAreas,
	onSave,
	onApply,
}: CardCommon) {
	const accent = catColor(item.category_id);
	const catLabel = catLabelFor(item.category_id);
	const tags = item.focus_area_tags.slice(0, 4);
	const urgent = daysRemaining != null && daysRemaining < 7;

	return (
		<article
			tabIndex={-1}
			className="opp-card relative mx-[18px] mb-3 cursor-pointer overflow-hidden rounded-[18px] outline-none focus-visible:ring-2 focus-visible:ring-[#F5C842]"
			style={{
				background: cardGradient(accent),
				border: `1px solid ${withAlpha(accent, 0.2)}`,
				animationDelay: `${Math.min(index, 8) * 60}ms`,
			}}
		>
			<span
				aria-hidden="true"
				className="absolute top-0 bottom-0 left-0 w-[3px] rounded-l-[3px]"
				style={{ backgroundColor: accent }}
			/>

			{/* Header */}
			<div className="flex items-start justify-between gap-3 px-[14px] pt-[14px] pb-[10px]">
				<div className="min-w-0">
					{catLabel && (
						<span
							className="mb-1.5 inline-block rounded-full px-2 py-1 font-bold text-[8px] uppercase tracking-[0.1em]"
							style={{
								color: accent,
								backgroundColor: withAlpha(accent, 0.1),
								border: `1px solid ${withAlpha(accent, 0.25)}`,
							}}
						>
							{catLabel}
						</span>
					)}
					<h3 className="mb-1 font-black text-[15px] text-white leading-[1.3]">
						{item.title}
					</h3>
					<p className="text-[11px] text-white/50">{item.org}</p>
				</div>
				<button
					type="button"
					onClick={onSave}
					disabled={isSaving}
					aria-label={isSaved ? "Remove from saved" : "Save opportunity"}
					aria-pressed={isSaved}
					className="flex h-[30px] w-[30px] shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-white/12 disabled:opacity-50 motion-reduce:transition-none"
					style={{
						backgroundColor: isSaved
							? withAlpha(accent, 0.18)
							: "rgba(255,255,255,0.06)",
						border: `1px solid ${isSaved ? withAlpha(accent, 0.35) : "rgba(255,255,255,0.10)"}`,
					}}
				>
					<BookmarkIcon active={isSaved} accent={accent} />
				</button>
			</div>

			{/* Why this */}
			{item.why && (
				<div
					className="mx-[14px] mb-3 rounded-[10px] bg-white/[0.03] px-3 py-[9px]"
					style={{ borderLeft: `2px solid ${withAlpha(accent, 0.4)}` }}
				>
					<p className="mb-1 font-bold text-[8px] text-white/25 uppercase tracking-[0.12em]">
						Why this
					</p>
					<p className="text-[11px] text-white/55 leading-[1.5]">{item.why}</p>
				</div>
			)}

			{/* Tags */}
			{tags.length > 0 && (
				<div className="flex flex-wrap gap-2 px-[14px] pb-3">
					{tags.map((tag) => {
						const matched = userFocusAreas.includes(tag);
						return (
							<span
								key={tag}
								className="rounded-full border px-2.5 py-1 font-semibold text-[10px]"
								style={
									matched
										? {
												color: TEAL,
												backgroundColor: "rgba(62,207,191,0.08)",
												borderColor: "rgba(62,207,191,0.25)",
											}
										: {
												color: "rgba(255,255,255,0.4)",
												backgroundColor: "rgba(255,255,255,0.05)",
												borderColor: "rgba(255,255,255,0.08)",
											}
								}
							>
								{FOCUS_LABELS[tag] ?? tag}
							</span>
						);
					})}
					{item.source && SOURCE_LABELS[item.source] && (
						<span className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 font-semibold text-[10px] text-white/40">
							{SOURCE_LABELS[item.source]}
						</span>
					)}
				</div>
			)}

			{/* Bottom row */}
			<div className="flex items-center justify-between gap-3 px-[14px] pt-1 pb-[14px]">
				<div className="flex min-w-0 flex-wrap items-center gap-2 text-[10px] text-white/50">
					{item.location && (
						<span className="flex items-center gap-1">
							<PinIcon />
							{item.location}
						</span>
					)}
					{daysRemaining != null && (
						<DaysPill days={daysRemaining} urgent={urgent} />
					)}
				</div>
				{item.external_url && (
					<button
						type="button"
						onClick={onApply}
						className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-[10px] px-[15px] py-[7px] font-black text-[11px] transition-colors motion-reduce:transition-none"
						style={{
							color: accent,
							backgroundColor: withAlpha(accent, 0.15),
							border: `1px solid ${withAlpha(accent, 0.3)}`,
						}}
					>
						{isApplied && <CheckIcon />}
						{isApplied ? "Applied" : "Apply now"}
					</button>
				)}
			</div>
		</article>
	);
}

// ── Shared bits ──────────────────────────────────────────────────────────────

function DaysPill({ days, urgent }: { days: number; urgent: boolean }) {
	return (
		<span
			className="rounded-full px-3 py-1.5 font-bold text-[10px]"
			style={
				urgent
					? {
							color: "rgba(245,130,130,0.95)",
							backgroundColor: "rgba(245,100,100,0.1)",
							border: "1px solid rgba(245,100,100,0.25)",
						}
					: {
							color: "rgba(255,255,255,0.5)",
							backgroundColor: "rgba(255,255,255,0.08)",
							border: "1px solid rgba(255,255,255,0.12)",
						}
			}
		>
			{days === 0 ? "Closes today" : `${days} day${days === 1 ? "" : "s"} left`}
		</span>
	);
}

function Dot() {
	return (
		<span
			aria-hidden="true"
			className="inline-block h-[3px] w-[3px] rounded-full"
			style={{ backgroundColor: "rgba(240,240,245,0.2)" }}
		/>
	);
}

// Decorative compass rose — texture, not focus. Sits top-right of the card with
// a faint echo bottom-left, tinted to the category accent.
function CompassRose({ accent }: { accent: string }) {
	return (
		<div
			aria-hidden="true"
			className="pointer-events-none absolute inset-0 overflow-hidden"
		>
			<svg
				width="240"
				height="240"
				viewBox="0 0 240 240"
				fill="none"
				className="absolute -top-12 -right-6"
				aria-hidden="true"
			>
				<circle
					cx="120"
					cy="120"
					r="90"
					stroke={accent}
					strokeOpacity="0.6"
					strokeWidth="1"
					strokeDasharray="2 7"
				/>
				<circle
					cx="120"
					cy="120"
					r="60"
					stroke={accent}
					strokeOpacity="0.4"
					strokeWidth="1"
					strokeDasharray="2 7"
				/>
				<circle
					cx="120"
					cy="120"
					r="32"
					stroke={accent}
					strokeOpacity="0.4"
					strokeWidth="1"
				/>
				<g stroke={accent} strokeOpacity="0.2" strokeWidth="1">
					<line x1="120" y1="14" x2="120" y2="226" />
					<line x1="14" y1="120" x2="226" y2="120" />
				</g>
				<polygon
					points="120,42 113,120 127,120"
					fill={accent}
					fillOpacity="0.7"
				/>
				<circle cx="120" cy="120" r="4" fill={accent} fillOpacity="0.85" />
			</svg>
			<svg
				width="130"
				height="130"
				viewBox="0 0 130 130"
				fill="none"
				className="absolute -bottom-12 -left-10"
				aria-hidden="true"
			>
				<circle
					cx="65"
					cy="65"
					r="45"
					stroke={accent}
					strokeOpacity="0.2"
					strokeWidth="1"
					strokeDasharray="2 7"
				/>
			</svg>
		</div>
	);
}

// ── Filter pill ──────────────────────────────────────────────────────────────

function CategoryPill({
	label,
	active,
	onClick,
}: {
	label: string;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={active}
			className={`shrink-0 cursor-pointer whitespace-nowrap rounded-full px-[14px] py-[7px] text-[11px] transition-all motion-reduce:transition-none ${
				active ? "font-extrabold" : "font-bold hover:bg-white/[0.09]"
			}`}
			style={
				active
					? {
							backgroundColor: GOLD,
							color: "#05050E",
							border: `1px solid ${GOLD}`,
							transform: "scale(1.02)",
						}
					: {
							backgroundColor: "rgba(255,255,255,0.05)",
							border: "1px solid rgba(255,255,255,0.10)",
							color: "rgba(255,255,255,0.45)",
						}
			}
		>
			{label}
		</button>
	);
}

// Free-tier preview upsell — shown right after the one personalized pick.
function UpsellCard() {
	return (
		<a
			href="/api/billing/checkout"
			className="mx-[18px] mb-3 block cursor-pointer overflow-hidden rounded-[18px] border p-4"
			style={{
				borderColor: "rgba(123,97,255,0.3)",
				background:
					"linear-gradient(135deg, rgba(123,97,255,0.14), rgba(123,97,255,0.03))",
			}}
		>
			<p
				className="mb-1 font-bold text-[9px] uppercase tracking-[0.15em]"
				style={{ color: VIOLET }}
			>
				Premium
			</p>
			<p className="font-black text-[15px] text-white leading-[1.35]">
				That's your top match. Unlock the rest.
			</p>
			<p className="mt-1 text-[12px] text-white/55 leading-relaxed">
				Premium ranks every opportunity to your goal — with a reason for each
				pick.
			</p>
			<span
				className="mt-3 inline-flex items-center rounded-[11px] px-[18px] py-[9px] font-extrabold text-[#05050E] text-[13px]"
				style={{ backgroundColor: GOLD }}
			>
				Upgrade to Premium
			</span>
		</a>
	);
}

function EmptyState() {
	return (
		<div className="mt-16 px-8 text-center">
			<CompassMark />
			<p className="font-bold text-[16px] text-white/35">Nothing here yet</p>
			<p className="mt-1 text-[13px] text-white/[0.22]">
				Try a different filter or check back soon
			</p>
		</div>
	);
}

// ── Icons ────────────────────────────────────────────────────────────────────

const svgBase = {
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 2,
	strokeLinecap: "round" as const,
	strokeLinejoin: "round" as const,
};

function SearchIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			{...svgBase}
			className="shrink-0 text-white/25"
			aria-hidden="true"
		>
			<circle cx="11" cy="11" r="8" />
			<path d="m21 21-4.35-4.35" />
		</svg>
	);
}

function BookmarkIcon({ active, accent }: { active: boolean; accent: string }) {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill={active ? accent : "none"}
			stroke={active ? accent : "rgba(240,240,245,0.5)"}
			strokeWidth={1.2}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
		</svg>
	);
}

function PinIcon() {
	return (
		<svg
			width="11"
			height="11"
			viewBox="0 0 24 24"
			{...svgBase}
			className="shrink-0 text-white/40"
			aria-hidden="true"
		>
			<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
			<circle cx="12" cy="10" r="3" />
		</svg>
	);
}

function CheckIcon() {
	return (
		<svg
			width="13"
			height="13"
			viewBox="0 0 24 24"
			{...svgBase}
			aria-hidden="true"
		>
			<path d="M20 6 9 17l-5-5" />
		</svg>
	);
}

function PlusCircleIcon() {
	return (
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			{...svgBase}
			strokeWidth={1.6}
			className="shrink-0"
			style={{ color: "rgba(240,240,245,0.25)" }}
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="10" />
			<path d="M12 8v8M8 12h8" />
		</svg>
	);
}

function CompassMark() {
	return (
		<svg
			width="48"
			height="48"
			viewBox="0 0 32 32"
			fill="none"
			stroke="white"
			aria-hidden="true"
			className="mx-auto mb-4 opacity-20"
		>
			<circle cx="16" cy="16" r="14" strokeWidth="0.8" />
			<circle cx="16" cy="16" r="9" strokeWidth="0.6" strokeDasharray="1.5 3" />
			<polygon points="16,4 13.5,16 18.5,16" fill="white" />
			<polygon points="16,28 13.5,16 18.5,16" fill="white" fillOpacity="0.5" />
			<circle cx="16" cy="16" r="1.8" fill="white" />
		</svg>
	);
}

const ANIM = `
@keyframes oppIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
.opp-card { animation: oppIn 280ms ease-out both; }
@media (prefers-reduced-motion: reduce) { .opp-card { animation: none; } }
`;
