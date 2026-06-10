#!/usr/bin/env bun
/**
 * seed-youtube.ts — pulls YouTube videos into content_items as kind='video'.
 *
 * SETUP (one-time):
 *   1. Go to https://console.cloud.google.com/
 *   2. Create a project (or pick an existing one)
 *   3. Enable "YouTube Data API v3" (APIs & Services → Library)
 *   4. Create an API key (APIs & Services → Credentials → + Create credentials)
 *   5. Run:
 *        YOUTUBE_API_KEY=AIza... bun scripts/seed-youtube.ts
 *
 * OUTPUT:
 *   supabase/migrations/0028_seed_youtube_videos.sql
 *   Push it with: supabase db push  (or paste into the Supabase SQL editor)
 *
 * The script deduplicates across search terms, so running it multiple times
 * is safe — the INSERT uses ON CONFLICT DO NOTHING keyed on external_url.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";

const API_KEY = process.env.YOUTUBE_API_KEY;
if (!API_KEY) {
	console.error(
		"❌  YOUTUBE_API_KEY env var is missing.\n" +
			"    Run: YOUTUBE_API_KEY=your_key bun scripts/seed-youtube.ts",
	);
	process.exit(1);
}

// ── Search configuration ──────────────────────────────────────────────────────
// Edit these to change what content appears in the For You feed.

const SEARCH_TERMS = [
	"Caribbean youth scholarship fellowship opportunity",
	"Caribbean entrepreneur startup founder story",
	"Caribbean tech innovator changemaker",
];

const MAX_RESULTS_PER_QUERY = 17; // 3 terms × ~17 ≈ 50 after dedup
const MAX_TOTAL = 50;

// ── Types ─────────────────────────────────────────────────────────────────────

interface YTSearchItem {
	id: { videoId: string };
	snippet: {
		title: string;
		description: string;
		channelTitle: string;
		publishedAt: string;
		thumbnails: {
			high?: { url: string };
			medium?: { url: string };
			default?: { url: string };
		};
	};
}

interface YTSearchResponse {
	items: YTSearchItem[];
	error?: { message: string };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function escSql(s: string): string {
	return s.replace(/'/g, "''");
}

function sqlStr(v: string | null | undefined): string {
	if (v == null) return "null";
	return `'${escSql(v)}'`;
}

function cleanText(s: string, max = 400): string {
	return s.replace(/\n/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

// ── YouTube fetch ─────────────────────────────────────────────────────────────

async function searchYouTube(query: string): Promise<YTSearchItem[]> {
	const url = new URL("https://www.googleapis.com/youtube/v3/search");
	url.searchParams.set("part", "snippet");
	url.searchParams.set("q", query);
	url.searchParams.set("type", "video");
	url.searchParams.set("maxResults", String(MAX_RESULTS_PER_QUERY));
	url.searchParams.set("relevanceLanguage", "en");
	url.searchParams.set("videoEmbeddable", "true");
	// biome-ignore lint/style/noNonNullAssertion: guarded by early return above
	url.searchParams.set("key", API_KEY!);

	const res = await fetch(url.toString());
	const data = (await res.json()) as YTSearchResponse;

	if (!res.ok) {
		throw new Error(
			`YouTube API ${res.status}: ${data.error?.message ?? "unknown error"}`,
		);
	}
	return data.items ?? [];
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
	console.log("🎬  Fetching YouTube videos...\n");

	const seen = new Set<string>(); // deduplicate by video ID
	const rows: string[] = [];

	for (const query of SEARCH_TERMS) {
		process.stdout.write(`  Searching: "${query}" ... `);
		try {
			const items = await searchYouTube(query);
			let added = 0;
			for (const item of items) {
				if (rows.length >= MAX_TOTAL) break;
				const vid = item.id.videoId;
				if (!vid || seen.has(vid)) continue;
				seen.add(vid);

				const thumbnail =
					item.snippet.thumbnails.high?.url ??
					item.snippet.thumbnails.medium?.url ??
					item.snippet.thumbnails.default?.url ??
					null;

				const description = cleanText(item.snippet.description) || null;
				const source = item.snippet.channelTitle;
				const externalUrl = `https://www.youtube.com/watch?v=${vid}`;
				const title = cleanText(item.snippet.title, 255);
				const publishedAt = item.snippet.publishedAt;
				const attribution = `YouTube / ${source}`;
				// High sort_order pushes videos after editorially curated content.
				const sortOrder = 1000 + rows.length;

				rows.push(
					`    (gen_random_uuid(), 'video', ${sqlStr(title)}, null, ${sqlStr(description)}, ${sqlStr(source)}, ${sqlStr(attribution)}, ${sqlStr(externalUrl)}, null, ${sqlStr(thumbnail)}, null, ${sqlStr(publishedAt)}, ${sortOrder}, 'cleared', 'link-out', now())`,
				);
				added++;
			}
			console.log(`${added} videos`);
		} catch (err) {
			console.log(`⚠  skipped (${err})`);
		}
	}

	if (rows.length === 0) {
		console.error("\n❌  No videos fetched. Check your API key and quota.");
		process.exit(1);
	}

	const sql = `-- YouTube video seed (generated ${new Date().toISOString()})
-- ${rows.length} videos via YouTube Data API v3
-- kind='video', license_status='cleared' → visible in the For You feed immediately.
-- Re-running is safe: ON CONFLICT DO NOTHING keyed on external_url.

insert into public.content_items (
    id, kind, title, eyebrow, body, source, attribution_text,
    external_url, cloudinary_public_id, thumbnail_url,
    content_category_id, published_at, sort_order,
    license_status, license_type, created_at
)
values
${rows.join(",\n")}
on conflict do nothing;
`;

	const outPath = join(
		import.meta.dir,
		"../supabase/migrations/0028_seed_youtube_videos.sql",
	);
	writeFileSync(outPath, sql, "utf8");

	console.log(
		`\n✅  Wrote ${rows.length} videos → supabase/migrations/0028_seed_youtube_videos.sql`,
	);
	console.log("   Next: supabase db push   (or paste into the SQL editor)\n");
}

main().catch((err) => {
	console.error("\n❌ ", err);
	process.exit(1);
});
