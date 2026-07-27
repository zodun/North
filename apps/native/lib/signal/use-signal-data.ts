import { useCallback, useEffect, useState } from "react";

import { supabase, useSession } from "../auth-client";
import { todayInAST } from "../mission/use-today-mission";

export type SignalBand = "Drifting" | "Finding" | "Aligned";

export type ReflectionAnalysis = {
	signal: string[];
	noise: string[];
	read: string;
};

export type Callout = { label: string; body: string };

export type SignalData = {
	weekEnding: string;
	band: SignalBand;
	provisional: boolean;
	trend: "climbing" | "holding" | "easing";
	inputs: {
		activeDays: number;
		assignedTasks: number;
		completedTasks: number;
		meaningfulTotal: number;
		meaningfulInFocus: number;
	};
	summary: string | null;
	callouts: Callout[];
	ratings: Record<number, "up" | "down">;
	recentBands: SignalBand[];
	lastReflection: {
		id: string;
		body: string;
		analysis: ReflectionAnalysis | null;
	} | null;
};

type ScoreRow = {
	week_ending: string;
	band: SignalBand;
	raw_score: number;
	provisional: boolean;
	inputs: {
		a: number | null;
		c: number | null;
		k: number;
		v: number;
		assigned_aligned_tasks: number;
		completed_aligned_tasks: number;
		active_days: number;
		meaningful_total: number;
		meaningful_in_focus: number;
	};
};

type SummaryRow = {
	summary_text: string;
	callouts: Callout[];
};

type RatingRow = {
	callout_idx: number;
	rating: "up" | "down";
};

type ReflectionRow = {
	id: string;
	body: string;
	entry_date: string;
	analysis:
		| (ReflectionAnalysis & { model?: string; prompt_version?: string })
		| null;
};

function deriveTrend(
	current: number,
	prev: number | undefined,
): "climbing" | "holding" | "easing" {
	if (prev === undefined) return "holding";
	const delta = current - prev;
	if (delta > 2) return "climbing";
	if (delta < -2) return "easing";
	return "holding";
}

export function useSignalData() {
	const { data: session } = useSession();
	const [data, setData] = useState<SignalData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		if (!session) return;
		setError(null);
		const userId = session.user.id;
		const today = todayInAST();

		// Load the 8 most recent scores, current summary, and callout ratings + reflection in parallel.
		const [scoresRes, summaryRes] = await Promise.all([
			supabase
				.from("signal_scores")
				.select("week_ending, band, raw_score, provisional, inputs")
				.eq("user_id", userId)
				.lte("week_ending", today)
				.order("week_ending", { ascending: false })
				.limit(8),

			supabase
				.from("signal_summaries")
				.select("summary_text, callouts")
				.eq("user_id", userId)
				.order("week_ending", { ascending: false })
				.limit(1)
				.maybeSingle(),
		]);

		if (scoresRes.error) {
			setError(scoresRes.error.message);
			return;
		}

		const scoreRows = (scoresRes.data ?? []) as ScoreRow[];
		if (scoreRows.length === 0) {
			setData(null);
			setLoading(false);
			return;
		}

		const current = scoreRows[0];
		const prev = scoreRows[1];

		// Load ratings + reflection keyed to the current week_ending.
		const [ratingsRes, reflectionRes] = await Promise.all([
			supabase
				.from("callout_ratings")
				.select("callout_idx, rating")
				.eq("user_id", userId)
				.eq("week_ending", current.week_ending),

			// The journal is a daily thing, decoupled from the weekly signal
			// score; fetch the latest entry regardless of date (matches web's
			// loadSignalData behavior).
			supabase
				.from("user_reflections")
				.select("id, body, entry_date, analysis")
				.eq("user_id", userId)
				.order("entry_date", { ascending: false })
				.order("created_at", { ascending: false })
				.limit(1)
				.maybeSingle(),
		]);

		const ratings: Record<number, "up" | "down"> = {};
		for (const r of (ratingsRes.data ?? []) as RatingRow[]) {
			ratings[r.callout_idx] = r.rating;
		}

		const summaryRow = summaryRes.data as SummaryRow | null;
		const reflectionRow = reflectionRes.data as ReflectionRow | null;

		setData({
			weekEnding: current.week_ending,
			band: current.band,
			provisional: current.provisional,
			trend: deriveTrend(current.raw_score, prev?.raw_score),
			inputs: {
				activeDays: current.inputs.active_days,
				assignedTasks: current.inputs.assigned_aligned_tasks,
				completedTasks: current.inputs.completed_aligned_tasks,
				meaningfulTotal: current.inputs.meaningful_total,
				meaningfulInFocus: current.inputs.meaningful_in_focus,
			},
			summary: summaryRow?.summary_text ?? null,
			callouts: summaryRow?.callouts ?? [],
			ratings,
			recentBands: scoreRows.map((r) => r.band).reverse(),
			lastReflection: reflectionRow
				? {
						id: reflectionRow.id,
						body: reflectionRow.body,
						analysis: reflectionRow.analysis
							? {
									signal: reflectionRow.analysis.signal,
									noise: reflectionRow.analysis.noise,
									read: reflectionRow.analysis.read,
								}
							: null,
					}
				: null,
		});
		setLoading(false);
	}, [session]);

	useEffect(() => {
		setLoading(true);
		void refresh();
	}, [refresh]);

	return { data, loading, error, refresh };
}
