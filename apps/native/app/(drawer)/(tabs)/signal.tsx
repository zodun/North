// Signal tab (SIG-02 / SIG-03 / AI-06).

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

import { PeopleSection } from "@/components/signal/PeopleSection";
import { supabase } from "@/lib/auth-client";
import { usePeople } from "@/lib/signal/use-people";
import { type SignalBand, useSignalData } from "@/lib/signal/use-signal-data";

// ── Band segment configs ──────────────────────────────────────────────

const BAND_SEGS: Record<SignalBand, string[]> = {
	Drifting: [
		"#E8B84B",
		"#E8B84B",
		"#E8B84B55",
		"#E8B84B33",
		"#1C2537",
		"#1C2537",
		"#1C2537",
	],
	Finding: [
		"#1C2537",
		"#1C2537",
		"#E8B84B33",
		"#E8B84B55",
		"#E8B84B",
		"#E8B84B",
		"#1C2537",
	],
	Aligned: [
		"#1C2537",
		"#1C2537",
		"#1C2537",
		"#E8B84B33",
		"#E8B84B55",
		"#E8B84B",
		"#E8B84B",
	],
};

const BAND_ORDER: SignalBand[] = ["Drifting", "Finding", "Aligned"];

// ── Band bar ──────────────────────────────────────────────────────────

function BandBar({
	band,
	provisional,
	p,
	t,
}: {
	band: SignalBand;
	provisional: boolean;
	p: ReturnType<typeof getTokens>["p"];
	t: ReturnType<typeof getTokens>["t"];
}) {
	const segs = BAND_SEGS[band];
	return (
		<View>
			<Text
				style={[
					styles.eyebrow,
					{ color: p.inkDim, fontFamily: t.ui, marginBottom: 12 },
				]}
			>
				YOUR SIGNAL
			</Text>
			<View style={{ flexDirection: "row", gap: 5, marginBottom: 10 }}>
				{[...segs.entries()].map(([pos, color]) => (
					<View
						key={pos}
						style={{
							flex: 1,
							height: 8,
							borderRadius: 4,
							backgroundColor: color,
						}}
					/>
				))}
			</View>
			<View
				style={{
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "baseline",
				}}
			>
				{BAND_ORDER.map((label) => {
					const isActive = label === band;
					return (
						<Text
							key={label}
							style={[
								isActive ? styles.bandActive : styles.bandInactive,
								{
									color: isActive ? p.accent : p.inkDim,
									fontFamily: isActive ? t.display : t.ui,
									fontWeight: isActive
										? (String(t.displayWeight) as "400")
										: "400",
									fontStyle:
										isActive && t.editorialItalic ? "italic" : "normal",
								},
							]}
						>
							{label}
						</Text>
					);
				})}
			</View>
			{provisional ? (
				<Text
					style={[
						styles.provisional,
						{ color: p.inkDim, fontFamily: t.ui, marginTop: 6 },
					]}
				>
					Provisional, building signal
				</Text>
			) : null}
		</View>
	);
}

// ── Sparkline card ────────────────────────────────────────────────────

const BAND_SCORE: Record<SignalBand, number> = {
	Drifting: 20,
	Finding: 55,
	Aligned: 90,
};

