// Purpose mode — the user's stance, chosen at onboarding and worn through the
// app as a small mark of standing. Builder knows the aim and is here to build
// it; Explorer is still charting the way. One definition, used by every surface
// (onboarding induction, profile crest, the For You insignia) so the identity
// reads the same everywhere. Colours stay inside North's three meanings: gold is
// the needle (Builder, acting toward the aim), teal is on-course (Explorer,
// finding the way).

export type PurposeMode = "explorer" | "builder";

export type PurposeDef = {
	id: PurposeMode;
	/** Material Symbols icon name (product surfaces load that sheet). */
	icon: string;
	/** The honoured title. */
	title: string;
	/** Small overline shown above the title on the full crest. */
	eyebrow: string;
	/** One calm line of standing, North voice, no hype. */
	creed: string;
	/** How the loop refers to them, e.g. "Moving as a Builder". */
	moving: string;
	/** Accent fill (the meaning colour). */
	fill: string;
	/** Readable ink variant for text/icon on light (>=4.5:1). */
	ink: string;
};

export const PURPOSE_MODES: Record<PurposeMode, PurposeDef> = {
	builder: {
		id: "builder",
		icon: "rocket_launch",
		title: "Builder",
		eyebrow: "Your stance",
		creed: "You know the aim. You're here to build it.",
		moving: "Moving as a Builder",
		fill: "#F5C842",
		ink: "#8A6A00",
	},
	explorer: {
		id: "explorer",
		icon: "explore",
		title: "Explorer",
		eyebrow: "Your stance",
		creed: "You're charting the way, and that's the work.",
		moving: "Moving as an Explorer",
		fill: "#3ECFBF",
		ink: "#0A8F7F",
	},
};

export function isPurposeMode(v: unknown): v is PurposeMode {
	return v === "explorer" || v === "builder";
}
