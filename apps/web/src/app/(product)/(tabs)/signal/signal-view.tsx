"use client";

import { useState } from "react";
import { colors } from "@/components/product/north-ui";
import { supabase } from "@/lib/auth-client";
import { JournalCard } from "./journal-card";
import { PeopleSection } from "./people-section";

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

const GOLD = colors.gold;
const TEAL = colors.teal;
const VIOLET = colors.violet;
const RED = "rgba(245,100,100,0.85)";

// Left→right band: drifting (violet) · finding (teal) · aligned (gold).
const SEGMENTS = [
	{ id: "d1", color: VIOLET },
	{ id: "d2", color: VIOLET },
	{ id: "f1", color: TEAL },
	{ id: "f2", color: TEAL },
	{ id: "a1", color: GOLD },
	{ id: "a2", color: GOLD },
	{ id: "cap", color: "rgba(255,255,255,0.06)" },
];

function ThumbsUp({ size = 13 }: { size?: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M7 10v12" />
			<path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
		</svg>
	);
}

function ThumbsDown({ size = 13 }: { size?: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M17 14V2" />
			<path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
		</svg>
	);
}

type Observation = { idx: number; type: "signal" | "noise"; body: string };

export function SignalView({
	scores,
	summary,
	weekEnding,
	ratings: initialRatings,
	inputs,
	lastJournal,
	embedded = false,
}: {
	scores: Score[];
	summary: Summary | null;
	weekEnding: string | null;
	ratings: Record<number, "up" | "down">;
	inputs: Inputs | null;
	lastJournal: {
		body: string;
		analysis: { signal: string[]; noise: string[]; read: string } | null;
	} | null;
	embedded?: boolean;
}) {
	const latest = scores[0];
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

	// Normalise callouts into typed observations; fall back to the narrative.
	const rawCallouts =
		(summary?.callouts as
			| { label?: string; body?: string }[]
			| string[]
			| null) ?? [];
	let observations: Observation[] = rawCallouts.map((c, i) => {
		const body = typeof c === "string" ? c : (c.body ?? "");
		const label = typeof c === "string" ? "" : (c.label ?? "");
		const type: "signal" | "noise" =
			label.toLowerCase().includes("noise") || (label === "" && i % 2 === 1)
				? "noise"
				: "signal";
		return { idx: i, type, body };
	});
	if (observations.length === 0 && summary?.summary_text) {
		observations = [{ idx: 0, type: "signal", body: summary.summary_text }];
	}

	const litCount = latest
		? Math.min(7, Math.max(1, Math.round((latest.raw_score / 100) * 7)))
		: 0;

	return (
		<div
			className={`font-jakarta ${embedded ? "px-[18px]" : "px-[18px] pt-14"}`}
		>
			<p className="mt-2 mb-3 font-bold text-[10px] text-white/30 uppercase tracking-[0.12em]">
				Your Signal
			</p>

			{/* Score card */}
			{latest ? (
				<section
					className="mb-3 rounded-[18px] border p-4"
					style={{
						borderColor: "rgba(62,207,191,0.18)",
						background:
							"linear-gradient(135deg, rgba(62,207,191,0.07), rgba(62,207,191,0.02))",
					}}
				>
					<p
						className="mb-2 font-bold text-[9px] uppercase tracking-[0.15em]"
						style={{ color: "rgba(62,207,191,0.6)" }}
					>
						Direction Score · This Week
					</p>
					<div className="mb-3 flex items-center justify-between">
						<span className="font-black text-[48px] text-white leading-none tracking-[-2px]">
							{latest.raw_score}
						</span>
						<span
							className="rounded-full border px-3 py-1 font-bold text-[11px]"
							style={{
								backgroundColor: "rgba(245,200,66,0.1)",
								borderColor: "rgba(245,200,66,0.2)",
								color: GOLD,
							}}
						>
							{latest.band}
						</span>
					</div>

					{/* 7-segment band bar */}
					<div className="flex h-[5px] gap-1 overflow-hidden rounded-lg">
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
					<div className="mt-1 mb-3 flex justify-between text-[8px] text-white/25">
						<span>Drifting</span>
						<span>Finding</span>
						<span>Aligned</span>
					</div>

					{/* Breakdown */}
					{inputs && (
						<div className="flex gap-2">
							{[
								{ value: `${inputs.activeDays}/7`, label: "Active days" },
								{
									value: `${inputs.completedTasks}/${inputs.assignedTasks}`,
									label: "Tasks done",
								},
								{
									value: coherencePct !== null ? `${coherencePct}%` : "N/A",
									label: "In focus",
								},
							].map((stat) => (
								<div
									key={stat.label}
									className="flex-1 rounded-[12px] border border-white/[0.07] bg-white/[0.04] p-[10px] text-center"
								>
									<div className="font-black text-[16px] text-white">
										{stat.value}
									</div>
									<div className="mt-0.5 text-[9px] text-white/35 uppercase tracking-[0.05em]">
										{stat.label}
									</div>
								</div>
							))}
						</div>
					)}
				</section>
			) : (
				<div className="mb-3 rounded-[18px] border border-white/[0.07] bg-white/[0.04] p-4 text-center">
					<p className="text-[13px] text-white/40">
						Your Direction Score appears after your first full week.
					</p>
				</div>
			)}

			{/* Signal / Noise observation cards */}
			{observations.map((o) => {
				const isSignal = o.type === "signal";
				const accent = isSignal ? TEAL : RED;
				const current = ratings[o.idx];
				return (
					<div
						key={`obs-${o.idx}`}
						className="mb-2 rounded-[14px] border border-white/[0.07] bg-white/[0.04] px-[14px] py-[13px]"
					>
						<div
							className="mb-1.5 flex items-center gap-1.5 font-bold text-[9px] uppercase tracking-[0.12em]"
							style={{ color: accent }}
						>
							{isSignal ? <ThumbsUp size={11} /> : <ThumbsDown size={11} />}
							<span>{isSignal ? "Signal" : "Noise"}</span>
						</div>
						<p className="mb-3 font-medium text-[12px] text-white/70 leading-[1.5]">
							{o.body}
						</p>
						<div className="flex gap-2">
							<FeedbackButton
								active={current === "up"}
								activeColor={TEAL}
								onClick={() => void rate(o.idx, "up")}
								label="Helpful"
								ariaLabel="Helpful"
								icon={<ThumbsUp size={12} />}
							/>
							<FeedbackButton
								active={current === "down"}
								activeColor={RED}
								onClick={() => void rate(o.idx, "down")}
								label="Not quite"
								ariaLabel="Not helpful"
								icon={<ThumbsDown size={12} />}
							/>
						</div>
					</div>
				);
			})}

			{/* People section */}
			<div className="mt-4">
				<PeopleSection />
			</div>

			{/* Daily journal */}
			<JournalCard
				entryDate={new Date().toISOString().slice(0, 10)}
				initialEntry={lastJournal}
			/>
		</div>
	);
}

function FeedbackButton({
	active,
	activeColor,
	onClick,
	label,
	ariaLabel,
	icon,
}: {
	active: boolean;
	activeColor: string;
	onClick: () => void;
	label: string;
	ariaLabel: string;
	icon: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={ariaLabel}
			aria-pressed={active}
			className="flex cursor-pointer items-center gap-1.5 rounded-[8px] border px-3 py-1.5 font-semibold text-[11px] transition-colors duration-200 hover:bg-white/[0.09] motion-reduce:transition-none"
			style={{
				borderColor: active ? `${activeColor}66` : "rgba(255,255,255,0.10)",
				backgroundColor: active ? `${activeColor}1f` : "rgba(255,255,255,0.05)",
				color: active ? activeColor : "rgba(255,255,255,0.45)",
			}}
		>
			{icon}
			{label}
		</button>
	);
}
