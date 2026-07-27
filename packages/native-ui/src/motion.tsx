// North motion identity (DEC-25 companion).
//
// The product doc names three anti-references that motion has to answer to:
// attention-optimised feeds, gamified-hustle pressure, and the generic
// AI-app skin. Each rules something out —
//
//   feeds        → no autoplay, no parallax, no motion that rewards dwelling
//   hustle       → no bounce, no confetti, no celebratory overshoot
//   AI-app skin  → no blur, no glass, no gradient sweeps
//
// What's left is the useful part: motion that tells you where you are and
// where you're going, then gets out of the way.
//
// ─── The identity ────────────────────────────────────────────────────────
//
//   signature easing   Easing.bezier(0.05, 0.7, 0.1, 1)   MD3 emphasized-
//                      decelerate: quick to leave, unhurried to land. No
//                      overshoot anywhere in this system — overshoot reads
//                      as excitement, and North is not excited.
//
//   durations          quick 140 / standard 300 / slow 520
//                      Entrances use standard or slow; exits are ~40% faster,
//                      because people care about what arrives, not what goes.
//
//   entrance           EVERYTHING RISES. 12px upward drift plus a fade.
//                      Never down, never sideways. The app is called North;
//                      its content moves one direction and that direction
//                      means something. This is the whole vocabulary — if a
//                      new surface needs an entrance, it rises.
//
//   stagger            60ms per item, capped at 4 steps (240ms total). The
//                      cap matters: an uncapped stagger down a long list is
//                      exactly the "engineered for dwell time" feel we're
//                      avoiding.
//
// ─── Reduced motion ──────────────────────────────────────────────────────
//
// Every primitive here collapses to an opacity-only crossfade when the OS
// asks for reduced motion — same duration budget, zero translation. This is
// a requirement in PRODUCT.md, not a nicety, and the audience (mid-range
// Android, variable networks) benefits from the cheaper path anyway.

import { type ReactNode, useEffect } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withTiming,
} from "react-native-reanimated";

import { useReducedMotion } from "./hooks/useReducedMotion";

export const MOTION = {
	/** Press feedback, colour shifts, anything that must feel instant. */
	quick: 140,
	/** The default. Card entrances, state changes, progress advances. */
	standard: 300,
	/** Screen-level arrivals and anything crossing a lot of space. */
	slow: 520,
	/** Exits are faster than entrances — see note above. */
	exit: 180,

	/** Upward drift for an entrance, in px. Deliberately small. */
	rise: 12,

	/** Per-item stagger delay and the hard cap on how many items stagger. */
	stagger: 60,
	maxStaggerSteps: 4,

	/** One curve for ~80% of the system. */
	easing: Easing.bezier(0.05, 0.7, 0.1, 1),
	/** For the rare thing that leaves the screen. */
	easeIn: Easing.bezier(0.3, 0, 1, 1),
} as const;

/**
 * Delay for item `index` in a staggered group, capped so a long list never
 * turns into a performance. Items past the cap all arrive together.
 */
export function staggerDelay(index: number): number {
	return Math.min(index, MOTION.maxStaggerSteps) * MOTION.stagger;
}

export type RiseProps = {
	children: ReactNode;
	/** ms. Use staggerDelay(i) inside a group. */
	delay?: number;
	/** Defaults to `slow` — entrances are the one place worth spending time. */
	duration?: number;
	style?: StyleProp<ViewStyle>;
};

/**
 * The signature entrance: content rises and fades in together.
 *
 * Position and opacity move as one — a fade on its own reads as a page that
 * failed to load, and a slide on its own reads as a carousel. Together they
 * read as arrival.
 */
export function Rise({
	children,
	delay = 0,
	duration = MOTION.slow,
	style,
}: RiseProps) {
	const reduced = useReducedMotion();
	const progress = useSharedValue(0);

	useEffect(() => {
		progress.value = withDelay(
			delay,
			withTiming(1, {
				duration: reduced ? MOTION.standard : duration,
				easing: MOTION.easing,
			}),
		);
	}, [delay, duration, progress, reduced]);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: progress.value,
		transform: [
			{ translateY: reduced ? 0 : (1 - progress.value) * MOTION.rise },
		],
	}));

	return (
		// The cast is load-bearing only because the workspace currently resolves
		// two React Native versions (root pins 0.81.5, apps/native uses 0.85.3),
		// so RN's own ViewStyle is structurally two different types and
		// Reanimated's style prop rejects one of them. Delete the cast once the
		// duplicate is deduped — nothing here actually needs it.
		<Animated.View style={[style, animatedStyle] as never}>
			{children}
		</Animated.View>
	);
}

/**
 * Press feedback for anything tappable.
 *
 * 2% scale and a small opacity drop, no spring and no rebound. A button that
 * bounces back is celebrating being pressed; North's buttons acknowledge it
 * and move on. Returns a style to spread onto an Animated.View, plus the two
 * handlers to wire to a Pressable.
 */
export function usePressFeedback(enabled = true) {
	const pressed = useSharedValue(0);
	const reduced = useReducedMotion();

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: 1 - pressed.value * 0.12,
		transform: [{ scale: 1 - pressed.value * (reduced ? 0 : 0.02) }],
	}));

	const onPressIn = () => {
		if (!enabled) return;
		pressed.value = withTiming(1, {
			duration: MOTION.quick,
			easing: MOTION.easing,
		});
	};

	const onPressOut = () => {
		if (!enabled) return;
		pressed.value = withTiming(0, {
			duration: MOTION.standard,
			easing: MOTION.easing,
		});
	};

	return { animatedStyle, onPressIn, onPressOut };
}

/**
 * Drives a 0..1 shared value toward `value` — for progress bars, score arcs
 * and anything else where the *change* is the information. Reduced motion
 * still animates, just faster: watching a number jump tells you less than
 * watching it move, so we keep the transition and shorten it.
 */
export function useAnimatedProgress(value: number, duration = MOTION.standard) {
	const reduced = useReducedMotion();
	const progress = useSharedValue(value);

	useEffect(() => {
		progress.value = withTiming(value, {
			duration: reduced ? MOTION.quick : duration,
			easing: MOTION.easing,
		});
	}, [value, duration, progress, reduced]);

	return progress;
}
