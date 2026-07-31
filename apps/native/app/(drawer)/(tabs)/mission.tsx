// Mission tab (MSN-02).
//
// Shows today's AI-generated mission + 3-task checklist with:
// - Overall progress bar (0/3 → 3/3)
// - Per-task completion toggle (optimistic, offline-retry per MSN-04)
// - PostHog events on completion (MSN-05)
// - Calm empty state when no mission has been assigned yet

import { Card, Icon, ProgressRing, Rise, staggerDelay } from "@north/native-ui";
import { getNorthTokens } from "@north/tokens";
import {
	Image,
	Pressable,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useTaskCompletion } from "@/lib/mission/use-task-completion";
import type { MissionTask } from "@/lib/mission/use-today-mission";
import { useTodayMission } from "@/lib/mission/use-today-mission";
import { useFirstName } from "@/lib/profile/use-display-name";

function greetingForNow(): string {
	const hour = new Date().getHours();
	if (hour < 12) return "Good morning";
	if (hour < 18) return "Good afternoon";
	return "Good evening";
}

export default function Mission() {
	const { p, t } = getNorthTokens();
	const { mission, loading, error } = useTodayMission();

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

	if (!mission) {
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
						Your mission for today will appear here once assigned.
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]}>
			<MissionContent
				missionId={mission.id}
				title={mission.title}
				intent={mission.intent}
				tasks={mission.tasks}
			/>
		</SafeAreaView>
	);
}

