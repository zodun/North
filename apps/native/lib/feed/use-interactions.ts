import { usePostHog } from "posthog-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase, useSession } from "../auth-client";
import type { FeedAction, FeedItem } from "./types";

// SIGCAP-02 / SIGCAP-03: Behavioural capture wrapper.
//
// Loads the authenticated user's existing save/matters actions for the
// current feed batch, and exposes a `record` function that:
//   - Optimistically updates local toggle state (save, matters).
//   - Appends to content_interactions via RLS (insert-only per 0017 policy).
//   - Mirrors the event to PostHog for analytics (SIGCAP-03); fire-and-forget.
//
// Content context (content_category_id, kind) is captured automatically from
// the items array so the signal score rollup (SIG-01) can aggregate by
// category without joining back to content_items.
//
// For M1: save and matters are additive (no un-save). pass/long_dwell are
// written from the for-you screen's dwell tracker; share is written on Share.
export function useInteractions(items: FeedItem[]) {
	const { data: session } = useSession();
	const posthog = usePostHog();
	const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
	const [mattersIds, setMattersIds] = useState<Set<string>>(new Set());

	// Stable lookup so record() can always resolve item context by id.
	const itemsById = useMemo(
		() => new Map(items.map((it) => [it.id, it])),
		[items],
	);

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

			const item = itemsById.get(itemId);
			const content_category_id = item?.content_category_id ?? null;
			const kind = item?.kind ?? null;

			// Optimistic local state for the two toggleable actions.
			if (action === "save") {
				setSavedIds((prev) => new Set([...prev, itemId]));
			} else if (action === "matters") {
				setMattersIds((prev) => new Set([...prev, itemId]));
			}

			// Append-only write; RLS blocks update/delete (0017_signal_cap_context.sql).
			await supabase.from("content_interactions").insert({
				user_id: session.user.id,
				content_item_id: itemId,
				action,
				dwell_ms: dwellMs ?? null,
				content_category_id,
				kind,
			});

			// Mirror to PostHog — best-effort; never blocks the UI.
			posthog?.capture("content_interaction", {
				action,
				content_item_id: itemId,
				content_category_id,
				kind,
				dwell_ms: dwellMs ?? null,
			});
		},
		[session, itemsById, posthog],
	);

	return {
		isSaved: (id: string) => savedIds.has(id),
		isMatters: (id: string) => mattersIds.has(id),
		record,
	};
}
