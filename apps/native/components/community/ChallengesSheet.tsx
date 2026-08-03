// Challenges: shared rhythms, not races. Participation leads ("12 people
// held their rhythm this week"), the leaderboard is three first names
// holding steady — no rank numerals, no pressure copy — and your own
// standing reads like a note to self. Badges live here too, as quiet
// ink line-icons with gold only on the newest.

import { Icon, type IconName } from "@north/native-ui";
import type { getNorthTokens } from "@north/tokens";
import {
	ActivityIndicator,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";

import type { Achievement, Challenge } from "@/lib/community/types";
import { SpaceSheet } from "./SpaceSheet";

type Tokens = ReturnType<typeof getNorthTokens>;

function daysRemaining(endsAt: string): number {
	return Math.max(
		0,
		Math.ceil((Date.parse(endsAt) - Date.now()) / (24 * 3_600_000)),
	);
}

const BADGE_ICON: Record<Achievement["key"], IconName> = {
	first_check_in: "check",
	four_week_circle: "streak",
	helped_five: "heart",
};

export function ChallengesSheet({
	visible,
	challenges,
	achievements,
	loading,
	p,
	t,
	onToggleJoin,
	onClose,
}: {
	visible: boolean;
	challenges: Challenge[];
	achievements: Achievement[];
	loading: boolean;
	p: Tokens["p"];
	t: Tokens["t"];
	onToggleJoin: (id: string) => void;
	onClose: () => void;
}) {
	return (
		<SpaceSheet
			visible={visible}
			title="Challenges"
			p={p}
			t={t}
			onClose={onClose}
		>
			<Text style={[s.lede, { color: p.inkMid, fontFamily: t.ui }]}>
				Small shared rhythms. The only opponent is last week.
			</Text>

			{loading ? (
				<ActivityIndicator color={p.gold} style={{ marginTop: 24 }} />
			) : challenges.length === 0 ? (
				<Text style={[s.empty, { color: p.inkDim, fontFamily: t.ui }]}>
					No active challenges right now.
				</Text>
			) : (
				challenges.map((c) => {
					const days = daysRemaining(c.endsAt);
					return (
						<View
							key={c.id}
							style={[
								s.card,
								{ backgroundColor: p.surface, borderColor: p.line },
							]}
						>
							<Text style={[s.title, { color: p.ink, fontFamily: t.display }]}>
								{c.title}
							</Text>
							<Text style={[s.tagline, { color: p.inkMid, fontFamily: t.ui }]}>
								{c.tagline}
							</Text>
							<Text style={[s.meta, { color: p.inkDim, fontFamily: t.ui }]}>
								{days === 0
									? "Last day"
									: `${days} ${days === 1 ? "day" : "days"} left`}{" "}
								· {c.participants} in
							</Text>

							<Text
								style={[
									s.participation,
									{ color: p.greenInk, fontFamily: t.ui },
								]}
							>
								{c.heldThisWeek} {c.heldThisWeek === 1 ? "person" : "people"}{" "}
								held their rhythm this week
							</Text>

							{c.topThree.length > 0 ? (
								<View style={[s.steady, { borderTopColor: p.line }]}>
									<Text
										style={[s.eyebrow, { color: p.inkDim, fontFamily: t.ui }]}
									>
										HOLDING STEADY
									</Text>
									{c.topThree.map((name) => (
										<View key={name} style={s.steadyRow}>
											<View
												style={[s.steadyDot, { backgroundColor: p.green }]}
											/>
											<Text
												style={[
													s.steadyName,
													{ color: p.inkMid, fontFamily: t.ui },
												]}
											>
												{name}
											</Text>
										</View>
									))}
								</View>
							) : null}

							{c.yourStanding ? (
								<Text
									style={[s.standing, { color: p.inkDim, fontFamily: t.ui }]}
								>
									{c.yourStanding}
								</Text>
							) : null}

							<Pressable
								onPress={() => onToggleJoin(c.id)}
								accessibilityRole="button"
								accessibilityLabel={
									c.joined ? `Leave ${c.title}` : `Join ${c.title}`
								}
								style={({ pressed }) => [
									s.joinBtn,
									c.joined
										? { borderColor: p.line, backgroundColor: p.surface }
										: { backgroundColor: p.gold, borderColor: p.gold },
									pressed && { opacity: 0.8 },
								]}
							>
								<Text
									style={[
										s.joinLabel,
										{
											color: c.joined ? p.inkMid : p.accentInk,
											fontFamily: t.ui,
										},
									]}
								>
									{c.joined ? "You're in — leave quietly" : "Join challenge"}
								</Text>
							</Pressable>
						</View>
					);
				})
			)}

			{/* ── Achievements ─────────────────────────────────────────── */}
			{achievements.length > 0 ? (
				<View>
					<Text
						style={[s.sectionEyebrow, { color: p.inkDim, fontFamily: t.ui }]}
					>
						YOUR BADGES
					</Text>
					<View
						style={[
							s.badgeGroup,
							{ backgroundColor: p.surface, borderColor: p.line },
						]}
					>
						{achievements.map((a, i) => (
							<View
								key={a.key}
								style={[
									s.badgeRow,
									i > 0 && {
										borderTopWidth: StyleSheet.hairlineWidth,
										borderTopColor: p.line,
									},
									!a.earned && { opacity: 0.45 },
								]}
							>
								<Icon
									name={BADGE_ICON[a.key]}
									size={16}
									color={a.newest ? p.goldInk : p.inkMid}
								/>
								<View style={s.badgeMiddle}>
									<Text
										style={[
											s.badgeLabel,
											{
												color: a.newest ? p.goldInk : p.ink,
												fontFamily: t.ui,
											},
										]}
									>
										{a.label}
									</Text>
									<Text
										style={[
											s.badgeDetail,
											{ color: p.inkDim, fontFamily: t.ui },
										]}
									>
										{a.detail}
									</Text>
								</View>
								{a.earned ? (
									<Icon
										name="check"
										size={14}
										color={a.newest ? p.goldInk : p.greenInk}
									/>
								) : null}
							</View>
						))}
					</View>
				</View>
			) : null}
		</SpaceSheet>
	);
}

const s = StyleSheet.create({
	lede: { fontSize: 13, lineHeight: 19, marginBottom: 16 },
	empty: { fontSize: 13, lineHeight: 20, textAlign: "center", padding: 24 },
	card: {
		borderRadius: 16,
		borderWidth: 1,
		padding: 16,
		marginBottom: 14,
	},
	title: { fontSize: 17, lineHeight: 22, letterSpacing: -0.3 },
	tagline: { fontSize: 13, lineHeight: 19, marginTop: 4 },
	meta: { fontSize: 11.5, marginTop: 6 },
	participation: { fontSize: 12.5, fontWeight: "600", marginTop: 12 },
	steady: {
		marginTop: 12,
		paddingTop: 12,
		borderTopWidth: StyleSheet.hairlineWidth,
		gap: 6,
	},
	eyebrow: {
		fontSize: 10,
		fontWeight: "600",
		letterSpacing: 2,
		marginBottom: 2,
	},
	steadyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
	steadyDot: { width: 5, height: 5, borderRadius: 2.5 },
	steadyName: { fontSize: 13 },
	standing: { fontSize: 12, lineHeight: 17, marginTop: 10 },
	joinBtn: {
		marginTop: 14,
		borderRadius: 10,
		borderWidth: 1,
		paddingVertical: 11,
		alignItems: "center",
	},
	joinLabel: { fontSize: 13.5, fontWeight: "600" },
	sectionEyebrow: {
		fontSize: 10,
		fontWeight: "600",
		letterSpacing: 2,
		marginTop: 10,
		marginBottom: 8,
	},
	badgeGroup: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
	badgeRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 14,
		paddingVertical: 12,
	},
	badgeMiddle: { flex: 1, gap: 1 },
	badgeLabel: { fontSize: 13.5, fontWeight: "600" },
	badgeDetail: { fontSize: 11.5, lineHeight: 16 },
});
