// Versioned prompt for the reflect Edge Function (AI-06).
// Bump PROMPT_VERSION when changing wording so old analyses remain
// queryable by version.

export const PROMPT_VERSION = "v0.1";
export const MODEL_NAME = "gpt-4o-mini";

export type ReflectPayload = {
	focus_areas: string[];
	band: string;
	provisional: boolean;
	reflection_body: string;
};

export type ReflectionAnalysis = {
	themes: string[];
	alignment: "aligned" | "drifting" | "unclear";
	nudge: string;
};

export const SYSTEM_PROMPT = `You analyze a brief weekly reflection written by a user of North, an app that helps people align their daily actions with their stated direction.

Extract 1–3 short theme keywords from the reflection. Assess whether the reflection suggests the user is aligned with their focus areas, drifting from them, or unclear. Generate one short, calm mission nudge sentence for the coming week — something concrete the user could carry forward.

Tone: calm, direct, never prescriptive or urgent. The nudge should feel like a quiet suggestion, not a directive.

Output JSON only, matching the schema. Themes must be one or two words each.`;

export function buildUserPrompt(p: ReflectPayload): string {
	return [
		`Focus areas: ${p.focus_areas.length ? p.focus_areas.join(", ") : "(none chosen yet)"}`,
		`Current signal band: ${p.band}${p.provisional ? " (provisional)" : ""}`,
		`Reflection: ${p.reflection_body}`,
	].join("\n");
}

export const RESPONSE_SCHEMA = {
	name: "reflection_analysis",
	schema: {
		type: "object",
		properties: {
			themes: {
				type: "array",
				minItems: 1,
				maxItems: 3,
				items: { type: "string" },
				description: "1–3 short theme keywords from the reflection.",
			},
			alignment: {
				type: "string",
				enum: ["aligned", "drifting", "unclear"],
				description:
					"Whether the reflection suggests alignment with the user's focus areas.",
			},
			nudge: {
				type: "string",
				description: "One calm sentence the user can carry into next week.",
			},
		},
		required: ["themes", "alignment", "nudge"],
		additionalProperties: false,
	},
	strict: true,
} as const;
