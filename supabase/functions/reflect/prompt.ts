// Versioned prompt for the reflect Edge Function (AI-06).
// Bump PROMPT_VERSION when changing wording so old analyses remain
// queryable by version.

export const PROMPT_VERSION = "v0.2";
export const MODEL_NAME = "gpt-4o-mini";

export type ReflectPayload = {
	focus_areas: string[];
	band: string;
	provisional: boolean;
	reflection_body: string;
};

export type ReflectionAnalysis = {
	// What moved the user toward their focus areas today.
	signal: string[];
	// What pulled them away — distractions, drift, friction.
	noise: string[];
	// One calm one-line read of the day.
	read: string;
};

export const SYSTEM_PROMPT = `You analyze a short daily journal entry written by a user of North, an app that helps people align their daily actions with their stated direction.

Read the entry and separate the day into:
- signal: 1–4 short phrases naming what moved the user toward their focus areas — real progress, deep work, meaningful moments.
- noise: 0–4 short phrases naming what pulled them away — distractions, drift, friction, time that didn't serve their direction.
- read: one short, calm sentence summarizing the day. Never prescriptive or urgent.

Base this only on what the entry actually says — do not invent specifics. If the entry is too sparse to judge, return fewer items. Each signal/noise phrase is 2–6 words, lowercase unless a proper noun.

Tone: calm, direct, observational — a quiet mirror, not a coach.

Output JSON only, matching the schema.`;

export function buildUserPrompt(p: ReflectPayload): string {
	return [
		`Focus areas: ${p.focus_areas.length ? p.focus_areas.join(", ") : "(none chosen yet)"}`,
		`Current signal band: ${p.band}${p.provisional ? " (provisional)" : ""}`,
		`Journal entry: ${p.reflection_body}`,
	].join("\n");
}

export const RESPONSE_SCHEMA = {
	name: "journal_analysis",
	schema: {
		type: "object",
		properties: {
			signal: {
				type: "array",
				minItems: 0,
				maxItems: 4,
				items: { type: "string" },
				description:
					"What moved the user toward their focus areas today. 2–6 words each.",
			},
			noise: {
				type: "array",
				minItems: 0,
				maxItems: 4,
				items: { type: "string" },
				description:
					"What pulled the user away from their direction today. 2–6 words each.",
			},
			read: {
				type: "string",
				description: "One calm sentence summarizing the day.",
			},
		},
		required: ["signal", "noise", "read"],
		additionalProperties: false,
	},
	strict: true,
} as const;
