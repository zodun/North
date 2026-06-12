"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/auth-client";
import { VideoUploadSheet } from "./video-upload-sheet";

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
	why?: string | null;
};

type Category = { id: string; label: string };

const GOLD = "#F5C842";
const TEAL = "#3ECFBF";
const VIOLET = "#7B61FF";
const MATTERS = "rgba(245,100,100,0.9)";

// Per-kind presentation. type drives the background treatment; data/playback
// logic is unchanged.
type KindConf = {
	label: string;
	accent: string;
	type: "read" | "watch" | "listen";
};
const KIND: Record<string, KindConf> = {
	essay: { label: "Read", accent: GOLD, type: "read" },
	story: { label: "Story", accent: VIOLET, type: "read" },
	opportunity: { label: "Open", accent: TEAL, type: "read" },
	video: { label: "Watch", accent: TEAL, type: "watch" },
	voice: { label: "Listen", accent: VIOLET, type: "listen" },
};
function kindConf(kind: string): KindConf {
	return KIND[kind] ?? { label: "Read", accent: GOLD, type: "read" };
}

function youtubeEmbedUrl(url: string): string | null {
	const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
	return match ? `https://www.youtube.com/embed/${match[1]}?rel=0` : null;
}

function readTime(body: string | null): string | null {
	if (!body) return null;
	const words = body.trim().split(/\s+/).length;
	return `${Math.max(1, Math.round(words / 200))} min read`;
}

// ── Compass mark (empty state) ──────────────────────────────────────────────

function CompassMark({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 32 32"
			fill="none"
			aria-hidden="true"
			className={className}
		>
			<circle cx="16" cy="16" r="14" stroke="white" strokeWidth="0.8" />
			<circle
				cx="16"
				cy="16"
				r="9"
				stroke="white"
				strokeWidth="0.6"
				strokeDasharray="1.5 3"
			/>
			<polygon points="16,4 13.5,16 18.5,16" fill="white" />
			<polygon points="16,28 13.5,16 18.5,16" fill="white" fillOpacity="0.5" />
			<circle cx="16" cy="16" r="1.8" fill="white" />
		</svg>
	);
}

// ── Decorative waveform (Listen cards) ──────────────────────────────────────

const WAVE = [
	8, 16, 11, 22, 14, 28, 18, 24, 12, 30, 20, 26, 10, 18, 23, 13, 27, 15, 21, 9,
].map((h, i) => ({ h, id: `bar-${i}` }));

function Waveform() {
	return (
		<div className="mb-3 flex items-end gap-[3px]" aria-hidden="true">
			{WAVE.map((b) => (
				<span
					key={b.id}
					className="w-[3px] rounded-full"
					style={{
						height: `${b.h}px`,
						backgroundColor: "rgba(123,97,255,0.3)",
					}}
				/>
			))}
		</div>
	);
}

// ── Backgrounds ─────────────────────────────────────────────────────────────

const GRID =
	"linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)";

function TextBackground({
	accent,
	corner,
}: {
	accent: string;
	corner: "tr" | "tl";
}) {
	const pos = corner === "tr" ? "88% 10%" : "12% 10%";
	return (
		<>
			<div className="absolute inset-0 bg-[#08080F]" />
			<div
				className="absolute inset-0"
				style={{ backgroundImage: GRID, backgroundSize: "32px 32px" }}
			/>
			<div
				className="absolute inset-0"
				style={{
					background: `radial-gradient(circle at ${pos}, ${accent}12 0%, transparent 46%)`,
				}}
			/>
			{/* bottom vignette for legibility */}
			<div
				className="absolute inset-0"
				style={{
					background:
						"linear-gradient(to top, rgba(5,5,14,0.96) 0%, rgba(5,5,14,0.72) 30%, transparent 62%)",
				}}
			/>
		</>
	);
}

// Full-bleed article image (carried from the source's og:image), with a dark
// vignette so the title + actions stay legible over it.
function ImageBackground({ src }: { src: string }) {
	return (
		<div className="absolute inset-0 bg-black">
			{/* biome-ignore lint/performance/noImgElement: decorative full-bleed background, no fixed dimensions */}
			<img
				src={src}
				alt=""
				loading="lazy"
				className="absolute inset-0 h-full w-full object-cover"
			/>
			<div className="absolute inset-0 bg-black/25" />
			<div
				className="absolute inset-0"
				style={{
					background:
						"linear-gradient(to top, rgba(5,5,14,0.96) 0%, rgba(5,5,14,0.6) 36%, rgba(5,5,14,0.18) 64%, transparent 82%)",
				}}
			/>
		</div>
	);
}

