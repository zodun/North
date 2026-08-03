import { useCallback, useEffect, useState } from "react";

import { supabase, useSession } from "../auth-client";
import { useAuthBypass } from "../dev-bypass";
import {
	mockMarkApplied,
	mockToggleSave,
	useMockOpportunityState,
} from "./mock-store";
import type { SavedState } from "./types";

type SavedMap = Record<string, SavedState>;

export function useOpportunityInteractions() {
	const bypass = useAuthBypass();
	const { data: session } = useSession();
	const mock = useMockOpportunityState();
	const [saved, setSaved] = useState<SavedMap>({});

	// Load all saved rows for the current user on mount.
	useEffect(() => {
		if (bypass || !session) return;
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
	}, [bypass, session]);

	const toggleSave = useCallback(
		async (opportunityId: string) => {
			if (bypass) {
				mockToggleSave(opportunityId);
				return;
			}
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
		[bypass, session, saved],
	);

	const markApplied = useCallback(
		async (opportunityId: string) => {
			if (bypass) {
				mockMarkApplied(opportunityId);
				return;
			}
			if (!session) return;
			// Optimistic.
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
		},
		[bypass, session],
	);

	return { saved: bypass ? mock.saved : saved, toggleSave, markApplied };
}
