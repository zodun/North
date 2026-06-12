import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";

import "../index.css";
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
		statusBarStyle: "black-translucent",
		title: "North",
	},
	formatDetection: {
		telephone: false,
	},
	other: {
		"mobile-web-app-capable": "yes",
	},
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
					<div className="h-svh">{children}</div>
					<InstallPrompt />
				</Providers>
			</body>
		</html>
	);
}
