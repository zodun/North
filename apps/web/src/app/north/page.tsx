"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { ForYou } from "./_components/for-you";
import { IOSDevice } from "./_components/ios-device";
import { Mission } from "./_components/mission";
import { Onboarding } from "./_components/onboarding";
import { Opportunities } from "./_components/opportunities";
import { Profile } from "./_components/profile";
import { Signal } from "./_components/signal";
import { BottomNav, type TabId, TopChrome } from "./_components/top-chrome";
import { getTokens, type Tweaks } from "./_lib/tokens";

const TWEAK_DEFAULTS: Tweaks = {
	palette: "warm",
	typePair: "humanist",
	density: "calm",
	onboardingStyle: "oneQ",
	forYouStyle: "fullBleed",
	missionStyle: "ritual",
	signalStyle: "narrative",
	streakStyle: "both",
	opportunitiesStyle: "match",
	profileStyle: "identity",
	showConsistency: true,
};

function ScaledFrame({
	children,
	designW = 402,
	designH = 874,
}: {
	children: ReactNode;
	designW?: number;
	designH?: number;
}) {
	const wrapRef = useRef<HTMLDivElement>(null);
	const [scale, setScale] = useState(1);
	useEffect(() => {
		const calc = () => {
			const w = window.innerWidth;
			const h = window.innerHeight;
			const margin = 80;
			const s = Math.min((w - margin) / designW, (h - margin) / designH, 1);
			setScale(s);
		};
		calc();
		window.addEventListener("resize", calc);
		return () => window.removeEventListener("resize", calc);
	}, [designW, designH]);
	return (
		<div
			ref={wrapRef}
			style={{
				position: "absolute",
				top: "50%",
				left: "50%",
				transform: `translate(-50%, -50%) scale(${scale})`,
				transformOrigin: "center center",
			}}
		>
			{children}
		</div>
	);
}

export default function NorthPage() {
	const tweaks = TWEAK_DEFAULTS;
	const { p, t } = getTokens(tweaks.palette, tweaks.typePair, tweaks.density);

	const [tab, setTab] = useState<TabId>("forYou");
	const [showOnboarding, setShowOnboarding] = useState(false);
	const [savedSet, setSavedSet] = useState<Set<string>>(() => new Set());
	const [mattersSet, setMattersSet] = useState<Set<string>>(
		() => new Set(["f1"]),
	);

	const onSave = (id: string) =>
		setSavedSet((s) => {
			const n = new Set(s);
			if (n.has(id)) n.delete(id);
			else n.add(id);
			return n;
		});
	const onMatters = (id: string) =>
		setMattersSet((s) => {
			const n = new Set(s);
			if (n.has(id)) n.delete(id);
			else n.add(id);
			return n;
		});
	const onRestart = () => setShowOnboarding(true);

	const backdrop =
		p.mode === "dark"
			? `radial-gradient(ellipse 80% 60% at 50% 30%, ${p.accentSoft}, transparent 60%), radial-gradient(ellipse 90% 70% at 50% 35%, ${p.surface} 0%, ${p.bg} 50%, #08070a 110%)`
			: `radial-gradient(ellipse 75% 60% at 50% 30%, ${p.accentSoft}, transparent 60%), radial-gradient(ellipse 80% 60% at 50% 30%, #ffffff 0%, ${p.bg} 80%)`;

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				background: backdrop,
				overflow: "hidden",
				fontFamily: t.ui,
			}}
		>
			<div
				style={{
					position: "fixed",
					top: 18,
					left: 24,
					fontFamily: t.ui,
					fontSize: 10.5,
					letterSpacing: "0.18em",
					textTransform: "uppercase",
					color:
						p.mode === "dark" ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)",
					fontWeight: 500,
					pointerEvents: "none",
				}}
			>
				Prototype · North
			</div>
			<ScaledFrame designW={402} designH={874}>
				<IOSDevice dark={p.mode === "dark"}>
					<div
						style={{
							position: "absolute",
							inset: 0,
							background: p.bg,
							color: p.ink,
							overflow: "hidden",
						}}
					>
						{showOnboarding ? (
							<Onboarding
								p={p}
								t={t}
								tweaks={tweaks}
								onFinish={() => setShowOnboarding(false)}
							/>
						) : (
							<>
								<TopChrome p={p} t={t} tab={tab} onRestart={onRestart} />
								<div
									style={{
										position: "absolute",
										inset: 0,
										background: p.bg,
										color: p.ink,
									}}
								>
									{tab === "forYou" && (
										<ForYou
											p={p}
											t={t}
											tweaks={tweaks}
											savedSet={savedSet}
											mattersSet={mattersSet}
											onSave={onSave}
											onMatters={onMatters}
										/>
									)}
									{tab === "opportunities" && (
										<Opportunities p={p} t={t} tweaks={tweaks} />
									)}
									{tab === "mission" && <Mission p={p} t={t} tweaks={tweaks} />}
									{tab === "signal" && <Signal p={p} t={t} tweaks={tweaks} />}
									{tab === "profile" && <Profile p={p} t={t} tweaks={tweaks} />}
								</div>
								<BottomNav p={p} t={t} tab={tab} setTab={setTab} />
							</>
						)}
					</div>
				</IOSDevice>
			</ScaledFrame>
		</div>
	);
}
