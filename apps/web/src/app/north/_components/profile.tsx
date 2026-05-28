"use client";

import { FOCUS_AREAS, JOURNAL } from "../_lib/data";
import type { Palette, Tweaks, TypePairing } from "../_lib/tokens";
import { Icon, type IconName } from "./icon";

function ProfileIdentityView({ p, t }: { p: Palette; t: TypePairing }) {
	const rows: { icon: IconName; label: string; sub: string }[] = [
		{
			icon: "eye",
			label: "See what North has learned",
			sub: "Everything captured. Plain English.",
		},
		{
			icon: "bell",
			label: "Notifications",
			sub: "Calm by default. Three windows a day.",
		},
		{
			icon: "lock",
			label: "Privacy & export",
			sub: "Take your data. Wipe it. Both.",
		},
		{ icon: "settings", label: "Settings", sub: "The usual." },
	];
	return (
		<div
			style={{
				position: "absolute",
				inset: 0,
				overflowY: "auto",
				padding: "88px 0 120px 0",
			}}
		>
			<div style={{ padding: "0 24px", marginBottom: 24 }}>
				<div
					style={{
						width: 80,
						height: 80,
						borderRadius: 40,
						background: `linear-gradient(135deg, ${p.accent}88, ${p.accent}33)`,
						border: `1px solid ${p.accent}`,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						fontFamily: t.display,
						fontWeight: t.displayWeight,
						fontSize: 30,
						color: p.ink,
						letterSpacing: t.displayTracking,
						marginBottom: 16,
					}}
				>
					JP
				</div>
				<div
					style={{
						fontFamily: t.display,
						fontWeight: t.displayWeight,
						letterSpacing: t.displayTracking,
						fontStyle: t.editorialItalic ? "italic" : "normal",
						fontSize: 28,
						lineHeight: 1.22,
						color: p.ink,
						marginBottom: 6,
					}}
				>
					Jordayne
				</div>
				<div style={{ fontFamily: t.ui, fontSize: 13, color: p.inkMid }}>
					Quietly building since January · Kingston
				</div>
			</div>
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
					What I'm pointed at
				</div>
				<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
					{FOCUS_AREAS.slice(0, 3).map((f) => (
						<span
							key={f.id}
							style={{
								fontFamily: t.ui,
								fontSize: 12.5,
								color: p.ink,
								fontWeight: 500,
								padding: "8px 14px",
								borderRadius: 999,
								background: "transparent",
								border: `1px solid ${f.hue}66`,
							}}
						>
							<span
								style={{
									display: "inline-block",
									width: 6,
									height: 6,
									borderRadius: 3,
									background: f.hue,
									marginRight: 8,
									verticalAlign: "middle",
								}}
							/>
							{f.label}
						</span>
					))}
				</div>
			</div>
			<div
				style={{
					margin: "0 24px 18px 24px",
					padding: "20px",
					borderRadius: 22,
					background: p.surface,
					border: `1px solid ${p.line}`,
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
						marginBottom: 12,
					}}
				>
					My statement of intent
				</div>
				<div
					style={{
						fontFamily: t.display,
						fontWeight: t.displayWeight,
						letterSpacing: t.displayTracking,
						fontStyle: t.editorialItalic ? "italic" : "normal",
						fontSize: 19,
						lineHeight: 1.35,
						color: p.ink,
					}}
				>
					To finish one real thing each week, share it small, and let the work
					compound out of sight.
				</div>
				<div
					style={{
						fontFamily: t.ui,
						fontSize: 11,
						color: p.inkDim,
						marginTop: 14,
						letterSpacing: "0.04em",
					}}
				>
					Last revised 12 May.{" "}
					<span style={{ color: p.accent, fontWeight: 500, cursor: "pointer" }}>
						Revise
					</span>
				</div>
			</div>
			<div
				style={{ margin: "0 24px", display: "flex", flexDirection: "column" }}
			>
				{rows.map((row, i) => (
					<button
						type="button"
						key={row.label}
						style={{
							display: "flex",
							alignItems: "center",
							gap: 14,
							padding: "14px 0",
							background: "transparent",
							border: "none",
							cursor: "pointer",
							borderBottom:
								i < rows.length - 1 ? `1px solid ${p.line}` : "none",
							textAlign: "left",
							width: "100%",
						}}
					>
						<div
							style={{
								width: 36,
								height: 36,
								borderRadius: 10,
								background: p.surface,
								border: `1px solid ${p.line}`,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<Icon
								name={row.icon}
								size={16}
								stroke={p.inkMid}
								strokeWidth={1.6}
							/>
						</div>
						<div style={{ flex: 1 }}>
							<div
								style={{
									fontFamily: t.ui,
									fontSize: 13.5,
									color: p.ink,
									fontWeight: 500,
								}}
							>
								{row.label}
							</div>
							<div
								style={{
									fontFamily: t.ui,
									fontSize: 11.5,
									color: p.inkDim,
									marginTop: 2,
								}}
							>
								{row.sub}
							</div>
						</div>
						<Icon name="arrow" size={14} stroke={p.inkDim} strokeWidth={1.4} />
					</button>
				))}
			</div>
		</div>
	);
}

function ProfileStatsView({ p, t }: { p: Palette; t: TypePairing }) {
	const stats = [
		{ k: "4", sub: "weeks with North", big: true },
		{ k: "21", sub: "directed days" },
		{ k: "47", sub: "aligned tasks done" },
		{ k: "3", sub: "opportunities applied" },
		{ k: "Finding", sub: "current band" },
		{ k: "+12", sub: "pts vs. wk 1" },
	];
	return (
		<div
			style={{
				position: "absolute",
				inset: 0,
				overflowY: "auto",
				padding: "88px 0 120px 0",
			}}
		>
			<div style={{ padding: "0 24px", marginBottom: 24 }}>
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
					Jordayne · since 4 May 2026
				</div>
				<h1
					style={{
						fontFamily: t.display,
						fontWeight: t.displayWeight,
						letterSpacing: t.displayTracking,
						fontStyle: t.editorialItalic ? "italic" : "normal",
						fontSize: 28,
						lineHeight: 1.22,
						color: p.ink,
						margin: 0,
					}}
				>
					What you've done so far.
				</h1>
			</div>
			<div
				style={{
					padding: "0 16px 16px 16px",
					display: "grid",
					gridTemplateColumns: "1fr 1fr",
					gap: 10,
				}}
			>
				{stats.map((s) => (
					<div
						key={s.sub}
						style={{
							gridColumn: s.big ? "span 2" : undefined,
							padding: "18px",
							borderRadius: 18,
							background: p.surface,
							border: `1px solid ${p.line}`,
						}}
					>
						<div
							style={{
								fontFamily: t.display,
								fontWeight: t.displayWeight,
								letterSpacing: t.displayTracking,
								fontStyle: t.editorialItalic ? "italic" : "normal",
								fontSize: s.big ? 56 : 32,
								lineHeight: 1,
								color: p.ink,
								marginBottom: 6,
							}}
						>
							{s.k}
						</div>
						<div style={{ fontFamily: t.ui, fontSize: 12, color: p.inkMid }}>
							{s.sub}
						</div>
					</div>
				))}
			</div>
			<div style={{ margin: "0 24px 0 24px" }}>
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
					Focus areas
				</div>
				{FOCUS_AREAS.slice(0, 3).map((f) => (
					<div
						key={f.id}
						style={{
							display: "flex",
							alignItems: "center",
							gap: 10,
							padding: "12px 0",
							borderBottom: `1px solid ${p.line}`,
						}}
					>
						<div
							style={{
								width: 8,
								height: 8,
								borderRadius: 4,
								background: f.hue,
							}}
						/>
						<span
							style={{
								fontFamily: t.ui,
								fontSize: 13.5,
								color: p.ink,
								flex: 1,
							}}
						>
							{f.label}
						</span>
						<span style={{ fontFamily: t.mono, fontSize: 11, color: p.inkMid }}>
							62%
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

function ProfileJournalView({ p, t }: { p: Palette; t: TypePairing }) {
	return (
		<div
			style={{
				position: "absolute",
				inset: 0,
				overflowY: "auto",
				padding: "88px 0 120px 0",
			}}
		>
			<div style={{ padding: "0 24px", marginBottom: 22 }}>
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
					Your tape
				</div>
				<h1
					style={{
						fontFamily: t.display,
						fontWeight: t.displayWeight,
						letterSpacing: t.displayTracking,
						fontStyle: t.editorialItalic ? "italic" : "normal",
						fontSize: 28,
						lineHeight: 1.22,
						color: p.ink,
						margin: 0,
					}}
				>
					One sentence per day, in your own words.
				</h1>
			</div>
			<div
				style={{
					margin: "0 24px 22px 24px",
					padding: "20px",
					borderRadius: 22,
					background: p.surface,
					border: `1px solid ${p.line}`,
				}}
			>
				<div
					style={{
						fontFamily: t.ui,
						fontSize: 11,
						letterSpacing: "0.18em",
						textTransform: "uppercase",
						color: p.accent,
						fontWeight: 600,
						marginBottom: 10,
					}}
				>
					Today · 28 May
				</div>
				<div
					style={{
						fontFamily: t.display,
						fontWeight: t.displayWeight,
						letterSpacing: t.displayTracking,
						fontStyle: t.editorialItalic ? "italic" : "normal",
						fontSize: 18,
						lineHeight: 1.3,
						color: p.inkDim,
					}}
				>
					What changed today?
				</div>
				<div
					style={{
						marginTop: 14,
						display: "flex",
						alignItems: "center",
						gap: 10,
					}}
				>
					<button
						type="button"
						style={{
							background: p.accent,
							color: p.accentInk,
							border: "none",
							borderRadius: 999,
							padding: "8px 14px",
							cursor: "pointer",
							fontFamily: t.ui,
							fontSize: 12.5,
							fontWeight: 600,
							display: "inline-flex",
							alignItems: "center",
							gap: 6,
						}}
					>
						<Icon name="pen" size={13} stroke={p.accentInk} strokeWidth={1.8} />
						Write one line
					</button>
					<button
						type="button"
						style={{
							background: "transparent",
							color: p.inkMid,
							border: `1px solid ${p.lineHi}`,
							borderRadius: 999,
							padding: "8px 14px",
							cursor: "pointer",
							fontFamily: t.ui,
							fontSize: 12.5,
							fontWeight: 500,
							display: "inline-flex",
							alignItems: "center",
							gap: 6,
						}}
					>
						<Icon name="mic" size={13} stroke={p.inkMid} strokeWidth={1.8} />
						Speak it
					</button>
				</div>
			</div>
			<div style={{ padding: "0 24px" }}>
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
					Earlier
				</div>
				{JOURNAL.map((j, i) => (
					<div
						key={j.id}
						style={{
							position: "relative",
							paddingLeft: 20,
							paddingBottom: 22,
							borderLeft:
								i < JOURNAL.length - 1 ? `1px solid ${p.line}` : "none",
							marginLeft: 4,
						}}
					>
						<div
							style={{
								position: "absolute",
								left: -5,
								top: 6,
								width: 8,
								height: 8,
								borderRadius: 4,
								background: p.inkMid,
								border: `2px solid ${p.bg}`,
							}}
						/>
						<div
							style={{
								fontFamily: t.mono,
								fontSize: 10.5,
								color: p.inkDim,
								marginBottom: 5,
								letterSpacing: "0.04em",
							}}
						>
							{j.date}
						</div>
						<div
							style={{
								fontFamily: t.editorial,
								fontStyle: t.editorialItalic ? "italic" : "normal",
								fontWeight: t.editorialItalic ? 400 : 500,
								fontSize: 15,
								lineHeight: 1.4,
								color: p.ink,
								textWrap: "pretty",
							}}
						>
							{j.text}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

export function Profile({
	p,
	t,
	tweaks,
}: {
	p: Palette;
	t: TypePairing;
	tweaks: Tweaks;
}) {
	if (tweaks.profileStyle === "stats") return <ProfileStatsView p={p} t={t} />;
	if (tweaks.profileStyle === "journal")
		return <ProfileJournalView p={p} t={t} />;
	return <ProfileIdentityView p={p} t={t} />;
}
