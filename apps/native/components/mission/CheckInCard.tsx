// Evening check-in — one question, three quick replies, optional note.
// The reply earns a short coaching line (AI in real mode, canned under
// the bypass). Once answered, the card settles into the response.

import { Card, Icon } from "@north/native-ui";
import { getNorthTokens } from "@north/tokens";
import { useState } from "react";
import {
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import type { CheckInReply } from "@/lib/mission/use-check-in";
import { useCheckIn } from "@/lib/mission/use-check-in";

const REPLIES: { id: CheckInReply; label: string }[] = [
	{ id: "done", label: "Done" },
	{ id: "partly", label: "Partly" },
	{ id: "stuck", label: "Stuck" },
];

export function CheckInCard({ missionId }: { missionId: string }) {
	const { p, t } = getNorthTokens();
	const { checkIn, loading, submitting, submit } = useCheckIn(missionId);

	const [selected, setSelected] = useState<CheckInReply | null>(null);
	const [note, setNote] = useState("");

	if (loading) return null;

	return (
		<Card p={p}>
			<Text style={[styles.eyebrow, { color: p.inkDim, fontFamily: t.ui }]}>
				CHECK-IN
			</Text>

			{checkIn ? (
				// Answered: the settled state.
				<View>
					<View style={styles.answeredRow}>
						<Text
							style={[styles.answeredQ, { color: p.inkMid, fontFamily: t.ui }]}
						>
							Today's step went
						</Text>
						<View
							style={[
								styles.answeredPill,
								{ backgroundColor: p.surfaceHi, borderColor: p.line },
							]}
						>
							<Text
								style={[
									styles.answeredPillLabel,
									{ color: p.ink, fontFamily: t.ui },
								]}
							>
								{REPLIES.find((r) => r.id === checkIn.reply)?.label ??
									checkIn.reply}
							</Text>
						</View>
					</View>
					{checkIn.note ? (
						<Text
							style={[styles.noteEcho, { color: p.inkDim, fontFamily: t.ui }]}
						>
							"{checkIn.note}"
						</Text>
					) : null}
					<View style={[styles.responseRow, { borderTopColor: p.line }]}>
						<Icon name="circleDot" size={13} color={p.goldInk} />
						<Text
							style={[styles.responseText, { color: p.ink, fontFamily: t.ui }]}
						>
							{checkIn.response}
						</Text>
					</View>
				</View>
			) : (
				// Unanswered: the one question.
				<View>
					<Text
						style={[styles.question, { color: p.ink, fontFamily: t.editorial }]}
					>
						How did today's step go?
					</Text>
					<View style={styles.replyRow}>
						{REPLIES.map((reply) => {
							const isSelected = selected === reply.id;
							return (
								<Pressable
									key={reply.id}
									onPress={() => setSelected(reply.id)}
									accessibilityRole="button"
									accessibilityState={{ selected: isSelected }}
									accessibilityLabel={reply.label}
									style={[
										styles.replyPill,
										{
											backgroundColor: isSelected ? p.accentSoft : p.surface,
											borderColor: isSelected ? `${p.gold}99` : p.line,
										},
									]}
								>
									<Text
										style={[
											styles.replyLabel,
											{
												color: isSelected ? p.goldInk : p.inkMid,
												fontFamily: t.ui,
											},
										]}
									>
										{reply.label}
									</Text>
								</Pressable>
							);
						})}
					</View>
					<TextInput
						value={note}
						onChangeText={setNote}
						placeholder="Add a note (optional)"
						placeholderTextColor={p.inkDim}
						maxLength={500}
						accessibilityLabel="Check-in note"
						style={[
							styles.noteInput,
							{
								borderColor: p.line,
								backgroundColor: p.surfaceHi,
								color: p.ink,
								fontFamily: t.ui,
							},
						]}
					/>
					<TouchableOpacity
						onPress={() => selected && void submit(selected, note)}
						disabled={!selected || submitting}
						accessibilityRole="button"
						accessibilityLabel="Send check-in"
						style={[
							styles.sendBtn,
							{
								borderColor: p.lineHi,
								opacity: !selected || submitting ? 0.4 : 1,
							},
						]}
					>
						<Text
							style={[styles.sendLabel, { color: p.ink, fontFamily: t.ui }]}
						>
							{submitting ? "Thinking…" : "Check in"}
						</Text>
					</TouchableOpacity>
				</View>
			)}
		</Card>
	);
}

const styles = StyleSheet.create({
	eyebrow: {
		fontSize: 10,
		fontWeight: "700",
		letterSpacing: 1.4,
		textTransform: "uppercase",
		marginBottom: 10,
	},
	question: { fontSize: 16, lineHeight: 22, marginBottom: 12 },
	replyRow: { flexDirection: "row", gap: 8 },
	replyPill: {
		flex: 1,
		borderWidth: 1,
		borderRadius: 999,
		paddingVertical: 9,
		alignItems: "center",
	},
	replyLabel: { fontSize: 13, fontWeight: "700" },
	noteInput: {
		borderWidth: 1,
		borderRadius: 12,
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: 14,
		marginTop: 10,
	},
	sendBtn: {
		marginTop: 10,
		borderWidth: 1,
		borderRadius: 12,
		paddingVertical: 11,
		alignItems: "center",
	},
	sendLabel: { fontSize: 13, fontWeight: "700" },
	answeredRow: { flexDirection: "row", alignItems: "center", gap: 8 },
	answeredQ: { fontSize: 13 },
	answeredPill: {
		borderWidth: 1,
		borderRadius: 999,
		paddingHorizontal: 10,
		paddingVertical: 3,
	},
	answeredPillLabel: { fontSize: 12, fontWeight: "700" },
	noteEcho: { fontSize: 12, lineHeight: 17, marginTop: 8 },
	responseRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 8,
		marginTop: 12,
		paddingTop: 12,
		borderTopWidth: 1,
	},
	responseText: { flex: 1, fontSize: 13.5, lineHeight: 20 },
});
