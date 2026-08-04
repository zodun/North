// Push notification registration + inbound handling (DEC-21).
//
// Uses Notifications.getDevicePushTokenAsync() — the *bare FCM/APNs*
// token, not the Expo Push Service proxy token. Operating doc §8.1
// commits to FCM specifically; bare tokens give direct delivery.
//
// Registration happens once per signed-in session. The hook UPSERTs
// into public.push_tokens (RLS: own-rows write). The send side is the
// send-notifications Edge Function (morning/evening mission reminders);
// useNotificationRouting handles the receive side — a tapped reminder
// lands on the Mission tab (or the route named in the payload's
// `data.route`, so future sends can deep-link without a client update).

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { type Href, router } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";

import { supabase, useSession } from "./auth-client";

Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowBanner: true,
		shouldShowList: true,
		shouldPlaySound: false,
		shouldSetBadge: false,
	}),
});

export type RegisterResult = {
	token: string;
	platform: "ios" | "android";
};

export async function registerForPushNotificationsAsync(): Promise<RegisterResult | null> {
	if (!Device.isDevice) return null; // emulators / simulators have no real token

	// expo-notifications@56 imports PermissionResponse from expo but root expo is v54 (no export),
	// so cast through unknown to access runtime properties.
	type Perm = { status: string };
	const existing =
		(await Notifications.getPermissionsAsync()) as unknown as Perm;
	let permStatus = existing.status;
	if (permStatus !== "granted") {
		const ask =
			(await Notifications.requestPermissionsAsync()) as unknown as Perm;
		permStatus = ask.status;
	}
	if (permStatus !== "granted") return null;

	if (Platform.OS === "android") {
		await Notifications.setNotificationChannelAsync("default", {
			name: "default",
			importance: Notifications.AndroidImportance.DEFAULT,
		});
	}

	const tokenResult = await Notifications.getDevicePushTokenAsync();
	if (Platform.OS !== "ios" && Platform.OS !== "android") return null;
	return { token: tokenResult.data, platform: Platform.OS };
}

/**
 * Hook · register the device's push token once per signed-in session
 * and UPSERT into public.push_tokens. Idempotent: the table key is
 * `(user_id)` so re-registering simply refreshes `updated_at` and the
 * latest token (e.g., if the OS rotated it).
 */
export function useRegisterPushToken() {
	const { data: session } = useSession();
	const userId = session?.user.id;

	useEffect(() => {
		if (!userId) return;
		let cancelled = false;
		(async () => {
			const result = await registerForPushNotificationsAsync();
			if (cancelled || !result) return;
			const { error } = await supabase.from("push_tokens").upsert(
				{
					user_id: userId,
					token: result.token,
					platform: result.platform,
					updated_at: new Date().toISOString(),
				},
				{ onConflict: "user_id" },
			);
			if (error && __DEV__) {
				console.warn("[notifications] upsert failed:", error.message);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [userId]);
}

/** In-app route for a tapped notification: payload `data.route` or Mission. */
function routeFor(response: Notifications.NotificationResponse): Href {
	const data = response.notification.request.content.data as
		| Record<string, unknown>
		| undefined;
	const route = typeof data?.route === "string" ? data.route : null;
	// Server-sent routes aren't statically known, so widen past typed routes.
	return route?.startsWith("/") ? (route as Href) : "/(drawer)/(tabs)/mission";
}

/**
 * Hook · route notification taps. Covers both the warm path (a tap while
 * the app is running or backgrounded) and the cold path (the app was
 * launched by the tap). The reminders are about today's step, so the
 * default destination is the Mission tab.
 */
export function useNotificationRouting() {
	useEffect(() => {
		// expo-notifications has no tap-response APIs on web (the PWA handles
		// its own notification clicks at the service-worker layer).
		if (Platform.OS === "web") return;
		let cancelled = false;

		void Notifications.getLastNotificationResponseAsync().then((response) => {
			if (!cancelled && response) router.push(routeFor(response));
		});

		const sub = Notifications.addNotificationResponseReceivedListener(
			(response) => router.push(routeFor(response)),
		);
		return () => {
			cancelled = true;
			sub.remove();
		};
	}, []);
}
