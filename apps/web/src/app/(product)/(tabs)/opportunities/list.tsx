"use client";

import { useState } from "react";
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

// Focus area accent colours
const FOCUS_COLORS: Record<string, string> = {
	craft: "#7ec4bb",
	venture: "#d4a574",
	mind: "#9aaee0",
	people: "#c97a5a",
	money: "#a8b97a",
	learn: "#b39ad8",
};

const FOCUS_LABELS: Record<string, string> = {
	craft: "Craft",
	venture: "Venture",
	mind: "Mind",
	people: "People",
	money: "Money",
	learn: "Learning",
};

// Source display names
const SOURCE_LABELS: Record<string, string> = {
	"opportunity-desk": "Opportunity Desk",
	scholars4dev: "Scholars4Dev",
	youthop: "Youth Op",
	"afterschool-africa": "After School Africa",
	"world-scholarship-forum": "World Scholarships",
	"opportunities-for-africans": "Opps for Africans",
	youth4work: "Devex",
};

export function OpportunitiesList({
	items,
	topPicks,
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

	const filtered = items.filter((item) => {
		const matchSearch =
			!search ||
			item.title.toLowerCase().includes(search.toLowerCase()) ||
			item.org.toLowerCase().includes(search.toLowerCase());
		const matchCategory =
			!activeCategory || item.category_id === activeCategory;
		return matchSearch && matchCategory;
	});

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
		<div className="flex h-full flex-col bg-[#05050E]">
			{showSubmit && (
				<SubmitOpportunityForm onClose={() => setShowSubmit(false)} />
			)}

			{/* Header */}
			<div className="px-5 pt-14 pb-3">
				<h1 className="mb-1 font-black font-jakarta text-[22px] text-white tracking-tight">
					Open doors
				</h1>
				<p className="mb-4 text-[13px] text-white/35">
					{items.length} opportunities · updated daily
				</p>
				{/* Search */}
				<div className="relative">
					<svg
						className="absolute top-1/2 left-3.5 -translate-y-1/2"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="rgba(255,255,255,0.3)"
						strokeWidth={2}
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<circle cx="11" cy="11" r="8" />
						<path d="M21 21l-4.35-4.35" />
					</svg>
					<input
						type="search"
						placeholder="Search opportunities…"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full rounded-xl border border-white/8 bg-white/5 py-2.5 pr-4 pl-9 text-[14px] text-white placeholder:text-white/22 focus:outline-none focus:ring-1 focus:ring-[#3ECFBF]/40"
					/>
				</div>
			</div>

			{/* Category pills */}
			<div className="flex gap-2 overflow-x-auto px-5 pb-3 [&::-webkit-scrollbar]:hidden">
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

			<div className="flex-1 overflow-y-auto">
				{/* ── Best for you ── */}
				{topPicks.length > 0 && !search && !activeCategory && (
					<section className="mb-1 px-5 pt-1 pb-3">
						<div className="mb-2.5 flex items-center gap-2">
							<div className="h-2 w-2 rounded-full bg-[#F5C842]" />
							<span className="font-bold text-[#F5C842] text-[11px] uppercase tracking-[0.12em]">
								Best for you
							</span>
						</div>
						<div className="flex gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
							{topPicks.map((item) => (
								<TopPickCard
									key={item.id}
									item={item}
									isSaved={saved.has(item.id)}
									isApplied={applied.has(item.id)}
									onSave={() => void toggleSave(item)}
									onApply={() => void markApplied(item)}
									userFocusAreas={userFocusAreas}
								/>
							))}
						</div>
					</section>
				)}

				{/* ── All opportunities ── */}
				<div className="px-4 pb-4">
					{filtered.length === 0 ? (
						<div className="flex h-32 items-center justify-center">
							<p className="text-[13px] text-white/30">No results</p>
						</div>
					) : (
						<div className="flex flex-col gap-2.5">
							{topPicks.length > 0 && !search && !activeCategory && (
								<p className="mb-1 font-medium text-[11px] text-white/25 uppercase tracking-[0.1em]">
									All opportunities
								</p>
							)}
							{filtered.map((item) => (
								<OpportunityCard
									key={item.id}
									item={item}
									isSaved={saved.has(item.id)}
									isApplied={applied.has(item.id)}
									isSaving={saving.has(item.id)}
									onSave={() => void toggleSave(item)}
									onApply={() => void markApplied(item)}
									userFocusAreas={userFocusAreas}
								/>
							))}
						</div>
					)}

					<button
						type="button"
						onClick={() => setShowSubmit(true)}
						className="mt-4 w-full cursor-pointer rounded-2xl border border-white/12 border-dashed py-4 font-medium text-[13px] text-white/30 transition-colors hover:border-white/22 hover:text-white/50"
					>
						+ Know an opportunity worth sharing?
					</button>
				</div>
			</div>
		</div>
	);
}

// ── Category pill ────────────────────────────────────────────────────────────

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
			className="shrink-0 cursor-pointer rounded-full border px-3.5 py-1.5 font-bold text-[12px] transition-colors"
			style={
				active
					? {
							borderColor: "rgba(245,200,66,0.45)",
							backgroundColor: "rgba(245,200,66,0.12)",
							color: "#F5C842",
						}
					: {
							borderColor: "rgba(255,255,255,0.08)",
							backgroundColor: "transparent",
							color: "rgba(240,240,245,0.38)",
						}
			}
		>
			{label}
		</button>
	);
}

