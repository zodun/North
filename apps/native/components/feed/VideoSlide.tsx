import { getNorthTokens } from "@north/tokens";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { memo, useEffect, useRef } from "react";
import {
	ImageBackground,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import type { Creator, FeedItem } from "@/lib/feed/types";

const { p, t } = getNorthTokens();

type Props = {
	item: FeedItem;
	containerHeight: number;
	containerWidth: number;
	isActive: boolean;
	onWatch: () => void;
	creator: Creator | null;
	isFollowing: boolean;
	onToggleFollow: () => void;
};

export const VideoSlide = memo(function VideoSlide({
	item,
	containerHeight,
	containerWidth,
	isActive,
	onWatch,
	creator,
	isFollowing,
	onToggleFollow,
}: Props) {
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

			{/* Bottom-left: creator + title + channel */}
			<View style={s.caption}>
				{creator ? (
					<View style={s.creatorRow}>
						<View style={s.avatar}>
							<Text style={s.avatarText}>{creator.name[0]?.toUpperCase()}</Text>
						</View>
						<View style={s.creatorMeta}>
							<Text style={s.creatorName} numberOfLines={1}>
								{creator.name}
							</Text>
							{creator.tagline ? (
								<Text style={s.creatorTagline} numberOfLines={1}>
									{creator.tagline}
								</Text>
							) : null}
						</View>
						<Pressable
							onPress={onToggleFollow}
							accessibilityRole="button"
							accessibilityLabel={
								isFollowing
									? `Unfollow ${creator.name}`
									: `Follow ${creator.name}`
							}
							style={({ pressed }) => [
								isFollowing ? s.followingPill : s.followPill,
								pressed && { opacity: 0.75 },
							]}
						>
							<Text
								style={isFollowing ? s.followingPillText : s.followPillText}
							>
								{isFollowing ? "Following" : "Follow"}
							</Text>
						</Pressable>
					</View>
				) : null}
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
	creatorRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 4,
	},
	avatar: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: p.gold,
		alignItems: "center",
		justifyContent: "center",
	},
	avatarText: { fontFamily: t.display, fontSize: 14, color: p.accentInk },
	creatorMeta: { flexShrink: 1 },
	creatorName: {
		fontFamily: t.ui,
		fontSize: 13,
		fontWeight: "700",
		color: "#fff",
	},
	creatorTagline: {
		fontFamily: t.ui,
		fontSize: 11,
		color: "rgba(255,255,255,0.7)",
	},
	// Follow = the next action, so the pill takes the gold. Following recedes
	// to a quiet outline — no longer asking anything of you.
	followPill: {
		paddingHorizontal: 14,
		height: 30,
		borderRadius: 15,
		backgroundColor: p.gold,
		alignItems: "center",
		justifyContent: "center",
	},
	followPillText: {
		fontFamily: t.ui,
		fontSize: 12,
		fontWeight: "700",
		color: p.accentInk,
	},
	followingPill: {
		paddingHorizontal: 14,
		height: 30,
		borderRadius: 15,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.45)",
		alignItems: "center",
		justifyContent: "center",
	},
	followingPillText: {
		fontFamily: t.ui,
		fontSize: 12,
		fontWeight: "600",
		color: "rgba(255,255,255,0.9)",
	},
	eyebrow: {
		fontSize: 9,
		fontWeight: "700",
		color: p.gold,
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
});
