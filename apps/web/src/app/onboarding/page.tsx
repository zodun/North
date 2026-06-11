"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/auth-client";

// ── Data ──────────────────────────────────────────────────────────────

const FOCUS_AREAS = [
	{ id: "craft", label: "Craft & Mastery", hue: "#7ec4bb" },
	{ id: "venture", label: "Building a venture", hue: "#d4a574" },
	{ id: "mind", label: "Mind & body", hue: "#9aaee0" },
	{ id: "people", label: "People & community", hue: "#c97a5a" },
	{ id: "money", label: "Money & freedom", hue: "#a8b97a" },
	{ id: "learn", label: "Deeper learning", hue: "#b39ad8" },
];

// Maps to public.opportunity_categories.id — the answer ranks the
// Opportunities feed toward the kinds the user actually wants.
const OPPORTUNITY_TYPES = [
	{ id: "scholarship", label: "Scholarships" },
	{ id: "internship", label: "Internships & Fellowships" },
	{ id: "job", label: "Jobs" },
	{ id: "grant", label: "Grants & Funding" },
	{ id: "accelerator", label: "Accelerators" },
	{ id: "event", label: "Competitions & Events" },
	{ id: "community", label: "Communities" },
	{ id: "creator-programme", label: "Creator Programmes" },
];

const SEASON_OPTIONS = [
	"I know my purpose — I need help finding opportunities.",
	"I don't know my purpose yet.",
];

const TIME_OPTIONS = [
	"10 minutes",
	"30 minutes",
	"1 hour",
	"Whatever the day allows",
];

const BASELINE_LABELS = [
	"Not at all",
	"A little",
	"Somewhat",
	"Mostly",
	"Fully",
];

const CONSENT_BULLETS = [
	"We record what you view and how long you dwell. This is the raw material for your Signal score.",
	"Saves, likes, shares, and skips are captured too. They shape your feed and daily missions.",
	"This data is used only to personalise North for you. It is never sold or used for advertising.",
	"You can export or delete your full behavioural log from your Profile at any time.",
];

const CONSENT_DISCLOSURE =
	"Data controller: North. Analytics processed by PostHog under a data-processing agreement. " +
	"Retained for up to 12 months or until you delete your account. " +
	"To withdraw consent, delete your account. This erases all behavioural data. " +
	"Governed by the Jamaica Data Protection Act 2020.";

const TOTAL_STEPS = 8;

// ── Shared styles ──────────────────────────────────────────────────────

const inputCls =
	"w-full rounded-xl border border-white/12 bg-white/6 px-4 py-3 text-[15px] text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20";

// ── Main component ─────────────────────────────────────────────────────

