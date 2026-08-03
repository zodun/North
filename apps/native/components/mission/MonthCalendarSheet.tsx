// Month calendar sheet — opened from the calendar glyph by the greeting.
// A light month grid over the `streaks` day states, using the same
// semantics as the 28-day ConsistencyGrid (0 miss · 1 active · 2 directed
// · 3 rest) but drawn as a calendar: gold = directed, soft gold = active,
// dashed ring = deliberate rest, plain = missed.

import { Icon } from "@north/native-ui";
import { getNorthTokens } from "@north/tokens";
import { useState } from "react";
import {
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";

import { astDateKey } from "@/lib/mission/fixtures";
import type { StreakDayMap } from "@/lib/mission/use-mission-streaks";

const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

type Cell = { key: string; dateStr: string | null; dayNum: number };

/** Monday-start cells for the month of (year, monthIdx), padded at the front. */
function monthCells(year: number, monthIdx: number): Cell[] {
	const first = new Date(Date.UTC(year, monthIdx, 1));
	const dow = first.getUTCDay(); // 0=Sun
	const lead = dow === 0 ? 6 : dow - 1;
	const daysInMonth = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate();

	const cells: Cell[] = [];
	for (let i = 0; i < lead; i++) {
		cells.push({
			key: `pad-${year}-${monthIdx}-${i}`,
			dateStr: null,
			dayNum: 0,
		});
	}
	for (let day = 1; day <= daysInMonth; day++) {
		const dateStr = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
		cells.push({ key: dateStr, dateStr, dayNum: day });
	}
	return cells;
}

type Props = {
	visible: boolean;
	onClose: () => void;
	days: StreakDayMap;
};

export function MonthCalendarSheet({ visible, onClose, days }: Props) {
	const { p, t, d } = getNorthTokens();
	const today = astDateKey(0);
	const todayYear = Number(today.slice(0, 4));
	const todayMonth = Number(today.slice(5, 7)) - 1;

	const [cursor, setCursor] = useState({ year: todayYear, month: todayMonth });

	const atCurrentMonth =
		cursor.year === todayYear && cursor.month === todayMonth;

	function shiftMonth(delta: -1 | 1) {
		setCursor((prev) => {
			const next = new Date(Date.UTC(prev.year, prev.month + delta, 1));
			return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
		});
	}

	const cells = monthCells(cursor.year, cursor.month);
	const directedCount = cells.filter(
		(c) => c.dateStr && days[c.dateStr] === 2,
	).length;

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={onClose}
		>
			<View style={[styles.flex, { backgroundColor: p.bg }]}>
				<View style={[styles.header, { borderBottomColor: p.line }]}>
					<Text
						style={[
							styles.headerTitle,
							{ color: p.ink, fontFamily: t.display },
						]}
					>
						Your month
					</Text>
					<Pressable
						onPress={onClose}
						hitSlop={12}
						accessibilityRole="button"
						accessibilityLabel="Close"
					>
						<Icon name="close" size={20} color={p.inkMid} />
					</Pressable>
				</View>

				<ScrollView
					contentContainerStyle={[
						styles.body,
						{ paddingHorizontal: d.scrnPad },
					]}
				>
					{/* Month switcher */}
					<View style={styles.monthRow}>
						<Pressable
							onPress={() => shiftMonth(-1)}
							hitSlop={10}
							accessibilityRole="button"
							accessibilityLabel="Previous month"
							style={[styles.navBtn, { borderColor: p.line }]}
						>
							<View style={styles.flipX}>
								<Icon name="arrow" size={16} color={p.inkMid} />
							</View>
						</Pressable>
						<Text
							style={[
								styles.monthLabel,
								{ color: p.ink, fontFamily: t.display },
							]}
						>
							{MONTHS[cursor.month]} {cursor.year}
						</Text>
						<Pressable
							onPress={() => shiftMonth(1)}
							hitSlop={10}
							disabled={atCurrentMonth}
							accessibilityRole="button"
							accessibilityLabel="Next month"
							style={[
								styles.navBtn,
								{ borderColor: p.line, opacity: atCurrentMonth ? 0.3 : 1 },
							]}
						>
							<Icon name="arrow" size={16} color={p.inkMid} />
						</Pressable>
					</View>

					{/* Grid card */}
					<View
						style={[
							styles.card,
							{ backgroundColor: p.surface, borderColor: p.line },
						]}
					>
						<View style={styles.weekHeader}>
							{WEEKDAYS.map((letter, i) => (
								<View
									// biome-ignore lint/suspicious/noArrayIndexKey: fixed 7-day header
									key={`wd-${i}`}
									style={styles.cellBox}
								>
									<Text
										style={[
											styles.weekLetter,
											{ color: p.inkDim, fontFamily: t.ui },
										]}
									>
										{letter}
									</Text>
								</View>
							))}
						</View>

						<View style={styles.grid}>
							{cells.map((cell) => {
								if (!cell.dateStr) {
									return <View key={cell.key} style={styles.cellBox} />;
								}
								const state = days[cell.dateStr] ?? 0;
								const isFuture = cell.dateStr > today;
								const isToday = cell.dateStr === today;

								let bg = "transparent";
								let textColor = p.inkDim;
								let borderColor = "transparent";
								let dashed = false;
								if (!isFuture) {
									if (state === 2) {
										bg = p.gold;
										textColor = p.accentInk;
									} else if (state === 1) {
										bg = p.accentSoft;
										textColor = p.goldInk;
									} else if (state === 3) {
										dashed = true;
										borderColor = p.inkDim;
										textColor = p.inkMid;
									}
								}
								if (isToday && state !== 2) borderColor = p.lineHi;

								return (
									<View key={cell.key} style={styles.cellBox}>
										<View
											style={[
												styles.dayDot,
												{
													backgroundColor: bg,
													borderColor,
													borderStyle: dashed ? "dashed" : "solid",
													borderWidth:
														dashed || (isToday && state !== 2) ? 1 : 0,
												},
											]}
										>
											<Text
												style={[
													styles.dayNum,
													{
														color: textColor,
														fontFamily: t.ui,
														opacity: isFuture ? 0.35 : 1,
														fontWeight: isToday ? "700" : "500",
													},
												]}
											>
												{cell.dayNum}
											</Text>
										</View>
									</View>
								);
							})}
						</View>

						<View style={[styles.legend, { borderTopColor: p.line }]}>
							<LegendDot color={p.gold} label="directed" />
							<LegendDot color={p.accentSoft} label="active" />
							<LegendDot
								color="transparent"
								label="rest"
								dashed
								borderColor={p.inkDim}
							/>
						</View>
					</View>

					<Text style={[styles.summary, { color: p.inkMid, fontFamily: t.ui }]}>
						{directedCount > 0
							? `${directedCount} directed ${directedCount === 1 ? "day" : "days"} this month.`
							: "No directed days yet this month — today is a good place to start."}
					</Text>
				</ScrollView>
			</View>
		</Modal>
	);
}

