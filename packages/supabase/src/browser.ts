import { env } from "@north/env/web";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Browser Supabase client for the admin Next.js app. Uses the anon key, so
 * every query is subject to RLS as the signed-in user.
 */
export function createSupabaseBrowserClient(): SupabaseClient {
	if (cached) return cached;
	cached = createBrowserClient(
		env.NEXT_PUBLIC_SUPABASE_URL,
		env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
	);
	return cached;
}
