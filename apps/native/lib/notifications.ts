// Push notification registration (DEC-21).
//
// Uses Notifications.getDevicePushTokenAsync() — the *bare FCM/APNs*
// token, not the Expo Push Service proxy token. Operating doc §8.1
// commits to FCM specifically; bare tokens give direct delivery.
//
// Registration happens once per signed-in session. The hook UPSERTs
// into public.push_tokens (RLS: own-rows write). Server-side push send
// is M2/M3 work; this PR only wires the credential collection side.

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
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

	const { status: existing } = await Notifications.getPermissionsAsync();
	let status = existing;
	if (status !== "granted") {
		const ask = await Notifications.requestPermissionsAsync();
		status = ask.status;
	}
	if (status !== "granted") return null;

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
