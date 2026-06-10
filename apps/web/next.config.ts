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
};

export default process.env.NODE_ENV === "development"
	? nextConfig
	: withSerwist(nextConfig);
