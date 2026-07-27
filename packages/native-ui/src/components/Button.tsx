// Button primitive (DEC-23).
// Accent-bg primary / outline / ghost variants; sm + md sizes.
// `md` (default) hits 44pt min height to satisfy WCAG AA touch target
// (DEC-25, enforced as `MIN_TOUCH_TARGET`).

import type { Palette, TypePairing } from "@north/tokens";
import type { ReactNode } from "react";
import {
	ActivityIndicator,
	type GestureResponderEvent,
	Pressable,
	type PressableProps,
	StyleSheet,
	Text,
	View,
} from "react-native";
import Animated from "react-native-reanimated";

import { usePressFeedback } from "../motion";

export const MIN_TOUCH_TARGET = 44;

export type ButtonVariant = "primary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md";

export type ButtonProps = Omit<PressableProps, "children" | "style"> & {
	p: Palette;
	t: TypePairing;
	variant?: ButtonVariant;
	size?: ButtonSize;
	loading?: boolean;
	disabled?: boolean;
	children: ReactNode;
	leftIcon?: ReactNode;
	rightIcon?: ReactNode;
};

export function Button({
	p,
	t,
	variant = "primary",
	size = "md",
	loading = false,
	disabled = false,
	children,
	leftIcon,
	rightIcon,
	...rest
}: ButtonProps) {
	const isInteractive = !loading && !disabled;
	const { animatedStyle, onPressIn, onPressOut } =
		usePressFeedback(isInteractive);
	const minHeight = size === "sm" ? 36 : MIN_TOUCH_TARGET;
	const horizontalPad = size === "sm" ? 14 : 18;
	const fontSize = size === "sm" ? 13 : 15;

	const bg =
		variant === "primary"
			? p.accent
			: variant === "outline"
				? "transparent"
				: "transparent";
	const borderColor = variant === "outline" ? p.lineHi : "transparent";
	const borderWidth = variant === "outline" ? 1 : 0;
	const fg =
		variant === "primary"
			? p.accentInk
			: variant === "outline"
				? p.ink
				: p.inkMid;

	// The scale lives on a wrapper so the Pressable keeps owning layout and the
	// 44pt touch target is unaffected by the transform.
	return (
		<Animated.View style={animatedStyle}>
			<Pressable
				{...rest}
				onPressIn={(event: GestureResponderEvent) => {
					onPressIn();
					rest.onPressIn?.(event);
				}}
				onPressOut={(event: GestureResponderEvent) => {
					onPressOut();
					rest.onPressOut?.(event);
				}}
				disabled={!isInteractive}
				accessibilityRole="button"
				accessibilityState={{ disabled: !isInteractive, busy: loading }}
				style={[
					styles.base,
					{
						minHeight,
						paddingHorizontal: horizontalPad,
						backgroundColor: bg,
						borderColor,
						borderWidth,
						opacity: isInteractive ? 1 : 0.5,
					},
				]}
			>
				{loading ? (
					<ActivityIndicator size="small" color={fg} />
				) : (
					<View style={styles.row}>
						{leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
						<Text
							style={{
								color: fg,
								fontFamily: t.ui,
								fontSize,
								fontWeight: "600",
								letterSpacing: -0.1,
							}}
						>
							{children}
						</Text>
						{rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
					</View>
				)}
			</Pressable>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	base: {
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
	},
	row: { flexDirection: "row", alignItems: "center", gap: 8 },
	icon: { alignItems: "center", justifyContent: "center" },
});
