// Daily check-in: one question, one quick reply, a short coaching line.
//
// Real mode stores the exchange in `mission_check_ins`, keyed by the day's
// daily step (monthly_mission_steps.id — one check-in per day), and asks
// the existing callout-expand Edge Function for the coaching response,
// best-effort: any failure falls back to a static encouraging line so the
// ritual never breaks.
// Bypass: canned-but-thoughtful lines from fixtures, held in memory.

import { useCallback, useEffect, useState } from "react";

import { supabase, useSession } from "../auth-client";
import { useAuthBypass } from "../dev-bypass";
import { COACH_LINES, getMockCheckIn, setMockCheckIn } from "./fixtures";

export type CheckInReply = "done" | "partly" | "stuck";

export type CheckIn = {
	reply: CheckInReply;
	note: string | null;
	response: string;
};

const FALLBACK_LINES: Record<CheckInReply, string> = {
	done: "Step banked. Small and done beats big and pending — see you tomorrow.",
	partly:
		"Progress counts even when it's partial. Tomorrow starts where you stopped, not from zero.",
	stuck:
		"Stuck days happen. Make tomorrow's step smaller than feels serious — momentum will do the rest.",
};

async function fetchCoachingLine(
	reply: CheckInReply,
	note: string | null,
): Promise<string> {
	const body = note?.trim()
		? `Today's step went "${reply}". Note from the user: ${note.trim()}`
		: `Today's step went "${reply}".`;
	try {
		const { data } = await supabase.functions.invoke("callout-expand", {
			body: { body, label: "check-in" },
		});
		if (data && typeof data.expansion === "string" && data.expansion.trim()) {
			return data.expansion.trim();
		}
	} catch {
		// fall through to static line
	}
	return FALLBACK_LINES[reply];
}

export function useCheckIn(missionId: string | null) {
	const { data: session } = useSession();
	const bypass = useAuthBypass();
	const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);

	// Load any existing check-in for this mission.
	useEffect(() => {
		let cancelled = false;
		async function load() {
			if (!missionId) {
				setLoading(false);
				return;
			}
			if (bypass) {
				setCheckIn(getMockCheckIn(missionId));
				setLoading(false);
				return;
			}
			if (!session) return;
			const { data, error } = await supabase
				.from("mission_check_ins")
				.select("reply, note, coach_response")
				.eq("mission_id", missionId)
				.eq("user_id", session.user.id)
				.maybeSingle();
			if (cancelled) return;
			if (!error && data) {
				setCheckIn({
					reply: data.reply as CheckInReply,
					note: data.note ?? null,
					response:
						data.coach_response ?? FALLBACK_LINES[data.reply as CheckInReply],
				});
			}
			setLoading(false);
		}
		void load();
		return () => {
			cancelled = true;
		};
	}, [missionId, session, bypass]);

	const submit = useCallback(
		async (reply: CheckInReply, note: string) => {
			if (!missionId || submitting) return;
			setSubmitting(true);
			const trimmedNote = note.trim() || null;

			if (bypass) {
				// Small pause so the "Thinking…" state reads honestly in review.
				await new Promise((r) => setTimeout(r, 600));
				const entry = {
					reply,
					note: trimmedNote,
					response: COACH_LINES[reply],
				};
				setMockCheckIn(missionId, entry);
				setCheckIn(entry);
				setSubmitting(false);
				return;
			}
			if (!session) {
				setSubmitting(false);
				return;
			}

			const response = await fetchCoachingLine(reply, trimmedNote);

			// Persist best-effort; the coaching line shows regardless.
			await supabase.from("mission_check_ins").upsert(
				{
					user_id: session.user.id,
					mission_id: missionId,
					reply,
					note: trimmedNote,
					coach_response: response,
				},
				{ onConflict: "user_id,mission_id" },
			);

			setCheckIn({ reply, note: trimmedNote, response });
			setSubmitting(false);
		},
		[missionId, session, bypass, submitting],
	);

	return { checkIn, loading, submitting, submit };
}
