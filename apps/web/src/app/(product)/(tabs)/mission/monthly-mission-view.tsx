"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/auth-client";
import { type GoalSetResult, SetGoalModal } from "./set-goal-modal";

// ─────────────────────────────────────────────────────────────────────────────
// Mission / Task page — AI-powered task intelligence over the existing monthly
// mission. Visual + AI enhancement only: the data the page passes in (mission,
// steps, cadence, streak, week index) and the completion logic (setStepDone /
// changeCadence → supabase) are UNCHANGED. A Daily / Weekly tab switcher (driven
// by the existing `cadence` state, which still persists) flips between the Daily
// view (hero "Up Next" card with AI suggestion, collapsed task list, 7-day week
// dots, and the Signal-and-Noise journal passed in via `journalSlot`) and the
// Weekly view (goal card, the full 4-week plan, and a Sunday check-in).
// ─────────────────────────────────────────────────────────────────────────────

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
	generated_by: string;
};

// ── Warm tokens (shared with the rest of North) ──────────────────────────────
const BG = "#F8F4EC";
const TEXT = "#1A1208";
const GOLD = "#C47D00";
const GOLD_DEEP = "#A36200";
const TEAL = "#0EA596";
const VIOLET = "#7C4DFF";
const BORDER = "rgba(26,18,8,0.07)";

// ── AI suggestion ────────────────────────────────────────────────────────────
type Suggestion = {
	suggestion: string | null;
	resource?: string | null;
	source?: string | null;
	sourceUrl?: string | null;
	duration?: string | null;
	why?: string | null;
};
type SuggestionState = {
	status: "none" | "loading" | "done";
	data: Suggestion | null;
};
// Generic patterns that benefit from a concrete AI suggestion.
const GENERIC =
	/\b(learn|practice|read about|reading about|research|explore|study|studying)\b/i;

function isGeneric(title: string | undefined): boolean {
	return !!title && GENERIC.test(title);
}

// Fetch (or read from a 24h localStorage cache) a concrete suggestion for a
// generic task. Non-generic tasks resolve to "none" without a network call.
function useTaskSuggestion(
	task: Step | null,
	goalTitle: string,
	week: number,
): SuggestionState {
	const [state, setState] = useState<SuggestionState>({
		status: "none",
		data: null,
	});
	const taskId = task?.id;
	const taskTitle = task?.title;

	useEffect(() => {
		if (!taskId || !isGeneric(taskTitle)) {
			setState({ status: "none", data: null });
			return;
		}
		const cacheKey = `north_suggestion_${taskId}`;
		try {
			const cached = localStorage.getItem(cacheKey);
			if (cached) {
				const parsed = JSON.parse(cached) as { ts?: number; data?: Suggestion };
				if (parsed.ts && Date.now() - parsed.ts < 86_400_000) {
					setState({
						status: parsed.data?.suggestion ? "done" : "none",
						data: parsed.data ?? null,
					});
					return;
				}
			}
		} catch {
			/* storage unavailable — fall through to a fresh fetch */
		}

		const ctrl = new AbortController();
		setState({ status: "loading", data: null });
		fetch("/api/task-suggestion", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				task: taskTitle,
				goal: goalTitle,
				focusAreas: [],
				week,
			}),
			signal: ctrl.signal,
		})
			.then((r) => (r.ok ? r.json() : null))
			.then((data: Suggestion | null) => {
				if (!data?.suggestion) {
					setState({ status: "none", data: null });
					return;
				}
				try {
					localStorage.setItem(
						cacheKey,
						JSON.stringify({ ts: Date.now(), data }),
					);
				} catch {
					/* ignore quota / private mode */
				}
				setState({ status: "done", data });
			})
			.catch(() => setState({ status: "none", data: null }));
		return () => ctrl.abort();
	}, [taskId, taskTitle, goalTitle, week]);

	return state;
}

// ── Time-of-day scheduling (per task, localStorage) ──────────────────────────
const TIME_SLOTS = ["AM", "PM", "Eve"] as const;
type TimeSlot = (typeof TIME_SLOTS)[number];

function useTaskTime(taskId: string | undefined): {
	slot: TimeSlot | null;
	setSlot: (s: TimeSlot) => void;
} {
	const [slot, setSlotState] = useState<TimeSlot | null>(null);
	useEffect(() => {
		if (!taskId) return;
		try {
			const v = localStorage.getItem(`north_task_time_${taskId}`);
			setSlotState(
				v && (TIME_SLOTS as readonly string[]).includes(v)
					? (v as TimeSlot)
					: null,
			);
		} catch {
			setSlotState(null);
		}
	}, [taskId]);
	function setSlot(s: TimeSlot) {
		setSlotState(s);
		if (!taskId) return;
		try {
			localStorage.setItem(`north_task_time_${taskId}`, s);
		} catch {
			/* ignore */
		}
	}
	return { slot, setSlot };
}

