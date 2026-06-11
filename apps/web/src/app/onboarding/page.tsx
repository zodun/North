"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/auth-client";

// ── Data (stored values unchanged — visual labels/colors only) ──────────────

const GOLD = "#F5C842";
const TEAL = "#3ECFBF";
const VIOLET = "#7B61FF";

// Drives complete_onboarding (topFocusId + label). Display name/colour/icon
// live in FOCUS_META; the stored id + label here are untouched.
const FOCUS_AREAS = [
	{ id: "craft", label: "Craft & Mastery", hue: "#7ec4bb" },
	{ id: "venture", label: "Building a venture", hue: "#d4a574" },
	{ id: "mind", label: "Mind & body", hue: "#9aaee0" },
	{ id: "people", label: "People & community", hue: "#c97a5a" },
	{ id: "money", label: "Money & freedom", hue: "#a8b97a" },
	{ id: "learn", label: "Deeper learning", hue: "#b39ad8" },
];

const FOCUS_META: Record<
	string,
	{ name: string; desc: string; color: string; icon: keyof typeof ICONS }
> = {
	craft: { name: "Craft", desc: "Make things", color: GOLD, icon: "pencil" },
	venture: {
		name: "Venture",
		desc: "Build something",
		color: TEAL,
		icon: "rocket",
	},
	mind: { name: "Mind", desc: "Feel steady", color: VIOLET, icon: "brain" },
	people: {
		name: "People",
		desc: "Connect",
		color: "rgba(245,150,80,1)",
		icon: "users",
	},
	money: {
		name: "Money",
		desc: "Get free",
		color: "rgba(80,200,120,1)",
		icon: "chart",
	},
	learn: {
		name: "Learn",
		desc: "Go deep",
		color: "rgba(200,100,245,1)",
		icon: "book",
	},
};

// Maps to public.opportunity_categories.id — kept as-is so
// preferred_opportunity_categories stays valid for feed matching.
const OPPORTUNITY_TYPES = [
	{ id: "scholarship", label: "Scholarships" },
	{ id: "internship", label: "Fellowships" },
	{ id: "job", label: "Jobs" },
	{ id: "grant", label: "Grants" },
	{ id: "accelerator", label: "Accelerators" },
	{ id: "event", label: "Competitions" },
	{ id: "community", label: "Communities" },
	{ id: "creator-programme", label: "Creator Programmes" },
];

// Stored season_label values — unchanged. Card copy is presentational.
const SEASON_OPTIONS = [
	"I know my purpose — I need help finding opportunities.",
	"I don't know my purpose yet.",
];
const PURPOSE_CARDS = [
	{
		value: SEASON_OPTIONS[0],
		label: "I know my purpose",
		sub: "I have a clear direction and want to move faster",
		color: GOLD,
		icon: "compass" as const,
	},
	{
		value: SEASON_OPTIONS[1],
		label: "I'm still figuring it out",
		sub: "I want North to help me find what matters to me",
		color: TEAL,
		icon: "explore" as const,
	},
];

const TIME_OPTIONS = [
	{ value: "10–20 minutes", sub: "A quick daily check-in" },
	{ value: "30–45 minutes", sub: "Focused and consistent" },
	{ value: "1–2 hours", sub: "Deep work sessions" },
	{ value: "Whatever the day allows", sub: "Flexible, no pressure" },
];

const BASELINE_COLORS = [
	{ bg: "rgba(123,97,255,0.15)", border: VIOLET, text: VIOLET },
	{
		bg: "rgba(62,130,200,0.15)",
		border: "rgba(62,130,200,0.8)",
		text: "rgba(62,130,200,0.95)",
	},
	{ bg: "rgba(62,207,191,0.15)", border: TEAL, text: TEAL },
	{
		bg: "rgba(180,220,80,0.15)",
		border: "rgba(180,220,80,0.8)",
		text: "rgba(180,220,80,0.95)",
	},
	{ bg: "rgba(245,200,66,0.15)", border: GOLD, text: GOLD },
];

