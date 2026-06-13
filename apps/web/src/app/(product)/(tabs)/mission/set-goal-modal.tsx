"use client";

import { useEffect, useState } from "react";
import { colors, Pill } from "@/components/product/north-ui";
import { supabase } from "@/lib/auth-client";

type Step = {
	id: string;
	cadence: "daily" | "weekly";
	week_index: number;
	due_date: string | null;
	title: string;
	detail: string | null;
	estimate_label: string | null;
	done: boolean;
};
type Mission = {
	id: string;
	goal_title: string;
	goal_intent: string | null;
	focus_area_id: string | null;
	month_start: string;
	generated_by: string;
};

export type GoalSetResult = {
	mission: Mission;
	cadence: "daily" | "weekly";
	steps: Step[];
};

const GOLD = colors.gold;

export function SetGoalModal({
	monthName,
	monthStart,
	initialGoal,
	initialIntent,
	initialCadence,
	autosuggest = false,
	onDismiss,
	onGoalSet,
}: {
	monthName: string;
	monthStart: string;
	initialGoal: string;
	initialIntent: string;
	initialCadence: "daily" | "weekly";
	autosuggest?: boolean;
	onDismiss: () => void;
	onGoalSet: (result: GoalSetResult) => void;
}) {
	const [goal, setGoal] = useState(autosuggest ? "" : initialGoal);
	const [intent, setIntent] = useState(initialIntent);
	const [cadence, setCadence] = useState<"daily" | "weekly">(initialCadence);
	const [submitting, setSubmitting] = useState(false);
	const [suggesting, setSuggesting] = useState(autosuggest);
	const [error, setError] = useState<string | null>(null);

	// When the user hasn't authored a goal yet, propose one from their focus
	// areas + onboarding answers. We never clobber anything they start typing.
	useEffect(() => {
		if (!autosuggest) return;
		let cancelled = false;
		(async () => {
			const { data } = await supabase.functions.invoke("plan-month", {
				body: { mode: "suggest", month_start: monthStart },
			});
			if (cancelled) return;
			const s = data?.suggestion as
				| { goal_title?: string; goal_intent?: string }
				| undefined;
			if (s?.goal_title) {
				setGoal((g) => (g.trim() ? g : (s.goal_title ?? "")));
				setIntent((i) => (i.trim() ? i : (s.goal_intent ?? "")));
			} else {
				setGoal((g) => (g.trim() ? g : initialGoal));
			}
			setSuggesting(false);
		})();
		return () => {
			cancelled = true;
		};
	}, [autosuggest, monthStart, initialGoal]);

	// Persist that the prompt was dismissed this month, then close. profiles is
	// owner-updatable (same path as the cadence toggle), so this is a plain write.
	async function dismiss() {
		if (submitting) return;
		onDismiss();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (user) {
			await supabase
				.from("profiles")
				.update({ goal_prompt_dismissed_month: monthStart })
				.eq("user_id", user.id);
		}
	}

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		const title = goal.trim();
		if (!title || submitting) return;
		setError(null);
		setSubmitting(true);
		const { data, error: err } = await supabase.functions.invoke("plan-month", {
			body: {
				goal_title: title,
				goal_intent: intent.trim() || null,
				cadence,
				month_start: monthStart,
			},
		});
		setSubmitting(false);
		if (err || !data?.ok) {
			setError(
				(data?.error as string) ||
					err?.message ||
					"Could not plan your month. Try again.",
			);
			return;
		}
		onGoalSet(data as GoalSetResult);
	}

	const inputCls =
		"w-full rounded-xl border border-[#0E1420]/10 bg-[#F4F7FC] px-4 py-3 text-[14px] text-[#0E1420] placeholder:text-[#0E1420]/40 focus:outline-none focus:ring-1 focus:ring-[#F5C842]/50";
	const labelCls =
		"mb-1.5 block font-semibold text-[11px] text-[#0E1420]/55 uppercase tracking-widest";

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: backdrop dismiss — keyboard users can use the close button
		<div
			className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
			onClick={dismiss}
		>
			{/* biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: inner sheet stops backdrop click from propagating */}
			<div
				className="max-h-[90svh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-[#0E1420]/10 bg-white pb-safe font-jakarta"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="sticky top-0 flex justify-center bg-white pt-3 pb-1">
					<div className="h-1 w-9 rounded-full bg-[#0E1420]/15" />
				</div>
				<div className="sticky top-5 flex items-center justify-between border-[#0E1420]/10 border-b bg-white px-5 py-3">
					<div>
						<p
							className="font-bold text-[9px] uppercase tracking-[0.15em]"
							style={{ color: colors.goldInk }}
						>
							{monthName}
						</p>
						<h2 className="font-bold text-[#0E1420] text-[16px]">
							Set your goal for the month
						</h2>
					</div>
					<button
						type="button"
						onClick={dismiss}
						className="text-[#0E1420]/55 hover:text-[#0E1420]"
						aria-label="Close"
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth={2}
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<path d="M18 6L6 18M6 6l12 12" />
						</svg>
					</button>
				</div>

				<form onSubmit={submit} className="flex flex-col gap-4 p-5">
					<p className="text-[#0E1420]/65 text-[13px] leading-relaxed">
						Name one thing you want to make happen this month. We'll break it
						into a weekly and daily plan you can actually follow.
					</p>

					<div>
						<div className="mb-1.5 flex items-center justify-between">
							<label htmlFor="goal-title" className={labelCls}>
								Your goal
							</label>
							{suggesting ? (
								<span className="flex items-center gap-1.5 font-semibold text-[#0E1420]/55 text-[10px]">
									<span
										className="inline-block h-2.5 w-2.5 animate-spin rounded-full border border-[#0E1420]/15 border-t-[#0E1420]/55 motion-reduce:animate-none"
										aria-hidden="true"
									/>
									Finding a goal that fits you…
								</span>
							) : (
								autosuggest && (
									<span
										className="font-semibold text-[10px]"
										style={{ color: colors.goldInk }}
									>
										Suggested · edit freely
									</span>
								)
							)}
						</div>
						<textarea
							id="goal-title"
							required
							rows={2}
							maxLength={140}
							placeholder={
								suggesting
									? "Suggesting a goal from your profile…"
									: "e.g. Ship the first version of my side project"
							}
							value={goal}
							onChange={(e) => setGoal(e.target.value)}
							className={`${inputCls} resize-none`}
						/>
					</div>

					<div>
						<label htmlFor="goal-intent" className={labelCls}>
							Why it matters (optional)
						</label>
						<textarea
							id="goal-intent"
							rows={2}
							maxLength={400}
							placeholder="What makes this worth it right now?"
							value={intent}
							onChange={(e) => setIntent(e.target.value)}
							className={`${inputCls} resize-none`}
						/>
					</div>

					<div>
						<span className={labelCls}>How should tasks show up?</span>
						<div className="flex gap-2">
							{(["daily", "weekly"] as const).map((c) => (
								<Pill
									key={c}
									active={cadence === c}
									onClick={() => setCadence(c)}
								>
									{c}
								</Pill>
							))}
						</div>
						<p className="mt-1.5 text-[#0E1420]/55 text-[11px]">
							{cadence === "daily"
								? "One small step each day."
								: "One focus to reach each week."}
						</p>
					</div>

					{error && <p className="text-[#DC2626] text-[12px]">{error}</p>}

					<button
						type="submit"
						disabled={submitting || !goal.trim()}
						className="h-13 w-full cursor-pointer rounded-xl py-3.5 font-bold text-[#05050E] text-[15px] transition-opacity disabled:opacity-40"
						style={{ backgroundColor: GOLD }}
					>
						{submitting ? "Planning your month…" : "Set my goal"}
					</button>
					<button
						type="button"
						onClick={dismiss}
						disabled={submitting}
						className="cursor-pointer py-1 font-semibold text-[#0E1420]/55 text-[13px] transition-colors hover:text-[#0E1420]/80 disabled:opacity-40"
					>
						Maybe later
					</button>
				</form>
			</div>
		</div>
	);
}
