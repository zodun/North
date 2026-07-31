// Community tab — the people you're moving with, and the discussion of
// what everyone is working toward. Green is the section accent (growth
// in company); a goal on a post wears the gold chip, because a goal is
// a needle.

import { Rise, staggerDelay } from "@north/native-ui";
import { getNorthTokens } from "@north/tokens";
import { useState } from "react";
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import { PeopleSection } from "@/components/signal/PeopleSection";
import {
	type DiscussionPost,
	useDiscussion,
} from "@/lib/community/use-community-posts";
import { usePeople } from "@/lib/signal/use-people";

type Tokens = ReturnType<typeof getNorthTokens>;

function timeAgo(iso: string): string {
	const mins = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60000));
	if (mins < 60) return `${mins}m`;
	const hours = Math.round(mins / 60);
	if (hours < 24) return `${hours}h`;
	return `${Math.round(hours / 24)}d`;
}

// ── Post row ──────────────────────────────────────────────────────────

function PostRow({
	post,
	p,
	t,
}: {
	post: DiscussionPost;
	p: Tokens["p"];
	t: Tokens["t"];
}) {
	return (
		<View style={[d.post, { backgroundColor: p.surface, borderColor: p.line }]}>
			<View style={d.postHead}>
				<View style={[d.postAvatar, { backgroundColor: `${p.green}1a` }]}>
					<Text
						style={[
							d.postAvatarLetter,
							{ color: p.greenInk, fontFamily: t.display },
						]}
					>
						{post.author[0]?.toUpperCase() ?? "?"}
					</Text>
				</View>
				<View style={{ flex: 1 }}>
					<Text
						style={[d.postAuthor, { color: p.ink, fontFamily: t.ui }]}
						numberOfLines={1}
					>
						{post.isMine ? `${post.author} (you)` : post.author}
					</Text>
					{post.authorGoal ? (
						<View style={[d.goalChip, { backgroundColor: `${p.gold}1f` }]}>
							<Text
								style={[
									d.goalChipLabel,
									{ color: p.goldInk, fontFamily: t.ui },
								]}
								numberOfLines={1}
							>
								{post.authorGoal}
							</Text>
						</View>
					) : null}
				</View>
				<Text style={[d.postTime, { color: p.inkDim, fontFamily: t.ui }]}>
					{timeAgo(post.createdAt)}
				</Text>
			</View>
			<Text style={[d.postBody, { color: p.inkMid, fontFamily: t.ui }]}>
				{post.caption}
			</Text>
		</View>
	);
}

// ── Screen ────────────────────────────────────────────────────────────

export default function Community() {
	const { p, t, d: dd } = getNorthTokens();
	const people = usePeople();
	const discussion = useDiscussion();
	const [draft, setDraft] = useState("");

	async function post() {
		const ok = await discussion.submit(draft);
		if (ok) setDraft("");
	}

	return (
		<SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]}>
			<KeyboardAvoidingView
				style={styles.safe}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<ScrollView
					contentContainerStyle={{
						paddingHorizontal: dd.scrnPad,
						paddingTop: 16,
						paddingBottom: 48,
					}}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
				>
					<Rise>
						<View style={{ marginBottom: 20 }}>
							<Text
								style={[
									styles.heading,
									{ color: p.ink, fontFamily: t.display },
								]}
							>
								Community
							</Text>
							<Text
								style={[
									styles.subHeading,
									{ color: p.inkMid, fontFamily: t.ui },
								]}
							>
								The people you're moving with. Check in weekly.
							</Text>
						</View>
					</Rise>

					{/* The section staggers its own rows — no outer Rise. */}
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

					{/* ── Discussion ──────────────────────────────────────── */}
					<Rise delay={staggerDelay(2)}>
						<View style={styles.discussionHeader}>
							<Text
								style={[
									styles.discussionTitle,
									{ color: p.ink, fontFamily: t.editorial },
								]}
							>
								Discussion
							</Text>
							<Text
								style={[
									styles.discussionSub,
									{ color: p.inkMid, fontFamily: t.ui },
								]}
							>
								What everyone is working toward this month.
							</Text>
						</View>
					</Rise>

					<Rise delay={staggerDelay(3)}>
						<View
							style={[
								d.composer,
								{ backgroundColor: p.surface, borderColor: p.line },
							]}
						>
							<TextInput
								value={draft}
								onChangeText={setDraft}
								placeholder="Share an update on your goal…"
								placeholderTextColor={p.inkDim}
								multiline
								maxLength={500}
								style={[d.composerInput, { color: p.ink, fontFamily: t.ui }]}
							/>
							<TouchableOpacity
								onPress={() => void post()}
								disabled={!draft.trim() || discussion.submitting}
								accessibilityRole="button"
								accessibilityLabel="Post update"
								style={[
									d.composerBtn,
									{
										backgroundColor:
											draft.trim() && !discussion.submitting
												? p.gold
												: `${p.gold}55`,
									},
								]}
							>
								{discussion.submitting ? (
									<ActivityIndicator color={p.accentInk} size="small" />
								) : (
									<Text
										style={[
											d.composerBtnLabel,
											{ color: p.accentInk, fontFamily: t.ui },
										]}
									>
										Post
									</Text>
								)}
							</TouchableOpacity>
						</View>
					</Rise>

					<View style={d.feed}>
						{discussion.loading ? (
							<ActivityIndicator color={p.green} style={{ marginTop: 16 }} />
						) : discussion.posts.length === 0 ? (
							<Text
								style={[d.feedEmpty, { color: p.inkDim, fontFamily: t.ui }]}
							>
								Quiet so far. Share what you're working toward — someone here is
								probably working toward it too.
							</Text>
						) : (
							discussion.posts.map((item) => (
								<PostRow key={item.id} post={item} p={p} t={t} />
							))
						)}
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1 },
	heading: { fontSize: 26, lineHeight: 32, letterSpacing: -0.5 },
	subHeading: { fontSize: 13, lineHeight: 19, marginTop: 4 },
	discussionHeader: { marginTop: 28, marginBottom: 12 },
	discussionTitle: { fontSize: 18, lineHeight: 24 },
	discussionSub: { fontSize: 12, lineHeight: 17, marginTop: 2 },
});

const d = StyleSheet.create({
	composer: {
		borderRadius: 14,
		borderWidth: 1,
		padding: 12,
		gap: 10,
	},
	composerInput: {
		fontSize: 14,
		lineHeight: 20,
		minHeight: 44,
		textAlignVertical: "top",
	},
	composerBtn: {
		alignSelf: "flex-end",
		borderRadius: 8,
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	composerBtnLabel: { fontSize: 13, fontWeight: "600" },
	feed: { gap: 10, marginTop: 10 },
	feedEmpty: { fontSize: 13, lineHeight: 20, textAlign: "center", padding: 16 },
	post: {
		borderRadius: 14,
		borderWidth: 1,
		padding: 14,
	},
	postHead: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginBottom: 8,
	},
	postAvatar: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
	},
	postAvatarLetter: { fontSize: 15 },
	postAuthor: { fontSize: 14, fontWeight: "600" },
	goalChip: {
		alignSelf: "flex-start",
		borderRadius: 999,
		paddingHorizontal: 8,
		paddingVertical: 2,
		marginTop: 3,
	},
	goalChipLabel: { fontSize: 10, fontWeight: "600" },
	postTime: { fontSize: 11, alignSelf: "flex-start", marginTop: 2 },
	postBody: { fontSize: 14, lineHeight: 21 },
});