function VideoBackground({ item }: { item: Item }) {
	if (!item.external_url) {
		return <div className="absolute inset-0 bg-black" />;
	}
	const ytEmbed = youtubeEmbedUrl(item.external_url);
	if (ytEmbed) {
		return (
			<div className="absolute inset-0 bg-black">
				{item.thumbnail_url && (
					// biome-ignore lint/performance/noImgElement: decorative full-bleed background, no fixed dimensions
					<img
						src={item.thumbnail_url}
						alt=""
						className="absolute inset-0 h-full w-full object-cover"
					/>
				)}
				<div className="absolute inset-0 bg-black/40" />
				<div
					className="absolute inset-0"
					style={{
						background:
							"linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 40%, transparent 60%)",
					}}
				/>
			</div>
		);
	}
	return (
		<div className="absolute inset-0 bg-black">
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
						"linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 40%, transparent 60%)",
				}}
			/>
		</div>
	);
}

// ── Main feed ──────────────────────────────────────────────────────────────

export function ForYouFeed({
	items,
	categories,
	initialSaved,
	initialMatters,
	preview = false,
}: {
	items: Item[];
	categories: Category[];
	initialSaved: string[];
	initialMatters: string[];
	preview?: boolean;
}) {
	const [saved, setSaved] = useState<Set<string>>(new Set(initialSaved));
	const [matters, setMatters] = useState<Set<string>>(new Set(initialMatters));
	const [activeCategory, setActiveCategory] = useState<string | null>(null);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [showUpload, setShowUpload] = useState(false);

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

	async function share(item: Item) {
		const url = item.external_url ?? window.location.href;
		try {
			if (navigator.share) {
				await navigator.share({ title: item.title, url });
			} else {
				await navigator.clipboard?.writeText(url);
			}
		} catch {
			/* user cancelled share — no-op */
		}
	}

	// Track the card in view for the scroll indicator (visual only).
	const observerRef = useRef<IntersectionObserver | null>(null);
	const registerCard = useCallback((el: HTMLDivElement | null, id: string) => {
		if (!el) return;
		if (!observerRef.current) {
			observerRef.current = new IntersectionObserver(
				(entries) => {
					for (const e of entries) {
						if (e.isIntersecting) {
							setActiveId((e.target as HTMLElement).dataset.id ?? null);
						}
					}
				},
				{ threshold: 0.6 },
			);
		}
		el.dataset.id = id;
		observerRef.current.observe(el);
	}, []);
	useEffect(() => () => observerRef.current?.disconnect(), []);

	const filtered = activeCategory
		? items.filter((item) => item.content_category_id === activeCategory)
		: items;
	const catLabel = (id: string | null) =>
		categories.find((c) => c.id === id)?.label ?? null;

	if (items.length === 0) {
		return <EmptyState />;
	}

	return (
		<div className="font-jakarta">
			{/* Category filter bar */}
			{categories.length > 0 && (
				<div
					className="absolute top-[72px] right-0 left-0 z-20 flex gap-2 overflow-x-auto px-4 py-1 backdrop-blur-sm [&::-webkit-scrollbar]:hidden"
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
			)}

			<div
				className="h-full snap-y snap-mandatory overflow-y-scroll pb-20"
				style={{ scrollbarWidth: "none" }}
			>
				{filtered.length === 0 ? (
					<div className="flex h-full items-center justify-center">
						<p className="font-medium text-[14px] text-white/40">
							Nothing in this category yet.
						</p>
					</div>
				) : null}

				{filtered.map((item) => (
					<FeedCard
						key={item.id}
						ref={(el) => registerCard(el, item.id)}
						item={item}
						preview={preview}
						categoryLabel={catLabel(item.content_category_id) ?? item.eyebrow}
						isActive={activeId === item.id}
						isSaved={saved.has(item.id)}
						isMattered={matters.has(item.id)}
						onSave={() => void record(item, "save")}
						onMatters={() => void record(item, "matters")}
						onShare={() => void share(item)}
						onPost={() => setShowUpload(true)}
					/>
				))}
			</div>

			{showUpload && (
				<VideoUploadSheet
					onClose={() => setShowUpload(false)}
					onPosted={() => setShowUpload(false)}
				/>
			)}
		</div>
	);
}

// ── Feed card ────────────────────────────────────────────────────────────────

