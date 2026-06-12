"use client";

import { useRef, useState } from "react";
import { colors } from "@/components/product/north-ui";
import { supabase } from "@/lib/auth-client";
import {
	CAREER_STAGES,
	COUNTRIES,
	FIELDS,
	MAX_FIELDS,
} from "@/lib/personalization-options";

const GOLD = colors.gold;
const TEAL = colors.teal;

// Editable "who you are" fields that steer For You + Opportunities. Lives on
// Profile because career stage and field change over time — an honest mirror has
// to be correctable, or the personalization silently rots. Same control
// vocabulary as onboarding; optimistic local update with a quiet save status.

type Status = "idle" | "saving" | "saved" | "error";
type Patch = Record<string, unknown>;

export function PreferencesSection({
	userId,
	careerStage: careerStage0,
	fields: fields0,
	country: country0,
	openToRemote: openToRemote0,
	openToRelocate: openToRelocate0,
}: {
	userId: string;
	careerStage: string | null;
	fields: string[];
	country: string | null;
	openToRemote: boolean;
	openToRelocate: boolean;
}) {
	const [careerStage, setCareerStage] = useState(careerStage0 ?? "");
	const [fields, setFields] = useState<string[]>(fields0);
	const [country, setCountry] = useState(country0 ?? "");
	const [remote, setRemote] = useState(openToRemote0);
	const [relocate, setRelocate] = useState(openToRelocate0);
	const [status, setStatus] = useState<Status>("idle");
	const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	async function save(patch: Patch) {
		setStatus("saving");
		if (clearTimer.current) clearTimeout(clearTimer.current);
		const { error } = await supabase
			.from("profiles")
			.update(patch)
			.eq("user_id", userId);
		if (error) {
			setStatus("error");
			return;
		}
		setStatus("saved");
		clearTimer.current = setTimeout(() => setStatus("idle"), 1800);
	}

	function onCareerStage(value: string) {
		setCareerStage(value);
		save({ career_stage: value || null });
	}

	function toggleField(value: string) {
		const next = fields.includes(value)
			? fields.filter((f) => f !== value)
			: fields.length < MAX_FIELDS
				? [...fields, value]
				: fields;
		if (next === fields) return; // at max, no-op (matches onboarding)
		setFields(next);
		save({ fields: next });
	}

	function onCountry(value: string) {
		setCountry(value);
		save({ country: value || null });
	}

	function onRemote(value: boolean) {
		setRemote(value);
		save({ open_to_remote: value });
	}

	function onRelocate(value: boolean) {
		setRelocate(value);
		save({ open_to_relocate: value });
	}

	return (
		<section className="mb-10">
			<div className="mb-3 flex items-center justify-between">
				<p className="font-bold text-[10px] text-white/45 uppercase tracking-[0.14em]">
					Preferences
				</p>
				<SaveStatus status={status} />
			</div>
			<p className="mb-5 text-[12px] text-white/40 leading-relaxed">
				What North uses to tailor your feed and opportunities. Keep it current
				as things change.
			</p>

			<div className="flex flex-col gap-5">
				<Row label="Career stage">
					<Select
						id="pref-career"
						value={careerStage}
						placeholder="Select your stage"
						onChange={onCareerStage}
						options={CAREER_STAGES.map((s) => s.value)}
					/>
				</Row>

				<Row label={`Field — up to ${MAX_FIELDS}`}>
					<div className="flex flex-wrap gap-2">
						{FIELDS.map((label) => {
							const selected = fields.includes(label);
							const atMax = !selected && fields.length >= MAX_FIELDS;
							return (
								<button
									key={label}
									type="button"
									aria-pressed={selected}
									disabled={atMax}
									onClick={() => toggleField(label)}
									className="cursor-pointer rounded-full border px-3.5 py-2 font-bold text-[12px] transition-colors duration-200 hover:bg-white/[0.09] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C842] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05050E] disabled:cursor-not-allowed disabled:opacity-35 motion-reduce:transition-none"
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
									{label}
								</button>
							);
						})}
					</div>
				</Row>

				<Row label="Based in">
					<Select
						id="pref-country"
						value={country}
						placeholder="Select your country"
						onChange={onCountry}
						options={COUNTRIES}
					/>
				</Row>

				<Toggle
					label="Open to remote opportunities"
					checked={remote}
					onChange={onRemote}
				/>
				<Toggle
					label="Open to relocating"
					checked={relocate}
					onChange={onRelocate}
				/>
			</div>
		</section>
	);
}

function Row({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div>
			<p className="mb-2 text-[12px] text-white/45">{label}</p>
			{children}
		</div>
	);
}

function Select({
	id,
	value,
	placeholder,
	options,
	onChange,
}: {
	id: string;
	value: string;
	placeholder: string;
	options: string[];
	onChange: (v: string) => void;
}) {
	return (
		<div className="relative">
			<select
				id={id}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="w-full appearance-none rounded-[10px] border border-white/10 bg-white/[0.05] px-4 py-3 pr-10 font-semibold text-[14px] outline-none transition-colors duration-200 focus:border-[#F5C842] focus:bg-[rgba(245,200,66,0.03)] motion-reduce:transition-none"
				style={{ color: value ? "#fff" : "rgba(255,255,255,0.35)" }}
			>
				<option value="" disabled className="bg-[#05050E] text-white/40">
					{placeholder}
				</option>
				{options.map((o) => (
					<option key={o} value={o} className="bg-[#05050E] text-white">
						{o}
					</option>
				))}
			</select>
			<span
				aria-hidden="true"
				className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-white/40"
			>
				<svg
					width="13"
					height="13"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth={2.5}
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<path d="m6 9 6 6 6-6" />
				</svg>
			</span>
		</div>
	);
}

function Toggle({
	label,
	checked,
	onChange,
}: {
	label: string;
	checked: boolean;
	onChange: (v: boolean) => void;
}) {
	return (
		<div className="flex items-center justify-between gap-3">
			<span className="text-[13px] text-white/70">{label}</span>
			<button
				type="button"
				role="switch"
				aria-checked={checked}
				aria-label={label}
				onClick={() => onChange(!checked)}
				className="relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C842] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05050E] motion-reduce:transition-none"
				style={{ backgroundColor: checked ? TEAL : "rgba(255,255,255,0.1)" }}
			>
				<span
					className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200 motion-reduce:transition-none"
					style={{
						transform: checked ? "translateX(22px)" : "translateX(2px)",
					}}
				/>
			</button>
		</div>
	);
}

function SaveStatus({ status }: { status: Status }) {
	if (status === "idle") return null;
	const text =
		status === "saving"
			? "Saving…"
			: status === "saved"
				? "Saved"
				: "Couldn't save";
	const color =
		status === "error"
			? colors.noiseRed
			: status === "saved"
				? GOLD
				: "rgba(255,255,255,0.4)";
	return (
		<span
			aria-live="polite"
			className="font-semibold text-[11px] transition-opacity duration-200 motion-reduce:transition-none"
			style={{ color }}
		>
			{text}
		</span>
	);
}