// ── Date helpers ─────────────────────────────────────────────────────────────
function parseDate(d: string): Date {
	return new Date(`${d}T00:00:00`);
}
function dayLetter(date: string): string {
	return parseDate(date).toLocaleDateString("en-US", { weekday: "narrow" });
}
function todayLabel(today: string): string {
	return parseDate(today).toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
	});
}
// Consecutive completed daily steps ending at the most recent due date ≤ today.
function computeStreak(daily: Step[], today: string): number {
	const past = daily
		.filter((s) => s.due_date && s.due_date <= today)
		.sort((a, b) => (b.due_date ?? "").localeCompare(a.due_date ?? ""));
	let streak = 0;
	for (const s of past) {
		if (s.done) streak++;
		else break;
	}
	return streak;
}

export function MonthlyMissionView({
	mission: initialMission,
	steps: initialSteps,
	cadence: initialCadence,
	today,
	currentWeekIndex,
	streakState,
	promptGoal = false,
	journalSlot = null,
}: {
	mission: Mission | null;
	steps: Step[];
	cadence: "daily" | "weekly";
	today: string;
	currentWeekIndex: number;
	streakState: number | null;
	promptGoal?: boolean;
	// The daily Signal-and-Noise journal, composed on the server and shown only
	// under the Daily tab. Passed as a node so no journal data crosses into here.
	journalSlot?: ReactNode;
}) {
	const [mission, setMission] = useState(initialMission);
	const [steps, setSteps] = useState(initialSteps);
	const [cadence, setCadence] = useState(initialCadence);
	const [showGoal, setShowGoal] = useState(promptGoal);
	// Task list is secondary to the hero task — collapsed by default, tap to open.
	const [tasksOpen, setTasksOpen] = useState(false);

	function handleGoalSet(result: GoalSetResult) {
		setMission(result.mission);
		setSteps(result.steps);
		setCadence(result.cadence);
		setShowGoal(false);
	}

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

	// Macro 4-week progress (independent of the daily/weekly view).
	const weeksDone = weekly.filter((s) => s.done).length;
	const weeksTotal = weekly.length || 4;
	const goalPct = Math.round((weeksDone / weeksTotal) * 100);

	// Hero "Up Next" task: today's micro-step (daily) or this week's milestone
	// (weekly); fall back to the next undone day in the current week.
	const heroTask =
		(cadence === "daily" ? todayStep : (weekMilestone ?? null)) ??
		weekDays.find((s) => !s.done) ??
		weekMilestone ??
		null;

	// This week's daily progress + days remaining.
	const tasksDone = weekDays.filter((s) => s.done).length;
	const tasksTotal = weekDays.length;
	const tasksPct = tasksTotal ? Math.round((tasksDone / tasksTotal) * 100) : 0;
	const daysLeft = weekDays.filter((s) => (s.due_date ?? "") >= today).length;

	const streak = streakState != null ? computeStreak(daily, today) : 0;

	const goalTitle = mission?.goal_title ?? "";
	const goalShort = goalTitle.replace(/\.\s*$/, "");
	const suggestion = useTaskSuggestion(
		heroTask,
		goalTitle,
		currentWeekIndex + 1,
	);

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
			<div
				className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-[18px] pt-14 text-center font-jakarta"
				style={{ background: BG }}
			>
				<CompassMark />
				<h2 className="font-black text-[20px]" style={{ color: TEXT }}>
					No goal yet
				</h2>
				<p className="text-[13px]" style={{ color: "rgba(26,18,8,0.55)" }}>
					Your monthly goal will appear here shortly.
				</p>
			</div>
		);
	}

	const monthName = parseDate(mission.month_start).toLocaleDateString("en-US", {
		month: "long",
	});
	const isSunday = parseDate(today).getDay() === 0;

	return (
		<div
			className="px-[18px] pt-[14px] font-jakarta"
			style={{ background: BG, color: TEXT }}
		>
			<style>{ANIM}</style>

			{/* ── Header ── */}
			<header className="mb-[14px] flex items-start justify-between">
				<div>
					<p
						className="font-bold text-[10px] uppercase tracking-[0.12em]"
						style={{ color: "rgba(26,18,8,0.3)" }}
					>
						{todayLabel(today)}
					</p>
					<h1 className="font-black text-[22px] tracking-tight">Mission</h1>
				</div>
				<StreakBadge streak={streak} />
			</header>

			{/* ── Progress strip ── */}
			<div className="mb-[14px] flex gap-[10px]">
				<StatCard label="Tasks this week" barColor={GOLD} barPct={tasksPct}>
					<span className="font-black text-[22px]" style={{ color: GOLD }}>
						{tasksDone}
						<span
							className="text-[14px]"
							style={{ color: "rgba(26,18,8,0.3)" }}
						>
							/{tasksTotal || 0}
						</span>
					</span>
				</StatCard>
				<StatCard
					label="Goal progress"
					barGradient={`linear-gradient(90deg, ${GOLD}, ${TEAL})`}
					barPct={goalPct}
				>
					<span className="font-black text-[22px]" style={{ color: TEAL }}>
						{goalPct}%
					</span>
				</StatCard>
				<StatCard
					label="Days left"
					barColor={VIOLET}
					barPct={tasksTotal ? (daysLeft / tasksTotal) * 100 : 0}
				>
					<span className="font-black text-[22px]" style={{ color: VIOLET }}>
						{daysLeft}
					</span>
				</StatCard>
			</div>

			{/* ── Daily / Weekly tab switcher ── */}
			<TabSwitcher
				active={cadence}
				onChange={(next) => void changeCadence(next)}
			/>

			{/* ── Tab content — display switch (cadence preference still persists) ── */}
			<div key={cadence} className="mm-tab-in">
				{cadence === "daily" ? (
					<>
						{/* Hero · Up Next */}
						<HeroTask
							task={heroTask}
							week={currentWeekIndex + 1}
							goalShort={goalShort}
							suggestion={suggestion}
							onToggle={(t) => void setStepDone(t.id, !t.done)}
						/>

						{/* Today's Tasks (collapsed by default, tap to expand) */}
						<div className="mb-[10px] flex items-center gap-2">
							<button
								type="button"
								aria-expanded={tasksOpen}
								onClick={() => setTasksOpen((v) => !v)}
								className="flex cursor-pointer items-center gap-2"
							>
								<span
									className="font-bold text-[10px] uppercase tracking-[0.12em]"
									style={{ color: "rgba(26,18,8,0.5)" }}
								>
									Today's Tasks
								</span>
								{tasksTotal > 0 && (
									<span
										className="font-bold text-[10px]"
										style={{ color: "rgba(26,18,8,0.3)" }}
									>
										{tasksDone}/{tasksTotal}
									</span>
								)}
								<Chevron open={tasksOpen} />
							</button>
						</div>

						{tasksOpen &&
							(weekDays.length > 0 ? (
								<div className="mb-[14px] flex flex-col gap-[6px]">
									{weekDays.map((s) => (
										<TaskRow
											key={s.id}
											task={s}
											isCurrent={s.id === heroTask?.id}
											isNext={s.due_date === today}
											goalShort={goalShort}
											suggestion={s.id === heroTask?.id ? suggestion : null}
											onToggle={() => void setStepDone(s.id, !s.done)}
										/>
									))}
								</div>
							) : (
								<p
									className="mb-[14px] text-[13px]"
									style={{ color: "rgba(26,18,8,0.45)" }}
								>
									No tasks scheduled for this week.
								</p>
							))}

						{/* Week dots */}
						{weekDays.length > 0 && (
							<div
								className="mb-[14px] flex items-end gap-[5px] rounded-[16px] border bg-white p-[12px_14px]"
								style={{
									borderColor: BORDER,
									boxShadow: "0 1px 6px rgba(26,18,8,0.04)",
								}}
							>
								{weekDays.map((s) => {
									const isToday = s.due_date === today;
									const state = s.done
										? "done"
										: isToday
											? "today"
											: "upcoming";
									return (
										<button
											key={s.id}
											type="button"
											aria-pressed={s.done}
											aria-label={`${s.due_date ? dayLetter(s.due_date) : ""} — ${
												s.done ? "done" : isToday ? "today" : "upcoming"
											}`}
											onClick={() => void setStepDone(s.id, !s.done)}
											className="flex flex-1 cursor-pointer flex-col items-center"
										>
											<span
												className="mb-1 font-bold text-[9px] uppercase"
												style={{ color: "rgba(26,18,8,0.3)" }}
											>
												{s.due_date ? dayLetter(s.due_date) : "·"}
											</span>
											<DayCircle state={state} />
										</button>
									);
								})}
							</div>
						)}

						{/* Signal & Noise journal (Daily tab only) */}
						{journalSlot}
					</>
				) : (
					<>
						{/* Goal card with progress */}
						<GoalCard
							title={mission.goal_title}
							weeksDone={weeksDone}
							weeksTotal={weeksTotal}
							pct={goalPct}
						/>

						{/* 4-Week Plan — all four weeks */}
						<p
							className="mb-[10px] font-bold text-[10px] uppercase tracking-[0.12em]"
							style={{ color: "rgba(26,18,8,0.5)" }}
						>
							4-Week Plan
						</p>
						{weekly.length > 0 ? (
							<div className="mb-[14px] flex flex-col gap-[8px]">
								{weekly.map((w) => {
									const isDone = w.done || w.week_index < currentWeekIndex;
									const isCurrent =
										!isDone && w.week_index === currentWeekIndex;
									return (
										<WeekCard
											key={w.id}
											week={w}
											isDone={isDone}
											isCurrent={isCurrent}
										/>
									);
								})}
							</div>
						) : (
							<p
								className="mb-[14px] text-[13px]"
								style={{ color: "rgba(26,18,8,0.45)" }}
							>
								Your weekly plan is being prepared.
							</p>
						)}

						{/* Sunday check-in */}
						{isSunday && (
							<SundayCheckin onStart={() => void changeCadence("daily")} />
						)}
					</>
				)}
			</div>

			{/* Goal edit (preserves the existing set-goal flow) */}
			<button
				type="button"
				onClick={() => setShowGoal(true)}
				className="mb-2 cursor-pointer font-bold text-[10px] uppercase tracking-[0.1em] transition-colors hover:opacity-80"
				style={{ color: "rgba(196,125,0,0.7)" }}
			>
				Edit {monthName} goal
			</button>

			{showGoal && (
				<SetGoalModal
					monthName={monthName}
					monthStart={mission.month_start}
					initialGoal={mission.goal_title}
					initialIntent={mission.goal_intent ?? ""}
					initialCadence={cadence}
					autosuggest={mission.generated_by !== "manual"}
					onDismiss={() => setShowGoal(false)}
					onGoalSet={handleGoalSet}
				/>
			)}
		</div>
	);
}

