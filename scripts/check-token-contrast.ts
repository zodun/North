#!/usr/bin/env bun
// WCAG AA contrast verification for the design tokens (DEC-25).
//
// Runs `bun scripts/check-token-contrast.ts`. CI invokes it via
// `bun run check:contrast` in .github/workflows/ci.yml.
//
// Fails (exit 1) on any palette/pair below threshold. Always prints
// the full table so palette tweaks land with their numbers visible.

import { PALETTES, type Palette, type PaletteKey } from "@north/tokens";

type Channel = { r: number; g: number; b: number };

/** Parse `#rrggbb`, `#rrggbbaa`, or `rgba(r,g,b[,a])` to RGB. Ignores alpha. */
function parseColor(input: string): Channel | null {
	const hex = input.trim().match(/^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/);
	if (hex) {
		const raw = hex[1];
		if (!raw) return null;
		return {
			r: Number.parseInt(raw.slice(0, 2), 16),
			g: Number.parseInt(raw.slice(2, 4), 16),
			b: Number.parseInt(raw.slice(4, 6), 16),
		};
	}
	const rgba = input.trim().match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
	if (rgba) {
		return {
			r: Number(rgba[1]),
			g: Number(rgba[2]),
			b: Number(rgba[3]),
		};
	}
	return null;
}

/** sRGB → linear, per WCAG 2.x. */
function lin(channel: number): number {
	const c = channel / 255;
	return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance({ r, g, b }: Channel): number {
	return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(fg: string, bg: string): number | null {
	const a = parseColor(fg);
	const b = parseColor(bg);
	if (!a || !b) return null;
	const la = relativeLuminance(a);
	const lb = relativeLuminance(b);
	const [hi, lo] = la > lb ? [la, lb] : [lb, la];
	return (hi + 0.05) / (lo + 0.05);
}

type Check = {
	label: string;
	fg: keyof Palette;
	bg: keyof Palette;
	threshold: number;
};

const CHECKS: Check[] = [
	{ label: "ink on bg", fg: "ink", bg: "bg", threshold: 4.5 },
	{ label: "ink on surface", fg: "ink", bg: "surface", threshold: 4.5 },
	{
		label: "inkMid on bg (large/secondary)",
		fg: "inkMid",
		bg: "bg",
		threshold: 3.0,
	},
	{
		label: "accentInk on accent (button label)",
		fg: "accentInk",
		bg: "accent",
		threshold: 4.5,
	},
];

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

let failures = 0;
const lines: string[] = [];

for (const [paletteKey, palette] of Object.entries(PALETTES) as [
	PaletteKey,
	Palette,
][]) {
	lines.push(`\n${BOLD}${palette.label} (${paletteKey})${RESET}`);
	for (const check of CHECKS) {
		const fg = palette[check.fg] as string;
		const bg = palette[check.bg] as string;
		const ratio = contrastRatio(fg, bg);
		if (ratio === null) {
			lines.push(
				`  ${RED}× ${check.label}${RESET} — could not parse ${fg} / ${bg}`,
			);
			failures += 1;
			continue;
		}
		const passes = ratio >= check.threshold;
		const marker = passes ? `${GREEN}✓${RESET}` : `${RED}×${RESET}`;
		const ratioStr = ratio.toFixed(2);
		lines.push(
			`  ${marker} ${check.label.padEnd(40)}  ${ratioStr.padStart(5)}  (need ≥${check.threshold})`,
		);
		if (!passes) failures += 1;
	}
}

for (const line of lines) console.log(line);

if (failures > 0) {
	console.log(
		`\n${RED}${BOLD}${failures} contrast failure${failures === 1 ? "" : "s"}.${RESET} Tune the failing palette slots before merging.`,
	);
	process.exit(1);
}

console.log(`\n${GREEN}${BOLD}All contrast checks pass.${RESET}`);
