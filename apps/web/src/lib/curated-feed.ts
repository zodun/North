// Curated content fetching (data layer).
//
// Pulls real, reputable resources from approved RSS feeds + the YouTube Data API
// so every For You card links to something that genuinely helps a young
// professional. This module only FETCHES and normalizes; persistence into
// content_items (so the existing feed, saves, personalize, and categories keep
// working unchanged) happens in the /api/curated-feed route.
//
// Categories here are the *source* taxonomy (career/mindset/money/skills/
// entrepreneurship); the route maps them onto the app's focus areas + content
// categories.

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cleanCopy } from "@/lib/text";

export type SourceCategory =
	| "career"
	| "mindset"
	| "money"
	| "skills"
	| "entrepreneurship";

export type CuratedItem = {
	title: string;
	description: string;
	url: string;
	source: string;
	category: SourceCategory;
	kind: "read" | "watch" | "listen";
	thumbnail: string | null;
	publishedAt: string;
};

type RssSource = { name: string; rss: string };

const APPROVED_SOURCES: Record<SourceCategory, RssSource[]> = {
	career: [
		{ name: "Harvard Business Review", rss: "https://hbr.org/feed" },
		{ name: "Fast Company", rss: "https://www.fastcompany.com/latest/rss" },
		{ name: "Inc Magazine", rss: "https://www.inc.com/rss" },
		{ name: "Medium", rss: "https://medium.com/feed/tag/career-advice" },
	],
	mindset: [
		{ name: "TED Ideas", rss: "https://ideas.ted.com/feed" },
		{
			name: "Greater Good",
			rss: "https://greatergood.berkeley.edu/feeds/articles",
		},
		{
			name: "Psychology Today",
			rss: "https://www.psychologytoday.com/intl/feeds/articles",
		},
		{ name: "Medium", rss: "https://medium.com/feed/tag/self-improvement" },
	],
	money: [
		{ name: "NerdWallet", rss: "https://www.nerdwallet.com/blog/feed" },
		{ name: "The Financial Diet", rss: "https://thefinancialdiet.com/feed" },
		{
			name: "Investopedia",
			rss: "https://www.investopedia.com/feedbuilder/feed/getfeed/?feedName=rss_headline",
		},
		{ name: "Medium", rss: "https://medium.com/feed/tag/personal-finance" },
	],
	skills: [
		{ name: "Smashing Magazine", rss: "https://www.smashingmagazine.com/feed" },
		{ name: "CSS-Tricks", rss: "https://css-tricks.com/feed" },
		{ name: "Dev.to", rss: "https://dev.to/feed" },
		{ name: "Medium", rss: "https://medium.com/feed/tag/programming" },
	],
	entrepreneurship: [
		{ name: "Y Combinator", rss: "https://www.ycombinator.com/blog/rss" },
		{
			name: "First Round Review",
			rss: "https://review.firstround.com/feed.xml",
		},
		{ name: "Paul Graham", rss: "https://www.paulgraham.com/rss.html" },
		{ name: "Medium (The Startup)", rss: "https://medium.com/feed/swlh" },
	],
};

const YOUTUBE_CHANNELS: Record<
	SourceCategory,
	{ channelId: string; name: string }[]
> = {
	career: [{ channelId: "UCAuUUnT6oDeKwE6v1NGQxug", name: "TED" }],
	mindset: [{ channelId: "UC2D2CMWXMOVWx7giW1n3LIg", name: "Andrew Huberman" }],
	money: [{ channelId: "UCV6KDgJskWaEckne5aPA0aQ", name: "Graham Stephan" }],
	skills: [{ channelId: "UC8butISFwT-Wl7EV0hUK0BQ", name: "freeCodeCamp" }],
	entrepreneurship: [
		{ channelId: "UCcefcZRL2oaA_uBNeo5UOWg", name: "Y Combinator" },
	],
};

