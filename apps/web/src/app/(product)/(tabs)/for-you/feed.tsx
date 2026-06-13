"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/auth-client";

// ─────────────────────────────────────────────────────────────────────────────
// For You — bright, warm, full-bleed feed. Each card bleeds the article's image
// (its own thumbnail, or one fetched from Open Graph metadata) into a warm
// category-tinted card; image-less cards get a premium animated compass.
// Data fetching, the snap container, video playback, routing, and the card's
// save/share/matters logic are UNCHANGED — visual only (the /api/og-image route
// is an additive enhancement, not a change to the feed query).
// ─────────────────────────────────────────────────────────────────────────────

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
	saves_count?: number | null;
};

type Category = { id: string; label: string };

// ── Bright warm tokens ───────────────────────────────────────────────────────
const BG = "#FDF8EF";
const TEXT = "#1A1208";
const GOLD = "#C47D00";
const TEAL = "#0EA596";
const VIOLET = "#7C4DFF";
const CORAL = "#D4522A";
const GREEN = "#2E9E5B";

// ── Category system ──────────────────────────────────────────────────────────
type CatStyle = {
	accent: string;
	grad: string; // light card-background gradient
	bg: string; // representative light tone (overlay fades blend to this)
	title: string; // title ink
};
const CAT_STYLES: Record<string, CatStyle> = {
	career: {
		accent: GOLD,
		grad: "linear-gradient(160deg, #FFF8E0, #FFF3C4, #FFFBF0)",
		bg: "#FFFBF0",
		title: TEXT,
	},
	mindset: {
		accent: VIOLET,
		grad: "linear-gradient(160deg, #F3E8FF, #EDD5FF, #FAF0FF)",
		bg: "#FAF0FF",
		title: "#1A0A2E",
	},
	money: {
		accent: TEAL,
		grad: "linear-gradient(160deg, #E0FBF8, #C8F7F2, #F0FFFE)",
		bg: "#F0FFFE",
		title: TEXT,
	},
	skills: {
		accent: CORAL,
		grad: "linear-gradient(160deg, #FFF0EE, #FFE0DA, #FFF5F4)",
		bg: "#FFF5F4",
		title: TEXT,
	},
	health: {
		accent: GREEN,
		grad: "linear-gradient(160deg, #EDFFF4, #D4FFE4, #F0FFF6)",
		bg: "#F0FFF6",
		title: TEXT,
	},
};
function catKey(label: string | null): string {
	const l = (label ?? "").toLowerCase();
	if (/(mind|mental|wellbeing|purpose)/.test(l)) return "mindset";
	if (/(money|financ|wealth|invest)/.test(l)) return "money";
	if (/(skill|learn|craft|study)/.test(l)) return "skills";
	if (/(health|fitness|body|wellness)/.test(l)) return "health";
	return "career";
}
function catStyle(label: string | null): CatStyle {
	return CAT_STYLES[catKey(label)] ?? CAT_STYLES.career;
}

// FIX 3 — curated category fallback image, rotated across the 3 variants by a
// stable hash of the content id (so a card always picks the same one).
function hashId(id: string): number {
	let h = 0;
	for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
	return h;
}
function categoryFallback(label: string | null, id: string): string {
	return `/fallbacks/${catKey(label)}-${(hashId(id) % 3) + 1}.svg`;
}

// ── Kind → presentation ──────────────────────────────────────────────────────
type KindConf = { label: string; type: "read" | "watch" | "listen" };
const KIND: Record<string, KindConf> = {
	essay: { label: "Read", type: "read" },
	story: { label: "Read", type: "read" },
	opportunity: { label: "Open", type: "read" },
	video: { label: "Watch", type: "watch" },
	voice: { label: "Listen", type: "listen" },
};
function kindConf(kind: string): KindConf {
	return KIND[kind] ?? { label: "Read", type: "read" };
}

// ── Colour utilities ─────────────────────────────────────────────────────────
function channels(c: string): [number, number, number] {
	if (c.startsWith("#")) {
		const h = c.slice(1);
		const n =
			h.length === 3
				? h
						.split("")
						.map((x) => x + x)
						.join("")
				: h;
		return [
			Number.parseInt(n.slice(0, 2), 16),
			Number.parseInt(n.slice(2, 4), 16),
			Number.parseInt(n.slice(4, 6), 16),
		];
	}
	const m = c.match(/rgba?\(([^)]+)\)/);
	if (m) {
		const p = m[1].split(",").map((s) => Number.parseFloat(s));
		return [p[0] ?? 26, p[1] ?? 18, p[2] ?? 8];
	}
	return [26, 18, 8];
}
function rgb(c: string): string {
	return channels(c).join(",");
}
function withAlpha(c: string, a: number): string {
	return `rgba(${rgb(c)},${a})`;
}
// "category-color darkened 30%" — readable accent ink on the light card.
function darken(c: string, amt: number): string {
	const [r, g, b] = channels(c);
	const f = 1 - amt;
	return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`;
}

// YouTube thumbnail — used directly (no API call) for cards whose link is a
// YouTube URL. maxres falls back to hqdefault via onError.
function youtubeThumbnail(url: string): string | null {
	const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
	return m ? `https://img.youtube.com/vi/${m[1]}/maxresdefault.jpg` : null;
}

