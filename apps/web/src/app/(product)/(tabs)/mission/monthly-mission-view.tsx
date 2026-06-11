"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/auth-client";

type Step = {
	id: string;
	cadence: "daily" | "weekly";
	week_index: number;
	due_date: string | null;
	title: string;
	detail: string | null;
	estimate_label: string | null;
	done: boolean;
};
type Mission = {
	id: string;
	goal_title: string;
	goal_intent: string | null;
	focus_area_id: string | null;
	month_start: string;
};

const STREAK_LABELS: Record<number, string> = {
	0: "Miss",
	1: "Active",
	2: "Directed",
	3: "Rest day",
};

const GOLD = "#F5C842";
const TEAL = "#3ECFBF";

function dayLabel(date: string): { wd: string; d: string } {
	const dt = new Date(`${date}T00:00:00`);
	return {
		wd: dt.toLocaleDateString("en-US", { weekday: "narrow" }),
		d: String(dt.getDate()),
	};
}

function CheckIcon({ className }: { className?: string }) {
	return (
		<svg
			width="11"
			height="11"
			viewBox="0 0 12 12"
			fill="none"
			aria-hidden="true"
			className={className}
		>
			<path
				d="M2 6l2.5 2.5L10 3"
				stroke="currentColor"
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

export function MonthlyMissionView({
	mission,
	steps: initialSteps,
	cadence: initialCadence,
	today,
	currentWeekIndex,
	streakState,
}: {
	mission: Mission | null;
	steps: Step[];
	cadence: "daily" | "weekly";
	today: string;
	currentWeekIndex: number;
	streakState: number | null;
}) {
	const [steps, setSteps] = useState(initialSteps);
	const [cadence, setCadence] = useState(initialCadence);

	const daily = useMemo(
		() => steps.filter((s) => s.cadence === "daily"),
		[steps],
	);
	const weekly = useMemo(
		() =>
			steps
				.filter((s) => s.cadence === "weekly")
				.sort((a, b) => a.week_index - b.week_index),
		[steps],
	);
	const weekDays = useMemo(
		() =>
			daily
				.filter((s) => s.week_index === currentWeekIndex)
				.sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? "")),
		[daily, currentWeekIndex],
	);
	const todayStep = daily.find((s) => s.due_date === today) ?? null;
	const weekMilestone = weekly.find((s) => s.week_index === currentWeekIndex);

	// The goal card always tracks the 4-week macro plan, independent of the
	// daily/weekly task toggle.
	const weeksDone = weekly.filter((s) => s.done).length;
	const weeksTotal = weekly.length || 4;
	const goalPct = Math.round((weeksDone / weeksTotal) * 100);

	async function setStepDone(id: string, done: boolean) {
		setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, done } : s)));
		await supabase
			.from("monthly_mission_steps")
			.update({ done, completed_at: done ? new Date().toISOString() : null })
			.eq("id", id);
	}

	async function changeCadence(next: "daily" | "weekly") {
		if (next === cadence) return;
		setCadence(next);
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (user) {
			await supabase
				.from("profiles")
				.update({ mission_cadence: next })
				.eq("user_id", user.id);
		}
	}

	if (!mission) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-[18px] pt-14 text-center font-jakarta">
				<svg
					width="40"
					height="40"
					viewBox="0 0 24 24"
					fill="none"
					stroke={GOLD}
					strokeWidth={1.4}
					aria-hidden="true"
				>
					<circle cx="12" cy="12" r="10" />
					<polygon points="16.2 7.8 13.4 13.4 7.8 16.2 10.6 10.6" fill={GOLD} />
				</svg>
				<h2 className="font-bold text-white text-xl">No goal yet</h2>
				<p className="text-sm text-white/50">
					Your monthly goal will appear here shortly.
				</p>
			</div>
		);
	}

	const monthName = new Date(
		`${mission.month_start}T00:00:00`,
	).toLocaleDateString("en-US", { month: "long" });
	const goalShort = mission.goal_title.replace(/\.\s*$/, "");

	const taskStep = cadence === "daily" ? todayStep : (weekMilestone ?? null);

	return (
		<div className="px-[18px] pt-14 font-jakarta">
			{/* ── Header ── */}
			<header className="mb-4 flex items-start justify-between">
				<div>
					<p className="font-bold text-[9px] text-white/30 uppercase tracking-[0.15em]">
						{monthName} Goal
					</p>
					<h1 className="font-black text-[22px] text-white tracking-tight">
						Mission
					</h1>
					<p className="text-[12px] text-white/40">This month</p>
				</div>
				{streakState !== null && (
					<span className="mt-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-bold text-[10px] text-white/55">
						{STREAK_LABELS[streakState] ?? "–"}
					</span>
				)}
			</header>

			{/* ── Section 1 · Active goal card ── */}
			<section
				className="relative mb-4 overflow-hidden rounded-[18px] border p-4"
				style={{
					borderColor: "rgba(245,200,66,0.22)",
					background:
						"linear-gradient(135deg, rgba(245,200,66,0.10), rgba(245,200,66,0.03))",
				}}
			>
				<span
					aria-hidden="true"
					className="absolute top-0 bottom-0 left-0 w-[3px] rounded-r-[3px]"
					style={{ backgroundColor: GOLD }}
				/>
				<p
					className="mb-2 font-bold text-[9px] uppercase tracking-[0.15em]"
					style={{ color: "rgba(245,200,66,0.6)" }}
				>
					This Month's Goal
				</p>
				<p className="mb-3 font-bold text-[15px] text-white leading-[1.4]">
					{mission.goal_title}
				</p>

				<div className="mb-2 flex items-center justify-between">
					<span className="text-[11px] text-white/40">
						{weeksDone} of {weeksTotal} weeks
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

				{/* Daily / Weekly toggle */}
				<div className="mt-3 flex gap-2">
					{(["daily", "weekly"] as const).map((c) => {
						const active = cadence === c;
						return (
							<button
								key={c}
								type="button"
								aria-pressed={active}
								onClick={() => void changeCadence(c)}
								className="cursor-pointer rounded-full px-3 py-1 font-bold text-[10px] capitalize transition-colors duration-200 motion-reduce:transition-none"
								style={
									active
										? { backgroundColor: GOLD, color: "#05050E" }
										: {
												border: "1px solid rgba(255,255,255,0.10)",
												color: "rgba(255,255,255,0.35)",
											}
								}
							>
								{c}
							</button>
						);
					})}
				</div>
			</section>

			{/* ── Section 2 · 4-week plan ── */}
			<p className="mt-1 mb-3 font-bold text-[10px] text-white/30 uppercase tracking-[0.12em]">
				4-Week Plan
			</p>
			<div className="flex flex-col gap-2">
				{weekly.map((w) => {
					const isDone = w.done || w.week_index < currentWeekIndex;
					const isCurrent = !isDone && w.week_index === currentWeekIndex;
					const circle = isDone
						? { bg: "rgba(245,200,66,0.15)", border: GOLD, color: GOLD }
						: isCurrent
							? { bg: "rgba(62,207,191,0.15)", border: TEAL, color: TEAL }
							: {
									bg: "transparent",
									border: "rgba(255,255,255,0.10)",
									color: "rgba(255,255,255,0.30)",
								};
					return (
						<div
							key={w.id}
							className="flex items-start gap-3 rounded-[14px] border border-white/[0.07] bg-white/[0.04] px-[14px] py-[13px]"
						>
							<div
								className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px] font-black text-[11px]"
								style={{
									backgroundColor: circle.bg,
									borderColor: circle.border,
									color: circle.color,
								}}
							>
								{isDone ? <CheckIcon /> : w.week_index + 1}
							</div>
							<div className="min-w-0 flex-1">
								<p className="mb-1 font-bold text-[9px] text-white/30 uppercase tracking-[0.1em]">
									Week {w.week_index + 1}
								</p>
								<p className="font-bold text-[13px] text-white leading-[1.35]">
									{w.title}
								</p>
								<span
									className="mt-1.5 inline-block rounded-full border px-2 py-0.5 font-bold text-[9px]"
									style={
										isCurrent
											? {
													backgroundColor: "rgba(62,207,191,0.1)",
													borderColor: "rgba(62,207,191,0.2)",
													color: TEAL,
												}
											: isDone
												? {
														backgroundColor: "rgba(245,200,66,0.1)",
														borderColor: "rgba(245,200,66,0.2)",
														color: GOLD,
													}
												: {
														backgroundColor: "rgba(255,255,255,0.05)",
														borderColor: "rgba(255,255,255,0.08)",
														color: "rgba(255,255,255,0.30)",
													}
									}
								>
									{isDone ? "Done" : isCurrent ? "In progress" : "Upcoming"}
								</span>
							</div>
						</div>
					);
				})}
			</div>

			{/* ── Section 3 · Today's micro-steps ── */}
			<p className="mt-4 mb-3 font-bold text-[10px] text-white/30 uppercase tracking-[0.12em]">
				{cadence === "daily" ? "Today's Micro-Step" : "This Week's Focus"}
			</p>
			{taskStep ? (
				<button
					type="button"
					aria-pressed={taskStep.done}
					onClick={() => void setStepDone(taskStep.id, !taskStep.done)}
					className="mb-2 flex w-full cursor-pointer items-start gap-3 rounded-[14px] border border-white/[0.07] bg-white/[0.04] px-[14px] py-[13px] text-left transition-colors duration-200 hover:bg-white/[0.07] motion-reduce:transition-none"
				>
					<span
						className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors duration-200 motion-reduce:transition-none"
						style={
							taskStep.done
								? { backgroundColor: TEAL, borderColor: TEAL, color: "#fff" }
								: { borderColor: "rgba(255,255,255,0.20)" }
						}
					>
						{taskStep.done && <CheckIcon />}
					</span>
					<span className="min-w-0 flex-1">
						<span
							className={`block font-semibold text-[13px] ${
								taskStep.done ? "text-white/40 line-through" : "text-white"
							}`}
						>
							{taskStep.title}
						</span>
						<span
							className="mt-0.5 block font-medium text-[10px]"
							style={{ color: "rgba(245,200,66,0.55)" }}
						>
							→ {goalShort}
						</span>
					</span>
				</button>
			) : (
				<p className="text-[13px] text-white/35">
					No step scheduled for today.
				</p>
			)}

			{/* This week's rhythm (daily cadence) */}
			{cadence === "daily" && weekDays.length > 0 && (
				<div className="mt-1 flex gap-1.5">
					{weekDays.map((s) => {
						const { wd, d } = dayLabel(s.due_date ?? today);
						const isToday = s.due_date === today;
						return (
							<button
								key={s.id}
								type="button"
								aria-pressed={s.done}
								aria-label={`${wd} ${d}`}
								onClick={() => void setStepDone(s.id, !s.done)}
								className="flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-[10px] py-2 transition-colors duration-200 motion-reduce:transition-none"
								style={{
									backgroundColor: s.done
										? "rgba(62,207,191,0.14)"
										: "rgba(255,255,255,0.03)",
									border: isToday
										? `1px solid ${TEAL}`
										: "1px solid transparent",
								}}
							>
								<span className="text-[8px] text-white/35 uppercase">{wd}</span>
								<span
									className="font-bold text-[12px]"
									style={{ color: s.done ? TEAL : "rgba(255,255,255,0.7)" }}
								>
									{s.done ? <CheckIcon /> : d}
								</span>
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
