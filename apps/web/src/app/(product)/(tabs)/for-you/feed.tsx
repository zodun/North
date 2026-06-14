"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { coverUrl } from "@/lib/article-image/cover";
import { supabase } from "@/lib/auth-client";
import { proxiedImage } from "@/lib/img";

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
const BG = "#EDF1F8";
const TEXT = "#0E1420";
const GOLD = "#F5C842";
const GOLD_INK = "#8A6A00";
const TEAL = "#3ECFBF";
const TEAL_INK = "#0A8F7F";
const VIOLET = "#7B61FF";
const VIOLET_INK = "#5B43E0";
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

// Stable hash of the content id — drives deterministic per-card choices (cover
// art, story gradients, the synthetic save count).
function hashId(id: string): number {
	let h = 0;
	for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
	return h;
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

// Card images render through proxiedImage() (same-origin /api/img) so they always
// load. Keep the raw URL in state — only the rendered src is proxied — so onError
// string checks (maxresdefault, /api/cover) still hold.

// YouTube thumbnail — used directly (no API call) for cards whose link is a
// YouTube URL. maxres falls back to hqdefault via onError.
function youtubeThumbnail(url: string): string | null {
	const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
	return m ? `https://img.youtube.com/vi/${m[1]}/maxresdefault.jpg` : null;
}

// FIX 2 — reputable Read sources. "Read" cards (essays / stories) from anywhere
// else are held back from the feed for editorial quality. Watch / Listen /
// opportunity cards are exempt. Image-wise every card is covered: a real image
// when available, otherwise the curated category fallback.
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
	// Curated-feed reputable read sources (see lib/curated-feed + api/curated-feed)
	"nerdwallet.com",
	"thefinancialdiet.com",
	"investopedia.com",
	"smashingmagazine.com",
	"css-tricks.com",
	"dev.to",
	"ycombinator.com",
	"firstround.com",
	"paulgraham.com",
	"linkedin.com",
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
	aspiration = null,
	stories = [],
}: {
	items: Item[];
	categories: Category[];
	initialSaved: string[];
	initialMatters: string[];
	preview?: boolean;
	streak?: number | null;
	aspiration?: string | null;
	stories?: PeerStoryRow[];
}) {
	const storiesByArea = useMemo(() => {
		const m: Record<string, Story[]> = {};
		for (const s of stories) {
			const arr = m[s.focusArea] ?? [];
			arr.push(s);
			m[s.focusArea] = arr;
		}
		return m;
	}, [stories]);
	const [saved, setSaved] = useState<Set<string>>(new Set(initialSaved));
	const [matters, setMatters] = useState<Set<string>>(new Set(initialMatters));
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

	// Hold back Read cards from non-approved sources only. Every card that passes
	// the source gate is shown — cards with no real image render the curated
	// category fallback rather than being dropped. Display-only; the underlying
	// query is untouched.
	const filtered = items.filter((i) => passesSourceGate(i));
	const catLabel = (id: string | null) =>
		categories.find((c) => c.id === id)?.label ?? null;

	if (items.length === 0) {
		return (
			<div
				className="flex h-full flex-col font-jakarta"
				style={{ background: BG, color: TEXT }}
			>
				<TopNav />
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
			<TopNav />

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
						aspiration={aspiration}
						storiesByArea={storiesByArea}
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
	aspiration,
	storiesByArea,
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
	aspiration: string | null;
	storiesByArea: Record<string, Story[]>;
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
	// Image-less cards get a deterministic, on-brand cover (see lib/article-image)
	// instead of one of a few static SVGs — a unique Soft Sky field per article.
	const fallbackImg = coverUrl({ id: item.id, category: categoryLabel });
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
						// og/twitter image when found; otherwise every kind falls back to
						// the curated category image so no card is ever image-less.
						setImgUrl(d?.imageUrl ?? fallbackImg);
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
						src={proxiedImage(imgUrl)}
						alt=""
						loading="lazy"
						onError={() => {
							if (imgUrl?.includes("maxresdefault")) {
								// YouTube maxres often 404s → hqdefault always exists.
								setImgUrl(imgUrl.replace("maxresdefault", "hqdefault"));
							} else if (imgUrl && !imgUrl.includes("/api/cover")) {
								// Any real image that fails → swap in the deterministic
								// on-brand cover (same-origin SVG that always loads).
								setImgUrl(fallbackImg);
							} else {
								// Even the fallback failed (effectively never) → compass.
								setImgUrl(null);
								setPhase("done");
							}
						}}
						className="fy-imgin absolute inset-0 h-full w-full object-cover"
						style={{
							objectPosition: "center 30%",
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
							background: `linear-gradient(to top, rgba(${bgC},0.95) 0%, rgba(${bgC},0.82) 24%, rgba(${bgC},0.55) 42%, rgba(${bgC},0.22) 56%, transparent 70%)`,
						}}
					/>
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-0 z-[4]"
						style={{
							background: `linear-gradient(to right, rgba(${bgC},0.6) 0%, rgba(${bgC},0.28) 30%, transparent 56%)`,
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
						{streak} day streak, keep it going
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
					href={item.external_url ?? undefined}
				/>

				{categoryLabel && (
					<p
						className="mt-3 mb-[7px] font-bold text-[9px] uppercase tracking-[0.2em]"
						style={{ color: withAlpha(accent, 0.65) }}
					>
						{categoryLabel}
					</p>
				)}

				<h2
					className="line-clamp-3"
					style={{
						color: titleColor,
						fontFamily:
							"'Iowan Old Style', Palatino, Georgia, 'Times New Roman', serif",
						fontSize: "clamp(28px, 7vw, 44px)",
						fontWeight: 800,
						letterSpacing: "-0.5px",
						lineHeight: 1.05,
					}}
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

				{/* Your top pick — dark glass card with social proof inside. */}
				<WhyThis
					why={item.why}
					aspiration={aspiration}
					count={item.saves_count ?? 12 + (hashId(item.id) % 78)}
				/>

				{/* Peer story — how someone on the same path used this. */}
				<PeerStory story={pickStory(categoryLabel, item.id, storiesByArea)} />

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
						Premium ranks your whole feed
						<span aria-hidden="true">→</span>
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

// ── Peer story — how someone on the same path used this ──────────────────────
// Real, sourced stories come from the peer_stories table (passed in via the
// `stories` prop). When none exist for a focus area we fall back to the
// illustrative set below. A sourceUrl renders a "Read the story" link. Kept
// dash-free to match the rest of the card copy.
type Story = {
	name: string;
	who: string;
	quote: string;
	outcome: string;
	sourceName?: string | null;
	sourceUrl?: string | null;
};
type PeerStoryRow = Story & { focusArea: string };
const STORY_GRADS = [
	"linear-gradient(135deg, #F5C842, #E8B84B)",
	"linear-gradient(135deg, #3ECFBF, #2BB6A8)",
	"linear-gradient(135deg, #9B7DFF, #7B61FF)",
];
const STORIES: Record<string, Story[]> = {
	career: [
		{
			name: "Andre",
			who: "20, Kingston",
			quote:
				"I almost talked myself out of applying. I sent it anyway, and two weeks later I was in my first real interview.",
			outcome: "Got the callback",
		},
		{
			name: "Renee",
			who: "23, Spanish Town",
			quote:
				"I stopped waiting to feel ready and messaged one person already doing the work. That single message opened the door.",
			outcome: "Found a mentor",
		},
	],
	mindset: [
		{
			name: "Tiana",
			who: "22, Montego Bay",
			quote:
				"I started writing one honest line each night. The noise got quieter and I could finally hear what I actually wanted.",
			outcome: "Found her focus",
		},
		{
			name: "Marcus",
			who: "19, Portmore",
			quote:
				"I used to wait for motivation. I tried the two minute version instead, and showing up got easy.",
			outcome: "Built the habit",
		},
	],
	money: [
		{
			name: "Shanice",
			who: "21, Ocho Rios",
			quote:
				"I set aside a little before I could spend it. Small at first, but six months in I had a real cushion.",
			outcome: "Started saving",
		},
		{
			name: "Dwayne",
			who: "24, Kingston",
			quote:
				"I finally tracked where my money actually went. Seeing it written down changed every choice after that.",
			outcome: "Cleared a debt",
		},
	],
	skills: [
		{
			name: "Keisha",
			who: "20, May Pen",
			quote:
				"I practiced fifteen minutes a day instead of waiting for a free weekend. The progress added up fast.",
			outcome: "Shipped her first project",
		},
		{
			name: "Tariq",
			who: "22, Mandeville",
			quote:
				"I taught the thing I just learned to a friend. Explaining it once made it finally stick.",
			outcome: "Landed freelance work",
		},
	],
	health: [
		{
			name: "Aaliyah",
			who: "21, Kingston",
			quote:
				"I swapped one habit, not my whole life. Better sleep gave me back the energy I kept saying I didn't have.",
			outcome: "Feels steadier",
		},
		{
			name: "Jelani",
			who: "23, Spanish Town",
			quote:
				"I started with a ten minute walk. It was never about the walk, it was about proving I keep promises to myself.",
			outcome: "Found his rhythm",
		},
	],
};
function pickStory(
	label: string | null,
	id: string,
	byArea: Record<string, Story[]>,
): Story & { grad: string } {
	const key = catKey(label);
	// Real stories for this focus area win; otherwise the illustrative fallback.
	const arr =
		(byArea[key]?.length ? byArea[key] : STORIES[key]) ?? STORIES.career;
	return {
		...arr[hashId(id) % arr.length],
		grad: STORY_GRADS[hashId(id) % STORY_GRADS.length],
	};
}

function PeerStory({ story }: { story: Story & { grad: string } }) {
	return (
		<div
			className="mt-[10px] max-w-[360px] rounded-[16px] px-4 py-[13px] backdrop-blur-md"
			style={{
				background: "rgba(10,8,4,0.42)",
				border: "1px solid rgba(255,255,255,0.14)",
			}}
		>
			<div className="mb-2 flex items-center gap-2.5">
				<span
					className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full font-black text-[11px] text-white"
					style={{ background: story.grad }}
				>
					{story.name[0]}
				</span>
				<div className="min-w-0">
					<p className="font-bold text-[11px] text-white leading-tight">
						{story.name}, {story.who}
					</p>
					<p
						className="font-bold text-[8px] uppercase tracking-[0.14em]"
						style={{ color: "#F5C842" }}
					>
						Someone on your path
					</p>
				</div>
			</div>
			<p
				className="font-medium text-[12px] leading-[1.55]"
				style={{ color: "rgba(255,255,255,0.82)" }}
			>
				“{story.quote}”
			</p>
			<div className="mt-[10px] flex flex-wrap items-center gap-2">
				<span
					className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-bold text-[10px]"
					style={{
						background: "rgba(62,207,191,0.16)",
						color: "#3ECFBF",
						border: "1px solid rgba(62,207,191,0.3)",
					}}
				>
					<span aria-hidden="true">→</span>
					{story.outcome}
				</span>
				{story.sourceUrl && (
					<a
						href={story.sourceUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex cursor-pointer items-center gap-1 font-bold text-[10px] underline decoration-white/30 underline-offset-2 transition-colors hover:text-white"
						style={{ color: "rgba(255,255,255,0.6)" }}
					>
						Read {story.sourceName ? `on ${story.sourceName}` : "the story"}
						<span aria-hidden="true">→</span>
					</a>
				)}
			</div>
		</div>
	);
}

// ── "Your top pick" micro-card (mandatory) ───────────────────────────────────
// Identity reinforcement: the focus-area pill names the user's lane, and the
// explanation (from the identity-aware personalize pass) ties the card to the
// goal and focus they set in North.
function WhyThis({
	why,
	aspiration,
	count,
}: {
	why: string | null | undefined;
	aspiration: string | null;
	count: number;
}) {
	// Personal, warm, and dash-free. The AI reason wins when present; otherwise we
	// reach for the aspiration the member set in onboarding; then a warm default.
	// Any em/en dashes are swapped for commas so the copy stays clean.
	const goal = aspiration?.trim();
	const text = (
		why ??
		(goal
			? `You said this matters to you: ${goal}. This is one small step toward it today.`
			: "You told North where you want to go. This is the one small thing that moves you closer today.")
	).replace(/\s*[—–]\s*/g, ", ");
	return (
		<div
			className="mt-[16px] max-w-[360px] rounded-[16px] px-4 py-[14px] backdrop-blur-md"
			style={{
				background: "rgba(10,8,4,0.42)",
				border: "1px solid rgba(255,255,255,0.14)",
			}}
		>
			<p
				className="mb-2 font-bold text-[9px] uppercase tracking-[0.18em]"
				style={{ color: "#F5C842" }}
			>
				Chosen with you in mind
			</p>
			<p
				className="font-medium text-[12px] leading-[1.55]"
				style={{ color: "rgba(255,255,255,0.82)" }}
			>
				{text}
			</p>
			<SocialProof count={count} light />
		</div>
	);
}

// ── Social proof — people on a similar path ──────────────────────────────────
// Three overlapping avatars in the brand trio (gold · teal · violet); the count
// reads as light-card ink. (On a dark cinematic card swap the text to
// rgba(255,255,255,0.65).)
const PROOF_AVATARS = [
	{
		id: "gold",
		overlap: false,
		grad: "linear-gradient(135deg, #F5C842, #E8B84B)",
	},
	{
		id: "teal",
		overlap: true,
		grad: "linear-gradient(135deg, #3ECFBF, #2BB6A8)",
	},
	{
		id: "violet",
		overlap: true,
		grad: "linear-gradient(135deg, #9B7DFF, #7B61FF)",
	},
];

function SocialProof({
	count,
	light = false,
}: {
	count: number;
	light?: boolean;
}) {
	return (
		<div className="mt-3 flex items-center gap-2">
			<div className="flex items-center" aria-hidden="true">
				{PROOF_AVATARS.map((a) => (
					<span
						key={a.id}
						className={`h-[20px] w-[20px] flex-shrink-0 rounded-full border-2 ${light ? "border-white/30" : "border-white/20"} ${a.overlap ? "-ml-[6px]" : ""}`}
						style={{ background: a.grad }}
					/>
				))}
			</div>
			<span
				className="font-semibold text-[11px]"
				style={{
					color: light ? "rgba(255,255,255,0.7)" : "rgba(14,20,32,0.5)",
				}}
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
// North compass mark — gold north needle, teal south, ink east/west.
function CompassLogo() {
	return (
		<svg
			width="24"
			height="24"
			viewBox="0 0 32 32"
			fill="none"
			aria-hidden="true"
		>
			<circle
				cx="16"
				cy="16"
				r="14"
				stroke={withAlpha(GOLD, 0.6)}
				strokeWidth="1"
			/>
			<circle
				cx="16"
				cy="16"
				r="9"
				stroke={withAlpha(GOLD, 0.25)}
				strokeWidth="0.8"
				strokeDasharray="2 4"
			/>
			<polygon points="16,5 13,16 19,16" fill={GOLD} />
			<polygon points="16,27 13,16 19,16" fill={withAlpha(TEAL, 0.8)} />
			<polygon points="27,16 16,13 16,19" fill={withAlpha(TEXT, 0.3)} />
			<polygon points="5,16 16,13 16,19" fill={withAlpha(TEXT, 0.3)} />
			<circle cx="16" cy="16" r="2.2" fill={GOLD} />
			<circle cx="16" cy="16" r="0.9" fill={BG} />
		</svg>
	);
}

// Quiet, editorial header — wordmark with the compass mark, plus two soft icons,
// floating over the image. No filter tags (the feed is already personalised).
function TopNav() {
	return (
		<header
			className="absolute inset-x-0 top-0 z-50 flex items-center px-5 pt-[16px] pb-3"
			style={{
				background:
					"linear-gradient(to bottom, rgba(253,248,239,0.6), rgba(253,248,239,0))",
			}}
		>
			<a
				href="/for-you"
				className="flex shrink-0 cursor-pointer items-center gap-2"
				aria-label="North home"
			>
				<CompassLogo />
				<span
					className="text-[21px] leading-none"
					style={{
						color: TEXT,
						fontFamily:
							"'Iowan Old Style', Palatino, Georgia, 'Times New Roman', serif",
						fontWeight: 600,
						letterSpacing: "0.2px",
					}}
				>
					North
				</span>
			</a>

			<div className="ml-auto flex shrink-0 items-center gap-2">
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
		background: "rgba(245,200,66,0.08)",
		border: "1px solid rgba(245,200,66,0.15)",
		color: "rgba(14,20,32,0.4)",
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
	href,
}: {
	type: "read" | "watch" | "listen";
	label: string;
	href?: string;
}) {
	const cls =
		"mb-1 inline-flex w-fit items-center gap-[7px] rounded-full px-[14px] py-[8px] font-bold text-[10px] text-white uppercase tracking-[0.12em] backdrop-blur-md";
	const style = {
		background: "rgba(10,8,4,0.55)",
		border: "1px solid rgba(255,255,255,0.22)",
	};
	const inner = (
		<>
			<KindIcon type={type} color="#FFFFFF" />
			{label}
		</>
	);
	return href ? (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className={`${cls} cursor-pointer transition-[filter] duration-200 hover:brightness-125 motion-reduce:transition-none`}
			style={style}
		>
			{inner}
		</a>
	) : (
		<span className={cls} style={style}>
			{inner}
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
			<div className="absolute bottom-[6px] left-1/2 z-10 h-[3px] w-[120px] -translate-x-1/2 overflow-hidden rounded-full bg-[rgba(14,20,32,0.12)]">
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
							: { width: 4, background: "rgba(14,20,32,0.12)" }
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
				style={{ color: "rgba(14,20,32,0.35)" }}
			>
				Nothing here yet
			</p>
			<p className="mt-1 text-[13px]" style={{ color: "rgba(14,20,32,0.22)" }}>
				Your personalised feed is building.
			</p>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG art
// ─────────────────────────────────────────────────────────────────────────────

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
