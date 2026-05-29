// Source of truth for onboarding copy + ordering (FR-ONB-01).
// Ported from the web prototype at
// apps/web/src/app/north/_lib/data.ts:222-297; surface wording stays
// in lockstep so the two clients agree on what the user sees.

export type OnboardingQId =
	| "name"
	| "season"
	| "focus"
	| "time"
	| "avoid"
	| "baseline"
	| "consent";

export type FocusArea = { id: string; label: string; hue: string };

// Mirrors apps/web/src/app/north/_lib/data.ts FOCUS_AREAS; must match
// the rows seeded in supabase/migrations/0014_seed_focus_areas.sql.
export const FOCUS_AREAS: FocusArea[] = [
	{ id: "craft", label: "Craft & Mastery", hue: "#7ec4bb" },
	{ id: "venture", label: "Building a venture", hue: "#d4a574" },
	{ id: "mind", label: "Mind & body", hue: "#9aaee0" },
	{ id: "people", label: "People & community", hue: "#c97a5a" },
	{ id: "money", label: "Money & freedom", hue: "#a8b97a" },
	{ id: "learn", label: "Deeper learning", hue: "#b39ad8" },
];

export const FOCUS_AREAS_MAX = 3;

export type OnboardingQuestion = {
	id: OnboardingQId;
	prompt: string;
	sub: string;
	placeholder?: string;
	options?: string[];
	max?: number;
	optional?: boolean;
};

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
	{
		id: "name",
		prompt: "What should we call you?",
		sub: "Used only inside the app. Change it any time.",
		placeholder: "Your first name",
	},
	{
		id: "season",
		prompt: "Which feels closer to where you are right now?",
		sub: "There is no right answer. We use this once, then never again.",
		options: [
			"I know what I want and I’m moving on it.",
			"I know what I want but I’m stuck.",
			"I’m between things and figuring it out.",
			"I’m doing fine but I’ve drifted.",
		],
	},
	{
		id: "focus",
		prompt: "Pick up to three focus areas.",
		sub: "These shape your feed, your missions, and the opportunities you see.",
		max: FOCUS_AREAS_MAX,
	},
	{
		id: "time",
		prompt: "How much time can you give this on a real day?",
		sub: "Be honest. We tune your missions to fit.",
		options: ["10 minutes", "30 minutes", "1 hour", "Whatever the day allows"],
	},
	{
		id: "avoid",
		prompt: "Is there something you keep starting and not finishing?",
		sub: "No judgement. We use this to make missions that respect it, not push past it.",
		placeholder: "Optional, but useful",
		optional: true,
	},
	{
		id: "baseline",
		prompt:
			"In a typical week, how much of your time goes toward what matters to you?",
		sub: "Baseline — we’ll ask again in four weeks.",
	},
	{
		id: "consent",
		prompt: "One last thing.",
		sub: "North learns from what you do. You can see, export, or delete this any time.",
	},
];

// 5-point Layer 1 pulse scale labels. Stored as 1..5 in
// baseline_endpoint_responses; weekly_pulses stores (value - 1) to
// fit the existing 0..4 CHECK constraint.
export const BASELINE_SCALE_LABELS = [
	"Not at all",
	"A little",
	"Somewhat",
	"Mostly",
	"Fully",
];

// Consent bullets shown on the final screen (verbatim from the web prototype).
export const CONSENT_BULLETS = [
	"We store what you read, save, finish, and skip.",
	"We never sell it. We never use it for ads.",
	"You can wipe everything in two taps.",
];

export const TOTAL_QUESTIONS = ONBOARDING_QUESTIONS.length;
