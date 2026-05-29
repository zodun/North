// North wordmark + compass arrow. Used on the welcome screen and as
// a quiet anchor across the auth flow. Kept minimal on purpose — no
// real logo file, just composition of the existing Icon and the
// display typeface.

import { Icon } from "@north/native-ui";
import { getTokens } from "@north/tokens";
import { StyleSheet, Text, View } from "react-native";

export type BrandMarkProps = {
	size?: "lg" | "sm";
};

export function BrandMark({ size = "lg" }: BrandMarkProps) {
	const { p, t } = getTokens("warm", "humanist", "calm");
	const isLg = size === "lg";

	return (
		<View
			style={styles.wrap}
			accessibilityRole="header"
			accessibilityLabel="North"
		>
			<View
				style={[
					styles.mark,
					{
						width: isLg ? 48 : 28,
						height: isLg ? 48 : 28,
						borderColor: p.lineHi,
					},
				]}
			>
				<Icon
					name="arrowUp"
					size={isLg ? 28 : 18}
					color={p.accent}
					strokeWidth={1.75}
				/>
			</View>
			<Text
				style={[
					styles.wordmark,
					{
						color: p.ink,
						fontFamily: t.display,
						fontWeight: String(t.displayWeight) as "400",
						letterSpacing: -0.5,
						fontSize: isLg ? 32 : 20,
					},
				]}
			>
				North
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: { alignItems: "center", gap: 14 },
	mark: {
		borderRadius: 999,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	wordmark: { textAlign: "center" },
});
