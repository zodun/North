"use client";

import { useState } from "react";
import {
	easings,
	type Palette,
	type Tweaks,
	type TypePairing,
} from "../_lib/tokens";
import { Icon, type IconName } from "./icon";

const SAMPLE_WEEKS = [
	{ band: "Drifting", score: 31 },
	{ band: "Drifting", score: 37 },
	{ band: "Finding", score: 44 },
	{ band: "Finding", score: 51 },
	{ band: "Finding", score: 49 },
	{ band: "Finding", score: 58 },
] as const;

type BandLabel = "Drifting" | "Finding" | "Aligned";

const SAMPLE_28 = [
	2, 1, 2, 1, 2, 2, 0, 1, 2, 2, 3, 2, 1, 2, 2, 1, 0, 3, 2, 2, 1, 2, 1, 2, 2, 2,
	1, 2,
];

const bandInfo = (
	p: Palette,
): Record<BandLabel, { color: string; body: string }> => ({
	Drifting: {
		color: p.bandDrift,
		body: "You’re showing up, just not toward what you said matters. No alarm — drift is part of finding direction.",
	},
	Finding: {
		color: p.bandFind,
		body: "You’re moving toward what matters more often than not. Coherence is the slowest of the three to climb.",
	},
	Aligned: {
		color: p.bandAlign,
		body: "You’re acting on what you said matters. Hold the rhythm; the score will deepen.",
	},
});

function Sparkline({
	data,
	p,
	accent,
	height = 64,
	width = 280,
}: {
	data: ReadonlyArray<{ score: number }>;
	p: Palette;
	accent: string;
	height?: number;
	width?: number;
}) {
	const pad = 4;
	const w = width - pad * 2;
	const h = height - pad * 2;
	const pts = data.map((d, i) => {
		const x = pad + (i / (data.length - 1)) * w;
		const y = pad + h - (d.score / 100) * h;
		return [x, y] as const;
	});
	const pathD = pts.reduce((acc, [x, y], i) => {
		if (i === 0) return `M${x},${y}`;
		const prev = pts[i - 1];
		if (!prev) return acc;
		const [px, py] = prev;
		const cx = (px + x) / 2;
		return `${acc} Q${cx},${py} ${cx},${(py + y) / 2} T${x},${y}`;
	}, "");
	const last = pts[pts.length - 1];
	const first = pts[0];
	if (!last || !first) return null;
	const fillD = `${pathD} L${last[0]},${height} L${first[0]},${height} Z`;
	return (
		<svg
			width={width}
			height={height}
			viewBox={`0 0 ${width} ${height}`}
			style={{ display: "block" }}
		>
			<defs>
				<linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor={accent} stopOpacity={0.25} />
					<stop offset="100%" stopColor={accent} stopOpacity={0} />
				</linearGradient>
			</defs>
			{[20, 40, 60, 80].map((y) => (
				<line
					key={y}
					x1={pad}
					x2={width - pad}
					y1={pad + h - (y / 100) * h}
					y2={pad + h - (y / 100) * h}
					stroke={p.line}
					strokeDasharray="2 4"
				/>
			))}
			<path d={fillD} fill="url(#sparkFill)" />
			<path
				d={pathD}
				fill="none"
				stroke={accent}
				strokeWidth={1.75}
				strokeLinejoin="round"
				strokeLinecap="round"
			/>
			{pts.map(([x, y], i) => (
				<circle
					key={`${x}-${y}`}
					cx={x}
					cy={y}
					r={i === pts.length - 1 ? 4 : 2}
					fill={p.bg}
					stroke={accent}
					strokeWidth={1.5}
				/>
			))}
		</svg>
	);
}

