"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/auth-client";

type Item = {
	id: string;
	kind: string;
	title: string;
	eyebrow: string | null;
	body: string | null;
	source: string | null;
	external_url: string | null;
	cloudinary_public_id: string | null;
	thumbnail_url: string | null;
	content_category_id: string | null;
	published_at: string;
};

const KIND_LABELS: Record<string, string> = {
	essay: "Read",
	voice: "Listen",
	story: "Story",
	opportunity: "Open",
	video: "Watch",
};

// Per-kind accent colour
const KIND_ACCENT: Record<string, string> = {
	essay: "#F5C842",
	voice: "#3ECFBF",
	story: "#7B61FF",
	opportunity: "#3ECFBF",
	video: "rgba(240,240,245,0.7)",
};

// Per-kind atmospheric radial glow for non-video cards
const KIND_GLOW: Record<string, string> = {
	essay:
		"radial-gradient(ellipse at 18% 18%, rgba(245,200,66,0.22) 0%, transparent 58%)",
	voice:
		"radial-gradient(ellipse at 82% 78%, rgba(62,207,191,0.2) 0%, transparent 58%)",
	story:
		"radial-gradient(ellipse at 80% 18%, rgba(123,97,255,0.2) 0%, transparent 58%)",
	opportunity:
		"radial-gradient(ellipse at 18% 20%, rgba(62,207,191,0.2) 0%, transparent 58%)",
};

function youtubeEmbedUrl(url: string): string | null {
	const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
	return match ? `https://www.youtube.com/embed/${match[1]}?rel=0` : null;
}

// ── Static compass watermark ───────────────────────────────────────────────

function CompassWatermark() {
	return (
		<div
			aria-hidden="true"
			className="pointer-events-none absolute inset-0 flex items-center justify-center"
		>
			<svg
				width="280"
				height="280"
				viewBox="0 0 32 32"
				fill="none"
				opacity="0.045"
				aria-hidden="true"
			>
				<circle cx="16" cy="16" r="14" stroke="white" strokeWidth="0.6" />
				<circle
					cx="16"
					cy="16"
					r="9"
					stroke="white"
					strokeWidth="0.5"
					strokeDasharray="1.5 3"
				/>
				<circle cx="16" cy="16" r="5" stroke="white" strokeWidth="0.5" />
				<line x1="16" y1="2" x2="16" y2="30" stroke="white" strokeWidth="0.4" />
				<line x1="2" y1="16" x2="30" y2="16" stroke="white" strokeWidth="0.4" />
				<line
					x1="4.7"
					y1="4.7"
					x2="27.3"
					y2="27.3"
					stroke="white"
					strokeWidth="0.3"
				/>
				<line
					x1="27.3"
					y1="4.7"
					x2="4.7"
					y2="27.3"
					stroke="white"
					strokeWidth="0.3"
				/>
				<polygon points="16,4 14,16 18,16" fill="white" />
				<polygon points="16,28 14,16 18,16" fill="white" fillOpacity="0.6" />
				<polygon points="28,16 16,14 16,18" fill="white" fillOpacity="0.4" />
				<polygon points="4,16 16,14 16,18" fill="white" fillOpacity="0.4" />
				<circle cx="16" cy="16" r="1.8" fill="white" />
				<circle cx="16" cy="16" r="0.7" fill="#05050E" />
			</svg>
		</div>
	);
}

// ── Video card background ──────────────────────────────────────────────────

function VideoBackground({ item }: { item: Item }) {
	if (!item.external_url) {
		return (
			<>
				<div className="absolute inset-0 bg-[#05050E]" />
				<CompassWatermark />
			</>
		);
	}
	const ytEmbed = youtubeEmbedUrl(item.external_url);
	if (ytEmbed) {
		return (
			<div className="absolute inset-0">
				{item.thumbnail_url && (
					// biome-ignore lint/performance/noImgElement: decorative background with no fixed dimensions
					<img
						src={item.thumbnail_url}
						alt=""
						className="absolute inset-0 h-full w-full object-cover"
					/>
				)}
				<div className="absolute inset-0 bg-black/55" />
				{/* Bottom vignette */}
				<div
					className="absolute inset-0"
					style={{
						background:
							"linear-gradient(to top, rgba(5,5,14,0.96) 0%, rgba(5,5,14,0.55) 35%, transparent 65%)",
					}}
				/>
			</div>
		);
	}
	return (
		<div className="absolute inset-0">
			<video
				src={item.external_url}
				className="h-full w-full object-cover"
				autoPlay
				muted
				loop
				playsInline
			/>
			<div
				className="absolute inset-0"
				style={{
					background:
						"linear-gradient(to top, rgba(5,5,14,0.94) 0%, rgba(5,5,14,0.4) 35%, transparent 65%)",
				}}
			/>
		</div>
	);
}

