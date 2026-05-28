// RhythmStreakCard — 7-day rhythm view (DEC-23).
// Port of apps/web/src/app/north/_components/signal.tsx#RhythmStreakCard.
// state values: 0 miss · 1 active · 2 directed · 3 rest (matches DEC-08 `streaks.state`).

import type { Palette, TypePairing } from "@north/tokens";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "../Card";

export type StreakState = 0 | 1 | 2 | 3;

export type RhythmStreakCardProps = {
	p: Palette;
	t: TypePairing;
	/** 7 entries, oldest first. */
	week: StreakState[];
	/** Number of directed days to display in the headline. */
	directedDays: number;
	/** Day-letter labels (defaults to M T W T F S S). */
	labels?: string[];
};

const DEFAULT_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export function RhythmStreakCard({
	p,
	t,
	week,
	directedDays,
	labels = DEFAULT_LABELS,
}: RhythmStreakCardProps) {
	return (
		<Card p={p}>
			<View style={styles.headerRow}>
				<Text style={[styles.eyebrow, { color: p.inkDim, fontFamily: t.ui }]}>
					RHYTHM
				</Text>
				<Text style={[styles.intact, { color: p.accent, fontFamily: t.ui }]}>
					Intact
				</Text>
			</View>
			<View style={styles.statRow}>
				<Text
					style={[
						styles.count,
						{
							color: p.ink,
							fontFamily: t.display,
							fontWeight: String(t.displayWeight) as "400",
							fontStyle: t.editorialItalic ? "italic" : "normal",
						},
					]}
				>
					{directedDays}
				</Text>
				<Text style={[styles.unit, { color: p.inkMid, fontFamily: t.ui }]}>
					directed days this week
				</Text>
			</View>
			<View style={styles.cellRow}>
				{week.map((v, i) => {
					const bg =
						v === 2
							? p.accent
							: v === 1
								? `${p.accent}55`
								: v === 3
									? "transparent"
									: p.line;
					return (
						<View
							// biome-ignore lint/suspicious/noArrayIndexKey: fixed-length 7-day week
							key={`cell-${i}`}
							style={[
								styles.cell,
								{
									backgroundColor: bg,
									borderColor: v === 3 ? p.inkMid : "transparent",
									borderStyle: v === 3 ? "dashed" : "solid",
									borderWidth: v === 3 ? 1 : 0,
								},
							]}
						>
							<Text
								style={{
									color: v >= 2 ? p.accentInk : p.inkDim,
									fontFamily: t.mono,
									fontSize: 10,
								}}
							>
								{labels[i] ?? ""}
							</Text>
						</View>
					);
				})}
			</View>
			<Text style={[styles.footer, { color: p.inkDim, fontFamily: t.ui }]}>
				A rest day keeps the rhythm. No streak-panic.
			</Text>
		</Card>
	);
}

const styles = StyleSheet.create({
	headerRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "baseline",
		marginBottom: 14,
	},
	eyebrow: { fontSize: 11, fontWeight: "500", letterSpacing: 2 },
	intact: { fontSize: 11, fontWeight: "600", letterSpacing: 0.4 },
	statRow: {
		flexDirection: "row",
		alignItems: "baseline",
		gap: 10,
		marginBottom: 14,
	},
	count: { fontSize: 42, lineHeight: 42 },
	unit: { fontSize: 14 },
	cellRow: { flexDirection: "row", gap: 4, marginBottom: 8 },
	cell: {
		flex: 1,
		height: 32,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
	},
	footer: { fontSize: 12, lineHeight: 18 },
});
