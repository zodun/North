// Mission tab — the monthly mission (migrations 0040/0074).
//
// One goal per rolling 28-day cycle: 4 weekly milestones + one small daily
// step, kept calm through progressive disclosure. Streak chip + calendar /
// set-goal buttons by the greeting, the goal card with a gold progress
// ring (milestones banked), today's one small step, the 4-week plan, one
// check-in card, a compact habits section, and sheets (set goal, month
// calendar) for everything else.
// - Today's step completes optimistically (offline-retry, PostHog events)
// - Completion → celebration card with a one-line Journal reflection
// - Starter (template) goals get a quiet, dismissible "make it yours" nudge

import { Card, Icon, ProgressRing, Rise, staggerDelay } from "@north/native-ui";
import { getNorthTokens } from "@north/tokens";
import { useMemo, useState } from "react";
import {
	Image,
	Pressable,
	RefreshControl,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { CelebrationCard } from "@/components/mission/CelebrationCard";
import { CheckInCard } from "@/components/mission/CheckInCard";
import { HabitsSection } from "@/components/mission/HabitsSection";
import { MonthCalendarSheet } from "@/components/mission/MonthCalendarSheet";
import { SetGoalSheet } from "@/components/mission/SetGoalSheet";
import { StreakChip } from "@/components/mission/StreakChip";
import { arrive, tap } from "@/lib/haptics";
import { useMissionStreaks } from "@/lib/mission/use-mission-streaks";
import type {
	MissionStep,
	MonthlyMissionData,
} from "@/lib/mission/use-monthly-mission";
import {
	deriveMissionView,
	todayInAST,
	useMonthlyMission,
} from "@/lib/mission/use-monthly-mission";
import { useStepCompletion } from "@/lib/mission/use-step-completion";
import { useFirstName } from "@/lib/profile/use-display-name";

function greetingForNow(): string {
	const hour = new Date().getHours();
	if (hour < 12) return "Good morning";
	if (hour < 18) return "Good afternoon";
	return "Good evening";
}

export default function Mission() {
	const { p, t } = getNorthTokens();
	const { data, loading, error, refresh, dismissPrompt } = useMonthlyMission();

	if (loading) {
		return (
			<SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]}>
				<View style={styles.center}>
					<Text style={{ color: p.inkDim, fontFamily: t.ui, fontSize: 14 }}>
						Loading…
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (error) {
		return (
			<SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]}>
				<View style={styles.center}>
					<Text style={{ color: p.warn, fontFamily: t.ui, fontSize: 14 }}>
						{error}
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (!data) {
		// ensure_monthly_mission seeds a cycle on load, so an empty state is a
		// hiccup (offline first load, RPC failure) — offer a calm retry.
		return (
			<SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]}>
				<View style={styles.center}>
					{/* Pole, the compass star — at rest until there's somewhere to point. */}
					<Image
						source={require("../../../assets/images/pole/pole-rest.png")}
						style={styles.pole}
						resizeMode="contain"
						accessibilityElementsHidden
					/>
					<Text
						style={[
							styles.emptyTitle,
							{
								color: p.ink,
								fontFamily: t.display,
							},
						]}
					>
						No mission yet.
					</Text>
					<Text
						style={[styles.emptySub, { color: p.inkMid, fontFamily: t.ui }]}
					>
						North sets up a four-week mission around your focus. Check your
						connection and try again.
					</Text>
					<TouchableOpacity
						onPress={() => void refresh()}
						accessibilityRole="button"
						accessibilityLabel="Set up my month"
						style={[styles.emptyCta, { backgroundColor: p.gold }]}
					>
						<Text
							style={[
								styles.emptyCtaLabel,
								{ color: p.accentInk, fontFamily: t.ui },
							]}
						>
							Set up my month
						</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]}>
			<MissionContent
				data={data}
				onRefresh={refresh}
				onDismissPrompt={() => void dismissPrompt()}
			/>
		</SafeAreaView>
	);
}

