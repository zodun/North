// Onboarding Stack. On mount, the resume logic redirects the user to
// the first incomplete screen so a kill/relaunch (ONB-04) lands them
// where they left off. The Stack itself has no header — each screen's
// QuestionShell owns its progress affordance.

import { Redirect, Stack } from "expo-router";

import {
	firstIncompleteIndex,
	useOnboardingState,
} from "@/lib/onboarding/use-onboarding-state";
import { useOnboardingStatus } from "@/lib/onboarding/use-onboarding-status";

const ROUTES = [
	"/onboarding/1-name",
	"/onboarding/2-season",
	"/onboarding/3-focus",
	"/onboarding/4-career",
	"/onboarding/5-location",
	"/onboarding/6-time",
	"/onboarding/7-avoid",
	"/onboarding/8-purpose",
	"/onboarding/9-baseline",
	"/onboarding/10-consent",
] as const;

export default function OnboardingLayout() {
	const status = useOnboardingStatus();
	const { answers, loaded } = useOnboardingState();

	// If the user lands on /onboarding directly but isn't signed in
	// or has already finished, bounce them back to the drawer.
	if (status === "unauthenticated" || status === "complete") {
		return <Redirect href="/(drawer)" />;
	}

	// Resume to the first incomplete question on first mount. Subsequent
	// in-flow navigation is driven by router.push() inside each screen,
	// so this only fires once per cold start.
	if (loaded) {
		const idx = firstIncompleteIndex(answers);
		const target = ROUTES[idx] ?? ROUTES[0];
		// Only redirect if we're at the root /onboarding (no slug). Once a
		// specific screen is mounted, leave navigation alone.
		// expo-router's <Redirect> inside a layout fires once per mount.
		// We rely on initialRouteName so this only matters on cold start.
		return (
			<Stack
				screenOptions={{ headerShown: false, animation: "slide_from_right" }}
				initialRouteName={target.replace("/onboarding/", "")}
			>
				<Stack.Screen name="1-name" />
				<Stack.Screen name="2-season" />
				<Stack.Screen name="3-focus" />
				<Stack.Screen name="4-career" />
				<Stack.Screen name="5-location" />
				<Stack.Screen name="6-time" />
				<Stack.Screen name="7-avoid" />
				<Stack.Screen name="8-purpose" />
				<Stack.Screen name="9-baseline" />
				<Stack.Screen name="10-consent" />
			</Stack>
		);
	}

	return (
		<Stack
			screenOptions={{ headerShown: false, animation: "slide_from_right" }}
		>
			<Stack.Screen name="1-name" />
			<Stack.Screen name="2-season" />
			<Stack.Screen name="3-focus" />
			<Stack.Screen name="4-career" />
			<Stack.Screen name="5-location" />
			<Stack.Screen name="6-time" />
			<Stack.Screen name="7-avoid" />
			<Stack.Screen name="8-purpose" />
			<Stack.Screen name="9-baseline" />
			<Stack.Screen name="10-consent" />
		</Stack>
	);
}
