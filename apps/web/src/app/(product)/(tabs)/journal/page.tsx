import type { Metadata } from "next";
import { getServerSupabase } from "@/lib/supabase-server";
import { type JournalEntry, JournalView } from "./journal-view";

export const metadata: Metadata = { title: "Journal" };

const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

// Format a "YYYY-MM-DD" date string without going through the Date timezone
// machinery (entry_date is a calendar day, not an instant).
function formatDay(iso: string): string {
	const [y, m, d] = iso.split("-").map(Number);
	if (!y || !m || !d) return iso;
	return `${MONTHS[m - 1]} ${d}, ${y}`;
}

type ReflectionRow = {
	id: string;
	body: string;
	entry_date: string;
	analysis: { signal?: string[]; noise?: string[]; read?: string } | null;
};

// Server component: fetches the viewer's real reflections and hands them to the
// "Signal & Noise" journal view, which is wired to write new entries through
// the reflect Edge Function (user_reflections + AI analysis).
export default async function JournalPage() {
	const supabase = await getServerSupabase();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return (
			<div className="flex h-full items-center justify-center p-8 text-center">
				<p className="text-[#0E1420]/55 text-sm">Sign in to journal.</p>
			</div>
		);
	}

	const [{ data: me }, { data: reflectionRows }, { data: scoreRow }] =
		await Promise.all([
			supabase
				.from("public_profiles")
				.select("display_name")
				.eq("user_id", user.id)
				.maybeSingle(),
			supabase
				.from("user_reflections")
				.select("id, body, entry_date, analysis")
				.eq("user_id", user.id)
				.order("entry_date", { ascending: false })
				.order("created_at", { ascending: false })
				.limit(40),
			supabase
				.from("signal_scores")
				.select("band")
				.eq("user_id", user.id)
				.order("week_ending", { ascending: false })
				.limit(1)
				.maybeSingle<{ band: string }>(),
		]);

	const rows = (reflectionRows ?? []) as ReflectionRow[];
	const initialEntries: JournalEntry[] = rows.map((r) => ({
		id: r.id,
		dateLabel: formatDay(r.entry_date),
		body: r.body,
		read: r.analysis?.read ?? "",
		signal: r.analysis?.signal ?? [],
		noise: r.analysis?.noise ?? [],
	}));

	// Greet by first name + time of day (Jamaica, UTC-5), matching Community.
	const firstName = (me?.display_name ?? "there").split(/\s+/)[0];
	const hour = (new Date().getUTCHours() + 19) % 24; // UTC-5
	const greeting =
		hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
	const partOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

	const today = new Date().toISOString().slice(0, 10);

	// How many distinct days the person reflected over the last 7 (rhythm, not a
	// streak to chase), entry_date is a "YYYY-MM-DD" string, so lexical compare
	// against the cutoff is correct.
	const cutoff = new Date(Date.now() - 6 * 86_400_000)
		.toISOString()
		.slice(0, 10);
	const daysThisWeek = new Set(
		rows.filter((r) => r.entry_date >= cutoff).map((r) => r.entry_date),
	).size;

	return (
		<JournalView
			firstName={firstName}
			greeting={greeting}
			partOfDay={partOfDay}
			todayLabel={formatDay(today)}
			entryDate={today}
			band={scoreRow?.band ?? null}
			entryCount={initialEntries.length}
			daysThisWeek={daysThisWeek}
			initialEntries={initialEntries}
		/>
	);
}
