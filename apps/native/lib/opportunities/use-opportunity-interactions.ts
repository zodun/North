import { useCallback, useEffect, useState } from "react";

import { supabase, useSession } from "../auth-client";
import type { SavedState } from "./types";

type SavedMap = Record<string, SavedState>;

export function useOpportunityInteractions() {
	const { data: session } = useSession();
	const [saved, setSaved] = useState<SavedMap>({});

	// Load all saved rows for the current user on mount.
	useEffect(() => {
		if (!session) return;
		void (async () => {
			const { data } = await supabase
				.from("user_saved_opportunities")
				.select("opportunity_id, applied")
				.eq("user_id", session.user.id);
			if (data) {
				const map: SavedMap = {};
				for (const row of data) {
					map[row.opportunity_id] = { saved: true, applied: row.applied };
				}
				setSaved(map);
			}
		})();
	}, [session]);

	const toggleSave = useCallback(
		async (opportunityId: string) => {
			if (!session) return;
			const current = saved[opportunityId];
			const isSaved = current?.saved ?? false;

			// Optimistic update.
			setSaved((prev) => {
				if (isSaved) {
					const next = { ...prev };
					delete next[opportunityId];
					return next;
				}
				return {
					...prev,
					[opportunityId]: { saved: true, applied: false },
				};
			});

			if (isSaved) {
				await supabase
					.from("user_saved_opportunities")
					.delete()
					.eq("user_id", session.user.id)
					.eq("opportunity_id", opportunityId);
			} else {
				await supabase.from("user_saved_opportunities").upsert(
					{
						user_id: session.user.id,
						opportunity_id: opportunityId,
						applied: false,
					},
					{ onConflict: "user_id,opportunity_id" },
				);
			}
		},
		[session, saved],
	);

	// Applying and opening the listing are separate actions (mirrors web's
	// openLink/toggleApplied split): opening never touches this state, and
	// "applied" is a reversible toggle, not a one-way mark.
	const toggleApplied = useCallback(
		async (opportunityId: string) => {
			if (!session) return;
			const isApplied = saved[opportunityId]?.applied ?? false;

			if (isApplied) {
				setSaved((prev) => ({
					...prev,
					[opportunityId]: { saved: true, applied: false },
				}));
				await supabase.from("user_saved_opportunities").upsert(
					{
						user_id: session.user.id,
						opportunity_id: opportunityId,
						applied: false,
					},
					{ onConflict: "user_id,opportunity_id" },
				);
			} else {
				setSaved((prev) => ({
					...prev,
					[opportunityId]: { saved: true, applied: true },
				}));
				await supabase.from("user_saved_opportunities").upsert(
					{
						user_id: session.user.id,
						opportunity_id: opportunityId,
						applied: true,
						applied_at: new Date().toISOString(),
					},
					{ onConflict: "user_id,opportunity_id" },
				);
			}
		},
		[session, saved],
	);

	return { saved, toggleSave, toggleApplied };
}
