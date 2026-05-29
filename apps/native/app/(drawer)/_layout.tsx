import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Link, Redirect } from "expo-router";
import { Drawer } from "expo-router/drawer";

import { HeaderButton } from "@/components/header-button";
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
			<Drawer.Screen
				name="index"
				options={{
					headerTitle: "Home",
					drawerLabel: "Home",
					drawerIcon: ({ size, color }) => (
						<Ionicons name="home-outline" size={size} color={color} />
					),
				}}
			/>
			<Drawer.Screen
				name="(tabs)"
				options={{
					headerTitle: "Tabs",
					drawerLabel: "Tabs",
					drawerIcon: ({ size, color }) => (
						<MaterialIcons name="border-bottom" size={size} color={color} />
					),
					headerRight: () => (
						<Link href="/modal" asChild>
							<HeaderButton />
						</Link>
					),
				}}
			/>
		</Drawer>
	);
};

export default DrawerLayout;
