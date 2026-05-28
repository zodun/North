import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	clientPrefix: "EXPO_PUBLIC_",
	client: {
		EXPO_PUBLIC_SUPABASE_URL: z.url(),
		EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
		EXPO_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
		EXPO_PUBLIC_POSTHOG_HOST: z.url().optional(),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
