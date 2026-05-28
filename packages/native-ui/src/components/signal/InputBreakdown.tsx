// InputBreakdown — A/C/K/V input rows under the signal score (DEC-23).
// Port of apps/web/src/app/north/_components/signal.tsx#InputBreakdown.
// Each row = label + weighted ProgressBar + short description.

import type { Palette, TypePairing } from "@north/tokens";
import { StyleSheet, Text, View } from "react-native";

import { ProgressBar } from "../ProgressBar";

export type BreakdownItem = {
	label: string;
	/** Normalised 0..1. */
	value: number;
	/** Weight (e.g., 0.45 for A). Displayed as `weight 0.45`. */
	weight: number;
	desc: string;
};

export type InputBreakdownProps = {
	p: Palette;
	t: TypePairing;
	items: BreakdownItem[];
};

export function InputBreakdown({ p, t, items }: InputBreakdownProps) {
	return (
		<View style={styles.wrap}>
			<Text style={[styles.eyebrow, { color: p.inkDim, fontFamily: t.ui }]}>
				WHAT'S UNDERNEATH
			</Text>
			<View style={styles.col}>
				{items.map((item) => (
					<View key={item.label} style={styles.row}>
						<View style={styles.headerRow}>
							<Text style={[styles.label, { color: p.ink, fontFamily: t.ui }]}>
								{item.label}
							</Text>
							<Text
								style={[styles.weight, { color: p.inkMid, fontFamily: t.mono }]}
							>
								weight {item.weight.toFixed(2)}
							</Text>
						</View>
						<ProgressBar p={p} value={item.value} height={4} />
						<Text style={[styles.desc, { color: p.inkDim, fontFamily: t.ui }]}>
							{item.desc}
						</Text>
					</View>
				))}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: { gap: 12 },
	eyebrow: { fontSize: 11, fontWeight: "500", letterSpacing: 2 },
	col: { gap: 14 },
	row: { gap: 6 },
	headerRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "baseline",
	},
	label: { fontSize: 13, fontWeight: "500" },
	weight: { fontSize: 11 },
	desc: { fontSize: 12 },
});
