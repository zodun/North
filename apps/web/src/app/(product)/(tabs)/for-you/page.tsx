import type { Metadata } from "next";
import { getIsPremium } from "@/lib/entitlement";
import { applyOrder, personalize } from "@/lib/personalize";
import { getServerSupabase } from "@/lib/supabase-server";
import { ForYouFeed } from "./feed";

export const metadata: Metadata = { title: "For You" };

export default async function ForYouPage() {
	const supabase = await getServerSupabase();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	const { data: items } = await supabase
		.from("content_items")
		.select(
			"id, kind, title, eyebrow, body, source, external_url, cloudinary_public_id, thumbnail_url, content_category_id, published_at",
		)
		.not("license_status", "eq", "blocked")
		.order("sort_order", { ascending: true })
		.order("published_at", { ascending: false })
		.limit(30);

	const { data: existingInteractions } = user
		? await supabase
				.from("content_interactions")
				.select("content_item_id, action")
				.eq("user_id", user.id)
				.in("action", ["save", "matters"])
				.in(
					"content_item_id",
					(items ?? []).map((i) => i.id),
				)
		: { data: [] };

	const initialSaved = new Set(
		(existingInteractions ?? [])
			.filter((r) => r.action === "save")
			.map((r) => r.content_item_id),
	);
	const initialMatters = new Set(
		(existingInteractions ?? [])
			.filter((r) => r.action === "matters")
			.map((r) => r.content_item_id),
	);

	const { data: categories } = await supabase
		.from("content_categories")
		.select("id, label")
		.order("sort_order");

	// AI re-ranks the feed around the user's direction. Premium sees the full
	// personalized order + a reason on every card; free users get a one-pick
	// preview — their single best match with its reason, then the default order
	// — and an upgrade prompt to unlock the rest.
	const isPremium = user ? await getIsPremium(supabase, user.id) : false;
	let feedItems: (NonNullable<typeof items>[number] & {
		why?: string | null;
	})[] = items ?? [];
	let preview = false;
	if (user && feedItems.length > 0) {
		const res = await personalize(
			supabase,
			"feed",
			feedItems.map((i) => ({
				id: i.id,
				label: `${i.kind}: ${i.title}${i.eyebrow ? ` — ${i.eyebrow}` : ""}`,
			})),
		);
		if (res && res.order.length > 0) {
			if (isPremium) {
				feedItems = applyOrder(feedItems, res.order).map((i) => ({
					...i,
					why: res.whyById.get(i.id) ?? null,
				}));
			} else {
				const topId = res.order[0];
				const topWhy = res.whyById.get(topId) ?? null;
				const top = feedItems.find((i) => i.id === topId);
				if (top && topWhy) {
					feedItems = [
						{ ...top, why: topWhy },
						...feedItems
							.filter((i) => i.id !== topId)
							.map((i) => ({ ...i, why: null })),
					];
					preview = true;
				}
			}
		}
	}

	return (
		<ForYouFeed
			items={feedItems}
			categories={categories ?? []}
			initialSaved={[...initialSaved]}
			initialMatters={[...initialMatters]}
			preview={preview}
		/>
	);
}
