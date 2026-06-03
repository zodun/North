// Horizontal scrollable category filter bar (FEED-04).
// "All" pill + the 10 fixed content_categories. Active pill uses the
// accent colour; inactive uses the surface tint.

import { getTokens } from "@north/tokens";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Category = { id: string | null; label: string };

const CATEGORIES: Category[] = [
	{ id: null, label: "All" },
	{ id: "purpose", label: "Purpose" },
	{ id: "careers", label: "Careers" },
	{ id: "entrepreneurship", label: "Entrepreneurship" },
	{ id: "remote-work", label: "Remote work" },
	{ id: "ai", label: "AI" },
	{ id: "caribbean-success", label: "Caribbean success" },
	{ id: "self-development", label: "Self development" },
	{ id: "opportunities", label: "Opportunities" },
	{ id: "productivity", label: "Productivity" },
	{ id: "mental-clarity", label: "Mental clarity" },
];

type Props = {
	active: string | null;
	onChange: (id: string | null) => void;
};

export function CategoryFilter({ active, onChange }: Props) {
	const { p, t } = getTokens("warm", "humanist", "calm");

	return (
		<View style={[styles.wrapper, { backgroundColor: p.bg }]}>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.row}
			>
				{CATEGORIES.map((cat) => {
					const selected = active === cat.id;
					return (
						<Pressable
							key={cat.id ?? "__all__"}
							onPress={() => onChange(cat.id)}
							accessibilityRole="button"
							accessibilityState={{ selected }}
							style={({ pressed }) => [
								styles.pill,
								{
									backgroundColor: selected ? p.accent : p.surface,
									borderColor: selected ? p.accent : p.line,
									opacity: pressed ? 0.8 : 1,
								},
							]}
						>
							<Text
								style={{
									color: selected ? p.accentInk : p.inkMid,
									fontFamily: t.ui,
									fontSize: 12,
									fontWeight: selected ? "600" : "500",
								}}
							>
								{cat.label}
							</Text>
						</Pressable>
					);
				})}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		paddingVertical: 10,
	},
	row: {
		paddingHorizontal: 16,
		gap: 8,
		flexDirection: "row",
		alignItems: "center",
	},
	pill: {
		paddingHorizontal: 14,
		paddingVertical: 7,
		borderRadius: 20,
		borderWidth: 1,
	},
});