// ── Static card background for non-video ──────────────────────────────────

function CardBackground({ kind }: { kind: string }) {
	const glow =
		KIND_GLOW[kind] ??
		"radial-gradient(ellipse at 50% 50%, rgba(245,200,66,0.1) 0%, transparent 60%)";

	return (
		<>
			{/* Base */}
			<div className="absolute inset-0 bg-[#05050E]" />
			{/* Type glow */}
			<div className="absolute inset-0" style={{ background: glow }} />
			{/* Subtle violet counter-glow */}
			<div
				className="absolute inset-0"
				style={{
					background:
						"radial-gradient(ellipse at 90% 85%, rgba(123,97,255,0.1) 0%, transparent 55%)",
				}}
			/>
			{/* Compass watermark */}
			<CompassWatermark />
			{/* Bottom vignette for text legibility */}
			<div
				className="absolute inset-0"
				style={{
					background:
						"linear-gradient(to top, rgba(5,5,14,0.98) 0%, rgba(5,5,14,0.82) 28%, rgba(5,5,14,0.3) 55%, transparent 75%)",
				}}
			/>
		</>
	);
}

// ── Types ──────────────────────────────────────────────────────────────────

type Category = { id: string; label: string };

// ── Main feed ──────────────────────────────────────────────────────────────

export function ForYouFeed({
	items,
	categories,
	initialSaved,
	initialMatters,
}: {
	items: Item[];
	categories: Category[];
	initialSaved: string[];
	initialMatters: string[];
}) {
	const [saved, setSaved] = useState<Set<string>>(new Set(initialSaved));
	const [matters, setMatters] = useState<Set<string>>(new Set(initialMatters));
	const [activeCategory, setActiveCategory] = useState<string | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: stable join strings are intentional stable dep keys
	useEffect(() => {
		setSaved(new Set(initialSaved));
		setMatters(new Set(initialMatters));
	}, [initialSaved.join(","), initialMatters.join(",")]);

	async function record(item: Item, action: "save" | "matters") {
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) return;

		if (action === "save") {
			setSaved((prev) => new Set([...prev, item.id]));
		} else {
			setMatters((prev) => new Set([...prev, item.id]));
		}

		await supabase.from("content_interactions").insert({
			user_id: user.id,
			content_item_id: item.id,
			action,
			content_category_id: item.content_category_id,
			kind: item.kind,
		});
	}

	const filtered = activeCategory
		? items.filter((item) => item.content_category_id === activeCategory)
		: items;

	if (items.length === 0) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
				<CompassWatermark />
				<p className="relative z-10 font-medium text-[14px] text-white/30">
					No content yet. Check back soon.
				</p>
			</div>
		);
	}

	return (
		<>
			{/* Category filter bar */}
			{categories.length > 0 && (
				<div className="absolute top-14 right-0 left-0 z-10 flex gap-2 overflow-x-auto px-4 py-2 [&::-webkit-scrollbar]:hidden">
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
			)}

			<div
				className="h-full snap-y snap-mandatory overflow-y-scroll"
				style={{ scrollbarWidth: "none" }}
			>
				{filtered.length === 0 ? (
					<div className="flex h-full items-center justify-center">
						<p className="font-medium text-[14px] text-white/30">
							Nothing in this category yet.
						</p>
					</div>
				) : null}

				{filtered.map((item) => {
					const ytEmbed = item.external_url
						? youtubeEmbedUrl(item.external_url)
						: null;
					const isVideo = item.kind === "video";
					const accent = KIND_ACCENT[item.kind] ?? "rgba(240,240,245,0.7)";

					return (
						<div
							key={item.id}
							className="relative flex h-svh snap-start snap-always flex-col overflow-hidden"
							style={{ minHeight: "100svh" }}
						>
							{/* Background */}
							{isVideo ? (
								<VideoBackground item={item} />
							) : (
								<CardBackground kind={item.kind} />
							)}

							{/* Top chrome */}
							<div className="relative flex items-center justify-between px-5 pt-14 pb-4">
								{/* Kind badge with type accent */}
								<span
									className="rounded-full border px-3 py-[5px] font-bold text-[11px] backdrop-blur-sm"
									style={{
										borderColor: `${accent}50`,
										backgroundColor: `${accent}18`,
										color: accent,
									}}
								>
									{KIND_LABELS[item.kind] ?? item.kind}
								</span>
								{item.eyebrow && (
									<span className="text-[11px] text-white/35">
										{item.eyebrow}
									</span>
								)}
							</div>

							{/* YouTube embed */}
							{isVideo && ytEmbed && (
								<div className="relative flex-1 px-4 pb-4">
									<iframe
										src={ytEmbed}
										className="h-full w-full rounded-2xl"
										allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
										allowFullScreen
										title={item.title}
									/>
								</div>
							)}

							{/* Text content */}
							<div
								className={`relative flex flex-col px-5 pb-6 ${isVideo && ytEmbed ? "pt-2" : "flex-1 justify-end"}`}
							>
								<h2 className="mb-3 font-black font-jakarta text-[27px] text-white leading-[1.18] tracking-tight">
									{item.title}
								</h2>

								{item.body && !ytEmbed && (
									<p className="mb-5 font-medium text-[15px] text-white/55 leading-relaxed">
										{item.body}
									</p>
								)}

								<div className="flex items-center gap-3">
									{item.source && (
										<span className="text-[12px] text-white/35">
											{item.source}
										</span>
									)}
									{item.external_url && !isVideo && (
										<a
											href={item.external_url}
											target="_blank"
											rel="noopener noreferrer"
											className="rounded-full border px-4 py-[7px] font-bold text-[13px] transition-colors"
											style={{
												borderColor: `${accent}45`,
												backgroundColor: `${accent}15`,
												color: accent,
											}}
										>
											Open →
										</a>
									)}
								</div>
							</div>

							{/* Action rail */}
							<div className="absolute right-3 bottom-28 flex flex-col items-center gap-5">
								<ActionButton
									active={matters.has(item.id)}
									activeColor="#F5C842"
									onClick={() => record(item, "matters")}
									label="Matters"
								>
									<StarIcon active={matters.has(item.id)} />
								</ActionButton>
								<ActionButton
									active={saved.has(item.id)}
									activeColor="#3ECFBF"
									onClick={() => record(item, "save")}
									label="Save"
								>
									<BookmarkIcon active={saved.has(item.id)} />
								</ActionButton>
							</div>
						</div>
					);
				})}
			</div>
		</>
	);
}

