// Mission-complete card — the earned moment, kept calm per the motion
// doctrine (no confetti, no overshoot; it rises like everything else).
// Gold wash + trophy + streak count, and a one-line reflection that lands
// in the Journal.

import { Icon } from "@north/native-ui";
import { getNorthTokens } from "@north/tokens";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { arrive } from "@/lib/haptics";
import { useMissionReflection } from "@/lib/mission/use-mission-reflection";

type Props = {
	/** Today's daily step (monthly_mission_steps.id) — keys the reflection. */
	stepId: string;
	rhythmStreak: number;
};

export function CelebrationCard({ stepId, rhythmStreak }: Props) {
	const { p, t } = getNorthTokens();
	const { saved, saving, save } = useMissionReflection(stepId);
	const [draft, setDraft] = useState("");

	const streakLine =
		rhythmStreak > 1
			? `Today's step is done — that's ${rhythmStreak} days of rhythm now.`
			: `Today's step is done. The rest of the day is yours.`;

	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: p.accentSoft, borderColor: `${p.gold}66` },
			]}
		>
			<View style={styles.headRow}>
				<View
					style={[
						styles.trophyDisc,
						{ backgroundColor: p.surface, borderColor: `${p.gold}66` },
					]}
				>
					<Icon name="trophy" size={20} color={p.goldInk} strokeWidth={1.7} />
				</View>
				<View style={styles.headCopy}>
					<Text style={[styles.title, { color: p.ink, fontFamily: t.display }]}>
						Pointed north today.
					</Text>
					<Text style={[styles.sub, { color: p.inkMid, fontFamily: t.ui }]}>
						{streakLine}
					</Text>
				</View>
			</View>

			{saved ? (
				<View style={[styles.savedWrap, { borderTopColor: `${p.gold}44` }]}>
					<Text style={[styles.savedBody, { color: p.ink, fontFamily: t.ui }]}>
						"{saved}"
					</Text>
					<Pressable
						onPress={() => router.push("/(drawer)/(tabs)/journal")}
						accessibilityRole="button"
						accessibilityLabel="Open Journal"
						style={styles.journalLink}
					>
						<Text
							style={[
								styles.journalLabel,
								{ color: p.goldInk, fontFamily: t.ui },
							]}
						>
							Saved to your Journal
						</Text>
						<Icon name="arrow" size={13} color={p.goldInk} strokeWidth={2} />
					</Pressable>
				</View>
			) : (
				<View style={[styles.savedWrap, { borderTopColor: `${p.gold}44` }]}>
					<Text
						style={[styles.reflectLabel, { color: p.inkMid, fontFamily: t.ui }]}
					>
						One line before you go — what made today work?
					</Text>
					<View style={styles.inputRow}>
						<TextInput
							value={draft}
							onChangeText={setDraft}
							placeholder="Write it down"
							placeholderTextColor={p.inkDim}
							maxLength={500}
							accessibilityLabel="Mission reflection"
							style={[
								styles.input,
								{
									backgroundColor: p.surface,
									borderColor: p.line,
									color: p.ink,
									fontFamily: t.ui,
								},
							]}
						/>
						<Pressable
							onPress={() => {
								arrive();
								void save(draft);
							}}
							disabled={!draft.trim() || saving}
							accessibilityRole="button"
							accessibilityLabel="Save reflection"
							style={[
								styles.saveBtn,
								{
									backgroundColor: p.gold,
									opacity: !draft.trim() || saving ? 0.4 : 1,
								},
							]}
						>
							<Icon
								name="arrowUp"
								size={16}
								color={p.accentInk}
								strokeWidth={2}
							/>
						</Pressable>
					</View>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		borderWidth: 1,
		borderRadius: 18,
		padding: 16,
	},
	headRow: { flexDirection: "row", alignItems: "center", gap: 12 },
	trophyDisc: {
		width: 44,
		height: 44,
		borderRadius: 22,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	headCopy: { flex: 1, gap: 2 },
	title: { fontSize: 17, letterSpacing: -0.3 },
	sub: { fontSize: 12.5, lineHeight: 18 },
	savedWrap: { marginTop: 14, paddingTop: 12, borderTopWidth: 1 },
	reflectLabel: { fontSize: 12.5, lineHeight: 18, marginBottom: 8 },
	inputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
	input: {
		flex: 1,
		borderWidth: 1,
		borderRadius: 12,
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: 14,
	},
	saveBtn: {
		width: 40,
		height: 40,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	savedBody: { fontSize: 13.5, lineHeight: 20 },
	journalLink: {
		flexDirection: "row",
		alignItems: "center",
		gap: 5,
		marginTop: 8,
	},
	journalLabel: { fontSize: 12.5, fontWeight: "700" },
});
