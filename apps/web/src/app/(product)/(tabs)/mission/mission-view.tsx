"use client";

import { useState } from "react";
import { supabase } from "@/lib/auth-client";

type Task = {
	id: string;
	label: string;
	kind: string;
	estimate_label: string | null;
	done: boolean;
};
type Mission = {
	id: string;
	title: string;
	intent: string | null;
	mission_date: string;
};

const STREAK_LABELS: Record<number, string> = {
	0: "Miss",
	1: "Active",
	2: "Directed",
	3: "Rest day",
};

export function MissionView({
	mission,
	tasks: initialTasks,
	streakState,
}: {
	mission: Mission | null;
	tasks: Task[];
	streakState: number | null;
}) {
	const [tasks, setTasks] = useState(initialTasks);

	const toggle = async (taskId: string, done: boolean) => {
		setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, done } : t)));
		await supabase
			.from("user_mission_tasks")
			.update({ done, completed_at: done ? new Date().toISOString() : null })
			.eq("id", taskId);
	};

	const completed = tasks.filter((t) => t.done).length;
	const progress = tasks.length > 0 ? completed / tasks.length : 0;

	if (!mission) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
				<div className="text-4xl">🧭</div>
				<h2 className="font-semibold text-white text-xl">No mission today</h2>
				<p className="text-sm text-white/50">
					Your daily mission will appear here once generated. Check back
					shortly.
				</p>
			</div>
		);
	}

	return (
		<div className="px-5 pt-14">
			{/* Header */}
			<div className="mb-6 flex items-center justify-between">
				<h1 className="font-semibold text-2xl text-white tracking-tight">
					Today
				</h1>
				{streakState !== null && (
					<span className="rounded-full border border-white/15 bg-white/8 px-3 py-1 font-medium text-[11px] text-white/60">
						{STREAK_LABELS[streakState] ?? "–"}
					</span>
				)}
			</div>

			{/* Mission card */}
			<div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5">
				<h2 className="mb-1.5 font-semibold text-lg text-white leading-snug">
					{mission.title}
				</h2>
				{mission.intent && (
					<p className="text-[13px] text-white/55 leading-relaxed">
						{mission.intent}
					</p>
				)}
			</div>

			{/* Progress bar */}
			<div className="mb-5">
				<div className="mb-2 flex items-center justify-between">
					<span className="text-[12px] text-white/50">
						{completed} of {tasks.length} tasks
					</span>
					<span className="font-semibold text-[12px] text-white">
						{Math.round(progress * 100)}%
					</span>
				</div>
				<div className="h-1.5 overflow-hidden rounded-full bg-white/10">
					<div
						className="h-full rounded-full bg-white transition-all duration-500"
						style={{ width: `${progress * 100}%` }}
					/>
				</div>
			</div>

			{/* Tasks */}
			<div className="flex flex-col gap-3">
				{tasks.map((task) => (
					<button
						key={task.id}
						type="button"
						onClick={() => toggle(task.id, !task.done)}
						className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
							task.done
								? "border-white/15 bg-white/8"
								: "border-white/8 bg-transparent"
						}`}
					>
						<div
							className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
								task.done
									? "border-white bg-white"
									: "border-white/30 bg-transparent"
							}`}
						>
							{task.done && (
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
							<p
								className={`font-medium text-[14px] leading-snug ${task.done ? "text-white/50 line-through" : "text-white"}`}
							>
								{task.label}
							</p>
							{task.estimate_label && (
								<p className="mt-0.5 text-[11px] text-white/35">
									{task.estimate_label}
								</p>
							)}
						</div>
					</button>
				))}
			</div>
		</div>
	);
}
