// ProgressBar primitive (DEC-23). Used by InputBreakdown for per-input ratios
// in the signal score view, and by onboarding's QuestionShell for step progress.
//
// The fill animates rather than jumping. On a progress bar the *change* is the
// information — a bar that teleports tells you where you are, a bar that moves
// tells you that you advanced, which is the entire point of showing it during
// onboarding.

import type { Palette } from "@north/tokens";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { useAnimatedProgress } from "../motion";

export type ProgressBarProps = {
	p: Palette;
	value: number; // 0..1
	height?: number;
	color?: string;
	/** Opt out for bars rendered in a list, where 20 animating fills is noise. */
	animated?: boolean;
};

export function ProgressBar({
	p,
	value,
	height = 4,
	color,
	animated = true,
}: ProgressBarProps) {
	const clamped = Math.max(0, Math.min(1, value));
	const progress = useAnimatedProgress(clamped);

	const animatedStyle = useAnimatedStyle(() => ({
		width: `${progress.value * 100}%`,
	}));

	return (
		<View
			accessibilityRole="progressbar"
			accessibilityValue={{ now: Math.round(clamped * 100), min: 0, max: 100 }}
			style={[styles.track, { backgroundColor: p.line, height }]}
		>
			{animated ? (
				<Animated.View
					style={[
						styles.fill,
						{ backgroundColor: color ?? p.accent },
						animatedStyle,
					]}
				/>
			) : (
				<View
					style={[
						styles.fill,
						{ backgroundColor: color ?? p.accent, width: `${clamped * 100}%` },
					]}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	track: { borderRadius: 2, overflow: "hidden" },
	fill: { height: "100%", borderRadius: 2 },
});
