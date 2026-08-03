import { Tabs } from "expo-router";

import { CustomTabBar } from "@/components/tab-bar";
import {
	useNotificationRouting,
	useRegisterPushToken,
} from "@/lib/notifications";

// The sheet's five-tab loop: For You · Mission · Opportunities ·
// Journal · Community. Signal and Profile live in the drawer now, and
// the Post action moved onto the For You feed itself.
export default function TabLayout() {
	// Register the device's FCM/APNs push token once per signed-in
	// session (DEC-21). Lives here because the tab loop is the one
	// surface every authenticated user mounts. No-op without a session,
	// on simulators, or when the permission prompt is denied.
	useRegisterPushToken();
	// Route notification taps (reminders land on the Mission tab).
	useNotificationRouting();

	return (
		<Tabs
			tabBar={(props) => <CustomTabBar {...props} />}
			screenOptions={{ headerShown: false }}
		>
			<Tabs.Screen name="for-you" options={{ title: "For You" }} />
			<Tabs.Screen name="mission" options={{ title: "Mission" }} />
			<Tabs.Screen name="opportunities" options={{ title: "Opportunities" }} />
			<Tabs.Screen name="journal" options={{ title: "Journal" }} />
			<Tabs.Screen name="community" options={{ title: "Community" }} />
		</Tabs>
	);
}
