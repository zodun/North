// North product UI primitives — the cinematic "Night Compass" system extracted
// from the Mission redesign so every product surface shares one source of truth.
// See DESIGN.md. Colors are rationed to three meanings: gold = next action,
// teal = on-course, violet = drift.
"use client";

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export const colors = {
	gold: "#F5C842",
	teal: "#3ECFBF",
	violet: "#7B61FF",
	night: "#05050E",
	signalGreen: "#4ECCA3",
	noiseRed: "#F87171",
	ink: "#F0F0F5",
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
			className={`border border-white/[0.07] bg-white/[0.04] ${SURFACE_RADIUS[size]} ${className}`}
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
			className={`font-bold text-[10px] text-white/30 uppercase tracking-[0.12em] ${className}`}
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
							border: "1px solid rgba(255,255,255,0.10)",
							color: "rgba(255,255,255,0.35)",
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
		backgroundColor: "rgba(62,207,191,0.1)",
		borderColor: "rgba(62,207,191,0.2)",
		color: colors.teal,
	},
	done: {
		backgroundColor: "rgba(245,200,66,0.1)",
		borderColor: "rgba(245,200,66,0.2)",
		color: colors.gold,
	},
	upcoming: {
		backgroundColor: "rgba(255,255,255,0.05)",
		borderColor: "rgba(255,255,255,0.08)",
		color: "rgba(255,255,255,0.30)",
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
			className={`w-full cursor-pointer rounded-[10px] border py-[10px] font-bold text-[13px] transition-colors duration-200 hover:bg-[rgba(62,207,191,0.15)] disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none ${className}`}
			style={{
				backgroundColor: "rgba(62,207,191,0.1)",
				borderColor: "rgba(62,207,191,0.25)",
				color: colors.teal,
			}}
			{...rest}
		>
			{children}
		</button>
	);
}
