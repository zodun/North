// Mission tab (MSN-02).
//
// Shows today's AI-generated mission + 3-task checklist with:
// - Overall progress bar (0/3 → 3/3)
// - Per-task completion toggle (optimistic, offline-retry per MSN-04)
// - PostHog events on completion (MSN-05)
// - Calm empty state when no mission has been assigned yet

import { Icon, ProgressBar } from "@north/native-ui";
import { getTokens } from "@north/tokens";
import {
	Pressable,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { useTaskCompletion } from "@/lib/mission/use-task-completion";
import type { MissionTask } from "@/lib/mission/use-today-mission";
import { useTodayMission } from "@/lib/mission/use-today-mission";

export default function Mission() {
	const { p, t, d } = getTokens("warm", "humanist", "calm");
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
					<Text
						style={[
							styles.emptyTitle,
							{
								color: p.ink,
								fontFamily: t.display,
								fontWeight: String(t.displayWeight) as "400",
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
	const { p, t, d } = getTokens("warm", "humanist", "calm");
	const { tasks, toggleDone, completedCount, progress } = useTaskCompletion(
		missionId,
		initialTasks,
	);

	return (
		<ScrollView
			contentContainerStyle={[
				styles.body,
				{ paddingHorizontal: d.scrnPad, paddingTop: 32, paddingBottom: 40 },
			]}
		>
			{/* Eyebrow */}
			<Text style={[styles.eyebrow, { color: p.accent, fontFamily: t.ui }]}>
				Today
			</Text>

			{/* Mission title */}
			{title ? (
				<Text
					style={[
						styles.title,
						{
							color: p.ink,
							fontFamily: t.display,
							fontWeight: String(t.displayWeight) as "400",
							fontStyle: t.editorialItalic ? "italic" : "normal",
						},
					]}
				>
					{title}
				</Text>
			) : null}

			{/* Mission intent */}
			{intent ? (
				<Text style={[styles.intent, { color: p.inkMid, fontFamily: t.ui }]}>
					{intent}
				</Text>
			) : null}

			{/* Progress */}
			<View style={[styles.progressRow, { marginTop: d.gapLg }]}>
				<View style={styles.progressBar}>
					<ProgressBar p={p} value={progress} height={3} />
				</View>
				<Text
					style={[styles.progressLabel, { color: p.inkDim, fontFamily: t.ui }]}
				>
					{completedCount} of {tasks.length}
				</Text>
			</View>

			{/* Task list */}
			<View style={[styles.taskList, { marginTop: d.gapLg, gap: d.gap }]}>
				{tasks.map((task) => (
					<TaskItem
						key={task.id}
						task={task}
						onToggle={() => void toggleDone(task.id)}
					/>
				))}
			</View>
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
	const { p, t, d } = getTokens("warm", "humanist", "calm");

	return (
		<Pressable
			onPress={onToggle}
			accessibilityRole="checkbox"
			accessibilityState={{ checked: task.done }}
			accessibilityLabel={task.label}
			style={({ pressed }) => [
				styles.taskRow,
				{
					backgroundColor: p.surface,
					borderColor: task.done ? p.accent : p.line,
					borderWidth: 1,
					borderRadius: 12,
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
						borderColor: task.done ? p.accent : p.lineHi,
						backgroundColor: task.done ? p.accent : "transparent",
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
	emptyTitle: { fontSize: 24, marginBottom: 8, textAlign: "center" },
	emptySub: { fontSize: 14, lineHeight: 21, textAlign: "center" },
	body: { flexGrow: 1 },
	eyebrow: {
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 0.8,
		textTransform: "uppercase",
		marginBottom: 12,
	},
	title: {
		fontSize: 28,
		lineHeight: 36,
		letterSpacing: -0.5,
		marginBottom: 10,
	},
	intent: { fontSize: 15, lineHeight: 22 },
	progressRow: { flexDirection: "row", alignItems: "center", gap: 10 },
	progressBar: { flex: 1 },
	progressLabel: {
		fontSize: 12,
		fontWeight: "600",
		minWidth: 40,
		textAlign: "right",
	},
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
