// Habits — small recurring rituals with one check circle per day of the
// current week. Teal marks a kept day (on-course, same language as done
// tasks); today gets a stronger ring; future days are quiet and inert.

import { Card, Icon } from "@north/native-ui";
import { getNorthTokens } from "@north/tokens";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { tap } from "@/lib/haptics";
import { useHabits } from "@/lib/mission/use-habits";

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

export function HabitsSection() {
	const { p, t } = getNorthTokens();
	const { habits, checks, weekDays, today, loading, toggleCheck, addHabit } =
		useHabits();

	const [adding, setAdding] = useState(false);
	const [draft, setDraft] = useState("");

	async function submitDraft() {
		const ok = await addHabit(draft);
		if (ok) {
			setDraft("");
			setAdding(false);
		}
	}

	if (loading) return null;

	return (
		<Card p={p}>
			<Text style={[styles.eyebrow, { color: p.inkDim, fontFamily: t.ui }]}>
				HABITS
			</Text>

			{habits.length === 0 ? (
				<Text style={[styles.empty, { color: p.inkMid, fontFamily: t.ui }]}>
					Small daily rituals that keep the week honest.
				</Text>
			) : (
				<>
					{/* Day letters, aligned over the circle columns. */}
					<View style={styles.row}>
						<View style={styles.nameCol} />
						{DAY_LETTERS.map((letter, i) => (
							<View
								// biome-ignore lint/suspicious/noArrayIndexKey: fixed 7-day header
								key={`day-${i}`}
								style={styles.dayCol}
							>
								<Text
									style={[
										styles.dayLetter,
										{
											color: weekDays[i] === today ? p.ink : p.inkDim,
											fontFamily: t.ui,
											fontWeight: weekDays[i] === today ? "700" : "500",
										},
									]}
								>
									{letter}
								</Text>
							</View>
						))}
					</View>

					{habits.map((habit) => (
						<View key={habit.id} style={[styles.row, styles.habitRow]}>
							<View style={styles.nameCol}>
								<Text
									style={[styles.habitName, { color: p.ink, fontFamily: t.ui }]}
									numberOfLines={1}
								>
									{habit.name}
								</Text>
							</View>
							{weekDays.map((day) => {
								const checked = checks.has(`${habit.id}:${day}`);
								const isFuture = day > today;
								const isToday = day === today;
								return (
									<View key={day} style={styles.dayCol}>
										<Pressable
											onPress={() => {
												tap();
												void toggleCheck(habit.id, day);
											}}
											disabled={isFuture}
											hitSlop={6}
											accessibilityRole="checkbox"
											accessibilityState={{
												checked,
												disabled: isFuture,
											}}
											accessibilityLabel={`${habit.name}, ${day}`}
											style={[
												styles.circle,
												{
													backgroundColor: checked ? p.teal : "transparent",
													borderColor: checked
														? p.teal
														: isToday
															? p.lineHi
															: p.line,
													opacity: isFuture ? 0.35 : 1,
												},
											]}
										>
											{checked ? (
												<Icon
													name="check"
													size={11}
													color={p.accentInk}
													strokeWidth={2.5}
												/>
											) : null}
										</Pressable>
									</View>
								);
							})}
						</View>
					))}
				</>
			)}

			{/* Quiet add row — inline input, no extra sheet. */}
			{adding ? (
				<View style={[styles.addRow, { borderTopColor: p.line }]}>
					<TextInput
						value={draft}
						onChangeText={setDraft}
						placeholder="Name the habit"
						placeholderTextColor={p.inkDim}
						autoFocus
						maxLength={80}
						onSubmitEditing={() => void submitDraft()}
						onBlur={() => {
							if (!draft.trim()) setAdding(false);
						}}
						returnKeyType="done"
						accessibilityLabel="New habit name"
						style={[
							styles.addInput,
							{
								borderColor: p.line,
								color: p.ink,
								fontFamily: t.ui,
								backgroundColor: p.surfaceHi,
							},
						]}
					/>
					<Pressable
						onPress={() => void submitDraft()}
						hitSlop={8}
						accessibilityRole="button"
						accessibilityLabel="Add habit"
					>
						<Icon name="check" size={18} color={p.tealInk} strokeWidth={2} />
					</Pressable>
				</View>
			) : (
				<Pressable
					onPress={() => setAdding(true)}
					accessibilityRole="button"
					accessibilityLabel="Add a habit"
					style={[styles.addRow, { borderTopColor: p.line }]}
				>
					<Icon name="add" size={14} color={p.inkDim} strokeWidth={1.8} />
					<Text
						style={[styles.addLabel, { color: p.inkDim, fontFamily: t.ui }]}
					>
						Add a habit
					</Text>
				</Pressable>
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
		marginBottom: 12,
	},
	empty: { fontSize: 13, lineHeight: 19, marginBottom: 4 },
	row: { flexDirection: "row", alignItems: "center" },
	habitRow: { marginTop: 10 },
	nameCol: { flex: 1, paddingRight: 8 },
	dayCol: { width: 26, alignItems: "center" },
	dayLetter: { fontSize: 10 },
	habitName: { fontSize: 14 },
	circle: {
		width: 22,
		height: 22,
		borderRadius: 11,
		borderWidth: 1.5,
		alignItems: "center",
		justifyContent: "center",
	},
	addRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginTop: 14,
		paddingTop: 12,
		borderTopWidth: 1,
	},
	addLabel: { fontSize: 13, fontWeight: "600" },
	addInput: {
		flex: 1,
		borderWidth: 1,
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 8,
		fontSize: 14,
	},
});