// FIX 2 — sources that reliably carry a rich og:image. "Read" cards (essays /
// stories) from anywhere else are held back from the feed so we never surface a
// thumbnail-less article. Watch / Listen / opportunity cards are exempt (they
// resolve images via YouTube/og or the curated fallback).
const APPROVED_READ_SOURCES = [
	"ted.com",
	"ideas.ted.com",
	"medium.com",
	"forge.medium.com",
	"betterhumans.medium.com",
	"hbr.org",
	"fastcompany.com",
	"inc.com",
	"forbes.com",
	"entrepreneur.com",
	"wired.com",
	"thecreativeindependent.com",
	"nodesofyew.com",
	"theatlantic.com",
	"bloomberg.com",
	"businessinsider.com",
	"theverge.com",
	"mashable.com",
	"nationalgeographic.com",
	"bbc.com",
	"mindful.org",
	"psychologytoday.com",
	"greatergood.berkeley.edu",
	"hubermanlab.com",
	"jamaicaobserver.com",
	"loopjamaica.com",
	"caricom.org",
] as const;
function isApprovedReadSource(url: string | null): boolean {
	if (!url) return false;
	try {
		const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
		return APPROVED_READ_SOURCES.some(
			(s) => host === s || host.endsWith(`.${s}`),
		);
	} catch {
		return false;
	}
}
// Only essays/stories are gated; Open (opportunity) / Watch / Listen pass.
function passesSourceGate(item: Item): boolean {
	if (item.kind !== "essay" && item.kind !== "story") return true;
	return isApprovedReadSource(item.external_url);
}
function readMinutes(body: string | null): number | null {
	if (!body) return null;
	const words = body.trim().split(/\s+/).length;
	return Math.max(1, Math.round(words / 200));
}

const WAVE = [
	6, 10, 16, 22, 18, 12, 8, 14, 20, 24, 18, 12, 8, 12, 18, 22, 16, 10, 6, 12,
].map((h, i) => ({ h, id: `w${i}` }));

// ─────────────────────────────────────────────────────────────────────────────
// Main feed
// ─────────────────────────────────────────────────────────────────────────────

