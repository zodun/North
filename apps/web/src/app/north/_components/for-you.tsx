"use client";

import { useEffect, useRef, useState } from "react";
import { FEED, type FeedItem, FOCUS_AREAS } from "../_lib/data";
import {
	easings,
	type Palette,
	type Tweaks,
	type TypePairing,
} from "../_lib/tokens";
import { Icon, type IconName } from "./icon";

type CommonProps = {
	p: Palette;
	t: TypePairing;
	savedSet: Set<string>;
	mattersSet: Set<string>;
	onSave: (id: string) => void;
	onMatters: (id: string) => void;
};

function FeedAction({
	icon,
	label,
	active,
	count,
	p,
	t,
	onClick,
}: {
	icon: IconName;
	label: string;
	active?: boolean;
	count?: number;
	p: Palette;
	t: TypePairing;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			style={{
				background: "transparent",
				border: "none",
				padding: 0,
				cursor: "pointer",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: 5,
				color: active ? p.accent : p.ink,
			}}
		>
			<div
				style={{
					width: 46,
					height: 46,
					borderRadius: 23,
					background: active ? p.accentSoft : "rgba(255,255,255,0.06)",
					border: `1px solid ${active ? p.accent : "rgba(255,255,255,0.10)"}`,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					transition: `all 200ms ${easings.calm}`,
				}}
			>
				<Icon
					name={icon}
					size={20}
					stroke={active ? p.accent : p.ink}
					strokeWidth={1.6}
				/>
			</div>
			<span
				style={{
					fontFamily: t.ui,
					fontSize: 10.5,
					fontWeight: 500,
					letterSpacing: "0.02em",
					color: active ? p.accent : p.inkMid,
					whiteSpace: "nowrap",
				}}
			>
				{count != null ? count : label}
			</span>
		</button>
	);
}

function MatchPill({
	value,
	p,
	t,
}: {
	value: number;
	p: Palette;
	t: TypePairing;
}) {
	const pct = Math.round(value * 100);
	return (
		<div
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: 6,
				padding: "4px 9px 4px 7px",
				borderRadius: 999,
				background: p.accentSoft,
				border: `1px solid ${p.accent}33`,
			}}
		>
			<div
				style={{ width: 6, height: 6, borderRadius: 3, background: p.accent }}
			/>
			<span
				style={{
					fontFamily: t.mono,
					fontSize: 10.5,
					fontWeight: 500,
					color: p.accent,
					letterSpacing: "0.02em",
					whiteSpace: "nowrap",
				}}
			>
				{pct}% match
			</span>
		</div>
	);
}

function KindBadge({
	kind,
	p,
	t,
}: {
	kind: FeedItem["kind"];
	p: Palette;
	t: TypePairing;
}) {
	const map: Record<FeedItem["kind"], { icon: IconName; label: string }> = {
		essay: { icon: "book", label: "Read" },
		voice: { icon: "voice", label: "Listen" },
		story: { icon: "play", label: "Story" },
		opportunity: { icon: "sparkle", label: "Open" },
	};
	const it = map[kind];
	return (
		<div
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: 6,
				padding: "5px 10px",
				borderRadius: 999,
				background: "rgba(255,255,255,0.06)",
				border: `1px solid ${p.line}`,
			}}
		>
			<Icon name={it.icon} size={12} stroke={p.ink} strokeWidth={1.6} />
			<span
				style={{
					fontFamily: t.ui,
					fontSize: 10.5,
					fontWeight: 500,
					color: p.ink,
				}}
			>
				{it.label}
			</span>
		</div>
	);
}

function FeedHero({ p, focusHue }: { p: Palette; focusHue: string }) {
	return (
		<div
			style={{
				position: "absolute",
				inset: 0,
				background: `
          radial-gradient(ellipse 140% 80% at 50% 110%, ${focusHue}88 0%, ${focusHue}22 40%, transparent 70%),
          radial-gradient(ellipse 90% 60% at 85% -10%, ${focusHue}55 0%, transparent 55%),
          radial-gradient(ellipse 60% 40% at 0% 30%, ${focusHue}33 0%, transparent 55%),
          linear-gradient(180deg, ${p.bg} 0%, ${p.surface} 100%)
        `,
			}}
		>
			<div
				style={{
					position: "absolute",
					inset: 0,
					opacity: 0.06,
					mixBlendMode: "overlay",
					backgroundImage:
						"radial-gradient(circle at 25% 25%, #fff 0.5px, transparent 0.5px), radial-gradient(circle at 75% 75%, #fff 0.5px, transparent 0.5px)",
					backgroundSize: "4px 4px",
				}}
			/>
		</div>
	);
}

