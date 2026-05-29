// Vertical single-select for season (Q2) and time budget (Q4).
// Each option is a 44pt tap target. Uses radiogroup semantics.

import { MIN_TOUCH_TARGET } from "@north/native-ui";
import { getTokens } from "@north/tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type ChoiceSelectorProps = {
	options: string[];
	value: string | null;
	onChange: (next: string) => void;
};

export function ChoiceSelector({
	options,
	value,
	onChange,
}: ChoiceSelectorProps) {
	const { p, t } = getTokens("warm", "humanist", "calm");
	return (
		<View accessibilityRole="radiogroup" style={styles.stack}>
			{options.map((option) => {
				const selected = value === option;
				return (
					<Pressable
						key={option}
						accessibilityRole="radio"
						accessibilityState={{ selected }}
						accessibilityLabel={option}
						onPress={() => onChange(option)}
						style={({ pressed }) => [
							styles.option,
							{
								backgroundColor: selected ? p.accentSoft : p.surface,
								borderColor: selected ? p.accent : p.lineHi,
								opacity: pressed ? 0.85 : 1,
							},
						]}
					>
						<Text
							style={{
								color: p.ink,
								fontFamily: t.ui,
								fontSize: 15,
								fontWeight: selected ? "600" : "400",
								lineHeight: 22,
							}}
						>
							{option}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	stack: { gap: 10 },
	option: {
		minHeight: MIN_TOUCH_TARGET,
		paddingHorizontal: 16,
		paddingVertical: 14,
		borderRadius: 14,
		borderWidth: 1,
	},
});
