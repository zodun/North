// CORS for browser-invoked Edge Functions. The web app calls these cross-origin
// (its own domain → <project>.supabase.co), so each must answer the preflight
// OPTIONS request and echo the headers on every response, or the browser blocks
// the call before it's sent. Allow-origin is "*" because these functions
// authenticate via the Authorization bearer token, not cookies.
export const corsHeaders: Record<string, string> = {
	"access-control-allow-origin": "*",
	"access-control-allow-methods": "POST, OPTIONS",
	"access-control-allow-headers":
		"authorization, x-client-info, apikey, content-type",
};

// Returns a 200 preflight response when the request is an OPTIONS probe, else
// null so the caller proceeds with its normal handling.
export function preflight(req: Request): Response | null {
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders });
	}
	return null;
}