function SparklineCard({
	bands,
	trend,
	weekEnding,
	p,
	t,
}: {
	bands: SignalBand[];
	trend: "climbing" | "holding" | "easing";
	weekEnding: string;
	p: ReturnType<typeof getTokens>["p"];
	t: ReturnType<typeof getTokens>["t"];
}) {
	if (bands.length < 2) return null;

	const trendColor =
		trend === "climbing" ? "#4ECCA3" : trend === "easing" ? p.warn : p.inkDim;
	const trendLabel =
		trend === "climbing"
			? "↑ climbing"
			: trend === "easing"
				? "↓ easing"
				: "→ holding";

	const endDate = new Date(weekEnding);
	const startDate = new Date(endDate);
	startDate.setDate(startDate.getDate() - (bands.length - 1) * 7);
	const fmt = (d: Date) =>
		d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

	// View-based bar sparkline — avoids react-native-svg entirely
	const scores = bands.map((b) => BAND_SCORE[b] ?? 50);
	const maxScore = Math.max(...scores, 1);

	return (
		<Card p={p}>
			<View
				style={{
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 12,
				}}
			>
				<Text style={[styles.cardTitle, { color: p.ink, fontFamily: t.ui }]}>
					{bands.length} week trend
				</Text>
				<Text
					style={{
						fontSize: 12,
						fontWeight: "600",
						color: trendColor,
						fontFamily: t.ui,
					}}
				>
					{trendLabel}
				</Text>
			</View>
			<View
				style={{
					flexDirection: "row",
					alignItems: "flex-end",
					gap: 4,
					height: 48,
				}}
			>
				{[...scores.entries()].map(([pos, score]) => {
					const isLast = pos === scores.length - 1;
					const barH = Math.max(4, (score / maxScore) * 44);
					const alpha = isLast
						? "FF"
						: Math.round(80 + (pos / scores.length) * 175)
								.toString(16)
								.padStart(2, "0");
					return (
						<View
							key={pos}
							style={{
								flex: 1,
								height: barH,
								borderRadius: 3,
								backgroundColor: isLast ? p.accent : `${p.accent}${alpha}`,
							}}
						/>
					);
				})}
			</View>
			<View
				style={{
					flexDirection: "row",
					justifyContent: "space-between",
					marginTop: 5,
				}}
			>
				<Text style={[styles.dateLabel, { color: p.inkDim, fontFamily: t.ui }]}>
					{fmt(startDate)}
				</Text>
				<Text style={[styles.dateLabel, { color: p.inkDim, fontFamily: t.ui }]}>
					{fmt(endDate)}
				</Text>
			</View>
		</Card>
	);
}

// ── Signal · Noise callouts card ──────────────────────────────────────

const DOT_COLORS = ["#4ECCA3", "#E8B84B", "#C084FC", "#4ECCA3"];

function CalloutCard({
	callouts,
	weekEnding,
	ratings,
	p,
	t,
	onRated,
}: {
	callouts: { label: string; body: string }[];
	weekEnding: string;
	ratings: Record<number, "up" | "down">;
	p: ReturnType<typeof getTokens>["p"];
	t: ReturnType<typeof getTokens>["t"];
	onRated: (idx: number, rating: "up" | "down") => void;
}) {
	if (callouts.length === 0) return null;
	return (
		<Card p={p}>
			<Text
				style={[
					styles.eyebrow,
					{ color: p.inkDim, fontFamily: t.ui, marginBottom: 12 },
				]}
			>
				SIGNAL · NOISE
			</Text>
			{callouts.map((callout, i) => (
				<View
					key={callout.label}
					style={[{ marginBottom: i < callouts.length - 1 ? 12 : 0 }]}
				>
					<View
						style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}
					>
						<View
							style={{
								width: 7,
								height: 7,
								borderRadius: 3.5,
								backgroundColor: DOT_COLORS[i % DOT_COLORS.length],
								marginTop: 5,
							}}
						/>
						<Text
							style={[
								styles.calloutBody,
								{ color: p.inkMid, fontFamily: t.ui, flex: 1 },
							]}
						>
							{callout.body}
						</Text>
					</View>
					<View style={{ paddingLeft: 19 }}>
						<ThumbsRow
							calloutIdx={i}
							weekEnding={weekEnding}
							currentRating={ratings[i]}
							p={p}
							t={t}
							onRated={onRated}
						/>
					</View>
				</View>
			))}
		</Card>
	);
}

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

	return (
		<View style={thumbs.row}>
			<TouchableOpacity onPress={() => void rate("up")} hitSlop={8}>
				<Text
					style={[
						thumbs.label,
						{
							color: p.accent,
							fontFamily: t.ui,
							opacity: currentRating === "up" ? 1 : currentRating ? 0.4 : 1,
						},
					]}
				>
					▲ Helpful
				</Text>
			</TouchableOpacity>
			<TouchableOpacity onPress={() => void rate("down")} hitSlop={8}>
				<Text
					style={[
						thumbs.label,
						{
							color: p.warn,
							fontFamily: t.ui,
							opacity: currentRating === "down" ? 1 : currentRating ? 0.4 : 1,
						},
					]}
				>
					▼ Not quite
				</Text>
			</TouchableOpacity>
		</View>
	);
}

const thumbs = StyleSheet.create({
	row: { flexDirection: "row", gap: 16, marginTop: 8 },
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
	submitBtn: { paddingVertical: 10, borderRadius: 8, alignItems: "center" },
	submitLabel: { fontSize: 14, fontWeight: "500" },
});

// ── Activity breakdown stat ───────────────────────────────────────────

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

// ── Main screen ───────────────────────────────────────────────────────

