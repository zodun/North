import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { memo, useState } from "react";
import {
	Dimensions,
	ImageBackground,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";

import type { FeedItem } from "@/lib/feed/types";

const { width: SCREEN_W } = Dimensions.get("window");
const THUMB_H = Math.round((SCREEN_W - 28) * (9 / 16));

type Props = {
	item: FeedItem;
	isSaved: boolean;
	onSave: () => void;
	onWatch: () => void;
};

export const VideoCard = memo(function VideoCard({
	item,
	isSaved,
	onSave,
	onWatch,
}: Props) {
	const [saved, setSaved] = useState(isSaved);

	const openLink = () => {
		if (!item.external_url) return;
		const url = item.external_url;
		const m = url.match(/[?&]v=([^&]+)/);
		void Linking.openURL(
			m?.[1] ? `https://www.youtube.com/watch?v=${m[1]}` : url,
		);
		onWatch();
	};

	const handleSave = () => {
		setSaved((s) => !s);
		onSave();
	};

	const channelLabel = item.source ?? "Video";

	const thumbContent = (
		<>
			{/* subtle full overlay */}
			<View style={s.overlay} />

			{/* bottom gradient simulation */}
			<View style={s.gradientBottom} />

			{/* channel pill — top left */}
			<View style={s.channelRow}>
				<View style={s.channelPill}>
					<Ionicons name="logo-youtube" size={11} color="#FF0000" />
					<Text style={s.channelText} numberOfLines={1}>
						{channelLabel}
					</Text>
				</View>
			</View>

			{/* play button — centered */}
			<View style={s.playWrap}>
				<View style={s.playCircle}>
					<Ionicons
						name="play"
						size={22}
						color="#fff"
						style={{ marginLeft: 3 }}
					/>
				</View>
			</View>

			{/* title + eyebrow — bottom */}
			<View style={s.captionBlock}>
				{item.eyebrow ? (
					<Text style={s.eyebrow} numberOfLines={1}>
						{item.eyebrow.toUpperCase()}
					</Text>
				) : null}
				<Text style={s.title} numberOfLines={2}>
					{item.title}
				</Text>
			</View>
		</>
	);

	return (
		<Pressable
			onPress={openLink}
			style={({ pressed }) => [s.card, pressed && s.cardPressed]}
			accessibilityRole="button"
			accessibilityLabel={`Watch: ${item.title}`}
		>
			{/* Thumbnail */}
			{item.thumbnail_url ? (
				<ImageBackground
					source={{ uri: item.thumbnail_url }}
					style={s.thumb}
					imageStyle={s.thumbImg}
					resizeMode="cover"
				>
					{thumbContent}
				</ImageBackground>
			) : (
				<View style={[s.thumb, s.thumbFallback]}>{thumbContent}</View>
			)}

			{/* Footer */}
			<View style={s.footer}>
				<Pressable
					onPress={handleSave}
					hitSlop={10}
					accessibilityRole="button"
					accessibilityLabel={saved ? "Unsave" : "Save"}
					style={({ pressed }) => [s.saveBtn, pressed && { opacity: 0.7 }]}
				>
					<Ionicons
						name={saved ? "bookmark" : "bookmark-outline"}
						size={16}
						color={saved ? "#E8B84B" : "#3A5070"}
					/>
					<Text style={[s.saveTxt, saved && s.saveTxtActive]}>
						{saved ? "Saved" : "Save"}
					</Text>
				</Pressable>

				<Pressable
					onPress={openLink}
					hitSlop={10}
					accessibilityRole="link"
					style={({ pressed }) => [s.watchBtn, pressed && { opacity: 0.7 }]}
				>
					<Text style={s.watchTxt}>Watch</Text>
					<Ionicons name="arrow-forward" size={13} color="#E8B84B" />
				</Pressable>
			</View>
		</Pressable>
	);
});

const s = StyleSheet.create({
	card: {
		marginHorizontal: 14,
		marginBottom: 14,
		borderRadius: 16,
		overflow: "hidden",
		backgroundColor: "#0D1520",
		borderWidth: 0.5,
		borderColor: "#1D2A3F",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.25,
		shadowRadius: 12,
		elevation: 6,
	},
	cardPressed: {
		opacity: 0.92,
		transform: [{ scale: 0.99 }],
	},

	// Thumbnail
	thumb: {
		width: "100%",
		height: THUMB_H,
		justifyContent: "space-between",
	},
	thumbImg: {
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
	},
	thumbFallback: {
		backgroundColor: "#111827",
	},
	overlay: {
		...StyleSheet.absoluteFill,
		backgroundColor: "rgba(0,0,0,0.28)",
	},
	gradientBottom: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
		height: THUMB_H * 0.55,
		backgroundColor: "rgba(5,8,18,0.75)",
	},

	// Channel pill
	channelRow: {
		paddingTop: 12,
		paddingHorizontal: 12,
	},
	channelPill: {
		alignSelf: "flex-start",
		flexDirection: "row",
		alignItems: "center",
		gap: 5,
		backgroundColor: "rgba(0,0,0,0.55)",
		borderRadius: 99,
		paddingHorizontal: 9,
		paddingVertical: 4,
		borderWidth: 0.5,
		borderColor: "rgba(255,255,255,0.12)",
	},
	channelText: {
		fontSize: 11,
		fontWeight: "600",
		color: "#D0D8E8",
		maxWidth: 180,
	},

	// Play button
	playWrap: {
		...StyleSheet.absoluteFill,
		alignItems: "center",
		justifyContent: "center",
	},
	playCircle: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: "rgba(0,0,0,0.52)",
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1.5,
		borderColor: "rgba(255,255,255,0.5)",
	},

	// Caption block
	captionBlock: {
		paddingHorizontal: 14,
		paddingBottom: 14,
		gap: 4,
	},
	eyebrow: {
		fontSize: 9,
		fontWeight: "700",
		color: "#E8B84B",
		letterSpacing: 1.5,
	},
	title: {
		fontSize: 15,
		fontWeight: "700",
		color: "#F0EDE8",
		lineHeight: 21,
		letterSpacing: -0.2,
	},

	// Footer
	footer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: "#0D1520",
	},
	saveBtn: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	saveTxt: {
		fontSize: 13,
		color: "#3A5070",
	},
	saveTxtActive: {
		color: "#E8B84B",
	},
	watchBtn: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	watchTxt: {
		fontSize: 13,
		fontWeight: "600",
		color: "#E8B84B",
	},
});
