"use client";

import { useState } from "react";
import { supabase } from "@/lib/auth-client";
import { PeopleSection } from "./people-section";
import { ReflectionCard } from "./reflection-card";

type Score = { week_ending: string; band: string; raw_score: number };
type Summary = {
	summary_text: string | null;
	callouts: unknown;
	week_ending: string;
};
type Inputs = {
	activeDays: number;
	assignedTasks: number;
	completedTasks: number;
	meaningfulTotal: number;
	meaningfulInFocus: number;
};

const BAND_SEGS: Record<string, string[]> = {
	Drifting: [
		"#E8B84B",
		"#E8B84B",
		"#E8B84B55",
		"#E8B84B33",
		"#1C2537",
		"#1C2537",
		"#1C2537",
	],
	Finding: [
		"#1C2537",
		"#1C2537",
		"#E8B84B33",
		"#E8B84B55",
		"#E8B84B",
		"#E8B84B",
		"#1C2537",
	],
	Aligned: [
		"#1C2537",
		"#1C2537",
		"#1C2537",
		"#E8B84B33",
		"#E8B84B55",
		"#E8B84B",
		"#E8B84B",
	],
};

const BAND_ORDER = ["Drifting", "Finding", "Aligned"];

const BAND_ACCENT = "#E8B84B";

function BandBar({
	band,
	provisional,
}: {
	band: string;
	provisional?: boolean;
}) {
	const segs = BAND_SEGS[band] ?? BAND_SEGS.Finding;
	return (
		<div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-5">
			<p className="mb-3 font-semibold text-[10px] text-white/40 uppercase tracking-widest">
				Your Signal
			</p>
			<div className="mb-2.5 flex gap-1.5">
				{[...segs.entries()].map(([pos, color]) => (
					<div
						key={pos}
						className="h-2 flex-1 rounded-full"
						style={{ backgroundColor: color }}
					/>
				))}
			</div>
			<div className="flex items-baseline justify-between">
				{BAND_ORDER.map((label) => {
					const isActive = label === band;
					return (
						<span
							key={label}
							className={isActive ? "font-semibold text-[18px]" : "text-[11px]"}
							style={{
								color: isActive ? BAND_ACCENT : "rgba(255,255,255,0.3)",
							}}
						>
							{label}
						</span>
					);
				})}
			</div>
			{provisional && (
				<p className="mt-1.5 text-[11px] text-white/30 italic">
					Provisional, building signal
				</p>
			)}
		</div>
	);
}

