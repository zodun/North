import type { getServerSupabase } from "@/lib/supabase-server";

type ServerSupabase = Awaited<ReturnType<typeof getServerSupabase>>;

// Loads everything the SignalView needs for a user. Shared by the standalone
// /signal route and the combined Task tab (/mission), so the two never drift.
export async function loadSignalData(supabase: ServerSupabase, userId: string) {
	const { data: scores } = await supabase
		.from("signal_scores")
		.select("week_ending, band, raw_score, inputs")
		.eq("user_id", userId)
		.order("week_ending", { ascending: false })
		.limit(8);

	const { data: summary } = await supabase
		.from("signal_summaries")
		.select("summary_text, callouts, week_ending")
		.eq("user_id", userId)
		.order("week_ending", { ascending: false })
		.limit(1)
		.single();

	const weekEnding = scores?.[0]?.week_ending ?? null;

	// Callout ratings are tied to the weekly summary; the journal is its own
	// daily thing, so it's fetched independently (latest entry, any day).
	const [ratingsRes, journalRes] = await Promise.all([
		weekEnding
			? supabase
					.from("callout_ratings")
					.select("callout_idx, rating")
					.eq("user_id", userId)
					.eq("week_ending", weekEnding)
			: Promise.resolve({ data: [] }),
		supabase
			.from("user_reflections")
			.select("body, analysis, entry_date")
			.eq("user_id", userId)
			.order("entry_date", { ascending: false })
			.order("created_at", { ascending: false })
			.limit(1)
			.maybeSingle(),
	]);

	const ratings: Record<number, "up" | "down"> = {};
	for (const r of (ratingsRes.data ?? []) as {
		callout_idx: number;
		rating: "up" | "down";
	}[]) {
		ratings[r.callout_idx] = r.rating;
	}

	const currentInputs =
		(scores?.[0]?.inputs as {
			active_days?: number;
			assigned_aligned_tasks?: number;
			completed_aligned_tasks?: number;
			meaningful_total?: number;
			meaningful_in_focus?: number;
		} | null) ?? null;

	const inputs = currentInputs
		? {
				activeDays: currentInputs.active_days ?? 0,
				assignedTasks: currentInputs.assigned_aligned_tasks ?? 0,
				completedTasks: currentInputs.completed_aligned_tasks ?? 0,
				meaningfulTotal: currentInputs.meaningful_total ?? 0,
				meaningfulInFocus: currentInputs.meaningful_in_focus ?? 0,
			}
		: null;

	const lastJournal = journalRes.data as {
		body: string;
		analysis: { signal: string[]; noise: string[]; read: string } | null;
	} | null;

	return {
		scores: scores ?? [],
		summary: summary ?? null,
		weekEnding,
		ratings,
		inputs,
		lastJournal,
	};
}