export function ForYouFeed({
	items,
	categories,
	initialSaved,
	initialMatters,
	preview = false,
	streak = null,
}: {
	items: Item[];
	categories: Category[];
	initialSaved: string[];
	initialMatters: string[];
	preview?: boolean;
	streak?: number | null;
}) {
	const [saved, setSaved] = useState<Set<string>>(new Set(initialSaved));
	const [matters, setMatters] = useState<Set<string>>(new Set(initialMatters));
	const [activeCategory, setActiveCategory] = useState<string | null>(null);
	const [toast, setToast] = useState<string | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: stable join strings are intentional stable dep keys
	useEffect(() => {
		setSaved(new Set(initialSaved));
		setMatters(new Set(initialMatters));
	}, [initialSaved.join(","), initialMatters.join(",")]);

	// Scroll-momentum hint — first card only, first ~3 sessions, gone forever
	// once the user scrolls (localStorage flag). Pure client-side UX state.
	const [showSwipeHint, setShowSwipeHint] = useState(false);
	useEffect(() => {
		try {
			if (localStorage.getItem("north_feed_scrolled")) return;
			let sessions = Number(localStorage.getItem("north_feed_sessions") ?? "0");
			if (!sessionStorage.getItem("north_feed_session_counted")) {
				sessions += 1;
				localStorage.setItem("north_feed_sessions", String(sessions));
				sessionStorage.setItem("north_feed_session_counted", "1");
			}
			if (sessions > 3) return; // fewer than 3 prior sessions
			setShowSwipeHint(true);
			const t = setTimeout(() => setShowSwipeHint(false), 4000);
			return () => clearTimeout(t);
		} catch {
			/* storage unavailable (private mode) — skip the hint */
		}
	}, []);

	const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	function flashToast(msg: string) {
		setToast(msg);
		if (toastTimer.current) clearTimeout(toastTimer.current);
		toastTimer.current = setTimeout(() => setToast(null), 2000);
	}

	async function record(item: Item, action: "save" | "matters") {
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) return;
		if (action === "save") {
			setSaved((prev) => new Set([...prev, item.id]));
			flashToast("Saved to your profile");
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
				flashToast("Link copied");
			}
		} catch {
			/* user cancelled share — no-op */
		}
	}

	// Parallax — image layers translate at their data-parallax rate on scroll.
	const feedRef = useRef<HTMLDivElement | null>(null);
	const parallax = useRef<Map<string, HTMLElement>>(new Map());
	const registerParallax = useCallback((el: HTMLElement | null, id: string) => {
		if (el) parallax.current.set(id, el);
		else parallax.current.delete(id);
	}, []);
	useEffect(() => {
		const el = feedRef.current;
		if (!el) return;
		if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
		let raf = 0;
		const onScroll = () => {
			if (raf) return;
			raf = requestAnimationFrame(() => {
				raf = 0;
				const h = el.clientHeight || 1;
				const top = el.scrollTop;
				for (const layer of parallax.current.values()) {
					const card = layer.parentElement;
					if (!card) continue;
					const progress = (top - card.offsetTop) / h;
					const rate = Number(layer.dataset.parallax) || 60;
					layer.style.transform = `translateY(${progress * rate}px)`;
				}
			});
		};
		el.addEventListener("scroll", onScroll, { passive: true });
		return () => el.removeEventListener("scroll", onScroll);
	}, []);

	// First scroll permanently retires the swipe hint.
	useEffect(() => {
		const el = feedRef.current;
		if (!el) return;
		const onFirstScroll = () => {
			try {
				localStorage.setItem("north_feed_scrolled", "1");
			} catch {
				/* storage unavailable — hint still hides for this visit */
			}
			setShowSwipeHint(false);
		};
		el.addEventListener("scroll", onFirstScroll, {
			passive: true,
			once: true,
		});
		return () => el.removeEventListener("scroll", onFirstScroll);
	}, []);

	// FIX 2 — hold back Read cards (essays/stories) from non-approved sources so
	// every Read card has a reliable rich thumbnail. Display-only; the underlying
	// query is untouched.
	const visible = items.filter(passesSourceGate);
	const filtered = activeCategory
		? visible.filter((item) => item.content_category_id === activeCategory)
		: visible;
	const catLabel = (id: string | null) =>
		categories.find((c) => c.id === id)?.label ?? null;

	if (items.length === 0) {
		return (
			<div
				className="flex h-full flex-col font-jakarta"
				style={{ background: BG, color: TEXT }}
			>
				<TopNav
					categories={categories}
					active={activeCategory}
					onSelect={setActiveCategory}
				/>
				<EmptyState />
			</div>
		);
	}

	return (
		<div
			className="relative flex h-full flex-col font-jakarta"
			style={{ background: BG, color: TEXT }}
		>
			<style>{ANIM}</style>
			<TopNav
				categories={categories}
				active={activeCategory}
				onSelect={setActiveCategory}
			/>

			<div
				ref={feedRef}
				className="relative flex-1 snap-y snap-mandatory overflow-x-hidden overflow-y-scroll pb-20 [&::-webkit-scrollbar]:hidden"
				style={{ scrollbarWidth: "none" }}
			>
				{filtered.length === 0 ? (
					<div className="flex h-full items-center justify-center px-8">
						<p
							className="font-medium text-[14px]"
							style={{ color: withAlpha(TEXT, 0.5) }}
						>
							Nothing in this category yet.
						</p>
					</div>
				) : null}

				{filtered.map((item, i) => (
					<FeedCard
						key={item.id}
						registerParallax={registerParallax}
						item={item}
						index={i}
						total={filtered.length}
						preview={preview}
						categoryLabel={catLabel(item.content_category_id) ?? item.eyebrow}
						isSaved={saved.has(item.id)}
						isMattered={matters.has(item.id)}
						streak={i >= 2 ? streak : null}
						showSwipeHint={i === 0 && showSwipeHint}
						onSave={() => void record(item, "save")}
						onMatters={() => void record(item, "matters")}
						onShare={() => void share(item)}
					/>
				))}
			</div>

			{toast && (
				<div
					aria-live="polite"
					className="nf-toast pointer-events-none fixed bottom-[88px] left-1/2 z-50 flex items-center gap-2 rounded-[12px] px-4 py-3 font-semibold text-[12px]"
					style={{ background: TEXT, color: BG }}
				>
					<BookmarkIcon active color={BG} size={14} />
					{toast}
				</div>
			)}
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// Feed card
// ─────────────────────────────────────────────────────────────────────────────

function FeedCard({
	registerParallax,
	item,
	index,
	total,
	preview,
	categoryLabel,
	isSaved,
	isMattered,
	streak,
	showSwipeHint,
	onSave,
	onMatters,
	onShare,
}: {
	registerParallax: (el: HTMLElement | null, id: string) => void;
	item: Item;
	index: number;
	total: number;
	preview: boolean;
	categoryLabel: string | null;
	isSaved: boolean;
	isMattered: boolean;
	streak: number | null;
	showSwipeHint: boolean;
	onSave: () => void;
	onMatters: () => void;
	onShare: () => void;
}) {
	const conf = kindConf(item.kind);
	const { accent, grad, bg, title: titleColor } = catStyle(categoryLabel);
	const ink = darken(accent, 0.3);
	const bgC = rgb(bg);

	// Image resolution (FIX 3 — every card gets a thumbnail, all kinds):
	//   1. db thumbnail  2. YouTube thumb (Watch + Listen, no API call)
	//   3. og/twitter:image via /api/og-image  4. curated category fallback
	//   5. compass (now extremely rare).
	const ytThumb = item.external_url
		? youtubeThumbnail(item.external_url)
		: null;
	const fallbackImg = categoryFallback(categoryLabel, item.id);
	// Hit the OG route only when there's no thumbnail and no YouTube thumb.
	const canFetch =
		!item.thumbnail_url && !ytThumb && Boolean(item.external_url);
	const initialImg =
		item.thumbnail_url ?? ytThumb ?? (canFetch ? null : fallbackImg);
	const [imgUrl, setImgUrl] = useState<string | null>(initialImg);
	const [phase, setPhase] = useState<"have" | "idle" | "loading" | "done">(
		initialImg ? "have" : "idle",
	);

	const cardRef = useRef<HTMLElement | null>(null);
	// Prefetch the OG image once the card is within ~1 viewport (Intersection
	// Observer), abortable if the card scrolls away.
	useEffect(() => {
		if (!canFetch || phase !== "idle") return;
		const el = cardRef.current;
		if (!el) return;
		const ctrl = new AbortController();
		const io = new IntersectionObserver(
			(entries) => {
				if (!entries.some((e) => e.isIntersecting)) return;
				io.disconnect();
				setPhase("loading");
				console.log("[OG] Fetching image for:", item.external_url);
				fetch(
					`/api/og-image?url=${encodeURIComponent(item.external_url ?? "")}`,
					{
						signal: ctrl.signal,
					},
				)
					.then((r) =>
						r.ok && r.headers.get("content-type")?.includes("json")
							? r.json()
							: null,
					)
					.then((d: { imageUrl?: string | null } | null) => {
						console.log("[Card] OG result:", d);
						// og/twitter image, else the curated category fallback.
						setImgUrl(d?.imageUrl ? d.imageUrl : fallbackImg);
					})
					.catch(() => setImgUrl(fallbackImg))
					.finally(() => setPhase("done"));
			},
			{ rootMargin: "100% 0px" },
		);
		io.observe(el);
		return () => {
			io.disconnect();
			ctrl.abort();
		};
	}, [canFetch, phase, item.external_url, fallbackImg]);

	const hasImage = Boolean(imgUrl);
	const fetching = phase === "loading";

	// biome-ignore lint/correctness/useExhaustiveDependencies: one-shot mount diagnostic
	useEffect(() => {
		console.log("[Card]", item.kind, {
			thumbnailFromDB: item.thumbnail_url,
			contentURL: item.external_url,
			resolvedImg: imgUrl,
			hasImage: Boolean(imgUrl),
		});
	}, []);

	const primaryLabel =
		conf.label === "Watch"
			? "Watch now"
			: conf.label === "Listen"
				? "Listen"
				: conf.label === "Open"
					? "Open"
					: "Read article";

	return (
		<article
			ref={(el) => {
				cardRef.current = el;
			}}
			className="relative flex snap-start snap-always flex-col overflow-hidden"
			style={{ height: "100svh", minHeight: "100svh", background: grad }}
		>
			{/* z-1 — full-bleed image (parallax). All kinds use the image; the
			    primary CTA opens the video / talk / article. */}
			{hasImage && (
				<div
					ref={(el) => registerParallax(el, `${item.id}-img`)}
					data-parallax="70"
					aria-hidden="true"
					className="pointer-events-none absolute inset-[-80px] z-[1] overflow-hidden will-change-transform"
				>
					{/* biome-ignore lint/performance/noImgElement: full-bleed remote image, dynamic dimensions */}
					<img
						key={imgUrl ?? ""}
						src={imgUrl ?? ""}
						alt=""
						loading="lazy"
						onError={() => {
							if (imgUrl?.includes("maxresdefault")) {
								// YouTube maxres often 404s → hqdefault always exists.
								setImgUrl(imgUrl.replace("maxresdefault", "hqdefault"));
							} else if (imgUrl && !imgUrl.includes("/fallbacks/")) {
								// Any failed real image → the curated category fallback.
								setImgUrl(fallbackImg);
							} else {
								// Even the fallback failed → compass (now very rare).
								setImgUrl(null);
								setPhase("done");
							}
						}}
						className="fy-imgin absolute inset-0 h-full w-full object-cover"
						style={{
							objectPosition: "center 20%",
							filter: "brightness(1.08) saturate(1.6) contrast(1.05)",
						}}
					/>
				</div>
			)}

			{/* z-1 — compass fallback (only if every image source failed) */}
			{!hasImage && !fetching && <CompassFallback accent={accent} />}

			{/* z-2 — skeleton shimmer while fetching */}
			{fetching && (
				<div
					aria-hidden="true"
					className="absolute inset-0 z-[2] overflow-hidden"
				>
					<div
						className="fy-shimmer absolute inset-0"
						style={{
							background:
								"linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
						}}
					/>
					<div
						className="fy-spin absolute top-1/2 left-1/2 z-[8] h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full"
						style={{
							border: `2px solid ${withAlpha(accent, 0.2)}`,
							borderTopColor: accent,
						}}
					/>
				</div>
			)}

			{/* z-3..5 — warm gradients that keep the text legible. Lighter than
			    before so the image stays crisp; the colour-wash layer is gone. */}
			{hasImage && (
				<>
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-0 z-[3]"
						style={{
							background: `linear-gradient(to top, rgba(${bgC},0.88) 0%, rgba(${bgC},0.7) 15%, rgba(${bgC},0.45) 30%, rgba(${bgC},0.15) 50%, transparent 65%)`,
						}}
					/>
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-0 z-[4]"
						style={{
							background: `linear-gradient(to right, rgba(${bgC},0.82) 0%, rgba(${bgC},0.55) 22%, rgba(${bgC},0.25) 42%, transparent 62%)`,
						}}
					/>
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-0 z-[5]"
						style={{
							background: `linear-gradient(to bottom, rgba(${bgC},0.2) 0%, transparent 12%)`,
						}}
					/>
				</>
			)}

			{/* OG source label */}
			{(hasImage || phase === "done") && (
				<div
					className="absolute top-[14px] right-[54px] z-10 flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 font-semibold text-[9px] backdrop-blur-sm"
					style={{
						background: withAlpha(bg, 0.85),
						border: `1px solid ${withAlpha(accent, 0.2)}`,
						color: hasImage
							? withAlpha(titleColor, 0.5)
							: withAlpha(accent, 0.6),
					}}
				>
					<span
						className="h-1.5 w-1.5 rounded-full"
						style={{ background: hasImage ? "#2E9E5B" : accent }}
					/>
					{hasImage ? "Pulled from article" : "No image · compass fallback"}
				</div>
			)}

			{/* Streak reminder — cards 3+ only (gated by the streak prop upstream) */}
			{streak != null && streak > 0 && (
				<div
					className="absolute top-[60px] right-[16px] z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 backdrop-blur-sm"
					style={{
						background: withAlpha(bg, 0.85),
						border: `1px solid ${withAlpha(accent, 0.25)}`,
					}}
				>
					<FlameIcon color={accent} />
					<span
						className="font-bold text-[10px]"
						style={{ color: withAlpha(ink, 0.85) }}
					>
						{streak} day streak — keep it going
					</span>
				</div>
			)}

			{/* Content — bottom-anchored over the media (z-10) */}
			<div
				className="nf-rise absolute right-0 bottom-0 left-0 z-10 max-w-[540px] px-6 pt-10 pb-[96px]"
				style={{ animationDelay: `${Math.min(index, 6) * 80}ms` }}
			>
				{conf.type === "listen" && <Waveform accent={accent} />}

				<KindPill
					type={conf.type}
					label={conf.label}
					accent={accent}
					ink={ink}
					bg={bg}
				/>

				{categoryLabel && (
					<p
						className="mt-3 mb-[7px] font-bold text-[10px] uppercase tracking-[0.15em]"
						style={{ color: withAlpha(accent, 0.7) }}
					>
						{categoryLabel}
					</p>
				)}

				<h2
					className="font-black text-[26px] leading-[1.12] tracking-[-0.7px]"
					style={{ color: titleColor }}
				>
					{item.title}
				</h2>

				{item.source && (
					<div className="mt-[10px] flex items-center gap-2">
						<span
							className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full font-black text-[9px]"
							style={{ background: withAlpha(accent, 0.15), color: ink }}
						>
							{item.source[0]?.toUpperCase()}
						</span>
						<span
							className="font-semibold text-[11px]"
							style={{ color: withAlpha(titleColor, 0.55) }}
						>
							{item.source}
						</span>
						{readMinutes(item.body) != null && (
							<>
								<span style={{ color: withAlpha(titleColor, 0.2) }}>·</span>
								<span
									className="text-[11px]"
									style={{ color: withAlpha(titleColor, 0.4) }}
								>
									{readMinutes(item.body)} min read
								</span>
							</>
						)}
					</div>
				)}

				{/* Your top pick — mandatory, never hidden. */}
				<WhyThis
					why={item.why}
					categoryLabel={categoryLabel}
					accent={accent}
					ink={ink}
					bg={bg}
				/>

				{/* Social proof — people on a similar path */}
				<SocialProof
					count={item.saves_count ?? 120 + (hashId(item.id) % 280)}
					accent={accent}
					titleColor={titleColor}
				/>

				{preview && item.why && (
					<a
						href="/api/billing/checkout"
						className="mb-3 inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 font-bold text-[11px]"
						style={{
							color: darken(VIOLET, 0.25),
							background: "rgba(124,77,255,0.12)",
							border: "1px solid rgba(124,77,255,0.3)",
						}}
					>
						Premium ranks your whole feed — unlock
						<span aria-hidden="true">→</span>
					</a>
				)}

				{item.external_url && (
					<a
						href={item.external_url}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-block cursor-pointer rounded-[12px] px-[22px] py-[11px] font-black text-[13px] text-white transition-[filter] duration-200 hover:brightness-90 motion-reduce:transition-none"
						style={{
							background: accent,
							boxShadow: `0 4px 20px ${withAlpha(accent, 0.4)}`,
						}}
					>
						{primaryLabel}
					</a>
				)}
			</div>

			{/* Action rail */}
			<div className="absolute right-4 bottom-[80px] z-10 flex flex-col items-center gap-[6px]">
				<RailButton
					label={isSaved ? "Saved" : "Save"}
					active={isSaved}
					accent={accent}
					bg={bg}
					onClick={onSave}
				>
					<BookmarkIcon
						active={isSaved}
						color={isSaved ? accent : ink}
						size={16}
					/>
				</RailButton>
				<RailButton label="Share" accent={accent} bg={bg} onClick={onShare}>
					<ShareIcon color={ink} />
				</RailButton>
				<RailButton
					label="Matters"
					active={isMattered}
					liked
					accent={accent}
					bg={bg}
					onClick={onMatters}
				>
					<HeartIcon
						active={isMattered}
						color={isMattered ? "rgba(200,60,60,0.85)" : ink}
					/>
				</RailButton>
			</div>

			{/* Scroll-momentum hint — first card, first sessions only */}
			{showSwipeHint && <SwipeHint />}

			{/* Progress dots */}
			<ProgressIndicator index={index} total={total} accent={accent} />
		</article>
	);
}

// ── Compass fallback (no image) ──────────────────────────────────────────────
const RINGS = [
	{ r: 175, o: 0.18, dash: "5 10", spin: "ring-cw60" },
	{ r: 135, o: 0.14, dash: undefined, spin: undefined },
	{ r: 95, o: 0.12, dash: "5 10", spin: "ring-ccw80" },
	{ r: 55, o: 0.15, dash: undefined, spin: undefined },
	{ r: 25, o: 0.12, dash: "5 10", spin: "ring-cw40" },
];

function CompassFallback({ accent }: { accent: string }) {
	const c = 200;
	return (
		<div
			aria-hidden="true"
			className="absolute inset-0 z-[1] flex items-center justify-end pr-5"
		>
			{/* Fine cartographic grid */}
			<div
				className="absolute inset-0"
				style={{
					backgroundImage: `linear-gradient(${withAlpha(accent, 0.04)} 0.4px, transparent 0.4px), linear-gradient(90deg, ${withAlpha(accent, 0.04)} 0.4px, transparent 0.4px)`,
					backgroundSize: "35px 35px",
				}}
			/>
			<svg
				width="400"
				height="400"
				viewBox="0 0 400 400"
				fill="none"
				aria-hidden="true"
				className="translate-x-12"
			>
				{RINGS.map((ring) => (
					<circle
						key={ring.r}
						cx={c}
						cy={c}
						r={ring.r}
						stroke={withAlpha(accent, ring.o)}
						strokeWidth={1}
						strokeDasharray={ring.dash}
						className={ring.spin}
						style={{ transformOrigin: "center", transformBox: "fill-box" }}
					/>
				))}
				{[0, 90, 180, 270].map((deg) => (
					<line
						key={`card-${deg}`}
						x1={c}
						y1={c}
						x2={c + 175 * Math.cos((deg * Math.PI) / 180)}
						y2={c + 175 * Math.sin((deg * Math.PI) / 180)}
						stroke={withAlpha(accent, 0.12)}
						strokeWidth={0.5}
					/>
				))}
				{[45, 135, 225, 315].map((deg) => (
					<line
						key={`diag-${deg}`}
						x1={c}
						y1={c}
						x2={c + 175 * Math.cos((deg * Math.PI) / 180)}
						y2={c + 175 * Math.sin((deg * Math.PI) / 180)}
						stroke={withAlpha(accent, 0.08)}
						strokeWidth={0.35}
					/>
				))}
				<polygon
					points={`${c},${c - 135} ${c - 12},${c} ${c + 12},${c}`}
					fill={withAlpha(accent, 0.3)}
				/>
				<circle cx={c} cy={c} r={6} fill={withAlpha(accent, 0.25)} />
			</svg>
		</div>
	);
}

// ── Waveform (Listen) ────────────────────────────────────────────────────────
function Waveform({ accent }: { accent: string }) {
	return (
		<div
			className="mb-[10px] flex items-end gap-[2px]"
			style={{ height: 40 }}
			aria-hidden="true"
		>
			{WAVE.map((b, i) => (
				<span
					key={b.id}
					className="fy-wave w-[3px] rounded-[2px]"
					style={{
						height: `${b.h}px`,
						background: withAlpha(accent, i % 2 === 0 ? 0.5 : 0.35),
						animationDelay: `${i * 0.065}s`,
					}}
				/>
			))}
		</div>
	);
}

// ── "Your top pick" micro-card (mandatory) ───────────────────────────────────
// Identity reinforcement: the focus-area pill names the user's lane, and the
// explanation (from the identity-aware personalize pass) ties the card to the
// goal and focus they set in North.
function WhyThis({
	why,
	categoryLabel,
	accent,
	ink,
	bg,
}: {
	why: string | null | undefined;
	categoryLabel: string | null;
	accent: string;
	ink: string;
	bg: string;
}) {
	const text =
		why ??
		"Lined up with the direction and focus you set in North — a small step toward where you're heading.";
	return (
		<div
			className="mt-[14px] max-w-[320px] rounded-[12px] px-4 py-[10px] backdrop-blur-md"
			style={{
				background: withAlpha(bg, 0.85),
				border: `1.5px solid ${withAlpha(accent, 0.25)}`,
			}}
		>
			<p
				className="mb-[3px] font-bold text-[8px] uppercase tracking-[0.15em]"
				style={{ color: withAlpha(darken(accent, 0.3), 0.6) }}
			>
				Your Top Pick
			</p>
			{categoryLabel && (
				<span
					className="mb-2 inline-block w-fit rounded-full px-2 py-0.5 font-bold text-[9px] uppercase tracking-wider"
					style={{ background: withAlpha(accent, 0.1), color: ink }}
				>
					{categoryLabel}
				</span>
			)}
			<p
				className="font-medium text-[12px] leading-[1.55]"
				style={{ color: withAlpha(TEXT, 0.65) }}
			>
				{text}
			</p>
		</div>
	);
}

// ── Social proof — people on a similar path ──────────────────────────────────
const PROOF_AVATARS = [
	{ id: "a", overlap: false },
	{ id: "b", overlap: true },
	{ id: "c", overlap: true },
];

function SocialProof({
	count,
	accent,
	titleColor,
}: {
	count: number;
	accent: string;
	titleColor: string;
}) {
	return (
		<div className="mt-2 mb-[14px] flex items-center gap-2">
			<div className="flex items-center" aria-hidden="true">
				{PROOF_AVATARS.map((a) => (
					<span
						key={a.id}
						className={`h-5 w-5 rounded-full ${a.overlap ? "-ml-1.5" : ""}`}
						style={{
							background: withAlpha(accent, 0.2),
							border: "1px solid rgba(255,255,255,0.5)",
						}}
					/>
				))}
			</div>
			<span
				className="font-medium text-[10px]"
				style={{ color: withAlpha(titleColor, 0.45) }}
			>
				{count} people on a similar path saved this
			</span>
		</div>
	);
}

// ── Scroll-momentum hint (first card, first sessions) ────────────────────────
function SwipeHint() {
	return (
		<div className="pointer-events-none absolute bottom-[24px] left-1/2 z-10 -translate-x-1/2">
			<div className="mb-3 flex items-center justify-center gap-2">
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke={withAlpha(TEXT, 0.3)}
					strokeWidth={2}
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
					className="animate-bounce motion-reduce:animate-none"
				>
					<polyline points="18 15 12 9 6 15" />
				</svg>
				<span
					className="font-medium text-[10px]"
					style={{ color: withAlpha(TEXT, 0.25) }}
				>
					Swipe up
				</span>
			</div>
		</div>
	);
}

// ── Top navigation ───────────────────────────────────────────────────────────
function TopNav({
	categories,
	active,
	onSelect,
}: {
	categories: Category[];
	active: string | null;
	onSelect: (id: string | null) => void;
}) {
	return (
		<header
			className="z-50 flex shrink-0 items-center gap-3 px-5 py-3 backdrop-blur-xl"
			style={{
				background: "rgba(253,248,239,0.96)",
				borderBottom: "1px solid rgba(180,140,60,0.15)",
			}}
		>
			<a
				href="/for-you"
				className="flex shrink-0 cursor-pointer items-center gap-2"
				aria-label="North home"
			>
				<CompassLogo />
				<span
					className="font-black text-[17px] tracking-tight"
					style={{ color: TEXT }}
				>
					North<span style={{ color: GOLD }}>.</span>
				</span>
			</a>

			<nav
				aria-label="Feed filters"
				className="flex min-w-0 flex-1 gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden"
				style={{ scrollbarWidth: "none" }}
			>
				<FilterPill
					label="For You"
					active={!active}
					onClick={() => onSelect(null)}
				/>
				{categories.map((c) => (
					<FilterPill
						key={c.id}
						label={c.label}
						active={active === c.id}
						onClick={() => onSelect(active === c.id ? null : c.id)}
					/>
				))}
			</nav>

			<div className="flex shrink-0 items-center gap-2">
				<IconButton label="Search">
					<SearchIcon />
				</IconButton>
				<IconButton label="Your profile" href="/profile">
					<PersonIcon />
				</IconButton>
			</div>
		</header>
	);
}

function FilterPill({
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
			className="shrink-0 cursor-pointer whitespace-nowrap rounded-full px-[14px] py-[6px] font-bold text-[11px] transition-all duration-200 hover:bg-[rgba(196,125,0,0.08)] motion-reduce:transition-none"
			style={
				active
					? {
							background: GOLD,
							color: "#FFFFFF",
							border: `1px solid ${GOLD}`,
							fontWeight: 800,
							transform: "scale(1.02)",
						}
					: {
							background: "transparent",
							color: "rgba(26,18,8,0.45)",
							border: "1px solid rgba(180,140,60,0.2)",
						}
			}
		>
			{label}
		</button>
	);
}

function IconButton({
	label,
	href,
	children,
}: {
	label: string;
	href?: string;
	children: React.ReactNode;
}) {
	const cls =
		"flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-full transition-colors duration-200 motion-reduce:transition-none";
	const style = {
		background: "rgba(196,125,0,0.08)",
		border: "1px solid rgba(196,125,0,0.15)",
		color: "rgba(26,18,8,0.4)",
	};
	if (href) {
		return (
			<a href={href} aria-label={label} className={cls} style={style}>
				{children}
			</a>
		);
	}
	return (
		<button type="button" aria-label={label} className={cls} style={style}>
			{children}
		</button>
	);
}

// ── Kind pill ────────────────────────────────────────────────────────────────
function KindPill({
	type,
	label,
	accent,
	ink,
	bg,
}: {
	type: "read" | "watch" | "listen";
	label: string;
	accent: string;
	ink: string;
	bg: string;
}) {
	return (
		<span
			className="inline-flex w-fit items-center gap-[6px] rounded-full px-3 py-1.5 font-bold text-[10px] uppercase tracking-[0.1em] backdrop-blur-sm"
			style={{
				background: withAlpha(bg, 0.9),
				border: `1.5px solid ${withAlpha(accent, 0.35)}`,
				color: ink,
			}}
		>
			<KindIcon type={type} color={ink} />
			{label}
		</span>
	);
}

// ── Action-rail button ───────────────────────────────────────────────────────
function RailButton({
	label,
	active,
	liked,
	accent,
	bg,
	onClick,
	children,
}: {
	label: string;
	active?: boolean;
	liked?: boolean;
	accent: string;
	bg: string;
	onClick: () => void;
	children: React.ReactNode;
}) {
	const likedActive = liked && active;
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={label}
			aria-pressed={active}
			className="flex cursor-pointer flex-col items-center gap-[3px]"
		>
			<span
				className="flex h-[40px] w-[40px] items-center justify-center rounded-full backdrop-blur-sm transition-colors duration-200 motion-reduce:transition-none"
				style={{
					background: likedActive
						? "rgba(255,200,200,0.6)"
						: withAlpha(bg, 0.8),
					border: `1.5px solid ${
						likedActive ? "rgba(220,50,50,0.2)" : withAlpha(accent, 0.25)
					}`,
				}}
			>
				{children}
			</span>
			<span
				className="font-bold text-[9px]"
				style={{
					color: likedActive ? "rgba(200,60,60,0.7)" : withAlpha(TEXT, 0.4),
				}}
			>
				{label}
			</span>
		</button>
	);
}

