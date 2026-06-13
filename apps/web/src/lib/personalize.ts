// Server-side helper for premium AI personalization (AI-07).
// Calls the `personalize` edge function with candidate items and returns the
// personalized order + per-item reasons. The function gates on premium, ranks
// with Claude, and caches per user/surface/day — callers should still gate on
// getIsPremium() to avoid the round-trip for free users. Any failure returns
// null so pages fall back to their default ordering.

import type { SupabaseClient } from "@supabase/supabase-js";

type Ranked = { id: string; why: string };

export type Personalization = {
	order: string[];
	whyById: Map<string, string>;
};

export async function personalize(
	supabase: SupabaseClient,
	surface: "feed" | "opportunities",
	items: { id: string; label: string }[],
): Promise<Personalization | null> {
	if (items.length === 0) return null;
	const day = new Date().toISOString().slice(0, 10);
	try {
		const { data, error } = await supabase.functions.invoke("personalize", {
			body: { surface, day, items },
		});
		if (error || !data?.ok || !Array.isArray(data.ranking)) return null;
		const ranking = data.ranking as Ranked[];
		return {
			order: ranking.map((r) => r.id),
			whyById: new Map(ranking.filter((r) => r.why).map((r) => [r.id, r.why])),
		};
	} catch {
		return null;
	}
}

// Stable reorder by the personalized order; items not in `order` keep their
// original relative position at the end.
export function applyOrder<T extends { id: string }>(
	items: T[],
	order: string[],
): T[] {
	if (order.length === 0) return items;
	const pos = new Map(order.map((id, i) => [id, i]));
	return items
		.map((item, i) => ({ item, i }))
		.sort((a, b) => {
			const pa = pos.get(a.item.id) ?? order.length + a.i;
			const pb = pos.get(b.item.id) ?? order.length + b.i;
			return pa - pb;
		})
		.map((x) => x.item);
}
