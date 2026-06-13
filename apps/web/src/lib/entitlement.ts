// Premium entitlement check (BILLING-01).
// Server-side helper used by premium-gated features (AI personalization of the
// feed + opportunities). Reads the caller's own subscriptions row (RLS allows
// owner-read). Mirrors the public.is_premium() SQL function: active, trialing,
// or canceled-but-not-yet-expired all count.

import type { SupabaseClient } from "@supabase/supabase-js";

const ENTITLED = new Set(["active", "trialing", "canceled"]);

export async function getIsPremium(
	supabase: SupabaseClient,
	userId: string,
): Promise<boolean> {
	const { data } = await supabase
		.from("subscriptions")
		.select("status, current_period_end")
		.eq("user_id", userId)
		.maybeSingle<{ status: string; current_period_end: string | null }>();
	if (!data || !ENTITLED.has(data.status)) return false;
	if (!data.current_period_end) return true;
	return new Date(data.current_period_end) > new Date();
}