export default function Signal() {
	const { p, t, d } = getTokens("warm", "humanist", "calm");
	const { data, loading, error, refresh } = useSignalData();
	const people = usePeople();
	const [ratings, setRatings] = useState<Record<number, "up" | "down">>({});

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
					<View style={styles.headerRow}>
						<Text
							style={[
								styles.heading,
								{
									color: p.ink,
									fontFamily: t.display,
									fontWeight: String(t.displayWeight) as "400",
								},
							]}
						>
							Signal
						</Text>
					</View>
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

	const coherencePct =
		data.inputs.meaningfulTotal > 0
			? Math.round(
					(data.inputs.meaningfulInFocus / data.inputs.meaningfulTotal) * 100,
				)
			: null;

	const weekLabel = (() => {
		const d = new Date(data.weekEnding);
		return `Week of ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
	})();

	return (
		<SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]}>
			<ScrollView
				contentContainerStyle={[
					styles.body,
					{ paddingHorizontal: d.scrnPad, paddingTop: 16, paddingBottom: 48 },
				]}
				showsVerticalScrollIndicator={false}
			>
				{/* ── Header ────────────────────────────────────────────── */}
				<View style={[styles.headerRow, { marginBottom: 16 }]}>
					<Text
						style={[
							styles.heading,
							{
								color: p.ink,
								fontFamily: t.display,
								fontWeight: String(t.displayWeight) as "400",
								fontStyle: t.editorialItalic ? "italic" : "normal",
							},
						]}
					>
						Signal
					</Text>
					<Text
						style={[styles.weekLabel, { color: p.inkDim, fontFamily: t.ui }]}
					>
						{weekLabel}
					</Text>
				</View>

				{/* ── Band card ─────────────────────────────────────────── */}
				<View style={{ marginBottom: d.gap }}>
					<Card p={p}>
						<BandBar
							band={data.band}
							provisional={data.provisional}
							p={p}
							t={t}
						/>
					</Card>
				</View>

				{/* ── Sparkline card ────────────────────────────────────── */}
				{data.recentBands.length > 1 ? (
					<View style={{ marginBottom: d.gap }}>
						<SparklineCard
							bands={data.recentBands}
							trend={data.trend}
							weekEnding={data.weekEnding}
							p={p}
							t={t}
						/>
					</View>
				) : null}

				{/* ── Weekly narrative ──────────────────────────────────── */}
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

				{/* ── Signal · Noise callouts ───────────────────────────── */}
				{data.callouts.length > 0 ? (
					<View style={{ marginBottom: d.gap }}>
						<CalloutCard
							callouts={data.callouts}
							weekEnding={data.weekEnding}
							ratings={mergedRatings}
							p={p}
							t={t}
							onRated={handleRated}
						/>
					</View>
				) : null}

				{/* ── Activity breakdown ────────────────────────────────── */}
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
								value={coherencePct !== null ? `${coherencePct}%` : "N/A"}
								label="in focus"
								p={p}
								t={t}
							/>
						</View>
					</Card>
				</View>

				{/* ── People ───────────────────────────────────────────── */}
				<View style={{ marginBottom: d.gap }}>
					<PeopleSection
						people={people.people}
						goals={people.goals}
						checkIns={people.checkIns}
						weekEnding={people.weekEnding}
						monthKey={people.monthKey}
						p={p}
						t={t}
						onAddPerson={async (name) => {
							await people.addPerson(name);
						}}
						onSaveCheckIn={people.upsertCheckIn}
						onSaveGoal={people.upsertGoal}
					/>
				</View>

				{/* ── Reflection ────────────────────────────────────────── */}
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

const styles = StyleSheet.create({
	safe: { flex: 1 },
	center: { flex: 1, alignItems: "center", justifyContent: "center" },
	body: { flexGrow: 1 },
	headerRow: {
		flexDirection: "row",
		alignItems: "baseline",
		justifyContent: "space-between",
	},
	heading: { fontSize: 28, lineHeight: 34 },
	weekLabel: { fontSize: 11 },
	eyebrow: {
		fontSize: 10,
		fontWeight: "600",
		letterSpacing: 2,
		textTransform: "uppercase",
		marginBottom: 10,
	},
	bandActive: { fontSize: 18, fontWeight: "600" },
	bandInactive: { fontSize: 11 },
	provisional: { fontSize: 11, fontStyle: "italic" },
	cardTitle: { fontSize: 13, fontWeight: "600" },
	dateLabel: { fontSize: 10 },
	narrative: { fontSize: 14, lineHeight: 22 },
	calloutBody: { fontSize: 13, lineHeight: 20 },
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
