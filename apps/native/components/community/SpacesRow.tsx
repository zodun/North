// The Spaces chip row: six quiet doors under the header. White pills,
// hairline borders, ink icons — the tab stays a calm index and each
// chip opens a full-screen sheet where the detail lives.

import { Icon, type IconName } from "@north/native-ui";
import type { getNorthTokens } from "@north/tokens";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

type Tokens = ReturnType<typeof getNorthTokens>;

export type SpaceKey =
	| "communities"
	| "groups"
	| "mentors"
	| "events"
	| "challenges"
	| "messages";

const SPACES: { key: SpaceKey; label: string; icon: IconName }[] = [
	{ key: "communities", label: "Communities", icon: "community" },
	{ key: "groups", label: "Groups", icon: "flag" },
	{ key: "mentors", label: "Mentors", icon: "profile" },
	{ key: "events", label: "Events", icon: "calendar" },
	{ key: "challenges", label: "Challenges", icon: "trophy" },
	{ key: "messages", label: "Messages", icon: "write" },
];

export function SpacesRow({
	p,
	t,
	onOpen,
}: {
	p: Tokens["p"];
	t: Tokens["t"];
	onOpen: (space: SpaceKey) => void;
}) {
	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={s.row}
			style={s.scroll}
		>
			{SPACES.map((space) => (
				<Pressable
					key={space.key}
					onPress={() => onOpen(space.key)}
					accessibilityRole="button"
					accessibilityLabel={space.label}
					style={({ pressed }) => [
						s.chip,
						{ backgroundColor: p.surface, borderColor: p.line },
						pressed && { opacity: 0.7 },
					]}
				>
					<Icon name={space.icon} size={13} color={p.inkMid} />
					<Text style={[s.chipLabel, { color: p.inkMid, fontFamily: t.ui }]}>
						{space.label}
					</Text>
				</Pressable>
			))}
		</ScrollView>
	);
}

const s = StyleSheet.create({
	scroll: { marginHorizontal: -20 },
	row: {
		flexDirection: "row",
		gap: 8,
		paddingHorizontal: 20,
		paddingVertical: 2,
	},
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		borderWidth: 1,
		borderRadius: 16,
		paddingHorizontal: 12,
		height: 32,
	},
	chipLabel: { fontSize: 12, fontWeight: "500" },
});
