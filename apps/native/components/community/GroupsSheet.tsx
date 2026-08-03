// Mission groups: small accountability circles around one shared goal.
// List view → tap a group for detail (members + a note thread that
// reuses the discussion composer grammar). Join/leave is the one action.

import { Icon } from "@north/native-ui";
import type { getNorthTokens } from "@north/tokens";
import { useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";

import type { MissionGroup } from "@/lib/community/types";
import { useGroupNotes } from "@/lib/community/use-spaces";
import { SpaceSheet } from "./SpaceSheet";

type Tokens = ReturnType<typeof getNorthTokens>;

function timeAgo(iso: string): string {
	const mins = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60000));
	if (mins < 60) return `${mins}m`;
	const hours = Math.round(mins / 60);
	if (hours < 24) return `${hours}h`;
	return `${Math.round(hours / 24)}d`;
}

export function GroupsSheet({
	visible,
	groups,
	loading,
	p,
	t,
	onToggleJoin,
	onOpenAuthor,
	onClose,
}: {
	visible: boolean;
	groups: MissionGroup[];
	loading: boolean;
	p: Tokens["p"];
	t: Tokens["t"];
	onToggleJoin: (id: string) => void;
	onOpenAuthor: (name: string) => void;
	onClose: () => void;
}) {
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const selected = groups.find((g) => g.id === selectedId) ?? null;
	const { notes, submitting, submit } = useGroupNotes(selected?.id ?? null);
	const [draft, setDraft] = useState("");

	async function postNote() {
		const ok = await submit(draft);
		if (ok) setDraft("");
	}

	const canPost = !!draft.trim() && !submitting;

	function close() {
		setSelectedId(null);
		onClose();
	}

	return (
		<SpaceSheet
			visible={visible}
			title={selected ? selected.name : "Mission groups"}
			p={p}
			t={t}
			onClose={close}
			onBack={selected ? () => setSelectedId(null) : undefined}
			backLabel="Groups"
		>
			{selected ? (
				<View>
					{/* Goal + cadence */}
					<Text style={[s.detailGoal, { color: p.goldInk, fontFamily: t.ui }]}>
						→ {selected.goal}
					</Text>
					<Text style={[s.detailMeta, { color: p.inkDim, fontFamily: t.ui }]}>
						{selected.cadence} · {selected.members.length}{" "}
						{selected.members.length === 1 ? "member" : "members"}
					</Text>

					<Pressable
						onPress={() => onToggleJoin(selected.id)}
						accessibilityRole="button"
						style={({ pressed }) => [
							s.joinBtn,
							selected.joined
								? { borderColor: p.line, backgroundColor: p.surface }
								: { backgroundColor: p.gold, borderColor: p.gold },
							pressed && { opacity: 0.8 },
						]}
					>
						<Text
							style={[
								s.joinBtnLabel,
								{
									color: selected.joined ? p.inkMid : p.accentInk,
									fontFamily: t.ui,
								},
							]}
						>
							{selected.joined ? "Leave group" : "Join group"}
						</Text>
					</Pressable>

					{/* Members */}
					<Text style={[s.eyebrow, { color: p.inkDim, fontFamily: t.ui }]}>
						MEMBERS
					</Text>
					<View
						style={[
							s.group,
							{ backgroundColor: p.surface, borderColor: p.line },
						]}
					>
						{selected.members.map((name, i) => (
							<Pressable
								key={name}
								onPress={() => onOpenAuthor(name)}
								accessibilityRole="button"
								accessibilityLabel={`View ${name}'s profile`}
								style={({ pressed }) => [
									s.memberRow,
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
										{name[0]?.toUpperCase() ?? "?"}
									</Text>
								</View>
								<Text
									style={[s.memberName, { color: p.ink, fontFamily: t.ui }]}
								>
									{name}
								</Text>
							</Pressable>
						))}
					</View>

					{/* Notes thread — same composer grammar as the tab discussion */}
					<Text style={[s.eyebrow, { color: p.inkDim, fontFamily: t.ui }]}>
						GROUP NOTES
					</Text>
					<View
						style={[
							s.composer,
							{ backgroundColor: p.surface, borderColor: p.line },
						]}
					>
						<TextInput
							value={draft}
							onChangeText={setDraft}
							placeholder="Leave a note for the group…"
							placeholderTextColor={p.inkDim}
							multiline
							maxLength={500}
							style={[s.composerInput, { color: p.ink, fontFamily: t.ui }]}
						/>
						<Pressable
							onPress={() => void postNote()}
							disabled={!canPost}
							accessibilityRole="button"
							accessibilityLabel="Post note"
							style={({ pressed }) => [
								s.composerBtn,
								{
									backgroundColor: canPost ? p.gold : `${p.gold}44`,
									opacity: pressed ? 0.8 : 1,
								},
							]}
						>
							{submitting ? (
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

					{notes.length === 0 ? (
						<Text style={[s.empty, { color: p.inkDim, fontFamily: t.ui }]}>
							No notes yet. A weekly line keeps the group honest.
						</Text>
					) : (
						<View
							style={[
								s.group,
								{
									backgroundColor: p.surface,
									borderColor: p.line,
									marginTop: 10,
								},
							]}
						>
							{notes.map((note, i) => (
								<View
									key={note.id}
									style={[
										s.noteRow,
										i > 0 && {
											borderTopWidth: StyleSheet.hairlineWidth,
											borderTopColor: p.line,
										},
									]}
								>
									<View style={s.noteHead}>
										<Pressable
											onPress={() => onOpenAuthor(note.author)}
											hitSlop={6}
										>
											<Text
												style={[
													s.noteAuthor,
													{ color: p.ink, fontFamily: t.ui },
												]}
											>
												{note.isMine ? `${note.author} (you)` : note.author}
											</Text>
										</Pressable>
										<Text
											style={[
												s.noteTime,
												{ color: p.inkDim, fontFamily: t.ui },
											]}
										>
											{timeAgo(note.createdAt)}
										</Text>
									</View>
									<Text
										style={[s.noteBody, { color: p.inkMid, fontFamily: t.ui }]}
									>
										{note.body}
									</Text>
								</View>
							))}
						</View>
					)}
				</View>
			) : (
				<View>
					<Text style={[s.lede, { color: p.inkMid, fontFamily: t.ui }]}>
						Small circles holding one shared goal, on a rhythm.
					</Text>
					{loading ? (
						<ActivityIndicator color={p.gold} style={{ marginTop: 24 }} />
					) : groups.length === 0 ? (
						<Text style={[s.empty, { color: p.inkDim, fontFamily: t.ui }]}>
							No groups yet — they're on their way.
						</Text>
					) : (
						<View
							style={[
								s.group,
								{ backgroundColor: p.surface, borderColor: p.line },
							]}
						>
							{groups.map((g, i) => (
								<Pressable
									key={g.id}
									onPress={() => setSelectedId(g.id)}
									accessibilityRole="button"
									accessibilityLabel={`Open ${g.name}`}
									style={({ pressed }) => [
										s.row,
										i > 0 && {
											borderTopWidth: StyleSheet.hairlineWidth,
											borderTopColor: p.line,
										},
										pressed && { opacity: 0.7 },
									]}
								>
									<View style={s.middle}>
										<View style={s.nameRow}>
											<Text
												style={[s.name, { color: p.ink, fontFamily: t.ui }]}
												numberOfLines={1}
											>
												{g.name}
											</Text>
											{g.joined ? (
												<Icon name="check" size={13} color={p.greenInk} />
											) : null}
										</View>
										<Text
											style={[s.goal, { color: p.goldInk, fontFamily: t.ui }]}
											numberOfLines={1}
										>
											→ {g.goal}
										</Text>
										<Text
											style={[s.meta, { color: p.inkDim, fontFamily: t.ui }]}
										>
											{g.cadence} · {g.members.length}{" "}
											{g.members.length === 1 ? "member" : "members"}
										</Text>
									</View>
									<Icon name="arrowRight" size={14} color={p.inkDim} />
								</Pressable>
							))}
						</View>
					)}
				</View>
			)}
		</SpaceSheet>
	);
}

const s = StyleSheet.create({
	lede: { fontSize: 13, lineHeight: 19, marginBottom: 16 },
	empty: { fontSize: 13, lineHeight: 20, textAlign: "center", padding: 24 },
	group: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 14,
		paddingVertical: 13,
	},
	middle: { flex: 1, gap: 2 },
	nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
	name: { fontSize: 14.5, fontWeight: "600", flexShrink: 1 },
	goal: { fontSize: 12, fontWeight: "500" },
	meta: { fontSize: 11, marginTop: 2 },
	// Detail
	detailGoal: { fontSize: 13.5, fontWeight: "600", lineHeight: 19 },
	detailMeta: { fontSize: 12, marginTop: 4 },
	joinBtn: {
		marginTop: 14,
		borderRadius: 10,
		borderWidth: 1,
		paddingVertical: 12,
		alignItems: "center",
	},
	joinBtnLabel: { fontSize: 14, fontWeight: "600" },
	eyebrow: {
		fontSize: 10,
		fontWeight: "600",
		letterSpacing: 2,
		marginTop: 24,
		marginBottom: 8,
	},
	memberRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 14,
		paddingVertical: 10,
	},
	avatar: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	avatarLetter: { fontSize: 13 },
	memberName: { fontSize: 14, fontWeight: "500" },
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
	noteRow: { paddingHorizontal: 14, paddingVertical: 12 },
	noteHead: {
		flexDirection: "row",
		alignItems: "baseline",
		justifyContent: "space-between",
		gap: 8,
	},
	noteAuthor: { fontSize: 13, fontWeight: "600" },
	noteTime: { fontSize: 11 },
	noteBody: { fontSize: 13.5, lineHeight: 20, marginTop: 3 },
});