// ── Category pill ──────────────────────────────────────────────────────────

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
			className="shrink-0 cursor-pointer rounded-full border px-3 py-[5px] font-bold text-[11px] backdrop-blur-sm transition-all"
			style={
				active
					? {
							borderColor: "rgba(245,200,66,0.5)",
							backgroundColor: "rgba(245,200,66,0.14)",
							color: "#F5C842",
						}
					: {
							borderColor: "rgba(255,255,255,0.12)",
							backgroundColor: "rgba(5,5,14,0.5)",
							color: "rgba(240,240,245,0.4)",
						}
			}
		>
			{label}
		</button>
	);
}

// ── Action button ──────────────────────────────────────────────────────────

function ActionButton({
	active,
	activeColor,
	onClick,
	label,
	children,
}: {
	active: boolean;
	activeColor: string;
	onClick: () => void;
	label: string;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex cursor-pointer flex-col items-center gap-1.5"
		>
			<div
				className="flex h-11 w-11 items-center justify-center rounded-full border transition-all"
				style={
					active
						? {
								borderColor: `${activeColor}55`,
								backgroundColor: `${activeColor}18`,
								boxShadow: `0 0 16px ${activeColor}40`,
							}
						: {
								borderColor: "rgba(255,255,255,0.1)",
								backgroundColor: "rgba(255,255,255,0.05)",
							}
				}
			>
				{children}
			</div>
			<span
				className="font-bold text-[10px] transition-colors"
				style={{ color: active ? activeColor : "rgba(240,240,245,0.35)" }}
			>
				{label}
			</span>
		</button>
	);
}

// ── Icons ──────────────────────────────────────────────────────────────────

function StarIcon({ active }: { active: boolean }) {
	return (
		<svg
			width="19"
			height="19"
			viewBox="0 0 24 24"
			fill={active ? "#F5C842" : "none"}
			stroke={active ? "#F5C842" : "white"}
			strokeWidth={1.8}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
		</svg>
	);
}

function BookmarkIcon({ active }: { active: boolean }) {
	return (
		<svg
			width="19"
			height="19"
			viewBox="0 0 24 24"
			fill={active ? "#3ECFBF" : "none"}
			stroke={active ? "#3ECFBF" : "white"}
			strokeWidth={1.8}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
		</svg>
	);
}
