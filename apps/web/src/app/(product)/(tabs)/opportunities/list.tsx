"use client";

import { useState } from "react";
import { supabase } from "@/lib/auth-client";

type Category = { id: string; label: string };
type Item = {
	id: string;
	title: string;
	org: string;
	location: string | null;
	deadline: string | null;
	external_url: string | null;
	description: string | null;
	why: string | null;
	category_id: string | null;
};

export function OpportunitiesList({
	items,
	categories,
	initialSaved,
}: {
	items: Item[];
	categories: Category[];
	initialSaved: string[];
}) {
	const [search, setSearch] = useState("");
	const [activeCategory, setActiveCategory] = useState<string | null>(null);
	const [saved, setSaved] = useState<Set<string>>(new Set(initialSaved));
	const [saving, setSaving] = useState<Set<string>>(new Set());

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
				const next = new Set(prev);
				next.delete(item.id);
				return next;
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
			const next = new Set(prev);
			next.delete(item.id);
			return next;
		});
	}

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="px-5 pt-14 pb-4">
				<h1 className="mb-4 font-semibold text-2xl text-white tracking-tight">
					Worth a look
				</h1>
				<div className="relative">
					<svg
						className="absolute top-1/2 left-3 -translate-y-1/2"
						width="15"
						height="15"
						viewBox="0 0 24 24"
						fill="none"
						stroke="rgba(255,255,255,0.4)"
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
						className="w-full rounded-xl border border-white/10 bg-white/6 py-2.5 pr-4 pl-9 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
					/>
				</div>
			</div>

			{/* Category pills */}
			{categories.length > 0 && (
				<div
					className="flex gap-2 overflow-x-auto px-5 pb-3"
					style={{ scrollbarWidth: "none" }}
				>
					<button
						type="button"
						onClick={() => setActiveCategory(null)}
						className={`shrink-0 rounded-full border px-3 py-1 font-medium text-[11px] transition-colors ${
							!activeCategory
								? "border-white/40 bg-white/15 text-white"
								: "border-white/10 bg-transparent text-white/50"
						}`}
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
							className={`shrink-0 rounded-full border px-3 py-1 font-medium text-[11px] transition-colors ${
								activeCategory === cat.id
									? "border-white/40 bg-white/15 text-white"
									: "border-white/10 bg-transparent text-white/50"
							}`}
						>
							{cat.label}
						</button>
					))}
				</div>
			)}

			{/* List */}
			<div className="flex-1 overflow-y-auto px-4 pb-4">
				{filtered.length === 0 ? (
					<div className="flex h-32 items-center justify-center">
						<p className="text-sm text-white/40">No results found</p>
					</div>
				) : (
					<div className="flex flex-col gap-3">
						{filtered.map((item) => (
							<article
								key={item.id}
								className="rounded-2xl border border-white/8 bg-white/4 p-4"
							>
								<div className="mb-2 flex items-start justify-between gap-2">
									<div className="min-w-0 flex-1">
										<h3 className="font-semibold text-[15px] text-white leading-snug">
											{item.title}
										</h3>
										<p className="mt-0.5 text-[12px] text-white/50">
											{item.org}
										</p>
									</div>
									<div className="flex shrink-0 items-center gap-2">
										<button
											type="button"
											onClick={() => void toggleSave(item)}
											disabled={saving.has(item.id)}
											className="rounded-lg border border-white/12 bg-white/6 px-2.5 py-1.5 text-[12px] transition-colors disabled:opacity-40"
											title={saved.has(item.id) ? "Unsave" : "Save"}
										>
											<svg
												width="14"
												height="14"
												viewBox="0 0 24 24"
												fill={saved.has(item.id) ? "white" : "none"}
												stroke="white"
												strokeWidth={1.8}
												strokeLinecap="round"
												strokeLinejoin="round"
												aria-hidden="true"
											>
												<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
											</svg>
										</button>
										{item.external_url && (
											<a
												href={item.external_url}
												target="_blank"
												rel="noopener noreferrer"
												className="rounded-lg border border-white/20 bg-white/8 px-3 py-1.5 font-semibold text-[12px] text-white"
											>
												Apply →
											</a>
										)}
									</div>
								</div>
								{item.description && (
									<p className="mb-2 line-clamp-2 text-[13px] text-white/55 leading-relaxed">
										{item.description}
									</p>
								)}
								{item.why && (
									<p className="mb-3 rounded-lg bg-white/5 px-3 py-2 text-[12px] text-white/60 leading-relaxed">
										<span className="font-semibold text-white/80">
											Why this:{" "}
										</span>
										{item.why}
									</p>
								)}
								<div className="flex flex-wrap gap-2">
									{item.location && (
										<span className="rounded-full bg-white/6 px-2.5 py-0.5 text-[11px] text-white/50">
											📍 {item.location}
										</span>
									)}
									{item.deadline && (
										<span className="rounded-full bg-white/6 px-2.5 py-0.5 text-[11px] text-white/50">
											⏰ {item.deadline}
										</span>
									)}
								</div>
							</article>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
