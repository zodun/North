// Local deadline reminders (OPP roadmap: Deadline reminders).
//
// Schedules a local notification 3 days before an opportunity's
// deadline via expo-notifications. Everything is best-effort: missing
// permission, an unparseable deadline, or an environment where local
// scheduling is unavailable (e.g. Expo Go on newer Android) all return
// a quiet hint instead of throwing.

import * as Notifications from "expo-notifications";

import { parseDeadline } from "./filters";
import type { Opportunity } from "./types";

const DAY_MS = 86_400_000;

export type ReminderResult =
	| { id: string; hint?: never }
	| { id: null; hint: string };

/** True when the opportunity has a deadline we can schedule against. */
export function reminderEligible(opp: Opportunity): boolean {
	return parseDeadline(opp.deadline) !== null;
}

// expo-notifications@56 types don't line up with the workspace's expo
// version (see lib/notifications.ts), so permission responses are read
// through a minimal structural type.
type Perm = { status: string };

async function ensurePermission(): Promise<boolean> {
	try {
		const existing =
			(await Notifications.getPermissionsAsync()) as unknown as Perm;
		if (existing.status === "granted") return true;
		const asked =
			(await Notifications.requestPermissionsAsync()) as unknown as Perm;
		return asked.status === "granted";
	} catch {
		return false;
	}
}

export async function scheduleDeadlineReminder(
	opp: Opportunity,
): Promise<ReminderResult> {
	const deadline = parseDeadline(opp.deadline);
	if (!deadline) {
		return { id: null, hint: "No usable deadline on this one." };
	}

	const fireAt = new Date(deadline.getTime() - 3 * DAY_MS);
	fireAt.setHours(9, 0, 0, 0);
	if (fireAt.getTime() <= Date.now()) {
		return {
			id: null,
			hint: "Deadline is under three days away — too late for a reminder.",
		};
	}

	const granted = await ensurePermission();
	if (!granted) {
		return {
			id: null,
			hint: "Turn on notifications for North to get deadline reminders.",
		};
	}

	try {
		const id = await Notifications.scheduleNotificationAsync({
			content: {
				title: "Deadline in 3 days",
				body: `${opp.title} — ${opp.org} closes ${opp.deadline}.`,
			},
			trigger: {
				type: Notifications.SchedulableTriggerInputTypes.DATE,
				date: fireAt,
			},
		});
		return { id };
	} catch {
		return { id: null, hint: "Reminders aren't available in this build." };
	}
}

export async function cancelDeadlineReminder(id: string): Promise<void> {
	try {
		await Notifications.cancelScheduledNotificationAsync(id);
	} catch {
		// Already fired or unavailable — nothing to do.
	}
}
