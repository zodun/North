// Small removable chips shown under the search bar when country /
// deadline / category filters are active.

import { Icon } from "@north/native-ui";
import type { NorthTokens } from "@north/tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { categoryLabel } from "@/lib/opportunities/categories";
import {
	countryLabel,
	deadlineLabel,
	type OpportunityFilters,
} from "@/lib/opportunities/filters";

function RemovableChip({
	label,
	onRemove,
	p,
	t,
}: {
	label: string;
	onRemove: () => void;
	p: NorthTokens["p"];
	t: NorthTokens["t"];
}) {
	return (
		<Pressable
			onPress={onRemove}
			accessibilityRole="button"
			accessibilityLabel={`Remove filter: ${label}`}
			style={({ pressed }) => [
				chips.chip,
				{
					borderColor: p.line,
					backgroundColor: p.surface,
					opacity: pressed ? 0.7 : 1,
				},
			]}
		>
			<Text style={[chips.label, { color: p.inkMid, fontFamily: t.ui }]}>
				{label}
			</Text>
			<Icon name="close" size={11} color={p.inkDim} strokeWidth={2} />
		</Pressable>
	);
}

export function ActiveFilterChips({
	category,
	filters,
	onClearCategory,
	onClearCountry,
	onClearDeadline,
	p,
	t,
}: {
	category: string | null;
	filters: OpportunityFilters;
	onClearCategory: () => void;
	onClearCountry: () => void;
	onClearDeadline: () => void;
	p: NorthTokens["p"];
	t: NorthTokens["t"];
}) {
	const catLabel = categoryLabel(category);
	const cLabel = countryLabel(filters.country);
	const dLabel = deadlineLabel(filters.deadline);
	if (!catLabel && !cLabel && !dLabel) return null;

	return (
		<View style={chips.row}>
			{catLabel ? (
				<RemovableChip
					label={catLabel}
					onRemove={onClearCategory}
					p={p}
					t={t}
				/>
			) : null}
			{cLabel ? (
				<RemovableChip label={cLabel} onRemove={onClearCountry} p={p} t={t} />
			) : null}
			{dLabel ? (
				<RemovableChip
					label={`Due: ${dLabel}`}
					onRemove={onClearDeadline}
					p={p}
					t={t}
				/>
			) : null}
		</View>
	);
}

const chips = StyleSheet.create({
	row: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 6,
		marginTop: 8,
	},
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 5,
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 14,
		borderWidth: 1,
	},
	label: { fontSize: 11, fontWeight: "500" },
});
