// (auth) flow stack. Hosts welcome, sign-in, sign-up, forgot-password,
// and verify-email screens. Guards against authenticated users landing
// here by deep link — bounces them to onboarding or the drawer.

import { Redirect, Stack } from "expo-router";

import { useOnboardingStatus } from "@/lib/onboarding/use-onboarding-status";

export default function AuthLayout() {
	const status = useOnboardingStatus();

	if (status === "complete") {
		return <Redirect href="/(drawer)" />;
	}
	if (status === "onboarding") {
		return <Redirect href="/onboarding/1-name" />;
	}

	return (
		<Stack
			screenOptions={{ headerShown: false, animation: "slide_from_right" }}
		>
			<Stack.Screen name="sign-up" options={{ animation: "fade" }} />
			<Stack.Screen name="sign-in" />
			<Stack.Screen name="welcome" />
			<Stack.Screen name="forgot-password" />
			<Stack.Screen name="verify-email" />
		</Stack>
	);
}
