// WeeklyPulse — the Layer-1 alignment pulse (DEC-23).
// Port of apps/web/src/app/north/_components/signal.tsx#WeeklyPulse.
// Five Pressables ≥44pt tall per WCAG (DEC-25).

import type { Palette, TypePairing } from "@north/tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { MIN_TOUCH_TARGET } from "../Button";
import { Card } from "../Card";

export type WeeklyPulseProps = {
	p: Palette;
	t: TypePairing;
	value: number | null;
	onChange: (value: number) => void;
	labels?: string[];
	prompt?: string;
};

const DEFAULT_LABELS = [
	"Not at all",
	"A little",
	"Somewhat",
	"Mostly",
	"Fully",
];

export function WeeklyPulse({
	p,
	t,
	value,
	onChange,
	labels = DEFAULT_LABELS,
	prompt = "This week, how much did your time go toward what matters to you?",
}: WeeklyPulseProps) {
	return (
		<Card p={p} padding={20}>
			<Text style={[styles.eyebrow, { color: p.inkDim, fontFamily: t.ui }]}>
				WEEKLY PULSE · 1 TAP
			</Text>
			<Text
				style={[
					styles.prompt,
					{
						color: p.ink,
						fontFamily: t.display,
						fontWeight: String(t.displayWeight) as "400",
						fontStyle: t.editorialItalic ? "italic" : "normal",
					},
				]}
			>
				{prompt}
			</Text>
			<View style={styles.row}>
				{labels.map((label, i) => {
					const active = value === i;
					return (
						<Pressable
							key={label}
							onPress={() => onChange(i)}
							accessibilityRole="radio"
							accessibilityState={{ selected: active }}
							accessibilityLabel={label}
							style={[
								styles.option,
								{
									backgroundColor: active ? p.accent : "transparent",
									borderColor: active ? p.accent : p.lineHi,
								},
							]}
						>
							<Text
								style={[
									styles.label,
									{
										color: active ? p.accentInk : p.inkMid,
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
		</Card>
	);
}

const styles = StyleSheet.create({
	eyebrow: {
		fontSize: 11,
		fontWeight: "500",
		letterSpacing: 2,
		marginBottom: 10,
	},
	prompt: { fontSize: 19, lineHeight: 24, marginBottom: 16 },
	row: { flexDirection: "row", gap: 6 },
	option: {
		flex: 1,
		minHeight: MIN_TOUCH_TARGET,
		paddingVertical: 10,
		borderWidth: 1,
		borderRadius: 10,
		alignItems: "center",
		justifyContent: "center",
	},
	label: {
		fontSize: 11,
		fontWeight: "500",
		textAlign: "center",
		lineHeight: 14,
	},
});