export function SignalView({
	scores,
	summary,
	weekEnding,
	ratings: initialRatings,
	inputs,
	lastReflection,
}: {
	scores: Score[];
	summary: Summary | null;
	weekEnding: string | null;
	ratings: Record<number, "up" | "down">;
	inputs: Inputs | null;
	lastReflection: {
		body: string;
		analysis: { themes: string[]; nudge: string } | null;
	} | null;
}) {
	const latest = scores[0];
	const callouts =
		(summary?.callouts as
			| { label: string; body: string }[]
			| string[]
			| null) ?? [];
	const [ratings, setRatings] =
		useState<Record<number, "up" | "down">>(initialRatings);
	const [ratingSaving, setRatingSaving] = useState<Record<number, boolean>>({});

	async function rate(idx: number, rating: "up" | "down") {
		if (ratingSaving[idx] || !weekEnding) return;
		setRatingSaving((prev) => ({ ...prev, [idx]: true }));
		setRatings((prev) => ({ ...prev, [idx]: rating }));
		await supabase
			.from("callout_ratings")
			.upsert(
				{ callout_idx: idx, week_ending: weekEnding, rating },
				{ onConflict: "user_id,week_ending,callout_idx" },
			);
		setRatingSaving((prev) => ({ ...prev, [idx]: false }));
	}

	const coherencePct =
		inputs && inputs.meaningfulTotal > 0
			? Math.round((inputs.meaningfulInFocus / inputs.meaningfulTotal) * 100)
			: null;

	return (
		<div className="px-5 pt-14 pb-8">
			<h1 className="mb-6 font-semibold text-2xl text-white tracking-tight">
				How it's going
			</h1>

			{/* Band bar */}
			{latest && <BandBar band={latest.band} />}

			{/* Score card */}
			{latest ? (
				<div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-5">
					<div className="mb-3 flex items-center justify-between">
						<span className="text-[12px] text-white/50">This week</span>
						<span
							className="rounded-full px-3 py-1 font-semibold text-[11px]"
							style={{
								backgroundColor: `${BAND_ACCENT}22`,
								color: BAND_ACCENT,
							}}
						>
							{latest.band}
						</span>
					</div>
					<div className="mb-4 font-bold text-5xl text-white tracking-tight">
						{latest.raw_score}
						<span className="ml-1 text-white/30 text-xl">/100</span>
					</div>
					{scores.length > 1 && (
						<div className="flex h-10 items-end gap-1.5">
							{[...scores].reverse().map((s, i) => (
								<div
									key={s.week_ending}
									className="flex-1 rounded-sm transition-all"
									style={{
										height: `${Math.max(20, s.raw_score)}%`,
										backgroundColor:
											i === scores.length - 1
												? BAND_ACCENT
												: "rgba(255,255,255,0.15)",
									}}
								/>
							))}
						</div>
					)}
				</div>
			) : (
				<div className="mb-5 rounded-2xl border border-white/8 bg-white/4 p-5 text-center">
					<p className="text-sm text-white/40">
						Your signal score will appear after your first week.
					</p>
				</div>
			)}

			{/* Activity breakdown */}
			{inputs && (
				<div className="mb-5 rounded-2xl border border-white/8 bg-white/4 p-5">
					<h2 className="mb-3 font-semibold text-[11px] text-white/40 uppercase tracking-widest">
						How it broke down
					</h2>
					<div className="grid grid-cols-3 gap-3 text-center">
						<div>
							<div className="font-bold text-2xl text-white">
								{inputs.activeDays}/7
							</div>
							<div className="mt-0.5 text-[11px] text-white/40">
								active days
							</div>
						</div>
						<div>
							<div className="font-bold text-2xl text-white">
								{inputs.completedTasks}/{inputs.assignedTasks}
							</div>
							<div className="mt-0.5 text-[11px] text-white/40">tasks done</div>
						</div>
						<div>
							<div className="font-bold text-2xl text-white">
								{coherencePct !== null ? `${coherencePct}%` : "N/A"}
							</div>
							<div className="mt-0.5 text-[11px] text-white/40">in focus</div>
						</div>
					</div>
				</div>
			)}

			{/* Summary narrative */}
			{summary?.summary_text && (
				<div className="mb-5 rounded-2xl border border-white/8 bg-white/4 p-5">
					<h2 className="mb-2 font-semibold text-[11px] text-white/40 uppercase tracking-widest">
						This Week
					</h2>
					<p className="text-[13px] text-white/70 leading-relaxed">
						{summary.summary_text}
					</p>
				</div>
			)}

			{/* Signal / Noise callouts */}
			{callouts.length > 0 && (
				<div className="mb-5 rounded-2xl border border-white/8 bg-white/4 p-5">
					<h2 className="mb-3 font-semibold text-[11px] text-white/40 uppercase tracking-widest">
						Signal · Noise
					</h2>
					<div className="flex flex-col gap-4">
						{callouts.map((callout, i) => {
							const body = typeof callout === "string" ? callout : callout.body;
							const currentRating = ratings[i];
							return (
								<div key={body}>
									<div className="mb-2 flex items-start gap-3">
										<span
											className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
											style={{
												backgroundColor: [
													"#4ECCA3",
													"#E8B84B",
													"#C084FC",
													"#4ECCA3",
												][i % 4],
											}}
										/>
										<p className="text-[13px] text-white/70 leading-relaxed">
											{body}
										</p>
									</div>
									<div className="ml-5 flex gap-3">
										<button
											type="button"
											onClick={() => void rate(i, "up")}
											className="font-semibold text-[12px] transition-opacity"
											style={{
												color: "#4ECCA3",
												opacity:
													currentRating === "up" ? 1 : currentRating ? 0.4 : 1,
											}}
										>
											▲ Helpful
										</button>
										<button
											type="button"
											onClick={() => void rate(i, "down")}
											className="font-semibold text-[12px] transition-opacity"
											style={{
												color: "#f87171",
												opacity:
													currentRating === "down"
														? 1
														: currentRating
															? 0.4
															: 1,
											}}
										>
											▼ Not quite
										</button>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{scores.length === 0 && !summary && (
				<div className="flex flex-col items-center gap-3 py-12 text-center">
					<div className="text-4xl">📡</div>
					<p className="text-[13px] text-white/40">
						Complete your first few missions to start building your signal.
					</p>
				</div>
			)}

			{/* People section */}
			<PeopleSection />

			{/* Reflection */}
			{weekEnding && (
				<ReflectionCard
					weekEnding={weekEnding}
					initialReflection={lastReflection}
				/>
			)}
		</div>
	);
}
