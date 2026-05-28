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
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
