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
} from "@north/native-ui";
import { getTokens } from "@north/tokens";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Linking,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import { supabase } from "@/lib/auth-client";
import { useProfileData } from "@/lib/profile/use-profile-data";

export default function Profile() {
	const { p, t, d } = getTokens("warm", "humanist", "calm");
	const { data, loading, error } = useProfileData();

	function confirmSignOut() {
		Alert.alert(
			"Sign out?",
			"You can sign back in any time.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Sign out",
					style: "destructive",
					onPress: () => {
						void supabase.auth.signOut();
					},
				},
			],
			{ cancelable: true },
		);
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

				{/* ── Sign out ─────────────────────────────────────────── */}
				<View style={{ marginTop: d.gapLg }}>
					<Button p={p} t={t} variant="outline" onPress={confirmSignOut}>
						Sign out
					</Button>
				</View>

				{/* ── Delete account ──────────────────────────────────── */}
				<View style={{ marginTop: d.gap }}>
					<DeleteAccountCard p={p} t={t} />
				</View>

				{/* ── Privacy policy ───────────────────────────────────── */}
				<TouchableOpacity
					onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}
					style={{ marginTop: d.gap, alignItems: "center" }}
				>
					<Text style={{ color: p.inkDim, fontFamily: t.ui, fontSize: 12 }}>
						Privacy Policy
					</Text>
				</TouchableOpacity>
			</ScrollView>
		</SafeAreaView>
	);
}

// TODO: point at the production custom domain once one is confirmed for the
// web app (see docs/supabase-projects.md / deploy topology notes).
const PRIVACY_POLICY_URL = "https://north-system.vercel.app/privacy-policy";

// App Store Guideline 5.1.1(v): apps that support account creation must
// offer in-app deletion. Calls the delete-account Edge Function, which
// verifies the caller's own JWT and deletes the auth.users row; every
// user-data table cascades from that FK, so this removes everything.
function DeleteAccountCard({
	p,
	t,
}: {
	p: ReturnType<typeof getTokens>["p"];
	t: ReturnType<typeof getTokens>["t"];
}) {
	const [confirming, setConfirming] = useState(false);
	const [confirmText, setConfirmText] = useState("");
	const [deleting, setDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	async function handleDelete() {
		if (confirmText.trim().toUpperCase() !== "DELETE" || deleting) return;
		setDeleting(true);
		setDeleteError(null);
		const { error } = await supabase.functions.invoke("delete-account", {
			method: "POST",
		});
		if (error) {
			setDeleteError("Something went wrong. Please try again.");
			setDeleting(false);
			return;
		}
		await supabase.auth.signOut();
	}

	if (!confirming) {
		return (
			<TouchableOpacity onPress={() => setConfirming(true)}>
				<Text
					style={[deleteStyles.trigger, { color: p.warn, fontFamily: t.ui }]}
				>
					Delete account
				</Text>
			</TouchableOpacity>
		);
	}

	return (
		<Card p={p}>
			<Text style={[deleteStyles.warning, { color: p.warn, fontFamily: t.ui }]}>
				This permanently deletes your account.
			</Text>
			<Text style={[deleteStyles.body, { color: p.inkMid, fontFamily: t.ui }]}>
				Your profile, missions, journal, signal history, and saved opportunities
				are all erased. This can't be undone.
			</Text>
			<Text style={[deleteStyles.label, { color: p.inkDim, fontFamily: t.ui }]}>
				Type DELETE to confirm.
			</Text>
			<TextInput
				value={confirmText}
				onChangeText={setConfirmText}
				placeholder="DELETE"
				placeholderTextColor={p.inkDim}
				autoCapitalize="characters"
				autoCorrect={false}
				style={[
					deleteStyles.input,
					{ color: p.ink, fontFamily: t.ui, borderColor: `${p.warn}44` },
				]}
			/>
			{deleteError ? (
				<Text style={[deleteStyles.body, { color: p.warn, fontFamily: t.ui }]}>
					{deleteError}
				</Text>
			) : null}
			<View style={deleteStyles.row}>
				<TouchableOpacity
					onPress={() => void handleDelete()}
					disabled={confirmText.trim().toUpperCase() !== "DELETE" || deleting}
					style={[
						deleteStyles.deleteBtn,
						{
							backgroundColor:
								confirmText.trim().toUpperCase() === "DELETE" && !deleting
									? p.warn
									: `${p.warn}44`,
						},
					]}
				>
					{deleting ? (
						<ActivityIndicator color={p.bg} size="small" />
					) : (
						<Text
							style={[
								deleteStyles.deleteLabel,
								{ color: p.bg, fontFamily: t.ui },
							]}
						>
							Permanently delete
						</Text>
					)}
				</TouchableOpacity>
				<TouchableOpacity
					onPress={() => {
						setConfirming(false);
						setConfirmText("");
						setDeleteError(null);
					}}
					style={deleteStyles.cancelBtn}
				>
					<Text
						style={[deleteStyles.body, { color: p.inkMid, fontFamily: t.ui }]}
					>
						Cancel
					</Text>
				</TouchableOpacity>
			</View>
		</Card>
	);
}

const deleteStyles = StyleSheet.create({
	trigger: { fontSize: 12, fontWeight: "500", textAlign: "center" },
	warning: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
	body: { fontSize: 12, lineHeight: 17, marginBottom: 8 },
	label: { fontSize: 12, marginBottom: 6 },
	input: {
		borderWidth: 1,
		borderRadius: 8,
		padding: 10,
		fontSize: 14,
		marginBottom: 10,
	},
	row: { flexDirection: "row", gap: 12, alignItems: "center" },
	deleteBtn: {
		paddingVertical: 10,
		paddingHorizontal: 14,
		borderRadius: 8,
		alignItems: "center",
	},
	deleteLabel: { fontSize: 13, fontWeight: "500" },
	cancelBtn: { paddingVertical: 10, paddingHorizontal: 8 },
});

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
