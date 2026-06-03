// NOTIF-01: Notification copy.
//
// All copy is calm and purposeful per DEC-05:
//   - No loss-framing ("your streak will break", "don't miss out")
//   - No urgency language ("hurry", "last chance", "act now")
//   - No gamification ("you're on a roll", "level up")
//   - One sentence max per body — clarity, not persuasion

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
	// Evening: sent only to users with 0 tasks done — a gentle presence, not pressure.
	return {
		title: "Still time today",
		body: "Your mission is here when you're ready.",
	};
}
