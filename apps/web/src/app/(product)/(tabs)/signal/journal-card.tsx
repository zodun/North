"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/auth-client";

export type JournalAnalysis = {
	signal: string[];
	noise: string[];
	read: string;
};

// Minimal shape of the Web Speech API (not in the standard TS DOM lib).
type SpeechResult = { isFinal: boolean; 0: { transcript: string } };
type SpeechEvent = { resultIndex: number; results: ArrayLike<SpeechResult> };
type Recognition = {
	lang: string;
	continuous: boolean;
	interimResults: boolean;
	start: () => void;
	stop: () => void;
	onresult: ((e: SpeechEvent) => void) | null;
	onend: (() => void) | null;
	onerror: (() => void) | null;
};
type RecognitionCtor = new () => Recognition;

function getRecognitionCtor(): RecognitionCtor | null {
	if (typeof window === "undefined") return null;
	const w = window as unknown as {
		SpeechRecognition?: RecognitionCtor;
		webkitSpeechRecognition?: RecognitionCtor;
	};
	return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const SIGNAL = "#4ECCA3";
const NOISE = "#f87171";

export function JournalCard({
	entryDate,
	initialEntry,
}: {
	entryDate: string;
	initialEntry: { body: string; analysis: JournalAnalysis | null } | null;
}) {
	const [text, setText] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [listening, setListening] = useState(false);
	const [analysis, setAnalysis] = useState<JournalAnalysis | null>(
		initialEntry?.analysis ?? null,
	);
	const recognitionRef = useRef<Recognition | null>(null);

	// Resolve on the client only — window.SpeechRecognition isn't available
	// during SSR, and computing it in render would mismatch on hydration.
	const [voiceSupported, setVoiceSupported] = useState(false);
	useEffect(() => {
		setVoiceSupported(getRecognitionCtor() !== null);
	}, []);

	function toggleVoice() {
		if (listening) {
			recognitionRef.current?.stop();
			return;
		}
		const Ctor = getRecognitionCtor();
		if (!Ctor) return;
		const rec = new Ctor();
		rec.lang = "en-US";
		rec.continuous = true;
		rec.interimResults = false;
		rec.onresult = (e) => {
			let chunk = "";
			for (let i = e.resultIndex; i < e.results.length; i++) {
				const r = e.results[i];
				if (r.isFinal) chunk += r[0].transcript;
			}
			const clean = chunk.trim();
			if (clean) setText((prev) => (prev ? `${prev} ${clean}` : clean));
		};
		rec.onend = () => setListening(false);
		rec.onerror = () => setListening(false);
		recognitionRef.current = rec;
		rec.start();
		setListening(true);
	}

	async function submit() {
		const body = text.trim();
		if (!body || submitting) return;
		recognitionRef.current?.stop();
		setSubmitting(true);
		try {
			const { data, error } = await supabase.functions.invoke("reflect", {
				body: { body, entry_date: entryDate },
			});
			if (!error && data?.analysis) {
				setAnalysis(data.analysis as JournalAnalysis);
			}
			setText("");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="rounded-2xl border border-white/8 bg-white/4 p-5">
			<h2 className="mb-1 font-semibold text-[11px] text-white/40 uppercase tracking-widest">
				Journal
			</h2>
			<p className="mb-3 text-[12px] text-white/35">
				Type or talk through your day — we'll surface the signal and the noise.
			</p>

			{analysis && (
				<div className="mb-4 flex flex-col gap-3">
					<SignalNoiseList
						label="Signal"
						color={SIGNAL}
						items={analysis.signal}
						up
					/>
					{analysis.noise.length > 0 && (
						<SignalNoiseList
							label="Noise"
							color={NOISE}
							items={analysis.noise}
						/>
					)}
					{analysis.read && (
						<p className="text-[13px] text-white/60 italic leading-relaxed">
							{analysis.read}
						</p>
					)}
				</div>
			)}

			<div className="relative">
				<textarea
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder={
						listening
							? "Listening…"
							: "What happened today? What pulled at you?"
					}
					maxLength={1000}
					rows={3}
					className="mb-3 w-full rounded-lg border bg-white/5 px-3 py-2.5 pr-11 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1"
					style={{ borderColor: "rgba(255,255,255,0.12)", resize: "none" }}
				/>
				{voiceSupported && (
					<button
						type="button"
						onClick={toggleVoice}
						aria-label={listening ? "Stop recording" : "Record voice"}
						className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full border transition-colors"
						style={{
							borderColor: listening ? `${NOISE}66` : "rgba(255,255,255,0.15)",
							backgroundColor: listening ? `${NOISE}22` : "transparent",
						}}
					>
						<svg
							width="15"
							height="15"
							viewBox="0 0 24 24"
							fill="none"
							stroke={listening ? NOISE : "rgba(255,255,255,0.55)"}
							strokeWidth={2}
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
							className={listening ? "animate-pulse" : ""}
						>
							<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
							<path d="M19 10v2a7 7 0 0 1-14 0v-2" />
							<line x1="12" y1="19" x2="12" y2="23" />
						</svg>
					</button>
				)}
			</div>

			<button
				type="button"
				onClick={() => void submit()}
				disabled={!text.trim() || submitting}
				className="w-full rounded-xl py-2.5 font-semibold text-black text-sm transition-opacity disabled:opacity-40"
				style={{ backgroundColor: "#E8B84B" }}
			>
				{submitting ? "Reading the day…" : "Find the signal"}
			</button>
		</div>
	);
}

function SignalNoiseList({
	label,
	color,
	items,
	up,
}: {
	label: string;
	color: string;
	items: string[];
	up?: boolean;
}) {
	if (items.length === 0) return null;
	return (
		<div>
			<div className="mb-1.5 flex items-center gap-1.5">
				<span className="font-bold text-[11px]" style={{ color }}>
					{up ? "▲" : "▽"}
				</span>
				<span
					className="font-bold text-[10px] uppercase tracking-[0.12em]"
					style={{ color }}
				>
					{label}
				</span>
			</div>
			<ul className="flex flex-col gap-1">
				{items.map((item) => (
					<li
						key={item}
						className="flex items-start gap-2 text-[13px] text-white/70 leading-snug"
					>
						<span
							className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
							style={{ backgroundColor: color }}
						/>
						{item}
					</li>
				))}
			</ul>
		</div>
	);
}