function BandHero({
	band,
	score,
	prev,
	p,
	t,
	big = false,
}: {
	band: BandLabel;
	score: number;
	prev: number;
	p: Palette;
	t: TypePairing;
	big?: boolean;
}) {
	const info = bandInfo(p)[band];
	const delta = score - prev;
	const arrow: IconName =
		delta > 2 ? "arrowUp" : delta < -2 ? "arrowDown" : "flat";
	const arrowLabel = delta > 2 ? "climbing" : delta < -2 ? "easing" : "holding";
	return (
		<div style={{ padding: "0 24px", marginBottom: 18 }}>
			<div
				style={{
					fontFamily: t.ui,
					fontSize: 11,
					letterSpacing: "0.18em",
					textTransform: "uppercase",
					color: p.inkDim,
					fontWeight: 500,
					marginBottom: 14,
				}}
			>
				This week's signal
			</div>
			<div
				style={{
					display: "flex",
					alignItems: "baseline",
					gap: 14,
					marginBottom: 12,
				}}
			>
				<div
					style={{
						fontFamily: t.display,
						fontWeight: t.displayWeight,
						letterSpacing: t.displayTracking,
						fontStyle: t.editorialItalic ? "italic" : "normal",
						fontSize: big ? 56 : 44,
						lineHeight: 1,
						color: info.color,
					}}
				>
					{band}
				</div>
				<div
					style={{
						display: "inline-flex",
						alignItems: "center",
						gap: 5,
						color: p.inkMid,
						fontFamily: t.ui,
						fontSize: 12,
						fontWeight: 500,
					}}
				>
					<Icon name={arrow} size={14} stroke={p.inkMid} strokeWidth={1.8} />
					{arrowLabel}
				</div>
			</div>
			<p
				style={{
					fontFamily: t.ui,
					fontSize: 14.5,
					lineHeight: 1.5,
					color: p.inkMid,
					margin: 0,
					textWrap: "pretty",
				}}
			>
				{info.body}
			</p>
		</div>
	);
}

function SparklineCard({
	p,
	t,
	accent,
}: {
	p: Palette;
	t: TypePairing;
	accent: string;
}) {
	return (
		<div
			style={{
				margin: "0 24px 18px 24px",
				padding: "20px",
				background: p.surface,
				border: `1px solid ${p.line}`,
				borderRadius: 22,
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					marginBottom: 14,
				}}
			>
				<span
					style={{
						fontFamily: t.ui,
						fontSize: 11,
						letterSpacing: "0.18em",
						textTransform: "uppercase",
						color: p.inkDim,
						fontWeight: 500,
					}}
				>
					Last 6 weeks
				</span>
				<span style={{ fontFamily: t.mono, fontSize: 11, color: p.inkMid }}>
					{SAMPLE_WEEKS[0].band} → {SAMPLE_WEEKS.at(-1)?.band}
				</span>
			</div>
			<Sparkline
				data={SAMPLE_WEEKS}
				p={p}
				accent={accent}
				width={314}
				height={72}
			/>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					marginTop: 8,
				}}
			>
				{["6w", "5w", "4w", "3w", "2w", "now"].map((l) => (
					<span
						key={l}
						style={{ fontFamily: t.mono, fontSize: 10, color: p.inkDim }}
					>
						{l}
					</span>
				))}
			</div>
		</div>
	);
}

