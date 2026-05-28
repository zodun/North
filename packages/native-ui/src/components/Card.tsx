// Card primitive (DEC-23). Surface bg + token border + 18-radius.
// Optional `accentStripe` renders the 2px focus-hue stripe from the
// prototype's card hero.

import type { Palette } from "@north/tokens";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

export type CardProps = {
	p: Palette;
	padding?: number;
	accentStripe?: boolean;
	accentHue?: string;
	children: ReactNode;
};

export function Card({
	p,
	padding = 18,
	accentStripe = false,
	accentHue,
	children,
}: CardProps) {
	return (
		<View
			style={[
				styles.card,
				{
					backgroundColor: p.surface,
					borderColor: p.line,
					padding,
				},
			]}
		>
			{accentStripe ? (
				<View
					style={[styles.stripe, { backgroundColor: accentHue ?? p.accent }]}
				/>
			) : null}
			{children}
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		borderRadius: 18,
		borderWidth: 1,
		overflow: "hidden",
		position: "relative",
	},
	stripe: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		height: 2,
	},
});
