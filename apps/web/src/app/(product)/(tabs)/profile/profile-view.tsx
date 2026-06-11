"use client";

import { colors, Eyebrow, Surface } from "@/components/product/north-ui";

const GOLD = colors.gold;
const TEAL = colors.teal;
const VIOLET = colors.violet;

// 7-segment band: drifting (violet) · finding (teal) · aligned (gold).
const SEGMENTS = [
	{ id: "d1", color: VIOLET },
	{ id: "d2", color: VIOLET },
	{ id: "f1", color: TEAL },
	{ id: "f2", color: TEAL },
	{ id: "a1", color: GOLD },
	{ id: "a2", color: GOLD },
	{ id: "cap", color: "rgba(255,255,255,0.06)" },
];

const BAND_PILL: Record<string, { bg: string; border: string; color: string }> =
	{
		Drifting: {
			bg: "rgba(123,97,255,0.1)",
			border: "rgba(123,97,255,0.2)",
			color: VIOLET,
		},
		Finding: {
			bg: "rgba(62,207,191,0.1)",
			border: "rgba(62,207,191,0.2)",
			color: TEAL,
		},
		Aligned: {
			bg: "rgba(245,200,66,0.1)",
			border: "rgba(245,200,66,0.2)",
			color: GOLD,
		},
	};

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
};