function ForYouFullBleed({
	items,
	p,
	t,
	savedSet,
	mattersSet,
	onSave,
	onMatters,
}: CommonProps & { items: FeedItem[] }) {
	const [index, setIndex] = useState(0);
	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		const onScroll = () => {
			const i = Math.round(el.scrollTop / el.clientHeight);
			if (i !== index) setIndex(i);
		};
		el.addEventListener("scroll", onScroll, { passive: true });
		return () => el.removeEventListener("scroll", onScroll);
	}, [index]);

	const hueOf = (tag: string) =>
		FOCUS_AREAS.find((f) => f.id === tag)?.hue ?? p.accent;

	return (
		<div
			ref={scrollRef}
			style={{
				position: "absolute",
				inset: 0,
				overflowY: "auto",
				scrollSnapType: "y mandatory",
				scrollbarWidth: "none",
			}}
		>
			{items.map((item, i) => {
				const hue = hueOf(item.tag);
				return (
					<div
						key={item.id}
						style={{
							position: "relative",
							height: "100%",
							minHeight: "100%",
							scrollSnapAlign: "start",
							scrollSnapStop: "always",
							display: "flex",
							flexDirection: "column",
						}}
					>
						<FeedHero p={p} focusHue={hue} />
						<div
							style={{
								position: "relative",
								flex: 1,
								display: "flex",
								flexDirection: "column",
								padding: "88px 80px 130px 26px",
							}}
						>
							<div
								style={{
									display: "flex",
									gap: 8,
									alignItems: "center",
									marginBottom: 18,
								}}
							>
								<KindBadge kind={item.kind} p={p} t={t} />
								<MatchPill value={item.match} p={p} t={t} />
							</div>
							<div
								style={{
									fontFamily: t.ui,
									fontSize: 12,
									letterSpacing: "0",
									color: p.inkMid,
									fontWeight: 500,
								}}
							>
								{item.eyebrow}
							</div>
							<div
								style={{
									marginTop: 22,
									padding: "14px 16px",
									background: "rgba(255,255,255,0.04)",
									borderRadius: 14,
									border: `1px solid ${p.line}`,
									backdropFilter: "blur(6px)",
									WebkitBackdropFilter: "blur(6px)",
									fontFamily: t.ui,
									fontSize: 12,
									color: p.ink,
									lineHeight: 1.45,
									maxWidth: 280,
									textWrap: "pretty",
								}}
							>
								<span
									style={{
										color: p.accent,
										fontWeight: 600,
										letterSpacing: "0.02em",
									}}
								>
									Why this:
								</span>{" "}
								{item.reason}
							</div>
							<div style={{ flex: 1, minHeight: 36 }} />
							<h2
								style={{
									fontFamily: t.display,
									fontWeight: t.displayWeight,
									letterSpacing: t.displayTracking,
									fontStyle: t.editorialItalic ? "italic" : "normal",
									fontSize: 30,
									lineHeight: 1.25,
									color: p.ink,
									margin: "0 0 36px 0",
									minHeight: 110,
								}}
							>
								{item.title}
							</h2>
							<p
								style={{
									fontFamily: t.ui,
									fontSize: 15.5,
									lineHeight: 1.55,
									color: p.inkMid,
									margin: "0 0 22px 0",
									fontWeight: 400,
								}}
							>
								{item.body}
							</p>
							<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
								<div
									style={{
										width: 22,
										height: 22,
										borderRadius: 11,
										background: `${hue}44`,
										border: `1px solid ${hue}88`,
									}}
								/>
								<span
									style={{
										fontFamily: t.ui,
										fontSize: 13,
										color: p.ink,
										fontWeight: 500,
									}}
								>
									{item.source}
								</span>
								<span
									style={{ fontFamily: t.ui, fontSize: 13, color: p.inkDim }}
								>
									·
								</span>
								<button
									type="button"
									style={{
										background: "transparent",
										border: "none",
										cursor: "pointer",
										color: p.accent,
										fontFamily: t.ui,
										fontSize: 13,
										fontWeight: 600,
										padding: 0,
										display: "inline-flex",
										alignItems: "center",
										gap: 4,
									}}
								>
									Open{" "}
									<Icon
										name="arrowRight"
										size={13}
										stroke={p.accent}
										strokeWidth={2}
									/>
								</button>
							</div>
						</div>
						<div
							style={{
								position: "absolute",
								right: 14,
								bottom: 150,
								display: "flex",
								flexDirection: "column",
								gap: 16,
							}}
						>
							<FeedAction
								icon="matters"
								label="Matters"
								active={mattersSet.has(item.id)}
								p={p}
								t={t}
								onClick={() => onMatters(item.id)}
							/>
							<FeedAction
								icon="save"
								label="Save"
								active={savedSet.has(item.id)}
								p={p}
								t={t}
								onClick={() => onSave(item.id)}
							/>
							<FeedAction
								icon="pass"
								label="Not now"
								p={p}
								t={t}
								onClick={() => {}}
							/>
							<FeedAction
								icon="share"
								label="Share"
								p={p}
								t={t}
								onClick={() => {}}
							/>
						</div>
						<div
							style={{
								position: "absolute",
								top: 80,
								right: 18,
								display: "flex",
								flexDirection: "column",
								gap: 5,
							}}
						>
							{items.map((other, j) => (
								<div
									key={other.id}
									style={{
										width: 3,
										height: j === i ? 14 : 3,
										borderRadius: 2,
										background: j === i ? p.ink : p.inkDim,
										transition: `all 220ms ${easings.calm}`,
									}}
								/>
							))}
						</div>
					</div>
				);
			})}
		</div>
	);
}

