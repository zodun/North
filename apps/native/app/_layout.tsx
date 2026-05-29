import { env } from "@north/env/native";
import { Stack } from "expo-router";
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "expo-router/react-navigation";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { PostHogProvider, usePostHog } from "posthog-react-native";
import { useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { NAV_THEME } from "@/lib/constants";
import { useOnboardingStatus } from "@/lib/onboarding/use-onboarding-status";
import { useColorScheme } from "@/lib/use-color-scheme";

// Hold the splash screen until we know whether to land the user on
// (auth), onboarding, or (drawer). Avoids a flash of the wrong route
// on cold start. Safety timeout (`SAFETY_MS`) hides the splash even
// if something hangs upstream.
SplashScreen.preventAutoHideAsync().catch(() => {
	// noop — splash module may not be available in some test contexts
});

const SAFETY_MS = 3000;

const LIGHT_THEME = {
	...DefaultTheme,
	colors: NAV_THEME.light,
};
const DARK_THEME = {
	...DarkTheme,
	colors: NAV_THEME.dark,
};

export const unstable_settings = {
	initialRouteName: "(auth)",
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});

function AppOpenCapture() {
	const posthog = usePostHog();
	const fired = useRef(false);
	useEffect(() => {
		if (fired.current || !posthog) return;
		fired.current = true;
		posthog.capture("app_open", { platform_app: "native" });
	}, [posthog]);
	return null;
}

function SplashController() {
	const status = useOnboardingStatus();
	useEffect(() => {
		if (status !== "loading") {
			void SplashScreen.hideAsync().catch(() => {});
		}
	}, [status]);
	useEffect(() => {
		const timer = setTimeout(() => {
			void SplashScreen.hideAsync().catch(() => {});
		}, SAFETY_MS);
		return () => clearTimeout(timer);
	}, []);
	return null;
}

export default function RootLayout() {
	const { isDarkColorScheme } = useColorScheme();

	// PostHogProvider is a no-op if apiKey is empty; we still render the
	// children so dev without analytics wired works fine.
	return (
		<PostHogProvider
			apiKey={env.EXPO_PUBLIC_POSTHOG_KEY ?? ""}
			options={{
				host: env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
				captureAppLifecycleEvents: true,
				disabled: !env.EXPO_PUBLIC_POSTHOG_KEY,
			}}
			autocapture={false}
		>
			<ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
				<StatusBar style={isDarkColorScheme ? "light" : "dark"} />
				<GestureHandlerRootView style={styles.container}>
					<AppOpenCapture />
					<SplashController />
					<Stack>
						<Stack.Screen name="(auth)" options={{ headerShown: false }} />
						<Stack.Screen name="(drawer)" options={{ headerShown: false }} />
						<Stack.Screen
							name="onboarding"
							options={{ headerShown: false, gestureEnabled: false }}
						/>
						<Stack.Screen
							name="modal"
							options={{ title: "Modal", presentation: "modal" }}
						/>
					</Stack>
				</GestureHandlerRootView>
			</ThemeProvider>
		</PostHogProvider>
	);
}