function cellColor(state: number, idxFromEnd: number): string {
	if (state < 1) return "rgba(255,255,255,0.07)";
	if (idxFromEnd <= 6) return "rgba(245,200,66,0.9)";
	if (idxFromEnd <= 13) return "rgba(62,207,191,0.7)";
	if (idxFromEnd <= 20) return "rgba(123,97,255,0.6)";
	return "rgba(255,255,255,0.12)";
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
	signalTrend,
	savedCount,
	savedOpportunities,
}: Props) {
	const litCount =
		signalScore != null
			? Math.min(7, Math.max(1, Math.round((signalScore / 100) * 7)))
			: 0;
	const goalPct = goalTotal > 0 ? Math.round((goalDone / goalTotal) * 100) : 0;
	const tasksPct = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0;
	const statement = statementOfIntent ?? seasonLabel;
	const last7Labels = dayLabels28.slice(-7);
	const last7 = streaks28.slice(-7).map((state, i) => ({
		state,
		label: last7Labels[i] ?? "",
		id: `day-${i}`,
	}));
	const grid28 = streaks28.map((state, i) => ({
		state,
		id: `cell-${i}`,
		fromEnd: streaks28.length - 1 - i,
	}));
	const bandPill = signalBand ? BAND_PILL[signalBand] : null;

	const delta =
		signalTrend === "climbing"
			? { up: true, word: "building" }
			: signalTrend === "easing"
				? { up: false, word: "easing" }
				: signalTrend
					? { up: null, word: "holding" }
					: null;

	return (
		<div className="overflow-y-auto bg-[#05050E] pb-24 font-jakarta">
			{/* ── Progress hero ── */}
			<header
				className="relative overflow-hidden px-[18px] pt-[22px] pb-4"
				style={{
					background:
						"linear-gradient(180deg, rgba(62,207,191,0.07) 0%, transparent 100%)",
					borderBottom: "1px solid rgba(255,255,255,0.06)",
				}}
			>
				<span
					aria-hidden="true"
					className="absolute top-0 right-[10%] left-[10%] h-px"
					style={{
						background:
							"linear-gradient(90deg, transparent, rgba(62,207,191,0.5), rgba(245,200,66,0.4), transparent)",
					}}
				/>
				<div className="flex items-end justify-between">
					<div>
						<p className="mb-1 font-bold text-[9px] text-white/30 uppercase tracking-[0.15em]">
							Your Progress
						</p>
						<p className="font-black text-[52px] text-white leading-none tracking-[-3px]">
							{signalScore ?? "—"}
						</p>
						<p className="mt-1 font-semibold text-[11px] text-white/40">
							Direction Score
						</p>
					</div>
					<div className="flex flex-col items-end">
						<p className="mb-2 font-bold text-[9px] text-white/30 uppercase tracking-[0.1em]">
							This week
						</p>
						{delta && (
							<span
								className="flex items-center gap-1 rounded-full border px-3 py-1 font-bold text-[11px]"
								style={{
									backgroundColor: "rgba(245,200,66,0.1)",
									borderColor: "rgba(245,200,66,0.2)",
									color: GOLD,
								}}
							>
								<TrendArrow dir={delta.up} />
								{delta.word}
							</span>
						)}
					</div>
				</div>

				{/* Band bar */}
				<div className="mt-3 flex h-[5px] gap-[3px] overflow-hidden rounded-lg">
					{SEGMENTS.map((seg, i) => (
						<div
							key={seg.id}
							className="h-full flex-1 rounded-sm"
							style={{
								backgroundColor: seg.color,
								opacity: i === 6 ? 1 : i < litCount ? 1 : 0.22,
							}}
						/>
					))}
				</div>
				<div className="mt-1.5 flex justify-between text-[8px] text-white/25">
					<span>Drifting</span>
					<span>Finding</span>
					<span>Aligned</span>
				</div>
			</header>

			{/* ── Identity ── */}
			<section className="px-[18px] pt-[14px]">
				<div className="mb-4 flex items-center gap-3">
					<div
						className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
						style={{
							background:
								"linear-gradient(135deg, rgba(245,200,66,0.3), rgba(62,207,191,0.3))",
							border: "1.5px solid rgba(245,200,66,0.3)",
						}}
					>
						<span className="font-black text-[20px]" style={{ color: GOLD }}>
							{displayName[0]?.toUpperCase()}
						</span>
					</div>
					<div className="min-w-0">
						<p className="font-black text-[17px] text-white tracking-tight">
							{displayName}
						</p>
						{timeBudgetLabel && (
							<p className="mt-1 text-[11px] text-white/35">
								{timeBudgetLabel} a day
							</p>
						)}
					</div>
				</div>

				{statement && (
					<div className="mb-4 flex items-start gap-2 rounded-[12px] border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
						<p className="flex-1 font-medium text-[13px] text-white/55 italic leading-relaxed">
							{statement}
						</p>
						<EditIcon />
					</div>
				)}

				{focusAreas.length > 0 && (
					<div className="mb-4 flex flex-wrap gap-2">
						{focusAreas.map((fa) => (
							<span
								key={fa.id}
								className="rounded-full border px-3 py-1.5 font-bold text-[10px]"
								style={{
									color: fa.hue,
									backgroundColor: `${fa.hue}12`,
									borderColor: `${fa.hue}40`,
								}}
							>
								{fa.label}
							</span>
						))}
					</div>
				)}
			</section>

			{/* ── June goal ── */}
			{goalTitle && (
				<section className="px-[18px]">
					<Eyebrow className="mb-3">{goalMonth} Goal</Eyebrow>
					<div
						className="relative mb-3 overflow-hidden rounded-[16px] border p-4"
						style={{
							borderColor: "rgba(245,200,66,0.2)",
							background:
								"linear-gradient(135deg, rgba(245,200,66,0.08), rgba(245,200,66,0.02))",
						}}
					>
						<span
							aria-hidden="true"
							className="absolute top-0 bottom-0 left-0 w-[3px] rounded-r-[3px]"
							style={{ backgroundColor: GOLD }}
						/>
						<p
							className="mb-1.5 font-bold text-[9px] uppercase tracking-[0.15em]"
							style={{ color: "rgba(245,200,66,0.6)" }}
						>
							This Month
						</p>
						<p className="mb-3 font-bold text-[14px] text-white leading-[1.4]">
							{goalTitle}
						</p>
						<div className="mb-1.5 flex items-center justify-between">
							<span className="text-[11px] text-white/40">
								{goalDone} of {goalTotal} {goalUnit}
							</span>
							<span className="font-bold text-[11px]" style={{ color: GOLD }}>
								{goalPct}%
							</span>
						</div>
						<div className="h-[5px] overflow-hidden rounded-full bg-white/8">
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

			{/* ── Rhythm + consistency ── */}
			<section className="px-[18px]">
				<Eyebrow className="mb-3">Rhythm</Eyebrow>
				<Surface size="lg" className="mb-3 p-4">
					<div className="flex items-center justify-between">
						<span className="font-bold text-[12px] text-white">
							Rhythm Streak
						</span>
						<span
							className="rounded-full border px-3 py-1 font-bold text-[11px]"
							style={{
								backgroundColor: "rgba(245,200,66,0.1)",
								borderColor: "rgba(245,200,66,0.2)",
								color: GOLD,
							}}
						>
							{rhythmStreak} {rhythmStreak === 1 ? "day" : "days"}
						</span>
					</div>

					{/* 7-day dots */}
					<div className="mt-2 mb-3 grid grid-cols-7 gap-1">
						{last7.map((d) => (
							<div key={d.id} className="flex flex-col items-center">
								<span className="font-bold text-[10px] text-white/30">
									{d.label}
								</span>
								<span
									className="mt-1 h-[18px] w-[18px] rounded-full"
									style={{
										backgroundColor:
											d.state >= 1 ? GOLD : "rgba(255,255,255,0.06)",
									}}
								/>
							</div>
						))}
					</div>

					<div className="my-3 h-px bg-white/[0.06]" />

					<p className="mb-2 font-bold text-[12px] text-white">
						28-Day Consistency
					</p>
					<div className="grid grid-cols-7 gap-[3.5px]">
						{grid28.map((c) => (
							<div
								key={c.id}
								className="aspect-square rounded-[3px]"
								style={{ backgroundColor: cellColor(c.state, c.fromEnd) }}
							/>
						))}
					</div>
				</Surface>
			</section>

			{/* ── Signal this week ── */}
			<section className="px-[18px]">
				<Eyebrow className="mb-3">Signal</Eyebrow>
				<div
					className="mb-3 rounded-[16px] border p-4"
					style={{
						borderColor: "rgba(62,207,191,0.18)",
						background:
							"linear-gradient(135deg, rgba(62,207,191,0.07), rgba(62,207,191,0.02))",
					}}
				>
					<div className="mb-3 flex items-center justify-between">
						<span className="font-bold text-[9px] text-white/30 uppercase tracking-[0.1em]">
							This Week
						</span>
						{bandPill && (
							<span
								className="rounded-full border px-3 py-1 font-bold text-[11px]"
								style={{
									backgroundColor: bandPill.bg,
									borderColor: bandPill.border,
									color: bandPill.color,
								}}
							>
								{signalBand}
							</span>
						)}
					</div>
					<div className="mb-1 flex items-baseline gap-1">
						<span className="font-black text-[32px] text-white tracking-tight">
							{tasksCompleted}
						</span>
						<span className="font-medium text-[12px] text-white/40">
							of {tasksTotal} tasks done
						</span>
					</div>
					<div className="h-[4px] overflow-hidden rounded-full bg-white/[0.06]">
						<div
							className="h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
							style={{ width: `${tasksPct}%`, backgroundColor: TEAL }}
						/>
					</div>
				</div>
			</section>

			{/* ── Saved opportunities ── */}
			<section className="px-[18px]">
				<Eyebrow className="mb-3">Saved</Eyebrow>
				{savedCount === 0 ? (
					<div className="rounded-[14px] border border-white/[0.07] bg-white/[0.03] p-5 text-center">
						<BookmarkMark />
						<p className="mb-1 font-bold text-[13px] text-white/35">
							No saved opportunities yet
						</p>
						<p className="text-[11px] text-white/25">
							Save from the Opportunities tab
						</p>
					</div>
				) : (
					<div className="flex flex-col gap-2">
						{savedOpportunities.map((opp) => (
							<div
								key={opp.id}
								className="flex cursor-pointer items-center justify-between rounded-[14px] border border-white/[0.07] bg-white/[0.04] px-[13px] py-[11px] transition-colors duration-200 hover:bg-white/[0.07] motion-reduce:transition-none"
							>
								<div className="min-w-0">
									<p className="truncate font-bold text-[12px] text-white">
										{opp.title}
									</p>
									<p className="text-[10px] text-white/35">{opp.org}</p>
								</div>
								<span
									className="ml-3 shrink-0 rounded-[6px] border px-2 py-1 font-bold text-[9px]"
									style={{
										backgroundColor: "rgba(245,200,66,0.08)",
										borderColor: "rgba(245,200,66,0.22)",
										color: GOLD,
									}}
								>
									Saved
								</span>
							</div>
						))}
					</div>
				)}
			</section>

			{/* ── Sign out (auth POST preserved) ── */}
			<form
				action="/auth/signout"
				method="POST"
				className="mt-4 mb-6 text-center"
			>
				<button
					type="submit"
					className="cursor-pointer font-semibold text-[12px] text-white/25 transition-colors duration-200 hover:text-white/50 motion-reduce:transition-none"
				>
					Sign out
				</button>
			</form>
		</div>
	);
}

// ── Icons ──────────────────────────────────────────────────────────────────

function TrendArrow({ dir }: { dir: boolean | null }) {
	const d =
		dir === true
			? "M12 19V5M5 12l7-7 7 7"
			: dir === false
				? "M12 5v14M5 12l7 7 7-7"
				: "M5 12h14";
	return (
		<svg
			width="9"
			height="9"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={3}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d={d} />
		</svg>
	);
}

function EditIcon() {
	return (
		<svg
			width="13"
			height="13"
			viewBox="0 0 24 24"
			fill="none"
			stroke="rgba(255,255,255,0.25)"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			className="mt-0.5 shrink-0"
		>
			<path d="M12 20h9" />
			<path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
		</svg>
	);
}

function BookmarkMark() {
	return (
		<svg
			width="32"
			height="32"
			viewBox="0 0 24 24"
			fill="none"
			stroke="white"
			strokeWidth={1.6}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			className="mx-auto mb-2 opacity-20"
		>
			<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
		</svg>
	);
}
