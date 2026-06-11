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
		{ data: monthlyMission },
		{ data: savedRows },
	] = await Promise.all([
		supabase
			.from("profiles")
			.select(
				"display_name, statement_of_intent, season_label, time_budget_label, mission_cadence",
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
			.from("monthly_missions")
			.select("id, month_start, goal_title, focus_area_id")
			.eq("user_id", user.id)
			.order("month_start", { ascending: false })
			.limit(1)
			.maybeSingle(),
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

	// "This week" reflects the active monthly goal, in the user's chosen cadence.
	const cadence = profile?.mission_cadence === "weekly" ? "weekly" : "daily";
	const currentWeekIndex = monthlyMission
		? Math.min(
				3,
				Math.max(
					0,
					Math.floor(
						(Date.parse(today) - Date.parse(monthlyMission.month_start)) /
							(7 * 86_400_000),
					),
				),
			)
		: 0;

	const { data: stepRows } = monthlyMission
		? await supabase
				.from("monthly_mission_steps")
				.select("week_index, done")
				.eq("monthly_mission_id", monthlyMission.id)
				.eq("cadence", cadence)
		: { data: [] };

	const cadenceSteps = stepRows ?? [];
	const weekSteps = cadenceSteps.filter(
		(s) => s.week_index === currentWeekIndex,
	);
	const tasksTotal = weekSteps.length;
	const tasksDone = weekSteps.filter((s) => s.done).length;

	// Whole-month progress for the goal card.
	const goalTotal = cadenceSteps.length;
	const goalDone = cadenceSteps.filter((s) => s.done).length;
	const goalHue =
		FOCUS_AREAS[monthlyMission?.focus_area_id ?? ""]?.hue ?? "#7ec4bb";
	const goalMonth = monthlyMission
		? new Date(`${monthlyMission.month_start}T12:00:00Z`).toLocaleDateString(
				"en-US",
				{ month: "long" },
			)
		: null;

	const scores = signalRows ?? [];
	const signalBand = (scores[0] as { band: string } | undefined)?.band ?? null;
	const signalScore =
		(scores[0] as { raw_score: number } | undefined)?.raw_score ?? null;
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
			goalTitle={monthlyMission?.goal_title ?? null}
			goalMonth={goalMonth}
			goalDone={goalDone}
			goalTotal={goalTotal}
			goalUnit={cadence === "daily" ? "days" : "weeks"}
			goalHue={goalHue}
			focusAreas={focusAreas}
			streaks28={streaks28}
			dayLabels28={dayLabels28}
			rhythmStreak={rhythmStreak}
			tasksCompleted={tasksDone}
			tasksTotal={tasksTotal}
			signalScore={signalScore}
			signalBand={signalBand}
			signalTrend={signalTrend}
			savedCount={savedRows?.length ?? 0}
			savedOpportunities={savedOpps}
		/>
	);
}
