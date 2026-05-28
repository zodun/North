// Shared placeholder for the 5 v0 tab screens (DEC-24).
// M1 will replace each with the real tab UI.

import { getTokens } from "@north/tokens";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export function PlaceholderScreen({
	title,
	subtitle = "M1 will fill this.",
}: {
	title: string;
	subtitle?: string;
}) {
	const { p, t } = getTokens("warm", "humanist", "calm");
	return (
		<SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]}>
			<View style={styles.center}>
				<Text
					style={[
						styles.title,
						{
							color: p.ink,
							fontFamily: t.display,
							fontWeight: String(t.displayWeight) as "400",
							fontStyle: t.editorialItalic ? "italic" : "normal",
						},
					]}
				>
					{title}
				</Text>
				<Text style={[styles.sub, { color: p.inkMid, fontFamily: t.ui }]}>
					{subtitle}
				</Text>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1 },
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 24,
	},
	title: { fontSize: 28, marginBottom: 8 },
	sub: { fontSize: 14 },
});
