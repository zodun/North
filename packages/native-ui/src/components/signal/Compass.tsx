// Compass — the Signal hero (Soft Sky signature).
//
// A quiet instrument, not a gauge: a hairline ring with four cardinal
// ticks and a two-tone needle that swings to where the week actually
// points. Aligned is true north; Finding is coming around; Drifting has
// swung away. The movement is the information — one slow, signature-eased
// swing on arrival, no wobble, no celebration (per the motion identity:
// North is not excited).

import type { NorthPalette } from "@north/tokens";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { useReducedMotion } from "../../hooks/useReducedMotion";
import { MOTION } from "../../motion";

export type CompassBand = "Drifting" | "Finding" | "Aligned";

// Where the needle rests per band. 0° is true north.
const BAND_ANGLE: Record<CompassBand, number> = {
	Drifting: -56,
	Finding: -22,
	Aligned: 0,
};

export type CompassProps = {
	p: NorthPalette;
	band: CompassBand;
	size?: number;
};

export function Compass({ p, band, size = 116 }: CompassProps) {
	const reduced = useReducedMotion();
	const angle = useSharedValue(reduced ? BAND_ANGLE[band] : -90);

	useEffect(() => {
		angle.value = withTiming(BAND_ANGLE[band], {
			// Reduced motion still moves — the swing is the data — just quicker.
			duration: reduced ? MOTION.quick : MOTION.slow * 2,
			easing: MOTION.easing,
		});
	}, [band, angle, reduced]);

	const needleStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${angle.value}deg` }],
	}));

	const tick = (rotate: string, strong: boolean) => (
		<View
			key={rotate}
			style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}
			pointerEvents="none"
		>
			<View
				style={[
					styles.tick,
					{
						backgroundColor: strong ? p.goldInk : p.line,
						width: strong ? 2 : 1,
					},
				]}
			/>
		</View>
	);

	return (
		<View
			accessibilityRole="image"
			accessibilityLabel={`Compass pointing ${band === "Aligned" ? "north" : band === "Finding" ? "near north" : "away from north"}`}
			style={[
				styles.ring,
				{
					width: size,
					height: size,
					borderRadius: size / 2,
					borderColor: p.line,
					backgroundColor: p.surfaceHi,
				},
			]}
		>
			{tick("0deg", true)}
			{tick("90deg", false)}
			{tick("180deg", false)}
			{tick("270deg", false)}
			<Text style={[styles.north, { color: p.goldInk }]}>N</Text>
			<Animated.View style={[StyleSheet.absoluteFill, needleStyle]}>
				<Svg width="100%" height="100%" viewBox="0 0 100 100">
					{/* North half — gold, the needle. */}
					<Path d="M50 16 L55.5 50 L44.5 50 Z" fill={p.gold} />
					{/* South half — quiet counterweight. */}
					<Path d="M50 84 L55.5 50 L44.5 50 Z" fill={p.line} />
				</Svg>
			</Animated.View>
			<View style={[styles.hub, { backgroundColor: p.ink }]} />
		</View>
	);
}

const styles = StyleSheet.create({
	ring: {
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	tick: {
		position: "absolute",
		top: 5,
		alignSelf: "center",
		height: 7,
		borderRadius: 1,
	},
	north: {
		position: "absolute",
		top: 14,
		alignSelf: "center",
		fontSize: 9,
		fontWeight: "700",
		letterSpacing: 1,
	},
	hub: {
		position: "absolute",
		width: 7,
		height: 7,
		borderRadius: 3.5,
	},
});
