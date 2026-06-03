// MSN-02/04/05: Task completion with offline retry and PostHog events.
//
// Optimistic-first: UI updates immediately; Supabase write retries up to
// 3× with backoff. On persistent failure the toggle reverts so state
// stays consistent with the server. This covers brief network hiccups
// (lift/basement) without a full offline queue.
//
// MSN-05: fires PostHog task_completed / task_uncompleted events after
// each confirmed write. Best-effort — never blocks the toggle.

import { usePostHog } from "posthog-react-native";
import { useCallback, useEffect, useRef, useState } from "react";

import { supabase, useSession } from "../auth-client";
import type { MissionTask } from "./use-today-mission";

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
	let lastErr: unknown;
	for (let i = 0; i < retries; i++) {
		try {
			return await fn();
		} catch (err) {
			lastErr = err;
			if (i < retries - 1) {
				await new Promise((r) => setTimeout(r, 400 * 2 ** i));
			}
		}
	}
	throw lastErr;
}

export function useTaskCompletion(
	missionId: string | null,
	initialTasks: MissionTask[],
) {
	const { data: session } = useSession();
	const posthog = usePostHog();
	const [tasks, setTasks] = useState<MissionTask[]>(initialTasks);
	// Keep a ref to avoid stale-closure reads inside toggleDone.
	const tasksRef = useRef(tasks);
	useEffect(() => {
		tasksRef.current = tasks;
	}, [tasks]);

	// Re-sync when the parent reloads (e.g., refresh after returning online).
	useEffect(() => {
		setTasks(initialTasks);
	}, [initialTasks]);

	const toggleDone = useCallback(
		async (taskId: string) => {
			if (!session || !missionId) return;

			const current = tasksRef.current.find((t) => t.id === taskId);
			if (!current) return;

			const newDone = !current.done;
			const completedAt = newDone ? new Date().toISOString() : null;

			// MSN-04: optimistic update — feels instant even on slow connections.
			setTasks((prev) =>
				prev.map((t) => (t.id === taskId ? { ...t, done: newDone } : t)),
			);

			try {
				await withRetry(async () => {
					const { error } = await supabase
						.from("user_mission_tasks")
						.update({ done: newDone, completed_at: completedAt })
						.eq("id", taskId);
					if (error) throw new Error(error.message);
				});

				// MSN-05: PostHog — best-effort, never raises.
				posthog?.capture(newDone ? "task_completed" : "task_uncompleted", {
					task_id: taskId,
					mission_id: missionId,
					kind: current.kind ?? null,
				});
			} catch {
				// All retries failed — revert optimistic update.
				setTasks((prev) =>
					prev.map((t) => (t.id === taskId ? { ...t, done: !newDone } : t)),
				);
			}
		},
		[session, missionId, posthog],
	);

	const completedCount = tasks.filter((t) => t.done).length;
	const progress = tasks.length > 0 ? completedCount / tasks.length : 0;

	return { tasks, toggleDone, completedCount, progress };
}
