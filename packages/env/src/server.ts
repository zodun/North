import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		// APP_ENV is the environment-identity flag — which Supabase
		// project we're talking to, which content set is canonical.
		// NODE_ENV is the runtime-mode flag (which webpack build, which
		// logging level). Both matter and they aren't the same: a
		// production Next.js build that talks to the dev Supabase has
		// NODE_ENV=production and APP_ENV=development.
		APP_ENV: z.enum(["development", "production"]).default("development"),
		SUPABASE_URL: z.url(),
		SUPABASE_ANON_KEY: z.string().min(1),
		SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
		// OAuth (DEC-18) — populate per environment in Supabase secrets +
		// Vercel/host env. Optional locally so the env validator passes
		// when social isn't wired in for a given developer's loop.
		GOOGLE_OAUTH_CLIENT_ID: z.string().min(1).optional(),
		GOOGLE_OAUTH_CLIENT_SECRET: z.string().min(1).optional(),
		APPLE_OAUTH_CLIENT_ID: z.string().min(1).optional(),
		APPLE_OAUTH_CLIENT_SECRET: z.string().min(1).optional(),
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