function MissionContent({
	data,
	onRefresh,
	onDismissPrompt,
}: {
	data: MonthlyMissionData;
	onRefresh: () => Promise<void>;
	onDismissPrompt: () => void;
}) {
	const { p, t, d } = getNorthTokens();
	const firstName = useFirstName();
	const { mission, promptDismissed } = data;
	const { steps, toggleDone } = useStepCompletion(mission.id, data.steps);
	const { days: streakDays, rhythm } = useMissionStreaks();

	const [showCalendar, setShowCalendar] = useState(false);
	const [showGoal, setShowGoal] = useState(false);
	const [nudgeWaved, setNudgeWaved] = useState(false);
	const [refreshing, setRefreshing] = useState(false);

	async function pullRefresh() {
		setRefreshing(true);
		await onRefresh();
		setRefreshing(false);
	}

	const today = todayInAST();
	const view = useMemo(() => deriveMissionView(steps, today), [steps, today]);
	const { weekly, currentWeekIndex, focalStep, weeksDone } = view;

	const weeksTotal = weekly.length || 4;
	const goalPct = weeksDone / weeksTotal;
	const isTemplate = mission.generated_by === "template";
	const showNudge = isTemplate && !promptDismissed && !nudgeWaved;

	function waveOffNudge() {
		setNudgeWaved(true);
		onDismissPrompt();
	}

	return (
		<ScrollView
			contentContainerStyle={[
				styles.body,
				{ paddingHorizontal: d.scrnPad, paddingTop: 24, paddingBottom: 40 },
			]}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={() => void pullRefresh()}
					tintColor={p.inkMid}
					colors={[p.goldInk]}
				/>
			}
		>
			{/* ── Greeting + rhythm chip + quiet actions ────────────── */}
			<Rise>
				<View style={styles.headerRow}>
					<View style={styles.headerCopy}>
						<Text
							style={[styles.greeting, { color: p.ink, fontFamily: t.display }]}
						>
							{greetingForNow()}
							{firstName ? `, ${firstName}` : ""} 👋
						</Text>
						<Text
							style={[
								styles.greetingSub,
								{ color: p.inkMid, fontFamily: t.ui },
							]}
						>
							Let's take one step forward.
						</Text>
					</View>
					<View style={styles.headerActions}>
						<Pressable
							onPress={() => setShowCalendar(true)}
							accessibilityRole="button"
							accessibilityLabel="Open month calendar"
							style={[
								styles.iconBtn,
								{ backgroundColor: p.surface, borderColor: p.line },
							]}
						>
							<Icon name="calendar" size={17} color={p.inkMid} />
						</Pressable>
						<Pressable
							onPress={() => setShowGoal(true)}
							accessibilityRole="button"
							accessibilityLabel={
								isTemplate ? "Set your goal" : "Edit your goal"
							}
							style={[
								styles.iconBtn,
								{ backgroundColor: p.surface, borderColor: p.line },
							]}
						>
							<Icon name="circleDot" size={17} color={p.inkMid} />
						</Pressable>
					</View>
				</View>
				<View style={{ marginTop: 10 }}>
					<StreakChip count={rhythm} />
				</View>
			</Rise>

			{/* ── Starter-goal nudge (quiet, dismissible, never a modal) ─ */}
			{showNudge ? (
				<Rise delay={staggerDelay(1)} style={{ marginTop: d.gap }}>
					<View
						style={[
							styles.nudge,
							{ backgroundColor: p.surface, borderColor: p.line },
						]}
					>
						<Text
							style={[styles.nudgeBody, { color: p.inkMid, fontFamily: t.ui }]}
						>
							<Text style={{ color: p.ink, fontWeight: "700" }}>
								This is a starter goal.
							</Text>{" "}
							Set one that's truly yours whenever you're ready.
						</Text>
						<View style={styles.nudgeActions}>
							{/* Quiet by design: gold stays reserved for today's step —
							    the one next action — so this is an ink outline. */}
							<TouchableOpacity
								onPress={() => setShowGoal(true)}
								accessibilityRole="button"
								accessibilityLabel="Set your goal"
								style={[styles.nudgeBtn, { borderColor: p.lineHi }]}
							>
								<Text
									style={[
										styles.nudgeBtnLabel,
										{ color: p.ink, fontFamily: t.ui },
									]}
								>
									Set your goal
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={waveOffNudge}
								accessibilityRole="button"
								accessibilityLabel="Maybe later"
								style={styles.nudgeDismiss}
							>
								<Text
									style={[
										styles.nudgeDismissLabel,
										{ color: p.inkMid, fontFamily: t.ui },
									]}
								>
									Maybe later
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</Rise>
			) : null}

			{/* ── Goal card: title + gold progress ring ─────────────── */}
			<Rise delay={staggerDelay(1)} style={{ marginTop: d.gapLg }}>
				<Card p={p}>
					<View style={styles.missionRow}>
						<View style={styles.missionCopy}>
							<Text
								style={[styles.eyebrow, { color: p.goldInk, fontFamily: t.ui }]}
							>
								This month's mission
							</Text>
							<Text
								style={[styles.title, { color: p.ink, fontFamily: t.display }]}
							>
								{mission.goal_title}
							</Text>
							{mission.goal_intent ? (
								<Text
									style={[styles.intent, { color: p.inkMid, fontFamily: t.ui }]}
								>
									{mission.goal_intent}
								</Text>
							) : null}
						</View>
						<ProgressRing
							p={p}
							value={goalPct}
							size={72}
							strokeWidth={7}
							// Gold = the needle: this month's goal is the next action.
							color={p.gold}
							trackColor="rgba(13,19,33,0.07)"
							accessibilityLabel={`${weeksDone} of ${weeksTotal} weekly milestones done`}
						>
							<Text
								style={[
									styles.ringPct,
									{ color: p.ink, fontFamily: t.display },
								]}
							>
								{Math.round(goalPct * 100)}%
							</Text>
						</ProgressRing>
					</View>
					<Text
						style={[
							styles.progressLabel,
							{ color: p.inkDim, fontFamily: t.ui },
						]}
					>
						Week {currentWeekIndex + 1} of {weeksTotal} · {weeksDone} of{" "}
						{weeksTotal} milestones banked
					</Text>
				</Card>
			</Rise>

			{/* ── Today's one small step / earned celebration ───────── */}
			{focalStep && !focalStep.done ? (
				<Rise delay={staggerDelay(2)} style={{ marginTop: d.gap }}>
					<View
						style={[
							styles.stepCard,
							{
								backgroundColor: p.accentSoft,
								borderColor: `${p.gold}66`,
							},
						]}
					>
						<View style={styles.stepHeader}>
							<Icon name="circleDot" size={14} color={p.goldInk} />
							<Text
								style={[
									styles.eyebrow,
									{ color: p.goldInk, fontFamily: t.ui, marginBottom: 0 },
								]}
							>
								Today's one small step
							</Text>
						</View>
						<Text
							style={[
								styles.stepLabel,
								{ color: p.ink, fontFamily: t.editorial },
							]}
						>
							{focalStep.title}
						</Text>
						{focalStep.estimate_label ? (
							<Text
								style={[styles.estimate, { color: p.inkMid, fontFamily: t.ui }]}
							>
								{focalStep.estimate_label}
							</Text>
						) : null}
						<TouchableOpacity
							onPress={() => {
								arrive();
								void toggleDone(focalStep.id);
							}}
							accessibilityRole="button"
							accessibilityLabel={`Complete step: ${focalStep.title}`}
							style={[styles.stepBtn, { backgroundColor: p.gold }]}
						>
							<Text
								style={[
									styles.stepBtnLabel,
									{ color: p.accentInk, fontFamily: t.ui },
								]}
							>
								Complete step
							</Text>
						</TouchableOpacity>
					</View>
				</Rise>
			) : null}

			{/* Completion — quiet, earned, no confetti. The gold slot the
			    step callout held all day becomes the celebration. */}
			{focalStep?.done ? (
				<Rise delay={staggerDelay(2)} style={{ marginTop: d.gap }}>
					<CelebrationCard stepId={focalStep.id} rhythmStreak={rhythm} />
				</Rise>
			) : null}

			{/* ── The 4-week plan ───────────────────────────────────── */}
			<View style={[styles.taskList, { marginTop: d.gapLg, gap: d.gap }]}>
				{weekly.map((step, i) => (
					<Rise key={step.id} delay={staggerDelay(i + 3)}>
						<MilestoneItem
							step={step}
							weekLabel={`Week ${i + 1}`}
							current={i === currentWeekIndex}
							onToggle={() => {
								tap();
								void toggleDone(step.id);
							}}
						/>
					</Rise>
				))}
			</View>

			{/* ── Check-in ──────────────────────────────────────────── */}
			{focalStep ? (
				<Rise delay={staggerDelay(4)} style={{ marginTop: d.gapLg }}>
					<CheckInCard missionId={focalStep.id} />
				</Rise>
			) : null}

			{/* ── Habits ────────────────────────────────────────────── */}
			<Rise delay={staggerDelay(4)} style={{ marginTop: d.gap }}>
				<HabitsSection />
			</Rise>

			{/* Sheets */}
			<MonthCalendarSheet
				visible={showCalendar}
				onClose={() => setShowCalendar(false)}
				days={streakDays}
			/>
			<SetGoalSheet
				visible={showGoal}
				onClose={() => setShowGoal(false)}
				monthStart={mission.month_start}
				initialGoal={isTemplate ? "" : mission.goal_title}
				autosuggest={isTemplate}
				onGoalSet={() => void onRefresh()}
			/>
		</ScrollView>
	);
}

