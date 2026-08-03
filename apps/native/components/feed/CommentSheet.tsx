// Comment sheet for a For You slide — pageSheet modal, list + composer.
// The sheet leaves the dark feed behind and returns to North's light ground:
// cool sky base, ink text, gold reserved for the one action (post).

import { Icon, MOTION, Rise, staggerDelay } from "@north/native-ui";
import { getNorthTokens } from "@north/tokens";
import { useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";

import type { FeedComment } from "@/lib/feed/types";
import { useComments } from "@/lib/feed/use-social";

const { p, t } = getNorthTokens();

type Props = {
	itemId: string | null;
	onClose: () => void;
	/** Fired after a comment posts successfully (bump the rail count). */
	onPosted: (itemId: string) => void;
};

function timeAgo(iso: string): string {
	const mins = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 60_000));
	if (mins < 1) return "now";
	if (mins < 60) return `${mins}m`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h`;
	return `${Math.floor(hours / 24)}d`;
}

export function CommentSheet({ itemId, onClose, onPosted }: Props) {
	const { comments, loading, submitting, add } = useComments(itemId);
	const [draft, setDraft] = useState("");

	const send = async () => {
		if (!itemId) return;
		const body = draft;
		setDraft("");
		const ok = await add(body);
		if (ok) onPosted(itemId);
		else setDraft(body);
	};

	return (
		<Modal
			visible={itemId !== null}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={onClose}
		>
			<KeyboardAvoidingView
				style={s.root}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<View style={s.header}>
					<Text style={s.headerTitle}>Comments</Text>
					<Pressable
						onPress={onClose}
						accessibilityRole="button"
						accessibilityLabel="Close comments"
						hitSlop={10}
						style={({ pressed }) => [s.closeBtn, pressed && { opacity: 0.6 }]}
					>
						<Icon name="close" size={20} color={p.ink} strokeWidth={2} />
					</Pressable>
				</View>

				{loading ? (
					<View style={s.center}>
						<ActivityIndicator color={p.gold} />
					</View>
				) : comments.length === 0 ? (
					<View style={s.center}>
						<Text style={s.emptyTitle}>No comments yet</Text>
						<Text style={s.emptyBody}>Be the first to say something.</Text>
					</View>
				) : (
					<FlatList
						data={comments}
						keyExtractor={(c) => c.id}
						contentContainerStyle={s.listContent}
						renderItem={({ item, index }) => (
							<Rise delay={staggerDelay(index)} duration={MOTION.standard}>
								<CommentRow comment={item} />
							</Rise>
						)}
					/>
				)}

				<View style={s.composer}>
					<TextInput
						style={s.input}
						value={draft}
						onChangeText={setDraft}
						placeholder="Add a comment…"
						placeholderTextColor={p.inkDim}
						multiline
						maxLength={2000}
						editable={!submitting}
					/>
					<Pressable
						onPress={send}
						disabled={!draft.trim() || submitting}
						accessibilityRole="button"
						accessibilityLabel="Post comment"
						style={({ pressed }) => [
							s.sendBtn,
							{
								backgroundColor: draft.trim() ? p.gold : p.surfaceHi,
								opacity: pressed ? 0.8 : 1,
							},
						]}
					>
						<Icon
							name="arrowUp"
							size={18}
							color={draft.trim() ? p.accentInk : p.inkDim}
							strokeWidth={2}
						/>
					</Pressable>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}

function CommentRow({ comment }: { comment: FeedComment }) {
	return (
		<View style={s.row}>
			<View style={s.avatar}>
				<Text style={s.avatarText}>{comment.author[0]?.toUpperCase()}</Text>
			</View>
			<View style={s.rowBody}>
				<View style={s.rowMeta}>
					<Text style={s.author}>{comment.author}</Text>
					<Text style={s.time}>{timeAgo(comment.created_at)}</Text>
				</View>
				<Text style={s.body}>{comment.body}</Text>
			</View>
		</View>
	);
}

const s = StyleSheet.create({
	root: { flex: 1, backgroundColor: p.bg },
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: p.line,
	},
	headerTitle: {
		fontFamily: t.display,
		fontSize: 16,
		color: p.ink,
		letterSpacing: -0.3,
	},
	closeBtn: { position: "absolute", right: 16 },
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: 4,
		paddingHorizontal: 32,
	},
	emptyTitle: { fontFamily: t.display, fontSize: 15, color: p.ink },
	emptyBody: { fontFamily: t.ui, fontSize: 13, color: p.inkDim },
	listContent: { padding: 16, gap: 14 },
	row: {
		flexDirection: "row",
		gap: 10,
		backgroundColor: p.surface,
		borderWidth: 1,
		borderColor: p.line,
		borderRadius: 14,
		padding: 12,
	},
	avatar: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: p.accentSoft,
		alignItems: "center",
		justifyContent: "center",
	},
	avatarText: { fontFamily: t.display, fontSize: 13, color: p.goldInk },
	rowBody: { flex: 1, gap: 2 },
	rowMeta: { flexDirection: "row", alignItems: "baseline", gap: 8 },
	author: { fontFamily: t.ui, fontWeight: "700", fontSize: 13, color: p.ink },
	time: { fontFamily: t.ui, fontSize: 11, color: p.inkDim },
	body: { fontFamily: t.ui, fontSize: 14, lineHeight: 20, color: p.inkMid },
	composer: {
		flexDirection: "row",
		alignItems: "flex-end",
		gap: 8,
		padding: 12,
		paddingBottom: Platform.OS === "ios" ? 24 : 12,
		borderTopWidth: 1,
		borderTopColor: p.line,
		backgroundColor: p.surface,
	},
	input: {
		flex: 1,
		minHeight: 40,
		maxHeight: 110,
		borderWidth: 1,
		borderColor: p.line,
		borderRadius: 14,
		paddingHorizontal: 14,
		paddingVertical: 10,
		fontFamily: t.ui,
		fontSize: 14,
		color: p.ink,
		backgroundColor: p.bg,
	},
	sendBtn: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
	},
});