function LegendDot({
	color,
	label,
	dashed = false,
	borderColor,
}: {
	color: string;
	label: string;
	dashed?: boolean;
	borderColor?: string;
}) {
	const { p, t } = getNorthTokens();
	return (
		<View style={styles.legendRow}>
			<View
				style={[
					styles.legendSwatch,
					{
						backgroundColor: color,
						borderColor: dashed ? (borderColor ?? p.inkDim) : "transparent",
						borderStyle: dashed ? "dashed" : "solid",
						borderWidth: dashed ? 1 : 0,
					},
				]}
			/>
			<Text style={[styles.legendLabel, { color: p.inkDim, fontFamily: t.ui }]}>
				{label}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
	},
	headerTitle: { fontSize: 18, letterSpacing: -0.3 },
	body: { paddingTop: 20, paddingBottom: 48 },
	monthRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 16,
	},
	monthLabel: { fontSize: 17, letterSpacing: -0.3 },
	navBtn: {
		width: 36,
		height: 36,
		borderRadius: 18,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	flipX: { transform: [{ scaleX: -1 }] },
	card: {
		borderWidth: 1,
		borderRadius: 18,
		padding: 14,
	},
	weekHeader: { flexDirection: "row", marginBottom: 6 },
	weekLetter: { fontSize: 10, fontWeight: "600", letterSpacing: 0.5 },
	grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 6 },
	cellBox: {
		width: `${100 / 7}%`,
		alignItems: "center",
		justifyContent: "center",
	},
	dayDot: {
		width: 34,
		height: 34,
		borderRadius: 17,
		alignItems: "center",
		justifyContent: "center",
	},
	dayNum: { fontSize: 13 },
	legend: {
		flexDirection: "row",
		gap: 14,
		marginTop: 14,
		paddingTop: 12,
		borderTopWidth: 1,
	},
	legendRow: { flexDirection: "row", alignItems: "center", gap: 5 },
	legendSwatch: { width: 10, height: 10, borderRadius: 5 },
	legendLabel: { fontSize: 11 },
	summary: { fontSize: 13, lineHeight: 19, marginTop: 14 },
});