const FeedCard = ({
	ref,
	item,
	preview,
	categoryLabel,
	isActive,
	isSaved,
	isMattered,
	onSave,
	onMatters,
	onShare,
	onPost,
}: {
	ref: (el: HTMLDivElement | null) => void;
	item: Item;
	preview: boolean;
	categoryLabel: string | null;
	isActive: boolean;
	isSaved: boolean;
	isMattered: boolean;
	onSave: () => void;
	onMatters: () => void;
	onShare: () => void;
	onPost: () => void;
}) => {
	const conf = kindConf(item.kind);
	const ytEmbed = item.external_url ? youtubeEmbedUrl(item.external_url) : null;
	const isVideo = conf.type === "watch";
	const rt = readTime(item.body);

	return (
		<div
			ref={ref}
			className="relative flex snap-start snap-always flex-col overflow-hidden"
			style={{ height: "100svh", minHeight: "100svh" }}
		>
			{/* Background — video player, the article's own image, else a gradient */}
			{isVideo ? (
				<VideoBackground item={item} />
			) : item.thumbnail_url ? (
				<ImageBackground src={item.thumbnail_url} />
			) : (
				<TextBackground
					accent={conf.accent}
					corner={conf.type === "listen" ? "tl" : "tr"}
				/>
			)}

			{/* Kind badge */}
			<span
				className="absolute top-4 left-4 z-10 rounded-full border px-3 py-1 font-bold text-[10px] uppercase tracking-[0.1em] backdrop-blur-sm"
				style={{
					backgroundColor: "rgba(255,255,255,0.10)",
					borderColor: `${conf.accent}4D`,
					color: conf.accent,
				}}
			>
				{conf.label}
			</span>

			{/* YouTube embed keeps inline playback in its own box */}
			{isVideo && ytEmbed && (
				<div className="relative mt-[104px] flex-1 px-4 pb-2">
					<iframe
						src={ytEmbed}
						className="h-full w-full rounded-[18px]"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowFullScreen
						title={item.title}
					/>
				</div>
			)}

			{/* Content — bottom of the card */}
			<div
				className={`relative z-[5] flex flex-col px-5 pb-[96px] ${
					isVideo && ytEmbed ? "pt-1" : "flex-1 justify-end"
				}`}
			>
				{conf.type === "listen" && <Waveform />}

				{categoryLabel && (
					<p className="mb-2 font-bold text-[9px] text-white/45 uppercase tracking-[0.15em]">
						{categoryLabel}
					</p>
				)}

				<h2 className="mb-2 line-clamp-2 font-black text-[22px] text-white leading-[1.2] tracking-tight">
					{item.title}
				</h2>

				{/* Source row */}
				<div className="mb-3 flex items-center gap-2">
					{item.source && (
						<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 font-bold text-[11px] text-white/70">
							{item.source[0]?.toUpperCase()}
						</span>
					)}
					{item.source && (
						<span className="font-semibold text-[11px] text-white/50">
							{item.source}
						</span>
					)}
					{item.source && rt && (
						<span className="text-[11px] text-white/20">·</span>
					)}
					{rt && <span className="text-[11px] text-white/40">{rt}</span>}
				</div>

				{/* Personalized reason — teal "on course" accent, no stripe */}
				{item.why && (
					<p className="mb-3 text-[12px] text-white/70 leading-snug">
						<span
							className="mr-2 font-bold text-[9px] uppercase tracking-[0.12em]"
							style={{ color: TEAL }}
						>
							{preview ? "Your top pick" : "For you"}
						</span>
						{item.why}
					</p>
				)}

				{/* Free preview — the one personalized pick, then an unlock prompt */}
				{preview && item.why && (
					<a
						href="/api/billing/checkout"
						className="mb-3 inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 font-bold text-[11px]"
						style={{
							color: VIOLET,
							backgroundColor: "rgba(123,97,255,0.14)",
							border: "1px solid rgba(123,97,255,0.35)",
						}}
					>
						Premium ranks your whole feed — unlock
						<span aria-hidden="true">→</span>
					</a>
				)}

				{item.body && !(isVideo && ytEmbed) && (
					<p className="mb-4 line-clamp-2 text-[13px] text-white/60 leading-relaxed">
						{item.body}
					</p>
				)}

				{/* CTA row */}
				<div className="flex items-center gap-3">
					{item.external_url && (
						<a
							href={item.external_url}
							target="_blank"
							rel="noopener noreferrer"
							className="cursor-pointer rounded-xl px-5 py-2.5 font-bold text-[13px] transition-colors duration-200 motion-reduce:transition-none"
							style={{ backgroundColor: conf.accent, color: "#05050E" }}
						>
							{conf.label}
						</a>
					)}
					<button
						type="button"
						onClick={onSave}
						aria-label={isSaved ? "Saved" : "Save"}
						aria-pressed={isSaved}
						className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border transition-colors duration-200 hover:bg-white/14 motion-reduce:transition-none"
						style={{
							backgroundColor: isSaved
								? "rgba(62,207,191,0.16)"
								: "rgba(255,255,255,0.08)",
							borderColor: isSaved
								? "rgba(62,207,191,0.35)"
								: "rgba(255,255,255,0.12)",
						}}
					>
						<BookmarkIcon active={isSaved} />
					</button>
				</div>
			</div>

			{/* Action rail */}
			<div className="absolute right-4 bottom-[30%] z-20 flex flex-col items-center gap-4">
				<RailButton
					label={isSaved ? "Saved" : "Save"}
					ariaLabel={isSaved ? "Saved" : "Save"}
					active={isSaved}
					activeBg="rgba(245,200,66,0.15)"
					activeBorder="rgba(245,200,66,0.3)"
					onClick={onSave}
				>
					<BookmarkIcon active={isSaved} activeColor={GOLD} />
				</RailButton>
				<RailButton label="Share" ariaLabel="Share" onClick={onShare}>
					<ShareIcon />
				</RailButton>
				<RailButton
					label="Matters"
					ariaLabel="Matters"
					active={isMattered}
					activeBg="rgba(245,100,100,0.15)"
					activeBorder="rgba(245,100,100,0.3)"
					onClick={onMatters}
				>
					<HeartIcon active={isMattered} />
				</RailButton>
				<RailButton ariaLabel="Post" accent onClick={onPost}>
					<PlusIcon />
				</RailButton>
			</div>

			{/* Scroll indicator */}
			<div
				aria-hidden="true"
				className="absolute bottom-[76px] left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-full transition-colors duration-300 motion-reduce:transition-none"
				style={{ backgroundColor: isActive ? GOLD : "rgba(255,255,255,0.2)" }}
			/>
		</div>
	);
};

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
			aria-pressed={active}
			className="shrink-0 cursor-pointer rounded-full px-4 py-1.5 font-bold text-[11px] transition-colors duration-200 hover:bg-white/14 motion-reduce:transition-none"
			style={
				active
					? { backgroundColor: GOLD, color: "#05050E" }
					: {
							backgroundColor: "rgba(255,255,255,0.08)",
							border: "1px solid rgba(255,255,255,0.10)",
							color: "rgba(240,240,245,0.45)",
						}
			}
		>
			{label}
		</button>
	);
}

