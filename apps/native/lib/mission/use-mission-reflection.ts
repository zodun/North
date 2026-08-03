// One-line reflection captured when today's step completes.
//
// Real mode: `mission_reflections` table, keyed by the day's daily step
// (monthly_mission_steps.id — one reflection per day, upsert).
// Bypass: in-memory store from fixtures.

import { useCallback, useEffect, useState } from "react";

import { supabase, useSession } from "../auth-client";
import { useAuthBypass } from "../dev-bypass";
import { getMockReflection, setMockReflection } from "./fixtures";

export function useMissionReflection(missionId: string | null) {
	const { data: session } = useSession();
	const bypass = useAuthBypass();
	const [saved, setSaved] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		let cancelled = false;
		async function load() {
			if (!missionId) return;
			if (bypass) {
				setSaved(getMockReflection(missionId));
				return;
			}
			if (!session) return;
			const { data, error } = await supabase
				.from("mission_reflections")
				.select("body")
				.eq("mission_id", missionId)
				.eq("user_id", session.user.id)
				.maybeSingle();
			if (!cancelled && !error && data) setSaved(data.body);
		}
		void load();
		return () => {
			cancelled = true;
		};
	}, [missionId, session, bypass]);

	const save = useCallback(
		async (body: string): Promise<boolean> => {
			const trimmed = body.trim();
			if (!missionId || !trimmed || saving) return false;
			setSaving(true);
			try {
				if (bypass) {
					setMockReflection(missionId, trimmed);
					setSaved(trimmed);
					return true;
				}
				if (!session) return false;
				const { error } = await supabase.from("mission_reflections").upsert(
					{
						user_id: session.user.id,
						mission_id: missionId,
						body: trimmed,
					},
					{ onConflict: "user_id,mission_id" },
				);
				if (error) return false;
				setSaved(trimmed);
				return true;
			} finally {
				setSaving(false);
			}
		},
		[missionId, session, bypass, saving],
	);

	return { saved, saving, save };
}