function InputBreakdown({ p, t }: { p: Palette; t: TypePairing }) {
	const items = [
		{
			label: "Action on intent",
			v: 0.57,
			w: 0.45,
			desc: "12 of 21 aligned tasks done.",
		},
		{
			label: "Engagement coherence",
			v: 0.61,
			w: 0.25,
			desc: "11 of 18 deep engagements in focus.",
		},
		{ label: "Consistency", v: 0.71, w: 0.3, desc: "5 of 7 directed days." },
	];
	return (
		<div style={{ margin: "0 24px 18px 24px" }}>
			<div
				style={{
					fontFamily: t.ui,
					fontSize: 11,
					letterSpacing: "0.18em",
					textTransform: "uppercase",
					color: p.inkDim,
					fontWeight: 500,
					marginBottom: 12,
				}}
			>
				What's underneath
			</div>
			<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
				{items.map((it) => (
					<div key={it.label}>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "baseline",
								marginBottom: 6,
							}}
						>
							<span
								style={{
									fontFamily: t.ui,
									fontSize: 13,
									color: p.ink,
									fontWeight: 500,
								}}
							>
								{it.label}
							</span>
							<span
								style={{ fontFamily: t.mono, fontSize: 11, color: p.inkMid }}
							>
								weight {it.w.toFixed(2)}
							</span>
						</div>
						<div
							style={{
								height: 4,
								background: p.line,
								borderRadius: 2,
								overflow: "hidden",
								marginBottom: 6,
							}}
						>
							<div
								style={{
									height: "100%",
									width: `${it.v * 100}%`,
									background: p.accent,
									borderRadius: 2,
								}}
							/>
						</div>
						<div style={{ fontFamily: t.ui, fontSize: 12, color: p.inkDim }}>
							{it.desc}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function WeeklyPulse({
	p,
	t,
	value,
	setValue,
}: {
	p: Palette;
	t: TypePairing;
	value: number;
	setValue: (n: number) => void;
}) {
	const labels = ["Not at all", "A little", "Somewhat", "Mostly", "Fully"];
	return (
		<div
			style={{
				margin: "0 24px 18px 24px",
				padding: "20px",
				background: p.surfaceHi,
				border: `1px solid ${p.line}`,
				borderRadius: 22,
			}}
		>
			<div
				style={{
					fontFamily: t.ui,
					fontSize: 11,
					letterSpacing: "0.18em",
					textTransform: "uppercase",
					color: p.inkDim,
					fontWeight: 500,
					marginBottom: 10,
				}}
			>
				Weekly pulse · 1 tap
			</div>
			<div
				style={{
					fontFamily: t.display,
					fontWeight: t.displayWeight,
					letterSpacing: t.displayTracking,
					fontStyle: t.editorialItalic ? "italic" : "normal",
					fontSize: 19,
					lineHeight: 1.25,
					color: p.ink,
					marginBottom: 16,
				}}
			>
				This week, how much did your time go toward what matters to you?
			</div>
			<div style={{ display: "flex", gap: 6 }}>
				{labels.map((l, i) => (
					<button
						type="button"
						key={l}
						onClick={() => setValue(i)}
						style={{
							flex: 1,
							padding: "10px 0",
							borderRadius: 10,
							background: value === i ? p.accent : "transparent",
							border: `1px solid ${value === i ? p.accent : p.lineHi}`,
							color: value === i ? p.accentInk : p.inkMid,
							fontFamily: t.ui,
							fontSize: 11,
							fontWeight: 500,
							cursor: "pointer",
							textAlign: "center",
							letterSpacing: "-0.005em",
							lineHeight: 1.2,
						}}
					>
						{l}
					</button>
				))}
			</div>
		</div>
	);
}

function RhythmStreakCard({ p, t }: { p: Palette; t: TypePairing }) {
	const directed = 5;
	const days = ["M", "T", "W", "T", "F", "S", "S"];
	const sequence = [2, 2, 3, 2, 1, 2, 0];
	return (
		<div
			style={{
				margin: "0 24px 18px 24px",
				padding: "20px",
				background: p.surface,
				border: `1px solid ${p.line}`,
				borderRadius: 22,
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "baseline",
					marginBottom: 14,
				}}
			>
				<span
					style={{
						fontFamily: t.ui,
						fontSize: 11,
						letterSpacing: "0.18em",
						textTransform: "uppercase",
						color: p.inkDim,
						fontWeight: 500,
					}}
				>
					Rhythm
				</span>
				<span
					style={{
						fontFamily: t.ui,
						fontSize: 11,
						color: p.accent,
						fontWeight: 600,
						letterSpacing: "0.04em",
					}}
				>
					Intact
				</span>
			</div>
			<div
				style={{
					display: "flex",
					alignItems: "baseline",
					gap: 10,
					marginBottom: 14,
				}}
			>
				<span
					style={{
						fontFamily: t.display,
						fontWeight: t.displayWeight,
						letterSpacing: t.displayTracking,
						fontStyle: t.editorialItalic ? "italic" : "normal",
						fontSize: 42,
						lineHeight: 1,
						color: p.ink,
					}}
				>
					{directed}
				</span>
				<span style={{ fontFamily: t.ui, fontSize: 14, color: p.inkMid }}>
					directed days this week
				</span>
			</div>
			<div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
				{sequence.map((v, i) => {
					const bg =
						v === 2
							? p.accent
							: v === 1
								? `${p.accent}55`
								: v === 3
									? p.inkDim
									: p.line;
					return (
						<div
							key={days[i]}
							style={{
								flex: 1,
								height: 32,
								borderRadius: 8,
								background: bg,
								border: v === 3 ? `1px dashed ${p.inkMid}` : "none",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontFamily: t.mono,
								fontSize: 10,
								color: v >= 2 ? p.accentInk : p.inkDim,
							}}
						>
							{days[i]}
						</div>
					);
				})}
			</div>
			<div
				style={{
					fontFamily: t.ui,
					fontSize: 12,
					color: p.inkDim,
					lineHeight: 1.5,
				}}
			>
				Wed was a rest day. The rhythm holds.
			</div>
		</div>
	);
}

function ConsistencyGrid({
	p,
	t,
	accent,
}: {
	p: Palette;
	t: TypePairing;
	accent: string;
}) {
	const cellSize = 26;
	const gap = 5;
	const weekdayLabels = ["M", "T", "W", "T", "F", "S", "S"];
	return (
		<div
			style={{
				margin: "0 24px 18px 24px",
				padding: "20px",
				background: p.surface,
				border: `1px solid ${p.line}`,
				borderRadius: 22,
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "baseline",
					marginBottom: 14,
				}}
			>
				<span
					style={{
						fontFamily: t.ui,
						fontSize: 11,
						letterSpacing: "0.18em",
						textTransform: "uppercase",
						color: p.inkDim,
						fontWeight: 500,
					}}
				>
					Last 28 days
				</span>
				<span style={{ fontFamily: t.mono, fontSize: 11, color: p.inkMid }}>
					21 of 28 active
				</span>
			</div>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: `repeat(7, ${cellSize}px)`,
					gap,
					justifyContent: "space-between",
					marginBottom: 10,
				}}
			>
				{weekdayLabels.map((l, i) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: fixed-length weekday header
						key={`hdr-${i}-${l}`}
						style={{
							fontFamily: t.mono,
							fontSize: 9.5,
							color: p.inkDim,
							textAlign: "center",
							height: 14,
						}}
					>
						{l}
					</div>
				))}
				{SAMPLE_28.map((v, i) => {
					let bg = p.line;
					if (v === 2) bg = accent;
					else if (v === 1) bg = `${accent}55`;
					else if (v === 3) bg = "transparent";
					return (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: fixed-length 28-day grid
							key={`cell-${i}`}
							style={{
								width: cellSize,
								height: cellSize,
								borderRadius: 7,
								background: bg,
								border: v === 3 ? `1px dashed ${p.inkDim}` : "none",
								transition: `background 200ms ${easings.calm}`,
							}}
						/>
					);
				})}
			</div>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 12,
					marginTop: 8,
					fontFamily: t.ui,
					fontSize: 10.5,
					color: p.inkDim,
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
					<div
						style={{
							width: 10,
							height: 10,
							borderRadius: 3,
							background: accent,
						}}
					/>{" "}
					directed
				</div>
				<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
					<div
						style={{
							width: 10,
							height: 10,
							borderRadius: 3,
							background: `${accent}55`,
						}}
					/>{" "}
					active
				</div>
				<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
					<div
						style={{
							width: 10,
							height: 10,
							borderRadius: 3,
							background: "transparent",
							border: `1px dashed ${p.inkDim}`,
						}}
					/>{" "}
					rest
				</div>
			</div>
		</div>
	);
}

