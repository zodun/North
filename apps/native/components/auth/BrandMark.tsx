// North brand mark + wordmark. Used on the welcome screen and as a
// quiet anchor across the auth flow. The mark is the split-tone
// arrowhead — half ink, half Signal Gold: one needle, two voices.

import { getNorthTokens } from "@north/tokens";
import { Image, StyleSheet, Text, View } from "react-native";

export type BrandMarkProps = {
	size?: "lg" | "sm";
};

export function BrandMark({ size = "lg" }: BrandMarkProps) {
	const { p, t } = getNorthTokens();
	const isLg = size === "lg";

	return (
		<View
			style={styles.wrap}
			accessibilityRole="header"
			accessibilityLabel="North"
		>
			<Image
				source={require("../../assets/images/brand/mark.png")}
				style={{ width: isLg ? 88 : 30, height: isLg ? 88 : 30 }}
				resizeMode="contain"
			/>
			{/* The splash wordmark breathes: tracked-out capitals under the
			    needle, like the mark on a compass card. */}
			<Text
				style={[
					styles.wordmark,
					{
						color: p.ink,
						fontFamily: t.display,
						letterSpacing: isLg ? 10 : -0.5,
						fontSize: isLg ? 28 : 20,
						// Tracked text drifts right; nudge back to optical center.
						marginRight: isLg ? -10 : 0,
					},
				]}
			>
				{isLg ? "NORTH" : "North"}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: { alignItems: "center", gap: 14 },
	wordmark: { textAlign: "center" },
});
