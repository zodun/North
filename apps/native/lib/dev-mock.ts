// Dev-only mock fixtures (design review). When the auth bypass is on,
// the data hooks serve this instead of hitting Supabase, so every tab
// renders a plausible, interactive surface without an account. Guarded
// by __DEV__ through useAuthBypass — release builds can never see it.

import type { StreakState } from "@north/native-ui";

import type { MissionTask, TodayMission } from "./mission/use-today-mission";
import type { Person, PersonCheckIn, PersonGoal } from "./signal/use-people";
import type { SignalData } from "./signal/use-signal-data";

// ── Dates ─────────────────────────────────────────────────────────────

/** Upcoming Sunday, matching usePeople's week key. */
export function mockWeekEnding(): string {
	const d = new Date();
	const day = d.getDay();
	const diff = day === 0 ? 0 : 7 - day;
	d.setDate(d.getDate() + diff);
	return d.toISOString().slice(0, 10);
}

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function dayLabels(count: number): string[] {
	const end = new Date();
	return Array.from({ length: count }, (_, i) => {
		const d = new Date(end);
		d.setDate(end.getDate() - (count - 1 - i));
		return DAY_LETTERS[d.getDay()] ?? "?";
	});
}

// ── Signal ────────────────────────────────────────────────────────────

export function mockSignalData(): SignalData {
	return {
		weekEnding: mockWeekEnding(),
		band: "Finding",
		score: 68,
		provisional: false,
		trend: "climbing",
		inputs: {
			activeDays: 5,
			assignedTasks: 8,
			completedTasks: 6,
			meaningfulTotal: 12,
			meaningfulInFocus: 9,
		},
		summary:
			"A steady week. You showed up five days, finished most of what you set out to do, and the bulk of your activity stayed inside your focus areas. The dip midweek came from two skipped tasks — nothing a smaller step can't fix.",
		callouts: [
			{
				label: "Signal",
				body: "Your morning study blocks landed four days in a row — that rhythm is doing most of the work behind this week's climb.",
			},
			{
				label: "Noise",
				body: "Late-night scrolling pushed two mornings off course. The pattern shows up right before your skipped tasks.",
			},
		],
		ratings: {},
		recentBands: [
			"Drifting",
			"Drifting",
			"Finding",
			"Finding",
			"Finding",
			"Finding",
		],
		recentScores: [42, 47, 55, 52, 61, 68],
		lastReflection: {
			id: "mock-reflection-1",
			body: "This week I finally kept the morning routine. I want to carry the momentum into the portfolio project and stop letting the phone decide my mornings.",
			analysis: {
				themes: ["morning routine", "consistency", "portfolio"],
				alignment: "aligned",
				nudge:
					"Protect the first hour of the day — it's where your week is won.",
			},
		},
	};
}

// ── Mission ───────────────────────────────────────────────────────────

export function mockMission(): TodayMission {
	return {
		id: "mock-mission-1",
		title: "Ship the first portfolio case study",
		intent: "Turn last month's project into proof you can show.",
		tasks: [
			{
				id: "mock-task-1",
				label: "Outline the case study in 5 bullet points",
				kind: "deep",
				estimate_label: "20 min",
				done: true,
				abandon_count: 0,
			},
			{
				id: "mock-task-2",
				label: "Draft the problem section",
				kind: "deep",
				estimate_label: "25 min",
				done: false,
				abandon_count: 0,
			},
			{
				id: "mock-task-3",
				label: "Pick 3 screenshots that show the result",
				kind: "light",
				estimate_label: "10 min",
				done: false,
				abandon_count: 0,
			},
		] satisfies MissionTask[],
	};
}

// ── People / Community ────────────────────────────────────────────────

export const MOCK_PEOPLE: Person[] = [
	{ id: "mock-person-1", name: "Renae" },
	{ id: "mock-person-2", name: "Jordan" },
	{ id: "mock-person-3", name: "Shanice" },
];

export function mockPersonGoals(): PersonGoal[] {
	const month = new Date();
	month.setDate(1);
	const monthKey = month.toISOString().slice(0, 10);
	return [
		{
			id: "mock-goal-1",
			person_id: "mock-person-1",
			month: monthKey,
			goal: "Finish the CXC prep module",
		},
		{
			id: "mock-goal-2",
			person_id: "mock-person-2",
			month: monthKey,
			goal: "Apply to 3 internships",
		},
	];
}

export function mockPersonCheckIns(): PersonCheckIn[] {
	return [
		{
			id: "mock-checkin-1",
			person_id: "mock-person-1",
			week_ending: mockWeekEnding(),
			signal: "Studied together twice this week",
			noise: null,
		},
	];
}

// ── Profile ───────────────────────────────────────────────────────────

export function mockProfileData() {
	// 4 weeks: a believable mix of directed (2), active (1), rest (3), miss (0),
	// ending on a 6-day rhythm run.
	const streaks28 = [
		0, 1, 2, 1, 0, 3, 2, 1, 2, 2, 0, 1, 3, 2, 2, 1, 2, 0, 2, 3, 1, 2, 2, 3, 2,
		2, 1, 2,
	] as StreakState[];
	return {
		displayName: "Zoe",
		focusAreas: [
			{ id: "career", label: "Career growth", hue: "#7ec4bb" },
			{ id: "skills", label: "New skills", hue: "#d4a574" },
		],
		streaks28,
		dayLabels28: dayLabels(28),
		dayLabels7: dayLabels(7),
		rhythmStreak: 6,
		directedDaysThisWeek: 4,
		tasksCompletedThisWeek: 6,
		totalTasksThisWeek: 8,
		signalBand: "Finding" as const,
		signalTrend: "climbing" as const,
		savedCount: 3,
		savedOpportunities: [
			{ id: "mock-opp-1", title: "UX Design Internship", org: "NCB" },
			{ id: "mock-opp-2", title: "Digital Skills Scholarship", org: "HEART" },
			{
				id: "mock-opp-3",
				title: "Startup Accelerator Cohort 4",
				org: "Branson Centre",
			},
		],
	};
}

export const MOCK_FIRST_NAME = "Zoe";

// ── Community discussion ──────────────────────────────────────────────

export type MockDiscussionPost = {
	id: string;
	author: string;
	authorGoal: string | null;
	caption: string;
	hoursAgo: number;
};

export const MOCK_DISCUSSION: MockDiscussionPost[] = [
	{
		id: "mock-post-1",
		author: "Jordan",
		authorGoal: "Apply to 3 internships",
		caption:
			"Sent my second application today — the NCB one. Anyone willing to look over a CV?",
		hoursAgo: 2,
	},
	{
		id: "mock-post-2",
		author: "Renae",
		authorGoal: "Finish the CXC prep module",
		caption: "Past papers every morning this week. Two topics left.",
		hoursAgo: 5,
	},
	{
		id: "mock-post-3",
		author: "Shanice",
		authorGoal: null,
		caption:
			"Anyone else doing the HEART digital skills course? Looking for a study partner.",
		hoursAgo: 9,
	},
	{
		id: "mock-post-4",
		author: "Zoe",
		authorGoal: "Ship the first portfolio case study",
		caption: "Outlined my case study this morning. One small step.",
		hoursAgo: 26,
	},
];
