// Messages: a quiet thread list, then the conversation. Bubbles stay
// calm — yours on a soft gold wash, theirs on a white card — and the
// composer reuses the discussion pill grammar.

import { Icon } from "@north/native-ui";
import type { getNorthTokens } from "@north/tokens";
import { useRef, useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { DmThread } from "@/lib/community/types";
import { SpaceSheet } from "./SpaceSheet";

type Tokens = ReturnType<typeof getNorthTokens>;

function timeAgo(iso: string): string {
	const mins = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60000));
	if (mins < 60) return `${mins}m`;
	const hours = Math.round(mins / 60);
	if (hours < 24) return `${hours}h`;
	return `${Math.round(hours / 24)}d`;
}

export function MessagesSheet({
	visible,
	threads,
	loading,
	p,
	t,
	onSend,
	onClose,
}: {
	visible: boolean;
	threads: DmThread[];
	loading: boolean;
	p: Tokens["p"];
	t: Tokens["t"];
	onSend: (threadId: string, body: string) => Promise<boolean>;
	onClose: () => void;
}) {
	const insets = useSafeAreaInsets();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [draft, setDraft] = useState("");
	const [sending, setSending] = useState(false);
	const scrollRef = useRef<ScrollView>(null);

	const selected = threads.find((th) => th.id === selectedId) ?? null;
	const canSend = !!draft.trim() && !sending;

	async function send() {
		if (!selected || !canSend) return;
		setSending(true);
		const ok = await onSend(selected.id, draft);
		setSending(false);
		if (ok) {
			setDraft("");
			requestAnimationFrame(() => scrollRef.current?.scrollToEnd());
		}
	}

	function close() {
		setSelectedId(null);
		setDraft("");
		onClose();
	}

	return (
		<SpaceSheet
			visible={visible}
			title={selected ? selected.personName : "Messages"}
			p={p}
			t={t}
			onClose={close}
			onBack={selected ? () => setSelectedId(null) : undefined}
			backLabel="Messages"
			scroll={!selected}
		>
			{selected ? (
				<View style={{ flex: 1 }}>
					<ScrollView
						ref={scrollRef}
						style={{ flex: 1 }}
						contentContainerStyle={s.threadBody}
						keyboardShouldPersistTaps="handled"
						showsVerticalScrollIndicator={false}
						onContentSizeChange={() =>
							scrollRef.current?.scrollToEnd({ animated: false })
						}
					>
						{selected.messages.map((m) => (
							<View
								key={m.id}
								style={[
									s.bubbleRow,
									m.fromMe ? s.bubbleRowMine : s.bubbleRowTheirs,
								]}
							>
								<View
									style={[
										s.bubble,
										m.fromMe
											? { backgroundColor: p.accentSoft }
											: {
													backgroundColor: p.surface,
													borderWidth: 1,
													borderColor: p.line,
												},
									]}
								>
									<Text
										style={[s.bubbleText, { color: p.ink, fontFamily: t.ui }]}
									>
										{m.body}
									</Text>
									<Text
										style={[
											s.bubbleTime,
											{ color: p.inkDim, fontFamily: t.ui },
											m.fromMe && { textAlign: "right" },
										]}
									>
										{timeAgo(m.at)}
									</Text>
								</View>
							</View>
						))}
					</ScrollView>
					<View
						style={[
							s.composerWrap,
							{
								borderTopColor: p.line,
								paddingBottom: insets.bottom + 10,
								backgroundColor: p.bg,
							},
						]}
					>
						<View
							style={[
								s.composer,
								{ backgroundColor: p.surface, borderColor: p.line },
							]}
						>
							<TextInput
								value={draft}
								onChangeText={setDraft}
								placeholder={`Message ${selected.personName.split(" ")[0]}…`}
								placeholderTextColor={p.inkDim}
								multiline
								maxLength={1000}
								style={[s.composerInput, { color: p.ink, fontFamily: t.ui }]}
							/>
							<Pressable
								onPress={() => void send()}
								disabled={!canSend}
								accessibilityRole="button"
								accessibilityLabel="Send message"
								style={({ pressed }) => [
									s.composerBtn,
									{
										backgroundColor: canSend ? p.gold : `${p.gold}44`,
										opacity: pressed ? 0.8 : 1,
									},
								]}
							>
								{sending ? (
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
					</View>
				</View>
			) : loading ? (
				<ActivityIndicator color={p.gold} style={{ marginTop: 24 }} />
			) : threads.length === 0 ? (
				<Text style={[s.empty, { color: p.inkDim, fontFamily: t.ui }]}>
					No conversations yet. Request a mentor intro or message someone from
					their profile.
				</Text>
			) : (
				<View
					style={[s.group, { backgroundColor: p.surface, borderColor: p.line }]}
				>
					{threads.map((th, i) => {
						const last = th.messages[th.messages.length - 1];
						return (
							<Pressable
								key={th.id}
								onPress={() => setSelectedId(th.id)}
								accessibilityRole="button"
								accessibilityLabel={`Open conversation with ${th.personName}`}
								style={({ pressed }) => [
									s.row,
									i > 0 && {
										borderTopWidth: StyleSheet.hairlineWidth,
										borderTopColor: p.line,
									},
									pressed && { opacity: 0.7 },
								]}
							>
								<View style={[s.avatar, { backgroundColor: p.surfaceHi }]}>
									<Text
										style={[
											s.avatarLetter,
											{ color: p.inkMid, fontFamily: t.display },
										]}
									>
										{th.personName[0]?.toUpperCase() ?? "?"}
									</Text>
								</View>
								<View style={s.middle}>
									<View style={s.rowHead}>
										<Text
											style={[s.name, { color: p.ink, fontFamily: t.ui }]}
											numberOfLines={1}
										>
											{th.personName}
										</Text>
										{last ? (
											<Text
												style={[s.time, { color: p.inkDim, fontFamily: t.ui }]}
											>
												{timeAgo(last.at)}
											</Text>
										) : null}
									</View>
									<Text
										style={[s.preview, { color: p.inkMid, fontFamily: t.ui }]}
										numberOfLines={1}
									>
										{last
											? `${last.fromMe ? "You: " : ""}${last.body}`
											: "Say hello."}
									</Text>
								</View>
							</Pressable>
						);
					})}
				</View>
			)}
		</SpaceSheet>
	);
}

const s = StyleSheet.create({
	empty: { fontSize: 13, lineHeight: 20, textAlign: "center", padding: 24 },
	group: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 14,
		paddingVertical: 12,
	},
	avatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	avatarLetter: { fontSize: 16 },
	middle: { flex: 1, gap: 2 },
	rowHead: {
		flexDirection: "row",
		alignItems: "baseline",
		justifyContent: "space-between",
		gap: 8,
	},
	name: { fontSize: 14.5, fontWeight: "600", flexShrink: 1 },
	time: { fontSize: 11 },
	preview: { fontSize: 13, lineHeight: 18 },
	// Thread view
	threadBody: { paddingHorizontal: 20, paddingVertical: 16, gap: 10 },
	bubbleRow: { flexDirection: "row" },
	bubbleRowMine: { justifyContent: "flex-end" },
	bubbleRowTheirs: { justifyContent: "flex-start" },
	bubble: {
		maxWidth: "80%",
		borderRadius: 16,
		paddingHorizontal: 13,
		paddingVertical: 9,
	},
	bubbleText: { fontSize: 14, lineHeight: 20 },
	bubbleTime: { fontSize: 10, marginTop: 4 },
	composerWrap: {
		borderTopWidth: StyleSheet.hairlineWidth,
		paddingHorizontal: 16,
		paddingTop: 10,
	},
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
});
