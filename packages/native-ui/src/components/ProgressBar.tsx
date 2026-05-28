// ProgressBar primitive (DEC-23). Used by InputBreakdown to show
// per-input ratios in the signal score view.

import type { Palette } from "@north/tokens";
import { StyleSheet, View } from "react-native";

export type ProgressBarProps = {
	p: Palette;
	value: number; // 0..1
	height?: number;
	color?: string;
};

export function ProgressBar({ p, value, height = 4, color }: ProgressBarProps) {
	const clamped = Math.max(0, Math.min(1, value));
	return (
		<View
			accessibilityRole="progressbar"
			accessibilityValue={{ now: Math.round(clamped * 100), min: 0, max: 100 }}
			style={[styles.track, { backgroundColor: p.line, height }]}
		>
			<View
				style={[
					styles.fill,
					{ backgroundColor: color ?? p.accent, width: `${clamped * 100}%` },
				]}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	track: { borderRadius: 2, overflow: "hidden" },
	fill: { height: "100%", borderRadius: 2 },
});