const CONSENT_ROWS = [
	"Your behaviour data is used only to improve your experience",
	"It is never shared with or sold to third parties",
	"You can delete your data at any time from your profile",
];

const CTA_LABELS = [
	"That's me",
	"This is me",
	"These are my focus areas",
	"Show me these",
	"This is my pace",
	"Got it",
	"This is my baseline",
	"Take me to North",
];

const TOTAL_STEPS = 8;

// ── Main component ─────────────────────────────────────────────────────────

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
	const [consent, setConsent] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [userId, setUserId] = useState<string | null>(null);

	useEffect(() => {
		supabase.auth.getUser().then(({ data }) => {
			if (data.user) setUserId(data.user.id);
		});
	}, []);

	// Prefill name from OAuth metadata — run once on mount only.
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
		if (step === 5) return true;
		if (step === 6) return baseline !== null;
		if (step === 7) return focus.length > 0 && baseline !== null && consent;
		return false;
	})();

	return (
		<div className="fixed inset-0 z-40 overflow-y-auto bg-[#05050E] font-jakarta">
			<style>{ANIM}</style>

			{/* Light leaks */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 z-0"
				style={{
					background:
						"radial-gradient(circle at 12% 8%, rgba(245,200,66,0.09), transparent 38%), radial-gradient(circle at 88% 92%, rgba(62,207,191,0.07), transparent 40%), radial-gradient(circle at 92% 6%, rgba(123,97,255,0.07), transparent 38%)",
				}}
			/>

			{/* Progress bar */}
			<div className="fixed top-0 right-0 left-0 z-50 h-[3px] bg-white/[0.06]">
				<div
					className="h-full bg-gradient-to-r from-[#F5C842] to-[#3ECFBF] transition-[width] duration-[400ms] ease-out motion-reduce:transition-none"
					style={{ width: `${progress}%` }}
				/>
			</div>
			<p className="fixed top-3 right-4 z-50 font-bold text-[10px] text-white/35 uppercase tracking-[0.1em]">
				Step {step + 1} of {TOTAL_STEPS}
			</p>

			{/* Back button */}
			{step > 0 && (
				<button
					type="button"
					onClick={() => setStep((s) => s - 1)}
					aria-label="Go back"
					className="absolute top-5 left-5 z-20 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/[0.06] transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C842] motion-reduce:transition-none"
				>
					<Icon name="back" />
				</button>
			)}

			{/* Step */}
			<div
				key={step}
				className="step-in relative z-10 mx-auto flex min-h-svh max-w-[420px] flex-col justify-center px-6 pt-16 pb-10"
			>
				{step === 0 && <StepName value={name} onChange={setName} />}
				{step === 1 && <StepPurpose value={season} onSelect={setSeason} />}
				{step === 2 && <StepFocus value={focus} onToggle={toggleFocus} />}
				{step === 3 && (
					<StepOpportunityTypes value={oppTypes} onToggle={toggleOppType} />
				)}
				{step === 4 && <StepTime value={time} onSelect={setTime} />}
				{step === 5 && <StepAvoid value={avoid} onChange={setAvoid} />}
				{step === 6 && <StepBaseline value={baseline} onSelect={setBaseline} />}
				{step === 7 && <StepConsent consent={consent} onConsent={setConsent} />}

				{error && (
					<p className="mt-5 text-[13px] text-red-400" role="alert">
						{error}
					</p>
				)}

				{/* CTA */}
				<div className="mt-8">
					<CtaButton
						onClick={handleNext}
						disabled={!canContinue || saving}
						saving={saving}
					>
						{CTA_LABELS[step]}
					</CtaButton>
					{step === 5 && (
						<button
							type="button"
							onClick={handleNext}
							className="mt-3 w-full cursor-pointer text-center font-medium text-[12px] text-white/30 transition-colors hover:text-white/50 motion-reduce:transition-none"
						>
							Skip for now
						</button>
					)}
					{step === 7 && !consent && (
						<p className="mt-2 text-center text-[11px] text-white/30">
							You must agree to continue
						</p>
					)}
				</div>
			</div>
		</div>
	);
}

