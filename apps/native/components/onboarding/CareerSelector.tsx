// Single-select for career stage. Each row shows the value + a sub-label.
// Semantics mirror ChoiceSelector but with two-line layout.

import { MIN_TOUCH_TARGET } from "@north/native-ui";
import { getTokens } from "@north/tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CAREER_STAGES } from "@/lib/onboarding/personalization-options";

export type CareerSelectorProps = {
	value: string | null;
	onChange: (next: string) => void;
};

export function CareerSelector({ value, onChange }: CareerSelectorProps) {
	const { p, t } = getTokens("warm", "humanist", "calm");
	return (
		<View accessibilityRole="radiogroup" style={styles.stack}>
			{CAREER_STAGES.map((opt) => {
				const selected = value === opt.value;
				return (
					<Pressable
						key={opt.value}
						accessibilityRole="radio"
						accessibilityState={{ selected }}
						accessibilityLabel={opt.value}
						onPress={() => onChange(opt.value)}
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
							}}
						>
							{opt.value}
						</Text>
						<Text
							style={{
								color: p.inkDim,
								fontFamily: t.ui,
								fontSize: 12,
								marginTop: 2,
							}}
						>
							{opt.sub}
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
