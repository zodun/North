// Application tracker state (OPP roadmap: Application tracker).
//
// Real mode: rows live in public.opportunity_applications (migration
// 20260731T*_opportunity_tracker.sql), merged with legacy
// user_saved_opportunities rows so anything saved/applied before the
// tracker existed still shows up (as "saved"/"applied").
// Bypass mode: rows derive from the in-memory mock store, which is
// seeded with three tracked items.
//
// Deadline reminders are scheduled locally in BOTH modes (they are
// device-local); only the persistence of the reminder id differs.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { supabase, useSession } from "../auth-client";
import { useAuthBypass } from "../dev-bypass";
import { MOCK_OPPORTUNITIES } from "./fixtures";
import {
	mockSetReminder,
	mockSetStatus,
	useMockOpportunityState,
} from "./mock-store";
import { cancelDeadlineReminder, scheduleDeadlineReminder } from "./reminders";
import type {
	ApplicationStatus,
	Opportunity,
	TrackedApplication,
} from "./types";

const OPP_COLUMNS =
	"id, title, org, category_id, opportunity_type, location, deadline, why, external_url, published_at";

export function useApplicationTracker() {
	const bypass = useAuthBypass();
	const { data: session } = useSession();
	const mock = useMockOpportunityState();
	const [realRows, setRealRows] = useState<TrackedApplication[]>([]);
	const [loading, setLoading] = useState(false);

	const refresh = useCallback(async () => {
		if (bypass || !session) return;
		setLoading(true);
		const [appsRes, savedRes] = await Promise.all([
			supabase
				.from("opportunity_applications")
				.select("opportunity_id, status, reminder_id")
				.eq("user_id", session.user.id),
			supabase
				.from("user_saved_opportunities")
				.select("opportunity_id, applied")
				.eq("user_id", session.user.id),
		]);

		const map = new Map<
			string,
			{ status: ApplicationStatus; reminderId: string | null }
		>();
		// Legacy saved/applied rows first; explicit tracker rows override.
		for (const row of savedRes.data ?? []) {
			map.set(row.opportunity_id, {
				status: row.applied ? "applied" : "saved",
				reminderId: null,
			});
		}
		// opportunity_applications may not exist yet (migration pending) —
		// degrade to the legacy rows alone.
		if (!appsRes.error) {
			for (const row of appsRes.data ?? []) {
				map.set(row.opportunity_id, {
					status: row.status as ApplicationStatus,
					reminderId: row.reminder_id ?? null,
				});
			}
		}

		const ids = [...map.keys()];
		let opps: Opportunity[] = [];
		if (ids.length > 0) {
			const { data } = await supabase
				.from("opportunities")
				.select(OPP_COLUMNS)
				.in("id", ids);
			opps = (data ?? []) as Opportunity[];
		}

		const rows: TrackedApplication[] = [];
		for (const opp of opps) {
			const entry = map.get(opp.id);
			if (entry) {
				rows.push({
					opportunity: opp,
					status: entry.status,
					reminderId: entry.reminderId,
				});
			}
		}
		setRealRows(rows);
		setLoading(false);
	}, [bypass, session]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	const mockRows = useMemo(() => {
		const rows: TrackedApplication[] = [];
		for (const [id, app] of Object.entries(mock.applications)) {
			const opp = MOCK_OPPORTUNITIES.find((o) => o.id === id);
			if (opp) {
				rows.push({
					opportunity: opp,
					status: app.status,
					reminderId: app.reminderId,
				});
			}
		}
		return rows;
	}, [mock]);

	const rows = bypass ? mockRows : realRows;
	const rowsRef = useRef(rows);
	rowsRef.current = rows;

	const setStatus = useCallback(
		async (opportunityId: string, status: ApplicationStatus) => {
			if (bypass) {
				mockSetStatus(opportunityId, status);
				return;
			}
			if (!session) return;
			// Optimistic.
			setRealRows((prev) =>
				prev.map((r) =>
					r.opportunity.id === opportunityId ? { ...r, status } : r,
				),
			);
			await supabase.from("opportunity_applications").upsert(
				{
					user_id: session.user.id,
					opportunity_id: opportunityId,
					status,
					updated_at: new Date().toISOString(),
				},
				{ onConflict: "user_id,opportunity_id" },
			);
		},
		[bypass, session],
	);

	const persistReminder = useCallback(
		async (opportunityId: string, reminderId: string | null) => {
			if (bypass) {
				mockSetReminder(opportunityId, reminderId);
				return;
			}
			if (!session) return;
			const current = rowsRef.current.find(
				(r) => r.opportunity.id === opportunityId,
			);
			setRealRows((prev) =>
				prev.map((r) =>
					r.opportunity.id === opportunityId ? { ...r, reminderId } : r,
				),
			);
			await supabase.from("opportunity_applications").upsert(
				{
					user_id: session.user.id,
					opportunity_id: opportunityId,
					status: current?.status ?? "saved",
					reminder_id: reminderId,
					updated_at: new Date().toISOString(),
				},
				{ onConflict: "user_id,opportunity_id" },
			);
		},
		[bypass, session],
	);

	/**
	 * Toggle the 3-days-before reminder for an opportunity.
	 * Returns a quiet hint string when nothing could be scheduled,
	 * null on success (either direction).
	 */
	const toggleReminder = useCallback(
		async (opp: Opportunity): Promise<string | null> => {
			const existing =
				rowsRef.current.find((r) => r.opportunity.id === opp.id)?.reminderId ??
				null;
			if (existing) {
				await cancelDeadlineReminder(existing);
				await persistReminder(opp.id, null);
				return null;
			}
			const result = await scheduleDeadlineReminder(opp);
			if (result.id === null) return result.hint;
			await persistReminder(opp.id, result.id);
			return null;
		},
		[persistReminder],
	);

	/** opportunity_id → active reminder notification id. */
	const reminders = useMemo(() => {
		const map: Record<string, string | null> = {};
		for (const r of rows) map[r.opportunity.id] = r.reminderId;
		return map;
	}, [rows]);

	return { rows, loading, refresh, setStatus, toggleReminder, reminders };
}