// High-quality evergreen talks used when no YouTube API key is configured.
const FALLBACK_VIDEOS: CuratedItem[] = [
	{
		title: "Steve Jobs' 2005 Stanford Commencement Address",
		description:
			"Steve Jobs on connecting the dots, love and loss, and death, as a guide to building a working life that matters.",
		url: "https://www.youtube.com/watch?v=UF8uR6Z6KLc",
		source: "Stanford",
		category: "mindset",
		kind: "watch",
		thumbnail: "https://img.youtube.com/vi/UF8uR6Z6KLc/maxresdefault.jpg",
		publishedAt: "2008-03-07T00:00:00.000Z",
	},
	{
		title: "The puzzle of motivation",
		description:
			"Career analyst Dan Pink on why traditional rewards aren't always as effective as we think, and what actually drives us.",
		url: "https://www.youtube.com/watch?v=rrkrvAUbU9Y",
		source: "TED",
		category: "career",
		kind: "watch",
		thumbnail: "https://img.youtube.com/vi/rrkrvAUbU9Y/maxresdefault.jpg",
		publishedAt: "2009-08-25T00:00:00.000Z",
	},
	{
		title: "Neural Networks: Zero to Hero",
		description:
			"Andrej Karpathy builds neural networks from scratch, in code, starting at the very basics of backpropagation.",
		url: "https://www.youtube.com/watch?v=VMj-3S1tku0",
		source: "Andrej Karpathy",
		category: "skills",
		kind: "watch",
		thumbnail: "https://img.youtube.com/vi/VMj-3S1tku0/maxresdefault.jpg",
		publishedAt: "2022-08-16T00:00:00.000Z",
	},
	{
		title: "How to build wealth in your 20s",
		description:
			"The financial decisions in your twenties that compound the most, explained simply.",
		url: "https://www.youtube.com/watch?v=1OKZOV-iLj4",
		source: "Graham Stephan",
		category: "money",
		kind: "watch",
		thumbnail: "https://img.youtube.com/vi/1OKZOV-iLj4/maxresdefault.jpg",
		publishedAt: "2021-01-01T00:00:00.000Z",
	},
	{
		title: "How to get startup ideas",
		description:
			"Y Combinator on where good startup ideas actually come from, and how to notice them.",
		url: "https://www.youtube.com/watch?v=uvw-u99yj8w",
		source: "Y Combinator",
		category: "entrepreneurship",
		kind: "watch",
		thumbnail: "https://img.youtube.com/vi/uvw-u99yj8w/maxresdefault.jpg",
		publishedAt: "2018-11-12T00:00:00.000Z",
	},
	{
		title: "How to focus to change your brain",
		description:
			"Stanford neuroscientist Andrew Huberman on the science of focus, attention, and learning.",
		url: "https://www.youtube.com/watch?v=LG53Vxum0as",
		source: "Huberman Lab",
		category: "mindset",
		kind: "watch",
		thumbnail: "https://img.youtube.com/vi/LG53Vxum0as/maxresdefault.jpg",
		publishedAt: "2021-07-26T00:00:00.000Z",
	},
];

function firstMatch(s: string, ...res: RegExp[]): string | null {
	for (const re of res) {
		const m = s.match(re);
		if (m?.[1]) return m[1].trim();
	}
	return null;
}

function decodeEntities(s: string): string {
	return s
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&#x27;/g, "'")
		.replace(/&nbsp;/g, " ")
		.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function parseRss(
	xml: string,
	source: string,
	category: SourceCategory,
	max: number,
): CuratedItem[] {
	const out: CuratedItem[] = [];
	const blocks = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
	for (const block of blocks) {
		if (out.length >= max) break;
		const item = block[1];
		const rawTitle = firstMatch(
			item,
			/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/,
			/<title>([\s\S]*?)<\/title>/,
		);
		const link =
			firstMatch(
				item,
				/<link>([\s\S]*?)<\/link>/,
				/<link[^>]*href="([^"]+)"/,
				/<guid[^>]*>([\s\S]*?)<\/guid>/,
			) ?? "";
		const rawDesc =
			firstMatch(
				item,
				/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/,
				/<description>([\s\S]*?)<\/description>/,
				/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/,
			) ?? "";
		const pub =
			firstMatch(
				item,
				/<pubDate>([\s\S]*?)<\/pubDate>/,
				/<published>([\s\S]*?)<\/published>/,
				/<updated>([\s\S]*?)<\/updated>/,
			) ?? "";
		const thumbnail =
			firstMatch(
				item,
				/<media:thumbnail[^>]*url="([^"]+)"/,
				/<media:content[^>]*url="([^"]+)"/,
				/<enclosure[^>]*url="([^"]+)"[^>]*type="image/,
				/<img[^>]*src="([^"]+)"/,
			) ?? null;

		if (!rawTitle || !link?.startsWith("http")) continue;
		out.push({
			title: cleanCopy(decodeEntities(rawTitle)).slice(0, 160),
			description: cleanCopy(
				decodeEntities(rawDesc.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")),
			).slice(0, 220),
			url: link.trim(),
			source,
			category,
			kind: "read",
			thumbnail,
			publishedAt: pub ? new Date(pub).toISOString() : new Date().toISOString(),
		});
	}
	return out;
}

