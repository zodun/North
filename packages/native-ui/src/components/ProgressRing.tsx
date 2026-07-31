// ProgressRing — the circular gauge of the Soft Sky dashboard surfaces.
//
// One hairline track, one meaning-colored arc, content in the middle
// (a score numeral, a percentage). The arc starts at 12 o'clock and
// sweeps clockwise; on arrival it fills once with the signature easing
// and then holds still. No pulse, no shimmer — the number is the news.

import type { Palette } from "@north/tokens";
import { type ReactNode, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
	useAnimatedProps,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { useReducedMotion } from "../hooks/useReducedMotion";
import { MOTION } from "../motion";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type ProgressRingProps = {
	p: Palette;
	/** Progress in [0, 1]. */
	value: number;
	size?: number;
	strokeWidth?: number;
	/** Arc color. Defaults to the gold accent — override per meaning. */
	color?: string;
	/** Track color. Defaults to the hairline. */
	trackColor?: string;
	/** Rendered centered inside the ring. */
	children?: ReactNode;
	accessibilityLabel?: string;
};

export function ProgressRing({
	p,
	value,
	size = 96,
	strokeWidth = 8,
	color,
	trackColor,
	children,
	accessibilityLabel,
}: ProgressRingProps) {
	const reduced = useReducedMotion();
	const clamped = Math.max(0, Math.min(1, value));
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;

	const progress = useSharedValue(reduced ? clamped : 0);

	useEffect(() => {
		progress.value = reduced
			? clamped
			: withTiming(clamped, { duration: MOTION.slow, easing: MOTION.easing });
	}, [clamped, reduced, progress]);

	const arcProps = useAnimatedProps(() => ({
		strokeDashoffset: circumference * (1 - progress.value),
	}));

	return (
		<View
			style={{ width: size, height: size }}
			accessibilityRole="progressbar"
			accessibilityLabel={accessibilityLabel}
			accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
		>
			<Svg
				width={size}
				height={size}
				// Start the sweep at 12 o'clock.
				style={{ transform: [{ rotate: "-90deg" }] }}
			>
				<Circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					stroke={trackColor ?? p.line}
					strokeWidth={strokeWidth}
					fill="none"
				/>
				<AnimatedCircle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					stroke={color ?? p.accent}
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					strokeDasharray={`${circumference} ${circumference}`}
					animatedProps={arcProps}
					fill="none"
				/>
			</Svg>
			{children ? <View style={styles.center}>{children}</View> : null}
		</View>
	);
}

const styles = StyleSheet.create({
	center: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		alignItems: "center",
		justifyContent: "center",
	},
});
