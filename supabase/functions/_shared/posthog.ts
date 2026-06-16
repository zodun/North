// PostHog server-event helper for Supabase Edge Functions (DEC-19).
//
// Why direct fetch instead of posthog-node: the SDK targets the Node
// runtime; the Edge Function runs on Deno. Posting to PostHog's
// /i/v0/e/ endpoint is two lines of fetch, so we skip the SDK and stay
// Deno-native.
//
// No-op when POSTHOG_API_KEY is unset, so local Edge Function dev
// without analytics wired doesn't fail loudly.

const DEFAULT_HOST = "https://us.i.posthog.com";

export type CaptureDeps = {
	apiKey?: string;
	host?: string;
	fetcher?: typeof fetch;
};

/**
 * Fire a single event into PostHog. Returns true if the call was made
 * (regardless of success, we don't await retries), false if the
 * helper was skipped because no API key is configured.
 */
export async function captureServer(
	event: string,
	distinctId: string,
	properties?: Record<string, unknown>,
	deps?: CaptureDeps,
): Promise<boolean> {
	const apiKey = deps?.apiKey ?? Deno.env.get("POSTHOG_API_KEY") ?? "";
	if (!apiKey) return false;
	const host = deps?.host ?? Deno.env.get("POSTHOG_HOST") ?? DEFAULT_HOST;
	const fetcher = deps?.fetcher ?? fetch;
	const body = {
		api_key: apiKey,
		event,
		distinct_id: distinctId,
		properties: {
			...(properties ?? {}),
			source: "edge-function",
		},
		timestamp: new Date().toISOString(),
	};
	try {
		await fetcher(`${host}/i/v0/e/`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		});
		return true;
	} catch {
		// Server events are best-effort by design, never let analytics
		// failure surface to the user.
		return false;
	}
}
