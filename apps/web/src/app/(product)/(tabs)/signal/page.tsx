import type { Metadata } from "next";
import { getServerSupabase } from "@/lib/supabase-server";
import { SignalView } from "./signal-view";

export const metadata: Metadata = { title: "Signal" };

export default async function SignalPage() {
	const supabase = await getServerSupabase();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return (
			<div className="flex h-full items-center justify-center p-8 text-center">
				<p className="text-sm text-white/40">Sign in to see your signal.</p>
			</div>
		);
	}

	const { data: scores } = await supabase
		.from("signal_scores")
		.select("week_ending, band, raw_score, inputs")
		.eq("user_id", user.id)
		.order("week_ending", { ascending: false })
		.limit(8);

	const { data: summary } = await supabase
		.from("signal_summaries")
		.select("summary_text, callouts, week_ending")
		.eq("user_id", user.id)
		.order("week_ending", { ascending: false })
		.limit(1)
		.single();

	const weekEnding = scores?.[0]?.week_ending ?? null;

	const [ratingsRes, reflectionRes] = weekEnding
		? await Promise.all([
				supabase
					.from("callout_ratings")
					.select("callout_idx, rating")
					.eq("user_id", user.id)
					.eq("week_ending", weekEnding),
				supabase
					.from("user_reflections")
					.select("body, analysis")
					.eq("user_id", user.id)
					.eq("week_ending", weekEnding)
					.order("created_at", { ascending: false })
					.limit(1)
					.maybeSingle(),
			])
		: [{ data: [] }, { data: null }];

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

	const reflection = reflectionRes.data as {
		body: string;
		analysis: { themes: string[]; nudge: string } | null;
	} | null;

	return (
		<SignalView
			scores={scores ?? []}
			summary={summary ?? null}
			weekEnding={weekEnding}
			ratings={ratings}
			inputs={inputs}
			lastReflection={reflection}
		/>
	);
}
