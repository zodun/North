// 5-tab nav with the prototype's raised centre Mission (DEC-24).
// Routing is plain expo-router <Tabs>; the visible bar is supplied
// via the `tabBar` prop and rendered by CustomTabBar.

import { Tabs } from "expo-router";

import { CustomTabBar } from "@/components/tab-bar";

export default function TabLayout() {
	return (
		<Tabs
			screenOptions={{ headerShown: false }}
			tabBar={(props) => <CustomTabBar {...props} />}
		>
			<Tabs.Screen name="for-you" options={{ title: "For You" }} />
			<Tabs.Screen name="opportunities" options={{ title: "Opportunities" }} />
			<Tabs.Screen name="mission" options={{ title: "Mission" }} />
			<Tabs.Screen name="signal" options={{ title: "Signal" }} />
			<Tabs.Screen name="profile" options={{ title: "You" }} />
		</Tabs>
	);
}