export default function OnboardingPage() {
	const router = useRouter();
	const [step, setStep] = useState(0);
	const [name, setName] = useState("");
	const [season, setSeason] = useState<string | null>(null);
	const [focus, setFocus] = useState<string[]>([]);
	const [oppTypes, setOppTypes] = useState<string[]>([]);
	const [time, setTime] = useState<string | null>(null);
	const [avoid, setAvoid] = useState("");
	const [baseline, setBaseline] = useState<number | null>(null);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [userId, setUserId] = useState<string | null>(null);

	useEffect(() => {
		supabase.auth.getUser().then(({ data }) => {
			if (data.user) setUserId(data.user.id);
		});
	}, []);

	// Prefill name from OAuth metadata — run once on mount only.
	// Uses functional updater so `name` isn't in the dep array.
	useEffect(() => {
		supabase.auth.getSession().then(({ data }) => {
			const meta = data.session?.user.user_metadata ?? {};
			const oauthName =
				(meta.display_name as string | undefined) ??
				(meta.full_name as string | undefined) ??
				(meta.name as string | undefined) ??
				"";
			if (oauthName) setName((prev) => prev || oauthName);
		});
	}, []);

	const progress = ((step + 1) / TOTAL_STEPS) * 100;

	function toggleFocus(id: string) {
		setFocus((prev) =>
			prev.includes(id)
				? prev.filter((f) => f !== id)
				: prev.length < 3
					? [...prev, id]
					: prev,
		);
	}

	function toggleOppType(id: string) {
		setOppTypes((prev) =>
			prev.includes(id)
				? prev.filter((t) => t !== id)
				: prev.length < 4
					? [...prev, id]
					: prev,
		);
	}

	async function saveCurrentStep() {
		if (!userId) return;
		setError(null);

		if (step === 0) {
			const { error: err } = await supabase
				.from("profiles")
				.update({ display_name: name.trim() })
				.eq("user_id", userId);
			if (err) throw new Error(err.message);
		}
		if (step === 1 && season) {
			await Promise.all([
				supabase
					.from("profiles")
					.update({ season_label: season })
					.eq("user_id", userId),
				supabase
					.from("onboarding_responses")
					.upsert(
						{ user_id: userId, what_feels_missing: season },
						{ onConflict: "user_id" },
					),
			]);
		}
		if (step === 2 && focus.length > 0) {
			// Replace all focus areas
			await supabase.from("user_focus_areas").delete().eq("user_id", userId);
			await supabase
				.from("user_focus_areas")
				.insert(focus.map((id) => ({ user_id: userId, focus_area_id: id })));
		}
		if (step === 3) {
			const { error: err } = await supabase
				.from("profiles")
				.update({ preferred_opportunity_categories: oppTypes })
				.eq("user_id", userId);
			if (err) throw new Error(err.message);
		}
		if (step === 4 && time) {
			await supabase
				.from("profiles")
				.update({ time_budget_label: time })
				.eq("user_id", userId);
		}
		if (step === 5) {
			const note = avoid.trim();
			await Promise.all([
				supabase
					.from("profiles")
					.update({ avoid_note: note || null })
					.eq("user_id", userId),
				note
					? supabase
							.from("onboarding_responses")
							.upsert(
								{ user_id: userId, biggest_distraction: note },
								{ onConflict: "user_id" },
							)
					: Promise.resolve(),
			]);
		}
	}

	async function handleComplete() {
		if (!userId || focus.length === 0 || baseline == null) return;
		setSaving(true);
		setError(null);
		try {
			const topFocusId = focus[0];
			const topFocusLabel =
				FOCUS_AREAS.find((f) => f.id === topFocusId)?.label ?? topFocusId;
			const { error: rpcErr } = await supabase.rpc("complete_onboarding", {
				p_focus_area_id: topFocusId,
				p_focus_area_label: topFocusLabel,
				p_pulse_score: baseline,
			});
			if (rpcErr) throw new Error(rpcErr.message);
			router.replace("/for-you");
		} catch (e) {
			setError(e instanceof Error ? e.message : "Something went wrong.");
		} finally {
			setSaving(false);
		}
	}

	async function handleNext() {
		setSaving(true);
		setError(null);
		try {
			await saveCurrentStep();
			if (step < TOTAL_STEPS - 1) {
				setStep((s) => s + 1);
			} else {
				await handleComplete();
			}
		} catch (e) {
			setError(e instanceof Error ? e.message : "Something went wrong.");
		} finally {
			setSaving(false);
		}
	}

	const canContinue = (() => {
		if (step === 0) return name.trim().length > 0;
		if (step === 1) return season !== null;
		if (step === 2) return focus.length > 0;
		if (step === 3) return oppTypes.length > 0;
		if (step === 4) return time !== null;
		if (step === 5) return true; // optional
		if (step === 6) return baseline !== null;
		if (step === 7) return focus.length > 0 && baseline !== null;
		return false;
	})();

	return (
		<div className="flex min-h-svh flex-col px-6 pt-14 pb-10">
			{/* Progress bar */}
			<div className="mb-10 h-0.5 w-full overflow-hidden rounded-full bg-white/10">
				<div
					className="h-full rounded-full bg-white/60 transition-all duration-500"
					style={{ width: `${progress}%` }}
				/>
			</div>

			{/* Step content */}
			<div className="flex-1">
				{step === 0 && <StepName value={name} onChange={setName} />}
				{step === 1 && <StepSeason value={season} onChange={setSeason} />}
				{step === 2 && <StepFocus value={focus} onToggle={toggleFocus} />}
				{step === 3 && (
					<StepOpportunityTypes value={oppTypes} onToggle={toggleOppType} />
				)}
				{step === 4 && <StepTime value={time} onChange={setTime} />}
				{step === 5 && <StepAvoid value={avoid} onChange={setAvoid} />}
				{step === 6 && <StepBaseline value={baseline} onChange={setBaseline} />}
				{step === 7 && <StepConsent />}
			</div>

			{error && <p className="mb-3 text-[13px] text-red-400">{error}</p>}

			{/* Nav */}
			<div className="flex flex-col gap-3 pt-6">
				<button
					type="button"
					onClick={handleNext}
					disabled={!canContinue || saving}
					className="h-14 w-full rounded-xl bg-white font-semibold text-[15px] text-black transition-opacity disabled:opacity-40"
				>
					{saving
						? "Saving…"
						: step === TOTAL_STEPS - 1
							? "I agree, take me in"
							: "Continue"}
				</button>
				{step > 0 && (
					<button
						type="button"
						onClick={() => setStep((s) => s - 1)}
						className="py-2 text-center text-[13px] text-white/40"
					>
						Back
					</button>
				)}
			</div>
		</div>
	);
}

