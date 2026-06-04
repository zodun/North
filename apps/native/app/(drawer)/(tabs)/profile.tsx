// Profile tab (PRO-01 / PRO-02 / PRO-03).
//
// PRO-01: name, focus areas, rhythm streak, mission completion stats,
//         signal score + saved opportunities.
// PRO-02: ConsistencyGrid - 28-day heatmap as the identity-evolution
//         visual. Understated; emphasises change over time, never a
//         streak counter or loss-framing.
// PRO-03: Signal band + saved opportunities wired to real M3 data.

import { Card, ConsistencyGrid, RhythmStreakCard } from "@north/native-ui";
import { getTokens } from "@north/tokens";
import {
	ActivityIndicator,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";

import { useProfileData } from "@/lib/profile/use-profile-data";

export default function Profile() {
	const { p, t, d } = getTokens("warm", "humanist", "calm");
	const { data, loading, error } = useProfileData();

	if (loading) {
		return (
			<SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]}>
				<View style={styles.center}>
					<ActivityIndicator color={p.accent} />
				</View>
			</SafeAreaView>
		);
	}

	if (error || !data) {
		return (
			<SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]}>
				<View style={styles.center}>
					<Text style={{ color: p.warn, fontFamily: t.ui, fontSize: 14 }}>
						{error ?? "Could not load profile."}
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]}>
			<ScrollView
				contentContainerStyle={[
					styles.body,
					{ paddingHorizontal: d.scrnPad, paddingTop: 32, paddingBottom: 48 },
				]}
				showsVerticalScrollIndicator={false}
			>
				{/* ── Name + focus areas ─────────────────────────────── */}
				<View style={[styles.header, { marginBottom: d.gapLg }]}>
					<Text
						style={[
							styles.name,
							{
								color: p.ink,
								fontFamily: t.display,
								fontWeight: String(t.displayWeight) as "400",
								fontStyle: t.editorialItalic ? "italic" : "normal",
							},
						]}
					>
						{data.displayName ?? "You"}
					</Text>
					{data.focusAreas.length > 0 ? (
						<View style={styles.pillRow}>
							{data.focusAreas.map((fa) => (
								<View
									key={fa.id}
									style={[
										styles.pill,
										{
											backgroundColor: `${fa.hue}33`,
											borderColor: `${fa.hue}66`,
										},
									]}
								>
									<Text
										style={[
											styles.pillText,
											{ color: fa.hue, fontFamily: t.ui },
										]}
									>
										{fa.label}
									</Text>
								</View>
							))}
						</View>
					) : null}
				</View>

				{/* ── Rhythm streak (7-day) ───────────────────────────── */}
				<View style={{ marginBottom: d.gap }}>
					<RhythmStreakCard
						p={p}
						t={t}
						week={data.streaks28.slice(-7)}
						directedDays={data.directedDaysThisWeek}
						labels={data.dayLabels7}
					/>
				</View>

				{/* ── Consistency grid (28-day) - PRO-02 ─────────────── */}
				<View style={{ marginBottom: d.gap }}>
					<ConsistencyGrid
						p={p}
						t={t}
						days={data.streaks28}
						activeDayCount={data.streaks28.filter((s) => s >= 1).length}
						weekdayLabels={["M", "T", "W", "T", "F", "S", "S"]}
					/>
				</View>

				{/* ── Missions this week ──────────────────────────────── */}
				<View style={{ marginBottom: d.gap }}>
					<Card p={p}>
						<Text
							style={[
								styles.cardEyebrow,
								{ color: p.inkDim, fontFamily: t.ui },
							]}
						>
							THIS WEEK
						</Text>
						<View style={styles.statRow}>
							<Text
								style={[
									styles.statNumber,
									{
										color: p.ink,
										fontFamily: t.display,
										fontWeight: String(t.displayWeight) as "400",
										fontStyle: t.editorialItalic ? "italic" : "normal",
									},
								]}
							>
								{data.tasksCompletedThisWeek}
							</Text>
							<Text
								style={[styles.statUnit, { color: p.inkMid, fontFamily: t.ui }]}
							>
								{data.tasksCompletedThisWeek === 1 ? "task" : "tasks"} completed
								{data.totalTasksThisWeek > 0
									? ` of ${data.totalTasksThisWeek}`
									: ""}
							</Text>
						</View>
						<Text
							style={[styles.cardFooter, { color: p.inkDim, fontFamily: t.ui }]}
						>
							Rhythm streak · {data.rhythmStreak}{" "}
							{data.rhythmStreak === 1 ? "day" : "days"}
						</Text>
					</Card>
				</View>

				{/* ── Signal band (PRO-03) ────────────────────────────── */}
				<View style={{ marginBottom: d.gap }}>
					<Card p={p}>
						<Text
							style={[
								styles.cardEyebrow,
								{ color: p.inkDim, fontFamily: t.ui },
							]}
						>
							SIGNAL
						</Text>
						{data.signalBand ? (
							<>
								<Text
									style={[
										styles.bandValue,
										{
											color:
												data.signalBand === "Aligned"
													? p.accent
													: data.signalBand === "Finding"
														? p.inkMid
														: p.warn,
											fontFamily: t.display,
											fontWeight: String(t.displayWeight) as "400",
											fontStyle: t.editorialItalic ? "italic" : "normal",
										},
									]}
								>
									{data.signalBand}
								</Text>
								{data.signalTrend ? (
									<Text
										style={[
											styles.cardFooter,
											{ color: p.inkDim, fontFamily: t.ui },
										]}
									>
										{data.signalTrend === "climbing"
											? "↑ climbing"
											: data.signalTrend === "easing"
												? "↓ easing"
												: "→ holding"}
									</Text>
								) : null}
							</>
						) : (
							<Text
								style={[
									styles.cardFooter,
									{ color: p.inkDim, fontFamily: t.ui, fontStyle: "italic" },
								]}
							>
								Appears after your first full week of activity.
							</Text>
						)}
					</Card>
				</View>

				{/* ── Saved opportunities (PRO-03) ────────────────────── */}
				<Card p={p}>
					<Text
						style={[styles.cardEyebrow, { color: p.inkDim, fontFamily: t.ui }]}
					>
						SAVED
					</Text>
					{data.savedCount > 0 ? (
						<>
							<View style={styles.statRow}>
								<Text
									style={[
										styles.statNumber,
										{
											color: p.ink,
											fontFamily: t.display,
											fontWeight: String(t.displayWeight) as "400",
											fontStyle: t.editorialItalic ? "italic" : "normal",
										},
									]}
								>
									{data.savedCount}
								</Text>
								<Text
									style={[
										styles.statUnit,
										{ color: p.inkMid, fontFamily: t.ui },
									]}
								>
									{data.savedCount === 1 ? "opportunity" : "opportunities"}{" "}
									saved
								</Text>
							</View>
							{data.savedOpportunities.map((opp) => (
								<Text
									key={opp.id}
									style={[
										styles.savedItem,
										{ color: p.inkMid, fontFamily: t.ui },
									]}
									numberOfLines={1}
								>
									{opp.title} · {opp.org}
								</Text>
							))}
						</>
					) : (
						<Text
							style={[
								styles.cardFooter,
								{ color: p.inkDim, fontFamily: t.ui, fontStyle: "italic" },
							]}
						>
							Save opportunities from the Opportunities tab.
						</Text>
					)}
				</Card>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1 },
	center: { flex: 1, alignItems: "center", justifyContent: "center" },
	body: { flexGrow: 1 },
	header: {},
	name: { fontSize: 32, lineHeight: 38, letterSpacing: -0.5, marginBottom: 12 },
	pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	pill: {
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 20,
		borderWidth: 1,
	},
	pillText: { fontSize: 12, fontWeight: "500" },
	cardEyebrow: {
		fontSize: 11,
		fontWeight: "500",
		letterSpacing: 2,
		marginBottom: 10,
	},
	statRow: {
		flexDirection: "row",
		alignItems: "baseline",
		gap: 8,
		marginBottom: 8,
	},
	statNumber: { fontSize: 42, lineHeight: 44 },
	statUnit: { fontSize: 14 },
	cardFooter: { fontSize: 12, lineHeight: 18 },
	bandValue: { fontSize: 28, lineHeight: 34, marginBottom: 4 },
	savedItem: { fontSize: 12, lineHeight: 18, marginTop: 4 },
});
