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

export function OpportunitiesList({
	items,
	categories,
	initialSaved,
	initialApplied,
}: {
	items: Item[];
	categories: Category[];
	initialSaved: string[];
	initialApplied: string[];
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
		<div className="flex h-full flex-col bg-[#0a0a0a]">
			{showSubmit && (
				<SubmitOpportunityForm onClose={() => setShowSubmit(false)} />
			)}

			{/* Header */}
			<div className="px-5 pt-14 pb-3">
				<h1 className="mb-4 font-semibold text-[22px] text-white tracking-tight">
					Worth a look
				</h1>
				<div className="relative">
					<svg
						className="absolute top-1/2 left-3.5 -translate-y-1/2"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="rgba(255,255,255,0.35)"
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
						placeholder="Search opportunities..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full rounded-xl border border-white/8 bg-white/5 py-2.5 pr-4 pl-9 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-white/20"
					/>
				</div>
			</div>

			{/* Category pills */}
			<div className="flex gap-2 overflow-x-auto px-5 pb-3 [&::-webkit-scrollbar]:hidden">
				<button
					type="button"
					onClick={() => setActiveCategory(null)}
					className={`shrink-0 rounded-full border px-3.5 py-1.5 font-medium text-[12px] transition-colors ${!activeCategory ? "border-white/30 bg-white/12 text-white" : "border-white/8 text-white/40"}`}
				>
					All
				</button>
				{categories.map((cat) => (
					<button
						key={cat.id}
						type="button"
						onClick={() =>
							setActiveCategory(cat.id === activeCategory ? null : cat.id)
						}
						className={`shrink-0 rounded-full border px-3.5 py-1.5 font-medium text-[12px] transition-colors ${activeCategory === cat.id ? "border-white/30 bg-white/12 text-white" : "border-white/8 text-white/40"}`}
					>
						{cat.label}
					</button>
				))}
			</div>

			{/* List */}
			<div className="flex-1 overflow-y-auto px-4 pb-4">
				{filtered.length === 0 ? (
					<div className="flex h-32 items-center justify-center">
						<p className="text-[13px] text-white/30">No results</p>
					</div>
				) : (
					<div className="flex flex-col gap-2.5">
						{filtered.map((item) => {
							const eyebrow =
								(CAT_LABELS[item.category_id ?? ""] ?? item.category_id) ||
								item.opportunity_type;
							const isApplied = applied.has(item.id);

							return (
								<article
									key={item.id}
									className="rounded-2xl border border-white/6 bg-white/[0.03] p-4"
								>
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0 flex-1">
											<h3 className="font-semibold text-[15px] text-white leading-snug">
												{item.title}
											</h3>
											<p className="mt-0.5 text-[12px] text-white/45">
												{item.org}
											</p>
											{eyebrow && (
												<div className="mt-2 flex flex-wrap gap-1.5">
													{[
														CAT_LABELS[item.category_id ?? ""] ??
															item.category_id,
														item.opportunity_type,
													]
														.filter(Boolean)
														.map((tag) => (
															<span
																key={tag}
																className="rounded-full border border-white/12 bg-white/6 px-2.5 py-0.5 font-medium text-[11px] text-white/55"
															>
																{tag}
															</span>
														))}
												</div>
											)}
										</div>
										<button
											type="button"
											onClick={() => void toggleSave(item)}
											disabled={saving.has(item.id)}
											className="mt-0.5 shrink-0 rounded-lg p-1.5 transition-colors disabled:opacity-40"
											aria-label={saved.has(item.id) ? "Unsave" : "Save"}
										>
											<svg
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill={saved.has(item.id) ? "white" : "none"}
												stroke={
													saved.has(item.id) ? "white" : "rgba(255,255,255,0.4)"
												}
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
										<p className="mt-2 text-[12px] text-white/35">
											{[
												item.location,
												item.deadline ? `Deadline: ${item.deadline}` : null,
											]
												.filter(Boolean)
												.join(" · ")}
										</p>
									)}

									{item.why && (
										<p className="mt-2.5 rounded-xl bg-white/4 px-3 py-2 text-[12px] text-white/55 leading-relaxed">
											<span className="font-semibold text-white/70">Why: </span>
											{item.why}
										</p>
									)}

									{item.external_url && (
										<div className="mt-3">
											<button
												type="button"
												onClick={() => void markApplied(item)}
												className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 font-semibold text-[13px] transition-colors ${isApplied ? "border-[#7ec4bb]/40 bg-[#7ec4bb]/10 text-[#7ec4bb]" : "border-white/15 bg-white/6 text-white active:bg-white/12"}`}
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
						})}
					</div>
				)}

				{/* Submit CTA */}
				<button
					type="button"
					onClick={() => setShowSubmit(true)}
					className="mt-4 w-full rounded-2xl border border-white/15 border-dashed py-4 font-medium text-[13px] text-white/35 transition-colors hover:border-white/25 hover:text-white/50"
				>
					+ Know an opportunity worth sharing?
				</button>
			</div>
		</div>
	);
}
