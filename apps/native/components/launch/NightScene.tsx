// The North night scene — the splash design as a reusable surface.
// Sky gradient, fixed starfield, glowing gold compass star, tracked
// wordmark, tagline, mountain ridges. Used by the LaunchScreen overlay
// (with a progress bar in `footer`) and by the welcome screen (with the
// CTAs in `footer`), so the launch hand-off is between two identical
// scenes and reads as one continuous moment.

import { MOTION, Rise, staggerDelay } from "@north/native-ui";
import { getNorthTokens } from "@north/tokens";
import type { ReactNode } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
	Circle,
	Defs,
	LinearGradient,
	Polygon,
	RadialGradient,
	Rect,
	Stop,
} from "react-native-svg";

// Night-scene palette (DESIGN.md night ground). The sky's top edge matches
// the native splash background so the hand-off is invisible.
export const SKY_TOP = "#0D1321";
const SKY_HORIZON = "#16203A";
const RIDGE_BACK = "#0B1120";
const RIDGE_FRONT = "#060A14";
export const NIGHT_INK = "#F0F0F5";
export const NIGHT_MUTED = "rgba(240, 240, 245, 0.55)";
export const GOLD = "#F0B429";

// Fixed starfield — same sky every launch. x/y are fractions of the window;
// the lower third is left to the mountains.
const STARS: Array<[number, number, number, number]> = [
	[0.08, 0.09, 1.1, 0.7],
	[0.18, 0.2, 0.8, 0.45],
	[0.27, 0.06, 1.3, 0.8],
	[0.34, 0.16, 0.7, 0.4],
	[0.45, 0.05, 1.0, 0.6],
	[0.53, 0.13, 0.8, 0.5],
	[0.63, 0.08, 1.2, 0.75],
	[0.72, 0.18, 0.7, 0.4],
	[0.82, 0.06, 1.0, 0.65],
	[0.91, 0.14, 1.2, 0.7],
	[0.05, 0.28, 0.8, 0.5],
	[0.15, 0.36, 1.0, 0.6],
	[0.24, 0.27, 0.7, 0.35],
	[0.38, 0.31, 1.1, 0.65],
	[0.5, 0.24, 0.7, 0.4],
	[0.6, 0.33, 0.9, 0.55],
	[0.7, 0.26, 1.2, 0.7],
	[0.79, 0.35, 0.7, 0.4],
	[0.88, 0.28, 0.9, 0.55],
	[0.96, 0.4, 0.8, 0.45],
	[0.11, 0.47, 0.9, 0.5],
	[0.31, 0.44, 0.7, 0.35],
	[0.44, 0.5, 1.0, 0.55],
	[0.58, 0.45, 0.7, 0.4],
	[0.75, 0.48, 0.9, 0.5],
	[0.9, 0.52, 0.7, 0.35],
];

// An 8-point compass star: long cardinal points, shorter diagonals.
function compassStarPoints(
	cx: number,
	cy: number,
	cardinal: number,
	diagonal: number,
	valley: number,
): string {
	const pts: string[] = [];
	for (let i = 0; i < 16; i++) {
		const angle = (Math.PI / 8) * i - Math.PI / 2;
		const radius = i % 2 === 1 ? valley : i % 4 === 0 ? cardinal : diagonal;
		pts.push(
			`${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`,
		);
	}
	return pts.join(" ");
}

const STAR_POINTS = compassStarPoints(130, 130, 66, 36, 13);

export type NightSceneProps = {
	/** Rendered near the bottom of the scene (progress bar, CTAs, …). */
	footer?: ReactNode;
};

export function NightScene({ footer }: NightSceneProps) {
	const { t } = getNorthTokens();
	const { width, height } = useWindowDimensions();
	const insets = useSafeAreaInsets();

	const ridgeHeight = Math.max(150, height * 0.2);

	return (
		<View style={[styles.scene, { backgroundColor: SKY_TOP }]}>
			{/* Sky + starfield */}
			<Svg width={width} height={height} style={StyleSheet.absoluteFill}>
				<Defs>
					<LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
						<Stop offset="0" stopColor={SKY_TOP} />
						<Stop offset="0.62" stopColor="#111A30" />
						<Stop offset="1" stopColor={SKY_HORIZON} />
					</LinearGradient>
				</Defs>
				<Rect width={width} height={height} fill="url(#sky)" />
				{STARS.map(([x, y, r, o]) => (
					<Circle
						key={`${x}-${y}`}
						cx={x * width}
						cy={y * height}
						r={r}
						fill={NIGHT_INK}
						opacity={o}
					/>
				))}
			</Svg>

			{/* Mountain silhouettes */}
			<View style={[styles.ridges, { height: ridgeHeight + insets.bottom }]}>
				<Svg
					width="100%"
					height="100%"
					viewBox="0 0 375 160"
					preserveAspectRatio="none"
				>
					<Polygon
						points="0,160 0,84 52,44 96,78 148,30 206,86 258,52 310,90 342,68 375,88 375,160"
						fill={RIDGE_BACK}
					/>
					<Polygon
						points="0,160 0,116 64,74 128,112 186,66 248,118 302,84 375,124 375,160"
						fill={RIDGE_FRONT}
					/>
				</Svg>
			</View>

			{/* Star + wordmark, optically centred a touch above the middle */}
			<View style={styles.center}>
				<Rise duration={MOTION.slow}>
					<Svg width={200} height={200} viewBox="0 0 260 260">
						<Defs>
							<RadialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
								<Stop offset="0" stopColor={GOLD} stopOpacity={0.32} />
								<Stop offset="0.55" stopColor={GOLD} stopOpacity={0.1} />
								<Stop offset="1" stopColor={GOLD} stopOpacity={0} />
							</RadialGradient>
						</Defs>
						<Circle cx={130} cy={130} r={130} fill="url(#glow)" />
						<Polygon points={STAR_POINTS} fill={GOLD} />
					</Svg>
				</Rise>
				<Rise delay={staggerDelay(1)} duration={MOTION.slow}>
					<Text
						style={[styles.wordmark, { fontFamily: t.display }]}
						accessibilityRole="header"
					>
						NORTH
					</Text>
				</Rise>
				<Rise delay={staggerDelay(2)} duration={MOTION.slow}>
					<Text style={styles.tagline}>Always point somewhere.</Text>
				</Rise>
			</View>

			{footer ? (
				<Rise
					delay={staggerDelay(3)}
					duration={MOTION.slow}
					style={[styles.footer, { bottom: insets.bottom + 32 }]}
				>
					{footer}
				</Rise>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	scene: {
		flex: 1,
	},
	ridges: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
	},
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		// Lift the group so the star sits above the vertical middle and the
		// footer keeps its own space over the mountains.
		marginBottom: 120,
	},
	wordmark: {
		color: NIGHT_INK,
		fontSize: 30,
		letterSpacing: 10,
		// Tracked text drifts right; nudge back to optical center.
		marginRight: -10,
		marginTop: 6,
		textAlign: "center",
	},
	tagline: {
		color: NIGHT_MUTED,
		fontSize: 14,
		letterSpacing: 0.2,
		marginTop: 14,
		textAlign: "center",
	},
	footer: {
		position: "absolute",
		left: 0,
		right: 0,
		paddingHorizontal: 24,
	},
});
