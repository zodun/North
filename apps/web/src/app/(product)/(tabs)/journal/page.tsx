import type { Metadata } from "next";
import { getServerSupabase } from "@/lib/supabase-server";
import { JournalCard } from "../signal/journal-card";
import { loadSignalData } from "../signal/load-signal-data";

export const metadata: Metadata = { title: "Journal" };

// The Signal-and-Noise journal, promoted to its own tab. Same component and
// data the Mission tab uses — just reached directly here.
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

	const today = new Date().toISOString().slice(0, 10);
	const signal = await loadSignalData(supabase, user.id);

	return (
		<div
			className="min-h-full px-[18px] pt-16 pb-24 font-jakarta"
			style={{ background: "#EDF1F8" }}
		>
			<header className="mb-4">
				<p className="font-bold text-[#0E1420]/50 text-[10px] uppercase tracking-[0.12em]">
					Signal &amp; Noise
				</p>
				<h1 className="font-black text-[#0E1420] text-[22px] tracking-tight">
					Journal
				</h1>
				<p className="text-[#0E1420]/55 text-[12px]">
					Talk through your day. We'll surface what mattered and what didn't.
				</p>
			</header>
			<JournalCard entryDate={today} initialEntry={signal.lastJournal} />
		</div>
	);
}
