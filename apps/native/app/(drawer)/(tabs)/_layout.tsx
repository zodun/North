import { Tabs } from "expo-router";
import { useState } from "react";

import { VideoUploadSheet } from "@/components/feed/VideoUploadSheet";
import { CustomTabBar } from "@/components/tab-bar";
import { triggerFeedRefresh } from "@/lib/feed/feed-refresh";

export default function TabLayout() {
	const [showSheet, setShowSheet] = useState(false);

	return (
		<>
			<Tabs
				tabBar={(props) => (
					<CustomTabBar {...props} onAdd={() => setShowSheet(true)} />
				)}
				screenOptions={{ headerShown: false }}
			>
				<Tabs.Screen name="for-you" options={{ title: "For You" }} />
				<Tabs.Screen name="signal" options={{ title: "Signal" }} />
				<Tabs.Screen
					name="opportunities"
					options={{ title: "Opportunities" }}
				/>
				<Tabs.Screen name="profile" options={{ title: "Profile" }} />
				<Tabs.Screen name="mission" options={{ href: null }} />
			</Tabs>
			<VideoUploadSheet
				visible={showSheet}
				onClose={() => setShowSheet(false)}
				onPosted={() => {
					setShowSheet(false);
					triggerFeedRefresh();
				}}
			/>
		</>
	);
}