// ── Daily / Weekly tab switcher ─────────────────────────────────────────────
function TabSwitcher({
	active,
	onChange,
}: {
	active: "daily" | "weekly";
	onChange: (next: "daily" | "weekly") => void;
}) {
	// First-visit nudge toward the (less obvious) weekly view; auto-dismisses.
	const [hint, setHint] = useState(false);
	useEffect(() => {
		try {
			if (localStorage.getItem("north_tab_hint_seen")) return;
		} catch {
			return;
		}
		setHint(true);
		const t = setTimeout(() => {
			setHint(false);
			try {
				localStorage.setItem("north_tab_hint_seen", "1");
			} catch {
				/* ignore */
			}
		}, 3000);
		return () => clearTimeout(t);
	}, []);

	function dismissHint() {
		setHint(false);
		try {
			localStorage.setItem("north_tab_hint_seen", "1");
		} catch {
			/* ignore */
		}
	}

	const TABS = [
		{ key: "daily" as const, label: "Today", sub: "Your next task" },
		{ key: "weekly" as const, label: "This Week", sub: "Your 4-week plan" },
	];

	return (
		<div className="relative mb-[14px]">
			<div
				className="flex rounded-[16px] p-1"
				style={{ background: "rgba(26,18,8,0.06)" }}
			>
				{TABS.map((t) => {
					const on = active === t.key;
					return (
						<button
							key={t.key}
							type="button"
							aria-pressed={on}
							aria-label={`${t.label} — ${t.sub}`}
							onClick={() => {
								dismissHint();
								onChange(t.key);
							}}
							className="flex flex-1 cursor-pointer flex-col items-center gap-[3px] rounded-[12px] px-[16px] py-[10px] transition-all duration-200 motion-reduce:transition-none"
							style={
								on
									? {
											background: "#FFFFFF",
											boxShadow: "0 2px 8px rgba(26,18,8,0.08)",
										}
									: { background: "transparent" }
							}
						>
							{t.key === "daily" ? (
								<SunIcon color={on ? GOLD : "rgba(26,18,8,0.25)"} />
							) : (
								<CalendarIcon color={on ? GOLD : "rgba(26,18,8,0.25)"} />
							)}
							<span
								className="font-extrabold text-[12px]"
								style={{ color: on ? TEXT : "rgba(26,18,8,0.4)" }}
							>
								{t.label}
							</span>
							<span
								className="font-medium text-[10px]"
								style={{
									color: on ? "rgba(26,18,8,0.4)" : "rgba(26,18,8,0.25)",
								}}
							>
								{t.sub}
							</span>
							<span
								className="h-[4px] w-[4px] rounded-full"
								style={{ background: on ? GOLD : "transparent" }}
							/>
						</button>
					);
				})}
			</div>

			{hint && (
				<div
					role="status"
					className="pointer-events-none absolute top-full right-[16px] z-20 mt-2 flex flex-col items-center"
				>
					<span
						aria-hidden="true"
						className="h-0 w-0"
						style={{
							borderLeft: "5px solid transparent",
							borderRight: "5px solid transparent",
							borderBottom: "5px solid rgba(26,18,8,0.75)",
						}}
					/>
					<span
						className="rounded-[8px] px-[10px] py-[5px] font-medium text-[10px] text-white backdrop-blur-sm"
						style={{ background: "rgba(26,18,8,0.75)" }}
					>
						Tap to see your weekly plan
					</span>
				</div>
			)}
		</div>
	);
}

