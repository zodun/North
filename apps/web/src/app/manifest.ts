import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "North: Find Your Direction",
		short_name: "North",
		description: "Convert inspiration into consistent, aligned action.",
		start_url: "/",
		display: "standalone",
		orientation: "portrait",
		// Soft Sky, not the abandoned dark theme. background_color paints the
		// install splash; theme_color tints the Android toolbar, both match the
		// in-app cool-sky base (see the (product) layout viewport) so launching
		// the installed app is a seamless light field, never a black flash.
		background_color: "#EDF1F8",
		theme_color: "#EDF1F8",
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