function NarrativeView({
	p,
	t,
	band,
	pulse,
	setPulse,
}: {
	p: Palette;
	t: TypePairing;
	band: BandLabel;
	pulse: number;
	setPulse: (n: number) => void;
}) {
	const info = bandInfo(p)[band];
	return (
		<>
			<div style={{ padding: "0 24px", marginBottom: 28 }}>
				<div
					style={{
						fontFamily: t.ui,
						fontSize: 11,
						letterSpacing: "0.18em",
						textTransform: "uppercase",
						color: p.inkDim,
						fontWeight: 500,
						marginBottom: 18,
					}}
				>
					This week, in a sentence
				</div>
				<p
					style={{
						fontFamily: t.display,
						fontWeight: t.displayWeight,
						letterSpacing: t.displayTracking,
						fontStyle: t.editorialItalic ? "italic" : "normal",
						fontSize: 28,
						lineHeight: 1.28,
						color: p.ink,
						margin: 0,
					}}
				>
					You're <span style={{ color: info.color }}>{band.toLowerCase()}</span>{" "}
					— closing in on a fourth week of climbing. The week you skipped your
					deep-work block twice still showed up in your score.
				</p>
			</div>
			<div
				style={{
					margin: "0 24px 18px 24px",
					display: "grid",
					gridTemplateColumns: "1fr 1fr",
					gap: 10,
				}}
			>
				{[
					{ k: "Action", v: "12 / 21", sub: "aligned tasks done" },
					{ k: "Coherence", v: "11 / 18", sub: "engagements in focus" },
					{ k: "Consistency", v: "5 / 7", sub: "directed days" },
					{ k: "Avoidance", v: "1", sub: "task skipped ≥2×" },
				].map((x) => (
					<div
						key={x.k}
						style={{
							padding: "14px 14px",
							borderRadius: 16,
							background: p.surface,
							border: `1px solid ${p.line}`,
						}}
					>
						<div
							style={{
								fontFamily: t.ui,
								fontSize: 10.5,
								letterSpacing: "0.14em",
								textTransform: "uppercase",
								color: p.inkDim,
								fontWeight: 500,
								marginBottom: 6,
							}}
						>
							{x.k}
						</div>
						<div
							style={{
								fontFamily: t.mono,
								fontSize: 20,
								color: p.ink,
								fontWeight: 500,
								marginBottom: 2,
							}}
						>
							{x.v}
						</div>
						<div style={{ fontFamily: t.ui, fontSize: 11, color: p.inkDim }}>
							{x.sub}
						</div>
					</div>
				))}
			</div>
			<WeeklyPulse p={p} t={t} value={pulse} setValue={setPulse} />
		</>
	);
}

