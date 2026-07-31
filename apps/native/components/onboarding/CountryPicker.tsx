// Searchable country picker. Filters the full COUNTRIES list as the user
// types; shows up to 6 results in a scroll view below the input.

import { Input } from "@north/native-ui";
import { getNorthTokens } from "@north/tokens";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { COUNTRIES } from "@/lib/onboarding/personalization-options";

export type CountryPickerProps = {
	value: string | null;
	onChange: (country: string) => void;
};

export function CountryPicker({ value, onChange }: CountryPickerProps) {
	const { p, t } = getNorthTokens();
	const [query, setQuery] = useState(value ?? "");
	const [open, setOpen] = useState(!value);

	const filtered =
		query.length >= 1
			? COUNTRIES.filter((c) =>
					c.toLowerCase().startsWith(query.toLowerCase()),
				).slice(0, 6)
			: [];

	function select(country: string) {
		setQuery(country);
		onChange(country);
		setOpen(false);
	}

	return (
		<View style={styles.wrap}>
			<Input
				p={p}
				t={t}
				value={query}
				onChangeText={(text) => {
					setQuery(text);
					setOpen(true);
					if (value && text !== value) onChange("");
				}}
				placeholder="Search your country"
				autoCapitalize="words"
				returnKeyType="done"
			/>
			{open && filtered.length > 0 && (
				<ScrollView
					style={[
						styles.dropdown,
						{ backgroundColor: p.surface, borderColor: p.lineHi },
					]}
					keyboardShouldPersistTaps="handled"
					nestedScrollEnabled
				>
					{filtered.map((country) => (
						<Pressable
							key={country}
							onPress={() => select(country)}
							style={({ pressed }) => [
								styles.row,
								{
									borderBottomColor: p.lineHi,
									backgroundColor: pressed ? p.accentSoft : "transparent",
								},
							]}
						>
							<Text style={{ color: p.ink, fontFamily: t.ui, fontSize: 15 }}>
								{country}
							</Text>
						</Pressable>
					))}
				</ScrollView>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: { gap: 8 },
	dropdown: {
		maxHeight: 220,
		borderRadius: 14,
		borderWidth: 1,
	},
	row: {
		paddingHorizontal: 16,
		paddingVertical: 14,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
});
