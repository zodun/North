import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";

import "../index.css";
import { DevSwCleanup } from "@/components/dev-sw-cleanup";
import { InstallPrompt } from "@/components/install-prompt";
import Providers from "@/components/providers";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
	variable: "--font-jakarta",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
	title: "North",
	description: "Convert inspiration into consistent, aligned action.",
	applicationName: "North",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "North",
	},
	formatDetection: {
		telephone: false,
	},
	icons: {
		// SVG North compass mark — modern browsers render it in the tab at any
		// size. (The raster PNG variants are regenerated from this SVG; until
		// then only the SVG is referenced so no stale icon shows.)
		icon: [{ url: "/favicon/favicon.svg?v=2", type: "image/svg+xml" }],
		// Without this link iOS "Add to Home Screen" falls back to a screenshot.
		apple: "/favicon/apple-touch-icon.png",
	},
	other: {
		"mobile-web-app-capable": "yes",
	},
};

// Soft Sky default for every route (login, onboarding, north). The (product)
// layout re-exports the same themeColor; this keeps non-product routes off the
// manifest's black fallback. Pinch-zoom stays enabled (WCAG 1.4.4 / 1.4.10).
export const viewport: Viewport = {
	themeColor: "#EDF1F8",
	width: "device-width",
	initialScale: 1,
	viewportFit: "cover",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} ${plusJakarta.variable} antialiased`}
			>
				<Providers>
					<DevSwCleanup />
					<div className="h-svh">{children}</div>
					<InstallPrompt />
				</Providers>
			</body>
		</html>
	);
}
