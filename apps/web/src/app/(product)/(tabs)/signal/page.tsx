import type { Metadata } from "next";
import { getServerSupabase } from "@/lib/supabase-server";
import { loadSignalData } from "./load-signal-data";
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
				<p className="text-[#0E1420]/55 text-sm">Sign in to see your signal.</p>
			</div>
		);
	}

	const signal = await loadSignalData(supabase, user.id);

	return <SignalView {...signal} />;
}
