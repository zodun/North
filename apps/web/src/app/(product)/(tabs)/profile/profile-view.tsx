"use client";

const BAND_COLORS: Record<string, string> = {
	Aligned: "#7ec4bb",
	Finding: "#d4a574",
	Drifting: "#c97a5a",
};

const GRID_COLORS = ["#1a1a1a", "#2a3a2a", "#3a5a3a", "#4a7a4a"];

type Props = {
	displayName: string;
	statementOfIntent: string | null;
	seasonLabel: string | null;
	timeBudgetLabel: string | null;
	focusAreas: { id: string; label: string; hue: string }[];
	streaks28: number[];
	dayLabels28: string[];
	rhythmStreak: number;
	tasksCompleted: number;
	tasksTotal: number;
	signalBand: string | null;
	signalTrend: "climbing" | "holding" | "easing" | null;
	savedCount: number;
	savedOpportunities: { id: string; title: string; org: string }[];
};

export function ProfileView({
	displayName,
	statementOfIntent,
	seasonLabel,
	timeBudgetLabel,
	focusAreas,
	streaks28,
	dayLabels28,
	rhythmStreak,
	tasksCompleted,
	tasksTotal,
	signalBand,
	signalTrend,
	savedCount,
	savedOpportunities,
}: Props) {
	const trendIcon =
		signalTrend === "climbing" ? "↑" : signalTrend === "easing" ? "↓" : "→";

	return (
		<div className="overflow-y-auto px-5 pt-14 pb-24">
			{/* Name + focus areas */}
			<div className="mb-6">
				<h1 className="mb-3 font-semibold text-[32px] text-white leading-tight tracking-tight">
					{displayName}
				</h1>
				{statementOfIntent && (
					<p className="mb-3 text-[13px] text-white/50 italic leading-relaxed">
						{statementOfIntent}
					</p>
				)}
				{focusAreas.length > 0 && (
					<div className="flex flex-wrap gap-2">
						{focusAreas.map((fa) => (
							<span
								key={fa.id}
								className="rounded-full border px-3 py-1 font-medium text-[12px]"
								style={{
									color: fa.hue,
									backgroundColor: `${fa.hue}22`,
									borderColor: `${fa.hue}55`,
								}}
							>
								{fa.label}
							</span>
						))}
					</div>
				)}
				{(seasonLabel || timeBudgetLabel) && (
					<div className="mt-3 flex flex-wrap gap-2">
						{seasonLabel && (
							<span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/50">
								{seasonLabel}
							</span>
						)}
						{timeBudgetLabel && (
							<span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/50">
								{timeBudgetLabel}
							</span>
						)}
					</div>
				)}
			</div>

			{/* Rhythm streak (7-day) */}
			<div className="mb-3 rounded-2xl border border-white/6 bg-white/[0.03] p-4">
				<p className="mb-3 font-medium text-[11px] text-white/35 uppercase tracking-widest">
					Rhythm streak
				</p>
				<div className="mb-3 flex gap-1.5">
					{streaks28.slice(-7).map((state, i) => (
						<div
							key={dayLabels28.slice(-7)[i] + String(i)}
							className="flex flex-1 flex-col items-center gap-1"
						>
							<div
								className="h-8 w-full rounded-md"
								style={{
									backgroundColor: GRID_COLORS[state] ?? GRID_COLORS[0],
								}}
							/>
							<span className="text-[9px] text-white/25">
								{dayLabels28.slice(-7)[i]}
							</span>
						</div>
					))}
				</div>
				<div className="flex items-baseline gap-1.5">
					<span className="font-bold text-[28px] text-white leading-none">
						{rhythmStreak}
					</span>
					<span className="text-[13px] text-white/50">
						{rhythmStreak === 1 ? "day" : "days"} in rhythm
					</span>
				</div>
			</div>

			{/* 28-day consistency grid */}
			<div className="mb-3 rounded-2xl border border-white/6 bg-white/[0.03] p-4">
				<p className="mb-3 font-medium text-[11px] text-white/35 uppercase tracking-widest">
					28-day consistency
				</p>
				<div className="grid grid-cols-7 gap-1">
					{[...dayLabels28.slice(0, 7).entries()].map(([pos, label]) => (
						<div key={pos} className="text-center text-[9px] text-white/25">
							{label}
						</div>
					))}
					{[...streaks28.entries()].map(([pos, state]) => (
						<div
							key={pos}
							className="aspect-square rounded-sm"
							style={{ backgroundColor: GRID_COLORS[state] ?? GRID_COLORS[0] }}
						/>
					))}
				</div>
			</div>

			{/* Stats row */}
			<div className="mb-3 grid grid-cols-2 gap-3">
				{/* Signal */}
				<div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
					<p className="mb-2 font-medium text-[11px] text-white/35 uppercase tracking-widest">
						Signal
					</p>
					{signalBand ? (
						<>
							<p
								className="font-semibold text-[24px] leading-tight"
								style={{ color: BAND_COLORS[signalBand] ?? "white" }}
							>
								{signalBand}
							</p>
							{signalTrend && (
								<p className="mt-1 text-[12px] text-white/35">
									{trendIcon} {signalTrend}
								</p>
							)}
						</>
					) : (
						<p className="text-[12px] text-white/30 italic">
							Appears after your first full week.
						</p>
					)}
				</div>

				{/* Tasks this week */}
				<div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
					<p className="mb-2 font-medium text-[11px] text-white/35 uppercase tracking-widest">
						This week
					</p>
					<p className="font-bold text-[28px] text-white leading-tight">
						{tasksCompleted}
					</p>
					<p className="mt-1 text-[12px] text-white/35">
						of {tasksTotal} task{tasksTotal !== 1 ? "s" : ""} done
					</p>
				</div>
			</div>

			{/* Saved opportunities */}
			<div className="mb-6 rounded-2xl border border-white/6 bg-white/[0.03] p-4">
				<p className="mb-2 font-medium text-[11px] text-white/35 uppercase tracking-widest">
					Saved
				</p>
				{savedCount > 0 ? (
					<>
						<div className="mb-3 flex items-baseline gap-2">
							<span className="font-bold text-[36px] text-white leading-none">
								{savedCount}
							</span>
							<span className="text-[14px] text-white/50">
								{savedCount === 1 ? "opportunity" : "opportunities"} saved
							</span>
						</div>
						<div className="flex flex-col gap-1">
							{savedOpportunities.map((opp) => (
								<p key={opp.id} className="truncate text-[12px] text-white/40">
									{opp.title} · {opp.org}
								</p>
							))}
						</div>
					</>
				) : (
					<p className="text-[12px] text-white/30 italic">
						Save opportunities from the Opportunities tab.
					</p>
				)}
			</div>

			{/* Sign out */}
			<form action="/auth/signout" method="POST">
				<button
					type="submit"
					className="w-full rounded-xl border border-white/10 py-3 font-medium text-sm text-white/40 transition-colors hover:text-white/60"
				>
					Sign out
				</button>
			</form>
		</div>
	);
}