// ── Goal card (Weekly tab) ──────────────────────────────────────────────────
function GoalCard({
	title,
	weeksDone,
	weeksTotal,
	pct,
}: {
	title: string;
	weeksDone: number;
	weeksTotal: number;
	pct: number;
}) {
	return (
		<section
			className="relative mb-[14px] overflow-hidden rounded-[18px] border p-4"
			style={{
				borderColor: "rgba(196,125,0,0.25)",
				background:
					"linear-gradient(135deg, rgba(196,125,0,0.10), rgba(196,125,0,0.02))",
			}}
		>
			<span
				aria-hidden="true"
				className="absolute top-0 bottom-0 left-0 w-[3px] rounded-r-[3px]"
				style={{ background: GOLD }}
			/>
			<p
				className="mb-1.5 font-bold text-[9px] uppercase tracking-[0.15em]"
				style={{ color: "rgba(196,125,0,0.7)" }}
			>
				This Month's Goal
			</p>
			<p
				className="mb-3 font-bold text-[15px] leading-[1.4]"
				style={{ color: TEXT }}
			>
				{title}
			</p>
			<div className="mb-2 flex items-center justify-between">
				<span className="text-[11px]" style={{ color: "rgba(26,18,8,0.55)" }}>
					{weeksDone} of {weeksTotal} weeks
				</span>
				<span className="font-bold text-[11px]" style={{ color: "#8B5500" }}>
					{pct}%
				</span>
			</div>
			<div
				className="h-[5px] overflow-hidden rounded-full"
				style={{ background: "rgba(26,18,8,0.1)" }}
			>
				<div
					className="h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
					style={{
						width: `${pct}%`,
						background: `linear-gradient(90deg, ${GOLD}, ${TEAL})`,
					}}
				/>
			</div>
		</section>
	);
}

