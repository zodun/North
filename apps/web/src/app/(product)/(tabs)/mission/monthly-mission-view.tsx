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

const FOCUS_COLORS: Record<string, string> = {
	craft: "#7ec4bb",
	venture: "#d4a574",
	mind: "#9aaee0",
	people: "#c97a5a",
	money: "#a8b97a",
	learn: "#b39ad8",
};

function dayLabel(date: string): { wd: string; d: string } {
	const dt = new Date(`${date}T00:00:00`);
	return {
		wd: dt.toLocaleDateString("en-US", { weekday: "short" }),
		d: String(dt.getDate()),
	};
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

	const accent = FOCUS_COLORS[mission?.focus_area_id ?? "craft"] ?? "#7ec4bb";

	const daily = useMemo(
		() => steps.filter((s) => s.cadence === "daily"),
		[steps],
	);
	const weekly = useMemo(
		() => steps.filter((s) => s.cadence === "weekly"),
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

	const pool = cadence === "daily" ? daily : weekly;
	const doneCount = pool.filter((s) => s.done).length;
	const progress = pool.length > 0 ? doneCount / pool.length : 0;

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
			<div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
				<div className="text-4xl">🧭</div>
				<h2 className="font-semibold text-white text-xl">No goal yet</h2>
				<p className="text-sm text-white/50">
					Your monthly goal will appear here shortly.
				</p>
			</div>
		);
	}

	const monthName = new Date(
		`${mission.month_start}T00:00:00`,
	).toLocaleDateString("en-US", { month: "long" });

	return (
		<div className="px-5 pt-14">
			{/* Header */}
			<div className="mb-5 flex items-center justify-between">
				<div>
					<p className="font-medium text-[11px] text-white/35 uppercase tracking-[0.12em]">
						{monthName} goal
					</p>
					<h1 className="font-semibold text-2xl text-white tracking-tight">
						This month
					</h1>
				</div>
				{streakState !== null && (
					<span className="rounded-full border border-white/15 bg-white/8 px-3 py-1 font-medium text-[11px] text-white/60">
						{STREAK_LABELS[streakState] ?? "–"}
					</span>
				)}
			</div>

			{/* Goal card */}
			<div
				className="mb-4 rounded-2xl border p-5"
				style={{
					borderColor: `${accent}30`,
					background: `linear-gradient(135deg, ${accent}12 0%, rgba(255,255,255,0.02) 100%)`,
				}}
			>
				<h2 className="mb-3 font-semibold text-lg text-white leading-snug">
					{mission.goal_title}
				</h2>
				<div className="mb-2 flex items-center justify-between">
					<span className="text-[12px] text-white/50">
						{doneCount} of {pool.length}{" "}
						{cadence === "daily" ? "days" : "weeks"}
					</span>
					<span className="font-semibold text-[12px] text-white">
						{Math.round(progress * 100)}%
					</span>
				</div>
				<div className="h-1.5 overflow-hidden rounded-full bg-white/10">
					<div
						className="h-full rounded-full transition-all duration-500"
						style={{ width: `${progress * 100}%`, backgroundColor: accent }}
					/>
				</div>
			</div>

			{/* Cadence toggle */}
			<div className="mb-5 flex rounded-xl border border-white/10 bg-white/4 p-1">
				{(["daily", "weekly"] as const).map((c) => (
					<button
						key={c}
						type="button"
						onClick={() => void changeCadence(c)}
						className={`flex-1 rounded-lg py-2 font-semibold text-[13px] capitalize transition-colors ${
							cadence === c ? "bg-white text-black" : "text-white/50"
						}`}
					>
						{c}
					</button>
				))}
			</div>

			{/* Active steps */}
			{cadence === "daily" ? (
				<div>
					{weekMilestone && (
						<p className="mb-3 text-[12px] text-white/45">
							Week {currentWeekIndex + 1} ·{" "}
							<span className="text-white/70">{weekMilestone.title}</span>
						</p>
					)}

					{/* Today's task */}
					{todayStep ? (
						<StepRow
							step={todayStep}
							accent={accent}
							emphasis
							leading="Today"
							onToggle={(done) => void setStepDone(todayStep.id, done)}
						/>
					) : (
						<p className="text-[13px] text-white/35">
							No step scheduled for today.
						</p>
					)}

					{/* This week's day strip */}
					<div className="mt-5 flex gap-1.5">
						{weekDays.map((s) => {
							const { wd, d } = dayLabel(s.due_date ?? today);
							const isToday = s.due_date === today;
							return (
								<button
									key={s.id}
									type="button"
									onClick={() => void setStepDone(s.id, !s.done)}
									className="flex flex-1 flex-col items-center gap-1 rounded-lg py-2 transition-colors"
									style={{
										backgroundColor: s.done
											? `${accent}1f`
											: "rgba(255,255,255,0.03)",
										border: isToday
											? `1px solid ${accent}`
											: "1px solid transparent",
									}}
								>
									<span className="text-[9px] text-white/35 uppercase">
										{wd}
									</span>
									<span
										className="font-semibold text-[13px]"
										style={{ color: s.done ? accent : "rgba(255,255,255,0.7)" }}
									>
										{s.done ? "✓" : d}
									</span>
								</button>
							);
						})}
					</div>
				</div>
			) : (
				<div className="flex flex-col gap-3">
					{weekly
						.sort((a, b) => a.week_index - b.week_index)
						.map((s) => (
							<StepRow
								key={s.id}
								step={s}
								accent={accent}
								emphasis={s.week_index === currentWeekIndex}
								leading={`Week ${s.week_index + 1}`}
								onToggle={(done) => void setStepDone(s.id, done)}
							/>
						))}
				</div>
			)}
		</div>
	);
}

function StepRow({
	step,
	accent,
	emphasis,
	leading,
	onToggle,
}: {
	step: Step;
	accent: string;
	emphasis?: boolean;
	leading?: string;
	onToggle: (done: boolean) => void;
}) {
	return (
		<button
			type="button"
			onClick={() => onToggle(!step.done)}
			className="flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors"
			style={{
				borderColor: step.done
					? `${accent}40`
					: emphasis
						? `${accent}30`
						: "rgba(255,255,255,0.08)",
				backgroundColor: step.done
					? `${accent}12`
					: emphasis
						? "rgba(255,255,255,0.05)"
						: "transparent",
			}}
		>
			<div
				className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors"
				style={{
					borderColor: step.done ? accent : "rgba(255,255,255,0.3)",
					backgroundColor: step.done ? accent : "transparent",
				}}
			>
				{step.done && (
					<svg
						width="11"
						height="11"
						viewBox="0 0 12 12"
						fill="none"
						aria-hidden="true"
					>
						<path
							d="M2 6l3 3 5-5"
							stroke="#000"
							strokeWidth={1.8}
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				)}
			</div>
			<div className="flex-1">
				{leading && (
					<p
						className="mb-0.5 font-bold text-[10px] uppercase tracking-[0.1em]"
						style={{ color: emphasis ? accent : "rgba(255,255,255,0.35)" }}
					>
						{leading}
					</p>
				)}
				<p
					className={`font-medium text-[14px] leading-snug ${
						step.done ? "text-white/50 line-through" : "text-white"
					}`}
				>
					{step.title}
				</p>
				{step.estimate_label && (
					<p className="mt-0.5 text-[11px] text-white/35">
						{step.estimate_label}
					</p>
				)}
			</div>
		</button>
	);
}
