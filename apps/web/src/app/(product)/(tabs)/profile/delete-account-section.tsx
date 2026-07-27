"use client";

import { useState } from "react";
import { supabase } from "@/lib/auth-client";

const WARN = "#b3261e";

// Account deletion (App Store Guideline 5.1.1(v): any app that supports
// account creation must offer in-app deletion). Calls the delete-account
// Edge Function, which verifies the caller's own JWT and deletes the
// auth.users row; every user-data table cascades from that FK, so this
// removes everything. Does not cancel an active subscription — the user is
// pointed at the billing portal for that first.
export function DeleteAccountSection({
	hasActiveSubscription,
}: {
	hasActiveSubscription: boolean;
}) {
	const [confirming, setConfirming] = useState(false);
	const [confirmText, setConfirmText] = useState("");
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleDelete() {
		if (confirmText.trim().toUpperCase() !== "DELETE" || deleting) return;
		setDeleting(true);
		setError(null);
		const { error: invokeError } = await supabase.functions.invoke(
			"delete-account",
			{ method: "POST" },
		);
		if (invokeError) {
			setError("Something went wrong. Please try again.");
			setDeleting(false);
			return;
		}
		await supabase.auth.signOut();
		window.location.href = "/login";
	}

	if (!confirming) {
		return (
			<button
				type="button"
				onClick={() => setConfirming(true)}
				className="font-semibold text-xs transition-colors hover:underline"
				style={{ color: WARN, opacity: 0.6 }}
			>
				Delete account
			</button>
		);
	}

	return (
		<div
			className="mx-auto mt-4 max-w-sm rounded-2xl border p-5 text-left"
			style={{ borderColor: `${WARN}33`, background: `${WARN}08` }}
		>
			<p className="mb-2 font-semibold text-sm" style={{ color: WARN }}>
				This permanently deletes your account.
			</p>
			<p className="mb-3 text-xs opacity-70">
				Your profile, missions, journal, signal history, and saved opportunities
				are all erased. This can't be undone.
				{hasActiveSubscription
					? " You have an active subscription — cancel it from the billing portal above first, or it may keep billing after your account is gone."
					: ""}
			</p>
			<label htmlFor="delete-confirm" className="mb-3 block text-xs">
				Type <strong>DELETE</strong> to confirm.
				<input
					id="delete-confirm"
					value={confirmText}
					onChange={(e) => setConfirmText(e.target.value)}
					className="mt-1.5 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
					placeholder="DELETE"
					autoComplete="off"
				/>
			</label>
			{error ? (
				<p className="mb-2 text-xs" style={{ color: WARN }}>
					{error}
				</p>
			) : null}
			<div className="flex gap-2">
				<button
					type="button"
					onClick={() => void handleDelete()}
					disabled={confirmText.trim().toUpperCase() !== "DELETE" || deleting}
					className="rounded-lg px-3 py-2 font-semibold text-white text-xs disabled:opacity-40"
					style={{ background: WARN }}
				>
					{deleting ? "Deleting…" : "Permanently delete"}
				</button>
				<button
					type="button"
					onClick={() => {
						setConfirming(false);
						setConfirmText("");
						setError(null);
					}}
					className="rounded-lg px-3 py-2 font-semibold text-xs opacity-60"
				>
					Cancel
				</button>
			</div>
		</div>
	);
}