export function Signal({
	p,
	t,
	tweaks,
}: {
	p: Palette;
	t: TypePairing;
	tweaks: Tweaks;
}) {
	const [pulse, setPulse] = useState(2);
	const last = SAMPLE_WEEKS[SAMPLE_WEEKS.length - 1];
	const prev = SAMPLE_WEEKS[SAMPLE_WEEKS.length - 2];
	if (!last || !prev) return null;
	const band = last.band as BandLabel;
	const score = last.score;
	const showStreak =
		tweaks.streakStyle === "rhythm" || tweaks.streakStyle === "both";
	const showGrid =
		(tweaks.streakStyle === "grid" || tweaks.streakStyle === "both") &&
		tweaks.showConsistency;
	const style = tweaks.signalStyle || "band";
	return (
		<div
			style={{
				position: "absolute",
				inset: 0,
				overflowY: "auto",
				padding: "88px 0 120px 0",
			}}
		>
			{style === "narrative" ? (
				<NarrativeView
					p={p}
					t={t}
					band={band}
					pulse={pulse}
					setPulse={setPulse}
				/>
			) : (
				<>
					<BandHero
						band={band}
						score={score}
						prev={prev.score}
						p={p}
						t={t}
						big={style === "band"}
					/>
					{style === "sparkline" && (
						<SparklineCard p={p} t={t} accent={p.accent} />
					)}
					<InputBreakdown p={p} t={t} />
					<WeeklyPulse p={p} t={t} value={pulse} setValue={setPulse} />
				</>
			)}
			{showStreak && <RhythmStreakCard p={p} t={t} />}
			{showGrid && <ConsistencyGrid p={p} t={t} accent={p.accent} />}
			{style !== "sparkline" &&
				style !== "narrative" &&
				tweaks.showConsistency && (
					<SparklineCard p={p} t={t} accent={p.accent} />
				)}
		</div>
	);
}
