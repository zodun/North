// Ergonomic single-import surface for @north/native-ui (DEC-23 + DEC-25).
// `import { Button, Card, BandHero, … } from "@north/native-ui"`.

export {
	Button,
	type ButtonProps,
	MIN_TOUCH_TARGET,
} from "./components/Button";
export { Card, type CardProps } from "./components/Card";
export { Icon, type IconName, type IconProps } from "./components/Icon";
export { Input, type InputProps } from "./components/Input";
export { ProgressBar, type ProgressBarProps } from "./components/ProgressBar";
export {
	ProgressRing,
	type ProgressRingProps,
} from "./components/ProgressRing";
export {
	ScaleSelector,
	type ScaleSelectorProps,
} from "./components/ScaleSelector";
export {
	BandHero,
	type BandHeroProps,
	type BandLabel,
} from "./components/signal/BandHero";
export {
	Compass,
	type CompassBand,
	type CompassProps,
} from "./components/signal/Compass";
export {
	ConsistencyGrid,
	type ConsistencyGridProps,
} from "./components/signal/ConsistencyGrid";
export {
	type BreakdownItem,
	InputBreakdown,
	type InputBreakdownProps,
} from "./components/signal/InputBreakdown";
export {
	RhythmStreakCard,
	type RhythmStreakCardProps,
	type StreakState,
} from "./components/signal/RhythmStreakCard";
export { Sparkline, type SparklineProps } from "./components/signal/Sparkline";
export {
	WeeklyPulse,
	type WeeklyPulseProps,
} from "./components/signal/WeeklyPulse";
export { useReducedMotion } from "./hooks/useReducedMotion";
export {
	MOTION,
	Rise,
	type RiseProps,
	staggerDelay,
	useAnimatedProgress,
	usePressFeedback,
} from "./motion";
