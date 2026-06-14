"use client";

import { useEffect, useRef, useState } from "react";
import { FOCUS_AREAS, ONBOARDING_QS, type OnboardingQ } from "../_lib/data";
import {
	easings,
	type Palette,
	type Tweaks,
	type TypePairing,
} from "../_lib/tokens";
import { Icon } from "./icon";

type Answers = Record<string, unknown>;

function ProgressDots({
	count,
	current,
	p,
}: {
	count: number;
	current: number;
	p: Palette;
}) {
	return (
		<div style={{ display: "flex", gap: 5, marginBottom: 28 }}>
			{Array.from({ length: count }).map((_, i) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: progress indicator
					key={i}
					style={{
						height: 3,
						flex: i === current ? 3 : 1,
						background: i <= current ? p.accent : p.line,
						borderRadius: 2,
						transition: `all 280ms ${easings.calm}`,
					}}
				/>
			))}
		</div>
	);
}

function TextQ({
	q,
	value,
	setValue,
	p,
	t,
}: {
	q: OnboardingQ;
	value: unknown;
	setValue: (v: string) => void;
	p: Palette;
	t: TypePairing;
}) {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
			<input
				// biome-ignore lint/a11y/noAutofocus: intentional focus in onboarding flow
				autoFocus
				value={typeof value === "string" ? value : ""}
				onChange={(e) => setValue(e.target.value)}
				placeholder={q.placeholder}
				style={{
					background: "transparent",
					border: "none",
					borderBottom: `1px solid ${p.lineHi}`,
					padding: "8px 0",
					color: p.ink,
					outline: "none",
					fontFamily: t.display,
					fontWeight: t.displayWeight,
					letterSpacing: t.displayTracking,
					fontStyle: t.editorialItalic ? "italic" : "normal",
					fontSize: 26,
				}}
			/>
		</div>
	);
}

