import type { Metadata } from "next";
import { getServerSupabase } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Profile" };

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

	const [{ data: profile }, { data: signal }, { data: savedOpps }] =
		await Promise.all([
			supabase
				.from("profiles")
				.select(
					"display_name, statement_of_intent, season_label, time_budget_label",
				)
				.eq("id", user.id)
				.single(),
			supabase
				.from("signal_scores")
				.select("band, raw_score, week_ending")
				.eq("user_id", user.id)
				.order("week_ending", { ascending: false })
				.limit(1)
				.single(),
			supabase
				.from("user_saved_opportunities")
				.select("id")
				.eq("user_id", user.id),
		]);

	const signalData = signal && !("error" in signal) ? signal : null;

	return (
		<div className="px-5 pt-14 pb-8">
			<h1 className="mb-6 font-semibold text-2xl text-white tracking-tight">
				You
			</h1>

			{/* Identity card */}
			<div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-5">
				<div className="mb-1 font-semibold text-lg text-white">
					{profile?.display_name ?? user.email?.split("@")[0]}
				</div>
				{profile?.statement_of_intent && (
					<p className="text-[13px] text-white/55">
						{profile.statement_of_intent}
					</p>
				)}
				<div className="mt-3 flex flex-wrap gap-2">
					{profile?.season_label && (
						<span className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] text-white/60">
							{profile.season_label}
						</span>
					)}
					{profile?.time_budget_label && (
						<span className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] text-white/60">
							{profile.time_budget_label}
						</span>
					)}
				</div>
			</div>

			{/* Stats row */}
			<div className="mb-4 grid grid-cols-2 gap-3">
				{signalData && (
					<div className="rounded-xl border border-white/8 bg-white/4 p-4">
						<div className="text-[11px] text-white/40 uppercase tracking-widest">
							Signal
						</div>
						<div className="mt-1 font-bold text-2xl text-white">
							{signalData.raw_score}
						</div>
						<div className="text-[11px] text-white/50">{signalData.band}</div>
					</div>
				)}
				<div className="rounded-xl border border-white/8 bg-white/4 p-4">
					<div className="text-[11px] text-white/40 uppercase tracking-widest">
						Saved
					</div>
					<div className="mt-1 font-bold text-2xl text-white">
						{savedOpps?.length ?? 0}
					</div>
					<div className="text-[11px] text-white/50">opportunities</div>
				</div>
			</div>

			{/* Sign out */}
			<form action="/auth/signout" method="POST">
				<button
					type="submit"
					className="w-full rounded-xl border border-white/10 py-3 font-medium text-sm text-white/50"
				>
					Sign out
				</button>
			</form>
		</div>
	);
}
