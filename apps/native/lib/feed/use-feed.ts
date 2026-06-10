import { useCallback, useEffect, useState } from "react";

import { supabase } from "../auth-client";
import type { FeedItem } from "./types";

// Fetches all cleared+published content_items ordered by sort_order (FEED-05).
// RLS ensures only license_status='cleared' rows are returned.
// Category filtering is client-side — 60 items is well within that budget for M1.
export function useFeed(categoryFilter: string | null) {
	const [allItems, setAllItems] = useState<FeedItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		let cancelled = false;
		setLoading(true);

		const [curatedResult, communityResult] = await Promise.all([
			supabase
				.from("content_items")
				.select(
					"id, kind, title, eyebrow, body, source, attribution_text, external_url, cloudinary_public_id, thumbnail_url, content_category_id, published_at, sort_order",
				)
				.order("sort_order", { ascending: true })
				.order("published_at", { ascending: false }),
			supabase
				.from("community_posts")
				.select("id, caption, video_url, thumbnail_url, created_at")
				.not("video_url", "is", null)
				.order("created_at", { ascending: false })
				.limit(50),
		]);

		if (cancelled) return;

		if (curatedResult.error) {
			setError(curatedResult.error.message);
			setLoading(false);
			return;
		}

		const curated = (curatedResult.data ?? []) as FeedItem[];

		const community: FeedItem[] = (communityResult.data ?? []).map((p) => ({
			id: p.id,
			kind: "video" as const,
			title: p.caption ?? "Community video",
			eyebrow: "COMMUNITY",
			body: null,
			source: null,
			attribution_text: null,
			external_url: p.video_url,
			cloudinary_public_id: null,
			thumbnail_url: p.thumbnail_url ?? null,
			content_category_id: null,
			published_at: p.created_at,
			sort_order: 0,
		}));

		// Interleave: show a community video every 3 curated items.
		const merged: FeedItem[] = [];
		let ci = 0;
		for (let i = 0; i < curated.length; i++) {
			merged.push(curated[i]);
			if ((i + 1) % 3 === 0 && ci < community.length) {
				merged.push(community[ci++]);
			}
		}
		while (ci < community.length) merged.push(community[ci++]);

		setAllItems(merged);
		setLoading(false);

		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	const items = categoryFilter
		? allItems.filter((it) => it.content_category_id === categoryFilter)
		: allItems;

	return { items, loading, error, refresh: load };
}