// ── Shared chrome ───────────────────────────────────────────────────────────

function StepHead({
	eyebrow,
	headline,
	sub,
}: {
	eyebrow: string;
	headline: string;
	sub?: string;
}) {
	return (
		<div className="mb-8">
			<p
				className="mb-3 font-bold text-[10px] uppercase tracking-[0.15em]"
				style={{ color: "rgba(245,200,66,0.6)" }}
			>
				{eyebrow}
			</p>
			<h1 className="mb-2 font-black text-[26px] text-white leading-[1.15] tracking-tight">
				{headline}
			</h1>
			{sub && (
				<p className="text-[13px] text-white/50 leading-relaxed">{sub}</p>
			)}
		</div>
	);
}

function CtaButton({
	onClick,
	disabled,
	saving,
	children,
}: {
	onClick: () => void;
	disabled: boolean;
	saving: boolean;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className="relative w-full cursor-pointer overflow-hidden rounded-[14px] py-[15px] font-black text-[#05050E] text-[15px] tracking-tight transition-all hover:bg-[#FFD966] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C842] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05050E] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none motion-reduce:transition-none motion-reduce:active:scale-100"
			style={{
				backgroundColor: GOLD,
				boxShadow: disabled ? "none" : "0 4px 20px rgba(245,200,66,0.35)",
			}}
		>
			<span className="relative z-10">{saving ? "Saving…" : children} →</span>
			{!disabled && (
				<span
					aria-hidden="true"
					className="pointer-events-none absolute inset-y-0 w-[45%] animate-shimmer motion-reduce:hidden"
					style={{
						background:
							"linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
					}}
				/>
			)}
		</button>
	);
}

function selectableRing(): string {
	return "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C842] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05050E]";
}

function CheckBadge({ color, size = 24 }: { color: string; size?: number }) {
	return (
		<span
			className="flex items-center justify-center rounded-full"
			style={{ width: size, height: size, backgroundColor: color }}
		>
			<svg
				width={size * 0.5}
				height={size * 0.5}
				viewBox="0 0 24 24"
				fill="none"
				stroke="#05050E"
				strokeWidth={3.5}
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
			>
				<path d="M20 6 9 17l-5-5" />
			</svg>
		</span>
	);
}

// ── Steps ───────────────────────────────────────────────────────────────────

function StepName({
	value,
	onChange,
}: {
	value: string;
	onChange: (v: string) => void;
}) {
	return (
		<div>
			<StepHead
				eyebrow="Welcome to North"
				headline="What should we call you?"
				sub="This is how North will speak to you."
			/>
			<label htmlFor="onb-name" className="sr-only">
				Your first name
			</label>
			<input
				id="onb-name"
				type="text"
				// biome-ignore lint/a11y/noAutofocus: intentional UX for onboarding first step
				autoFocus
				autoComplete="given-name"
				autoCapitalize="words"
				placeholder="Your first name"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="w-full rounded-[14px] border border-white/10 bg-white/5 px-5 py-4 font-bold text-[18px] text-white outline-none transition-all placeholder:text-white/[0.18] focus:border-[#F5C842] focus:bg-[rgba(245,200,66,0.03)]"
			/>
		</div>
	);
}

