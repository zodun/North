import { Ionicons } from "@expo/vector-icons";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { memo, useEffect, useRef, useState } from "react";
import {
	ImageBackground,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import type { FeedItem } from "@/lib/feed/types";

type Props = {
	item: FeedItem;
	containerHeight: number;
	containerWidth: number;
	isSaved: boolean;
	isActive: boolean;
	onSave: () => void;
	onWatch: () => void;
};

export const VideoSlide = memo(function VideoSlide({
	item,
	containerHeight,
	containerWidth,
	isSaved,
	isActive,
	onSave,
	onWatch,
}: Props) {
	const [saved, setSaved] = useState(isSaved);

	// Keep onWatch stable so the status useEffect doesn't re-fire on every render.
	const onWatchRef = useRef(onWatch);
	onWatchRef.current = onWatch;

	const player = useVideoPlayer(item.external_url ?? "", (p) => {
		p.loop = true;
		p.muted = false;
	});

	// Play/pause when the slide scrolls in or out of view.
	useEffect(() => {
		if (isActive) {
			player.play();
		} else {
			player.pause();
		}
	}, [isActive, player]);

	// useEvent returns the latest event payload reactively (it is NOT a callback).
	// Trigger play + record the watch event the moment the player becomes ready
	// while this slide is already active (covers the race where isActive fires
	// before the source has finished buffering).
	const { status } = useEvent(player, "statusChange", {
		status: player.status,
	});
	useEffect(() => {
		if (status === "readyToPlay" && isActive) {
			player.play();
			onWatchRef.current();
		}
	}, [status, isActive, player]);

	const handleSave = () => {
		setSaved((s) => !s);
		onSave();
	};

	return (
		<View style={[s.slide, { height: containerHeight, width: containerWidth }]}>
			{/* Thumbnail shown while video loads */}
			{item.thumbnail_url ? (
				<ImageBackground
					source={{ uri: item.thumbnail_url }}
					style={StyleSheet.absoluteFill}
					resizeMode="cover"
				/>
			) : null}

			<VideoView
				player={player}
				style={StyleSheet.absoluteFill}
				contentFit="cover"
				nativeControls={false}
			/>

			{/* Caption scrim — a true gradient fade, not a hard-edged block:
			    transparent at its top so there is no visible seam over the video. */}
			<View style={s.scrim} pointerEvents="none">
				<Svg width="100%" height="100%" preserveAspectRatio="none">
					<Defs>
						<LinearGradient id="captionScrim" x1="0" y1="0" x2="0" y2="1">
							<Stop offset="0" stopColor="#000" stopOpacity="0" />
							<Stop offset="0.5" stopColor="#000" stopOpacity="0.35" />
							<Stop offset="1" stopColor="#000" stopOpacity="0.78" />
						</LinearGradient>
					</Defs>
					<Rect width="100%" height="100%" fill="url(#captionScrim)" />
				</Svg>
			</View>

			{/* Bottom-left: title + channel */}
			<View style={s.caption} pointerEvents="none">
				{item.eyebrow ? (
					<Text style={s.eyebrow}>{item.eyebrow.toUpperCase()}</Text>
				) : null}
				<Text style={s.title} numberOfLines={3}>
					{item.title}
				</Text>
				{item.source ? (
					<Text style={s.channel} numberOfLines={1}>
						{item.source}
					</Text>
				) : null}
			</View>

			{/* Right-side save action */}
			<View style={s.actions}>
				<Pressable
					onPress={handleSave}
					style={({ pressed }) => [s.actionBtn, pressed && s.actionBtnPressed]}
					accessibilityRole="button"
					accessibilityLabel={saved ? "Unsave" : "Save"}
				>
					<Ionicons
						name={saved ? "bookmark" : "bookmark-outline"}
						size={28}
						color={saved ? "#F0B429" : "#fff"}
					/>
					<Text style={[s.actionLabel, saved && s.actionLabelGold]}>
						{saved ? "Saved" : "Save"}
					</Text>
				</Pressable>
			</View>
		</View>
	);
});

const s = StyleSheet.create({
	slide: { backgroundColor: "#000", overflow: "hidden" },
	scrim: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
		height: "38%",
	},
	caption: {
		position: "absolute",
		left: 18,
		right: 80,
		bottom: 24,
		gap: 6,
	},
	eyebrow: {
		fontSize: 9,
		fontWeight: "700",
		color: "#F0B429",
		letterSpacing: 1.5,
	},
	title: {
		fontSize: 16,
		fontWeight: "700",
		color: "#fff",
		lineHeight: 22,
		letterSpacing: -0.2,
		textShadowColor: "rgba(0,0,0,0.7)",
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 6,
	},
	channel: {
		fontSize: 12,
		color: "rgba(255,255,255,0.75)",
		fontWeight: "500",
	},
	actions: {
		position: "absolute",
		right: 16,
		bottom: 24,
		alignItems: "center",
		gap: 20,
	},
	actionBtn: { alignItems: "center", gap: 4 },
	actionBtnPressed: { opacity: 0.7, transform: [{ scale: 0.9 }] },
	actionLabel: {
		fontSize: 11,
		color: "rgba(255,255,255,0.8)",
		fontWeight: "500",
	},
	actionLabelGold: { color: "#F0B429" },
});
