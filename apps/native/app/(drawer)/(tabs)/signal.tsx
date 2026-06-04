// Signal tab (SIG-02 / SIG-03 / AI-06).
//
// SIG-02: band (never the raw number) + trend + weekly AI narrative +
//         callouts + activity breakdown. Sparse and reflective, not
//         surveillance-y.
// SIG-03: thumbs up/down rating on each callout → callout_ratings.
// AI-06:  weekly free-text reflection → reflect Edge Function.

import { Card } from "@north/native-ui";
import { getTokens } from "@north/tokens";
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
import { type SignalBand, useSignalData } from "@/lib/signal/use-signal-data";

// ── Band display helpers ──────────────────────────────────────────────

function bandColor(
	band: SignalBand,
	p: ReturnType<typeof getTokens>["p"],
): string {
	if (band === "Aligned") return p.accent;
	if (band === "Finding") return p.inkMid;
	return p.warn;
}

const TREND_SYMBOL: Record<string, string> = {
	climbing: "↑",
	holding: "→",
	easing: "↓",
};

// ── Band history sparkline ────────────────────────────────────────────

function BandSparkline({
	bands,
	p,
}: {
	bands: SignalBand[];
	p: ReturnType<typeof getTokens>["p"];
}) {
	return (
		<View style={spark.row}>
			{Array.from(bands.entries()).map(([i, band]) => (
				<View
					key={`dot-${i}`}
					style={[
						spark.dot,
						{
							backgroundColor: bandColor(band, p),
							opacity:
								i === bands.length - 1
									? 1
									: 0.35 + 0.65 * (i / (bands.length - 1)),
						},
					]}
				/>
			))}
		</View>
	);
}

const spark = StyleSheet.create({
	row: { flexDirection: "row", gap: 5, alignItems: "center" },
	dot: { width: 8, height: 8, borderRadius: 4 },
});

// ── Thumbs rating ─────────────────────────────────────────────────────

function ThumbsRow({
	calloutIdx,
	weekEnding,
	currentRating,
	p,
	t,
	onRated,
}: {
	calloutIdx: number;
	weekEnding: string;
	currentRating: "up" | "down" | undefined;
	p: ReturnType<typeof getTokens>["p"];
	t: ReturnType<typeof getTokens>["t"];
	onRated: (idx: number, rating: "up" | "down") => void;
}) {
	const [saving, setSaving] = useState(false);

	async function rate(rating: "up" | "down") {
		if (saving) return;
		setSaving(true);
		onRated(calloutIdx, rating);
		await supabase
			.from("callout_ratings")
			.upsert(
				{ callout_idx: calloutIdx, week_ending: weekEnding, rating },
				{ onConflict: "user_id,week_ending,callout_idx" },
			);
		setSaving(false);
	}

	const active = { opacity: 1 };
	const inactive = { opacity: 0.4 };

	return (
		<View style={thumbs.row}>
			<TouchableOpacity
				onPress={() => void rate("up")}
				style={thumbs.btn}
				hitSlop={8}
			>
				<Text
					style={[
						thumbs.label,
						{ color: p.accent, fontFamily: t.ui },
						currentRating === "up" ? active : currentRating ? inactive : active,
					]}
				>
					▲ Helpful
				</Text>
			</TouchableOpacity>
			<TouchableOpacity
				onPress={() => void rate("down")}
				style={thumbs.btn}
				hitSlop={8}
			>
				<Text
					style={[
						thumbs.label,
						{ color: p.warn, fontFamily: t.ui },
						currentRating === "down"
							? active
							: currentRating
								? inactive
								: active,
					]}
				>
					▼ Not quite
				</Text>
			</TouchableOpacity>
		</View>
	);
}

const thumbs = StyleSheet.create({
	row: { flexDirection: "row", gap: 16, marginTop: 10 },
	btn: {},
	label: { fontSize: 12 },
});

// ── Reflection entry ──────────────────────────────────────────────────

