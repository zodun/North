// Versioned prompt for the plan-month Edge Function (MONTH-02).
// Turns a user's self-written monthly goal into a concrete 4-week plan:
// one milestone per week + one simple daily action for that week.
// Bump PROMPT_VERSION when changing wording.

export const PROMPT_VERSION = "v0.2";
// Anthropic's cheap/fast tier — ideal for short structured JSON generation.
export const MODEL_NAME = "claude-haiku-4-5";

export type PlanPayload = {
	goal_title: string;
	goal_intent: string;
	focus_areas: string[];
};

export type PlanWeek = {
	// What to reach by the end of the week (3–7 words).
	milestone: string;
	// One plain, concrete thing to do on a given day that week (one sentence).
	daily_action: string;
};

export type PlanResult = {
	weeks: PlanWeek[]; // exactly 4, week 1 → week 4
};

export const SYSTEM_PROMPT = `You plan a single month for a user of North, an app that helps people align their daily actions with their stated direction.

You are given the goal the user wrote for this month (in their own words) and their focus areas. Break the goal into a realistic 4-week arc:
- For each of the 4 weeks, write a "milestone": what they should have reached by the end of that week. 3–7 words, concrete, building on the previous week.
- For each week, write a "daily_action": one plain thing they can do on a given day that week to move toward that milestone. One short sentence, imperative, doable in 10–20 minutes.

Stay faithful to the user's actual goal — do not redirect it to something else. Keep the language calm, direct, and encouraging without hype. No numbering, no week labels inside the text, no emoji.

Output JSON only, matching the schema: exactly 4 weeks, ordered week 1 to week 4.`;

export function buildUserPrompt(p: PlanPayload): string {
	return [
		`This month's goal (user's words): ${p.goal_title}`,
		p.goal_intent ? `Why it matters to them: ${p.goal_intent}` : "",
		`Focus areas: ${p.focus_areas.length ? p.focus_areas.join(", ") : "(none chosen yet)"}`,
	]
		.filter(Boolean)
		.join("\n");
}

// Anthropic tool — forcing this via tool_choice makes Claude return the plan as
// the tool's structured `input` (the Messages API has no response_format).
export const PLAN_TOOL = {
	name: "month_plan",
	description: "Record the 4-week plan as structured data.",
	input_schema: {
		type: "object",
		properties: {
			weeks: {
				type: "array",
				minItems: 4,
				maxItems: 4,
				items: {
					type: "object",
					properties: {
						milestone: {
							type: "string",
							description:
								"What to reach by the end of this week. 3–7 words, concrete.",
						},
						daily_action: {
							type: "string",
							description:
								"One plain thing to do on a day this week. One short imperative sentence.",
						},
					},
					required: ["milestone", "daily_action"],
					additionalProperties: false,
				},
			},
		},
		required: ["weeks"],
		additionalProperties: false,
	},
} as const;

// ── Goal suggestion ──────────────────────────────────────────────────────────
// Before the user writes anything, propose a goal from what the app already
// knows: their focus areas, the intent they wrote at onboarding, and the kinds
// of opportunities they said they were interested in.

export type SuggestPayload = {
	focus_areas: string[];
	statement_of_intent: string;
	season_label: string;
	interests: string[];
};

export type GoalSuggestion = {
	goal_title: string;
	goal_intent: string;
};

export const SUGGEST_SYSTEM_PROMPT = `You propose ONE monthly goal for a user of North, an app that helps people align their daily actions with their stated direction.

Using what the app knows about them — their focus areas, the intent they wrote during onboarding, the season they're in, and the kinds of opportunities they're interested in — suggest a single goal for THIS month that:
- is specific and concrete (something they could actually finish in a month),
- builds directly on their stated direction and interests (don't invent unrelated topics),
- is encouraging and plain, not hype.

Return:
- goal_title: the goal in one short sentence (max ~12 words), written as something they'd say about themselves.
- goal_intent: one short sentence on why it matters to them, grounded in what they told you.

Output JSON only, matching the schema.`;

export function buildSuggestPrompt(p: SuggestPayload): string {
	return [
		`Focus areas: ${p.focus_areas.length ? p.focus_areas.join(", ") : "(none chosen yet)"}`,
		p.statement_of_intent
			? `What they said they want (onboarding): ${p.statement_of_intent}`
			: "",
		p.season_label ? `Season of life: ${p.season_label}` : "",
		p.interests.length
			? `Interested in these opportunities: ${p.interests.join(", ")}`
			: "",
	]
		.filter(Boolean)
		.join("\n");
}

export const SUGGEST_TOOL = {
	name: "goal_suggestion",
	description: "Record the suggested monthly goal as structured data.",
	input_schema: {
		type: "object",
		properties: {
			goal_title: {
				type: "string",
				description: "One short sentence naming the suggested goal.",
			},
			goal_intent: {
				type: "string",
				description: "One short sentence on why it matters to them.",
			},
		},
		required: ["goal_title", "goal_intent"],
		additionalProperties: false,
	},
} as const;

// Deterministic fallback when the model is unavailable — keeps the user's goal as
// the through-line so the month is never left unplanned.
export function fallbackPlan(goalTitle: string): PlanResult {
	const goal = goalTitle.replace(/\.\s*$/, "");
	return {
		weeks: [
			{
				milestone: "Define what done looks like",
				daily_action: `Spend 10 minutes getting clear on: ${goal}.`,
			},
			{
				milestone: "Build early momentum",
				daily_action: `Do one small thing today toward: ${goal}.`,
			},
			{
				milestone: "Push through the middle",
				daily_action: `Keep going on ${goal}, even a little.`,
			},
			{
				milestone: "Finish and reflect",
				daily_action: `Make progress on ${goal} and note what you learned.`,
			},
		],
	};
}