// ── 4-week plan card (Weekly tab) ───────────────────────────────────────────
function WeekCard({
	week,
	isDone,
	isCurrent,
}: {
	week: Step;
	isDone: boolean;
	isCurrent: boolean;
}) {
	const badge = isDone
		? {
				label: "Done",
				bg: "rgba(14,165,150,0.1)",
				color: "#0A6458",
				border: "rgba(14,165,150,0.2)",
			}
		: isCurrent
			? {
					label: "In progress",
					bg: "rgba(196,125,0,0.1)",
					color: "#8B5500",
					border: "rgba(196,125,0,0.2)",
				}
			: {
					label: "Upcoming",
					bg: "rgba(26,18,8,0.05)",
					color: "rgba(26,18,8,0.3)",
					border: "rgba(26,18,8,0.08)",
				};
	const circle = isDone
		? { bg: "rgba(196,125,0,0.12)", border: "rgba(196,125,0,0.4)", color: GOLD }
		: isCurrent
			? { bg: GOLD, border: GOLD, color: "#FFFFFF" }
			: {
					bg: "transparent",
					border: "rgba(26,18,8,0.12)",
					color: "rgba(26,18,8,0.4)",
				};
	return (
		<div
			className="relative flex items-start gap-3 overflow-hidden rounded-[14px] border p-[12px_14px]"
			style={{
				background: isCurrent ? "rgba(255,248,232,0.7)" : "#FFFFFF",
				borderColor: isCurrent ? "rgba(196,125,0,0.3)" : BORDER,
				boxShadow: "0 1px 6px rgba(26,18,8,0.04)",
			}}
		>
			{isCurrent && (
				<span
					aria-hidden="true"
					className="absolute top-0 bottom-0 left-0 w-[3px] rounded-r-[3px]"
					style={{ background: GOLD }}
				/>
			)}
			<span
				className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px] font-black text-[11px]"
				style={{
					background: circle.bg,
					borderColor: circle.border,
					color: circle.color,
				}}
			>
				{isDone ? <CheckMark color={GOLD} size={12} /> : week.week_index + 1}
			</span>
			<div className="min-w-0 flex-1">
				<p
					className="mb-1 font-bold text-[9px] uppercase tracking-[0.1em]"
					style={{ color: "rgba(26,18,8,0.3)" }}
				>
					Week {week.week_index + 1}
				</p>
				<p
					className="mb-1.5 font-bold text-[13px] leading-[1.35]"
					style={{ color: TEXT }}
				>
					{week.title}
				</p>
				<span
					className="inline-block rounded-[20px] border px-[7px] py-[2px] font-bold text-[8px]"
					style={{
						background: badge.bg,
						color: badge.color,
						borderColor: badge.border,
					}}
				>
					{badge.label}
				</span>
			</div>
		</div>
	);
}

// ── Sunday check-in (Weekly tab, Sundays only) ──────────────────────────────
const REVIEW_QS = [
	"What worked well this week?",
	"What got in the way?",
	"Does your goal still feel right?",
];
function SundayCheckin({ onStart }: { onStart: () => void }) {
	return (
		<section
			className="mb-[14px] rounded-[18px] border p-4"
			style={{
				borderColor: "rgba(196,125,0,0.2)",
				background:
					"linear-gradient(135deg, rgba(196,125,0,0.09), rgba(196,125,0,0.02))",
			}}
		>
			<p
				className="mb-2 font-bold text-[9px] uppercase tracking-[0.15em]"
				style={{ color: "rgba(196,125,0,0.65)" }}
			>
				Weekly Review
			</p>
			<p className="mb-3 font-black text-[15px]" style={{ color: TEXT }}>
				How was your week?
			</p>
			{REVIEW_QS.map((q) => (
				<div key={q} className="mb-3 flex items-start gap-3">
					<span
						className="mt-1.5 h-[6px] w-[6px] shrink-0 rounded-full"
						style={{ background: VIOLET }}
					/>
					<span
						className="font-semibold text-[12px] leading-[1.5]"
						style={{ color: "rgba(26,18,8,0.6)" }}
					>
						{q}
					</span>
				</div>
			))}
			<button
				type="button"
				onClick={onStart}
				className="w-full cursor-pointer rounded-[12px] py-[11px] font-bold text-[13px] text-white"
				style={{
					background: GOLD,
					boxShadow: "0 4px 16px rgba(196,125,0,0.25)",
				}}
			>
				Start this week's review
			</button>
		</section>
	);
}

function SunIcon({ color }: { color: string }) {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke={color}
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
		</svg>
	);
}

