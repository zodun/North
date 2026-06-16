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
	const [decision, setDecision] = useState<
		"publish" | "reject" | "needs_human" | null
	>(null);
	const [verdict, setVerdict] = useState("");
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
		// AI reviews each submission and either publishes it, holds it for a
		// person, or declines it (with a reason). The function records the
		// submission server-side, so the client no longer inserts directly.
		const { data, error: err } = await supabase.functions.invoke(
			"review-opportunity",
			{ body: { ...form } },
		);
		setSubmitting(false);
		if (err || !data?.ok) {
			setError(
				(data?.error as string) ??
					err?.message ??
					"Couldn't submit. Try again.",
			);
			return;
		}
		setDecision(data.decision as "publish" | "reject" | "needs_human");
		setVerdict((data.reason as string) ?? "");
		setDone(true);
		// Accepted or held: close after a beat. Declined: let them read why.
		if (data.decision !== "reject") setTimeout(onClose, 2800);
	}

	const inputCls =
		"w-full rounded-xl border border-[#0E1420]/10 bg-white px-4 py-3 text-[14px] text-[#0E1420] placeholder:text-[#0E1420]/40 focus:outline-none focus:ring-1 focus:ring-[#0A8F7F]/40 focus:border-[#0A8F7F]";
	const labelCls =
		"mb-1 block font-semibold text-[11px] text-[#0E1420]/55 uppercase tracking-widest";

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: backdrop dismiss — keyboard users can press Escape or use the close button
		<div
			className="fixed inset-0 z-50 flex items-end justify-center bg-[#0E1420]/40"
			onClick={onClose}
		>
			{/* biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: inner sheet stops backdrop click from propagating */}
			<div
				className="max-h-[90svh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-[#0E1420]/10 bg-white pb-safe"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="sticky top-0 flex justify-center bg-white pt-3 pb-1">
					<div className="h-1 w-9 rounded-full bg-[#0E1420]/15" />
				</div>
				<div className="sticky top-5 flex items-center justify-between border-[#0E1420]/10 border-b bg-white px-5 py-3">
					<h2 className="font-semibold text-[#0E1420] text-[16px]">
						Submit an opportunity
					</h2>
					<button
						type="button"
						onClick={onClose}
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

				{done ? (
					<div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
						{decision === "reject" ? (
							<>
								<div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ee9800]/15">
									<svg
										width="28"
										height="28"
										viewBox="0 0 24 24"
										fill="none"
										stroke="#ee9800"
										strokeWidth={2.5}
										strokeLinecap="round"
										strokeLinejoin="round"
										aria-hidden="true"
									>
										<path d="M12 8v5M12 16.5h.01M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
									</svg>
								</div>
								<p className="font-semibold text-[#0E1420] text-[18px]">
									This one wasn't added
								</p>
								<p className="max-w-xs text-[#0E1420]/55 text-[13px] leading-relaxed">
									{verdict || "It didn't fit the Opportunities feed."}
								</p>
								<button
									type="button"
									onClick={onClose}
									className="mt-2 rounded-xl border border-[#0E1420]/10 bg-white px-5 py-2.5 font-semibold text-[#0E1420] text-sm"
								>
									Close
								</button>
							</>
						) : (
							<>
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
								<p className="font-semibold text-[#0E1420] text-[18px]">
									{decision === "publish" ? "Published" : "Submitted"}
								</p>
								<p className="max-w-xs text-[#0E1420]/55 text-[13px] leading-relaxed">
									{decision === "publish"
										? "Reviewed and live in Opportunities now."
										: "Thanks. We'll review it and add it to the feed."}
								</p>
							</>
						)}
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
							<p className="mt-1 text-right text-[#0E1420]/45 text-[11px]">
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
						{error && <p className="text-[#DC2626] text-[12px]">{error}</p>}
						<button
							type="submit"
							disabled={
								submitting || !form.title || !form.org || !form.external_url
							}
							className="h-13 w-full rounded-xl bg-[#F5C842] font-bold text-[#05050E] text-[15px] transition-opacity disabled:opacity-40"
						>
							{submitting ? "Submitting…" : "Submit"}
						</button>
					</form>
				)}
			</div>
		</div>
	);
}
