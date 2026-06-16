// Premium entitlement check (BILLING-01, BILLING-02).
// Server-side helper used by premium-gated features (AI personalization of the
// feed + opportunities). Reads the caller's own rows (RLS allows owner-read).
// Mirrors the public.is_premium() SQL function: a paying/trialing subscription
// (active, trialing, or canceled-but-not-yet-expired) OR an unexpired free
// trial (profiles.trial_ends_at) counts as premium.

import type { SupabaseClient } from "@supabase/supabase-js";

const ENTITLED = new Set(["active", "trialing", "canceled"]);

export async function getIsPremium(
	supabase: SupabaseClient,
	userId: string,
): Promise<boolean> {
	const [{ data: sub }, { data: profile }] = await Promise.all([
		supabase
			.from("subscriptions")
			.select("status, current_period_end")
			.eq("user_id", userId)
			.maybeSingle<{ status: string; current_period_end: string | null }>(),
		supabase
			.from("profiles")
			.select("trial_ends_at")
			.eq("user_id", userId)
			.maybeSingle<{ trial_ends_at: string | null }>(),
	]);

	// Paid (or paid-style) entitlement.
	if (sub && ENTITLED.has(sub.status)) {
		if (!sub.current_period_end) return true;
		if (new Date(sub.current_period_end) > new Date()) return true;
	}

	// Free trial still running.
	if (profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date()) {
		return true;
	}

	return false;
}
