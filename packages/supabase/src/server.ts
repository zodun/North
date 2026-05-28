import { env } from "@north/env/server";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type CookieAdapter = {
	getAll(): { name: string; value: string }[];
	setAll(
		cookies: {
			name: string;
			value: string;
			options?: Record<string, unknown>;
		}[],
	): void;
};

/**
 * SSR client bound to the incoming request's cookies. Use inside Next.js
 * route handlers, server components, and middleware so per-request RLS
 * (anon key + auth cookie) flows through correctly. Caller supplies the
 * cookie adapter — see `@supabase/ssr` docs for Next.js wiring.
 */
export function createSsrClient(cookies: CookieAdapter): SupabaseClient {
	return createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
		cookies,
	});
}

/**
 * Service-role client. Bypasses RLS — use only inside trusted server code
 * (Edge Functions, admin server actions, scheduled jobs). Never ship this
 * client to the browser or native app.
 */
export function createServiceRoleClient(): SupabaseClient {
	return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
		auth: { persistSession: false, autoRefreshToken: false },
	});
}