function StepPurpose({
	value,
	onSelect,
}: {
	value: string | null;
	onSelect: (v: string) => void;
}) {
	return (
		<div>
			<StepHead
				eyebrow="Your starting point"
				headline="Where are you with your purpose?"
				sub="No right answer. Just where you are right now."
			/>
			<div className="flex flex-col gap-3">
				{PURPOSE_CARDS.map((c) => {
					const selected = value === c.value;
					return (
						<button
							key={c.value}
							type="button"
							aria-pressed={selected}
							onClick={() => onSelect(c.value)}
							className={`relative rounded-[18px] border-[1.5px] p-5 text-left transition-all hover:bg-white/[0.07] ${selectableRing()} motion-reduce:transition-none`}
							style={{
								backgroundColor: selected
									? `${c.color}14`
									: "rgba(255,255,255,0.04)",
								borderColor: selected ? c.color : "rgba(255,255,255,0.08)",
							}}
						>
							{selected && (
								<span className="absolute top-4 right-4">
									<CheckBadge color={c.color} size={24} />
								</span>
							)}
							<span
								className="mb-3 flex h-10 w-10 items-center justify-center rounded-[12px]"
								style={{ backgroundColor: `${c.color}1a` }}
							>
								<Icon name={c.icon} color={c.color} size={20} />
							</span>
							<p className="mb-1 font-black text-[15px] text-white">
								{c.label}
							</p>
							<p className="text-[12px] text-white/45 leading-relaxed">
								{c.sub}
							</p>
						</button>
					);
				})}
			</div>
		</div>
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
		<div>
			<StepHead
				eyebrow="What matters to you"
				headline="Pick up to three focus areas."
				sub="North personalises your feed and opportunities around these."
			/>
			<div className="grid grid-cols-2 gap-3">
				{FOCUS_AREAS.map((area) => {
					const m = FOCUS_META[area.id];
					const selected = value.includes(area.id);
					return (
						<button
							key={area.id}
							type="button"
							aria-pressed={selected}
							onClick={() => onToggle(area.id)}
							className={`relative flex flex-col items-start gap-2 rounded-[18px] border-[1.5px] p-4 transition-all hover:bg-white/[0.07] ${selectableRing()} motion-reduce:transition-none`}
							style={{
								backgroundColor: selected
									? `${m.color}14`
									: "rgba(255,255,255,0.04)",
								borderColor: selected ? m.color : "rgba(255,255,255,0.08)",
							}}
						>
							{selected && (
								<span className="absolute top-3 right-3">
									<CheckBadge color={m.color} size={20} />
								</span>
							)}
							<span
								className="flex h-9 w-9 items-center justify-center rounded-[10px]"
								style={{ backgroundColor: `${m.color}1a` }}
							>
								<Icon name={m.icon} color={m.color} size={18} />
							</span>
							<span className="font-black text-[13px] text-white">
								{m.name}
							</span>
							<span className="text-[10px] text-white/40">{m.desc}</span>
						</button>
					);
				})}
			</div>
			<p className="mt-3 text-center text-[11px] text-white/35">
				<span style={{ color: value.length > 0 ? GOLD : undefined }}>
					{value.length}
				</span>{" "}
				of 3 selected
			</p>
		</div>
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
		<div>
			<StepHead
				eyebrow="Opportunities for you"
				headline="What kinds of opportunities should we surface?"
				sub="Pick up to four. You can change this anytime."
			/>
			<div className="flex flex-wrap gap-2">
				{OPPORTUNITY_TYPES.map((opt) => {
					const selected = value.includes(opt.id);
					return (
						<button
							key={opt.id}
							type="button"
							aria-pressed={selected}
							onClick={() => onToggle(opt.id)}
							className={`cursor-pointer rounded-full border px-4 py-2.5 font-bold text-[12px] transition-all hover:bg-white/[0.09] ${selectableRing()} motion-reduce:transition-none`}
							style={
								selected
									? {
											backgroundColor: "rgba(62,207,191,0.1)",
											borderColor: "rgba(62,207,191,0.35)",
											color: TEAL,
										}
									: {
											backgroundColor: "rgba(255,255,255,0.05)",
											borderColor: "rgba(255,255,255,0.10)",
											color: "rgba(255,255,255,0.5)",
										}
							}
						>
							{opt.label}
						</button>
					);
				})}
			</div>
			<p className="mt-4 text-center text-[11px] text-white/35">
				<span style={{ color: value.length > 0 ? TEAL : undefined }}>
					{value.length}
				</span>{" "}
				of 4 selected
			</p>
		</div>
	);
}

