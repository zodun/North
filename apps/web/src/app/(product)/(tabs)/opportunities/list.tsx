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

// Per-category accent (left rail + category pill).
const CAT_COLOR: Record<string, string> = {
	job: GOLD,
	grant: TEAL,
	internship: "#7B61FF",
	event: "rgba(245,150,80,0.9)",
	accelerator: "rgba(80,200,120,0.9)",
	community: "rgba(200,100,245,0.9)",
	scholarship: "rgba(62,130,200,0.9)",
	"creator-programme": "rgba(123,97,255,0.8)",
};
const catColor = (id: string | null) =>
	(id && CAT_COLOR[id]) || "rgba(255,255,255,0.2)";

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
}: {
	items: Item[];
	topPicks: Item[];
	categories: Category[];
	initialSaved: string[];
	initialApplied: string[];
	userFocusAreas: string[];
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

	return (
		<div className="h-full overflow-y-auto bg-[#05050E] pb-24 font-jakarta">
			<style>{ANIM}</style>

			{/* Header */}
			<header className="px-[18px] pt-[18px]">
				<p className="mb-1 font-bold text-[9px] text-white/30 uppercase tracking-[0.15em]">
					Discover
				</p>
				<h1 className="mb-1 font-black text-[22px] text-white tracking-tight">
					Opportunities
				</h1>
				<p className="mb-4 text-[12px] text-white/40">
					Built for where you are headed.
				</p>
			</header>

			{/* Search */}
			<div className="mx-4 mb-4 flex items-center gap-3 rounded-[14px] border border-white/10 bg-white/5 px-4 py-3">
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
					className="flex-1 border-none bg-transparent font-medium text-[14px] text-white outline-none placeholder:text-white/[0.22]"
				/>
			</div>

			{/* Category filter */}
			<div
				className="mb-4 flex gap-2 overflow-x-auto scroll-smooth px-4 [&::-webkit-scrollbar]:hidden"
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
				filtered.map((item, i) => (
					<OpportunityCard
						key={item.id}
						item={item}
						index={i}
						isSaved={saved.has(item.id)}
						isApplied={applied.has(item.id)}
						isSaving={saving.has(item.id)}
						daysRemaining={mounted ? daysLeft(item.deadline) : null}
						userFocusAreas={userFocusAreas}
						onSave={() => void toggleSave(item)}
						onApply={() => void markApplied(item)}
					/>
				))
			)}

			{/* Submit CTA */}
			<button
				type="button"
				onClick={() => setShowSubmit(true)}
				className="mx-4 mb-4 flex w-[calc(100%-2rem)] cursor-pointer items-center justify-center gap-3 rounded-[18px] border border-white/15 border-dashed p-5 transition-colors hover:border-white/25 hover:bg-white/[0.03] motion-reduce:transition-none"
			>
				<PlusIcon />
				<span className="text-left">
					<span className="block font-bold text-[13px] text-white/40">
						Submit an opportunity
					</span>
					<span className="mt-0.5 block text-[11px] text-white/30">
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

// ── Card ─────────────────────────────────────────────────────────────────────

