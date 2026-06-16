// Premium entitlement (BILLING-01, BILLING-02).
// Server-side gate for premium features (AI personalization of the feed +
// opportunities). The free tier is a monthly allowance: 10 premium days per
// calendar month, then it locks until the month resets or the user subscribes.
//
// getIsPremium claims today's premium for the caller via claim_premium_day():
// it returns whether they have premium today and, for a free user, spends one of
// their monthly day-credits the first time it is called that day (idempotent
// within a day, deduped across the feed + opportunities surfaces). Paying
// subscribers always return true and never spend a credit. The quota logic lives
// in the SQL function so there is a single source of truth.

import type { SupabaseClient } from "@supabase/supabase-js";

export async function getIsPremium(
	supabase: SupabaseClient,
	userId: string,
): Promise<boolean> {
	const { data } = await supabase.rpc("claim_premium_day", { p_user: userId });
	return data === true;
}
