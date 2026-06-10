import type { Metadata } from "next";
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

	return (
		<ForYouFeed
			items={items ?? []}
			initialSaved={[...initialSaved]}
			initialMatters={[...initialMatters]}
		/>
	);
}
