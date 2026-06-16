// Same-origin image proxy URL builder (see /api/img). Routes remote http(s)
// images through our own domain so they always load, no third-party hotlink or
// CORS failures. Local/relative assets (e.g. /fallbacks/*) pass through untouched.
//
// The `v` cache-buster is intentional: an earlier build gated /api/img behind
// auth, so browsers + a prior service-worker image cache stored a sign-in
// redirect/HTML under the old `/api/img?url=…` keys. Bumping `v` changes the URL,
// so every client fetches fresh through the now-public route instead of replaying
// the cached failure. Bump again only if a similar cache-poisoning ever recurs.
const PROXY_VERSION = "2";
export function proxiedImage(url: string | null | undefined): string {
	if (!url || /^https?:\/\//i.test(url) === false) return url ?? "";
	return `/api/img?v=${PROXY_VERSION}&url=${encodeURIComponent(url)}`;
}
