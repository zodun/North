// Mission-tab mock fixtures + in-memory stores (design-review bypass).
//
// Same contract as lib/dev-mock.ts (which stays untouched): when
// useAuthBypass() is on, the mission hooks serve this data instead of
// Supabase. Everything mutable lives in module-level stores so state
// survives remounts within a session; nothing here is reachable in a
// release build (the bypass flag is __DEV__-gated).
//
// The fixture cycle stays consistent with lib/dev-mock.ts — Zoe, ten days
// into "Ship the first portfolio case study", on a 6-day rhythm.

import type { StreakState } from "@north/native-ui";

import type {
	MissionStep,
	MonthlyMissionData,
	StepCadence,
} from "./use-monthly-mission";

// ── Date helpers ──────────────────────────────────────────────────────

/** AST calendar date for `daysAgo` days before today. */
export function astDateKey(daysAgo = 0): string {
	const astMs = Date.now() - 4 * 60 * 60 * 1000 - daysAgo * 86_400_000;
	return new Date(astMs).toISOString().slice(0, 10);
}

/** Monday-start week (7 AST date keys) containing today. */
export function currentWeekDays(): string[] {
	const today = new Date(`${astDateKey(0)}T12:00:00Z`);
	const dow = today.getUTCDay(); // 0=Sun
	const backToMonday = dow === 0 ? 6 : dow - 1;
	return Array.from({ length: 7 }, (_, i) => {
		const d = new Date(today);
		d.setUTCDate(today.getUTCDate() - backToMonday + i);
		return d.toISOString().slice(0, 10);
	});
}

// ── Streaks (chip + month calendar) ───────────────────────────────────

export const MOCK_RHYTHM_STREAK = 6;

// Repeating 14-day texture for older history: mostly showing up, the odd
// missed day, one deliberate rest day — believable, not perfect.
const OLDER_PATTERN: StreakState[] = [2, 1, 2, 0, 2, 2, 3, 1, 2, 2, 0, 1, 2, 2];

// Last 6 days are all directed/rest (the 6-day rhythm), ending today.
const RECENT_RUN: StreakState[] = [2, 2, 3, 2, 2, 2];

/** ~12 weeks of day→state history, newest = today. */
export function mockStreakDays(): Record<string, StreakState> {
	const days: Record<string, StreakState> = {};
	for (let ago = 0; ago < 84; ago++) {
		const state =
			ago < RECENT_RUN.length
				? RECENT_RUN[RECENT_RUN.length - 1 - ago]
				: OLDER_PATTERN[(ago - RECENT_RUN.length) % OLDER_PATTERN.length];
		days[astDateKey(ago)] = state ?? 0;
	}
	return days;
}

// ── Habits (in-memory store) ──────────────────────────────────────────

export type MockHabit = { id: string; name: string };

let habitStore: MockHabit[] | null = null;
let habitCheckStore: Set<string> | null = null; // "habitId:YYYY-MM-DD"

export function checkKey(habitId: string, day: string): string {
	return `${habitId}:${day}`;
}

function seedHabits() {
	habitStore = [
		{ id: "mock-habit-1", name: "Morning pages" },
		{ id: "mock-habit-2", name: "No phone first hour" },
		{ id: "mock-habit-3", name: "Evening sea walk" },
	];
	// A believable week: strong on the writing ritual, patchier on the rest.
	const week = currentWeekDays();
	const today = astDateKey(0);
	habitCheckStore = new Set();
	const seedPlan: Record<string, number[]> = {
		"mock-habit-1": [0, 1, 2, 3, 4, 5, 6],
		"mock-habit-2": [0, 2, 3],
		"mock-habit-3": [1, 4],
	};
	for (const [habitId, idxs] of Object.entries(seedPlan)) {
		for (const i of idxs) {
			const day = week[i];
			// Only seed days that have already happened.
			if (day && day <= today) habitCheckStore.add(checkKey(habitId, day));
		}
	}
}

export function getMockHabits(): MockHabit[] {
	if (!habitStore) seedHabits();
	return habitStore ?? [];
}

export function getMockHabitChecks(): Set<string> {
	if (!habitCheckStore) seedHabits();
	return new Set(habitCheckStore);
}

export function toggleMockHabitCheck(habitId: string, day: string) {
	if (!habitCheckStore) seedHabits();
	const key = checkKey(habitId, day);
	if (habitCheckStore?.has(key)) habitCheckStore.delete(key);
	else habitCheckStore?.add(key);
}

export function addMockHabit(name: string): MockHabit {
	if (!habitStore) seedHabits();
	const habit = { id: `local-habit-${Date.now()}`, name };
	habitStore?.push(habit);
	return habit;
}

// ── Monthly mission (in-memory cycle) ─────────────────────────────────
// A 28-day cycle anchored 9 days back, so review always opens mid-Week 2
// with Week 1 banked and today's step waiting. Toggles and goal re-plans
// mutate the store so the state survives remounts within a session.

export const MOCK_GOAL_SUGGESTION =
	"Publish one portfolio piece that shows what you can do.";

