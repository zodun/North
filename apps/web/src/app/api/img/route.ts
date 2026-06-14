// GET /api/img?url=<encoded image url>
// Same-origin image proxy. Fetches a remote image server-side (with a Referer of
// the image's own origin, defeating hotlink protection) and streams the bytes
// back from our domain. This is why every For You card can reliably show its real
// image: the browser never hotlinks a third-party CDN that might block it.
//
// On any failure (unsafe url, non-image, upstream error) it returns 404 so the
// card's <img> onError fires and the feed drops the imageless card.

export const runtime = "nodejs";

// Block non-http(s) and obvious private/loopback hosts (basic SSRF guard — the
// `url` arrives from the client even though it originates from curated content).
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

function notFound(): Response {
	return new Response(null, { status: 404 });
}

export async function GET(req: Request): Promise<Response> {
	const raw = new URL(req.url).searchParams.get("url");
	const target = raw ? safeUrl(raw) : null;
	if (!target) return notFound();

	try {
		const res = await fetch(target.toString(), {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (compatible; NorthBot/1.0; +https://north.app)",
				accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
				// Present as if the request came from the image's own site so hosts
				// with Referer-based hotlink protection serve the asset.
				referer: target.origin,
			},
			redirect: "follow",
			signal: AbortSignal.timeout(8000),
		});
		const ct = res.headers.get("content-type") ?? "";
		if (!res.ok || !ct.startsWith("image/") || !res.body) return notFound();

		return new Response(res.body, {
			headers: {
				"content-type": ct,
				// Cache hard at the edge + browser; image bytes for a given source URL
				// are effectively immutable for our purposes.
				"cache-control": "public, max-age=86400, s-maxage=604800, immutable",
			},
		});
	} catch {
		return notFound();
	}
}
