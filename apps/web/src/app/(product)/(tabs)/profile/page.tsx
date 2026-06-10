import type { Metadata } from "next";
import { getServerSupabase } from "@/lib/supabase-server";
import { ProfileView } from "./profile-view";

export const metadata: Metadata = { title: "Profile" };

const FOCUS_AREAS: Record<string, { label: string; hue: string }> = {
	craft: { label: "Craft & Mastery", hue: "#7ec4bb" },
	venture: { label: "Building a venture", hue: "#d4a574" },
	mind: { label: "Mind & body", hue: "#9aaee0" },
	people: { label: "People & community", hue: "#c97a5a" },
	money: { label: "Money & freedom", hue: "#a8b97a" },
	learn: { label: "Deeper learning", hue: "#b39ad8" },
};

function weekStartISO(dateStr: string): string {
	const d = new Date(`${dateStr}T12:00:00Z`);
	const day = d.getUTCDay();
	const offset = day === 0 ? 6 : day - 1;
	d.setUTCDate(d.getUTCDate() - offset);
	return d.toISOString().slice(0, 10);
}

export default async function ProfilePage() {
	const supabase = await getServerSupabase();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
				<div className="text-4xl">🧭</div>
				<h2 className="font-semibold text-white text-xl">
					You're not signed in
				</h2>
				<a
					href="/sign-in"
					className="rounded-xl bg-white px-6 py-3 font-semibold text-black text-sm"
				>
					Sign in
				</a>
			</div>
		);
	}

	const today = new Date().toISOString().slice(0, 10);
	const weekStart = weekStartISO(today);
	const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

	const dates28 = Array.from({ length: 28 }, (_, i) => {
		const d = new Date(`${today}T12:00:00Z`);
		d.setUTCDate(d.getUTCDate() - (27 - i));
		return d.toISOString().slice(0, 10);
	});

	const [
		{ data: profile },
		{ data: focusRows },
		{ data: streakRows },
		{ data: signalRows },
		{ data: missionRows },
		{ data: savedRows },
	] = await Promise.all([
		supabase
			.from("profiles")
			.select(
				"display_name, statement_of_intent, season_label, time_budget_label",
			)
			.eq("user_id", user.id)
			.single(),
		supabase
			.from("user_focus_areas")
			.select("focus_area_id")
			.eq("user_id", user.id),
		supabase
			.from("streaks")
			.select("day, state")
			.eq("user_id", user.id)
			.gte("day", dates28[0])
			.lte("day", today),
		supabase
			.from("signal_scores")
			.select("band, raw_score, week_ending")
			.eq("user_id", user.id)
			.order("week_ending", { ascending: false })
			.limit(2),
		supabase
			.from("user_missions")
			.select("id, user_mission_tasks(done)")
			.eq("user_id", user.id)
			.gte("mission_date", weekStart)
			.lte("mission_date", today),
		supabase
			.from("user_saved_opportunities")
			.select("opportunity_id, opportunities(id, title, org)")
			.eq("user_id", user.id)
			.limit(5),
	]);

	const focusAreas = (focusRows ?? [])
		.map((r) => ({ id: r.focus_area_id, ...FOCUS_AREAS[r.focus_area_id] }))
		.filter((f): f is { id: string; label: string; hue: string } =>
			Boolean(f.label),
		);

	const streakMap = new Map(
		(streakRows ?? []).map((r) => [r.day, r.state as number]),
	);
	const streaks28 = dates28.map((d) => streakMap.get(d) ?? 0);
	const dayLabels28 = dates28.map(
		(d) => DAY_LETTERS[new Date(`${d}T12:00:00Z`).getUTCDay()] ?? "?",
	);

	let rhythmStreak = 0;
	for (let i = streaks28.length - 1; i >= 0; i--) {
		if (streaks28[i] === 2 || streaks28[i] === 3) rhythmStreak++;
		else break;
	}

	let tasksTotal = 0;
	let tasksDone = 0;
	for (const m of missionRows ?? []) {
		for (const t of (m as { user_mission_tasks: { done: boolean }[] })
			.user_mission_tasks ?? []) {
			tasksTotal++;
			if (t.done) tasksDone++;
		}
	}

	const scores = signalRows ?? [];
	const signalBand = (scores[0] as { band: string } | undefined)?.band ?? null;
	let signalTrend: "climbing" | "holding" | "easing" | null = null;
	if (scores.length >= 2) {
		const delta =
			(scores[0] as { raw_score: number }).raw_score -
			(scores[1] as { raw_score: number }).raw_score;
		signalTrend = delta > 2 ? "climbing" : delta < -2 ? "easing" : "holding";
	} else if (scores.length === 1) {
		signalTrend = "holding";
	}

	type SavedRow = {
		opportunity_id: string;
		opportunities:
			| { id: string; title: string; org: string }
			| { id: string; title: string; org: string }[]
			| null;
	};
	const savedOpps = ((savedRows as unknown as SavedRow[]) ?? [])
		.map((r) =>
			Array.isArray(r.opportunities) ? r.opportunities[0] : r.opportunities,
		)
		.filter((o): o is { id: string; title: string; org: string } =>
			Boolean(o?.id),
		);

	return (
		<ProfileView
			displayName={profile?.display_name ?? user.email?.split("@")[0] ?? "You"}
			statementOfIntent={profile?.statement_of_intent ?? null}
			seasonLabel={profile?.season_label ?? null}
			timeBudgetLabel={profile?.time_budget_label ?? null}
			focusAreas={focusAreas}
			streaks28={streaks28}
			dayLabels28={dayLabels28}
			rhythmStreak={rhythmStreak}
			tasksCompleted={tasksDone}
			tasksTotal={tasksTotal}
			signalBand={signalBand}
			signalTrend={signalTrend}
			savedCount={savedRows?.length ?? 0}
			savedOpportunities={savedOpps}
		/>
	);
}
