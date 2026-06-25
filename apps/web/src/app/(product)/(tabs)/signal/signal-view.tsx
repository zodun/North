"use client";

import { useState } from "react";
import { colors } from "@/components/product/north-ui";
import { supabase } from "@/lib/auth-client";
import { JournalCard } from "./journal-card";

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
// Ink variants for accent used as text/icon on the light surface.
const GOLD_INK = colors.goldInk;
const TEAL_INK = colors.tealInk;
const RED_INK = colors.redInk;

// Left→right band: drifting (violet) · finding (teal) · aligned (gold).
// Segment FILLS keep their vivid hues; only the cap is a neutral inset.
const SEGMENTS = [
	{ id: "d1", color: VIOLET },
	{ id: "d2", color: VIOLET },
	{ id: "f1", color: TEAL },
	{ id: "f2", color: TEAL },
	{ id: "a1", color: GOLD },
	{ id: "a2", color: GOLD },
	{ id: "cap", color: "rgba(14,20,32,0.06)" },
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
	const [expansions, setExpansions] = useState<Record<number, string>>({});
	const [expanding, setExpanding] = useState<Record<number, boolean>>({});
	const [expanded, setExpanded] = useState<Record<number, boolean>>({});

	async function expandCallout(o: Observation) {
		if (expanding[o.idx]) return;
		if (expansions[o.idx]) {
			setExpanded((prev) => ({ ...prev, [o.idx]: !prev[o.idx] }));
			return;
		}
		setExpanded((prev) => ({ ...prev, [o.idx]: true }));
		setExpanding((prev) => ({ ...prev, [o.idx]: true }));
		try {
			const { data } = await supabase.functions.invoke("callout-expand", {
				body: {
					body: o.body,
					label: o.type,
					journalBody: lastJournal?.body ?? undefined,
				},
			});
			const text =
				data && typeof data.expansion === "string" ? data.expansion : null;
			if (text) setExpansions((prev) => ({ ...prev, [o.idx]: text }));
		} finally {
			setExpanding((prev) => ({ ...prev, [o.idx]: false }));
		}
	}

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
			<p className="mt-2 mb-3 font-bold text-[#0E1420]/50 text-[10px] uppercase tracking-[0.12em]">
				Your Signal
			</p>

			{/* Score card */}
			{latest ? (
				<section
					className="mb-3 rounded-[18px] border p-4"
					style={{
						borderColor: "rgba(62,207,191,0.28)",
						background:
							"linear-gradient(135deg, rgba(62,207,191,0.10), rgba(255,255,255,1))",
					}}
				>
					<p
						className="mb-2 font-bold text-[9px] uppercase tracking-[0.15em]"
						style={{ color: TEAL_INK }}
					>
						Direction Score · This Week
					</p>
					<div className="mb-3 flex items-center justify-between">
						<span className="font-black text-[#0E1420] text-[48px] leading-none tracking-[-2px]">
							{latest.raw_score}
						</span>
						<span
							className="rounded-full border px-3 py-1 font-bold text-[11px]"
							style={{
								backgroundColor: "rgba(245,200,66,0.14)",
								borderColor: "rgba(245,200,66,0.35)",
								color: GOLD_INK,
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
					<div className="mt-1 mb-3 flex justify-between text-[#0E1420]/50 text-[8px]">
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
									className="flex-1 rounded-[12px] border border-[#0E1420]/8 bg-[#F4F7FC] p-[10px] text-center"
								>
									<div className="font-black text-[#0E1420] text-[16px]">
										{stat.value}
									</div>
									<div className="mt-0.5 text-[#0E1420]/55 text-[9px] uppercase tracking-[0.05em]">
										{stat.label}
									</div>
								</div>
							))}
						</div>
					)}
				</section>
			) : (
				<div className="mb-3 rounded-[18px] border border-[#0E1420]/10 bg-white p-5 text-center">
					<p
						className="font-bold text-[10px] uppercase tracking-[0.18em]"
						style={{ color: TEAL_INK }}
					>
						Direction Score
					</p>
					<p className="mt-1.5 font-black text-[#0E1420] text-[17px]">
						Your honest mirror, 0 to 100
					</p>
					<p className="mx-auto mt-1.5 max-w-xs text-[#0E1420]/75 text-[13px] leading-relaxed">
						It reflects how your real activity lines up with your goals, never a
						vanity number. Your score appears after your first full week of
						reflecting.
					</p>
					<p className="mt-3 text-[#0E1420]/65 text-[12px]">
						Start below: write a line about your day and North separates the{" "}
						<span style={{ color: TEAL_INK, fontWeight: 700 }}>signal</span>{" "}
						from the{" "}
						<span style={{ color: RED_INK, fontWeight: 700 }}>noise</span>.
					</p>
				</div>
			)}

			{/* Signal / Noise observation cards */}
			{observations.map((o) => {
				const isSignal = o.type === "signal";
				const accentInk = isSignal ? TEAL_INK : RED_INK;
				const current = ratings[o.idx];
				return (
					<div
						key={`obs-${o.idx}`}
						className="mb-2 rounded-[14px] border border-[#0E1420]/10 bg-white px-[14px] py-[13px]"
					>
						<div
							className="mb-1.5 flex items-center gap-1.5 font-bold text-[9px] uppercase tracking-[0.12em]"
							style={{ color: accentInk }}
						>
							{isSignal ? <ThumbsUp size={11} /> : <ThumbsDown size={11} />}
							<span>{isSignal ? "Signal" : "Noise"}</span>
						</div>
						<p className="mb-2 font-medium text-[#0E1420]/80 text-[12px] leading-[1.5]">
							{o.body}
						</p>
						{expanded[o.idx] && (
							<div
								className="mb-2 rounded-[10px] px-3 py-2.5"
								style={{
									background: isSignal
										? "rgba(62,207,191,0.07)"
										: "rgba(239,68,68,0.06)",
									borderLeft: `2px solid ${isSignal ? "rgba(62,207,191,0.4)" : "rgba(239,68,68,0.3)"}`,
								}}
							>
								{expanding[o.idx] ? (
									<div className="flex items-center gap-2">
										<span
											className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
											style={{ color: accentInk, opacity: 0.5 }}
										/>
										<span
											className="font-medium text-[11px]"
											style={{ color: accentInk, opacity: 0.6 }}
										>
											Thinking...
										</span>
									</div>
								) : expansions[o.idx] ? (
									<p
										className="font-medium text-[11px] leading-[1.6]"
										style={{ color: isSignal ? TEAL_INK : RED_INK }}
									>
										{expansions[o.idx]}
									</p>
								) : null}
							</div>
						)}
						<div className="mb-3 flex items-center gap-3">
							<button
								type="button"
								onClick={() => void expandCallout(o)}
								className="font-semibold text-[11px] transition-opacity hover:opacity-70"
								style={{ color: accentInk }}
							>
								{expanded[o.idx] ? "Show less" : "Read more"}
							</button>
						</div>
						<div className="flex gap-2">
							<FeedbackButton
								active={current === "up"}
								activeColor={TEAL_INK}
								onClick={() => void rate(o.idx, "up")}
								label="Helpful"
								ariaLabel="Helpful"
								icon={<ThumbsUp size={12} />}
							/>
							<FeedbackButton
								active={current === "down"}
								activeColor={RED_INK}
								onClick={() => void rate(o.idx, "down")}
								label="Not quite"
								ariaLabel="Not helpful"
								icon={<ThumbsDown size={12} />}
							/>
						</div>
					</div>
				);
			})}

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
			className="flex cursor-pointer items-center gap-1.5 rounded-[8px] border px-3 py-1.5 font-semibold text-[11px] transition-colors duration-200 hover:bg-[#0E1420]/[0.05] motion-reduce:transition-none"
			style={{
				borderColor: active ? `${activeColor}66` : "rgba(14,20,32,0.12)",
				backgroundColor: active ? `${activeColor}1f` : "rgba(14,20,32,0.03)",
				color: active ? activeColor : "rgba(14,20,32,0.60)",
			}}
		>
			{icon}
			{label}
		</button>
	);
}
