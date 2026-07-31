// Signal — the honest mirror (SIG-02 / SIG-03 / AI-06). Lives in the
// drawer since the sheet restructure; the Journal and Community tabs
// now own reflection and people.

import { Card, ProgressRing, Rise, staggerDelay } from "@north/native-ui";
import { getNorthTokens } from "@north/tokens";
import { useState } from "react";
import {
	ActivityIndicator,
	Image,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Svg, { Circle, Polyline } from "react-native-svg";

import { supabase } from "@/lib/auth-client";
import { type SignalBand, useSignalData } from "@/lib/signal/use-signal-data";

// ── Band semantics (Three-Meaning Rule) ───────────────────────────────
//
// The ring arc is a FILL, so it may carry the vivid band hue; every word
// of text stays on the ink variants to hold ≥4.5:1 on white.

const BAND_FILL: Record<SignalBand, string> = {
	Drifting: "#6C5CE7",
	Finding: "#16A085",
	Aligned: "#F0B429",
};

const BAND_INK: Record<SignalBand, string> = {
	Drifting: "#5546C8",
	Finding: "#0E7A66",
	Aligned: "#8A6400",
};

const BAND_STATUS: Record<SignalBand, string> = {
	Drifting: "Drifting",
	Finding: "Finding course",
	Aligned: "On course",
};

const BAND_SUB: Record<SignalBand, string> = {
	Drifting: "Pointing away this week. One small step brings it back.",
	Finding: "Coming around. Keep the rhythm you started.",
	Aligned: "Pointing north. Your actions match your focus.",
};

// ── Score hero: the Direction Score ring ──────────────────────────────

function ScoreHero({
	score,
	band,
	provisional,
	p,
	t,
}: {
	score: number;
	band: SignalBand;
	provisional: boolean;
	p: ReturnType<typeof getNorthTokens>["p"];
	t: ReturnType<typeof getNorthTokens>["t"];
}) {
	return (
		<View style={{ alignItems: "center" }}>
			<ProgressRing
				p={p}
				value={score / 100}
				size={168}
				strokeWidth={11}
				color={BAND_FILL[band]}
				trackColor="rgba(13,19,33,0.07)"
				accessibilityLabel={`Direction Score ${score} out of 100, ${BAND_STATUS[band]}`}
			>
				<Text
					style={[styles.scoreValue, { color: p.ink, fontFamily: t.display }]}
				>
					{score}
				</Text>
				<Text
					style={[styles.scoreOutOf, { color: p.inkDim, fontFamily: t.ui }]}
				>
					/100
				</Text>
				<Text
					style={[styles.scoreCaption, { color: p.inkDim, fontFamily: t.ui }]}
				>
					Direction Score
				</Text>
			</ProgressRing>
			<Text
				style={[
					styles.bandStatus,
					{ color: BAND_INK[band], fontFamily: t.editorial, marginTop: 16 },
				]}
			>
				{BAND_STATUS[band]}
			</Text>
			<Text
				style={[
					styles.bandSub,
					{ color: p.inkMid, fontFamily: t.ui, textAlign: "center" },
				]}
			>
				{BAND_SUB[band]}
			</Text>
			{provisional ? (
				<Text
					style={[styles.provisional, { color: p.inkDim, fontFamily: t.ui }]}
				>
					Provisional, building signal
				</Text>
			) : null}
		</View>
	);
}

// ── Stat tiles (2×2) ──────────────────────────────────────────────────

function StatTile({
	value,
	label,
	caption,
	valueColor,
	p,
	t,
}: {
	value: string;
	label: string;
	caption: string;
	valueColor?: string;
	p: ReturnType<typeof getNorthTokens>["p"];
	t: ReturnType<typeof getNorthTokens>["t"];
}) {
	return (
		<View
			style={[
				styles.statTile,
				{ backgroundColor: p.surface, borderColor: p.line },
			]}
		>
			<Text
				style={[styles.statTileLabel, { color: p.inkDim, fontFamily: t.ui }]}
			>
				{label}
			</Text>
			<Text
				style={[
					styles.statTileValue,
					{ color: valueColor ?? p.ink, fontFamily: t.display },
				]}
			>
				{value}
			</Text>
			<Text
				style={[styles.statTileCaption, { color: p.inkDim, fontFamily: t.ui }]}
			>
				{caption}
			</Text>
		</View>
	);
}

// ── Direction over time ───────────────────────────────────────────────

const CHART_H = 96;

function ScoreTrendCard({
	scores,
	weekEnding,
	p,
	t,
}: {
	scores: number[];
	weekEnding: string;
	p: ReturnType<typeof getNorthTokens>["p"];
	t: ReturnType<typeof getNorthTokens>["t"];
}) {
	const [width, setWidth] = useState(0);
	if (scores.length < 2) return null;

	const endDate = new Date(weekEnding);
	const startDate = new Date(endDate);
	startDate.setDate(startDate.getDate() - (scores.length - 1) * 7);
	const fmt = (d: Date) =>
		d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

	const pad = 6;
	const pts = scores.map((s, i) => {
		const x = pad + (i / (scores.length - 1)) * (Math.max(width, 1) - pad * 2);
		const y = pad + (1 - s / 100) * (CHART_H - pad * 2);
		return { x, y };
	});
	const last = pts[pts.length - 1];

	return (
		<Card p={p}>
			<Text style={[styles.eyebrow, { color: p.inkDim, fontFamily: t.ui }]}>
				DIRECTION OVER TIME
			</Text>
			<View
				style={{ height: CHART_H }}
				onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
			>
				{width > 0 ? (
					<Svg width={width} height={CHART_H}>
						<Polyline
							points={pts.map((pt) => `${pt.x},${pt.y}`).join(" ")}
							fill="none"
							// Teal = on-course: the trend line is progress, not the needle.
							stroke={p.teal}
							strokeWidth={2.5}
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						{last ? (
							<Circle cx={last.x} cy={last.y} r={4.5} fill={p.teal} />
						) : null}
					</Svg>
				) : null}
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
//
// The honest pair: green = what energized you, red = what pulled you
// away. Reserved for exactly this semantic (DESIGN.md).

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
	p: ReturnType<typeof getNorthTokens>["p"];
	t: ReturnType<typeof getNorthTokens>["t"];
	onRated: (idx: number, rating: "up" | "down") => void;
}) {
	const [expansions, setExpansions] = useState<Record<number, string>>({});
	const [expanding, setExpanding] = useState<Record<number, boolean>>({});
	const [expanded, setExpanded] = useState<Record<number, boolean>>({});

	async function expandCallout(idx: number, body: string, label: string) {
		if (expanding[idx]) return;
		if (expansions[idx]) {
			setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }));
			return;
		}
		setExpanded((prev) => ({ ...prev, [idx]: true }));
		setExpanding((prev) => ({ ...prev, [idx]: true }));
		try {
			const { data } = await supabase.functions.invoke("callout-expand", {
				body: { body, label },
			});
			const text =
				data && typeof data.expansion === "string" ? data.expansion : null;
			if (text) setExpansions((prev) => ({ ...prev, [idx]: text }));
		} finally {
			setExpanding((prev) => ({ ...prev, [idx]: false }));
		}
	}

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
			{callouts.map((callout, i) => {
				const isNoise = callout.label.toLowerCase().includes("noise");
				const expandColor = isNoise ? p.redInk : p.greenInk;
				return (
					<View
						key={callout.label}
						style={[{ marginBottom: i < callouts.length - 1 ? 16 : 0 }]}
					>
						<View
							style={{
								flexDirection: "row",
								alignItems: "flex-start",
								gap: 12,
							}}
						>
							<View
								style={{
									width: 7,
									height: 7,
									borderRadius: 3.5,
									backgroundColor: isNoise ? p.red : p.green,
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
						{expanded[i] && (
							<View
								style={{
									marginTop: 8,
									marginLeft: 19,
									paddingHorizontal: 10,
									paddingVertical: 8,
									borderRadius: 8,
									borderLeftWidth: 2,
									borderLeftColor: `${expandColor}55`,
									backgroundColor: `${expandColor}0d`,
								}}
							>
								{expanding[i] ? (
									<ActivityIndicator size="small" color={expandColor} />
								) : expansions[i] ? (
									<Text
										style={{
											fontSize: 12,
											lineHeight: 18,
											color: p.inkMid,
											fontFamily: t.ui,
										}}
									>
										{expansions[i]}
									</Text>
								) : null}
							</View>
						)}
						<View style={{ paddingLeft: 19, marginTop: 6 }}>
							<TouchableOpacity
								onPress={() =>
									void expandCallout(i, callout.body, callout.label)
								}
								hitSlop={8}
							>
								<Text
									style={{
										fontSize: 11,
										fontWeight: "600",
										color: expandColor,
										fontFamily: t.ui,
										marginBottom: 4,
									}}
								>
									{expanded[i] ? "Show less" : "Read more"}
								</Text>
							</TouchableOpacity>
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
				);
			})}
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
	p: ReturnType<typeof getNorthTokens>["p"];
	t: ReturnType<typeof getNorthTokens>["t"];
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
							color: p.goldInk,
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

// ── Main screen ───────────────────────────────────────────────────────

export default function Signal() {
	const { p, t, d } = getNorthTokens();
	const { data, loading, error } = useSignalData();
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
								},
							]}
						>
							Signal
						</Text>
					</View>
					<Card p={p}>
						{/* Pole leans forward — the signal is still building. */}
						<Image
							source={require("../../assets/images/pole/pole-leaning.png")}
							style={styles.pole}
							resizeMode="contain"
							accessibilityElementsHidden
						/>
						<Text
							style={[
								styles.emptyHeading,
								{
									color: p.ink,
									fontFamily: t.display,
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
				<Rise>
					<View style={{ marginBottom: 20 }}>
						<Text
							style={[
								styles.heading,
								{
									color: p.ink,
									fontFamily: t.display,
									fontStyle: t.editorialItalic ? "italic" : "normal",
								},
							]}
						>
							Your Direction Signal
						</Text>
						<Text
							style={[styles.subHeading, { color: p.inkMid, fontFamily: t.ui }]}
						>
							This is your honest reflection. · {weekLabel}
						</Text>
					</View>
				</Rise>

				{/* ── Score ring card ───────────────────────────────────── */}
				<Rise delay={staggerDelay(1)} style={{ marginBottom: d.gap }}>
					<Card p={p} padding={24}>
						<ScoreHero
							score={data.score}
							band={data.band}
							provisional={data.provisional}
							p={p}
							t={t}
						/>
					</Card>
				</Rise>

				{/* ── Stat tiles (2×2) ──────────────────────────────────── */}
				<Rise delay={staggerDelay(2)} style={{ marginBottom: d.gap }}>
					<View style={styles.tileGrid}>
						<StatTile
							value={`${data.inputs.activeDays}`}
							label="Active Days"
							caption="this week"
							p={p}
							t={t}
						/>
						<StatTile
							value={
								data.inputs.assignedTasks > 0
									? `${Math.round(
											(data.inputs.completedTasks / data.inputs.assignedTasks) *
												100,
										)}%`
									: "—"
							}
							label="Follow Through"
							caption={`${data.inputs.completedTasks} of ${data.inputs.assignedTasks} tasks`}
							p={p}
							t={t}
						/>
						<StatTile
							value={coherencePct !== null ? `${coherencePct}%` : "—"}
							label="Focus Match"
							caption={
								coherencePct !== null ? "of activity in focus" : "no data yet"
							}
							p={p}
							t={t}
						/>
						<StatTile
							value={
								data.trend === "climbing"
									? "↑"
									: data.trend === "easing"
										? "↓"
										: "→"
							}
							label="Trend"
							caption={data.trend}
							valueColor={
								data.trend === "climbing"
									? p.greenInk
									: data.trend === "easing"
										? p.redInk
										: p.inkMid
							}
							p={p}
							t={t}
						/>
					</View>
				</Rise>

				{/* ── Direction over time ───────────────────────────────── */}
				{data.recentScores.length > 1 ? (
					<Rise delay={staggerDelay(3)} style={{ marginBottom: d.gap }}>
						<ScoreTrendCard
							scores={data.recentScores}
							weekEnding={data.weekEnding}
							p={p}
							t={t}
						/>
					</Rise>
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
					<CalloutCard
						callouts={data.callouts}
						weekEnding={data.weekEnding}
						ratings={mergedRatings}
						p={p}
						t={t}
						onRated={handleRated}
					/>
				) : null}
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
	heading: { fontSize: 26, lineHeight: 32, letterSpacing: -0.5 },
	subHeading: { fontSize: 13, lineHeight: 19, marginTop: 4 },
	eyebrow: {
		fontSize: 10,
		fontWeight: "600",
		letterSpacing: 2,
		textTransform: "uppercase",
		marginBottom: 10,
	},
	scoreValue: { fontSize: 44, lineHeight: 48, letterSpacing: -1 },
	scoreOutOf: { fontSize: 12, marginTop: -2 },
	scoreCaption: { fontSize: 10, letterSpacing: 1, marginTop: 4 },
	bandStatus: { fontSize: 17 },
	bandSub: { fontSize: 13, lineHeight: 19, marginTop: 6, maxWidth: 260 },
	provisional: { fontSize: 11, fontStyle: "italic", marginTop: 8 },
	tileGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
	statTile: {
		flexBasis: "45%",
		flexGrow: 1,
		borderWidth: 1,
		borderRadius: 14,
		paddingHorizontal: 14,
		paddingVertical: 13,
	},
	statTileLabel: { fontSize: 11, fontWeight: "600", marginBottom: 6 },
	statTileValue: { fontSize: 26, lineHeight: 30 },
	statTileCaption: { fontSize: 11, marginTop: 3 },
	dateLabel: { fontSize: 10 },
	narrative: { fontSize: 14, lineHeight: 22 },
	calloutBody: { fontSize: 13, lineHeight: 20 },
	pole: { width: 56, height: 72, marginBottom: 14 },
	emptyHeading: { fontSize: 28, lineHeight: 34, marginBottom: 10 },
	emptyBody: { fontSize: 14, lineHeight: 22 },
});
