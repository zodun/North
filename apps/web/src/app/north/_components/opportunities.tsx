"use client";

import { FOCUS_AREAS, OPPORTUNITIES, type Opportunity } from "../_lib/data";
import type { Palette, Tweaks, TypePairing } from "../_lib/tokens";
import { Icon } from "./icon";

function MatchBar({
	value,
	p,
	accent,
	width = 60,
}: {
	value: number;
	p: Palette;
	accent: string;
	width?: number;
}) {
	const segs = 5;
	return (
		<div style={{ display: "flex", gap: 2, width }}>
			{Array.from({ length: segs }).map((_, i) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: fixed-size visual indicator
					key={i}
					style={{
						flex: 1,
						height: 5,
						borderRadius: 1.5,
						background: i < Math.round(value * segs) ? accent : p.line,
					}}
				/>
			))}
		</div>
	);
}

function OpportunityListView({
	p,
	t,
	items,
}: {
	p: Palette;
	t: TypePairing;
	items: Opportunity[];
}) {
	return (
		<div
			style={{
				position: "absolute",
				inset: 0,
				overflowY: "auto",
				padding: "88px 0 120px 0",
			}}
		>
			<div style={{ padding: "0 24px", marginBottom: 18 }}>
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
					This week, hand-picked
				</div>
				<h1
					style={{
						fontFamily: t.display,
						fontWeight: t.displayWeight,
						letterSpacing: t.displayTracking,
						fontStyle: t.editorialItalic ? "italic" : "normal",
						fontSize: 30,
						lineHeight: 1.22,
						color: p.ink,
						margin: "0 0 8px 0",
					}}
				>
					Five things worth considering.
				</h1>
				<p
					style={{
						fontFamily: t.ui,
						fontSize: 14,
						lineHeight: 1.5,
						color: p.inkMid,
						margin: 0,
					}}
				>
					Curated against what you said matters. No paid placements, ever.
				</p>
			</div>
			<div
				style={{
					padding: "0 16px",
					display: "flex",
					flexDirection: "column",
					gap: 10,
				}}
			>
				{items.map((o) => (
					<button
						type="button"
						key={o.id}
						style={{
							display: "block",
							textAlign: "left",
							cursor: "pointer",
							padding: "16px",
							borderRadius: 18,
							background: p.surface,
							border: `1px solid ${p.line}`,
							width: "100%",
						}}
					>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "baseline",
								marginBottom: 8,
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
								}}
							>
								{o.type} · {o.org}
							</div>
							<div style={{ display: "flex", alignItems: "center", gap: 6 }}>
								<MatchBar value={o.match} p={p} accent={p.accent} width={50} />
								<span
									style={{
										fontFamily: t.mono,
										fontSize: 10.5,
										color: p.accent,
									}}
								>
									{Math.round(o.match * 100)}%
								</span>
							</div>
						</div>
						<div
							style={{
								fontFamily: t.display,
								fontWeight: t.displayWeight,
								letterSpacing: t.displayTracking,
								fontStyle: t.editorialItalic ? "italic" : "normal",
								fontSize: 18,
								lineHeight: 1.2,
								color: p.ink,
								marginBottom: 8,
							}}
						>
							{o.title}
						</div>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: 10,
								marginBottom: 10,
							}}
						>
							<span style={{ fontFamily: t.ui, fontSize: 12, color: p.inkMid }}>
								{o.location}
							</span>
							<span
								style={{
									width: 3,
									height: 3,
									borderRadius: 1.5,
									background: p.inkDim,
								}}
							/>
							<span style={{ fontFamily: t.ui, fontSize: 12, color: p.inkMid }}>
								by {o.deadline}
							</span>
						</div>
						<div
							style={{
								fontFamily: t.ui,
								fontSize: 12.5,
								color: p.inkMid,
								lineHeight: 1.4,
								padding: "10px 12px",
								borderRadius: 10,
								background: p.accentSoft,
								border: `1px solid ${p.accent}22`,
							}}
						>
							<span style={{ color: p.accent, fontWeight: 600 }}>Why:</span>{" "}
							{o.why}
						</div>
					</button>
				))}
			</div>
		</div>
	);
}