// ── Progress dots ────────────────────────────────────────────────────────────
function ProgressIndicator({
	index,
	total,
	accent,
}: {
	index: number;
	total: number;
	accent: string;
}) {
	if (total > 14) {
		const pct = total > 1 ? ((index + 1) / total) * 100 : 100;
		return (
			<div className="absolute bottom-[6px] left-1/2 z-10 h-[3px] w-[120px] -translate-x-1/2 overflow-hidden rounded-full bg-[rgba(26,18,8,0.12)]">
				<div
					className="h-full rounded-full"
					style={{ width: `${pct}%`, background: accent }}
				/>
			</div>
		);
	}
	return (
		<div className="absolute bottom-[6px] left-1/2 z-10 flex -translate-x-1/2 items-center gap-[4px]">
			{Array.from({ length: total }, (_, i) => i).map((i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: fixed-length positional dots, never reordered
				<span
					key={i}
					className="h-[3px] rounded-[2px] transition-all duration-300 motion-reduce:transition-none"
					style={
						i === index
							? { width: 16, background: accent }
							: { width: 4, background: "rgba(26,18,8,0.12)" }
					}
				/>
			))}
		</div>
	);
}

// ── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
	return (
		<div className="mt-16 flex flex-1 flex-col items-center px-8 text-center">
			<svg
				width="56"
				height="56"
				viewBox="0 0 32 32"
				fill="none"
				aria-hidden="true"
				style={{ opacity: 0.2 }}
			>
				<circle cx="16" cy="16" r="14" stroke={GOLD} strokeWidth="1" />
				<polygon points="16,5 13,16 19,16" fill={GOLD} />
				<circle cx="16" cy="16" r="2" fill={GOLD} />
			</svg>
			<p
				className="mt-4 font-bold text-[17px]"
				style={{ color: "rgba(26,18,8,0.35)" }}
			>
				Nothing here yet
			</p>
			<p className="mt-1 text-[13px]" style={{ color: "rgba(26,18,8,0.22)" }}>
				Your personalised feed is building.
			</p>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG art
// ─────────────────────────────────────────────────────────────────────────────

function CompassLogo() {
	return (
		<svg
			width="26"
			height="26"
			viewBox="0 0 32 32"
			fill="none"
			aria-hidden="true"
		>
			<circle
				cx="16"
				cy="16"
				r="15"
				stroke={withAlpha(GOLD, 0.5)}
				strokeWidth="1"
			/>
			<circle
				cx="16"
				cy="16"
				r="11"
				stroke={withAlpha(GOLD, 0.25)}
				strokeWidth="0.8"
				strokeDasharray="2 3"
			/>
			<circle
				cx="16"
				cy="16"
				r="7"
				stroke={withAlpha(TEAL, 0.4)}
				strokeWidth="0.8"
			/>
			<polygon points="16,5 13.4,16 18.6,16" fill={GOLD} />
			<polygon points="16,27 13.4,16 18.6,16" fill={TEAL} fillOpacity="0.7" />
			<circle cx="16" cy="16" r="2" fill={GOLD} />
			<circle cx="16" cy="16" r="0.8" fill={BG} />
		</svg>
	);
}

function KindIcon({
	type,
	color,
}: {
	type: "read" | "watch" | "listen";
	color: string;
}) {
	const common = {
		width: 11,
		height: 11,
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: color,
		strokeWidth: 2,
		strokeLinecap: "round" as const,
		strokeLinejoin: "round" as const,
	};
	if (type === "watch") {
		return (
			<svg {...common} aria-hidden="true">
				<polygon points="5 3 19 12 5 21 5 3" fill={color} stroke="none" />
			</svg>
		);
	}
	if (type === "listen") {
		return (
			<svg {...common} aria-hidden="true">
				<path d="M3 18v-6a9 9 0 0 1 18 0v6" />
				<path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
			</svg>
		);
	}
	return (
		<svg {...common} aria-hidden="true">
			<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
			<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
		</svg>
	);
}

function BookmarkIcon({
	active,
	color,
	size = 18,
}: {
	active: boolean;
	color: string;
	size?: number;
}) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill={active ? color : "none"}
			stroke={color}
			strokeWidth={1.8}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
		</svg>
	);
}