async function fetchRss(url: string): Promise<string | null> {
	try {
		const res = await fetch(url, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (compatible; NorthApp/1.0; +https://north.app)",
				Accept: "application/rss+xml, application/xml, text/xml, */*",
			},
			signal: AbortSignal.timeout(6000),
		});
		if (!res.ok) return null;
		return await res.text();
	} catch {
		return null;
	}
}

// Pull an article's own image (og:image / twitter:image) so every card carries a
// real picture from the source, not a generic fallback. Resolves protocol- and
// root-relative URLs against the article origin. Error-safe (returns null).
async function fetchOgImage(articleUrl: string): Promise<string | null> {
	try {
		const res = await fetch(articleUrl, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (compatible; NorthApp/1.0; +https://north.app)",
				Accept: "text/html,application/xhtml+xml",
			},
			signal: AbortSignal.timeout(7000),
		});
		if (!res.ok) return null;
		const html = (await res.text()).slice(0, 250_000);
		const found =
			firstMatch(
				html,
				/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
				/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
				/<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
				/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i,
				/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i,
			) ?? null;
		if (!found) return null;
		let img = decodeEntities(found.trim());
		if (img.startsWith("//")) img = `https:${img}`;
		else if (img.startsWith("/")) {
			try {
				img = new URL(articleUrl).origin + img;
			} catch {
				return null;
			}
		}
		return img.startsWith("http") ? img : null;
	} catch {
		return null;
	}
}

// Fill missing thumbnails from each article's og:image, with bounded concurrency.
async function enrichThumbnails(items: CuratedItem[]): Promise<void> {
	const need = items.filter((i) => !i.thumbnail);
	const CONCURRENCY = 8;
	for (let i = 0; i < need.length; i += CONCURRENCY) {
		const batch = need.slice(i, i + CONCURRENCY);
		await Promise.all(
			batch.map(async (item) => {
				item.thumbnail = await fetchOgImage(item.url);
			}),
		);
	}
}

// Tracking pixels / spacers served as og:image (e.g. NerdWallet's nw-pixel.gif)
// are valid images, so they pass the live-image check yet render as a blank card.
// Reject the obvious ones by URL before we ever store them as a thumbnail.
function isTrackingPixel(url: string): boolean {
	return /(?:pixel|spacer|1x1|blank|transparent|tracking|beacon)\b|\/track\//i.test(
		url,
	);
}

// Confirm a thumbnail URL actually serves a live image. Mirrors the render-time
// /api/img proxy (same UA + Referer), so anything that passes here will also load
// in the browser through the proxy. Also rejects tracking pixels (by URL and by a
// too-small byte size) so blank-pixel "images" never reach the feed. Error-safe
// (returns false).
async function isLiveImage(url: string): Promise<boolean> {
	if (isTrackingPixel(url)) return false;
	try {
		const origin = new URL(url).origin;
		const res = await fetch(url, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (compatible; NorthBot/1.0; +https://north.app)",
				Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
				Referer: origin,
			},
			redirect: "follow",
			signal: AbortSignal.timeout(7000),
		});
		const ct = res.headers.get("content-type") ?? "";
		// A declared length under ~1.5KB is a pixel/spacer, never a real share image.
		const len = Number.parseInt(res.headers.get("content-length") ?? "", 10);
		// Don't download the body — headers are enough to confirm it's an image.
		await res.body?.cancel();
		if (!res.ok || !ct.startsWith("image/")) return false;
		if (Number.isFinite(len) && len > 0 && len < 1500) return false;
		return true;
	} catch {
		return false;
	}
}