function OpportunityMatchView({
	p,
	t,
	items,
}: {
	p: Palette;
	t: TypePairing;
	items: Opportunity[];
}) {
	const sorted = [...items].sort((a, b) => b.match - a.match);
	const top = sorted[0];
	const rest = sorted.slice(1);
	if (!top) return null;
	return (
		<div
			style={{
				position: "absolute",
				inset: 0,
				overflowY: "auto",
				padding: "88px 0 120px 0",
			}}
		>
			<div style={{ padding: "0 24px", marginBottom: 14 }}>
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
					Best match this week
				</div>
			</div>
			<div style={{ padding: "0 16px", marginBottom: 24 }}>
				<button
					type="button"
					style={{
						width: "100%",
						textAlign: "left",
						cursor: "pointer",
						padding: "28px 24px",
						borderRadius: 24,
						background: `linear-gradient(165deg, ${p.accentSoft}, transparent 70%), ${p.surface}`,
						border: `1px solid ${p.accent}44`,
					}}
				>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "flex-start",
							marginBottom: 16,
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
							}}
						>
							{Math.round(top.match * 100)}% match
						</div>
						<div style={{ fontFamily: t.ui, fontSize: 11, color: p.inkDim }}>
							by {top.deadline}
						</div>
					</div>
					<div
						style={{
							fontFamily: t.display,
							fontWeight: t.displayWeight,
							letterSpacing: t.displayTracking,
							fontStyle: t.editorialItalic ? "italic" : "normal",
							fontSize: 26,
							lineHeight: 1.22,
							color: p.ink,
							marginBottom: 10,
						}}
					>
						{top.title}
					</div>
					<div
						style={{
							fontFamily: t.ui,
							fontSize: 13,
							color: p.inkMid,
							marginBottom: 14,
						}}
					>
						{top.org} · {top.location}
					</div>
					<div
						style={{
							fontFamily: t.ui,
							fontSize: 13,
							color: p.inkMid,
							lineHeight: 1.45,
							marginBottom: 16,
							textWrap: "pretty",
						}}
					>
						{top.why}
					</div>
					<div style={{ display: "flex", gap: 6 }}>
						{top.tags.map((tag) => (
							<span
								key={tag}
								style={{
									fontFamily: t.ui,
									fontSize: 10.5,
									color: p.inkMid,
									padding: "4px 9px",
									borderRadius: 999,
									background: "transparent",
									border: `1px solid ${p.lineHi}`,
									letterSpacing: "0.02em",
								}}
							>
								{tag}
							</span>
						))}
					</div>
				</button>
			</div>
			<div style={{ padding: "0 24px", marginBottom: 10 }}>
				<div
					style={{
						fontFamily: t.ui,
						fontSize: 11,
						letterSpacing: "0.18em",
						textTransform: "uppercase",
						color: p.inkDim,
						fontWeight: 500,
					}}
				>
					Also worth a look
				</div>
			</div>
			<div
				style={{ padding: "0 16px", display: "flex", flexDirection: "column" }}
			>
				{rest.map((o, i) => (
					<button
						type="button"
						key={o.id}
						style={{
							display: "flex",
							alignItems: "center",
							gap: 14,
							cursor: "pointer",
							padding: "14px 8px",
							background: "transparent",
							border: "none",
							borderBottom:
								i < rest.length - 1 ? `1px solid ${p.line}` : "none",
							textAlign: "left",
							width: "100%",
						}}
					>
						<div
							style={{
								width: 40,
								height: 40,
								borderRadius: 10,
								background: p.surface,
								border: `1px solid ${p.line}`,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontFamily: t.mono,
								fontSize: 12,
								color: p.accent,
								fontWeight: 500,
							}}
						>
							{Math.round(o.match * 100)}
						</div>
						<div style={{ flex: 1, minWidth: 0 }}>
							<div
								style={{
									fontFamily: t.ui,
									fontSize: 13.5,
									color: p.ink,
									fontWeight: 500,
									marginBottom: 2,
								}}
							>
								{o.title}
							</div>
							<div
								style={{ fontFamily: t.ui, fontSize: 11.5, color: p.inkDim }}
							>
								{o.org} · by {o.deadline}
							</div>
						</div>
						<Icon name="arrow" size={16} stroke={p.inkDim} strokeWidth={1.6} />
					</button>
				))}
			</div>
		</div>
	);
}

