import { Instrument_Serif, JetBrains_Mono, Manrope } from "next/font/google";
import type { ReactNode } from "react";

const manrope = Manrope({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-manrope",
	display: "swap",
});

const instrumentSerif = Instrument_Serif({
	subsets: ["latin"],
	weight: ["400"],
	style: ["normal", "italic"],
	variable: "--font-instrument-serif",
	display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	weight: ["400", "500"],
	variable: "--font-jetbrains-mono",
	display: "swap",
});

export const metadata = {
	title: "North · prototype",
};

export default function NorthLayout({ children }: { children: ReactNode }) {
	return (
		<div
			className={`${manrope.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 100,
				background: "#050709",
				fontFamily: "var(--font-manrope), system-ui, sans-serif",
				WebkitFontSmoothing: "antialiased",
				textRendering: "optimizeLegibility",
				overflow: "hidden",
			}}
		>
			{children}
		</div>
	);
}
