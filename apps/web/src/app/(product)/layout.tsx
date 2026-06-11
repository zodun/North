import type { Metadata, Viewport } from "next";
import { ProductShell } from "@/components/product/product-shell";

export const metadata: Metadata = {
	title: { template: "%s — North", default: "North" },
};

export const viewport: Viewport = {
	themeColor: "#05050E",
	width: "device-width",
	initialScale: 1,
	// Pinch-zoom intentionally left enabled (WCAG 1.4.4 / 1.4.10) — no
	// maximumScale or userScalable lock.
	viewportFit: "cover",
};

export default function ProductLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <ProductShell>{children}</ProductShell>;
}