function MilestoneItem({
	step,
	weekLabel,
	current,
	onToggle,
}: {
	step: MissionStep;
	weekLabel: string;
	current: boolean;
	onToggle: () => void;
}) {
	const { p, t, d } = getNorthTokens();

	return (
		<Pressable
			onPress={onToggle}
			accessibilityRole="checkbox"
			accessibilityState={{ checked: step.done }}
			accessibilityLabel={`${weekLabel}: ${step.title}`}
			style={({ pressed }) => [
				styles.taskRow,
				{
					// Teal = on-course: a banked milestone is progress, not the needle.
					backgroundColor: step.done ? `${p.teal}14` : p.surface,
					borderColor: step.done ? `${p.teal}59` : p.line,
					borderWidth: 1,
					borderRadius: 14,
					paddingHorizontal: d.scrnPad,
					paddingVertical: 14,
					opacity: pressed ? 0.85 : 1,
				},
			]}
		>
			{/* Checkbox circle */}
			<View
				style={[
					styles.checkbox,
					{
						borderColor: step.done ? p.teal : p.lineHi,
						backgroundColor: step.done ? p.teal : "transparent",
					},
				]}
			>
				{step.done ? (
					<Icon name="check" size={14} color={p.accentInk} strokeWidth={2.5} />
				) : null}
			</View>

			{/* Label + week */}
			<View style={styles.taskText}>
				<Text
					style={[
						styles.taskLabel,
						{
							color: step.done ? p.inkMid : p.ink,
							fontFamily: t.ui,
							textDecorationLine: step.done ? "line-through" : "none",
						},
					]}
					numberOfLines={3}
				>
					{step.title}
				</Text>
				<Text
					style={[
						styles.estimate,
						{
							color: current && !step.done ? p.goldInk : p.inkDim,
							fontFamily: t.ui,
							fontWeight: current && !step.done ? "700" : "400",
						},
					]}
				>
					{current && !step.done ? `${weekLabel} · this week` : weekLabel}
				</Text>
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1 },
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 32,
	},
	pole: { width: 72, height: 88, marginBottom: 18 },
	emptyTitle: { fontSize: 24, marginBottom: 8, textAlign: "center" },
	emptySub: { fontSize: 14, lineHeight: 21, textAlign: "center" },
	emptyCta: {
		marginTop: 20,
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 12,
	},
	emptyCtaLabel: { fontSize: 14, fontWeight: "700" },
	body: { flexGrow: 1 },
	headerRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 12,
	},
	headerCopy: { flex: 1 },
	headerActions: { flexDirection: "row", gap: 8, marginTop: 2 },
	iconBtn: {
		width: 38,
		height: 38,
		borderRadius: 19,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	greeting: { fontSize: 24, lineHeight: 30, letterSpacing: -0.5 },
	greetingSub: { fontSize: 14, lineHeight: 20, marginTop: 4 },
	nudge: {
		borderWidth: 1,
		borderRadius: 14,
		padding: 14,
		gap: 12,
	},
	nudgeBody: { fontSize: 13, lineHeight: 19 },
	nudgeActions: { flexDirection: "row", alignItems: "center", gap: 10 },
	nudgeBtn: {
		paddingHorizontal: 14,
		paddingVertical: 9,
		borderRadius: 10,
		borderWidth: 1,
	},
	nudgeBtnLabel: { fontSize: 13, fontWeight: "700" },
	nudgeDismiss: { paddingHorizontal: 6, paddingVertical: 9 },
	nudgeDismissLabel: { fontSize: 13, fontWeight: "600" },
	eyebrow: {
		fontSize: 10,
		fontWeight: "700",
		letterSpacing: 1.4,
		textTransform: "uppercase",
		marginBottom: 8,
	},
	missionRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
	},
	missionCopy: { flex: 1 },
	title: {
		fontSize: 20,
		lineHeight: 26,
		letterSpacing: -0.3,
		marginBottom: 6,
	},
	intent: { fontSize: 13, lineHeight: 19 },
	ringPct: { fontSize: 16, lineHeight: 20 },
	progressLabel: { fontSize: 12, marginTop: 12 },
	stepCard: {
		borderWidth: 1,
		borderRadius: 18,
		padding: 16,
	},
	stepHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginBottom: 8,
	},
	stepLabel: { fontSize: 16, lineHeight: 23 },
	stepBtn: {
		marginTop: 14,
		paddingVertical: 12,
		borderRadius: 12,
		alignItems: "center",
	},
	stepBtnLabel: { fontSize: 14, fontWeight: "700" },
	taskList: {},
	taskRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
	checkbox: {
		width: 24,
		height: 24,
		borderRadius: 12,
		borderWidth: 1.5,
		alignItems: "center",
		justifyContent: "center",
		marginTop: 1,
		flexShrink: 0,
	},
	taskText: { flex: 1, gap: 4 },
	taskLabel: { fontSize: 15, lineHeight: 22 },
	estimate: { fontSize: 12 },
});