// Drop any item whose thumbnail does not resolve to a live image, so only items
// that will actually render an image are ingested. Bounded concurrency.
async function verifyThumbnails(items: CuratedItem[]): Promise<void> {
	const CONCURRENCY = 8;
	for (let i = 0; i < items.length; i += CONCURRENCY) {
		const batch = items.slice(i, i + CONCURRENCY);
		await Promise.all(
			batch.map(async (item) => {
				if (!item.thumbnail) return;
				// YouTube thumbnails are reliable and self-heal at render (maxres →
				// hqdefault), so don't verify (and risk dropping) them.
				if (/(?:img\.youtube\.com|ytimg\.com)/.test(item.thumbnail)) return;
				if (!(await isLiveImage(item.thumbnail))) item.thumbnail = null;
			}),
		);
	}
}

async function fetchYouTube(
	category: SourceCategory,
	apiKey: string,
	max: number,
): Promise<CuratedItem[]> {
	const out: CuratedItem[] = [];
	for (const channel of YOUTUBE_CHANNELS[category] ?? []) {
		try {
			const u = new URL("https://www.googleapis.com/youtube/v3/search");
			u.searchParams.set("key", apiKey);
			u.searchParams.set("channelId", channel.channelId);
			u.searchParams.set("part", "snippet");
			u.searchParams.set("order", "date");
			u.searchParams.set("maxResults", String(max));
			u.searchParams.set("type", "video");
			const res = await fetch(u.toString(), {
				signal: AbortSignal.timeout(6000),
			});
			if (!res.ok) continue;
			const data = (await res.json()) as {
				items?: {
					id?: { videoId?: string };
					snippet?: {
						title?: string;
						description?: string;
						publishedAt?: string;
						thumbnails?: Record<string, { url?: string }>;
					};
				}[];
			};
			for (const v of data.items ?? []) {
				const vid = v.id?.videoId;
				const sn = v.snippet;
				if (!vid || !sn?.title) continue;
				out.push({
					title: cleanCopy(decodeEntities(sn.title)).slice(0, 160),
					description: cleanCopy(sn.description ?? "").slice(0, 220),
					url: `https://www.youtube.com/watch?v=${vid}`,
					source: channel.name,
					category,
					kind: "watch",
					thumbnail:
						sn.thumbnails?.maxres?.url ??
						sn.thumbnails?.high?.url ??
						`https://img.youtube.com/vi/${vid}/maxresdefault.jpg`,
					publishedAt: sn.publishedAt ?? new Date().toISOString(),
				});
			}
		} catch {
			// next channel
		}
	}
	return out;
}

/**
 * Fetch normalized curated items for the given source categories. Resilient: any
 * feed that fails is skipped, never throwing. Falls back to evergreen talks for
 * "watch" content when no YouTube key is set.
 */
