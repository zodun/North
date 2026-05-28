// BandHero — week's signal band + trend arrow (DEC-23).
// Port of apps/web/src/app/north/_components/signal.tsx#BandHero.
// Band colour is taken from the palette's bandDrift / bandFind /
// bandAlign slots; trend = climbing | easing | holding from delta.

import type { Palette, TypePairing } from "@north/tokens";
import { StyleSheet, Text, View } from "react-native";

import { Icon, type IconName } from "../Icon";

export type BandLabel = "Drifting" | "Finding" | "Aligned";

export type BandHeroProps = {
	p: Palette;
	t: TypePairing;
	band: BandLabel;
	score: number;
	prev: number;
	big?: boolean;
};

function bandColor(p: Palette, band: BandLabel): string {
	if (band === "Drifting") return p.bandDrift;
	if (band === "Finding") return p.bandFind;
	return p.bandAlign;
}

function bandBody(band: BandLabel): string {
	if (band === "Drifting") {
		return "You're showing up, just not toward what you said matters. No alarm — drift is part of finding direction.";
	}
	if (band === "Finding") {
		return "You're moving toward what matters more often than not. Coherence is the slowest of the three to climb.";
	}
	return "You're acting on what you said matters. Hold the rhythm; the score will deepen.";
}

export function BandHero({
	p,
	t,
	band,
	score,
	prev,
	big = false,
}: BandHeroProps) {
	const delta = score - prev;
	const arrow: IconName =
		delta > 2 ? "arrowUp" : delta < -2 ? "arrowDown" : "flat";
	const arrowLabel = delta > 2 ? "climbing" : delta < -2 ? "easing" : "holding";
	const color = bandColor(p, band);

	return (
		<View style={styles.wrap}>
			<Text style={[styles.eyebrow, { color: p.inkDim, fontFamily: t.ui }]}>
				THIS WEEK'S SIGNAL
			</Text>
			<View style={styles.row}>
				<Text
					style={[
						styles.band,
						{
							color,
							fontFamily: t.display,
							fontWeight: String(t.displayWeight) as "400",
							fontSize: big ? 56 : 44,
							fontStyle: t.editorialItalic ? "italic" : "normal",
						},
					]}
				>
					{band}
				</Text>
				<View style={styles.trend}>
					<Icon name={arrow} size={14} color={p.inkMid} strokeWidth={1.8} />
					<Text
						style={[styles.trendLabel, { color: p.inkMid, fontFamily: t.ui }]}
					>
						{arrowLabel}
					</Text>
				</View>
			</View>
			<Text style={[styles.body, { color: p.inkMid, fontFamily: t.ui }]}>
				{bandBody(band)}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: { gap: 12 },
	eyebrow: { fontSize: 11, fontWeight: "500", letterSpacing: 2 },
	row: { flexDirection: "row", alignItems: "baseline", gap: 14 },
	band: { lineHeight: 56 },
	trend: { flexDirection: "row", alignItems: "center", gap: 5 },
	trendLabel: { fontSize: 12, fontWeight: "500" },
	body: { fontSize: 14, lineHeight: 21 },
});
