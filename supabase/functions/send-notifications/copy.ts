// NOTIF-01: Notification copy.
//
// All copy is calm and purposeful per DEC-05:
//   - No loss-framing ("your streak will break", "don't miss out")
//   - No urgency language ("hurry", "last chance", "act now")
//   - No gamification ("you're on a roll", "level up")
//   - One sentence max per body, clarity, not persuasion

export type NotificationType = "morning" | "evening";

export type NotificationCopy = {
	title: string;
	body: string;
};

export function getCopy(type: NotificationType): NotificationCopy {
	if (type === "morning") {
		return {
			title: "Today's mission",
			body: "Your three tasks for today are ready.",
		};
	}
	// Evening: sent only to users with 0 tasks done, a gentle presence, not pressure.
	return {
		title: "Still time today",
		body: "Your mission is here when you're ready.",
	};
}

// Per-user digest body. Morning lists today's actual tasks so the reminder is
// about the user's own work, not a generic ping. Falls back to the calm generic
// line when we have no labels. Evening keeps its single gentle sentence, a
// digest there would read as pressure on a day already left unfinished.
export function buildBody(
	type: NotificationType,
	taskLabels: string[],
): string {
	if (type === "evening") return getCopy("evening").body;
	const labels = taskLabels
		.map((l) => l?.trim())
		.filter((l): l is string => Boolean(l));
	if (labels.length === 0) return getCopy("morning").body;
	return labels.map((l) => `• ${l}`).join("\n");
}
