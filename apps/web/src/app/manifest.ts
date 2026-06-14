import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "North: Find Your Direction",
		short_name: "North",
		description: "Convert inspiration into consistent, aligned action.",
		start_url: "/",
		display: "standalone",
		orientation: "portrait",
		background_color: "#0a0a0a",
		theme_color: "#0a0a0a",
		categories: ["lifestyle", "education", "productivity"],
		icons: [
			{
				src: "/favicon/web-app-manifest-192x192.png",
				sizes: "192x192",
				type: "image/png",
				purpose: "any",
			},
			{
				src: "/favicon/web-app-manifest-512x512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "any",
			},
			{
				src: "/favicon/web-app-manifest-512x512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable",
			},
		],
	};
}
