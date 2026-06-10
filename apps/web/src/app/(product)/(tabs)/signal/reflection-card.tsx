"use client";

import { useState } from "react";
import { supabase } from "@/lib/auth-client";

type Analysis = { themes: string[]; nudge: string };

export function ReflectionCard({
	weekEnding,
	initialReflection,
}: {
	weekEnding: string;
	initialReflection: { body: string; analysis: Analysis | null } | null;
}) {
	const [text, setText] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [analysis, setAnalysis] = useState<Analysis | null>(
		initialReflection?.analysis ?? null,
	);

	async function submit() {
		const body = text.trim();
		if (!body || submitting) return;
		setSubmitting(true);
		try {
			const { data, error } = await supabase.functions.invoke("reflect", {
				body: { body, week_ending: weekEnding },
			});
			if (!error && data?.analysis) {
				setAnalysis(data.analysis as Analysis);
			}
			setText("");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="rounded-2xl border border-white/8 bg-white/4 p-5">
			<h2 className="mb-3 font-semibold text-[11px] text-white/40 uppercase tracking-widest">
				Carry Forward
			</h2>

			{analysis && (
				<div className="mb-4">
					<div className="mb-2 flex flex-wrap gap-2">
						{analysis.themes.map((theme) => (
							<span
								key={theme}
								className="rounded-full border px-2.5 py-0.5 font-medium text-[11px]"
								style={{
									borderColor: "#E8B84B44",
									backgroundColor: "#E8B84B22",
									color: "#E8B84B",
								}}
							>
								{theme}
							</span>
						))}
					</div>
					<p className="text-[13px] text-white/60 italic leading-relaxed">
						{analysis.nudge}
					</p>
				</div>
			)}

			<textarea
				value={text}
				onChange={(e) => setText(e.target.value)}
				placeholder="What do you want to carry forward this week?"
				maxLength={1000}
				rows={3}
				className="mb-3 w-full rounded-lg border bg-[#E8B84B]/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1"
				style={{ borderColor: "#E8B84B33", resize: "none" }}
			/>
			<button
				type="button"
				onClick={() => void submit()}
				disabled={!text.trim() || submitting}
				className="w-full rounded-xl py-2.5 font-semibold text-black text-sm transition-opacity disabled:opacity-40"
				style={{ backgroundColor: "#E8B84B" }}
			>
				{submitting ? "Reflecting…" : "Reflect"}
			</button>
		</div>
	);
}
