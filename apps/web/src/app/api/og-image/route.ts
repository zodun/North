// GET /api/og-image?url=<encoded article url>
// Server-side fetches the article and extracts its share image (og:image →
// twitter:image → first large <img>). Returns { imageUrl: string | null }.
// Additive enhancement for the For You feed, the existing feed query is
// untouched. Errors are swallowed and return null so the card falls back.

export const runtime = "nodejs";

// Block non-http(s) and obvious private/loopback hosts (basic SSRF guard, the
// `url` arrives from the client, even though it originates from curated content).
function safeUrl(raw: string): URL | null {
	let u: URL;
	try {
		u = new URL(raw);
	} catch {
		return null;
	}
	if (u.protocol !== "http:" && u.protocol !== "https:") return null;
	const host = u.hostname.toLowerCase();
	if (host === "localhost" || host === "0.0.0.0" || host.endsWith(".local")) {
		return null;
	}
	if (
		/^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)
	) {
		return null;
	}
	return u;
}

// Meta content attributes are HTML-encoded (e.g. og:image URLs carry &amp;).
// Decode the common entities so the result is a usable image URL.
function decodeEntities(s: string): string {
	let out = s;
	// Some sites double-encode (&amp;amp;), decode until stable (bounded).
	for (let i = 0; i < 4 && out.includes("&amp;"); i++) {
		out = out.replace(/&amp;/g, "&");
	}
	return out
		.replace(/&#0*38;/g, "&")
		.replace(/&#x0*26;/gi, "&")
		.replace(/&quot;/g, '"')
		.replace(/&#0*34;/g, '"')
		.replace(/&#x0*2f;/gi, "/")
		.replace(/&#0*47;/g, "/");
}

function resolve(src: string, base: string): string {
	const decoded = decodeEntities(src);
	try {
		return new URL(decoded, base).toString();
	} catch {
		return decoded;
	}
}

function extractImage(html: string, base: string): string | null {
	const metas = html.match(/<meta[^>]+>/gi) ?? [];
	const findMeta = (prop: string): string | null => {
		for (const tag of metas) {
			if (
				new RegExp(`(?:property|name)\\s*=\\s*["']${prop}["']`, "i").test(tag)
			) {
				const c = tag.match(/content\s*=\s*["']([^"']+)["']/i);
				if (c?.[1]) return c[1];
			}
		}
		return null;
	};
	const meta =
		findMeta("og:image:secure_url") ??
		findMeta("og:image:url") ??
		findMeta("og:image") ??
		findMeta("twitter:image:src") ??
		findMeta("twitter:image");
	if (meta) {
		const r = resolve(meta, base);
		if (!isTrackingPixel(r)) return r;
	}

	const img = html.match(
		/<img[^>]+src\s*=\s*["']([^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/i,
	);
	if (img?.[1]) {
		const r = resolve(img[1], base);
		if (!isTrackingPixel(r)) return r;
	}
	return null;
}

// Some sites advertise a tracking pixel / spacer as their og:image (e.g.
// NerdWallet's nw-pixel.gif). It's a valid image but renders blank, so treat it
// as "no image" and let the card fall back.
function isTrackingPixel(url: string): boolean {
	return /(?:pixel|spacer|1x1|blank|transparent|tracking|beacon)\b|\/track\//i.test(
		url,
	);
}

function json(imageUrl: string | null): Response {
	return new Response(JSON.stringify({ imageUrl }), {
		headers: {
			"content-type": "application/json",
			// Never let a service worker / browser cache an OG result (avoids
			// serving a stale null and keeps debugging deterministic).
			"cache-control": "no-store, no-cache, must-revalidate",
			pragma: "no-cache",
		},
	});
}

export async function GET(req: Request): Promise<Response> {
	const raw = new URL(req.url).searchParams.get("url");
	console.log("[OG API] Request for URL:", raw);
	const target = raw ? safeUrl(raw) : null;
	if (!target) {
		console.log("[OG API] Rejected (missing/unsafe URL)");
		return json(null);
	}
	try {
		const res = await fetch(target.toString(), {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (compatible; NorthBot/1.0; +https://north.app)",
				accept: "text/html,application/xhtml+xml",
			},
			redirect: "follow",
			signal: AbortSignal.timeout(6000),
		});
		console.log("[OG API] Fetch response status:", res.status);
		if (!res.ok) return json(null);
		const ct = res.headers.get("content-type") ?? "";
		if (!ct.includes("text/html")) return json(null);
		const html = (await res.text()).slice(0, 500_000);
		const imageUrl = extractImage(html, target.toString());
		console.log("[OG API] Found image:", imageUrl);
		return json(imageUrl);
	} catch (error) {
		console.error("[OG API] Error:", error);
		return json(null);
	}
}