function MissionContent({
	missionId,
	title,
	intent,
	tasks: initialTasks,
}: {
	missionId: string;
	title: string | null;
	intent: string | null;
	tasks: MissionTask[];
}) {
	const { p, t, d } = getNorthTokens();
	const firstName = useFirstName();
	const { tasks, toggleDone, completedCount, progress } = useTaskCompletion(
		missionId,
		initialTasks,
	);

	const allDone = tasks.length > 0 && completedCount === tasks.length;
	const nextStep = tasks.find((task) => !task.done) ?? null;

	return (
		<ScrollView
			contentContainerStyle={[
				styles.body,
				{ paddingHorizontal: d.scrnPad, paddingTop: 24, paddingBottom: 40 },
			]}
		>
			{/* ── Greeting ──────────────────────────────────────────── */}
			<Rise>
				<Text
					style={[styles.greeting, { color: p.ink, fontFamily: t.display }]}
				>
					{greetingForNow()}
					{firstName ? `, ${firstName}` : ""} 👋
				</Text>
				<Text
					style={[styles.greetingSub, { color: p.inkMid, fontFamily: t.ui }]}
				>
					Let's take one step forward.
				</Text>
			</Rise>

			{/* ── Mission card: title + gold progress ring ──────────── */}
			<Rise delay={staggerDelay(1)} style={{ marginTop: d.gapLg }}>
				<Card p={p}>
					<View style={styles.missionRow}>
						<View style={styles.missionCopy}>
							<Text
								style={[styles.eyebrow, { color: p.goldInk, fontFamily: t.ui }]}
							>
								Today's mission
							</Text>
							{title ? (
								<Text
									style={[
										styles.title,
										{ color: p.ink, fontFamily: t.display },
									]}
								>
									{title}
								</Text>
							) : null}
							{intent ? (
								<Text
									style={[styles.intent, { color: p.inkMid, fontFamily: t.ui }]}
								>
									{intent}
								</Text>
							) : null}
						</View>
						<ProgressRing
							p={p}
							value={progress}
							size={72}
							strokeWidth={7}
							// Gold = the needle: today's mission is the next action.
							color={p.gold}
							trackColor="rgba(13,19,33,0.07)"
							accessibilityLabel={`${completedCount} of ${tasks.length} steps done`}
						>
							<Text
								style={[
									styles.ringPct,
									{ color: p.ink, fontFamily: t.display },
								]}
							>
								{Math.round(progress * 100)}%
							</Text>
						</ProgressRing>
					</View>
					<Text
						style={[
							styles.progressLabel,
							{ color: p.inkDim, fontFamily: t.ui },
						]}
					>
						{completedCount} of {tasks.length} steps done
					</Text>
				</Card>
			</Rise>

			{/* ── Today's one small step ────────────────────────────── */}
			{nextStep ? (
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
							{nextStep.label}
						</Text>
						{nextStep.estimate_label ? (
							<Text
								style={[styles.estimate, { color: p.inkMid, fontFamily: t.ui }]}
							>
								{nextStep.estimate_label}
							</Text>
						) : null}
						<TouchableOpacity
							onPress={() => void toggleDone(nextStep.id)}
							accessibilityRole="button"
							accessibilityLabel={`Complete step: ${nextStep.label}`}
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

			{/* ── Step list ─────────────────────────────────────────── */}
			<View style={[styles.taskList, { marginTop: d.gapLg, gap: d.gap }]}>
				{tasks.map((task, i) => (
					<Rise key={task.id} delay={staggerDelay(i + 3)}>
						<TaskItem task={task} onToggle={() => void toggleDone(task.id)} />
					</Rise>
				))}
			</View>

			{/* Completion — quiet, earned, no confetti. */}
			{allDone ? (
				<Rise style={{ marginTop: d.gapLg }}>
					<View
						style={[
							styles.doneCard,
							{
								backgroundColor: p.accentSoft,
								borderColor: `${p.gold}66`,
							},
						]}
					>
						<Icon name="arrowUp" size={18} color={p.goldInk} strokeWidth={2} />
						<View style={{ flex: 1, gap: 2 }}>
							<Text
								style={[
									styles.doneTitle,
									{ color: p.ink, fontFamily: t.editorial },
								]}
							>
								Pointed north today.
							</Text>
							<Text
								style={[styles.doneSub, { color: p.inkMid, fontFamily: t.ui }]}
							>
								Every step done. The rest of the day is yours.
							</Text>
						</View>
					</View>
				</Rise>
			) : null}
		</ScrollView>
	);
}

function TaskItem({
	task,
	onToggle,
}: {
	task: MissionTask;
	onToggle: () => void;
}) {
	const { p, t, d } = getNorthTokens();

	return (
		<Pressable
			onPress={onToggle}
			accessibilityRole="checkbox"
			accessibilityState={{ checked: task.done }}
			accessibilityLabel={task.label}
			style={({ pressed }) => [
				styles.taskRow,
				{
					// Teal = on-course: a completed task is progress, not the needle.
					backgroundColor: task.done ? `${p.teal}14` : p.surface,
					borderColor: task.done ? `${p.teal}59` : p.line,
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
						borderColor: task.done ? p.teal : p.lineHi,
						backgroundColor: task.done ? p.teal : "transparent",
					},
				]}
			>
				{task.done ? (
					<Icon name="check" size={14} color={p.accentInk} strokeWidth={2.5} />
				) : null}
			</View>

			{/* Label + estimate */}
			<View style={styles.taskText}>
				<Text
					style={[
						styles.taskLabel,
						{
							color: task.done ? p.inkMid : p.ink,
							fontFamily: t.ui,
							textDecorationLine: task.done ? "line-through" : "none",
						},
					]}
					numberOfLines={3}
				>
					{task.label}
				</Text>
				{task.estimate_label ? (
					<Text
						style={[styles.estimate, { color: p.inkDim, fontFamily: t.ui }]}
					>
						{task.estimate_label}
					</Text>
				) : null}
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
	body: { flexGrow: 1 },
	greeting: { fontSize: 24, lineHeight: 30, letterSpacing: -0.5 },
	greetingSub: { fontSize: 14, lineHeight: 20, marginTop: 4 },
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
	doneCard: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		borderWidth: 1,
		borderRadius: 14,
		paddingHorizontal: 16,
		paddingVertical: 14,
	},
	doneTitle: { fontSize: 15 },
	doneSub: { fontSize: 12, lineHeight: 17 },
});
