// GET /api/curated-feed
//
// Refreshes the For You content pool with real, reputable resources. Fetches from
// approved RSS feeds + the YouTube Data API (see lib/curated-feed) and UPSERTS
// them into content_items, which the existing feed already reads, so the feed,
// card saves (uuid FK), personalization, and category styling keep working with
// zero component or visual change. Throttled to one live fetch per 30 minutes per
// focus-key (curated_feed_runs); a healthy batch hides the previous non-curated
// cleared content so every visible card is curated (reversible).
//
// Query params:
//   focusAreas  comma list of app focus ids (craft/learn/mind/money/people/
//               venture) or source categories. Default: all categories.
//   limit       max items returned in the response.
//   force       "1" to bypass the 30-minute cache.

import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { ingestCuratedFeed, resolveSourceCategories } from "@/lib/curated-feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const categories = resolveSourceCategories(searchParams.get("focusAreas"));
	const force = searchParams.get("force") === "1";
	const limit = Math.min(
		50,
		Math.max(1, Number.parseInt(searchParams.get("limit") || "20", 10)),
	);

	const supabaseUrl =
		process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!supabaseUrl || !serviceKey) {
		return NextResponse.json(
			{ error: "server not configured for curated feed" },
			{ status: 500 },
		);
	}

	const db = createClient(supabaseUrl, serviceKey, {
		auth: { persistSession: false, autoRefreshToken: false },
	});

	try {
		const result = await ingestCuratedFeed(db, categories, {
			youtubeApiKey: process.env.YOUTUBE_API_KEY || undefined,
			force,
		});
		return NextResponse.json({
			items: result.items.slice(0, limit),
			total: result.written,
			blocked: result.blocked,
			cached: result.cached,
			fetchedAt: result.fetchedAt,
		});
	} catch (err) {
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "ingest failed" },
			{ status: 500 },
		);
	}
}
