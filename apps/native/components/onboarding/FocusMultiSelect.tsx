// Chip-style multi-select for Q3 (focus areas). Caps the selection at
// `max` and prevents toggling additional chips on once the cap is hit.
// Each chip is a 44pt tap target (DEC-25). Selected chips switch to the
// area's hue tint so the existing palette stays calm.

import { MIN_TOUCH_TARGET } from "@north/native-ui";
import { getTokens } from "@north/tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FOCUS_AREAS, FOCUS_AREAS_MAX } from "@/lib/onboarding/questions";

export type FocusMultiSelectProps = {
	value: string[];
	onChange: (next: string[]) => void;
	max?: number;
};

export function FocusMultiSelect({
	value,
	onChange,
	max = FOCUS_AREAS_MAX,
}: FocusMultiSelectProps) {
	const { p, t } = getTokens("warm", "humanist", "calm");
	const atCap = value.length >= max;

	return (
		<View style={styles.wrap}>
			<Text style={[styles.cap, { color: p.inkDim, fontFamily: t.ui }]}>
				{value.length} of {max} selected
			</Text>
			<View style={styles.grid}>
				{FOCUS_AREAS.map((area) => {
					const selected = value.includes(area.id);
					const disabled = !selected && atCap;
					return (
						<Pressable
							key={area.id}
							accessibilityRole="checkbox"
							accessibilityState={{ checked: selected, disabled }}
							accessibilityLabel={area.label}
							disabled={disabled}
							onPress={() => {
								if (selected) {
									onChange(value.filter((id) => id !== area.id));
								} else if (!atCap) {
									onChange([...value, area.id]);
								}
							}}
							style={({ pressed }) => [
								styles.chip,
								{
									backgroundColor: selected ? area.hue : p.surface,
									borderColor: selected ? area.hue : p.lineHi,
									opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
								},
							]}
						>
							<Text
								style={{
									color: selected ? p.accentInk : p.ink,
									fontFamily: t.ui,
									fontSize: 14,
									fontWeight: "600",
								}}
							>
								{area.label}
							</Text>
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: { gap: 12 },
	cap: { fontSize: 12 },
	grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
	chip: {
		minHeight: MIN_TOUCH_TARGET,
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 999,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
});
