"use client";

import { colors } from "@/components/product/north-ui";
import { PreferencesSection } from "./preferences-section";

const GOLD = colors.gold;
const TEAL = colors.teal;
const VIOLET = colors.violet;
const GOLD_INK = colors.goldInk;

// 7-segment band: drifting (violet) · finding (teal) · aligned (gold).
const SEGMENTS = [
	{ id: "d1", color: VIOLET },
	{ id: "d2", color: VIOLET },
	{ id: "f1", color: TEAL },
	{ id: "f2", color: TEAL },
	{ id: "a1", color: GOLD },
	{ id: "a2", color: GOLD },
	{ id: "cap", color: "rgba(14,20,32,0.06)" },
];

type Props = {
	displayName: string;
	statementOfIntent: string | null;
	seasonLabel: string | null;
	timeBudgetLabel: string | null;
	goalTitle: string | null;
	goalMonth: string | null;
	goalDone: number;
	goalTotal: number;
	goalUnit: string;
	goalHue: string;
	focusAreas: { id: string; label: string; hue: string }[];
	streaks28: number[];
	dayLabels28: string[];
	rhythmStreak: number;
	tasksCompleted: number;
	tasksTotal: number;
	signalScore: number | null;
	signalBand: string | null;
	signalTrend: "climbing" | "holding" | "easing" | null;
	savedCount: number;
	savedOpportunities: { id: string; title: string; org: string }[];
	isPremium: boolean;
	userId: string;
	careerStage: string | null;
	fields: string[];
	country: string | null;
	openToRemote: boolean;
	openToRelocate: boolean;
};

// Calm section label — readable (WCAG AA) rather than the faint /30.
function Label({ children }: { children: React.ReactNode }) {
	return (
		<p className="mb-3 font-bold text-[#0E1420]/60 text-[10px] uppercase tracking-[0.14em]">
			{children}
		</p>
	);
}