function ForYouCardStack({
	items,
	p,
	t,
	savedSet,
	mattersSet,
	onSave,
	onMatters,
}: CommonProps & { items: FeedItem[] }) {
	const hueOf = (tag: string) =>
		FOCUS_AREAS.find((f) => f.id === tag)?.hue ?? p.accent;
	return (
		<div
			style={{
				position: "absolute",
				inset: 0,
				overflowY: "auto",
				padding: "76px 16px 110px 16px",
			}}
		>
			<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
				{items.map((item) => {
					const hue = hueOf(item.tag);
					return (
						<article
							key={item.id}
							style={{
								position: "relative",
								borderRadius: 22,
								overflow: "hidden",
								background: p.surface,
								border: `1px solid ${p.line}`,
								padding: "20px 20px 18px 20px",
							}}
						>
							<div
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									right: 0,
									height: 2,
									background: `linear-gradient(90deg, ${hue}, transparent)`,
								}}
							/>
							<div
								style={{
									display: "flex",
									gap: 8,
									alignItems: "center",
									marginBottom: 10,
								}}
							>
								<KindBadge kind={item.kind} p={p} t={t} />
								<MatchPill value={item.match} p={p} t={t} />
								<div style={{ flex: 1 }} />
								<span
									style={{
										fontFamily: t.ui,
										fontSize: 11,
										color: p.inkDim,
										letterSpacing: "0.08em",
										textTransform: "uppercase",
									}}
								>
									{item.eyebrow.split("·")[1] || ""}
								</span>
							</div>
							<h3
								style={{
									fontFamily: t.display,
									fontWeight: t.displayWeight,
									letterSpacing: t.displayTracking,
									fontStyle: t.editorialItalic ? "italic" : "normal",
									fontSize: 22,
									lineHeight: 1.28,
									color: p.ink,
									margin: "0 0 8px 0",
								}}
							>
								{item.title}
							</h3>
							<p
								style={{
									fontFamily: t.ui,
									fontSize: 13.5,
									lineHeight: 1.5,
									color: p.inkMid,
									margin: "0 0 14px 0",
									textWrap: "pretty",
								}}
							>
								{item.body}
							</p>
							<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: 8,
										flex: 1,
									}}
								>
									<div
										style={{
											width: 18,
											height: 18,
											borderRadius: 9,
											background: `${hue}44`,
											border: `1px solid ${hue}88`,
										}}
									/>
									<span
										style={{ fontFamily: t.ui, fontSize: 12, color: p.inkMid }}
									>
										{item.source}
									</span>
								</div>
								<button
									type="button"
									onClick={() => onMatters(item.id)}
									style={{
										background: mattersSet.has(item.id)
											? p.accentSoft
											: "transparent",
										border: `1px solid ${mattersSet.has(item.id) ? p.accent : p.line}`,
										borderRadius: 999,
										padding: "6px 10px",
										cursor: "pointer",
										color: mattersSet.has(item.id) ? p.accent : p.inkMid,
										fontFamily: t.ui,
										fontSize: 11.5,
										fontWeight: 500,
										display: "inline-flex",
										alignItems: "center",
										gap: 5,
									}}
								>
									<Icon
										name="matters"
										size={12}
										stroke="currentColor"
										strokeWidth={1.8}
									/>{" "}
									Matters
								</button>
								<button
									type="button"
									onClick={() => onSave(item.id)}
									style={{
										background: "transparent",
										border: `1px solid ${savedSet.has(item.id) ? p.accent : p.line}`,
										borderRadius: 999,
										padding: "6px 10px",
										cursor: "pointer",
										color: savedSet.has(item.id) ? p.accent : p.inkMid,
										display: "inline-flex",
										alignItems: "center",
										gap: 5,
										fontFamily: t.ui,
										fontSize: 11.5,
										fontWeight: 500,
									}}
								>
									<Icon
										name="save"
										size={12}
										stroke="currentColor"
										strokeWidth={1.8}
									/>{" "}
									Save
								</button>
							</div>
						</article>
					);
				})}
			</div>
		</div>
	);
}

