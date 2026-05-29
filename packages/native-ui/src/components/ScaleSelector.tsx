// ScaleSelector primitive (DEC-23 + DEC-25).
// A horizontal n-point Likert-style row used by the Layer 1 weekly
// pulse during onboarding and the recurring pulse on signal/profile.
// Each option meets the 44pt touch target floor and the row is a
// radiogroup for screen readers.

import type { Palette, TypePairing } from "@north/tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { MIN_TOUCH_TARGET } from "./Button";

export type ScaleSelectorProps = {
	p: Palette;
	t: TypePairing;
	value: number | null;
	onChange: (next: number) => void;
	labels: string[]; // labels.length is the scale length (commonly 5)
	disabled?: boolean;
};

export function ScaleSelector({
	p,
	t,
	value,
	onChange,
	labels,
	disabled = false,
}: ScaleSelectorProps) {
	return (
		<View accessibilityRole="radiogroup" style={styles.row}>
			{labels.map((label, idx) => {
				const optionValue = idx + 1;
				const selected = value === optionValue;
				return (
					<Pressable
						key={label}
						accessibilityRole="radio"
						accessibilityState={{ selected, disabled }}
						accessibilityLabel={label}
						disabled={disabled}
						onPress={() => onChange(optionValue)}
						style={({ pressed }) => [
							styles.option,
							{
								backgroundColor: selected ? p.accent : p.surface,
								borderColor: selected ? p.accent : p.lineHi,
								opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
							},
						]}
					>
						<Text
							style={{
								color: selected ? p.accentInk : p.ink,
								fontFamily: t.ui,
								fontSize: 15,
								fontWeight: "600",
							}}
						>
							{optionValue}
						</Text>
						<Text
							numberOfLines={2}
							style={[
								styles.label,
								{
									color: selected ? p.accentInk : p.inkMid,
									fontFamily: t.ui,
								},
							]}
						>
							{label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	row: { flexDirection: "row", gap: 8 },
	option: {
		flex: 1,
		minHeight: MIN_TOUCH_TARGET + 24,
		paddingVertical: 10,
		paddingHorizontal: 6,
		borderRadius: 12,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: 4,
	},
	label: { fontSize: 11, textAlign: "center" },
});
