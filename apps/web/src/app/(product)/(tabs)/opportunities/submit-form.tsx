"use client";

import { useState } from "react";
import { supabase } from "@/lib/auth-client";

const OPP_TYPES = [
	"Job",
	"Internship",
	"Scholarship",
	"Accelerator",
	"Grant",
	"Community",
	"Event",
	"Creator Programme",
];

export function SubmitOpportunityForm({ onClose }: { onClose: () => void }) {
	const [form, setForm] = useState({
		title: "",
		org: "",
		opportunity_type: "",
		location: "",
		deadline: "",
		description: "",
		external_url: "",
	});
	const [submitting, setSubmitting] = useState(false);
	const [done, setDone] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const set =
		(k: keyof typeof form) =>
		(
			e: React.ChangeEvent<
				HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
			>,
		) =>
			setForm((prev) => ({ ...prev, [k]: e.target.value }));

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!form.title || !form.org || !form.external_url) return;
		setError(null);
		setSubmitting(true);
		const {
			data: { user },
		} = await supabase.auth.getUser();
		const { error: err } = await supabase
			.from("opportunity_submissions")
			.insert({
				submitted_by: user?.id ?? null,
				submitter_email: user?.email ?? null,
				title: form.title,
				org: form.org,
				opportunity_type: form.opportunity_type || null,
				location: form.location || null,
				deadline: form.deadline || null,
				description: form.description || null,
				external_url: form.external_url,
			});
		setSubmitting(false);
		if (err) {
			setError(err.message);
			return;
		}
		setDone(true);
		setTimeout(onClose, 2000);
	}

	const inputCls =
		"w-full rounded-xl border border-white/8 bg-white/5 px-4 py-3 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-white/20";
	const labelCls =
		"mb-1 block font-semibold text-[11px] text-white/35 uppercase tracking-widest";

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: backdrop dismiss — keyboard users can press Escape or use the close button
		<div
			className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
			onClick={onClose}
		>
			{/* biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: inner sheet stops backdrop click from propagating */}
			<div
				className="max-h-[90svh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-[#131313] pb-safe"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="sticky top-0 flex justify-center bg-[#131313] pt-3 pb-1">
					<div className="h-1 w-9 rounded-full bg-white/20" />
				</div>
				<div className="sticky top-5 flex items-center justify-between border-white/8 border-b bg-[#131313] px-5 py-3">
					<h2 className="font-semibold text-[16px] text-white">
						Submit an opportunity
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-white/40 hover:text-white"
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

				{done ? (
					<div className="flex flex-col items-center justify-center gap-3 py-12">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#7ec4bb]/15">
							<svg
								width="28"
								height="28"
								viewBox="0 0 24 24"
								fill="none"
								stroke="#7ec4bb"
								strokeWidth={2.5}
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<path d="M20 6L9 17l-5-5" />
							</svg>
						</div>
						<p className="font-semibold text-[18px] text-white">Submitted!</p>
						<p className="text-[13px] text-white/40">
							We'll review it and add it to the feed.
						</p>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
						<div>
							<label htmlFor="sub-title" className={labelCls}>
								Title *
							</label>
							<input
								id="sub-title"
								type="text"
								required
								placeholder="Programme name"
								value={form.title}
								onChange={set("title")}
								className={inputCls}
							/>
						</div>
						<div>
							<label htmlFor="sub-org" className={labelCls}>
								Organisation *
							</label>
							<input
								id="sub-org"
								type="text"
								required
								placeholder="Company or institution"
								value={form.org}
								onChange={set("org")}
								className={inputCls}
							/>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div>
								<label htmlFor="sub-type" className={labelCls}>
									Type
								</label>
								<select
									id="sub-type"
									value={form.opportunity_type}
									onChange={set("opportunity_type")}
									className={inputCls}
								>
									<option value="">Select type</option>
									{OPP_TYPES.map((t) => (
										<option key={t} value={t.toLowerCase().replace(" ", "-")}>
											{t}
										</option>
									))}
								</select>
							</div>
							<div>
								<label htmlFor="sub-location" className={labelCls}>
									Location
								</label>
								<input
									id="sub-location"
									type="text"
									placeholder="e.g. Remote"
									value={form.location}
									onChange={set("location")}
									className={inputCls}
								/>
							</div>
						</div>
						<div>
							<label htmlFor="sub-deadline" className={labelCls}>
								Deadline
							</label>
							<input
								id="sub-deadline"
								type="text"
								placeholder="e.g. March 31, 2026"
								value={form.deadline}
								onChange={set("deadline")}
								className={inputCls}
							/>
						</div>
						<div>
							<label htmlFor="sub-desc" className={labelCls}>
								Description
							</label>
							<textarea
								id="sub-desc"
								placeholder="Brief description of the opportunity…"
								value={form.description}
								onChange={set("description")}
								maxLength={500}
								rows={3}
								className={`${inputCls} resize-none`}
							/>
							<p className="mt-1 text-right text-[11px] text-white/25">
								{form.description.length}/500
							</p>
						</div>
						<div>
							<label htmlFor="sub-url" className={labelCls}>
								Link *
							</label>
							<input
								id="sub-url"
								type="url"
								required
								placeholder="https://..."
								value={form.external_url}
								onChange={set("external_url")}
								className={inputCls}
							/>
						</div>
						{error && <p className="text-[12px] text-red-400">{error}</p>}
						<button
							type="submit"
							disabled={
								submitting || !form.title || !form.org || !form.external_url
							}
							className="h-13 w-full rounded-xl bg-white font-bold text-[15px] text-black transition-opacity disabled:opacity-40"
						>
							{submitting ? "Submitting…" : "Submit"}
						</button>
					</form>
				)}
			</div>
		</div>
	);
}