function CalendarIcon({ color }: { color: string }) {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke={color}
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<rect x="3" y="4" width="18" height="18" rx="2" />
			<path d="M16 2v4M8 2v4M3 10h18" />
		</svg>
	);
}

// ── Streak badge ─────────────────────────────────────────────────────────────
function StreakBadge({ streak }: { streak: number }) {
	const active = streak > 0;
	return (
		<div
			className="mt-1 flex items-center gap-[5px] rounded-[20px] px-3 py-1.5"
			style={{
				background:
					"linear-gradient(135deg, rgba(212,146,10,0.12), rgba(212,146,10,0.06))",
				border: "1px solid rgba(212,146,10,0.3)",
			}}
		>
			<FlameIcon />
			<span className="flex flex-col leading-none">
				<span
					className="font-black text-[16px] leading-none"
					style={{ color: GOLD }}
				>
					{active ? streak : 0}
				</span>
			</span>
			<span
				className="font-bold text-[9px] uppercase tracking-wider"
				style={{ color: "rgba(196,125,0,0.7)" }}
			>
				{active ? "day streak" : "Start today"}
			</span>
		</div>
	);
}

// ── Hero · Up Next ───────────────────────────────────────────────────────────
function HeroTask({
	task,
	week,
	goalShort,
	suggestion,
	onToggle,
}: {
	task: Step | null;
	week: number;
	goalShort: string;
	suggestion: SuggestionState;
	onToggle: (t: Step) => void;
}) {
	const { slot, setSlot } = useTaskTime(task?.id);
	return (
		<section
			className="relative mb-[14px] overflow-hidden rounded-[22px] p-5"
			style={{
				background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DEEP})`,
				boxShadow: "0 8px 32px rgba(196,125,0,0.25)",
			}}
		>
			<CompassRose />

			<div className="relative">
				{/* Eyebrow */}
				<div className="mb-[10px] flex items-center gap-2">
					<span
						className="h-[5px] w-[5px] rounded-full"
						style={{ background: "rgba(255,255,255,0.5)" }}
					/>
					<span
						className="font-bold text-[9px] uppercase tracking-[0.15em]"
						style={{ color: "rgba(255,255,255,0.65)" }}
					>
						Up Next · Week {week}
					</span>
				</div>

				{/* Title */}
				<h2 className="mb-2 font-black text-[18px] text-white leading-[1.3] tracking-[-0.3px]">
					{task ? task.title : "You're all caught up for now"}
				</h2>

				{/* AI suggestion */}
				{suggestion.status === "loading" && <SuggestionSkeleton />}
				{suggestion.status === "done" && suggestion.data && (
					<SuggestionPill data={suggestion.data} />
				)}

				{/* Goal link */}
				{goalShort && (
					<p
						className="mb-4 font-semibold text-[10px]"
						style={{ color: "rgba(255,255,255,0.55)" }}
					>
						→ {goalShort}
					</p>
				)}

				{/* Actions */}
				<div className="flex items-center gap-2">
					{task && (
						<button
							type="button"
							aria-pressed={task.done}
							onClick={() => onToggle(task)}
							className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-[12px] px-[20px] py-[11px] font-black text-[13px] transition-[filter] duration-200 hover:brightness-95 motion-reduce:transition-none"
							style={{
								background: "#FFFFFF",
								color: GOLD,
								boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
							}}
						>
							<CheckMark color={GOLD} />
							{task.done ? "Done" : "Mark done"}
						</button>
					)}

					<div className="flex flex-1 gap-[5px]">
						{TIME_SLOTS.map((s) => {
							const on = slot === s;
							return (
								<button
									key={s}
									type="button"
									aria-pressed={on}
									aria-label={`Schedule ${s}`}
									onClick={() => setSlot(s)}
									className="flex-1 cursor-pointer rounded-[10px] py-[7px] text-center font-bold text-[9px] transition-colors duration-200 motion-reduce:transition-none"
									style={{
										background: on
											? "rgba(255,255,255,0.2)"
											: "rgba(255,255,255,0.1)",
										border: `1px solid ${
											on ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)"
										}`,
										color: on ? "#FFFFFF" : "rgba(255,255,255,0.6)",
									}}
								>
									{s}
								</button>
							);
						})}
					</div>
				</div>
			</div>
		</section>
	);
}

function SuggestionPill({ data }: { data: Suggestion }) {
	return (
		<div
			className="mb-4 rounded-[12px] p-[10px_14px] backdrop-blur-sm"
			style={{
				background: "rgba(255,255,255,0.15)",
				border: "1px solid rgba(255,255,255,0.25)",
			}}
		>
			<div className="mb-2 flex items-center gap-2">
				<SparkleIcon color="rgba(255,255,255,0.7)" />
				<span
					className="font-bold text-[9px] uppercase tracking-[0.1em]"
					style={{ color: "rgba(255,255,255,0.6)" }}
				>
					North suggests
				</span>
				{data.duration && (
					<span
						className="font-bold text-[9px]"
						style={{ color: "rgba(255,255,255,0.45)" }}
					>
						· {data.duration}
					</span>
				)}
			</div>
			<p className="font-bold text-[13px] text-white leading-[1.4]">
				{data.suggestion}
			</p>
			{(data.source || data.resource) && (
				<div className="mt-2 flex items-center gap-2">
					<span
						className="flex items-center gap-1.5 rounded-full px-2.5 py-1 font-bold text-[9px]"
						style={{
							background: "rgba(255,255,255,0.15)",
							border: "1px solid rgba(255,255,255,0.2)",
							color: "rgba(255,255,255,0.7)",
						}}
					>
						<LinkIcon />
						{data.source ?? data.resource}
					</span>
					{data.sourceUrl ? (
						<a
							href={data.sourceUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="cursor-pointer rounded-full px-3 py-1 font-bold text-[10px] text-white transition-colors hover:bg-white/30"
							style={{
								background: "rgba(255,255,255,0.2)",
								border: "1px solid rgba(255,255,255,0.3)",
							}}
						>
							Use this
						</a>
					) : null}
				</div>
			)}
		</div>
	);
}

function SuggestionSkeleton() {
	return (
		<div
			className="mb-4 rounded-[12px] p-[10px_14px]"
			style={{
				background: "rgba(255,255,255,0.1)",
				border: "1px solid rgba(255,255,255,0.15)",
			}}
		>
			<div
				className="mm-shimmer mb-2 h-4 w-3/4 rounded-lg"
				style={{ background: "rgba(255,255,255,0.15)" }}
			/>
			<div
				className="mm-shimmer h-3 w-1/2 rounded-lg"
				style={{ background: "rgba(255,255,255,0.1)" }}
			/>
		</div>
	);
}

// ── Progress stat card ───────────────────────────────────────────────────────
function StatCard({
	label,
	children,
	barColor,
	barGradient,
	barPct,
}: {
	label: string;
	children: React.ReactNode;
	barColor?: string;
	barGradient?: string;
	barPct: number;
}) {
	return (
		<div
			className="flex-1 rounded-[16px] border bg-white p-3 text-center"
			style={{ borderColor: BORDER, boxShadow: "0 1px 6px rgba(26,18,8,0.04)" }}
		>
			{children}
			<p
				className="mt-1 font-bold text-[9px] uppercase tracking-[0.08em]"
				style={{ color: "rgba(26,18,8,0.35)" }}
			>
				{label}
			</p>
			<div
				className="mt-2 h-[4px] overflow-hidden rounded-full"
				style={{ background: "rgba(26,18,8,0.07)" }}
			>
				<div
					className="h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
					style={{
						width: `${Math.max(0, Math.min(100, barPct))}%`,
						background: barGradient ?? barColor,
					}}
				/>
			</div>
		</div>
	);
}

// ── Week dot circle ──────────────────────────────────────────────────────────
function DayCircle({ state }: { state: "done" | "today" | "upcoming" }) {
	if (state === "done") {
		return (
			<span
				className="flex h-[28px] w-[28px] items-center justify-center rounded-full border-[1.5px]"
				style={{
					background: "rgba(196,125,0,0.1)",
					borderColor: "rgba(196,125,0,0.4)",
				}}
			>
				<CheckMark color={GOLD} size={12} />
			</span>
		);
	}
	if (state === "today") {
		return (
			<span
				className="flex h-[28px] w-[28px] items-center justify-center rounded-full border-[1.5px]"
				style={{ background: GOLD, borderColor: GOLD }}
			>
				<span
					className="h-[6px] w-[6px] rounded-full"
					style={{ background: "#FFFFFF" }}
				/>
			</span>
		);
	}
	return (
		<span
			className="h-[28px] w-[28px] rounded-full border-[1.5px]"
			style={{
				background: "rgba(26,18,8,0.03)",
				borderColor: "rgba(26,18,8,0.08)",
			}}
		/>
	);
}

// ── Task row ─────────────────────────────────────────────────────────────────
function TaskRow({
	task,
	isCurrent,
	isNext,
	goalShort,
	suggestion,
	onToggle,
}: {
	task: Step;
	isCurrent: boolean;
	isNext: boolean;
	goalShort: string;
	suggestion: SuggestionState | null;
	onToggle: () => void;
}) {
	const accent = task.done
		? TEAL
		: isCurrent || isNext
			? GOLD
			: "rgba(26,18,8,0.07)";
	const badge = task.done
		? {
				label: "Done",
				bg: "rgba(14,165,150,0.1)",
				color: "#0A6458",
				border: "rgba(14,165,150,0.2)",
			}
		: isNext || isCurrent
			? {
					label: "Next",
					bg: "rgba(196,125,0,0.1)",
					color: "#8B5500",
					border: "rgba(196,125,0,0.2)",
				}
			: {
					label: "Later",
					bg: "rgba(26,18,8,0.05)",
					color: "rgba(26,18,8,0.3)",
					border: "rgba(26,18,8,0.08)",
				};
	return (
		<button
			type="button"
			aria-pressed={task.done}
			onClick={onToggle}
			className="mm-task relative flex w-full cursor-pointer items-start gap-[12px] overflow-hidden rounded-[14px] border bg-white p-[12px_14px] text-left"
			style={{ borderColor: BORDER, boxShadow: "0 1px 4px rgba(26,18,8,0.04)" }}
		>
			<span
				aria-hidden="true"
				className="absolute top-0 bottom-0 left-0 w-[3px] rounded-r-[3px]"
				style={{ background: accent }}
			/>

			{/* Checkbox */}
			<span
				className="mt-[1px] flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border-[1.5px]"
				style={
					task.done
						? { background: TEAL, borderColor: TEAL }
						: {
								background: "transparent",
								borderColor: isCurrent || isNext ? GOLD : "rgba(26,18,8,0.15)",
							}
				}
			>
				{task.done && <CheckMark color="#FFFFFF" size={11} />}
			</span>

			<span className="min-w-0 flex-1">
				<span
					className="block font-bold text-[12px] leading-[1.4]"
					style={
						task.done
							? { color: "rgba(26,18,8,0.35)", textDecoration: "line-through" }
							: { color: TEXT }
					}
				>
					{task.title}
				</span>

				{/* Inline AI suggestion — current task only */}
				{suggestion?.status === "done" && suggestion.data?.suggestion && (
					<span
						className="mt-[6px] flex items-start gap-[6px] rounded-[8px] p-[7px_10px]"
						style={{
							background: "rgba(196,125,0,0.06)",
							border: "1px solid rgba(196,125,0,0.15)",
						}}
					>
						<SparkleIcon color={GOLD} size={10} />
						<span
							className="line-clamp-1 font-medium text-[11px] leading-[1.4]"
							style={{ color: "rgba(26,18,8,0.6)" }}
						>
							{suggestion.data.suggestion}
						</span>
					</span>
				)}

				{goalShort && (
					<span
						className="mt-[2px] block font-semibold text-[9px]"
						style={{ color: "rgba(196,125,0,0.55)" }}
					>
						→ {goalShort}
					</span>
				)}
			</span>

			<span
				className="shrink-0 rounded-[20px] border px-[7px] py-[2px] font-bold text-[8px]"
				style={{
					background: badge.bg,
					color: badge.color,
					borderColor: badge.border,
				}}
			>
				{badge.label}
			</span>
		</button>
	);
}

// ── Collapse chevron ─────────────────────────────────────────────────────────
function Chevron({ open }: { open: boolean }) {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="rgba(26,18,8,0.4)"
			strokeWidth={2.4}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			className="transition-transform duration-200 motion-reduce:transition-none"
			style={{ transform: open ? "rotate(180deg)" : "none" }}
		>
			<path d="M6 9l6 6 6-6" />
		</svg>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG art
// ─────────────────────────────────────────────────────────────────────────────

function CompassRose() {
	return (
		<svg
			aria-hidden="true"
			className="pointer-events-none absolute inset-0 h-full w-full"
			style={{ opacity: 0.08 }}
			viewBox="0 0 320 200"
			fill="none"
			preserveAspectRatio="xMaxYMin slice"
		>
			<g stroke="#FFFFFF" strokeWidth="1">
				<circle cx="270" cy="40" r="70" />
				<circle cx="270" cy="40" r="48" />
				<circle cx="270" cy="40" r="26" />
				<line x1="270" y1="-40" x2="270" y2="120" />
				<line x1="190" y1="40" x2="350" y2="40" />
				<line x1="214" y1="-16" x2="326" y2="96" />
				<line x1="326" y1="-16" x2="214" y2="96" />
			</g>
		</svg>
	);
}

function CompassMark() {
	return (
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
	);
}

function FlameIcon() {
	return (
		<svg
			width="13"
			height="13"
			viewBox="0 0 24 24"
			fill={GOLD}
			aria-hidden="true"
		>
			<path d="M12 2c1 4-2 5-2 8a2 2 0 1 0 4 0c0-1 0-1 .5-2 1 2 1.5 3 1.5 4a4 4 0 1 1-8 0c0-3 2-4 2-6 0-2 1-3 2-4z" />
		</svg>
	);
}

function SparkleIcon({ color, size = 12 }: { color: string; size?: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill={color}
			aria-hidden="true"
			className="mt-[1px] shrink-0"
		>
			<path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z" />
		</svg>
	);
}

function LinkIcon() {
	return (
		<svg
			width="10"
			height="10"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2.4}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
			<path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
		</svg>
	);
}

function CheckMark({ color, size = 13 }: { color: string; size?: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 12 12"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M2 6l2.5 2.5L10 3"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

const ANIM = `
@keyframes mm-shimmer { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
.mm-shimmer { animation: mm-shimmer 1.5s ease-in-out infinite; }
.mm-task { transition: box-shadow 0.15s ease; }
.mm-task:hover { box-shadow: 0 3px 12px rgba(26,18,8,0.08); }
@keyframes mm-tab-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.mm-tab-in { animation: mm-tab-in 200ms ease-out both; }
@media (prefers-reduced-motion: reduce) {
  .mm-shimmer { animation: none; opacity: 0.5; }
  .mm-task { transition: none; }
  .mm-tab-in { animation: none; }
}
`;