function ReflectionCard({
	weekEnding,
	lastReflection,
	p,
	t,
	onSubmitted,
}: {
	weekEnding: string;
	lastReflection: {
		body: string;
		analysis: { themes: string[]; nudge: string } | null;
	} | null;
	p: ReturnType<typeof getTokens>["p"];
	t: ReturnType<typeof getTokens>["t"];
	onSubmitted: () => void;
}) {
	const [text, setText] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [localAnalysis, setLocalAnalysis] = useState<{
		themes: string[];
		nudge: string;
	} | null>(lastReflection?.analysis ?? null);

	async function submit() {
		if (!text.trim() || submitting) return;
		setSubmitting(true);
		try {
			const { data, error } = await supabase.functions.invoke("reflect", {
				body: { body: text.trim(), week_ending: weekEnding },
			});
			if (!error && data?.analysis) {
				setLocalAnalysis(data.analysis as { themes: string[]; nudge: string });
			}
			setText("");
			onSubmitted();
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Card p={p}>
			<Text style={[styles.eyebrow, { color: p.inkDim, fontFamily: t.ui }]}>
				CARRY FORWARD
			</Text>
			{localAnalysis ? (
				<View style={{ marginBottom: 14 }}>
					<View style={reflect.themeRow}>
						{localAnalysis.themes.map((theme) => (
							<View
								key={theme}
								style={[
									reflect.pill,
									{
										backgroundColor: `${p.accent}22`,
										borderColor: `${p.accent}44`,
									},
								]}
							>
								<Text
									style={[
										reflect.pillText,
										{ color: p.accent, fontFamily: t.ui },
									]}
								>
									{theme}
								</Text>
							</View>
						))}
					</View>
					<Text style={[reflect.nudge, { color: p.inkMid, fontFamily: t.ui }]}>
						{localAnalysis.nudge}
					</Text>
				</View>
			) : null}
			<TextInput
				value={text}
				onChangeText={setText}
				placeholder="What do you want to carry forward this week?"
				placeholderTextColor={p.inkDim}
				multiline
				maxLength={1000}
				style={[
					reflect.input,
					{
						color: p.ink,
						fontFamily: t.ui,
						borderColor: `${p.accent}33`,
						backgroundColor: `${p.accent}0a`,
					},
				]}
			/>
			<TouchableOpacity
				onPress={() => void submit()}
				disabled={!text.trim() || submitting}
				style={[
					reflect.submitBtn,
					{
						backgroundColor:
							text.trim() && !submitting ? p.accent : `${p.accent}44`,
					},
				]}
			>
				{submitting ? (
					<ActivityIndicator color={p.bg} size="small" />
				) : (
					<Text
						style={[reflect.submitLabel, { color: p.bg, fontFamily: t.ui }]}
					>
						Reflect
					</Text>
				)}
			</TouchableOpacity>
		</Card>
	);
}

const reflect = StyleSheet.create({
	themeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
	pill: {
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 12,
		borderWidth: 1,
	},
	pillText: { fontSize: 11, fontWeight: "500" },
	nudge: { fontSize: 13, lineHeight: 18, fontStyle: "italic" },
	input: {
		borderWidth: 1,
		borderRadius: 8,
		padding: 10,
		fontSize: 14,
		lineHeight: 20,
		minHeight: 72,
		textAlignVertical: "top",
		marginBottom: 10,
	},
	submitBtn: {
		paddingVertical: 10,
		borderRadius: 8,
		alignItems: "center",
	},
	submitLabel: { fontSize: 14, fontWeight: "500" },
});

// ── Main screen ───────────────────────────────────────────────────────

export default function Signal() {
	const { p, t, d } = getTokens("warm", "humanist", "calm");
	const { data, loading, error, refresh } = useSignalData();
	const [ratings, setRatings] = useState<Record<number, "up" | "down">>({});

	// Merge local optimistic ratings with loaded ratings.
	const mergedRatings = { ...(data?.ratings ?? {}), ...ratings };

	function handleRated(idx: number, rating: "up" | "down") {
		setRatings((prev) => ({ ...prev, [idx]: rating }));
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

	// No score yet — first week.
	if (!data) {
		return (
			<SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]}>
				<ScrollView
					contentContainerStyle={[
						styles.body,
						{ paddingHorizontal: d.scrnPad, paddingTop: 32, paddingBottom: 48 },
					]}
					showsVerticalScrollIndicator={false}
				>
					<Text
						style={[
							styles.eyebrow,
							{ color: p.inkDim, fontFamily: t.ui, marginBottom: 20 },
						]}
					>
						SIGNAL
					</Text>
					<Card p={p}>
						<Text
							style={[
								styles.emptyHeading,
								{
									color: p.ink,
									fontFamily: t.display,
									fontWeight: String(t.displayWeight) as "400",
									fontStyle: t.editorialItalic ? "italic" : "normal",
								},
							]}
						>
							Keep going.
						</Text>
						<Text
							style={[styles.emptyBody, { color: p.inkMid, fontFamily: t.ui }]}
						>
							Your Signal score will appear here after your first full week of
							activity. Complete tasks, engage with content, and come back on
							Sunday.
						</Text>
					</Card>
				</ScrollView>
			</SafeAreaView>
		);
	}

	const trendColor =
		data.trend === "climbing"
			? p.accent
			: data.trend === "easing"
				? p.warn
				: p.inkDim;

	const coherencePct =
		data.inputs.meaningfulTotal > 0
			? Math.round(
					(data.inputs.meaningfulInFocus / data.inputs.meaningfulTotal) * 100,
				)
			: null;

	return (
		<SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]}>
			<ScrollView
				contentContainerStyle={[
					styles.body,
					{ paddingHorizontal: d.scrnPad, paddingTop: 32, paddingBottom: 48 },
				]}
				showsVerticalScrollIndicator={false}
			>
				<Text style={[styles.eyebrow, { color: p.inkDim, fontFamily: t.ui }]}>
					SIGNAL
				</Text>

				{/* ── Band card ────────────────────────────────────────── */}
				<View style={{ marginBottom: d.gap }}>
					<Card p={p}>
						<View style={styles.bandRow}>
							<Text
								style={[
									styles.bandName,
									{
										color: bandColor(data.band, p),
										fontFamily: t.display,
										fontWeight: String(t.displayWeight) as "400",
										fontStyle: t.editorialItalic ? "italic" : "normal",
									},
								]}
							>
								{data.band}
							</Text>
							<Text
								style={[
									styles.trend,
									{ color: trendColor, fontFamily: t.mono },
								]}
							>
								{TREND_SYMBOL[data.trend]} {data.trend}
							</Text>
						</View>
						{data.provisional ? (
							<Text
								style={[
									styles.provisional,
									{ color: p.inkDim, fontFamily: t.ui },
								]}
							>
								Provisional — building signal
							</Text>
						) : null}
						{data.recentBands.length > 1 ? (
							<View style={{ marginTop: 14 }}>
								<BandSparkline bands={data.recentBands} p={p} />
							</View>
						) : null}
					</Card>
				</View>

				{/* ── Weekly narrative ─────────────────────────────────── */}
				<View style={{ marginBottom: d.gap }}>
					<Card p={p}>
						<Text
							style={[styles.eyebrow, { color: p.inkDim, fontFamily: t.ui }]}
						>
							THIS WEEK
						</Text>
						{data.summary ? (
							<Text
								style={[
									styles.narrative,
									{ color: p.inkMid, fontFamily: t.ui },
								]}
							>
								{data.summary}
							</Text>
						) : (
							<Text
								style={[
									styles.narrative,
									{ color: p.inkDim, fontFamily: t.ui, fontStyle: "italic" },
								]}
							>
								Your weekly summary arrives on Sunday after the analysis runs.
							</Text>
						)}
					</Card>
				</View>

				{/* ── Callouts ─────────────────────────────────────────── */}
				{data.callouts.map((callout, i) => (
					<View key={callout.label} style={{ marginBottom: d.gap }}>
						<Card p={p}>
							<Text
								style={[
									styles.calloutLabel,
									{ color: p.ink, fontFamily: t.ui },
								]}
							>
								{callout.label}
							</Text>
							<Text
								style={[
									styles.calloutBody,
									{ color: p.inkMid, fontFamily: t.ui },
								]}
							>
								{callout.body}
							</Text>
							<ThumbsRow
								calloutIdx={i}
								weekEnding={data.weekEnding}
								currentRating={mergedRatings[i]}
								p={p}
								t={t}
								onRated={handleRated}
							/>
						</Card>
					</View>
				))}

				{/* ── Activity breakdown ───────────────────────────────── */}
				<View style={{ marginBottom: d.gap }}>
					<Card p={p}>
						<Text
							style={[styles.eyebrow, { color: p.inkDim, fontFamily: t.ui }]}
						>
							HOW IT BROKE DOWN
						</Text>
						<View style={styles.statGrid}>
							<StatItem
								value={`${data.inputs.activeDays}/7`}
								label="active days"
								p={p}
								t={t}
							/>
							<StatItem
								value={`${data.inputs.completedTasks}/${data.inputs.assignedTasks}`}
								label="tasks done"
								p={p}
								t={t}
							/>
							<StatItem
								value={coherencePct !== null ? `${coherencePct}%` : "—"}
								label="in focus"
								p={p}
								t={t}
							/>
						</View>
					</Card>
				</View>

				{/* ── Reflection ───────────────────────────────────────── */}
				<ReflectionCard
					weekEnding={data.weekEnding}
					lastReflection={data.lastReflection}
					p={p}
					t={t}
					onSubmitted={refresh}
				/>
			</ScrollView>
		</SafeAreaView>
	);
}

