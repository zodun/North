// Events & meetups: upcoming gatherings in one hairline list. The date
// is a quiet two-line block, RSVP settles into a green "Going".

import { Icon } from "@north/native-ui";
import type { getNorthTokens } from "@north/tokens";
import {
	ActivityIndicator,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";

import type { CommunityEvent } from "@/lib/community/types";
import { SpaceSheet } from "./SpaceSheet";

type Tokens = ReturnType<typeof getNorthTokens>;

function dateParts(iso: string): { month: string; day: string } {
	const d = new Date(iso);
	return {
		month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
		day: String(d.getDate()),
	};
}

function timeLabel(iso: string): string {
	return new Date(iso).toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
	});
}

export function EventsSheet({
	visible,
	events,
	loading,
	p,
	t,
	onToggleRsvp,
	onClose,
}: {
	visible: boolean;
	events: CommunityEvent[];
	loading: boolean;
	p: Tokens["p"];
	t: Tokens["t"];
	onToggleRsvp: (id: string) => void;
	onClose: () => void;
}) {
	return (
		<SpaceSheet visible={visible} title="Events" p={p} t={t} onClose={onClose}>
			<Text style={[s.lede, { color: p.inkMid, fontFamily: t.ui }]}>
				Meet the people you've been moving with. RSVP and it pins to your tab.
			</Text>

			{loading ? (
				<ActivityIndicator color={p.gold} style={{ marginTop: 24 }} />
			) : events.length === 0 ? (
				<Text style={[s.empty, { color: p.inkDim, fontFamily: t.ui }]}>
					Nothing on the calendar yet.
				</Text>
			) : (
				<View
					style={[s.group, { backgroundColor: p.surface, borderColor: p.line }]}
				>
					{events.map((e, i) => {
						const { month, day } = dateParts(e.startsAt);
						return (
							<View
								key={e.id}
								style={[
									s.row,
									i > 0 && {
										borderTopWidth: StyleSheet.hairlineWidth,
										borderTopColor: p.line,
									},
								]}
							>
								<View style={[s.dateBlock, { backgroundColor: p.surfaceHi }]}>
									<Text
										style={[s.dateMonth, { color: p.inkDim, fontFamily: t.ui }]}
									>
										{month}
									</Text>
									<Text
										style={[s.dateDay, { color: p.ink, fontFamily: t.display }]}
									>
										{day}
									</Text>
								</View>
								<View style={s.middle}>
									<Text
										style={[s.title, { color: p.ink, fontFamily: t.ui }]}
										numberOfLines={2}
									>
										{e.title}
									</Text>
									<Text
										style={[s.meta, { color: p.inkMid, fontFamily: t.ui }]}
										numberOfLines={1}
									>
										{e.online ? "Online" : e.city} · {timeLabel(e.startsAt)}
									</Text>
									<Text
										style={[s.host, { color: p.inkDim, fontFamily: t.ui }]}
										numberOfLines={1}
									>
										Hosted by {e.host}
									</Text>
								</View>
								<Pressable
									onPress={() => onToggleRsvp(e.id)}
									accessibilityRole="button"
									accessibilityLabel={
										e.rsvped
											? `Cancel RSVP for ${e.title}`
											: `RSVP to ${e.title}`
									}
									hitSlop={8}
									style={({ pressed }) => [
										s.rsvpBtn,
										pressed && { opacity: 0.6 },
									]}
								>
									{e.rsvped ? (
										<View style={s.goingWrap}>
											<Icon name="check" size={13} color={p.greenInk} />
											<Text
												style={[
													s.goingLabel,
													{ color: p.greenInk, fontFamily: t.ui },
												]}
											>
												Going
											</Text>
										</View>
									) : (
										<Text
											style={[
												s.rsvpLabel,
												{ color: p.goldInk, fontFamily: t.ui },
											]}
										>
											RSVP
										</Text>
									)}
								</Pressable>
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
	dateBlock: {
		width: 44,
		height: 48,
		borderRadius: 10,
		alignItems: "center",
		justifyContent: "center",
	},
	dateMonth: { fontSize: 9, fontWeight: "600", letterSpacing: 1 },
	dateDay: { fontSize: 17, marginTop: 1 },
	middle: { flex: 1, gap: 1 },
	title: { fontSize: 14, fontWeight: "600", lineHeight: 19 },
	meta: { fontSize: 12 },
	host: { fontSize: 11 },
	rsvpBtn: { paddingVertical: 6, paddingLeft: 4 },
	rsvpLabel: { fontSize: 13, fontWeight: "600" },
	goingWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
	goingLabel: { fontSize: 12.5, fontWeight: "500" },
});
