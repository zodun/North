// North product UI primitives, the "Soft Sky" system: a calm, airy LIGHT
// theme (cool sky base, white cards, teal-forward). Colors keep their three
// rationed meanings: gold = next action, teal = on-course, violet = drift.
// See DESIGN.md. The vivid accent hues are fine as fills/progress; for TEXT or
// icons on the light surfaces use their *Ink variants (readable contrast).
"use client";

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export const colors = {
	// Brand accent hues, fills, progress bars, icons-on-fill.
	gold: "#F5C842",
	teal: "#3ECFBF",
	violet: "#7B61FF",
	signalGreen: "#4ECCA3",
	noiseRed: "#F87171",
	// Readable "ink" variants for the SAME meanings used as text/icons on light
	// (the vivid hues above fail WCAG contrast as text on white).
	goldInk: "#8A6A00",
	tealInk: "#0A8F7F",
	violetInk: "#5B43E0",
	greenInk: "#0E9E73",
	redInk: "#DC2626",
	// Soft Sky surfaces.
	sky: "#EDF1F8", // app base (cool, airy)
	surface: "#FFFFFF", // cards
	surfaceMuted: "#F4F7FC", // insets / chips
	ink: "#0E1420", // primary text
	inkMuted: "rgba(14,20,32,0.62)", // secondary text (≥4.5:1)
	inkFaint: "rgba(14,20,32,0.45)", // faint labels (large/bold only)
	hairline: "rgba(14,20,32,0.10)", // borders
	// Dark ink kept for text that sits ON a gold/teal fill (still correct here).
	night: "#05050E",
} as const;

// ── Check icon (shared) ─────────────────────────────────────────────────────

export function CheckIcon({ className }: { className?: string }) {
	return (
		<svg
			width="11"
			height="11"
			viewBox="0 0 12 12"
			fill="none"
			aria-hidden="true"
			className={className}
		>
			<path
				d="M2 6l2.5 2.5L10 3"
				stroke="currentColor"
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

// ── Surface (the flat card: hairline border + translucent fill, no shadow) ──

type SurfaceProps = HTMLAttributes<HTMLDivElement> & {
	size?: "sm" | "md" | "lg";
	children: ReactNode;
};

const SURFACE_RADIUS = {
	sm: "rounded-[10px]",
	md: "rounded-[14px]",
	lg: "rounded-[18px]",
};

export function Surface({
	size = "md",
	className = "",
	children,
	...rest
}: SurfaceProps) {
	return (
		<div
			className={`border border-[#0E1420]/[0.08] bg-white ${SURFACE_RADIUS[size]} ${className}`}
			{...rest}
		>
			{children}
		</div>
	);
}

// ── Eyebrow (the uppercase section label) ──────────────────────────────────

export function Eyebrow({
	className = "",
	children,
}: {
	className?: string;
	children: ReactNode;
}) {
	return (
		<p
			className={`font-bold text-[#0E1420]/55 text-[10px] uppercase tracking-[0.12em] ${className}`}
		>
			{children}
		</p>
	);
}

// ── Cadence / segmented pill ────────────────────────────────────────────────

export function Pill({
	active,
	className = "",
	children,
	...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean }) {
	return (
		<button
			type="button"
			aria-pressed={active}
			className={`cursor-pointer rounded-full px-3 py-1 font-bold text-[10px] capitalize transition-colors duration-200 motion-reduce:transition-none ${className}`}
			style={
				active
					? { backgroundColor: colors.gold, color: colors.night }
					: {
							border: "1px solid rgba(14,20,32,0.14)",
							color: colors.inkMuted,
						}
			}
			{...rest}
		>
			{children}
		</button>
	);
}

// ── Status badge (week-plan / list status) ──────────────────────────────────

const BADGE_STYLE: Record<
	"current" | "done" | "upcoming",
	{ backgroundColor: string; borderColor: string; color: string }
> = {
	current: {
		backgroundColor: "rgba(62,207,191,0.14)",
		borderColor: "rgba(10,143,127,0.30)",
		color: colors.tealInk,
	},
	done: {
		backgroundColor: "rgba(245,200,66,0.18)",
		borderColor: "rgba(138,106,0,0.30)",
		color: colors.goldInk,
	},
	upcoming: {
		backgroundColor: "rgba(14,20,32,0.04)",
		borderColor: "rgba(14,20,32,0.10)",
		color: colors.inkMuted,
	},
};

export function StatusBadge({
	variant,
	className = "",
	children,
}: {
	variant: "current" | "done" | "upcoming";
	className?: string;
	children: ReactNode;
}) {
	return (
		<span
			className={`inline-block rounded-full border px-2 py-0.5 font-bold text-[9px] ${className}`}
			style={BADGE_STYLE[variant]}
		>
			{children}
		</span>
	);
}

// ── Teal block CTA ──────────────────────────────────────────────────────────

export function CtaButton({
	className = "",
	children,
	...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			type="button"
			className={`w-full cursor-pointer rounded-[10px] border py-[10px] font-bold text-[13px] transition-colors duration-200 hover:bg-[rgba(62,207,191,0.18)] disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none ${className}`}
			style={{
				backgroundColor: "rgba(62,207,191,0.14)",
				borderColor: "rgba(10,143,127,0.30)",
				color: colors.tealInk,
			}}
			{...rest}
		>
			{children}
		</button>
	);
}
