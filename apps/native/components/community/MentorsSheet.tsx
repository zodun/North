// Mentor directory: people a step ahead, browsable in one hairline list.
// Availability is a quiet word, not a status light; "Request intro" is
// the single gold action and it opens a DM thread.

import { Icon } from "@north/native-ui";
import type { getNorthTokens } from "@north/tokens";
import {
	ActivityIndicator,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";

import type { Mentor } from "@/lib/community/types";
import { SpaceSheet } from "./SpaceSheet";

type Tokens = ReturnType<typeof getNorthTokens>;

const AVAILABILITY_LABEL: Record<Mentor["availability"], string> = {
	open: "Open to intros",
	limited: "A few spots",
	full: "Full for now",
};

export function MentorsSheet({
	visible,
	mentors,
	loading,
	p,
	t,
	onRequestIntro,
	onClose,
}: {
	visible: boolean;
	mentors: Mentor[];
	loading: boolean;
	p: Tokens["p"];
	t: Tokens["t"];
	onRequestIntro: (mentor: Mentor) => void;
	onClose: () => void;
}) {
	return (
		<SpaceSheet visible={visible} title="Mentors" p={p} t={t} onClose={onClose}>
			<Text style={[s.lede, { color: p.inkMid, fontFamily: t.ui }]}>
				People a step or two ahead, willing to talk. One intro at a time.
			</Text>

			{loading ? (
				<ActivityIndicator color={p.gold} style={{ marginTop: 24 }} />
			) : mentors.length === 0 ? (
				<Text style={[s.empty, { color: p.inkDim, fontFamily: t.ui }]}>
					The directory is still filling up. Check back soon.
				</Text>
			) : (
				<View
					style={[s.group, { backgroundColor: p.surface, borderColor: p.line }]}
				>
					{mentors.map((m, i) => {
						const availColor =
							m.availability === "open"
								? p.greenInk
								: m.availability === "limited"
									? p.goldInk
									: p.inkDim;
						const canRequest = m.availability !== "full" && !m.introRequested;
						return (
							<View
								key={m.id}
								style={[
									s.row,
									i > 0 && {
										borderTopWidth: StyleSheet.hairlineWidth,
										borderTopColor: p.line,
									},
								]}
							>
								<View style={[s.avatar, { backgroundColor: p.surfaceHi }]}>
									<Text
										style={[
											s.avatarLetter,
											{ color: p.inkMid, fontFamily: t.display },
										]}
									>
										{m.name[0]?.toUpperCase() ?? "?"}
									</Text>
								</View>
								<View style={s.middle}>
									<Text
										style={[s.name, { color: p.ink, fontFamily: t.ui }]}
										numberOfLines={1}
									>
										{m.name}
									</Text>
									<Text
										style={[s.role, { color: p.inkMid, fontFamily: t.ui }]}
										numberOfLines={1}
									>
										{m.role} · {m.org}
									</Text>
									<Text
										style={[s.focus, { color: p.inkDim, fontFamily: t.ui }]}
										numberOfLines={1}
									>
										{m.focusAreas.join(" · ")}
									</Text>
									<Text
										style={[s.avail, { color: availColor, fontFamily: t.ui }]}
									>
										{AVAILABILITY_LABEL[m.availability]}
									</Text>
								</View>
								{m.introRequested ? (
									<View style={s.requestedWrap}>
										<Icon name="check" size={13} color={p.greenInk} />
										<Text
											style={[
												s.requestedLabel,
												{ color: p.greenInk, fontFamily: t.ui },
											]}
										>
											Requested
										</Text>
									</View>
								) : (
									<Pressable
										onPress={() => onRequestIntro(m)}
										disabled={!canRequest}
										accessibilityRole="button"
										accessibilityLabel={`Request an intro to ${m.name}`}
										hitSlop={8}
										style={({ pressed }) => [
											s.requestBtn,
											pressed && { opacity: 0.6 },
											!canRequest && { opacity: 0.4 },
										]}
									>
										<Text
											style={[
												s.requestLabel,
												{
													color: canRequest ? p.goldInk : p.inkDim,
													fontFamily: t.ui,
												},
											]}
										>
											Request intro
										</Text>
									</Pressable>
								)}
							</View>
						);
					})}
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
	avatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	avatarLetter: { fontSize: 16 },
	middle: { flex: 1, gap: 1 },
	name: { fontSize: 14.5, fontWeight: "600" },
	role: { fontSize: 12.5 },
	focus: { fontSize: 11.5 },
	avail: { fontSize: 11, fontWeight: "600", marginTop: 3 },
	requestBtn: { paddingVertical: 6, paddingLeft: 4 },
	requestLabel: { fontSize: 12.5, fontWeight: "600" },
	requestedWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
	requestedLabel: { fontSize: 12, fontWeight: "500" },
});