// ── Top-pick horizontal card ─────────────────────────────────────────────────

function TopPickCard({
	item,
	isSaved,
	isApplied,
	onSave,
	onApply,
	userFocusAreas,
}: {
	item: Item;
	isSaved: boolean;
	isApplied: boolean;
	onSave: () => void;
	onApply: () => void;
	userFocusAreas: string[];
}) {
	const matchedArea = item.focus_area_tags.find((t) =>
		userFocusAreas.includes(t),
	);
	const accent = matchedArea ? FOCUS_COLORS[matchedArea] : "#F5C842";
	const areaLabel = matchedArea ? FOCUS_LABELS[matchedArea] : null;

	return (
		<div
			className="flex w-[260px] shrink-0 flex-col gap-3 rounded-2xl border p-4"
			style={{
				background:
					"linear-gradient(135deg, rgba(12,12,24,0.95) 0%, rgba(12,12,24,0.88) 100%)",
				borderColor: `${accent}30`,
				boxShadow: `0 4px 24px ${accent}15`,
			}}
		>
			{/* Area match badge */}
			{areaLabel && (
				<div className="flex items-center gap-1.5">
					<div
						className="h-1.5 w-1.5 rounded-full"
						style={{ backgroundColor: accent }}
					/>
					<span
						className="font-bold text-[10px] uppercase tracking-[0.1em]"
						style={{ color: accent }}
					>
						{areaLabel}
					</span>
				</div>
			)}

			<div className="flex-1">
				<p className="line-clamp-3 font-black font-jakarta text-[14px] text-white leading-snug">
					{item.title}
				</p>
				<p className="mt-1 text-[11px] text-white/40">{item.org}</p>
				{item.deadline && (
					<p className="mt-1.5 text-[11px] text-white/30">⏰ {item.deadline}</p>
				)}
			</div>

			{/* Actions */}
			<div className="flex items-center gap-2">
				{item.external_url && (
					<button
						type="button"
						onClick={onApply}
						className="flex-1 cursor-pointer rounded-xl py-2 text-center font-bold text-[12px] transition-colors"
						style={
							isApplied
								? {
										borderColor: `${accent}40`,
										border: "1px solid",
										backgroundColor: `${accent}15`,
										color: accent,
									}
								: {
										backgroundColor: accent,
										color: "#05050E",
									}
						}
					>
						{isApplied ? "✓ Applied" : "Apply →"}
					</button>
				)}
				<button
					type="button"
					onClick={onSave}
					className="cursor-pointer rounded-xl border border-white/10 p-2 transition-colors hover:border-white/20"
					aria-label={isSaved ? "Unsave" : "Save"}
				>
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill={isSaved ? "white" : "none"}
						stroke={isSaved ? "white" : "rgba(255,255,255,0.4)"}
						strokeWidth={1.8}
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
					</svg>
				</button>
			</div>
		</div>
	);
}

