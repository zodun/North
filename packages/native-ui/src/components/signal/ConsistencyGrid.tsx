// ConsistencyGrid — 28-day consistency heatmap (DEC-23).
// Port of apps/web/src/app/north/_components/signal.tsx#ConsistencyGrid.
// Same `state` mapping as RhythmStreakCard (0 miss · 1 active · 2 directed · 3 rest).

import type { Palette, TypePairing } from "@north/tokens";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "../Card";
import type { StreakState } from "./RhythmStreakCard";

export type ConsistencyGridProps = {
	p: Palette;
	t: TypePairing;
	/** 28 entries, oldest first. */
	days: StreakState[];
	activeDayCount: number;
	weekdayLabels?: string[];
};

const DEFAULT_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export function ConsistencyGrid({
	p,
	t,
	days,
	activeDayCount,
	weekdayLabels = DEFAULT_LABELS,
}: ConsistencyGridProps) {
	const accent = p.accent;
	return (
		<Card p={p} padding={20}>
			<View style={styles.header}>
				<Text style={[styles.eyebrow, { color: p.inkDim, fontFamily: t.ui }]}>
					LAST 28 DAYS
				</Text>
				<Text style={[styles.count, { color: p.inkMid, fontFamily: t.mono }]}>
					{activeDayCount} of 28 active
				</Text>
			</View>
			<View style={styles.weekdayRow}>
				{weekdayLabels.map((l, i) => (
					<View
						// biome-ignore lint/suspicious/noArrayIndexKey: fixed 7-day weekday header
						key={`hdr-${i}-${l}`}
						style={styles.weekdayCell}
					>
						<Text
							style={{ color: p.inkDim, fontFamily: t.mono, fontSize: 9.5 }}
						>
							{l}
						</Text>
					</View>
				))}
			</View>
			<View style={styles.grid}>
				{days.map((v, i) => {
					let bg = p.line;
					if (v === 2) bg = accent;
					else if (v === 1) bg = `${accent}55`;
					else if (v === 3) bg = "transparent";
					return (
						<View
							// biome-ignore lint/suspicious/noArrayIndexKey: fixed 28-day grid
							key={`cell-${i}`}
							style={[
								styles.cell,
								{
									backgroundColor: bg,
									borderColor: v === 3 ? p.inkDim : "transparent",
									borderStyle: v === 3 ? "dashed" : "solid",
									borderWidth: v === 3 ? 1 : 0,
								},
							]}
						/>
					);
				})}
			</View>
			<View style={styles.legend}>
				<LegendDot color={accent} label="directed" p={p} t={t} />
				<LegendDot color={`${accent}55`} label="active" p={p} t={t} />
				<LegendDot
					color="transparent"
					label="rest"
					dashed
					borderColor={p.inkDim}
					p={p}
					t={t}
				/>
			</View>
		</Card>
	);
}

function LegendDot({
	color,
	label,
	dashed = false,
	borderColor,
	p,
	t,
}: {
	color: string;
	label: string;
	dashed?: boolean;
	borderColor?: string;
	p: Palette;
	t: TypePairing;
}) {
	return (
		<View style={styles.legendRow}>
			<View
				style={[
					styles.legendDot,
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
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "baseline",
		marginBottom: 14,
	},
	eyebrow: { fontSize: 11, fontWeight: "500", letterSpacing: 2 },
	count: { fontSize: 11 },
	weekdayRow: { flexDirection: "row", gap: 5, marginBottom: 10 },
	weekdayCell: { flex: 1, alignItems: "center" },
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 5,
		justifyContent: "space-between",
		marginBottom: 8,
	},
	cell: { width: 26, height: 26, borderRadius: 7 },
	legend: { flexDirection: "row", gap: 12, marginTop: 8 },
	legendRow: { flexDirection: "row", alignItems: "center", gap: 4 },
	legendDot: { width: 10, height: 10, borderRadius: 3 },
	legendLabel: { fontSize: 10.5 },
});
