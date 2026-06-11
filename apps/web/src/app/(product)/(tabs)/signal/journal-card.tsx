"use client";

import { useEffect, useRef, useState } from "react";
import { CtaButton, colors } from "@/components/product/north-ui";
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

const TEAL = colors.teal;
const RED = "rgba(245,100,100,0.85)";

function Triangle({ up, color }: { up: boolean; color: string }) {
	return (
		<svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
			<path d={up ? "M5 1l4 7H1z" : "M5 9L1 2h8z"} fill={color} />
		</svg>
	);
}

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
		<div className="mb-2 rounded-[14px] border border-white/[0.07] bg-white/[0.03] p-[14px] font-jakarta">
			<p className="mb-1 font-bold text-[13px] text-white">Journal</p>
			<p className="mb-3 text-[11px] text-white/35 leading-relaxed">
				Type or talk through your day — we'll surface the signal and the noise.
			</p>

			{analysis && (
				<div className="mb-3 flex flex-col gap-3">
					<ObsList label="Signal" color={TEAL} items={analysis.signal} up />
					{analysis.noise.length > 0 && (
						<ObsList label="Noise" color={RED} items={analysis.noise} />
					)}
					{analysis.read && (
						<p className="text-[12px] text-white/55 italic leading-relaxed">
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
						listening ? "Listening…" : "What pulled your attention today?"
					}
					maxLength={1000}
					rows={3}
					className="w-full resize-none rounded-[10px] border border-white/9 bg-white/5 px-3 py-2.5 pr-11 text-[13px] text-white outline-none transition-colors placeholder:text-white/22 focus:border-[#3ECFBF] motion-reduce:transition-none"
				/>
				{voiceSupported && (
					<button
						type="button"
						onClick={toggleVoice}
						aria-label={listening ? "Stop recording" : "Record voice"}
						aria-pressed={listening}
						className="absolute top-2.5 right-2.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border transition-colors duration-200 motion-reduce:transition-none"
						style={{
							borderColor: listening ? `${RED}66` : "rgba(255,255,255,0.15)",
							backgroundColor: listening ? `${RED}1f` : "transparent",
						}}
					>
						<svg
							width="15"
							height="15"
							viewBox="0 0 24 24"
							fill="none"
							stroke={listening ? RED : "rgba(255,255,255,0.55)"}
							strokeWidth={2}
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
							<path d="M19 10v2a7 7 0 0 1-14 0v-2" />
							<line x1="12" y1="19" x2="12" y2="23" />
						</svg>
					</button>
				)}
			</div>

			<CtaButton
				className="mt-2.5"
				onClick={() => void submit()}
				disabled={!text.trim() || submitting}
			>
				{submitting ? "Reading the day…" : "Find the signal"}
			</CtaButton>
		</div>
	);
}

function ObsList({
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
				<Triangle up={Boolean(up)} color={color} />
				<span
					className="font-bold text-[9px] uppercase tracking-[0.12em]"
					style={{ color }}
				>
					{label}
				</span>
			</div>
			<ul className="flex flex-col gap-1">
				{items.map((item) => (
					<li
						key={item}
						className="flex items-start gap-2 text-[12px] text-white/70 leading-snug"
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