// ── Action-rail button ──────────────────────────────────────────────────────

function RailButton({
	label,
	ariaLabel,
	active,
	activeBg,
	activeBorder,
	accent,
	onClick,
	children,
}: {
	label?: string;
	ariaLabel: string;
	active?: boolean;
	activeBg?: string;
	activeBorder?: string;
	accent?: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	const base = accent
		? {
				backgroundColor: "rgba(62,207,191,0.1)",
				borderColor: "rgba(62,207,191,0.25)",
			}
		: {
				backgroundColor: "rgba(255,255,255,0.08)",
				borderColor: "rgba(255,255,255,0.12)",
			};
	const style =
		active && activeBg
			? { backgroundColor: activeBg, borderColor: activeBorder }
			: base;
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={ariaLabel}
			aria-pressed={active}
			className="flex cursor-pointer flex-col items-center gap-1"
		>
			<span
				className="flex h-11 w-11 items-center justify-center rounded-full border transition-colors duration-200 hover:bg-white/14 motion-reduce:transition-none"
				style={style}
			>
				{children}
			</span>
			{label && (
				<span className="font-semibold text-[10px] text-white/45">{label}</span>
			)}
		</button>
	);
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
	return (
		<div className="flex h-full flex-col items-center justify-center px-8 text-center font-jakarta">
			<CompassMark className="mb-4 h-12 w-12 opacity-30" />
			<p className="font-bold text-[16px] text-white/40">Nothing here yet</p>
			<p className="mt-1 text-[13px] text-white/25">Check back soon</p>
		</div>
	);
}

// ── Icons ──────────────────────────────────────────────────────────────────

function BookmarkIcon({
	active,
	activeColor = TEAL,
}: {
	active: boolean;
	activeColor?: string;
}) {
	return (
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill={active ? activeColor : "none"}
			stroke={active ? activeColor : "white"}
			strokeWidth={1.8}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
		</svg>
	);
}

function HeartIcon({ active }: { active: boolean }) {
	return (
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill={active ? MATTERS : "none"}
			stroke={active ? MATTERS : "white"}
			strokeWidth={1.8}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
		</svg>
	);
}

function ShareIcon() {
	return (
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="white"
			strokeWidth={1.8}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<circle cx="18" cy="5" r="3" />
			<circle cx="6" cy="12" r="3" />
			<circle cx="18" cy="19" r="3" />
			<line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
			<line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
		</svg>
	);
}

function PlusIcon() {
	return (
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke={TEAL}
			strokeWidth={1.8}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="10" />
			<line x1="12" y1="8" x2="12" y2="16" />
			<line x1="8" y1="12" x2="16" y2="12" />
		</svg>
	);
}