function ChoiceQ({
	q,
	value,
	setValue,
	p,
	t,
}: {
	q: OnboardingQ;
	value: unknown;
	setValue: (v: string) => void;
	p: Palette;
	t: TypePairing;
}) {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
			{q.options?.map((opt) => (
				<button
					type="button"
					key={opt}
					onClick={() => setValue(opt)}
					style={{
						display: "flex",
						alignItems: "flex-start",
						gap: 14,
						padding: "16px",
						background: value === opt ? p.accentSoft : p.surface,
						border: `1px solid ${value === opt ? p.accent : p.line}`,
						borderRadius: 14,
						textAlign: "left",
						cursor: "pointer",
						transition: `all 200ms ${easings.calm}`,
					}}
				>
					<div
						style={{
							width: 18,
							height: 18,
							borderRadius: 9,
							flexShrink: 0,
							marginTop: 1,
							border: `1.5px solid ${value === opt ? p.accent : p.lineHi}`,
							background: value === opt ? p.accent : "transparent",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						{value === opt && (
							<div
								style={{
									width: 6,
									height: 6,
									borderRadius: 3,
									background: p.accentInk,
								}}
							/>
						)}
					</div>
					<span
						style={{
							fontFamily: t.ui,
							fontSize: 15,
							color: p.ink,
							lineHeight: 1.35,
							flex: 1,
						}}
					>
						{opt}
					</span>
				</button>
			))}
		</div>
	);
}

function MultiQ({
	q,
	value,
	setValue,
	p,
	t,
}: {
	q: OnboardingQ;
	value: unknown;
	setValue: (v: string[]) => void;
	p: Palette;
	t: TypePairing;
}) {
	const arr = Array.isArray(value) ? (value as string[]) : [];
	const toggle = (opt: string) => {
		if (arr.includes(opt)) setValue(arr.filter((x) => x !== opt));
		else if (arr.length < (q.max ?? 3)) setValue([...arr, opt]);
	};
	return (
		<div>
			<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
				{q.options?.map((opt, i) => {
					const f = FOCUS_AREAS[i];
					const on = arr.includes(opt);
					return (
						<button
							type="button"
							key={opt}
							onClick={() => toggle(opt)}
							style={{
								display: "flex",
								alignItems: "center",
								gap: 12,
								cursor: "pointer",
								padding: "14px 16px",
								background: on ? p.accentSoft : p.surface,
								border: `1px solid ${on ? p.accent : p.line}`,
								borderRadius: 14,
								textAlign: "left",
								transition: `all 200ms ${easings.calm}`,
							}}
						>
							<div
								style={{
									width: 8,
									height: 8,
									borderRadius: 4,
									background: f?.hue ?? p.accent,
									flexShrink: 0,
								}}
							/>
							<span
								style={{
									fontFamily: t.ui,
									fontSize: 14.5,
									color: p.ink,
									fontWeight: 500,
									flex: 1,
								}}
							>
								{opt}
							</span>
							{on && (
								<Icon
									name="check"
									size={16}
									stroke={p.accent}
									strokeWidth={2}
								/>
							)}
						</button>
					);
				})}
			</div>
			<div
				style={{
					fontFamily: t.ui,
					fontSize: 11.5,
					color: p.inkDim,
					marginTop: 14,
					letterSpacing: "0.02em",
				}}
			>
				{arr.length} of {q.max ?? 3} chosen
			</div>
		</div>
	);
}

function ScaleQ({
	q,
	value,
	setValue,
	p,
	t,
}: {
	q: OnboardingQ;
	value: unknown;
	setValue: (v: number) => void;
	p: Palette;
	t: TypePairing;
}) {
	return (
		<div>
			<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
				{q.scale?.map((label, i) => (
					<button
						type="button"
						key={label}
						onClick={() => setValue(i)}
						style={{
							display: "flex",
							alignItems: "center",
							gap: 14,
							cursor: "pointer",
							padding: "14px 16px",
							background: value === i ? p.accentSoft : p.surface,
							border: `1px solid ${value === i ? p.accent : p.line}`,
							borderRadius: 14,
							textAlign: "left",
						}}
					>
						<div
							style={{
								fontFamily: t.mono,
								fontSize: 12,
								color: value === i ? p.accent : p.inkDim,
								width: 18,
							}}
						>
							{i + 1}
						</div>
						<span
							style={{
								fontFamily: t.ui,
								fontSize: 14.5,
								color: p.ink,
								flex: 1,
							}}
						>
							{label}
						</span>
					</button>
				))}
			</div>
			<div
				style={{
					fontFamily: t.ui,
					fontSize: 11,
					color: p.inkDim,
					marginTop: 16,
					letterSpacing: "0.02em",
					lineHeight: 1.5,
				}}
			>
				This is the baseline. We'll ask the same question in four weeks and
				compare.
			</div>
		</div>
	);
}

function ConsentQ({
	q,
	value,
	setValue,
	p,
	t,
}: {
	q: OnboardingQ;
	value: unknown;
	setValue: (v: boolean) => void;
	p: Palette;
	t: TypePairing;
}) {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
			<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
				{q.points?.map((pt) => (
					<div
						key={pt}
						style={{
							display: "flex",
							alignItems: "flex-start",
							gap: 12,
							padding: "14px 16px",
							borderRadius: 14,
							background: p.surface,
							border: `1px solid ${p.line}`,
						}}
					>
						<Icon
							name="check"
							size={16}
							stroke={p.accent}
							strokeWidth={2}
							style={{ marginTop: 2, flexShrink: 0 }}
						/>
						<span
							style={{
								fontFamily: t.ui,
								fontSize: 13.5,
								color: p.ink,
								lineHeight: 1.4,
							}}
						>
							{pt}
						</span>
					</div>
				))}
			</div>
			<button
				type="button"
				onClick={() => setValue(true)}
				style={{
					padding: "14px",
					borderRadius: 12,
					background: value ? p.accentSoft : "transparent",
					border: `1px solid ${value ? p.accent : p.lineHi}`,
					color: value ? p.accent : p.inkMid,
					cursor: "pointer",
					fontFamily: t.ui,
					fontSize: 13,
					fontWeight: 500,
					display: "flex",
					alignItems: "center",
					gap: 10,
				}}
			>
				<div
					style={{
						width: 18,
						height: 18,
						borderRadius: 4,
						flexShrink: 0,
						border: `1.5px solid ${value ? p.accent : p.lineHi}`,
						background: value ? p.accent : "transparent",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					{value === true && (
						<Icon
							name="check"
							size={12}
							stroke={p.accentInk}
							strokeWidth={2.5}
						/>
					)}
				</div>
				I understand. I can change this any time.
			</button>
		</div>
	);
}

function QInput({
	q,
	value,
	setValue,
	p,
	t,
}: {
	q: OnboardingQ;
	value: unknown;
	setValue: (v: unknown) => void;
	p: Palette;
	t: TypePairing;
}) {
	if (q.kind === "text")
		return <TextQ q={q} value={value} setValue={setValue} p={p} t={t} />;
	if (q.kind === "choice")
		return <ChoiceQ q={q} value={value} setValue={setValue} p={p} t={t} />;
	if (q.kind === "multi")
		return <MultiQ q={q} value={value} setValue={setValue} p={p} t={t} />;
	if (q.kind === "scale")
		return <ScaleQ q={q} value={value} setValue={setValue} p={p} t={t} />;
	if (q.kind === "consent")
		return <ConsentQ q={q} value={value} setValue={setValue} p={p} t={t} />;
	return null;
}

function isAnswered(q: OnboardingQ, v: unknown) {
	if (q.optional) return true;
	if (q.kind === "text") return typeof v === "string" && v.length > 0;
	if (q.kind === "multi") return Array.isArray(v) && v.length > 0;
	if (q.kind === "scale") return v != null;
	if (q.kind === "consent") return v === true;
	return v != null;
}

type ViewProps = {
	p: Palette;
	t: TypePairing;
	qs: OnboardingQ[];
	idx: number;
	setIdx: (n: number) => void;
	answers: Answers;
	setAnswer: (id: string, v: unknown) => void;
	onFinish: () => void;
};

function OneQView({
	p,
	t,
	qs,
	idx,
	setIdx,
	answers,
	setAnswer,
	onFinish,
}: ViewProps) {
	const q = qs[idx];
	if (!q) return null;
	const answered = isAnswered(q, answers[q.id]);
	const last = idx === qs.length - 1;
	return (
		<div
			style={{
				position: "absolute",
				inset: 0,
				display: "flex",
				flexDirection: "column",
				padding: "76px 24px 30px 24px",
			}}
		>
			<ProgressDots count={qs.length} current={idx} p={p} />
			<div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
				<div
					style={{
						fontFamily: t.ui,
						fontSize: 11,
						letterSpacing: "0.18em",
						textTransform: "uppercase",
						color: p.inkDim,
						fontWeight: 500,
						marginBottom: 14,
					}}
				>
					{idx === 0
						? "Welcome"
						: idx === qs.length - 1
							? "Last thing"
							: `Question ${idx + 1} of ${qs.length}`}
				</div>
				<h1
					style={{
						fontFamily: t.display,
						fontWeight: t.displayWeight,
						letterSpacing: t.displayTracking,
						fontStyle: t.editorialItalic ? "italic" : "normal",
						fontSize: 28,
						lineHeight: 1.22,
						color: p.ink,
						margin: "0 0 10px 0",
					}}
				>
					{q.prompt}
				</h1>
				<p
					style={{
						fontFamily: t.ui,
						fontSize: 13.5,
						color: p.inkMid,
						margin: "0 0 28px 0",
						lineHeight: 1.5,
					}}
				>
					{q.sub}
				</p>
				<QInput
					q={q}
					value={answers[q.id]}
					setValue={(v) => setAnswer(q.id, v)}
					p={p}
					t={t}
				/>
			</div>
			<div style={{ display: "flex", gap: 10, marginTop: 20 }}>
				{idx > 0 && (
					<button
						type="button"
						onClick={() => setIdx(idx - 1)}
						style={{
							padding: "14px 20px",
							borderRadius: 999,
							background: "transparent",
							border: `1px solid ${p.lineHi}`,
							color: p.inkMid,
							fontFamily: t.ui,
							fontSize: 13,
							fontWeight: 500,
							cursor: "pointer",
						}}
					>
						Back
					</button>
				)}
				<button
					type="button"
					disabled={!answered}
					onClick={() => (last ? onFinish() : setIdx(idx + 1))}
					style={{
						flex: 1,
						padding: "14px",
						borderRadius: 999,
						background: answered ? p.accent : p.surface,
						color: answered ? p.accentInk : p.inkDim,
						border: "none",
						cursor: answered ? "pointer" : "not-allowed",
						fontFamily: t.ui,
						fontSize: 13.5,
						fontWeight: 600,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: 8,
					}}
				>
					{last ? "Begin" : "Continue"}
					<Icon name="arrow" size={15} stroke="currentColor" strokeWidth={2} />
				</button>
			</div>
		</div>
	);
}

function ConversationalView({
	p,
	t,
	qs,
	idx,
	setIdx,
	answers,
	setAnswer,
	onFinish,
}: ViewProps) {
	const bubblesRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const el = bubblesRef.current;
		if (!el) return;
		el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
	}, []);
	const summarize = (q: OnboardingQ, a: unknown): string => {
		if (q.kind === "text") return (a as string) || "Not set";
		if (q.kind === "multi") return ((a as string[]) ?? []).join(" · ");
		if (q.kind === "scale") return q.scale?.[a as number] ?? "Not set";
		if (q.kind === "consent") return "Understood.";
		return (a as string) || "Not set";
	};
	const cur = qs[idx];
	if (!cur) return null;
	return (
		<div
			style={{
				position: "absolute",
				inset: 0,
				display: "flex",
				flexDirection: "column",
			}}
		>
			<div
				ref={bubblesRef}
				style={{ flex: 1, overflowY: "auto", padding: "76px 18px 12px 18px" }}
			>
				<div
					style={{
						fontFamily: t.ui,
						fontSize: 11,
						letterSpacing: "0.18em",
						textTransform: "uppercase",
						color: p.inkDim,
						fontWeight: 500,
						marginBottom: 18,
					}}
				>
					North · setup
				</div>
				{qs.slice(0, idx + 1).map((q, i) => (
					<div key={q.id} style={{ marginBottom: 22 }}>
						<div
							style={{
								maxWidth: "85%",
								padding: "14px 16px",
								borderRadius: 18,
								borderTopLeftRadius: 6,
								background: p.surface,
								border: `1px solid ${p.line}`,
								fontFamily: t.display,
								fontWeight: t.displayWeight,
								letterSpacing: t.displayTracking,
								fontStyle: t.editorialItalic ? "italic" : "normal",
								fontSize: 17,
								color: p.ink,
								lineHeight: 1.3,
							}}
						>
							{q.prompt}
						</div>
						{q.sub && (
							<div
								style={{
									fontFamily: t.ui,
									fontSize: 11,
									color: p.inkDim,
									marginTop: 6,
									paddingLeft: 4,
								}}
							>
								{q.sub}
							</div>
						)}
						{i < idx && (
							<div
								style={{
									display: "flex",
									justifyContent: "flex-end",
									marginTop: 10,
								}}
							>
								<div
									style={{
										maxWidth: "85%",
										padding: "12px 14px",
										borderRadius: 18,
										borderTopRightRadius: 6,
										background: p.accentSoft,
										border: `1px solid ${p.accent}44`,
										fontFamily: t.ui,
										fontSize: 14,
										color: p.ink,
										lineHeight: 1.4,
									}}
								>
									{summarize(q, answers[q.id])}
								</div>
							</div>
						)}
					</div>
				))}
			</div>
			<div
				style={{
					padding: "12px 18px 30px 18px",
					background: p.bg,
					borderTop: `1px solid ${p.line}`,
				}}
			>
				<QInput
					q={cur}
					value={answers[cur.id]}
					setValue={(v) => setAnswer(cur.id, v)}
					p={p}
					t={t}
				/>
				<div style={{ display: "flex", gap: 8, marginTop: 14 }}>
					{idx > 0 && (
						<button
							type="button"
							onClick={() => setIdx(idx - 1)}
							style={{
								padding: "12px 16px",
								borderRadius: 999,
								background: "transparent",
								border: `1px solid ${p.lineHi}`,
								color: p.inkMid,
								fontFamily: t.ui,
								fontSize: 12.5,
								fontWeight: 500,
								cursor: "pointer",
							}}
						>
							Back
						</button>
					)}
					<button
						type="button"
						disabled={!isAnswered(cur, answers[cur.id])}
						onClick={() =>
							idx === qs.length - 1 ? onFinish() : setIdx(idx + 1)
						}
						style={{
							flex: 1,
							padding: "12px",
							borderRadius: 999,
							background: isAnswered(cur, answers[cur.id])
								? p.accent
								: p.surface,
							color: isAnswered(cur, answers[cur.id]) ? p.accentInk : p.inkDim,
							border: "none",
							cursor: isAnswered(cur, answers[cur.id])
								? "pointer"
								: "not-allowed",
							fontFamily: t.ui,
							fontSize: 13,
							fontWeight: 600,
						}}
					>
						{idx === qs.length - 1 ? "Begin" : "Send answer"}
					</button>
				</div>
			</div>
		</div>
	);
}

