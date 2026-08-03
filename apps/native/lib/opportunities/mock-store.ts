// In-memory opportunity state for the dev auth bypass.
//
// Same useSyncExternalStore pattern as lib/dev-bypass.ts: module-level
// state, a subscriber set, and immutable snapshots so React can bail
// out on referential equality. Seeded with three tracked items in
// different pipeline stages so the Tracker view reads as real.

import { useSyncExternalStore } from "react";

import type { ApplicationStatus, SavedState } from "./types";

type MockApplication = { status: ApplicationStatus; reminderId: string | null };

export type MockOpportunityState = {
	saved: Record<string, SavedState>;
	applications: Record<string, MockApplication>;
};

let state: MockOpportunityState = {
	saved: {
		"mock-uwi-scholarship": { saved: true, applied: false },
		"mock-ncb-grad": { saved: true, applied: true },
		"mock-branson-accel": { saved: true, applied: true },
	},
	applications: {
		"mock-uwi-scholarship": { status: "saved", reminderId: null },
		"mock-ncb-grad": { status: "applied", reminderId: null },
		"mock-branson-accel": { status: "interview", reminderId: null },
	},
};

const subscribers = new Set<() => void>();

function emit() {
	for (const notify of subscribers) notify();
}

export function useMockOpportunityState(): MockOpportunityState {
	return useSyncExternalStore(
		(cb) => {
			subscribers.add(cb);
			return () => subscribers.delete(cb);
		},
		() => state,
		() => state,
	);
}

export function mockToggleSave(opportunityId: string) {
	const isSaved = state.saved[opportunityId]?.saved ?? false;
	const saved = { ...state.saved };
	const applications = { ...state.applications };
	if (isSaved) {
		delete saved[opportunityId];
		delete applications[opportunityId];
	} else {
		saved[opportunityId] = { saved: true, applied: false };
		applications[opportunityId] = { status: "saved", reminderId: null };
	}
	state = { saved, applications };
	emit();
}

export function mockMarkApplied(opportunityId: string) {
	const current = state.applications[opportunityId];
	// Never downgrade a row that already moved past "applied".
	const status: ApplicationStatus =
		current && current.status !== "saved" ? current.status : "applied";
	state = {
		saved: {
			...state.saved,
			[opportunityId]: { saved: true, applied: true },
		},
		applications: {
			...state.applications,
			[opportunityId]: { status, reminderId: current?.reminderId ?? null },
		},
	};
	emit();
}

export function mockSetStatus(
	opportunityId: string,
	status: ApplicationStatus,
) {
	const current = state.applications[opportunityId];
	state = {
		saved: {
			...state.saved,
			[opportunityId]: { saved: true, applied: status !== "saved" },
		},
		applications: {
			...state.applications,
			[opportunityId]: { status, reminderId: current?.reminderId ?? null },
		},
	};
	emit();
}

export function mockSetReminder(
	opportunityId: string,
	reminderId: string | null,
) {
	const current = state.applications[opportunityId];
	state = {
		...state,
		applications: {
			...state.applications,
			[opportunityId]: { status: current?.status ?? "saved", reminderId },
		},
	};
	emit();
}
