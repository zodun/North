// Community tab — your circle's weekly check-ins, then the discussion
// of what everyone is working toward. Two quiet groups, hairlines
// inside; green is the section accent, and a goal on a post is a small
// gold line, because a goal is a needle.

import { Icon, Rise, staggerDelay } from "@north/native-ui";
import { getNorthTokens } from "@north/tokens";
import { useState } from "react";
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
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
	first,
	p,
	t,
}: {
	post: DiscussionPost;
	first: boolean;
	p: Tokens["p"];
	t: Tokens["t"];
}) {
	return (
		<View
			style={[
				d.post,
				!first && {
					borderTopWidth: StyleSheet.hairlineWidth,
					borderTopColor: p.line,
				},
			]}
		>
			<View style={d.postHead}>
				<Text
					style={[d.postAuthor, { color: p.ink, fontFamily: t.ui }]}
					numberOfLines={1}
				>
					{post.isMine ? `${post.author} (you)` : post.author}
				</Text>
				<Text style={[d.postTime, { color: p.inkDim, fontFamily: t.ui }]}>
					{timeAgo(post.createdAt)}
				</Text>
			</View>
			<Text style={[d.postBody, { color: p.inkMid, fontFamily: t.ui }]}>
				{post.caption}
			</Text>
			{post.authorGoal ? (
				<Text
					style={[d.postGoal, { color: p.goldInk, fontFamily: t.ui }]}
					numberOfLines={1}
				>
					→ {post.authorGoal}
				</Text>
			) : null}
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

	const canPost = !!draft.trim() && !discussion.submitting;

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
					<Rise delay={staggerDelay(1)}>
						<View style={styles.sectionHeaderRow}>
							<Text
								style={[
									styles.sectionEyebrow,
									{ color: p.inkDim, fontFamily: t.ui },
								]}
							>
								DISCUSSION
							</Text>
						</View>

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
							<Pressable
								onPress={() => void post()}
								disabled={!canPost}
								accessibilityRole="button"
								accessibilityLabel="Post update"
								style={({ pressed }) => [
									d.composerBtn,
									{
										backgroundColor: canPost ? p.gold : `${p.gold}44`,
										opacity: pressed ? 0.8 : 1,
									},
								]}
							>
								{discussion.submitting ? (
									<ActivityIndicator color={p.accentInk} size="small" />
								) : (
									<Icon
										name="arrowUp"
										size={16}
										color={p.accentInk}
										strokeWidth={2}
									/>
								)}
							</Pressable>
						</View>

						{discussion.loading ? (
							<ActivityIndicator color={p.green} style={{ marginTop: 20 }} />
						) : discussion.posts.length === 0 ? (
							<Text
								style={[d.feedEmpty, { color: p.inkDim, fontFamily: t.ui }]}
							>
								Quiet so far. Share what you're working toward — someone here is
								probably working toward it too.
							</Text>
						) : (
							<View
								style={[
									d.feedGroup,
									{ backgroundColor: p.surface, borderColor: p.line },
								]}
							>
								{discussion.posts.map((item, i) => (
									<PostRow
										key={item.id}
										post={item}
										first={i === 0}
										p={p}
										t={t}
									/>
								))}
							</View>
						)}
					</Rise>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1 },
	heading: { fontSize: 26, lineHeight: 32, letterSpacing: -0.5 },
	subHeading: { fontSize: 13, lineHeight: 19, marginTop: 4 },
	sectionHeaderRow: {
		marginTop: 28,
		marginBottom: 8,
		paddingHorizontal: 2,
	},
	sectionEyebrow: { fontSize: 10, fontWeight: "600", letterSpacing: 2 },
});

const d = StyleSheet.create({
	composer: {
		flexDirection: "row",
		alignItems: "flex-end",
		gap: 10,
		borderRadius: 22,
		borderWidth: 1,
		paddingLeft: 16,
		paddingRight: 6,
		paddingVertical: 6,
	},
	composerInput: {
		flex: 1,
		fontSize: 14,
		lineHeight: 19,
		maxHeight: 96,
		paddingVertical: 6,
	},
	composerBtn: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 2,
	},
	feedGroup: {
		borderRadius: 16,
		borderWidth: 1,
		overflow: "hidden",
		marginTop: 10,
	},
	feedEmpty: { fontSize: 13, lineHeight: 20, textAlign: "center", padding: 20 },
	post: {
		paddingHorizontal: 14,
		paddingVertical: 13,
	},
	postHead: {
		flexDirection: "row",
		alignItems: "baseline",
		justifyContent: "space-between",
		gap: 8,
	},
	postAuthor: { fontSize: 13.5, fontWeight: "600", flexShrink: 1 },
	postTime: { fontSize: 11 },
	postBody: { fontSize: 14, lineHeight: 21, marginTop: 3 },
	postGoal: { fontSize: 11.5, fontWeight: "500", marginTop: 6 },
});
