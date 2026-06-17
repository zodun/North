"use client";

import { useEffect, useState } from "react";
import { colors } from "@/components/product/north-ui";
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
	const [goal, setGoal] = useState("");
	const [measure, setMeasure] = useState("");
	const [cadence, setCadence] = useState<"daily" | "weekly">(initialCadence);
	const [submitting, setSubmitting] = useState(false);
	const [suggesting, setSuggesting] = useState(autosuggest);
	const [suggestion, setSuggestion] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Propose a goal from the user's focus areas + onboarding answers, but never
	// touch the input. The suggestion is offered as a tap-to-use hint below the
	// field so the field always stays the user's own to type in.
	useEffect(() => {
		if (!autosuggest) return;
		let cancelled = false;
		(async () => {
			const { data } = await supabase.functions.invoke("plan-month", {
				body: { mode: "suggest", month_start: monthStart },
			});
			if (cancelled) return;
			const s = data?.suggestion as { goal_title?: string } | undefined;
			if (s?.goal_title) setSuggestion(s.goal_title);
			setSuggesting(false);
		})();
		return () => {
			cancelled = true;
		};
	}, [autosuggest, monthStart]);

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
		if (!title || !measure.trim() || submitting) return;
		setError(null);
		setSubmitting(true);
		const { data, error: err } = await supabase.functions.invoke("plan-month", {
			body: {
				goal_title: title,
				goal_intent: `I'll ${measure.trim()}`,
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
		"w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-[15px] text-[#131313] placeholder:text-black/35 transition-colors focus:border-[#005ac2]/40 focus:outline-none focus:ring-2 focus:ring-[#005ac2]/20";
	const labelCls =
		"mb-1.5 block font-semibold text-[11px] text-[#0E1420]/55 uppercase tracking-widest";

	// Tap-to-use pre-fill, never auto-inserted into the box: the AI idea when
	// setting a new goal, or the current goal when editing an existing one.
	const preset = autosuggest ? suggestion : initialGoal.trim() || null;
	const presetLabel = autosuggest
		? "Need an idea? Tap to use"
		: "Your current goal. Tap to edit it";

	// Live SMART checks. Specific + Measurable are required to submit; the month
	// gives Time bound; Achievable + Relevant are gentle guidance.
	const words = goal.trim().split(/\s+/).filter(Boolean).length;
	const specificOk = words >= 3;
	const measurableOk = measure.trim().length >= 2;
	const canSubmit = specificOk && measurableOk;
	const smart = [
		{
			k: "S",
			label: "Specific",
			ok: specificOk,
			hint: "Say exactly what you'll do",
		},
		{
			k: "M",
			label: "Measurable",
			ok: measurableOk,
			hint: "A number or clear milestone",
		},
		{
			k: "A",
			label: "Achievable",
			ok: canSubmit,
			hint: "Realistic for one month",
		},
		{ k: "R", label: "Relevant", ok: words > 0, hint: "It matters to you" },
		{
			k: "T",
			label: "Time bound",
			ok: true,
			hint: `By the end of ${monthName}`,
		},
	];

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: backdrop dismiss, keyboard users can use the close button
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
						Name one clear, measurable thing you want to make happen this month.
						The sharper your goal, the better North can break it into steps.
					</p>

					<div>
						<div className="mb-1.5 flex items-center justify-between">
							<label htmlFor="goal-title" className={labelCls}>
								Your goal
							</label>
							{suggesting && (
								<span className="flex items-center gap-1.5 font-semibold text-[#0E1420]/55 text-[10px]">
									<span
										className="inline-block h-2.5 w-2.5 animate-spin rounded-full border border-[#0E1420]/15 border-t-[#0E1420]/55 motion-reduce:animate-none"
										aria-hidden="true"
									/>
									Finding an idea for you…
								</span>
							)}
						</div>
						<textarea
							id="goal-title"
							required
							rows={2}
							maxLength={140}
							placeholder="e.g. Ship the first version of my side project"
							value={goal}
							onChange={(e) => setGoal(e.target.value)}
							className={`${inputCls} resize-none`}
						/>
						{preset && goal.trim() !== preset && (
							<button
								type="button"
								onClick={() => setGoal(preset)}
								className="mt-2 flex w-full flex-col gap-0.5 rounded-2xl border border-black/10 bg-white px-4 py-3 text-left transition-colors hover:border-[#005ac2]/30"
							>
								<span
									className="font-bold text-[10px] uppercase tracking-widest"
									style={{ color: "#005ac2" }}
								>
									{presetLabel}
								</span>
								<span className="text-[#131313] text-[13px] leading-snug">
									{preset}
								</span>
							</button>
						)}
					</div>

					<div>
						<label htmlFor="goal-measure" className={labelCls}>
							How you'll know you've done it
						</label>
						<div className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3.5 transition-colors focus-within:border-[#005ac2]/40 focus-within:ring-2 focus-within:ring-[#005ac2]/20">
							<span className="shrink-0 font-semibold text-[#131313] text-[15px]">
								I'll
							</span>
							<input
								id="goal-measure"
								required
								maxLength={120}
								placeholder="make 300,000 in sales"
								value={measure}
								onChange={(e) => setMeasure(e.target.value)}
								className="flex-1 bg-transparent text-[#131313] text-[15px] outline-none placeholder:text-black/35"
							/>
						</div>
					</div>

					{/* Live SMART checklist */}
					<div className="rounded-2xl border border-black/10 bg-[#F7F9FC] p-3.5">
						<p
							className="mb-2.5 font-bold text-[10px] uppercase tracking-widest"
							style={{ color: "#005ac2" }}
						>
							Make it SMART
						</p>
						<ul className="flex flex-col gap-1.5">
							{smart.map((c) => (
								<li key={c.k} className="flex items-start gap-2.5 text-[12px]">
									<span
										className="mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full font-bold text-[10px]"
										style={{
											background: c.ok ? "#005ac2" : "rgba(14,20,32,0.08)",
											color: c.ok ? "#fff" : "rgba(14,20,32,0.5)",
										}}
									>
										{c.ok ? "✓" : c.k}
									</span>
									<span
										style={{
											color: c.ok ? "#131313" : "rgba(14,20,32,0.55)",
										}}
									>
										<span className="font-semibold">{c.label}.</span> {c.hint}
									</span>
								</li>
							))}
						</ul>
					</div>

					<fieldset>
						<legend className={labelCls}>How do you want to work on it?</legend>
						<div className="flex flex-col gap-2">
							{(
								[
									{
										value: "daily",
										title: "A step a day",
										desc: "One small task to do each day.",
									},
									{
										value: "weekly",
										title: "A focus a week",
										desc: "One thing to reach by the end of each week.",
									},
								] as const
							).map((opt) => {
								const active = cadence === opt.value;
								return (
									<label
										key={opt.value}
										className="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors focus-within:ring-1 focus-within:ring-[#F5C842]/60"
										style={{
											borderColor: active ? GOLD : "rgba(14,20,32,0.10)",
											backgroundColor: active
												? "rgba(245,200,66,0.10)"
												: "#F4F7FC",
										}}
									>
										<input
											type="radio"
											name="cadence"
											value={opt.value}
											checked={active}
											onChange={() => setCadence(opt.value)}
											className="sr-only"
										/>
										<span
											className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border"
											style={{
												borderColor: active
													? colors.goldInk
													: "rgba(14,20,32,0.28)",
											}}
										>
											{active && (
												<span
													className="h-2 w-2 rounded-full"
													style={{ backgroundColor: colors.goldInk }}
												/>
											)}
										</span>
										<span>
											<span className="block font-semibold text-[#0E1420] text-[14px]">
												{opt.title}
											</span>
											<span className="block text-[#0E1420]/55 text-[12px]">
												{opt.desc}
											</span>
										</span>
									</label>
								);
							})}
						</div>
					</fieldset>

					{error && <p className="text-[#DC2626] text-[12px]">{error}</p>}

					<button
						type="submit"
						disabled={submitting || !canSubmit}
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