// ── Step components ────────────────────────────────────────────────────

function StepShell({
	prompt,
	sub,
	children,
}: {
	prompt: string;
	sub: string;
	children: React.ReactNode;
}) {
	return (
		<div>
			<h1 className="mb-2 font-semibold text-[26px] text-white leading-[1.25] tracking-tight">
				{prompt}
			</h1>
			<p className="mb-8 text-[14px] text-white/50 leading-relaxed">{sub}</p>
			{children}
		</div>
	);
}

function StepName({
	value,
	onChange,
}: {
	value: string;
	onChange: (v: string) => void;
}) {
	return (
		<StepShell
			prompt="What should we call you?"
			sub="Used only inside the app. Change it any time."
		>
			<input
				type="text"
				// biome-ignore lint/a11y/noAutofocus: intentional UX for onboarding first step
				autoFocus
				placeholder="Your first name"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				autoCapitalize="words"
				className={inputCls}
			/>
		</StepShell>
	);
}

function StepSeason({
	value,
	onChange,
}: {
	value: string | null;
	onChange: (v: string) => void;
}) {
	return (
		<StepShell
			prompt="Where are you with your purpose?"
			sub="There is no right answer. It helps us pitch North to where you are."
		>
			<div className="flex flex-col gap-3">
				{SEASON_OPTIONS.map((opt) => (
					<button
						key={opt}
						type="button"
						onClick={() => onChange(opt)}
						className={`rounded-xl border p-4 text-left text-[14px] leading-snug transition-colors ${
							value === opt
								? "border-white/40 bg-white/12 text-white"
								: "border-white/10 bg-white/4 text-white/60"
						}`}
					>
						{opt}
					</button>
				))}
			</div>
		</StepShell>
	);
}

function StepFocus({
	value,
	onToggle,
}: {
	value: string[];
	onToggle: (id: string) => void;
}) {
	return (
		<StepShell
			prompt="Pick up to three focus areas."
			sub="These shape your feed, your missions, and the opportunities you see."
		>
			<div className="grid grid-cols-2 gap-2.5">
				{FOCUS_AREAS.map((area) => {
					const isSelected = value.includes(area.id);
					return (
						<button
							key={area.id}
							type="button"
							onClick={() => onToggle(area.id)}
							className="rounded-xl border p-4 text-left transition-colors"
							style={{
								borderColor: isSelected
									? `${area.hue}80`
									: "rgba(255,255,255,0.08)",
								backgroundColor: isSelected
									? `${area.hue}15`
									: "rgba(255,255,255,0.03)",
							}}
						>
							<div
								className="mb-2 h-2.5 w-2.5 rounded-full"
								style={{ backgroundColor: area.hue }}
							/>
							<p
								className="font-medium text-[13px] leading-snug"
								style={{
									color: isSelected ? "#fff" : "rgba(255,255,255,0.55)",
								}}
							>
								{area.label}
							</p>
						</button>
					);
				})}
			</div>
			{value.length === 3 && (
				<p className="mt-3 text-center text-[12px] text-white/30">
					Maximum 3 selected
				</p>
			)}
		</StepShell>
	);
}