function StepTime({
	value,
	onSelect,
}: {
	value: string | null;
	onSelect: (v: string) => void;
}) {
	return (
		<div>
			<StepHead
				eyebrow="Your real life"
				headline="How much time can you give this on a real day?"
				sub="Be honest. North works with what you actually have."
			/>
			<div className="flex flex-col gap-2">
				{TIME_OPTIONS.map((opt) => {
					const selected = value === opt.value;
					return (
						<button
							key={opt.value}
							type="button"
							aria-pressed={selected}
							onClick={() => onSelect(opt.value)}
							className={`relative flex items-center gap-4 rounded-[16px] border-[1.5px] p-4 text-left transition-all hover:bg-white/[0.07] ${selectableRing()} motion-reduce:transition-none`}
							style={{
								backgroundColor: selected
									? "rgba(245,200,66,0.08)"
									: "rgba(255,255,255,0.04)",
								borderColor: selected ? GOLD : "rgba(255,255,255,0.08)",
							}}
						>
							<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06]">
								<Icon name="clock" color="rgba(255,255,255,0.5)" size={18} />
							</span>
							<span className="flex-1">
								<span className="block font-black text-[14px] text-white">
									{opt.value}
								</span>
								<span className="mt-0.5 block text-[11px] text-white/40">
									{opt.sub}
								</span>
							</span>
							{selected && <CheckBadge color={GOLD} size={22} />}
						</button>
					);
				})}
			</div>
		</div>
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
		<div>
			<StepHead
				eyebrow="Just between us"
				headline="Is there something you keep starting and not finishing?"
				sub="North uses this to help you break the pattern. Optional, and only ever used to support you."
			/>
			<label htmlFor="onb-avoid" className="sr-only">
				What you keep starting and not finishing
			</label>
			<textarea
				id="onb-avoid"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				maxLength={500}
				placeholder="e.g. I always start exercising but stop after two weeks"
				className="h-[120px] w-full resize-none rounded-[14px] border border-white/10 bg-white/5 px-4 py-3.5 font-medium text-[14px] text-white outline-none transition-all placeholder:text-white/20 focus:border-[#3ECFBF] focus:bg-[rgba(62,207,191,0.03)]"
			/>
		</div>
	);
}

function StepBaseline({
	value,
	onSelect,
}: {
	value: number | null;
	onSelect: (v: number) => void;
}) {
	return (
		<div>
			<StepHead
				eyebrow="Your starting signal"
				headline="In a typical week, how much of your time goes toward what matters to you?"
				sub="This sets your starting Signal score. Be honest — North works better when it knows the truth."
			/>
			<div className="flex justify-center gap-3">
				{[1, 2, 3, 4, 5].map((n) => {
					const selected = value === n;
					const c = BASELINE_COLORS[n - 1];
					return (
						<button
							key={n}
							type="button"
							aria-pressed={selected}
							aria-label={`${n} out of 5`}
							onClick={() => onSelect(n)}
							className={`flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-[2px] font-black text-[18px] transition-all ${selectableRing()} motion-reduce:transition-none`}
							style={
								selected
									? {
											backgroundColor: c.bg,
											borderColor: c.border,
											color: c.text,
										}
									: {
											backgroundColor: "rgba(255,255,255,0.04)",
											borderColor: "rgba(255,255,255,0.15)",
											color: "rgba(255,255,255,0.4)",
										}
							}
						>
							{n}
						</button>
					);
				})}
			</div>
			<div className="mt-2 flex justify-between text-[10px] text-white/35">
				<span>Almost none</span>
				<span>Most of it</span>
			</div>
		</div>
	);
}

