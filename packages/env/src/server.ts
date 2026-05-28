import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		SUPABASE_URL: z.url(),
		SUPABASE_ANON_KEY: z.string().min(1),
		SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
		OPENAI_API_KEY: z.string().min(1).optional(),
		SUMMARY_TRIGGER_SECRET: z.string().min(16).optional(),
		CLOUDINARY_URL: z.string().min(1).optional(),
		POSTHOG_API_KEY: z.string().min(1).optional(),
		CORS_ORIGIN: z.url(),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
