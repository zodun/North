import {
	PlusJakartaSans_700Bold,
	PlusJakartaSans_800ExtraBold,
	useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { env } from "@north/env/native";
import { Stack } from "expo-router";
import { DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { PostHogProvider, usePostHog } from "posthog-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { LaunchScreen } from "@/components/launch/LaunchScreen";
import { NAV_THEME } from "@/lib/constants";

// The OS splash (flat ground + mark) stays up only until the in-app
// LaunchScreen paints its first frame, then the overlay takes over: it
// renders the full night scene and holds until we know whether to land
// the user on (auth), onboarding, or (drawer). Avoids a flash of the
// wrong route on cold start.
SplashScreen.preventAutoHideAsync().catch(() => {
	// noop — splash module may not be available in some test contexts
});

const LIGHT_THEME = {
	...DefaultTheme,
	colors: NAV_THEME.light,
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

export default function RootLayout() {
	const [launched, setLaunched] = useState(false);
	const handleLaunchFinish = useCallback(() => setLaunched(true), []);

	// Brand display face. The splash stays up while these load (they're
	// bundled assets, so this is one frame in practice); on a load error
	// we render anyway — system font is the designed fallback.
	const [fontsLoaded, fontError] = useFonts({
		PlusJakartaSans_700Bold,
		PlusJakartaSans_800ExtraBold,
	});
	if (!fontsLoaded && !fontError) return null;

	// PostHogProvider is a no-op if apiKey is empty; we still render the
	// children so dev without analytics wired works fine.
	return (
		<PostHogProvider
			apiKey={env.EXPO_PUBLIC_POSTHOG_KEY ?? "phc_disabled"}
			options={{
				host: env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
				captureAppLifecycleEvents: true,
				disabled: !env.EXPO_PUBLIC_POSTHOG_KEY,
			}}
			autocapture={false}
		>
			{/* North is daylight by doctrine — one light theme in both schemes.
			    The launch scene is the one night moment, so the status bar
			    stays light until it fades. */}
			<ThemeProvider value={LIGHT_THEME}>
				<StatusBar style={launched ? "dark" : "light"} />
				<GestureHandlerRootView style={styles.container}>
					<AppOpenCapture />
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
					{!launched && <LaunchScreen onFinish={handleLaunchFinish} />}
				</GestureHandlerRootView>
			</ThemeProvider>
		</PostHogProvider>
	);
}