function GuidedView({
	p,
	t,
	qs,
	idx,
	setIdx,
	answers,
	setAnswer,
	onFinish,
}: ViewProps) {
	const chapters = [
		{ label: "Orient", range: [0, 1] as const },
		{ label: "Place", range: [2, 4] as const },
		{ label: "Commit", range: [5, 6] as const },
	];
	const currentChapter = chapters.findIndex(
		(c) => idx >= c.range[0] && idx <= c.range[1],
	);
	const q = qs[idx];
	if (!q) return null;
	const answered = isAnswered(q, answers[q.id]);
	const last = idx === qs.length - 1;
	return (
		<div
			style={{
				position: "absolute",
				inset: 0,
				display: "flex",
				flexDirection: "column",
				padding: "76px 24px 30px 24px",
			}}
		>
			<div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
				{chapters.map((c, i) => (
					<div key={c.label} style={{ flex: 1 }}>
						<div
							style={{
								height: 3,
								background: i <= currentChapter ? p.accent : p.line,
								borderRadius: 2,
								marginBottom: 6,
								transition: `all 280ms ${easings.calm}`,
							}}
						/>
						<div
							style={{
								fontFamily: t.ui,
								fontSize: 10.5,
								letterSpacing: "0.16em",
								textTransform: "uppercase",
								color: i === currentChapter ? p.accent : p.inkDim,
								fontWeight: 500,
							}}
						>
							{c.label}
						</div>
					</div>
				))}
			</div>
			<div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
				<div
					style={{
						fontFamily: t.editorial,
						fontStyle: "italic",
						fontWeight: 400,
						fontSize: 13,
						color: p.accent,
						marginBottom: 12,
						letterSpacing: "0.01em",
					}}
				>
					{currentChapter === 0
						? "Let’s start with where you are."
						: currentChapter === 1
							? "Now, where you want to be pointed."
							: "And how we hold it lightly."}
				</div>
				<h1
					style={{
						fontFamily: t.display,
						fontWeight: t.displayWeight,
						letterSpacing: t.displayTracking,
						fontStyle: t.editorialItalic ? "italic" : "normal",
						fontSize: 26,
						lineHeight: 1.22,
						color: p.ink,
						margin: "0 0 10px 0",
					}}
				>
					{q.prompt}
				</h1>
				<p
					style={{
						fontFamily: t.ui,
						fontSize: 13.5,
						color: p.inkMid,
						margin: "0 0 24px 0",
						lineHeight: 1.5,
					}}
				>
					{q.sub}
				</p>
				<QInput
					q={q}
					value={answers[q.id]}
					setValue={(v) => setAnswer(q.id, v)}
					p={p}
					t={t}
				/>
			</div>
			<div style={{ display: "flex", gap: 10, marginTop: 16 }}>
				{idx > 0 && (
					<button
						type="button"
						onClick={() => setIdx(idx - 1)}
						style={{
							padding: "14px 20px",
							borderRadius: 999,
							background: "transparent",
							border: `1px solid ${p.lineHi}`,
							color: p.inkMid,
							fontFamily: t.ui,
							fontSize: 13,
							fontWeight: 500,
							cursor: "pointer",
						}}
					>
						Back
					</button>
				)}
				<button
					type="button"
					disabled={!answered}
					onClick={() => (last ? onFinish() : setIdx(idx + 1))}
					style={{
						flex: 1,
						padding: "14px",
						borderRadius: 999,
						background: answered ? p.accent : p.surface,
						color: answered ? p.accentInk : p.inkDim,
						border: "none",
						cursor: answered ? "pointer" : "not-allowed",
						fontFamily: t.ui,
						fontSize: 13.5,
						fontWeight: 600,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: 8,
					}}
				>
					{last ? "Begin" : "Continue"}
					<Icon name="arrow" size={15} stroke="currentColor" strokeWidth={2} />
				</button>
			</div>
		</div>
	);
}

export function Onboarding({
	p,
	t,
	tweaks,
	onFinish,
}: {
	p: Palette;
	t: TypePairing;
	tweaks: Tweaks;
	onFinish: () => void;
}) {
	const qs = ONBOARDING_QS;
	const [idx, setIdx] = useState(0);
	const [answers, setAnswers] = useState<Answers>({});
	const setAnswer = (id: string, v: unknown) =>
		setAnswers((a) => ({ ...a, [id]: v }));
	const props = { p, t, qs, idx, setIdx, answers, setAnswer, onFinish };
	if (tweaks.onboardingStyle === "conversational")
		return <ConversationalView {...props} />;
	if (tweaks.onboardingStyle === "guided") return <GuidedView {...props} />;
	return <OneQView {...props} />;
}
