// "Quiet ambition" design tokens (DEC-22).
// Source of truth for both the web /north prototype and the native
// app's UI library. Do not duplicate these values elsewhere; import
// from `@north/tokens` and call `getTokens(paletteKey, typeKey, density)`
// at the consumer to get a `{ p, t, d }` triple.

export type PaletteKey = "slate" | "warm" | "cool" | "light";
export type TypeKey = "humanist" | "editorial" | "signal";

export type Palette = {
	label: string;
	mode: "dark" | "light";
	bg: string;
	surface: string;
	surfaceHi: string;
	line: string;
	lineHi: string;
	ink: string;
	inkMid: string;
	inkDim: string;
	accent: string;
	accentInk: string;
	accentSoft: string;
	warn: string;
	bandDrift: string;
	bandFind: string;
	bandAlign: string;
};

export type TypePairing = {
	label: string;
	ui: string;
	display: string;
	editorial: string;
	mono: string;
	displayWeight: number;
	displayTracking: string;
	editorialItalic: boolean;
};

export const PALETTES: Record<PaletteKey, Palette> = {
	slate: {
		label: "Slate",
		mode: "dark",
		bg: "#0e141a",
		surface: "#19222c",
		surfaceHi: "#222d3a",
		line: "rgba(255,255,255,0.09)",
		lineHi: "rgba(255,255,255,0.18)",
		ink: "#f3f6f9",
		inkMid: "#b5c0cc",
		inkDim: "#6c7984",
		accent: "#8ed0c7",
		accentInk: "#0a1015",
		accentSoft: "rgba(142,208,199,0.16)",
		warn: "#d6a36b",
		bandDrift: "#8693a0",
		bandFind: "#d4b275",
		bandAlign: "#8ed0c7",
	},
	warm: {
		label: "Warm",
		mode: "dark",
		bg: "#1a1510",
		surface: "#251e17",
		surfaceHi: "#30261d",
		line: "rgba(255,235,210,0.10)",
		lineHi: "rgba(255,235,210,0.20)",
		ink: "#faf3e7",
		inkMid: "#cbbca5",
		inkDim: "#857964",
		accent: "#e8b985",
		accentInk: "#1a1510",
		accentSoft: "rgba(232,185,133,0.18)",
		warn: "#d9846a",
		bandDrift: "#a09181",
		bandFind: "#e8b985",
		bandAlign: "#c0d18a",
	},
	cool: {
		label: "Cool",
		mode: "dark",
		bg: "#0f111c",
		surface: "#191d31",
		surfaceHi: "#22273e",
		line: "rgba(220,225,255,0.09)",
		lineHi: "rgba(220,225,255,0.18)",
		ink: "#f1f3fb",
		inkMid: "#b3b8d2",
		inkDim: "#6c728a",
		accent: "#a8bbe6",
		accentInk: "#0b0d16",
		accentSoft: "rgba(168,187,230,0.16)",
		warn: "#d68ba0",
		bandDrift: "#878dac",
		bandFind: "#bda6df",
		bandAlign: "#a8bbe6",
	},
	light: {
		label: "Light",
		mode: "light",
		bg: "#f6f3ec",
		surface: "#ffffff",
		surfaceHi: "#fbf8f1",
		line: "rgba(20,28,36,0.08)",
		lineHi: "rgba(20,28,36,0.16)",
		ink: "#161c22",
		inkMid: "#5b6670",
		inkDim: "#8b96a0",
		accent: "#2f6b64",
		accentInk: "#ffffff",
		accentSoft: "rgba(47,107,100,0.10)",
		warn: "#a05a30",
		bandDrift: "#8b96a0",
		bandFind: "#a07832",
		bandAlign: "#2f6b64",
	},
};

export const TYPE_PAIRINGS: Record<TypeKey, TypePairing> = {
	humanist: {
		label: "Humanist",
		ui: '"Manrope", system-ui, sans-serif',
		display: '"Manrope", system-ui, sans-serif',
		editorial: '"Manrope", system-ui, sans-serif',
		mono: '"Manrope", system-ui, sans-serif',
		displayWeight: 600,
		displayTracking: "-0.02em",
		editorialItalic: false,
	},
	editorial: {
		label: "Sans + Serif",
		ui: '"Manrope", system-ui, sans-serif',
		display: '"Instrument Serif", Georgia, serif',
		editorial: '"Instrument Serif", Georgia, serif',
		mono: '"JetBrains Mono", ui-monospace, monospace',
		displayWeight: 400,
		displayTracking: "-0.01em",
		editorialItalic: true,
	},
	signal: {
		label: "Sans + Mono",
		ui: '"Manrope", system-ui, sans-serif',
		display: '"Manrope", system-ui, sans-serif',
		editorial: '"Manrope", system-ui, sans-serif',
		mono: '"JetBrains Mono", ui-monospace, monospace',
		displayWeight: 700,
		displayTracking: "-0.035em",
		editorialItalic: false,
	},
};

export type Density = "calm" | "standard";

export function getTokens(
	paletteKey: PaletteKey,
	typeKey: TypeKey,
	density: Density,
) {
	const p = PALETTES[paletteKey] ?? PALETTES.slate;
	const t = TYPE_PAIRINGS[typeKey] ?? TYPE_PAIRINGS.editorial;
	const d =
		density === "standard"
			? { gap: 12, gapLg: 20, pad: 16, padLg: 24, scrnPad: 20 }
			: { gap: 16, gapLg: 28, pad: 22, padLg: 32, scrnPad: 24 };
	return { p, t, d };
}

export const easings = {
	calm: "cubic-bezier(0.22, 0.61, 0.36, 1)",
	spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
};

export type Tokens = ReturnType<typeof getTokens>;

export type Tweaks = {
	palette: PaletteKey;
	typePair: TypeKey;
	density: Density;
	onboardingStyle: "oneQ" | "conversational" | "guided";
	forYouStyle: "fullBleed" | "card" | "hybrid";
	missionStyle: "checklist" | "ritual" | "single";
	signalStyle: "band" | "sparkline" | "narrative";
	streakStyle: "rhythm" | "grid" | "both";
	opportunitiesStyle: "list" | "match" | "map";
	profileStyle: "identity" | "stats" | "journal";
	showConsistency: boolean;
};
