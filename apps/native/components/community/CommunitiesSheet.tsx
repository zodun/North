// Communities by interest: one grouped hairline list. Join is the only
// action, so it carries the gold; Joined settles into a quiet green check.

import { Icon } from "@north/native-ui";
import type { getNorthTokens } from "@north/tokens";
import {
	ActivityIndicator,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";

import type { InterestCommunity } from "@/lib/community/types";
import { SpaceSheet } from "./SpaceSheet";

type Tokens = ReturnType<typeof getNorthTokens>;

export function CommunitiesSheet({
	visible,
	communities,
	loading,
	p,
	t,
	onToggleJoin,
	onClose,
}: {
	visible: boolean;
	communities: InterestCommunity[];
	loading: boolean;
	p: Tokens["p"];
	t: Tokens["t"];
	onToggleJoin: (id: string) => void;
	onClose: () => void;
}) {
	return (
		<SpaceSheet
			visible={visible}
			title="Communities"
			p={p}
			t={t}
			onClose={onClose}
		>
			<Text style={[s.lede, { color: p.inkMid, fontFamily: t.ui }]}>
				Rooms around a shared interest. Join the ones on your path.
			</Text>

			{loading ? (
				<ActivityIndicator color={p.gold} style={{ marginTop: 24 }} />
			) : communities.length === 0 ? (
				<Text style={[s.empty, { color: p.inkDim, fontFamily: t.ui }]}>
					No communities yet — they're on their way.
				</Text>
			) : (
				<View
					style={[s.group, { backgroundColor: p.surface, borderColor: p.line }]}
				>
					{communities.map((c, i) => (
						<View
							key={c.id}
							style={[
								s.row,
								i > 0 && {
									borderTopWidth: StyleSheet.hairlineWidth,
									borderTopColor: p.line,
								},
							]}
						>
							<View style={s.middle}>
								<Text
									style={[s.name, { color: p.ink, fontFamily: t.ui }]}
									numberOfLines={1}
								>
									{c.name}
								</Text>
								<Text
									style={[s.about, { color: p.inkMid, fontFamily: t.ui }]}
									numberOfLines={2}
								>
									{c.about}
								</Text>
								<Text style={[s.meta, { color: p.inkDim, fontFamily: t.ui }]}>
									{c.memberCount} {c.memberCount === 1 ? "member" : "members"}
								</Text>
							</View>
							<Pressable
								onPress={() => onToggleJoin(c.id)}
								accessibilityRole="button"
								accessibilityLabel={
									c.joined ? `Leave ${c.name}` : `Join ${c.name}`
								}
								hitSlop={8}
								style={({ pressed }) => [
									s.joinBtn,
									pressed && { opacity: 0.6 },
								]}
							>
								{c.joined ? (
									<View style={s.joinedWrap}>
										<Icon name="check" size={13} color={p.greenInk} />
										<Text
											style={[
												s.joinedLabel,
												{ color: p.greenInk, fontFamily: t.ui },
											]}
										>
											Joined
										</Text>
									</View>
								) : (
									<Text
										style={[
											s.joinLabel,
											{ color: p.goldInk, fontFamily: t.ui },
										]}
									>
										Join
									</Text>
								)}
							</Pressable>
						</View>
					))}
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
	name: { fontSize: 14.5, fontWeight: "600" },
	about: { fontSize: 12.5, lineHeight: 17 },
	meta: { fontSize: 11, marginTop: 2 },
	joinBtn: { paddingVertical: 6, paddingLeft: 4 },
	joinLabel: { fontSize: 13, fontWeight: "600" },
	joinedWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
	joinedLabel: { fontSize: 12.5, fontWeight: "500" },
});
