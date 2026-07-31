import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { Drawer } from "expo-router/drawer";

import { NAV_THEME } from "@/lib/constants";
import { useOnboardingStatus } from "@/lib/onboarding/use-onboarding-status";
import { useColorScheme } from "@/lib/use-color-scheme";

const DrawerLayout = () => {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;
	const status = useOnboardingStatus();

	// Routing gates. The (auth) group owns the unauthenticated surface
	// and onboarding owns its in-progress state — bounce out for either.
	if (status === "loading") return null;
	if (status === "unauthenticated") {
		return <Redirect href="/(auth)/welcome" />;
	}
	if (status === "onboarding") {
		return <Redirect href="/onboarding/1-name" />;
	}

	return (
		<Drawer
			screenOptions={{
				headerStyle: {
					backgroundColor: theme.background,
				},
				headerTitleStyle: {
					color: theme.text,
				},
				headerTintColor: theme.text,
				drawerStyle: {
					backgroundColor: theme.background,
				},
				drawerLabelStyle: {
					color: theme.text,
				},
				drawerInactiveTintColor: theme.text,
			}}
		>
			{/* Pass-through route — "/" lands on the tab loop. Never shown. */}
			<Drawer.Screen
				name="index"
				options={{
					headerShown: false,
					drawerItemStyle: { display: "none" },
				}}
			/>
			<Drawer.Screen
				name="(tabs)"
				options={{
					// Tabs own their surface — no stacked chrome above them.
					headerShown: false,
					drawerLabel: "North",
					drawerIcon: ({ size, color }) => (
						<MaterialIcons name="explore" size={size} color={color} />
					),
				}}
			/>
			{/* Signal and Profile moved out of the tab bar in the sheet
			    restructure; the drawer keeps them one swipe away. */}
			<Drawer.Screen
				name="signal"
				options={{
					headerTitle: "Signal",
					drawerLabel: "Signal",
					drawerIcon: ({ size, color }) => (
						<MaterialIcons name="show-chart" size={size} color={color} />
					),
				}}
			/>
			<Drawer.Screen
				name="profile"
				options={{
					headerTitle: "Profile",
					drawerLabel: "Profile",
					drawerIcon: ({ size, color }) => (
						<Ionicons name="person-outline" size={size} color={color} />
					),
				}}
			/>
		</Drawer>
	);
};

export default DrawerLayout;
