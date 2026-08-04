import { Icon } from "@north/native-ui";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Image,
	type LayoutChangeEvent,
	Linking,
	Pressable,
	StyleSheet,
	Text,
	View,
	type ViewToken,
} from "react-native";

import { CommentSheet } from "@/components/feed/CommentSheet";
import { FeedActions } from "@/components/feed/FeedActions";
import { StaticSlide } from "@/components/feed/StaticSlide";
import { VideoSlide } from "@/components/feed/VideoSlide";
import { VideoUploadSheet } from "@/components/feed/VideoUploadSheet";
import { registerFeedRefresh } from "@/lib/feed/feed-refresh";
import type { FeedSlide } from "@/lib/feed/types";
import { useForYouFeed } from "@/lib/feed/use-for-you-feed";
import { useInteractions } from "@/lib/feed/use-interactions";
import { shareSlide, useFeedSocial } from "@/lib/feed/use-social";
import { tap } from "@/lib/haptics";

export default function ForYou() {
	// Mixed deck: videos interleaved with signal/opportunity/story/article/
	// discussion slides, digest last. Mock deck under the dev bypass.
	const { slides, feedItems, loading, error, refresh } = useForYouFeed();
	const { isSaved, record } = useInteractions(feedItems);
	const social = useFeedSocial(slides);

	const [showUpload, setShowUpload] = useState(false);
	const [commentsFor, setCommentsFor] = useState<string | null>(null);
	const [containerSize, setContainerSize] = useState<{
		height: number;
		width: number;
	} | null>(null);
	const [activeId, setActiveId] = useState<string | null>(null);

	// Re-fetch when this tab comes back into focus (picks up newly uploaded videos).
	// Cleanup pauses all video players when the tab loses focus — prevents them
	// from buffering and consuming CPU/memory while the user is on other tabs.
	useFocusEffect(
		useCallback(() => {
			void refresh();
			return () => setActiveId(null);
		}, [refresh]),
	);

	// Allow the upload sheet (rendered in the layout) to trigger a refresh
	// directly, since closing a Modal doesn't change tab focus.
	useEffect(() => registerFeedRefresh(refresh), [refresh]);

	// Activate the first slide as soon as data loads so playback starts without
	// needing a scroll.
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only re-runs when length changes
	useEffect(() => {
		if (activeId === null && slides.length > 0) {
			setActiveId(slides[0].id);
		}
	}, [slides.length]);

	const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 });

	// FlatList forbids swapping onViewableItemsChanged between renders, and
	// `record` gets a new identity when the feed loads — so the handler lives
	// in a ref (stable for the list's lifetime) and reads the latest `record`
	// through a second ref.
	const recordRef = useRef(record);
	useEffect(() => {
		recordRef.current = record;
	}, [record]);

	const onViewableItemsChanged = useRef(
		({ viewableItems }: { viewableItems: ViewToken[] }) => {
			const first = viewableItems[0];
			if (first != null) {
				const id = (first.item as FeedSlide).id;
				setActiveId(id);
				recordRef.current(id, "view");
			} else {
				setActiveId(null);
			}
		},
	).current;

	const onLayout = useCallback((e: LayoutChangeEvent) => {
		const { width, height } = e.nativeEvent.layout;
		setContainerSize({ width, height });
	}, []);

	const handleLike = useCallback(
		(id: string) => {
			tap();
			// Mirror a fresh like into the behavioural log as "matters" (the heart
			// action the signal score already reads); unlike only touches feed_likes.
			if (!social.isLiked(id)) record(id, "matters");
			social.toggleLike(id);
		},
		[social, record],
	);

	const handleShare = useCallback(
		(slide: FeedSlide) => {
			record(slide.id, "share");
			void shareSlide(slide);
		},
		[record],
	);

	const openLink = useCallback((url: string) => {
		Linking.openURL(url).catch(() => {});
	}, []);

	const renderItem = useCallback(
		({ item: slide }: { item: FeedSlide }) => {
			if (!containerSize) return null;
			const rail =
				slide.type === "digest" ? null : (
					<FeedActions
						liked={social.isLiked(slide.id)}
						likeCount={social.likeCount(slide.id)}
						commentCount={social.commentCount(slide.id)}
						saved={isSaved(slide.id)}
						onLike={() => handleLike(slide.id)}
						onComment={() => setCommentsFor(slide.id)}
						onShare={() => handleShare(slide)}
						onSave={() => record(slide.id, "save")}
					/>
				);

			if (slide.type === "video") {
				return (
					<View
						style={{
							height: containerSize.height,
							width: containerSize.width,
						}}
					>
						<VideoSlide
							item={slide.item}
							containerHeight={containerSize.height}
							containerWidth={containerSize.width}
							isActive={slide.id === activeId}
							onWatch={() => record(slide.id, "finish")}
							creator={slide.creator}
							isFollowing={
								slide.creator ? social.isFollowing(slide.creator.id) : false
							}
							onToggleFollow={() => {
								if (slide.creator) social.toggleFollow(slide.creator.id);
							}}
						/>
						{rail}
					</View>
				);
			}

			return (
				<View
					style={{ height: containerSize.height, width: containerSize.width }}
				>
					<StaticSlide
						slide={slide}
						onOpenLink={openLink}
						onJoinDiscussion={() => router.push("/(drawer)/(tabs)/community")}
						onSeeOpportunities={() =>
							router.push("/(drawer)/(tabs)/opportunities")
						}
					/>
					{rail}
				</View>
			);
		},
		[
			containerSize,
			isSaved,
			record,
			activeId,
			social,
			handleLike,
			handleShare,
			openLink,
		],
	);

	if (loading) {
		return (
			<View style={s.center}>
				<ActivityIndicator color="#F0B429" />
			</View>
		);
	}

	if (error) {
		return (
			<View style={s.center}>
				<Text style={s.dimText}>{error}</Text>
			</View>
		);
	}

	if (slides.length === 0) {
		return (
			<View style={s.center}>
				{/* Pole travels ahead — content is on its way. */}
				<Image
					source={require("../../../assets/images/pole/pole-travelling.png")}
					style={s.pole}
					resizeMode="contain"
					accessibilityElementsHidden
				/>
				<Text style={s.emptyTitle}>Nothing here yet</Text>
				<Text style={s.dimText}>Tap + to post the first video.</Text>
				<Pressable
					onPress={() => setShowUpload(true)}
					accessibilityRole="button"
					accessibilityLabel="Post a video"
					style={({ pressed }) => [
						s.postBtn,
						{ backgroundColor: pressed ? "#DE911D" : "#F0B429" },
					]}
				>
					<Icon name="add" size={22} color="#0D1321" strokeWidth={2} />
				</Pressable>
				<VideoUploadSheet
					visible={showUpload}
					onClose={() => setShowUpload(false)}
					onPosted={() => {
						setShowUpload(false);
						void refresh();
					}}
				/>
			</View>
		);
	}

	return (
		<View style={s.root} onLayout={onLayout}>
			{containerSize ? (
				<FlatList
					data={slides}
					keyExtractor={(slide) => slide.id}
					renderItem={renderItem}
					pagingEnabled
					snapToAlignment="start"
					decelerationRate="fast"
					showsVerticalScrollIndicator={false}
					onViewableItemsChanged={onViewableItemsChanged}
					viewabilityConfig={viewabilityConfig.current}
					getItemLayout={(_, index) => ({
						length: containerSize.height,
						offset: containerSize.height * index,
						index,
					})}
					removeClippedSubviews
					windowSize={3}
					maxToRenderPerBatch={2}
					initialNumToRender={2}
				/>
			) : null}
			<Pressable
				onPress={() => setShowUpload(true)}
				accessibilityRole="button"
				accessibilityLabel="Post a video"
				style={({ pressed }) => [
					s.postBtn,
					{ backgroundColor: pressed ? "#DE911D" : "#F0B429" },
				]}
			>
				<Icon name="add" size={22} color="#0D1321" strokeWidth={2} />
			</Pressable>
			<VideoUploadSheet
				visible={showUpload}
				onClose={() => setShowUpload(false)}
				onPosted={() => {
					setShowUpload(false);
					void refresh();
				}}
			/>
			<CommentSheet
				itemId={commentsFor}
				onClose={() => setCommentsFor(null)}
				onPosted={(id) => social.bumpCommentCount(id)}
			/>
		</View>
	);
}

// The feed is the one sanctioned dark surface — full-bleed video is
// cinema, not sky. States around it stay readable on black.
const s = StyleSheet.create({
	root: { flex: 1, backgroundColor: "#000" },
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#000",
		gap: 6,
		paddingHorizontal: 32,
	},
	pole: { width: 64, height: 80, marginBottom: 14 },
	postBtn: {
		position: "absolute",
		right: 16,
		bottom: 24,
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: "center",
		justifyContent: "center",
	},
	emptyTitle: {
		color: "#F0F0F5",
		fontSize: 17,
		fontFamily: "PlusJakartaSans_700Bold",
	},
	dimText: { color: "#9AA4B5", fontSize: 14, textAlign: "center" },
});