function OpportunityMapView({
	p,
	t,
	items,
}: {
	p: Palette;
	t: TypePairing;
	items: Opportunity[];
}) {
	const focus = FOCUS_AREAS.slice(0, 4);
	const positions = [
		{ x: 50, y: 24 },
		{ x: 22, y: 50 },
		{ x: 76, y: 45 },
		{ x: 36, y: 75 },
		{ x: 70, y: 76 },
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
			<div style={{ padding: "0 24px", marginBottom: 18 }}>
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
					Your opportunity field
				</div>
				<h1
					style={{
						fontFamily: t.display,
						fontWeight: t.displayWeight,
						letterSpacing: t.displayTracking,
						fontStyle: t.editorialItalic ? "italic" : "normal",
						fontSize: 24,
						lineHeight: 1.22,
						color: p.ink,
						margin: 0,
					}}
				>
					Closer means more aligned. Bigger means more open.
				</h1>
			</div>
			<div
				style={{
					margin: "0 16px 18px 16px",
					position: "relative",
					height: 340,
					borderRadius: 22,
					background: p.surface,
					border: `1px solid ${p.line}`,
					overflow: "hidden",
				}}
			>
				{[0.3, 0.6, 0.9].map((r) => (
					<div
						key={`ring-${r}`}
						style={{
							position: "absolute",
							left: "50%",
							top: "50%",
							width: `${r * 100}%`,
							paddingTop: `${r * 100}%`,
							transform: "translate(-50%, -50%)",
							borderRadius: "50%",
							border: `1px dashed ${p.line}`,
						}}
					/>
				))}
				<div
					style={{
						position: "absolute",
						left: "50%",
						top: "50%",
						transform: "translate(-50%, -50%)",
						fontFamily: t.ui,
						fontSize: 10,
						letterSpacing: "0.18em",
						textTransform: "uppercase",
						color: p.inkDim,
					}}
				>
					You
				</div>
				{items.map((o, i) => {
					const pos = positions[i] ?? positions[0];
					if (!pos) return null;
					const size = 60 + Math.round(o.match * 30);
					const hue = focus[i % focus.length]?.hue ?? p.accent;
					return (
						<button
							type="button"
							key={o.id}
							style={{
								position: "absolute",
								left: `${pos.x}%`,
								top: `${pos.y}%`,
								transform: "translate(-50%, -50%)",
								width: size,
								height: size,
								borderRadius: size / 2,
								background: `${hue}22`,
								border: `1.5px solid ${hue}`,
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								cursor: "pointer",
								padding: 6,
								textAlign: "center",
							}}
						>
							<span
								style={{
									fontFamily: t.mono,
									fontSize: 10,
									color: hue,
									fontWeight: 500,
								}}
							>
								{Math.round(o.match * 100)}%
							</span>
							<span
								style={{
									fontFamily: t.ui,
									fontSize: 9.5,
									color: p.ink,
									lineHeight: 1.22,
									marginTop: 2,
								}}
							>
								{o.org}
							</span>
						</button>
					);
				})}
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
						marginBottom: 10,
					}}
				>
					Listed
				</div>
				{items.slice(0, 3).map((o) => (
					<button
						type="button"
						key={o.id}
						style={{
							display: "flex",
							width: "100%",
							alignItems: "center",
							gap: 12,
							padding: "10px 0",
							border: "none",
							background: "transparent",
							cursor: "pointer",
							textAlign: "left",
						}}
					>
						<div
							style={{
								width: 6,
								height: 6,
								borderRadius: 3,
								background: p.accent,
							}}
						/>
						<span
							style={{
								fontFamily: t.ui,
								fontSize: 13,
								color: p.ink,
								fontWeight: 500,
								flex: 1,
							}}
						>
							{o.title}
						</span>
						<span style={{ fontFamily: t.mono, fontSize: 11, color: p.inkDim }}>
							by {o.deadline}
						</span>
					</button>
				))}
			</div>
		</div>
	);
}

export function Opportunities({
	p,
	t,
	tweaks,
}: {
	p: Palette;
	t: TypePairing;
	tweaks: Tweaks;
}) {
	if (tweaks.opportunitiesStyle === "match")
		return <OpportunityMatchView p={p} t={t} items={OPPORTUNITIES} />;
	if (tweaks.opportunitiesStyle === "map")
		return <OpportunityMapView p={p} t={t} items={OPPORTUNITIES} />;
	return <OpportunityListView p={p} t={t} items={OPPORTUNITIES} />;
}