function StatItem({
	value,
	label,
	p,
	t,
}: {
	value: string;
	label: string;
	p: ReturnType<typeof getTokens>["p"];
	t: ReturnType<typeof getTokens>["t"];
}) {
	return (
		<View style={styles.statItem}>
			<Text
				style={[
					styles.statValue,
					{
						color: p.ink,
						fontFamily: t.display,
						fontWeight: String(t.displayWeight) as "400",
					},
				]}
			>
				{value}
			</Text>
			<Text style={[styles.statLabel, { color: p.inkDim, fontFamily: t.ui }]}>
				{label}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1 },
	center: { flex: 1, alignItems: "center", justifyContent: "center" },
	body: { flexGrow: 1 },
	eyebrow: {
		fontSize: 11,
		fontWeight: "500",
		letterSpacing: 2,
		marginBottom: 10,
	},
	bandRow: {
		flexDirection: "row",
		alignItems: "baseline",
		justifyContent: "space-between",
	},
	bandName: { fontSize: 36, lineHeight: 40 },
	trend: { fontSize: 13 },
	provisional: { fontSize: 11, marginTop: 4, fontStyle: "italic" },
	narrative: { fontSize: 14, lineHeight: 22 },
	calloutLabel: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
	calloutBody: { fontSize: 14, lineHeight: 20 },
	statGrid: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 4,
	},
	statItem: { flex: 1, alignItems: "center" },
	statValue: { fontSize: 28, lineHeight: 32 },
	statLabel: { fontSize: 11, marginTop: 2 },
	emptyHeading: { fontSize: 28, lineHeight: 34, marginBottom: 10 },
	emptyBody: { fontSize: 14, lineHeight: 22 },
});