function StepOpportunityTypes({
	value,
	onToggle,
}: {
	value: string[];
	onToggle: (id: string) => void;
}) {
	return (
		<StepShell
			prompt="What kinds of opportunities should we surface?"
			sub="Pick up to four. We'll lead your Opportunities feed with these."
		>
			<div className="grid grid-cols-2 gap-2.5">
				{OPPORTUNITY_TYPES.map((opt) => {
					const isSelected = value.includes(opt.id);
					return (
						<button
							key={opt.id}
							type="button"
							onClick={() => onToggle(opt.id)}
							className={`rounded-xl border p-4 text-left font-medium text-[13px] leading-snug transition-colors ${
								isSelected
									? "border-[#3ECFBF]/50 bg-[#3ECFBF]/12 text-white"
									: "border-white/10 bg-white/3 text-white/55"
							}`}
						>
							{opt.label}
						</button>
					);
				})}
			</div>
			{value.length === 4 && (
				<p className="mt-3 text-center text-[12px] text-white/30">
					Maximum 4 selected
				</p>
			)}
		</StepShell>
	);
}

function StepTime({
	value,
	onChange,
}: {
	value: string | null;
	onChange: (v: string) => void;
}) {
	return (
		<StepShell
			prompt="How much time can you give this on a real day?"
			sub="Be honest. We tune your missions to fit."
		>
			<div className="flex flex-col gap-3">
				{TIME_OPTIONS.map((opt) => (
					<button
						key={opt}
						type="button"
						onClick={() => onChange(opt)}
						className={`rounded-xl border p-4 text-left text-[14px] leading-snug transition-colors ${
							value === opt
								? "border-white/40 bg-white/12 text-white"
								: "border-white/10 bg-white/4 text-white/60"
						}`}
					>
						{opt}
					</button>
				))}
			</div>
		</StepShell>
	);
}

function StepAvoid({
	value,
	onChange,
}: {
	value: string;
	onChange: (v: string) => void;
}) {
	return (
		<StepShell
			prompt="Is there something you keep starting and not finishing?"
			sub="No judgement. We use this to make missions that respect it, not push past it."
		>
			<textarea
				placeholder="Optional, but useful"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				maxLength={500}
				rows={4}
				className={`${inputCls} resize-none`}
			/>
			<p className="mt-1.5 text-right text-[11px] text-white/25">
				{value.length}/500
			</p>
		</StepShell>
	);
}

function StepBaseline({
	value,
	onChange,
}: {
	value: number | null;
	onChange: (v: number) => void;
}) {
	return (
		<StepShell
			prompt="In a typical week, how much of your time goes toward what matters to you?"
			sub="Baseline. We'll ask again in four weeks."
		>
			<div className="flex flex-col gap-3">
				{BASELINE_LABELS.map((label, i) => {
					const score = i + 1;
					const isSelected = value === score;
					return (
						<button
							key={label}
							type="button"
							onClick={() => onChange(score)}
							className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
								isSelected
									? "border-white/40 bg-white/12"
									: "border-white/10 bg-white/4"
							}`}
						>
							<div
								className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-semibold text-[13px] ${
									isSelected
										? "border-white bg-white text-black"
										: "border-white/20 text-white/40"
								}`}
							>
								{score}
							</div>
							<span
								className={`text-[14px] ${isSelected ? "text-white" : "text-white/60"}`}
							>
								{label}
							</span>
						</button>
					);
				})}
			</div>
		</StepShell>
	);
}

function StepConsent() {
	return (
		<StepShell
			prompt="One last thing."
			sub="North learns from what you do. You can see, export, or delete this any time."
		>
			<div className="flex flex-col gap-4">
				{CONSENT_BULLETS.map((bullet) => (
					<div key={bullet} className="flex items-start gap-3">
						<svg
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="#7ec4bb"
							strokeWidth={2.5}
							strokeLinecap="round"
							strokeLinejoin="round"
							className="mt-0.5 shrink-0"
							aria-hidden="true"
						>
							<path d="M20 6L9 17l-5-5" />
						</svg>
						<p className="text-[14px] text-white/70 leading-relaxed">
							{bullet}
						</p>
					</div>
				))}
			</div>
			<p className="mt-6 text-[11px] text-white/30 leading-relaxed">
				{CONSENT_DISCLOSURE}
			</p>
		</StepShell>
	);
}