// ── Full opportunity card ────────────────────────────────────────────────────

function OpportunityCard({
	item,
	isSaved,
	isApplied,
	isSaving,
	onSave,
	onApply,
	userFocusAreas,
}: {
	item: Item;
	isSaved: boolean;
	isApplied: boolean;
	isSaving: boolean;
	onSave: () => void;
	onApply: () => void;
	userFocusAreas: string[];
}) {
	const matchedArea = item.focus_area_tags.find((t) =>
		userFocusAreas.includes(t),
	);
	const accent = matchedArea ? FOCUS_COLORS[matchedArea] : null;
	const catLabel = CAT_LABELS[item.category_id ?? ""] ?? item.category_id;

	return (
		<article
			className="rounded-2xl border p-4"
			style={{
				borderColor: accent ? `${accent}25` : "rgba(255,255,255,0.06)",
				backgroundColor: accent
					? "rgba(12,12,24,0.95)"
					: "rgba(255,255,255,0.02)",
			}}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<h3 className="font-black font-jakarta text-[15px] text-white leading-snug">
						{item.title}
					</h3>
					<p className="mt-0.5 text-[12px] text-white/40">{item.org}</p>

					{/* Tags row */}
					<div className="mt-2 flex flex-wrap gap-1.5">
						{catLabel && (
							<span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-medium text-[11px] text-white/50">
								{catLabel}
							</span>
						)}
						{item.opportunity_type && (
							<span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-medium text-[11px] text-white/50">
								{item.opportunity_type}
							</span>
						)}
						{matchedArea && accent && (
							<span
								className="rounded-full border px-2.5 py-0.5 font-bold text-[10px]"
								style={{
									borderColor: `${accent}40`,
									backgroundColor: `${accent}15`,
									color: accent,
								}}
							>
								{FOCUS_LABELS[matchedArea]}
							</span>
						)}
						{item.source && SOURCE_LABELS[item.source] && (
							<span className="rounded-full border border-white/8 bg-white/3 px-2.5 py-0.5 font-medium text-[10px] text-white/30">
								{SOURCE_LABELS[item.source]}
							</span>
						)}
					</div>
				</div>

				<button
					type="button"
					onClick={onSave}
					disabled={isSaving}
					className="mt-0.5 shrink-0 cursor-pointer rounded-lg p-1.5 transition-colors disabled:opacity-40"
					aria-label={isSaved ? "Unsave" : "Save"}
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill={isSaved ? "white" : "none"}
						stroke={isSaved ? "white" : "rgba(255,255,255,0.35)"}
						strokeWidth={1.8}
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
					</svg>
				</button>
			</div>

			{(item.location || item.deadline) && (
				<p className="mt-2 text-[12px] text-white/30">
					{[item.location, item.deadline ? `Due: ${item.deadline}` : null]
						.filter(Boolean)
						.join(" · ")}
				</p>
			)}

			{item.why && (
				<p className="mt-2.5 line-clamp-3 rounded-xl bg-white/4 px-3 py-2 text-[12px] text-white/50 leading-relaxed">
					{item.why}
				</p>
			)}

			{item.external_url && (
				<div className="mt-3">
					<button
						type="button"
						onClick={onApply}
						className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-4 py-2 font-bold text-[13px] transition-colors"
						style={
							isApplied
								? {
										borderColor: "rgba(62,207,191,0.4)",
										backgroundColor: "rgba(62,207,191,0.1)",
										color: "#3ECFBF",
									}
								: {
										borderColor: "rgba(255,255,255,0.14)",
										backgroundColor: "rgba(255,255,255,0.05)",
										color: "white",
									}
						}
					>
						{isApplied ? "✓ Applied" : "Apply now"}
						{!isApplied && (
							<svg
								width="12"
								height="12"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth={2.5}
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<path d="M5 12h14M12 5l7 7-7 7" />
							</svg>
						)}
					</button>
				</div>
			)}
		</article>
	);
}
