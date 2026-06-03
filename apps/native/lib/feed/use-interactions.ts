import { useCallback, useEffect, useState } from "react";

import { supabase, useSession } from "../auth-client";
import type { FeedAction, FeedItem } from "./types";

// Loads the authenticated user's existing save/matters actions for the
// current feed batch, and exposes a `record` function that optimistically
// updates local state and writes to content_interactions via RLS.
//
// For M1, save and matters are additive (no un-save). Pass/long_dwell are
// written from the for-you screen's dwell tracker; share is written on Share.
export function useInteractions(items: FeedItem[]) {
	const { data: session } = useSession();
	const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
	const [mattersIds, setMattersIds] = useState<Set<string>>(new Set());

	// Load existing interactions once items are available and user is authenticated.
	useEffect(() => {
		if (!session || items.length === 0) return;
		let cancelled = false;
		supabase
			.from("content_interactions")
			.select("content_item_id, action")
			.eq("user_id", session.user.id)
			.in(
				"content_item_id",
				items.map((i) => i.id),
			)
			.in("action", ["save", "matters"])
			.then(({ data }) => {
				if (cancelled || !data) return;
				setSavedIds(
					new Set(
						data
							.filter((r) => r.action === "save")
							.map((r) => r.content_item_id),
					),
				);
				setMattersIds(
					new Set(
						data
							.filter((r) => r.action === "matters")
							.map((r) => r.content_item_id),
					),
				);
			});
		return () => {
			cancelled = true;
		};
		// Stable dep: re-run when session or item count changes (new page load).
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [session?.user.id, items.length]);

	const record = useCallback(
		async (itemId: string, action: FeedAction, dwellMs?: number) => {
			if (!session) return;
			// Optimistic local state for the two toggleable actions.
			if (action === "save") {
				setSavedIds((prev) => new Set([...prev, itemId]));
			} else if (action === "matters") {
				setMattersIds((prev) => new Set([...prev, itemId]));
			}
			await supabase.from("content_interactions").insert({
				user_id: session.user.id,
				content_item_id: itemId,
				action,
				dwell_ms: dwellMs ?? null,
			});
		},
		[session],
	);

	return {
		isSaved: (id: string) => savedIds.has(id),
		isMatters: (id: string) => mattersIds.has(id),
		record,
	};
}