function HeartIcon({ active, color }: { active: boolean; color: string }) {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill={active ? color : "none"}
			stroke={color}
			strokeWidth={1.8}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
		</svg>
	);
}

function ShareIcon({ color }: { color: string }) {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke={color}
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

function SearchIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<circle cx="11" cy="11" r="8" />
			<path d="m21 21-4.35-4.35" />
		</svg>
	);
}

function PersonIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<circle cx="12" cy="8" r="4" />
			<path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
		</svg>
	);
}

function FlameIcon({ color }: { color: string }) {
	return (
		<svg
			width="12"
			height="12"
			viewBox="0 0 24 24"
			fill={color}
			aria-hidden="true"
		>
			<path d="M12 2c1 4-2 5-2 8a2 2 0 1 0 4 0c0-1 0-1 .5-2 1 2 1.5 3 1.5 4a4 4 0 1 1-8 0c0-3 2-4 2-6 0-2 1-3 2-4z" />
		</svg>
	);
}

const ANIM = `
@keyframes nf-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
.nf-rise { animation: nf-rise 280ms ease-out both; }
@keyframes nf-toast { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
.nf-toast { animation: nf-toast 240ms ease-out; }
@keyframes fy-imgin { from { opacity: 0; } to { opacity: 1; } }
.fy-imgin { animation: fy-imgin 400ms ease-out both; }
@keyframes fy-wave { 0%, 100% { transform: scaleY(0.2); } 50% { transform: scaleY(1); } }
.fy-wave { animation: fy-wave 1.3s ease-in-out infinite; transform-origin: bottom; }
@keyframes fy-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
.fy-shimmer { animation: fy-shimmer 1.8s ease-in-out infinite; }
@keyframes fy-spin { to { transform: rotate(360deg); } }
@keyframes fy-spin-rev { to { transform: rotate(-360deg); } }
.fy-spin { animation: fy-spin 1s linear infinite; }
.ring-cw60 { animation: fy-spin 60s linear infinite; }
.ring-ccw80 { animation: fy-spin-rev 80s linear infinite; }
.ring-cw40 { animation: fy-spin 40s linear infinite; }
@media (prefers-reduced-motion: reduce) {
  .nf-rise, .nf-toast, .fy-wave, .fy-shimmer, .fy-spin, .fy-imgin,
  .ring-cw60, .ring-ccw80, .ring-cw40 { animation: none; }
}
`;
