// The launch overlay. The OS splash can only show a flat colour and a
// centred image, so it stays as the dark ground + mark; this overlay
// renders the real NightScene over it on first frame, holds until the
// router knows where to land, then exits with a fast fade. Because the
// welcome screen renders the same scene, an unauthenticated cold start
// reads as one continuous moment: progress bar fades out, CTAs rise in.

import { MOTION } from "@north/native-ui";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";

import { GOLD, NightScene } from "@/components/launch/NightScene";
import { useOnboardingStatus } from "@/lib/onboarding/use-onboarding-status";

// Hold the scene long enough for the entrance choreography to land
// (~700ms of staggered rises) plus a beat of rest.
const MIN_SHOW_MS = 1200;
// Even if onboarding status hangs, never trap the user on the splash.
const SAFETY_MS = 4000;

export type LaunchScreenProps = {
	/** Called after the exit fade completes — unmount the overlay here. */
	onFinish: () => void;
};

export function LaunchScreen({ onFinish }: LaunchScreenProps) {
	const status = useOnboardingStatus();

	const [minShowDone, setMinShowDone] = useState(false);
	const [safetyDone, setSafetyDone] = useState(false);

	// The scene is on screen after the first frame — drop the native splash
	// behind it. Its background matches the scene's sky, so nothing visibly
	// changes except the mark giving way to the star.
	useEffect(() => {
		void SplashScreen.hideAsync().catch(() => {});
	}, []);

	useEffect(() => {
		const min = setTimeout(() => setMinShowDone(true), MIN_SHOW_MS);
		const safety = setTimeout(() => setSafetyDone(true), SAFETY_MS);
		return () => {
			clearTimeout(min);
			clearTimeout(safety);
		};
	}, []);

	const done = (status !== "loading" && minShowDone) || safetyDone;

	// Progress bar sweeps toward "almost there" while we resolve where to
	// land, and snaps home on exit. It's theatre, but honest theatre — it
	// tracks a real wait.
	const progress = useSharedValue(0);
	useEffect(() => {
		progress.value = withTiming(0.86, {
			duration: MIN_SHOW_MS + 600,
			easing: MOTION.easing,
		});
	}, [progress]);

	const opacity = useSharedValue(1);
	useEffect(() => {
		if (!done) return;
		progress.value = withTiming(1, {
			duration: MOTION.exit,
			easing: MOTION.easing,
		});
		opacity.value = withTiming(0, {
			duration: MOTION.exit,
			easing: MOTION.easeIn,
		});
		const timer = setTimeout(onFinish, MOTION.exit + 40);
		return () => clearTimeout(timer);
	}, [done, onFinish, opacity, progress]);

	const sceneStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
	const fillStyle = useAnimatedStyle(() => ({
		width: `${progress.value * 100}%`,
	}));

	return (
		<Animated.View
			style={[styles.overlay, sceneStyle]}
			pointerEvents={done ? "none" : "auto"}
			accessibilityLabel="North is starting"
		>
			<NightScene
				footer={
					<View style={styles.progressWrap}>
						<View style={styles.progressTrack}>
							<Animated.View style={[styles.progressFill, fillStyle]} />
						</View>
					</View>
				}
			/>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	overlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: 10,
	},
	progressWrap: {
		alignItems: "center",
		paddingBottom: 16,
	},
	progressTrack: {
		width: 140,
		height: 3,
		borderRadius: 1.5,
		backgroundColor: "rgba(240, 240, 245, 0.14)",
		overflow: "hidden",
	},
	progressFill: {
		height: "100%",
		borderRadius: 1.5,
		backgroundColor: GOLD,
	},
});
