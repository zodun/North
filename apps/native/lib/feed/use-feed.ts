import { useEffect, useState } from "react";

import { supabase } from "../auth-client";
import type { FeedItem } from "./types";

// Fetches all cleared+published content_items ordered by sort_order (FEED-05).
// RLS ensures only license_status='cleared' rows are returned.
// Category filtering is client-side — 60 items is well within that budget for M1.
export function useFeed(categoryFilter: string | null) {
	const [allItems, setAllItems] = useState<FeedItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		supabase
			.from("content_items")
			.select(
				"id, kind, title, eyebrow, body, source, attribution_text, external_url, cloudinary_public_id, content_category_id, published_at, sort_order",
			)
			.order("sort_order", { ascending: true })
			.order("published_at", { ascending: false })
			.then(({ data, error: err }) => {
				if (cancelled) return;
				if (err) {
					setError(err.message);
				} else {
					setAllItems((data ?? []) as FeedItem[]);
				}
				setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const items = categoryFilter
		? allItems.filter((it) => it.content_category_id === categoryFilter)
		: allItems;

	return { items, loading, error };
}