export async function fetchCuratedItems(
	categories: SourceCategory[],
	opts: {
		youtubeApiKey?: string;
		perRssSource?: number;
		perCategoryVideos?: number;
	} = {},
): Promise<CuratedItem[]> {
	const perRss = opts.perRssSource ?? 4;
	const perVideos = opts.perCategoryVideos ?? 2;
	const cats = categories.length
		? categories
		: (["career", "mindset"] as SourceCategory[]);

	const items: CuratedItem[] = [];

	// RSS (in parallel per category, all sources).
	const rssJobs: Promise<CuratedItem[]>[] = [];
	for (const cat of cats) {
		for (const src of APPROVED_SOURCES[cat] ?? []) {
			rssJobs.push(
				fetchRss(src.rss).then((xml) =>
					xml ? parseRss(xml, src.name, cat, perRss) : [],
				),
			);
		}
	}
	for (const batch of await Promise.all(rssJobs)) items.push(...batch);

	// Video: live YouTube when keyed; supplement any channel that returns nothing
	// (or every category when no key) with the curated evergreen talks, so each
	// focus area always has at least one watchable card.
	if (opts.youtubeApiKey) {
		const batches = await Promise.all(
			cats.map((c) => fetchYouTube(c, opts.youtubeApiKey as string, perVideos)),
		);
		cats.forEach((cat, i) => {
			const live = batches[i];
			if (live.length > 0) items.push(...live);
			else items.push(...FALLBACK_VIDEOS.filter((v) => v.category === cat));
		});
	} else {
		for (const cat of cats) {
			items.push(...FALLBACK_VIDEOS.filter((v) => v.category === cat));
		}
	}
	// Always include the Stanford talk as a universally relevant anchor.
	if (!items.some((i) => i.url.includes("UF8uR6Z6KLc"))) {
		items.push(FALLBACK_VIDEOS[0]);
	}

	// Dedupe by full URL. (Not by path: YouTube watch URLs share the same path
	// and differ only in the ?v= query, so a path-only key would collapse them.)
	const seen = new Set<string>();
	const deduped = items.filter((i) => {
		const key = i.url.replace(/[#?].*$/, (m) =>
			i.url.includes("watch?v=") ? m : "",
		);
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});

	// Bring across each article's own image (og:image) so every card has a real
	// picture from the source. Videos already carry a YouTube thumbnail.
	await enrichThumbnails(deduped);
	// Then confirm each thumbnail is a live image (same fetch the render-time proxy
	// uses). Any item without a verified, loadable image is dropped so the feed
	// never stores a card that would fall back to a generic image.
	await verifyThumbnails(deduped);
	return deduped.filter((i) => Boolean(i.thumbnail));
}

// ─────────────────────────────────────────────────────────────────────────────
// Ingestion: fetch curated items and upsert into content_items so the existing
// For You feed (and its saves/personalize/categories) surfaces them unchanged.
// Shared by the /api/curated-feed route and any server-side/cron trigger.
// ─────────────────────────────────────────────────────────────────────────────

export const ALL_SOURCE_CATEGORIES: SourceCategory[] = [
	"career",
	"mindset",
	"money",
	"skills",
	"entrepreneurship",
];

// App focus-area ids (focus_areas table) → curated source taxonomy. Also accepts
// the source categories themselves as pass-throughs.
export const FOCUS_TO_SOURCE: Record<string, SourceCategory> = {
	money: "money",
	learn: "skills",
	craft: "skills",
	mind: "mindset",
	people: "career",
	venture: "entrepreneurship",
	career: "career",
	mindset: "mindset",
	skills: "skills",
	entrepreneurship: "entrepreneurship",
};

// Source category → an eyebrow label whose words drive the feed's existing
// category styling (catKey): mind→mindset, money→money, skill→skills.
const CATEGORY_EYEBROW: Record<SourceCategory, string> = {
	career: "Career",
	mindset: "Mindset",
	money: "Money",
	skills: "Skills",
	entrepreneurship: "Entrepreneurship",
};

const KIND_MAP: Record<CuratedItem["kind"], "essay" | "video" | "voice"> = {
	read: "essay",
	watch: "video",
	listen: "voice",
};

export function resolveSourceCategories(
	param: string | null,
): SourceCategory[] {
	if (!param) return ALL_SOURCE_CATEGORIES;
	const mapped = param
		.split(",")
		.map((s) => FOCUS_TO_SOURCE[s.trim().toLowerCase()])
		.filter((c): c is SourceCategory => Boolean(c));
	return mapped.length ? Array.from(new Set(mapped)) : ALL_SOURCE_CATEGORIES;
}

// Stable uuid (v5-shaped) from a URL so re-ingesting updates the same row.
function uuidFromUrl(url: string): string {
	const h = createHash("sha1")
		.update(`curated:${url}`)
		.digest("hex")
		.slice(0, 32);
	const c = h.split("");
	c[12] = "5"; // version
	c[16] = ((Number.parseInt(c[16], 16) & 0x3) | 0x8).toString(16); // variant
	const s = c.join("");
	return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20, 32)}`;
}

export type IngestResult = {
	cached: boolean;
	written: number;
	blocked: number;
	items: {
		id: string;
		kind: string;
		title: string;
		eyebrow: string;
		source: string;
		url: string | null;
		thumbnail: string | null;
		publishedAt: string;
	}[];
	fetchedAt: string;
};

const CACHE_WINDOW_MS = 30 * 60_000;

/**
 * Fetch curated content for the given categories and upsert into content_items.
 * Throttled to one live fetch per 30 minutes per focus-key (unless force).
 * When a healthy batch (>=6) lands, hides previous non-curated cleared content so
 * every visible card is a curated reputable resource (reversible).
 */
export async function ingestCuratedFeed(
	db: SupabaseClient,
	categories: SourceCategory[],
	opts: { youtubeApiKey?: string; force?: boolean } = {},
): Promise<IngestResult> {
	const focusKey = [...categories].sort().join(",");
	const nowIso = new Date().toISOString();

	if (!opts.force) {
		const { data: run } = await db
			.from("curated_feed_runs")
			.select("ran_at")
			.eq("focus_key", focusKey)
			.maybeSingle();
		if (
			run?.ran_at &&
			Date.now() - new Date(run.ran_at).getTime() < CACHE_WINDOW_MS
		) {
			const { data: cached } = await db
				.from("content_items")
				.select(
					"id, kind, title, eyebrow, source, external_url, thumbnail_url, published_at",
				)
				.eq("license_status", "cleared")
				.eq("sort_order", 0)
				.order("published_at", { ascending: false })
				.limit(30);
			return {
				cached: true,
				written: 0,
				blocked: 0,
				items: (cached ?? []).map((r) => ({
					id: r.id as string,
					kind: r.kind as string,
					title: r.title as string,
					eyebrow: (r.eyebrow as string) ?? "",
					source: (r.source as string) ?? "",
					url: (r.external_url as string) ?? null,
					thumbnail: (r.thumbnail_url as string) ?? null,
					publishedAt: (r.published_at as string) ?? nowIso,
				})),
				fetchedAt: run.ran_at,
			};
		}
	}

	const curated = await fetchCuratedItems(categories, {
		youtubeApiKey: opts.youtubeApiKey,
		perRssSource: 4,
		perCategoryVideos: 2,
	});

	const rows = curated.map((it) => ({
		id: uuidFromUrl(it.url),
		kind: KIND_MAP[it.kind],
		title: it.title,
		eyebrow: CATEGORY_EYEBROW[it.category],
		body: it.description || null,
		source: it.source,
		external_url: it.url,
		thumbnail_url: it.thumbnail,
		content_category_id: null as string | null,
		license_status: "cleared" as const,
		license_type: "link-out" as const,
		attribution_text: it.source,
		sort_order: 0,
		published_at: it.publishedAt,
		updated_at: nowIso,
	}));

	let written = 0;
	let blocked = 0;
	if (rows.length > 0) {
		const { error, count } = await db
			.from("content_items")
			.upsert(rows, { onConflict: "id", count: "exact" });
		if (error) throw new Error(`upsert failed: ${error.message}`);
		written = count ?? rows.length;

		if (rows.length >= 6) {
			const ids = rows.map((r) => r.id);
			const { count: blockedCount } = await db
				.from("content_items")
				.update(
					{ license_status: "blocked", updated_at: nowIso },
					{ count: "exact" },
				)
				.eq("license_status", "cleared")
				.neq("kind", "opportunity")
				.not("id", "in", `(${ids.join(",")})`);
			blocked = blockedCount ?? 0;
		}
	}

	await db
		.from("curated_feed_runs")
		.upsert(
			{ focus_key: focusKey, ran_at: nowIso, item_count: rows.length },
			{ onConflict: "focus_key" },
		);

	return {
		cached: false,
		written,
		blocked,
		items: rows.map((r) => ({
			id: r.id,
			kind: r.kind,
			title: r.title,
			eyebrow: r.eyebrow,
			source: r.source,
			url: r.external_url,
			thumbnail: r.thumbnail_url,
			publishedAt: r.published_at,
		})),
		fetchedAt: nowIso,
	};
}
