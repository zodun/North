// Profile tab (PRO-01 / PRO-02 / PRO-03).
//
// PRO-01: name, focus areas, rhythm streak, mission completion stats,
//         signal score + saved opportunities.
// PRO-02: ConsistencyGrid - 28-day heatmap as the identity-evolution
//         visual. Understated; emphasises change over time, never a
//         streak counter or loss-framing.
// PRO-03: Signal band + saved opportunities wired to real M3 data.

import {
	Button,
	Card,
	ConsistencyGrid,
	RhythmStreakCard,
	Rise,
	staggerDelay,
} from "@north/native-ui";
import { getNorthTokens } from "@north/tokens";
import {
	ActivityIndicator,
	Alert,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";

import { supabase } from "@/lib/auth-client";
import { setAuthBypass } from "@/lib/dev-bypass";
import { useProfileData } from "@/lib/profile/use-profile-data";

export default function Profile() {
	const { p, t, d } = getNorthTokens();
	const { data, loading, error } = useProfileData();

	// Same confirm-then-sign-out flow as the drawer home. Also clears the
	// dev bypass flag so a bypassed session actually leaves the shell.
	const confirmSignOut = () => {
		Alert.alert(
			"Sign out?",
			"You can sign back in any time.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Sign out",
					style: "destructive",
					onPress: () => {
						setAuthBypass(false);
						void supabase.auth.signOut();
					},
				},
			],
			{ cancelable: true },
		);
	};

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
				{/* ── Avatar + name + band + focus areas ─────────────── */}
				<Rise>
					<View style={[styles.header, { marginBottom: d.gapLg }]}>
						<View
							style={[
								styles.avatar,
								{ backgroundColor: p.surfaceHi, borderColor: p.line },
							]}
							accessibilityElementsHidden
						>
							<Text
								style={[
									styles.avatarInitials,
									{ color: p.ink, fontFamily: t.display },
								]}
							>
								{(data.displayName ?? "You")
									.split(/\s+/)
									.slice(0, 2)
									.map((w) => w[0]?.toUpperCase() ?? "")
									.join("")}
							</Text>
						</View>
						<Text
							style={[styles.name, { color: p.ink, fontFamily: t.display }]}
						>
							{data.displayName ?? "You"}
						</Text>
						{data.signalBand ? (
							<View
								style={[
									styles.bandPill,
									data.signalBand === "Aligned"
										? {
												backgroundColor: `${p.teal}1f`,
												borderColor: `${p.teal}47`,
											}
										: data.signalBand === "Finding"
											? {
													backgroundColor: `${p.teal}1f`,
													borderColor: `${p.teal}47`,
												}
											: {
													backgroundColor: `${p.violet}1a`,
													borderColor: `${p.violet}40`,
												},
								]}
							>
								<Text
									style={[
										styles.bandPillText,
										{
											color:
												data.signalBand === "Drifting"
													? p.violetInk
													: p.tealInk,
											fontFamily: t.ui,
										},
									]}
								>
									{data.signalBand === "Aligned"
										? "On course"
										: data.signalBand === "Finding"
											? "Finding course"
											: "Drifting"}
								</Text>
							</View>
						) : null}
						{data.focusAreas.length > 0 ? (
							<View style={styles.pillRow}>
								{data.focusAreas.map((fa) => (
									<View
										key={fa.id}
										style={[
											styles.pill,
											{
												// Hue as a wash, ink as the voice — vivid text on the
												// light field can't hold contrast.
												backgroundColor: `${fa.hue}21`,
												borderColor: `${fa.hue}47`,
											},
										]}
									>
										<Text
											style={[
												styles.pillText,
												{ color: p.ink, fontFamily: t.ui },
											]}
										>
											{fa.label}
										</Text>
									</View>
								))}
							</View>
						) : null}
					</View>
				</Rise>

				{/* ── Rhythm streak (7-day) ───────────────────────────── */}
				<Rise delay={staggerDelay(1)} style={{ marginBottom: d.gap }}>
					<RhythmStreakCard
						p={p}
						t={t}
						week={data.streaks28.slice(-7)}
						directedDays={data.directedDaysThisWeek}
						labels={data.dayLabels7}
					/>
				</Rise>

				{/* ── Consistency grid (28-day) - PRO-02 ─────────────── */}
				<Rise delay={staggerDelay(2)} style={{ marginBottom: d.gap }}>
					<ConsistencyGrid
						p={p}
						t={t}
						days={data.streaks28}
						activeDayCount={data.streaks28.filter((s) => s >= 1).length}
						weekdayLabels={["M", "T", "W", "T", "F", "S", "S"]}
					/>
				</Rise>

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
											// Band ink variants: gold=aligned, teal=finding, violet=drift.
											color:
												data.signalBand === "Aligned"
													? p.goldInk
													: data.signalBand === "Finding"
														? p.tealInk
														: p.violetInk,
											fontFamily: t.display,
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

				{/* ── Sign out ────────────────────────────────────────── */}
				<View style={{ marginTop: d.gapLg }}>
					<Button p={p} t={t} variant="outline" onPress={confirmSignOut}>
						Sign out
					</Button>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1 },
	center: { flex: 1, alignItems: "center", justifyContent: "center" },
	body: { flexGrow: 1 },
	header: { alignItems: "center" },
	avatar: {
		width: 76,
		height: 76,
		borderRadius: 38,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 12,
	},
	avatarInitials: { fontSize: 26, lineHeight: 32 },
	name: { fontSize: 26, lineHeight: 32, letterSpacing: -0.5, marginBottom: 10 },
	bandPill: {
		paddingHorizontal: 14,
		paddingVertical: 6,
		borderRadius: 20,
		borderWidth: 1,
		marginBottom: 12,
	},
	bandPillText: { fontSize: 13, fontWeight: "600" },
	pillRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		justifyContent: "center",
	},
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
