// "Set your goal" — pageSheet modal for the monthly mission: one clear,
// measurable goal for the cycle. plan-month breaks it into 4 weekly
// milestones + a daily step (AI with a server fallback). Same modal
// posture as the app's other sheets; one gold CTA.
//
// A suggestion (from the user's onboarding) is offered as a tap-to-use
// hint below the field — never auto-inserted, the field stays the user's
// own to type in.

import { Icon } from "@north/native-ui";
import { getNorthTokens } from "@north/tokens";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import { useSetGoal } from "@/lib/mission/use-set-goal";

type Props = {
	visible: boolean;
	onClose: () => void;
	/** The mission's cycle anchor (monthly_missions.month_start). */
	monthStart: string;
	/** Current goal, offered as tap-to-edit when the goal is user-authored. */
	initialGoal: string;
	/** Ask plan-month for a goal idea (still-template goals only). */
	autosuggest: boolean;
	/** Called after a successful re-plan so the screen can refresh. */
	onGoalSet: () => void;
};

export function SetGoalSheet({
	visible,
	onClose,
	monthStart,
	initialGoal,
	autosuggest,
	onGoalSet,
}: Props) {
	const { p, t, d } = getNorthTokens();
	const { suggest, setGoal, submitting } = useSetGoal();

	const [goal, setGoalText] = useState("");
	const [measure, setMeasure] = useState("");
	const [suggestion, setSuggestion] = useState<string | null>(null);
	const [suggesting, setSuggesting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!visible || !autosuggest) return;
		let cancelled = false;
		setSuggesting(true);
		void suggest(monthStart).then((s) => {
			if (cancelled) return;
			setSuggestion(s);
			setSuggesting(false);
		});
		return () => {
			cancelled = true;
		};
	}, [visible, autosuggest, monthStart, suggest]);

	function reset() {
		setGoalText("");
		setMeasure("");
		setError(null);
	}

	function handleClose() {
		if (submitting) return;
		reset();
		onClose();
	}

	async function handleSubmit() {
		setError(null);
		const result = await setGoal({ title: goal, measure, monthStart });
		if (result.ok) {
			reset();
			onGoalSet();
			onClose();
		} else {
			setError(result.message);
		}
	}

	// Tap-to-use pre-fill, never auto-inserted: the AI idea for a fresh goal,
	// or the current goal when editing an existing one.
	const preset = autosuggest ? suggestion : initialGoal.trim() || null;
	const presetLabel = autosuggest
		? "Need an idea? Tap to use"
		: "Your current goal. Tap to edit it";

	const canSubmit =
		goal.trim().length > 0 && measure.trim().length > 0 && !submitting;

	const inputStyle = [
		styles.input,
		{
			backgroundColor: p.surface,
			borderColor: p.line,
			color: p.ink,
			fontFamily: t.ui,
		},
	];

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={handleClose}
		>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={[styles.flex, { backgroundColor: p.bg }]}
			>
				<View style={[styles.header, { borderBottomColor: p.line }]}>
					<Text
						style={[
							styles.headerTitle,
							{ color: p.ink, fontFamily: t.display },
						]}
					>
						Set your goal
					</Text>
					<Pressable
						onPress={handleClose}
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
					keyboardShouldPersistTaps="handled"
				>
					<Text style={[styles.lede, { color: p.inkMid, fontFamily: t.ui }]}>
						One clear, measurable thing to make happen over the next four weeks.
						North breaks it into weekly milestones and one small step a day.
					</Text>

					<View style={styles.labelRow}>
						<Text style={[styles.label, { color: p.inkDim, fontFamily: t.ui }]}>
							YOUR GOAL
						</Text>
						{suggesting ? (
							<Text
								style={[
									styles.suggesting,
									{ color: p.inkDim, fontFamily: t.ui },
								]}
							>
								Finding an idea for you…
							</Text>
						) : null}
					</View>
					<TextInput
						value={goal}
						onChangeText={setGoalText}
						placeholder="e.g. Ship the first version of my side project"
						placeholderTextColor={p.inkDim}
						style={[...inputStyle, styles.goalInput]}
						maxLength={140}
						multiline
						accessibilityLabel="Your goal"
					/>
					{preset && goal.trim() !== preset ? (
						<Pressable
							onPress={() => setGoalText(preset)}
							accessibilityRole="button"
							accessibilityLabel={`Use goal: ${preset}`}
							style={[
								styles.preset,
								{ backgroundColor: p.surface, borderColor: p.line },
							]}
						>
							<Text
								style={[
									styles.presetLabel,
									{ color: p.goldInk, fontFamily: t.ui },
								]}
							>
								{presetLabel}
							</Text>
							<Text
								style={[styles.presetBody, { color: p.ink, fontFamily: t.ui }]}
							>
								{preset}
							</Text>
						</Pressable>
					) : null}

					<Text style={[styles.label, { color: p.inkDim, fontFamily: t.ui }]}>
						I'LL KNOW IT'S DONE WHEN…
					</Text>
					<TextInput
						value={measure}
						onChangeText={setMeasure}
						placeholder="the app is live with 50 users"
						placeholderTextColor={p.inkDim}
						style={inputStyle}
						maxLength={120}
						accessibilityLabel="How you'll know it's done"
					/>

					{error ? (
						<Text style={[styles.error, { color: p.redInk, fontFamily: t.ui }]}>
							{error}
						</Text>
					) : null}

					<TouchableOpacity
						onPress={() => void handleSubmit()}
						disabled={!canSubmit}
						accessibilityRole="button"
						accessibilityLabel="Set my goal"
						style={[
							styles.cta,
							{ backgroundColor: p.gold, opacity: canSubmit ? 1 : 0.4 },
						]}
					>
						{submitting ? (
							<View style={styles.ctaBusy}>
								<ActivityIndicator size="small" color={p.accentInk} />
								<Text
									style={[
										styles.ctaLabel,
										{ color: p.accentInk, fontFamily: t.ui },
									]}
								>
									Planning your month…
								</Text>
							</View>
						) : (
							<Text
								style={[
									styles.ctaLabel,
									{ color: p.accentInk, fontFamily: t.ui },
								]}
							>
								Set my goal
							</Text>
						)}
					</TouchableOpacity>
				</ScrollView>
			</KeyboardAvoidingView>
		</Modal>
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
	lede: { fontSize: 14, lineHeight: 21, marginBottom: 20 },
	labelRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	label: {
		fontSize: 10,
		fontWeight: "700",
		letterSpacing: 1.4,
		marginBottom: 8,
		marginTop: 4,
	},
	suggesting: { fontSize: 11, marginBottom: 8 },
	input: {
		borderWidth: 1,
		borderRadius: 14,
		paddingHorizontal: 14,
		paddingVertical: 12,
		fontSize: 15,
		marginBottom: 14,
	},
	goalInput: { minHeight: 68, textAlignVertical: "top" },
	preset: {
		borderWidth: 1,
		borderRadius: 14,
		paddingHorizontal: 14,
		paddingVertical: 12,
		marginTop: -6,
		marginBottom: 14,
		gap: 2,
	},
	presetLabel: {
		fontSize: 10,
		fontWeight: "700",
		letterSpacing: 1.2,
		textTransform: "uppercase",
	},
	presetBody: { fontSize: 13.5, lineHeight: 19 },
	error: { fontSize: 13, lineHeight: 19, marginBottom: 4 },
	cta: {
		marginTop: 10,
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		minHeight: 48,
	},
	ctaBusy: { flexDirection: "row", alignItems: "center", gap: 8 },
	ctaLabel: { fontSize: 15, fontWeight: "700" },
});
