import type { Metadata, Viewport } from "next";
import { TabBar } from "@/components/product/tab-bar";

export const metadata: Metadata = {
	title: { template: "%s — North", default: "North" },
};

export const viewport: Viewport = {
	themeColor: "#0a0a0a",
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	viewportFit: "cover",
};

export default function ProductLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="relative flex h-svh flex-col overflow-hidden bg-[#0a0a0a] text-white">
			<main className="flex-1 overflow-y-auto pb-20">{children}</main>
			<TabBar />
		</div>
	);
}