function ForYouHybrid({ items, p, t }: CommonProps & { items: FeedItem[] }) {
	const [hero, ...rest] = items;
	if (!hero) return null;
	const hueOf = (tag: string) =>
		FOCUS_AREAS.find((f) => f.id === tag)?.hue ?? p.accent;
	const heroHue = hueOf(hero.tag);
	return (
		<div
			style={{
				position: "absolute",
				inset: 0,
				overflowY: "auto",
				paddingBottom: 100,
			}}
		>
			<div
				style={{
					position: "relative",
					height: 480,
					overflow: "hidden",
					background: `
            radial-gradient(ellipse 120% 60% at 50% 110%, ${heroHue}50 0%, transparent 60%),
            linear-gradient(180deg, ${p.bg} 0%, ${p.surface} 100%)
          `,
				}}
			>
				<div
					style={{
						position: "absolute",
						inset: 0,
						padding: "88px 24px 24px 24px",
						display: "flex",
						flexDirection: "column",
						justifyContent: "flex-end",
						gap: 12,
					}}
				>
					<div style={{ display: "flex", gap: 8 }}>
						<KindBadge kind={hero.kind} p={p} t={t} />
						<MatchPill value={hero.match} p={p} t={t} />
					</div>
					<h2
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
						{hero.title}
					</h2>
					<p
						style={{
							fontFamily: t.ui,
							fontSize: 14,
							lineHeight: 1.5,
							color: p.inkMid,
							margin: 0,
						}}
					>
						{hero.body}
					</p>
				</div>
			</div>
			<div
				style={{
					padding: "16px 16px 0 16px",
					display: "flex",
					flexDirection: "column",
					gap: 12,
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
						padding: "4px 0",
					}}
				>
					More for you
				</div>
				{rest.map((item) => {
					const hue = hueOf(item.tag);
					return (
						<article
							key={item.id}
							style={{
								borderRadius: 18,
								background: p.surface,
								border: `1px solid ${p.line}`,
								padding: "14px 16px",
								display: "flex",
								gap: 12,
								alignItems: "flex-start",
							}}
						>
							<div
								style={{
									width: 4,
									alignSelf: "stretch",
									borderRadius: 2,
									background: hue,
									opacity: 0.7,
								}}
							/>
							<div style={{ flex: 1, minWidth: 0 }}>
								<div
									style={{
										fontFamily: t.ui,
										fontSize: 10.5,
										letterSpacing: "0.14em",
										textTransform: "uppercase",
										color: p.inkDim,
										marginBottom: 4,
									}}
								>
									{item.eyebrow}
								</div>
								<div
									style={{
										fontFamily: t.display,
										fontWeight: t.displayWeight,
										letterSpacing: t.displayTracking,
										fontStyle: t.editorialItalic ? "italic" : "normal",
										fontSize: 16.5,
										lineHeight: 1.25,
										color: p.ink,
									}}
								>
									{item.title}
								</div>
							</div>
							<div
								style={{ fontFamily: t.mono, fontSize: 11, color: p.accent }}
							>
								{Math.round(item.match * 100)}%
							</div>
						</article>
					);
				})}
			</div>
		</div>
	);
}

export function ForYou({
	p,
	t,
	tweaks,
	savedSet,
	mattersSet,
	onSave,
	onMatters,
}: CommonProps & { tweaks: Tweaks }) {
	const items = FEED;
	if (tweaks.forYouStyle === "card")
		return (
			<ForYouCardStack
				items={items}
				p={p}
				t={t}
				savedSet={savedSet}
				mattersSet={mattersSet}
				onSave={onSave}
				onMatters={onMatters}
			/>
		);
	if (tweaks.forYouStyle === "hybrid")
		return (
			<ForYouHybrid
				items={items}
				p={p}
				t={t}
				savedSet={savedSet}
				mattersSet={mattersSet}
				onSave={onSave}
				onMatters={onMatters}
			/>
		);
	return (
		<ForYouFullBleed
			items={items}
			p={p}
			t={t}
			savedSet={savedSet}
			mattersSet={mattersSet}
			onSave={onSave}
			onMatters={onMatters}
		/>
	);
}
