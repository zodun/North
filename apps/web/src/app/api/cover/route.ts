// GET /api/cover?cat=<key>&seed=<n>
// Renders a deterministic, on-brand Soft Sky cover for an article that has no
// real image (see lib/article-image/cover). Pure function of the query params —
// no user data, no upstream fetch — so it's public (exempt in proxy.ts) and
// cached hard. The For You feed points an image-less card's <img> straight here.

import { renderCoverSvg } from "@/lib/article-image/cover";

export const runtime = "nodejs";

export function GET(req: Request): Response {
	const { searchParams } = new URL(req.url);
	const cat = searchParams.get("cat") ?? "career";
	const seed = searchParams.get("seed") ?? "0";
	const svg = renderCoverSvg(cat, seed);
	return new Response(svg, {
		headers: {
			"content-type": "image/svg+xml; charset=utf-8",
			// Deterministic for a given (cat, seed) → cache immutably.
			"cache-control": "public, max-age=86400, s-maxage=604800, immutable",
		},
	});
}