export function ProfileView({
	displayName,
	statementOfIntent,
	seasonLabel,
	timeBudgetLabel,
	goalTitle,
	goalMonth,
	goalDone,
	goalTotal,
	goalUnit,
	focusAreas,
	streaks28,
	dayLabels28,
	rhythmStreak,
	tasksCompleted,
	tasksTotal,
	signalScore,
	signalBand,
	savedCount,
	savedOpportunities,
	isPremium,
	userId,
	careerStage,
	fields,
	country,
	openToRemote,
	openToRelocate,
}: Props) {
	const litCount =
		signalScore != null
			? Math.min(7, Math.max(1, Math.round((signalScore / 100) * 7)))
			: 0;
	const goalPct = goalTotal > 0 ? Math.round((goalDone / goalTotal) * 100) : 0;
	const statement = statementOfIntent ?? seasonLabel;
	const last7Labels = dayLabels28.slice(-7);
	const last7 = streaks28.slice(-7).map((state, i) => ({
		state,
		label: last7Labels[i] ?? "",
		id: `day-${i}`,
	}));

	return (
		<div className="font-jakarta">
			<div className="px-[18px] pt-16 pb-24">
				{/* ── Person ── */}
				<div className="mb-6 flex items-center gap-4">
					<div
						className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
						style={{
							background:
								"linear-gradient(135deg, rgba(245,200,66,0.28), rgba(62,207,191,0.28))",
							border: "1.5px solid rgba(245,200,66,0.28)",
						}}
					>
						<span
							className="font-black text-[22px]"
							style={{ color: GOLD_INK }}
						>
							{displayName[0]?.toUpperCase()}
						</span>
					</div>
					<div className="min-w-0">
						<h1 className="font-black text-[#0E1420] text-[22px] tracking-tight">
							{displayName}
						</h1>
						{timeBudgetLabel && (
							<p className="mt-0.5 text-[#0E1420]/60 text-[12px]">
								{timeBudgetLabel} a day
							</p>
						)}
					</div>
				</div>

				{statement && (
					<p className="mb-7 text-[#0E1420]/70 text-[14px] italic leading-relaxed">
						“{statement}”
					</p>
				)}

				{focusAreas.length > 0 && (
					<div className="mb-10 flex flex-wrap gap-2">
						{focusAreas.map((fa) => (
							<span
								key={fa.id}
								className="rounded-full border px-3 py-1.5 font-bold text-[11px]"
								style={{
									color: "#0E1420",
									backgroundColor: `${fa.hue}24`,
									borderColor: `${fa.hue}55`,
								}}
							>
								{fa.label}
							</span>
						))}
					</div>
				)}

				{/* ── Where you are (signal) — quiet, no card ── */}
				<section className="mb-10">
					<Label>Where you are</Label>
					<div className="mb-3 flex items-baseline justify-between">
						<span className="font-bold text-[#0E1420] text-[16px]">
							{signalBand ?? "Building your signal"}
						</span>
						{signalScore != null && (
							<span className="text-[#0E1420]/60 text-[13px]">
								Score {signalScore}
							</span>
						)}
					</div>
					<div className="flex h-1.5 gap-[3px] overflow-hidden rounded-full">
						{SEGMENTS.map((seg, i) => (
							<div
								key={seg.id}
								className="h-full flex-1 rounded-full"
								style={{
									backgroundColor: seg.color,
									opacity: i === 6 ? 1 : i < litCount ? 1 : 0.2,
								}}
							/>
						))}
					</div>
				</section>

				{/* ── This month — the one focal card ── */}
				{goalTitle && (
					<section className="mb-10">
						<Label>{goalMonth} goal</Label>
						<div
							className="relative overflow-hidden rounded-[18px] border p-5"
							style={{
								borderColor: "rgba(245,200,66,0.22)",
								background:
									"linear-gradient(135deg, rgba(245,200,66,0.10), rgba(245,200,66,0.02))",
							}}
						>
							<span
								aria-hidden="true"
								className="absolute top-0 bottom-0 left-0 w-[3px] rounded-r-[3px]"
								style={{ backgroundColor: GOLD }}
							/>
							<p className="mb-4 font-bold text-[#0E1420] text-[16px] leading-[1.4]">
								{goalTitle}
							</p>
							<div className="mb-2 flex items-center justify-between">
								<span className="text-[#0E1420]/65 text-[12px]">
									{goalDone} of {goalTotal} {goalUnit}
								</span>
								<span
									className="font-bold text-[12px]"
									style={{ color: GOLD_INK }}
								>
									{goalPct}%
								</span>
							</div>
							<div className="h-[5px] overflow-hidden rounded-full bg-[#0E1420]/10">
								<div
									className="h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
									style={{
										width: `${goalPct}%`,
										background: `linear-gradient(90deg, ${GOLD}, ${TEAL})`,
									}}
								/>
							</div>
						</div>
					</section>
				)}

				{/* ── Premium ── */}
				<section className="mb-10">
					<Label>Premium</Label>
					{isPremium ? (
						<div
							className="rounded-[18px] border p-5"
							style={{
								borderColor: "rgba(123,97,255,0.28)",
								background:
									"linear-gradient(135deg, rgba(123,97,255,0.12), rgba(123,97,255,0.02))",
							}}
						>
							<div className="flex items-center justify-between gap-3">
								<div className="min-w-0">
									<p className="font-bold text-[#0E1420] text-[15px]">
										North Premium
									</p>
									<p className="mt-0.5 text-[#0E1420]/65 text-[12px]">
										AI tailors your feed and opportunities to you.
									</p>
								</div>
								<span
									className="shrink-0 rounded-full border px-3 py-1 font-bold text-[10px]"
									style={{
										color: colors.violetInk,
										borderColor: "rgba(123,97,255,0.4)",
										backgroundColor: "rgba(123,97,255,0.14)",
									}}
								>
									Active
								</span>
							</div>
							<a
								href="/api/billing/portal"
								className="mt-4 inline-block cursor-pointer font-semibold text-[#0E1420]/60 text-[12px] underline-offset-2 transition-colors hover:text-[#0E1420]/80 hover:underline motion-reduce:transition-none"
							>
								Manage subscription
							</a>
						</div>
					) : (
						<div
							className="relative overflow-hidden rounded-[18px] border p-5"
							style={{
								borderColor: "rgba(123,97,255,0.28)",
								background:
									"linear-gradient(135deg, rgba(123,97,255,0.12), rgba(123,97,255,0.02))",
							}}
						>
							<span
								aria-hidden="true"
								className="absolute top-0 bottom-0 left-0 w-[3px] rounded-r-[3px]"
								style={{ backgroundColor: VIOLET }}
							/>
							<p className="font-bold text-[#0E1420] text-[16px] leading-[1.4]">
								Make North truly yours
							</p>
							<p className="mt-1.5 text-[#0E1420]/70 text-[13px] leading-relaxed">
								Premium uses AI to rank your feed and opportunities around your
								focus, goal, and interests, with a reason for every pick.
							</p>
							<a
								href="/api/billing/checkout"
								className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-[12px] px-5 py-2.5 font-extrabold text-[#05050E] text-[13px]"
								style={{ backgroundColor: GOLD }}
							>
								Upgrade to Premium
							</a>
						</div>
					)}
				</section>

				{/* ── Rhythm — quiet, no card ── */}
				<section className="mb-10">
					<Label>Rhythm</Label>
					<div className="mb-4 flex items-baseline gap-2">
						<span className="font-black text-[#0E1420] text-[30px] tracking-tight">
							{rhythmStreak}
						</span>
						<span className="text-[#0E1420]/65 text-[13px]">
							{rhythmStreak === 1 ? "day" : "days"} in rhythm
						</span>
					</div>
					<div className="flex gap-2">
						{last7.map((d) => (
							<div
								key={d.id}
								className="flex flex-1 flex-col items-center gap-1.5"
							>
								<span
									className="h-2.5 w-2.5 rounded-full"
									style={{
										backgroundColor:
											d.state >= 1 ? GOLD : "rgba(14,20,32,0.08)",
									}}
								/>
								<span className="text-[#0E1420]/50 text-[10px]">{d.label}</span>
							</div>
						))}
					</div>
					{tasksTotal > 0 && (
						<p className="mt-4 text-[#0E1420]/60 text-[12px]">
							{tasksCompleted} of {tasksTotal} tasks done this week
						</p>
					)}
				</section>

				{/* ── Saved ── */}
				<section className="mb-10">
					<Label>Saved</Label>
					{savedCount === 0 ? (
						<p className="text-[#0E1420]/65 text-[13px] leading-relaxed">
							Nothing saved yet. Tap the bookmark on an opportunity to keep it
							here.
						</p>
					) : (
						<div className="flex flex-col gap-3">
							{savedOpportunities.map((opp) => (
								<button
									key={opp.id}
									type="button"
									className="flex cursor-pointer items-center justify-between gap-3 text-left"
								>
									<div className="min-w-0">
										<p className="truncate font-semibold text-[#0E1420] text-[14px]">
											{opp.title}
										</p>
										<p className="text-[#0E1420]/60 text-[11px]">{opp.org}</p>
									</div>
									<ChevronIcon />
								</button>
							))}
						</div>
					)}
				</section>

				{/* ── Preferences (editable; steers For You + Opportunities) ── */}
				<PreferencesSection
					userId={userId}
					careerStage={careerStage}
					fields={fields}
					country={country}
					openToRemote={openToRemote}
					openToRelocate={openToRelocate}
				/>

				{/* ── Sign out (auth POST preserved) ── */}
				<form action="/auth/signout" method="POST" className="text-center">
					<button
						type="submit"
						className="cursor-pointer font-semibold text-[#0E1420]/50 text-[12px] transition-colors duration-200 hover:text-[#0E1420]/70 motion-reduce:transition-none"
					>
						Sign out
					</button>
				</form>
			</div>
		</div>
	);
}

function ChevronIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="rgba(14,20,32,0.35)"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			className="shrink-0"
		>
			<path d="M9 18l6-6-6-6" />
		</svg>
	);
}