const MOCK_ANCHOR_DAYS_AGO = 9;

type MockPlan = {
	goalTitle: string;
	goalIntent: string | null;
	generatedBy: string;
	/** Milestone per week (4). */
	weeks: string[];
	/** The repeated daily action for each week (4). */
	dailies: string[];
};

const SEED_PLAN: MockPlan = {
	goalTitle: "Ship the first portfolio case study",
	goalIntent: "Turn last month's project into proof you can show.",
	generatedBy: "template",
	weeks: [
		"Outline the case study and gather material",
		"Draft the full story, problem to result",
		"Design the visuals and polish the page",
		"Publish it and share with five people",
	],
	dailies: [
		"Outline one section of the case study in five bullets.",
		"Draft one section of the case study, rough is fine.",
		"Pick or polish one visual that shows the result.",
		"Share the case study with one person and note what they said.",
	],
};

let missionStore: MonthlyMissionData | null = null;

function buildCycle(plan: MockPlan): MonthlyMissionData {
	const anchor = astDateKey(MOCK_ANCHOR_DAYS_AGO);
	const today = astDateKey(0);
	const steps: MissionStep[] = [];

	for (let w = 0; w < 4; w++) {
		steps.push({
			id: `mock-week-${w}`,
			cadence: "weekly" as StepCadence,
			week_index: w,
			due_date: null,
			title: plan.weeks[w],
			detail: `Your focus for week ${w + 1}.`,
			estimate_label: "This week",
			// Week 1 is banked; the rest are ahead.
			done: w === 0,
		});
	}
	for (let offset = 0; offset < 28; offset++) {
		const due = astDateKey(MOCK_ANCHOR_DAYS_AGO - offset);
		const w = Math.min(3, Math.floor(offset / 7));
		steps.push({
			id: `mock-day-${offset}`,
			cadence: "daily" as StepCadence,
			week_index: w,
			due_date: due,
			title: plan.dailies[w],
			detail: plan.weeks[w],
			estimate_label: "20 min",
			// Every day so far is done; today is the open step.
			done: due < today,
		});
	}

	return {
		mission: {
			id: "mock-monthly-mission-1",
			goal_title: plan.goalTitle,
			goal_intent: plan.goalIntent,
			focus_area_id: "craft",
			month_start: anchor,
			generated_by: plan.generatedBy,
		},
		steps,
		promptDismissed: plan.generatedBy !== "template",
	};
}

export function getMockMonthlyMission(): MonthlyMissionData {
	if (!missionStore) missionStore = buildCycle(SEED_PLAN);
	return missionStore;
}

export function setMockStepDone(stepId: string, done: boolean) {
	if (!missionStore) missionStore = buildCycle(SEED_PLAN);
	missionStore = {
		...missionStore,
		steps: missionStore.steps.map((s) =>
			s.id === stepId ? { ...s, done } : s,
		),
	};
}

/** "Set your goal" under bypass: re-plan the cycle around the user's goal. */
export function setMockMonthlyGoal(title: string, intent: string | null) {
	missionStore = buildCycle({
		goalTitle: title,
		goalIntent: intent,
		generatedBy: "manual",
		weeks: [
			"Map it out and take the first step",
			"Build the core of it",
			"Push through the messy middle",
			"Finish it and show someone",
		],
		dailies: [
			"Spend 20 minutes on the goal, start anywhere.",
			"Do the next small piece of the core work.",
			"Keep going: one rough piece today beats a perfect plan.",
			"Finish one loose end and show your progress to someone.",
		],
	});
}

// ── Check-in (in-memory store + canned coaching) ──────────────────────
// Keyed by the day's step id (one check-in per day).

export type MockCheckIn = {
	reply: "done" | "partly" | "stuck";
	note: string | null;
	response: string;
};

let checkInStore: Record<string, MockCheckIn> = {};

export function getMockCheckIn(stepId: string): MockCheckIn | null {
	return checkInStore[stepId] ?? null;
}

export function setMockCheckIn(stepId: string, checkIn: MockCheckIn) {
	checkInStore = { ...checkInStore, [stepId]: checkIn };
}

/** Canned-but-thoughtful coaching lines, keyed by quick reply. */
export const COACH_LINES: Record<MockCheckIn["reply"], string> = {
	done: "Banked. The case study is one section closer to real, and six days of rhythm says this is who you are now, not a good week. Same small step tomorrow.",
	partly:
		"Partly done still counts — the needle moved. Take the piece that's left and make it tomorrow's first ten minutes, before the day gets loud.",
	stuck:
		"Stuck isn't stopped. Shrink the step until it feels almost too easy — one bullet, one screenshot — and let the rhythm carry the rest. Tomorrow is a clean page.",
};

// ── Reflections (in-memory store) ─────────────────────────────────────
// Keyed by the day's step id (one reflection per day).

let reflectionStore: Record<string, string> = {};

export function getMockReflection(stepId: string): string | null {
	return reflectionStore[stepId] ?? null;
}

export function setMockReflection(stepId: string, body: string) {
	reflectionStore = { ...reflectionStore, [stepId]: body };
}
