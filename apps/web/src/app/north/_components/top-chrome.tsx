import type { Palette, TypePairing } from "../_lib/tokens";
import { Icon } from "./icon";

export type TabId =
	| "forYou"
	| "opportunities"
	| "mission"
	| "signal"
	| "profile";

export const TABS: {
	id: TabId;
	label: string;
	icon: Parameters<typeof Icon>[0]["name"];
	center?: boolean;
}[] = [
	{ id: "forYou", label: "For You", icon: "forYou" },
	{ id: "opportunities", label: "Open", icon: "opportunities" },
	{ id: "mission", label: "Mission", icon: "mission", center: true },
	{ id: "signal", label: "Signal", icon: "signal" },
	{ id: "profile", label: "You", icon: "profile" },
];

export function TopChrome({
	p,
	t,
	tab,
	onRestart,
}: {
	p: Palette;
	t: TypePairing;
	tab: TabId;
	onRestart: () => void;
}) {
	const greet =
		tab === "forYou"
			? "Hey Jordayne"
			: tab === "mission"
				? "Today"
				: tab === "signal"
					? "How it’s going"
					: tab === "opportunities"
						? "Worth a look"
						: tab === "profile"
							? "You"
							: "";
	return (
		<div
			style={{
				position: "absolute",
				top: 0,
				left: 0,
				right: 0,
				padding: "14px 22px 12px 22px",
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				zIndex: 10,
				background: `linear-gradient(180deg, ${p.bg} 0%, ${p.bg}f0 70%, transparent 100%)`,
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
				<div
					style={{
						width: 28,
						height: 28,
						borderRadius: 14,
						border: `1.25px solid ${p.accent}`,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						background: p.accentSoft,
					}}
				>
					<div
						style={{
							width: 8,
							height: 8,
							borderRadius: 4,
							background: p.accent,
						}}
					/>
				</div>
				<div
					style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}
				>
					<span
						style={{
							fontFamily: t.ui,
							fontSize: 9.5,
							color: p.inkDim,
							letterSpacing: "0.16em",
							textTransform: "uppercase",
							fontWeight: 500,
						}}
					>
						north
					</span>
					<span
						style={{
							fontFamily: t.display,
							fontWeight: t.displayWeight,
							letterSpacing: t.displayTracking,
							fontStyle: t.editorialItalic ? "italic" : "normal",
							fontSize: 15,
							color: p.ink,
							marginTop: 1,
						}}
					>
						{greet}
					</span>
				</div>
			</div>
			<button
				type="button"
				onClick={onRestart}
				title="Restart onboarding"
				style={{
					background: "transparent",
					border: `1px solid ${p.line}`,
					borderRadius: 999,
					padding: "6px 11px",
					cursor: "pointer",
					color: p.inkMid,
					fontFamily: t.ui,
					fontSize: 11,
					fontWeight: 500,
					letterSpacing: "0.02em",
					display: "inline-flex",
					alignItems: "center",
					gap: 5,
				}}
			>
				<Icon name="leaf" size={11} stroke={p.inkMid} strokeWidth={1.6} />
				Restart
			</button>
		</div>
	);
}

export function BottomNav({
	p,
	t,
	tab,
	setTab,
}: {
	p: Palette;
	t: TypePairing;
	tab: TabId;
	setTab: (id: TabId) => void;
}) {
	return (
		<div
			style={{
				position: "absolute",
				bottom: 0,
				left: 0,
				right: 0,
				paddingBottom: 24,
				paddingTop: 6,
				background: `linear-gradient(0deg, ${p.bg} 50%, transparent 100%)`,
				zIndex: 10,
			}}
		>
			<div
				style={{
					margin: "0 12px",
					padding: "10px 6px",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-around",
					borderRadius: 22,
					background: `${p.surface}cc`,
					backdropFilter: "blur(20px) saturate(180%)",
					WebkitBackdropFilter: "blur(20px) saturate(180%)",
					border: `1px solid ${p.line}`,
				}}
			>
				{TABS.map((nav) => {
					const active = tab === nav.id;
					if (nav.center) {
						return (
							<button
								type="button"
								key={nav.id}
								onClick={() => setTab(nav.id)}
								style={{
									background: active
										? p.accent
										: `linear-gradient(135deg, ${p.accent}, ${p.accent}cc)`,
									border: "none",
									cursor: "pointer",
									padding: 0,
									width: 50,
									height: 50,
									borderRadius: 25,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									marginTop: -16,
									boxShadow: `0 4px 14px ${p.accent}55`,
								}}
							>
								<Icon
									name={nav.icon}
									size={22}
									stroke={p.accentInk}
									strokeWidth={1.8}
								/>
							</button>
						);
					}
					return (
						<button
							type="button"
							key={nav.id}
							onClick={() => setTab(nav.id)}
							style={{
								background: "transparent",
								border: "none",
								cursor: "pointer",
								padding: "6px 10px",
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								gap: 4,
							}}
						>
							<Icon
								name={nav.icon}
								size={20}
								stroke={active ? p.accent : p.inkMid}
								strokeWidth={1.6}
							/>
							<span
								style={{
									fontFamily: t.ui,
									fontSize: 10,
									fontWeight: active ? 600 : 500,
									color: active ? p.accent : p.inkMid,
									letterSpacing: "0.02em",
									whiteSpace: "nowrap",
								}}
							>
								{nav.label}
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
