// Source of truth for onboarding copy + ordering (FR-ONB-01).
// Ported from the web prototype at
// apps/web/src/app/north/_lib/data.ts:222-297; surface wording stays
// in lockstep so the two clients agree on what the user sees.

export type OnboardingQId =
	| "name"
	| "season"
	| "focus"
	| "career"
	| "location"
	| "time"
	| "avoid"
	| "purpose"
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
		prompt: "What matters right now?",
		sub: "Pick up to three. North points itself at these.",
		max: FOCUS_AREAS_MAX,
	},
	{
		id: "career",
		prompt: "Where are you in your career?",
		sub: "This filters what’s actually open to you.",
	},
	{
		id: "location",
		prompt: "Where are you based?",
		sub: "So everything you see is open to you.",
	},
	{
		id: "time",
		prompt: "How much time on a real day?",
		sub: "Be honest. North works with what you have.",
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
		id: "purpose",
		prompt: "Do you already know your purpose?",
		sub: "No wrong answer.",
	},
	{
		id: "baseline",
		prompt:
			"In a typical week, how much of your time goes toward what matters to you?",
		sub: "Baseline. We’ll ask again in four weeks.",
	},
	{
		id: "consent",
		prompt: "One last thing.",
		sub: "North learns from what you do. You can see, export, or delete this any time.",
	},
];

export type PurposeOption = {
	id: string;
	title: string;
	creed: string;
	sealed: string;
	color: string;
};

export const PURPOSE_OPTIONS: PurposeOption[] = [
	{
		id: "builder",
		title: "Builder",
		creed: "I know what I'm working toward. I'm here to make it real.",
		sealed: "You're a Builder. North will move with you toward it.",
		color: "#F0B429",
	},
	{
		id: "explorer",
		title: "Explorer",
		creed: "I'm still finding my direction. I'm here to discover it.",
		sealed: "You're an Explorer. North will help you find the way.",
		color: "#16A085",
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

// PRIV-01: Consent bullets — what's captured and why (plain language, FR-PRIV-01).
// Updated to match the SIGCAP event schema (view, dwell, save, matters, pass,
// share, long_dwell) so the disclosure is complete and specific.
export const CONSENT_BULLETS = [
	"We record what you view and how long you dwell. This is the raw material for your Signal score.",
	"Saves, likes, shares, and skips are captured too. They shape your feed and daily missions.",
	"This data is used only to personalise North for you. It is never sold or used for advertising.",
	"You can export or delete your full behavioural log from your Profile at any time.",
];

// PRIV-02: Small-print disclosure required by the Jamaica Data Protection Act 2020.
// Covers: data controller identity, third-party processor, retention period,
// withdrawal mechanism, and governing legislation.
export const CONSENT_DISCLOSURE =
	"Data controller: North. Analytics processed by PostHog under a data-processing agreement. " +
	"Retained for up to 12 months or until you delete your account. " +
	"To withdraw consent, delete your account. This erases all behavioural data. " +
	"Governed by the Jamaica Data Protection Act 2020.";

export const TOTAL_QUESTIONS = ONBOARDING_QUESTIONS.length;
