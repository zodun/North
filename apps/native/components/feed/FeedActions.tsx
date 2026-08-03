// Right-side action rail for a For You slide: like, comment, share, save.
// Lives on the feed's sanctioned dark surface — icons are white, active
// states take Signal Gold (the one accent = the action you took).

import { Icon } from "@north/native-ui";
import { getNorthTokens } from "@north/tokens";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const { p, t } = getNorthTokens();

type Props = {
	liked: boolean;
	likeCount: number;
	commentCount: number;
	saved: boolean;
	onLike: () => void;
	onComment: () => void;
	onShare: () => void;
	onSave: () => void;
};

function formatCount(n: number): string | null {
	if (n <= 0) return null;
	if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
	return String(n);
}

export function FeedActions({
	liked,
	likeCount,
	commentCount,
	saved,
	onLike,
	onComment,
	onShare,
	onSave,
}: Props) {
	return (
		<View style={s.column}>
			<RailButton
				label={liked ? "Liked" : "Like"}
				count={formatCount(likeCount)}
				active={liked}
				onPress={onLike}
			>
				<Icon
					name={liked ? "heartFilled" : "heart"}
					size={27}
					color={liked ? p.gold : "#FFFFFF"}
				/>
			</RailButton>

			<RailButton
				label="Comment"
				count={formatCount(commentCount)}
				active={false}
				onPress={onComment}
			>
				<Icon name="write" size={25} color="#FFFFFF" />
			</RailButton>

			<RailButton label="Share" count={null} active={false} onPress={onShare}>
				<Icon name="share" size={24} color="#FFFFFF" />
			</RailButton>

			<RailButton
				label={saved ? "Saved" : "Save"}
				count={null}
				active={saved}
				onPress={onSave}
			>
				<Icon
					name={saved ? "bookmarkFilled" : "bookmark"}
					size={25}
					color={saved ? p.gold : "#FFFFFF"}
				/>
			</RailButton>
		</View>
	);
}

function RailButton({
	label,
	count,
	active,
	onPress,
	children,
}: {
	label: string;
	count: string | null;
	active: boolean;
	onPress: () => void;
	children: ReactNode;
}) {
	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={count ? `${label}, ${count}` : label}
			style={({ pressed }) => [
				s.btn,
				pressed && { opacity: 0.65, transform: [{ scale: 0.92 }] },
			]}
		>
			{children}
			<Text style={[s.label, active && { color: p.gold }]}>
				{count ?? label}
			</Text>
		</Pressable>
	);
}

const s = StyleSheet.create({
	column: {
		position: "absolute",
		right: 12,
		bottom: 96,
		alignItems: "center",
		gap: 18,
	},
	btn: {
		minWidth: 48,
		minHeight: 48,
		alignItems: "center",
		justifyContent: "center",
		gap: 3,
	},
	label: {
		fontSize: 11,
		color: "rgba(255,255,255,0.85)",
		fontFamily: t.ui,
		fontWeight: "600",
	},
});