function StepConsent({
	consent,
	onConsent,
}: {
	consent: boolean;
	onConsent: (v: boolean) => void;
}) {
	return (
		<div>
			<StepHead
				eyebrow="One last thing"
				headline="North learns from how you show up."
				sub="To personalise your Signal score and surface better opportunities, North tracks your in-app behaviour — tasks completed, content engaged with, and time patterns. This data never leaves North and is never sold."
			/>
			<div className="mb-6 rounded-[16px] border border-white/8 bg-white/4 p-4">
				<div className="flex flex-col gap-3">
					{CONSENT_ROWS.map((row) => (
						<div key={row} className="flex items-start gap-3">
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke={TEAL}
								strokeWidth={2.5}
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
								className="mt-0.5 shrink-0"
							>
								<circle cx="12" cy="12" r="10" />
								<path d="m9 12 2 2 4-4" />
							</svg>
							<p className="text-[12px] text-white/60 leading-relaxed">{row}</p>
						</div>
					))}
				</div>
			</div>

			<div className="flex items-center justify-between rounded-[16px] border border-white/8 bg-white/4 px-4 py-3.5">
				<span className="font-bold text-[13px] text-white">
					I agree to behavioural data collection
				</span>
				<button
					type="button"
					role="switch"
					aria-checked={consent}
					aria-label="Agree to behavioural data collection"
					onClick={() => onConsent(!consent)}
					className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${selectableRing()} motion-reduce:transition-none`}
					style={{
						backgroundColor: consent ? TEAL : "rgba(255,255,255,0.1)",
					}}
				>
					<span
						className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform motion-reduce:transition-none"
						style={{
							transform: consent ? "translateX(22px)" : "translateX(2px)",
						}}
					/>
				</button>
			</div>
			<p className="mt-4 text-[10px] text-white/25 leading-relaxed">
				Governed by the Jamaica Data Protection Act 2020. Withdraw by deleting
				your account, which erases all behavioural data.
			</p>
		</div>
	);
}

// ── Icons ────────────────────────────────────────────────────────────────────

const ICONS = {
	back: "M19 12H5M12 19l-7-7 7-7",
	compass: "",
	explore: "",
	pencil: "M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z",
	rocket:
		"M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z",
	brain: "",
	users:
		"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
	chart: "M3 3v18h18M18 17V9M13 17V5M8 17v-3",
	book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z",
	clock: "M12 6v6l4 2",
} as const;

function Icon({
	name,
	color = "currentColor",
	size = 18,
}: {
	name: keyof typeof ICONS;
	color?: string;
	size?: number;
}) {
	const common = {
		width: size,
		height: size,
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: color,
		strokeWidth: 2,
		strokeLinecap: "round" as const,
		strokeLinejoin: "round" as const,
		"aria-hidden": true,
	};
	if (name === "compass") {
		return (
			<svg {...common} aria-hidden="true">
				<circle cx="12" cy="12" r="10" />
				<polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
			</svg>
		);
	}
	if (name === "explore") {
		return (
			<svg {...common} aria-hidden="true">
				<circle cx="11" cy="11" r="8" />
				<path d="m21 21-4.35-4.35" />
			</svg>
		);
	}
	if (name === "brain") {
		return (
			<svg {...common} aria-hidden="true">
				<path d="M12 5a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 0 3 3 0 0 0 2-5 3 3 0 0 0-2-5 3 3 0 0 0-3-3z" />
				<path d="M12 5v14" />
			</svg>
		);
	}
	if (name === "clock") {
		return (
			<svg {...common} aria-hidden="true">
				<circle cx="12" cy="12" r="10" />
				<path d={ICONS.clock} />
			</svg>
		);
	}
	return (
		<svg {...common} aria-hidden="true">
			<path d={ICONS[name]} />
		</svg>
	);
}

const ANIM = `
@keyframes stepIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
.step-in { animation: stepIn 400ms cubic-bezier(0.16,1,0.3,1); }
@media (prefers-reduced-motion: reduce) { .step-in { animation: none; } }
`;