function OpportunityCard({
	item,
	index,
	isSaved,
	isApplied,
	isSaving,
	daysRemaining,
	userFocusAreas,
	onSave,
	onApply,
}: {
	item: Item;
	index: number;
	isSaved: boolean;
	isApplied: boolean;
	isSaving: boolean;
	daysRemaining: number | null;
	userFocusAreas: string[];
	onSave: () => void;
	onApply: () => void;
}) {
	const accent = catColor(item.category_id);
	const catLabel = item.category_id
		? (catLabelFor(item.category_id) ?? item.category_id)
		: null;
	const tags = item.focus_area_tags.slice(0, 4);
	const urgent = daysRemaining != null && daysRemaining < 7;

	return (
		<article
			tabIndex={-1}
			className="opp-card relative mx-4 mb-4 overflow-hidden rounded-[20px] border border-white/8 outline-none focus-visible:ring-2 focus-visible:ring-[#F5C842]"
			style={{
				backgroundColor: "rgba(12,12,24,0.9)",
				animationDelay: `${Math.min(index, 8) * 60}ms`,
			}}
		>
			<span
				aria-hidden="true"
				className="absolute top-0 bottom-0 left-0 w-[3px]"
				style={{ backgroundColor: accent }}
			/>

			{/* Header row */}
			<div className="flex items-start justify-between gap-3 px-4 pt-4">
				<div className="min-w-0">
					<div className="mb-2 flex flex-wrap items-center gap-2">
						{catLabel && (
							<span
								className="rounded-full border px-2.5 py-1 font-bold text-[9px]"
								style={{
									color: accent,
									backgroundColor: `${hexishAlpha(accent)}`,
									borderColor: accent,
								}}
							>
								{catLabel}
							</span>
						)}
						{item.opportunity_type && (
							<span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-bold text-[9px] text-white/45">
								{item.opportunity_type}
							</span>
						)}
					</div>
					<h2 className="mb-1 font-black text-[16px] text-white leading-[1.3] tracking-tight">
						{item.title}
					</h2>
					<p className="font-semibold text-[12px] text-white/50">{item.org}</p>
				</div>
				<button
					type="button"
					onClick={onSave}
					disabled={isSaving}
					aria-label={isSaved ? "Remove from saved" : "Save opportunity"}
					aria-pressed={isSaved}
					className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors hover:bg-white/12 disabled:opacity-50 motion-reduce:transition-none"
					style={{
						backgroundColor: isSaved
							? "rgba(245,200,66,0.12)"
							: "rgba(255,255,255,0.06)",
						borderColor: isSaved
							? "rgba(245,200,66,0.3)"
							: "rgba(255,255,255,0.10)",
					}}
				>
					<BookmarkIcon active={isSaved} />
				</button>
			</div>

			{/* Meta row */}
			{(item.deadline || item.location) && (
				<div className="flex flex-wrap items-center gap-3 px-4 pt-2.5">
					{item.deadline && (
						<Meta icon={<CalendarIcon />} text={item.deadline} />
					)}
					{item.location && <Meta icon={<PinIcon />} text={item.location} />}
				</div>
			)}

			{/* Why this */}
			{item.why && (
				<div className="mx-4 mt-2.5 rounded-[10px] bg-white/[0.03] p-3">
					<p className="mb-1.5 font-bold text-[9px] text-white/30 uppercase tracking-[0.12em]">
						Why this?
					</p>
					<p className="font-medium text-[12px] text-white/60 leading-relaxed">
						{item.why}
					</p>
				</div>
			)}

			{/* Tags */}
			{tags.length > 0 && (
				<div className="flex flex-wrap gap-2 px-4 pt-2.5">
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

			{/* Action row */}
			<div className="flex items-center justify-between px-4 pt-3 pb-4">
				{item.external_url ? (
					<button
						type="button"
						onClick={onApply}
						className="flex cursor-pointer items-center gap-1.5 rounded-[12px] border px-5 py-2.5 font-bold text-[13px] transition-colors motion-reduce:transition-none"
						style={
							isApplied
								? {
										color: TEAL,
										backgroundColor: "rgba(62,207,191,0.1)",
										borderColor: "rgba(62,207,191,0.25)",
									}
								: {
										color: GOLD,
										backgroundColor: "rgba(245,200,66,0.12)",
										borderColor: "rgba(245,200,66,0.3)",
									}
						}
					>
						{isApplied && <CheckIcon />}
						{isApplied ? "Applied" : "Apply now"}
					</button>
				) : (
					<span />
				)}
				{daysRemaining != null && (
					<span
						className="rounded-full border px-3 py-1.5 font-bold text-[10px]"
						style={
							urgent
								? {
										color: "rgba(245,130,130,0.95)",
										backgroundColor: "rgba(245,100,100,0.1)",
										borderColor: "rgba(245,100,100,0.25)",
									}
								: {
										color: "rgba(255,255,255,0.4)",
										backgroundColor: "rgba(255,255,255,0.05)",
										borderColor: "rgba(255,255,255,0.10)",
									}
						}
					>
						{daysRemaining === 0
							? "Closes today"
							: `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left`}
					</span>
				)}
			</div>
		</article>
	);
}

// Resolve a category id to its label without threading the prop into the card.
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
function catLabelFor(id: string): string | undefined {
	return CAT_LABELS[id];
}

function hexishAlpha(color: string): string {
	// gold/teal/violet are hex → append alpha; rgba() colours get a light wash.
	if (color.startsWith("#")) return `${color}14`;
	return color.replace(/0?\.\d+\)$/, "0.08)");
}

function Meta({ icon, text }: { icon: React.ReactNode; text: string }) {
	return (
		<span className="flex items-center gap-1.5">
			<span className="text-white/30">{icon}</span>
			<span className="font-medium text-[11px] text-white/50">{text}</span>
		</span>
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
			className={`shrink-0 cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-[11px] transition-all motion-reduce:transition-none ${
				active ? "font-extrabold" : "font-bold hover:bg-white/10"
			}`}
			style={
				active
					? {
							backgroundColor: GOLD,
							color: "#05050E",
							transform: "scale(1.02)",
						}
					: {
							backgroundColor: "rgba(255,255,255,0.06)",
							border: "1px solid rgba(255,255,255,0.10)",
							color: "rgba(255,255,255,0.45)",
						}
			}
		>
			{label}
		</button>
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

function BookmarkIcon({ active }: { active: boolean }) {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill={active ? GOLD : "none"}
			stroke={active ? GOLD : "rgba(255,255,255,0.4)"}
			strokeWidth={1.8}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
		</svg>
	);
}

function CalendarIcon() {
	return (
		<svg
			width="12"
			height="12"
			viewBox="0 0 24 24"
			{...svgBase}
			aria-hidden="true"
		>
			<rect x="3" y="4" width="18" height="18" rx="2" />
			<path d="M16 2v4M8 2v4M3 10h18" />
		</svg>
	);
}

function PinIcon() {
	return (
		<svg
			width="12"
			height="12"
			viewBox="0 0 24 24"
			{...svgBase}
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

function PlusIcon() {
	return (
		<svg
			width="20"
			height="20"
			viewBox="0 0 24 24"
			{...svgBase}
			className="shrink-0 text-white/25"
			aria-hidden="true"
		>
			<path d="M12 5v14M5 12h14" />
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
