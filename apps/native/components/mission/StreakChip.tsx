// Compact rhythm chip beside the greeting: flame + "6-day rhythm".
// White pill, 1px line border — gold lives only on the icon so the chip
// reads as a fact, not a demand.

import { Icon } from "@north/native-ui";
import { getNorthTokens } from "@north/tokens";
import { StyleSheet, Text, View } from "react-native";

export function StreakChip({ count }: { count: number }) {
	const { p, t } = getNorthTokens();
	const label = count > 0 ? `${count}-day rhythm` : "Start your rhythm today";

	return (
		<View
			style={[styles.chip, { backgroundColor: p.surface, borderColor: p.line }]}
			accessibilityRole="text"
			accessibilityLabel={label}
		>
			<Icon
				name="streak"
				size={13}
				color={count > 0 ? p.goldInk : p.inkDim}
				strokeWidth={1.8}
			/>
			<Text style={[styles.label, { color: p.inkMid, fontFamily: t.ui }]}>
				{label}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	chip: {
		flexDirection: "row",
		alignItems: "center",
		alignSelf: "flex-start",
		gap: 6,
		borderWidth: 1,
		borderRadius: 999,
		paddingHorizontal: 10,
		paddingVertical: 5,
	},
	label: { fontSize: 12, fontWeight: "600" },
});
