// Creator profile: who this person is and what they're working toward.
// Opens from any author name. Follow is the single gold action; their
// recent posts sit in one hairline group underneath.

import { Icon } from "@north/native-ui";
import type { getNorthTokens } from "@north/tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { DiscussionPost } from "@/lib/community/use-community-posts";
import { useCreatorProfile } from "@/lib/community/use-spaces";
import { SpaceSheet } from "./SpaceSheet";

type Tokens = ReturnType<typeof getNorthTokens>;

function timeAgo(iso: string): string {
	const mins = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60000));
	if (mins < 60) return `${mins}m`;
	const hours = Math.round(mins / 60);
	if (hours < 24) return `${hours}h`;
	return `${Math.round(hours / 24)}d`;
}

export function CreatorProfileSheet({
	author,
	authorUserId,
	isSelf,
	posts,
	p,
	t,
	onClose,
}: {
	/** null = sheet closed. */
	author: string | null;
	authorUserId: string | null;
	isSelf: boolean;
	/** All discussion posts; the sheet filters to this author. */
	posts: DiscussionPost[];
	p: Tokens["p"];
	t: Tokens["t"];
	onClose: () => void;
}) {
	const profile = useCreatorProfile(author, authorUserId);
	const recent = posts.filter((post) => post.author === author).slice(0, 5);

	return (
		<SpaceSheet
			visible={author !== null}
			title="Profile"
			p={p}
			t={t}
			onClose={onClose}
		>
			<View style={s.head}>
				<View style={[s.avatar, { backgroundColor: p.surfaceHi }]}>
					<Text
						style={[s.avatarLetter, { color: p.inkMid, fontFamily: t.display }]}
					>
						{author?.[0]?.toUpperCase() ?? "?"}
					</Text>
				</View>
				<Text style={[s.name, { color: p.ink, fontFamily: t.display }]}>
					{author}
				</Text>
				<Text style={[s.bio, { color: p.inkMid, fontFamily: t.ui }]}>
					{profile.bio}
				</Text>
				{profile.goal ? (
					<Text style={[s.goal, { color: p.goldInk, fontFamily: t.ui }]}>
						→ {profile.goal}
					</Text>
				) : null}

				{!isSelf ? (
					<Pressable
						onPress={() => void profile.toggleFollow()}
						accessibilityRole="button"
						accessibilityLabel={
							profile.following ? `Unfollow ${author}` : `Follow ${author}`
						}
						style={({ pressed }) => [
							s.followBtn,
							profile.following
								? { backgroundColor: p.surface, borderColor: p.line }
								: { backgroundColor: p.gold, borderColor: p.gold },
							pressed && { opacity: 0.8 },
						]}
					>
						{profile.following ? (
							<View style={s.followingWrap}>
								<Icon name="check" size={13} color={p.greenInk} />
								<Text
									style={[s.followLabel, { color: p.inkMid, fontFamily: t.ui }]}
								>
									Following
								</Text>
							</View>
						) : (
							<Text
								style={[
									s.followLabel,
									{ color: p.accentInk, fontFamily: t.ui },
								]}
							>
								Follow
							</Text>
						)}
					</Pressable>
				) : null}
			</View>

			{recent.length > 0 ? (
				<View>
					<Text style={[s.eyebrow, { color: p.inkDim, fontFamily: t.ui }]}>
						RECENT
					</Text>
					<View
						style={[
							s.group,
							{ backgroundColor: p.surface, borderColor: p.line },
						]}
					>
						{recent.map((post, i) => (
							<View
								key={post.id}
								style={[
									s.postRow,
									i > 0 && {
										borderTopWidth: StyleSheet.hairlineWidth,
										borderTopColor: p.line,
									},
								]}
							>
								<Text
									style={[s.postBody, { color: p.inkMid, fontFamily: t.ui }]}
								>
									{post.caption}
								</Text>
								<Text
									style={[s.postTime, { color: p.inkDim, fontFamily: t.ui }]}
								>
									{timeAgo(post.createdAt)}
								</Text>
							</View>
						))}
					</View>
				</View>
			) : (
				<Text style={[s.empty, { color: p.inkDim, fontFamily: t.ui }]}>
					Nothing shared yet.
				</Text>
			)}
		</SpaceSheet>
	);
}

const s = StyleSheet.create({
	head: { alignItems: "center", marginBottom: 24 },
	avatar: {
		width: 64,
		height: 64,
		borderRadius: 32,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 12,
	},
	avatarLetter: { fontSize: 26 },
	name: { fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
	bio: {
		fontSize: 13,
		lineHeight: 19,
		textAlign: "center",
		marginTop: 6,
		paddingHorizontal: 12,
	},
	goal: { fontSize: 12.5, fontWeight: "600", marginTop: 8 },
	followBtn: {
		marginTop: 16,
		borderRadius: 10,
		borderWidth: 1,
		paddingVertical: 10,
		paddingHorizontal: 28,
		alignItems: "center",
	},
	followLabel: { fontSize: 13.5, fontWeight: "600" },
	followingWrap: { flexDirection: "row", alignItems: "center", gap: 5 },
	eyebrow: {
		fontSize: 10,
		fontWeight: "600",
		letterSpacing: 2,
		marginBottom: 8,
	},
	group: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
	postRow: { paddingHorizontal: 14, paddingVertical: 12 },
	postBody: { fontSize: 13.5, lineHeight: 20 },
	postTime: { fontSize: 11, marginTop: 5 },
	empty: { fontSize: 13, lineHeight: 20, textAlign: "center", padding: 16 },
});
