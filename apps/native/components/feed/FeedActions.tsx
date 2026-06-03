// Right-side action column for a feed card (FEED-03).
// Renders save (bookmark), matters (heart), and share buttons.
// Active state is shown with the filled icon variant + accent colour.

import { Icon } from "@north/native-ui";
import type { Palette, TypePairing } from "@north/tokens";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";

type Props = {
	p: Palette;
	t: TypePairing;
	itemId: string;
	externalUrl: string | null;
	title: string;
	isSaved: boolean;
	isMatters: boolean;
	onSave: () => void;
	onMatters: () => void;
	onShare: () => void;
};

export function FeedActions({
	p,
	t,
	externalUrl,
	title,
	isSaved,
	isMatters,
	onSave,
	onMatters,
	onShare,
}: Props) {
	const handleShare = async () => {
		onShare();
		await Share.share(
			{
				title,
				message: externalUrl ? `${title}\n${externalUrl}` : title,
				url: externalUrl ?? undefined,
			},
			{ dialogTitle: title },
		);
	};

	return (
		<View style={styles.column}>
			<ActionButton
				p={p}
				t={t}
				label={isMatters ? "Resonates" : "Resonates"}
				onPress={onMatters}
			>
				<Icon
					name={isMatters ? "heartFilled" : "heart"}
					size={26}
					color={isMatters ? p.accent : p.inkMid}
				/>
			</ActionButton>

			<ActionButton p={p} t={t} label="Save" onPress={onSave}>
				<Icon
					name={isSaved ? "bookmarkFilled" : "bookmark"}
					size={26}
					color={isSaved ? p.accent : p.inkMid}
				/>
			</ActionButton>

			<ActionButton p={p} t={t} label="Share" onPress={handleShare}>
				<Icon name="share" size={24} color={p.inkMid} />
			</ActionButton>
		</View>
	);
}

function ActionButton({
	p,
	t,
	label,
	onPress,
	children,
}: {
	p: Palette;
	t: TypePairing;
	label: string;
	onPress: () => void;
	children: React.ReactNode;
}) {
	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={label}
			style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.7 : 1 }]}
		>
			{children}
			<Text style={{ color: p.inkDim, fontFamily: t.ui, fontSize: 10 }}>
				{label}
			</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	column: {
		position: "absolute",
		right: 16,
		bottom: 100,
		gap: 24,
		alignItems: "center",
	},
	btn: {
		minWidth: 44,
		minHeight: 44,
		alignItems: "center",
		justifyContent: "center",
		gap: 4,
	},
});
