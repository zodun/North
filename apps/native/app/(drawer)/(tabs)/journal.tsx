// Journal tab — the reflection surface, promoted from a card inside
// Signal to its own tab in the sheet restructure. Write (or later,
// speak) what the week meant; the AI reads it back as themes and one
// nudge. Blue is the journal's section accent in the tab bar; inside
// the surface, gold still marks the one next action (the Reflect CTA).

import { Card, Rise, staggerDelay } from "@north/native-ui";
import { getNorthTokens } from "@north/tokens";
import { useState } from "react";
import {
	ActivityIndicator,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import { supabase } from "@/lib/auth-client";
import { useSignalData } from "@/lib/signal/use-signal-data";

export default function Journal() {
	const { p, t, d } = getNorthTokens();
	const { data, loading, refresh } = useSignalData();

	const [text, setText] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [localAnalysis, setLocalAnalysis] = useState<{
		themes: string[];
		nudge: string;
	} | null>(null);

	const lastReflection = data?.lastReflection ?? null;
	const analysis = localAnalysis ?? lastReflection?.analysis ?? null;
	const weekEnding = data?.weekEnding ?? null;

	async function submit() {
		if (!text.trim() || submitting || !weekEnding) return;
		setSubmitting(true);
		try {
			const { data: res, error } = await supabase.functions.invoke("reflect", {
				body: { body: text.trim(), week_ending: weekEnding },
			});
			if (!error && res?.analysis) {
				setLocalAnalysis(res.analysis as { themes: string[]; nudge: string });
			}
			setText("");
			refresh();
		} finally {
			setSubmitting(false);
		}
	}

	if (loading) {
		return (
			<SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]}>
				<View style={styles.center}>
					<ActivityIndicator color={p.accent} />
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]}>
			<ScrollView
				contentContainerStyle={{
					paddingHorizontal: d.scrnPad,
					paddingTop: 16,
					paddingBottom: 48,
				}}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
			>
				<Rise>
					<View style={{ marginBottom: 20 }}>
						<Text
							style={[styles.heading, { color: p.ink, fontFamily: t.display }]}
						>
							Journal
						</Text>
						<Text
							style={[styles.subHeading, { color: p.inkMid, fontFamily: t.ui }]}
						>
							Say what the week meant. North listens for the signal.
						</Text>
					</View>
				</Rise>

				{/* ── Write ─────────────────────────────────────────────── */}
				<Rise delay={staggerDelay(1)} style={{ marginBottom: d.gap }}>
					<Card p={p}>
						<Text
							style={[styles.eyebrow, { color: p.inkDim, fontFamily: t.ui }]}
						>
							CARRY FORWARD
						</Text>
						<TextInput
							value={text}
							onChangeText={setText}
							placeholder="What do you want to carry forward this week?"
							placeholderTextColor={p.inkDim}
							multiline
							maxLength={1000}
							style={[
								styles.input,
								{
									color: p.ink,
									fontFamily: t.ui,
									borderColor: p.line,
									backgroundColor: p.surfaceHi,
								},
							]}
						/>
						<TouchableOpacity
							onPress={() => void submit()}
							disabled={!text.trim() || submitting || !weekEnding}
							accessibilityRole="button"
							accessibilityLabel="Save reflection"
							style={[
								styles.submitBtn,
								{
									backgroundColor:
										text.trim() && !submitting && weekEnding
											? p.gold
											: `${p.gold}55`,
								},
							]}
						>
							{submitting ? (
								<ActivityIndicator color={p.accentInk} size="small" />
							) : (
								<Text
									style={[
										styles.submitLabel,
										{ color: p.accentInk, fontFamily: t.ui },
									]}
								>
									Reflect
								</Text>
							)}
						</TouchableOpacity>
						{!weekEnding ? (
							<Text
								style={[styles.hint, { color: p.inkDim, fontFamily: t.ui }]}
							>
								Reflections open after your first week of activity.
							</Text>
						) : null}
					</Card>
				</Rise>

				{/* ── What North heard ──────────────────────────────────── */}
				{analysis ? (
					<Rise delay={staggerDelay(2)} style={{ marginBottom: d.gap }}>
						<Card p={p}>
							<Text
								style={[styles.eyebrow, { color: p.inkDim, fontFamily: t.ui }]}
							>
								WHAT NORTH HEARD
							</Text>
							<View style={styles.themeRow}>
								{analysis.themes.map((theme) => (
									<View
										key={theme}
										style={[
											styles.pill,
											{
												backgroundColor: `${p.teal}1f`,
												borderColor: `${p.teal}47`,
											},
										]}
									>
										<Text
											style={[
												styles.pillText,
												{ color: p.tealInk, fontFamily: t.ui },
											]}
										>
											{theme}
										</Text>
									</View>
								))}
							</View>
							<Text
								style={[styles.nudge, { color: p.inkMid, fontFamily: t.ui }]}
							>
								{analysis.nudge}
							</Text>
						</Card>
					</Rise>
				) : null}

				{/* ── Last entry ────────────────────────────────────────── */}
				{lastReflection?.body ? (
					<Rise delay={staggerDelay(3)}>
						<Card p={p}>
							<Text
								style={[styles.eyebrow, { color: p.inkDim, fontFamily: t.ui }]}
							>
								LAST ENTRY
							</Text>
							<Text
								style={[styles.entry, { color: p.inkMid, fontFamily: t.ui }]}
							>
								{lastReflection.body}
							</Text>
						</Card>
					</Rise>
				) : null}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1 },
	center: { flex: 1, alignItems: "center", justifyContent: "center" },
	heading: { fontSize: 26, lineHeight: 32, letterSpacing: -0.5 },
	subHeading: { fontSize: 13, lineHeight: 19, marginTop: 4 },
	eyebrow: {
		fontSize: 10,
		fontWeight: "600",
		letterSpacing: 2,
		textTransform: "uppercase",
		marginBottom: 10,
	},
	input: {
		borderWidth: 1,
		borderRadius: 8,
		padding: 10,
		fontSize: 14,
		lineHeight: 20,
		minHeight: 96,
		textAlignVertical: "top",
		marginBottom: 10,
	},
	submitBtn: { paddingVertical: 10, borderRadius: 8, alignItems: "center" },
	submitLabel: { fontSize: 14, fontWeight: "500" },
	hint: { fontSize: 12, marginTop: 8, fontStyle: "italic" },
	themeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
	pill: {
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 12,
		borderWidth: 1,
	},
	pillText: { fontSize: 11, fontWeight: "500" },
	nudge: { fontSize: 13, lineHeight: 18, fontStyle: "italic" },
	entry: { fontSize: 14, lineHeight: 22 },
});
