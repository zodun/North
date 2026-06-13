import "@north/env/web";
import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
	swSrc: "src/app/sw.ts",
	swDest: "public/sw.js",
});

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	// Same-origin proxy to the local Supabase, so the browser can reach it over
	// HTTPS through a tunnel (e.g. ngrok) without mixed-content/CORS. Set the
	// browser's NEXT_PUBLIC_SUPABASE_URL to `https://<tunnel>/sb` to use it; the
	// server keeps talking to SUPABASE_URL directly. Excluded from proxy.ts
	// middleware. Harmless in normal local dev (nothing calls /sb).
	async rewrites() {
		const sb = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
		return [{ source: "/sb/:path*", destination: `${sb}/:path*` }];
	},
};

// In development the dev server uses Turbopack, which errors if a webpack config
// is present — and Serwist injects one even when "disabled". So in dev we skip
// withSerwist entirely (no webpack config, and crucially NO service worker, so
// the browser always loads fresh code). Production builds get the full PWA.
export default process.env.NODE_ENV === "development"
	? nextConfig
	: withSerwist(nextConfig);
