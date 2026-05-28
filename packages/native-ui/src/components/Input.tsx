// Input primitive (DEC-23). TextInput wrapped in label/error rows.
// Hits 44pt min height to match the Button (DEC-25).

import type { Palette, TypePairing } from "@north/tokens";
import {
	StyleSheet,
	Text,
	TextInput,
	type TextInputProps,
	View,
} from "react-native";

import { MIN_TOUCH_TARGET } from "./Button";

export type InputProps = Omit<TextInputProps, "style"> & {
	p: Palette;
	t: TypePairing;
	label?: string;
	error?: string;
};

export function Input({ p, t, label, error, ...textProps }: InputProps) {
	return (
		<View style={styles.wrap}>
			{label ? (
				<Text style={[styles.label, { color: p.inkMid, fontFamily: t.ui }]}>
					{label}
				</Text>
			) : null}
			<TextInput
				placeholderTextColor={p.inkDim}
				{...textProps}
				style={[
					styles.input,
					{
						color: p.ink,
						borderColor: error ? p.warn : p.lineHi,
						backgroundColor: p.surface,
						fontFamily: t.ui,
					},
				]}
			/>
			{error ? (
				<Text style={[styles.error, { color: p.warn, fontFamily: t.ui }]}>
					{error}
				</Text>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: { gap: 6 },
	label: { fontSize: 12, fontWeight: "500" },
	input: {
		minHeight: MIN_TOUCH_TARGET,
		paddingHorizontal: 14,
		fontSize: 15,
		borderRadius: 12,
		borderWidth: 1,
	},
	error: { fontSize: 12 },
});
