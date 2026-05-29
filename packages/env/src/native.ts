import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	clientPrefix: "EXPO_PUBLIC_",
	client: {
		EXPO_PUBLIC_SUPABASE_URL: z.url(),
		EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
		EXPO_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
		EXPO_PUBLIC_POSTHOG_HOST: z.url().optional(),
		// Google OAuth per-platform client IDs (DEC-18). Each is created
		// in Google Cloud Console: iOS, Android, web — even native uses
		// the web ID via expo-auth-session's proxy. All optional so the
		// Google button gracefully hides when not configured.
		EXPO_PUBLIC_GOOGLE_OAUTH_IOS_CLIENT_ID: z.string().min(1).optional(),
		EXPO_PUBLIC_GOOGLE_OAUTH_ANDROID_CLIENT_ID: z.string().min(1).optional(),
		EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID: z.string().min(1).optional(),
	},
	// Static dot-access only. Expo/Metro inlines EXPO_PUBLIC_* at build
	// time and defines them on process.env as non-configurable properties;
	// passing process.env directly (or iterating it) collides with
	// Hermes and throws "Property is not configurable" at module init,
	// which then takes down every importer in the route graph.
	runtimeEnv: {
		EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
		EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
		EXPO_PUBLIC_POSTHOG_KEY: process.env.EXPO_PUBLIC_POSTHOG_KEY,
		EXPO_PUBLIC_POSTHOG_HOST: process.env.EXPO_PUBLIC_POSTHOG_HOST,
		EXPO_PUBLIC_GOOGLE_OAUTH_IOS_CLIENT_ID:
			process.env.EXPO_PUBLIC_GOOGLE_OAUTH_IOS_CLIENT_ID,
		EXPO_PUBLIC_GOOGLE_OAUTH_ANDROID_CLIENT_ID:
			process.env.EXPO_PUBLIC_GOOGLE_OAUTH_ANDROID_CLIENT_ID,
		EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID:
			process.env.EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID,
	},
	emptyStringAsUndefined: true,
});
