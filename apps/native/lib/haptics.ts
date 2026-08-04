// Haptic grammar — quiet by doctrine, like the motion identity.
//
// Two verbs only: `tap` (a light tick for selection — tab changes,
// toggles, chips) and `arrive` (a success notification for an earned
// moment — today's step done, a check-in banked). Anything louder reads
// as gamified-hustle pressure. All calls are fire-and-forget, no-op on
// web, and never throw.

import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export function tap() {
	if (Platform.OS === "web") return;
	void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function arrive() {
	if (Platform.OS === "web") return;
	void Haptics.notificationAsync(
		Haptics.NotificationFeedbackType.Success,
	).catch(() => {});
}
