import { Icon } from "@north/native-ui";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Image,
	type LayoutChangeEvent,
	Pressable,
	StyleSheet,
	Text,
	View,
	type ViewToken,
} from "react-native";

import { VideoSlide } from "@/components/feed/VideoSlide";
import { VideoUploadSheet } from "@/components/feed/VideoUploadSheet";
import { registerFeedRefresh } from "@/lib/feed/feed-refresh";
import type { FeedItem } from "@/lib/feed/types";
import { useFeed } from "@/lib/feed/use-feed";
import { useInteractions } from "@/lib/feed/use-interactions";

export default function ForYou() {
	const { items: allItems, loading, error, refresh } = useFeed(null);
	const [showUpload, setShowUpload] = useState(false);
	// Only show direct-hosted videos (not YouTube links) — native player only.
	const items = useMemo(
		() =>
			allItems.filter(
				(i) =>
					i.kind === "video" &&
					!!i.external_url &&
					!i.external_url.includes("youtube"),
			),
		[allItems],
	);
	const { isSaved, record } = useInteractions(items);

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

	// Activate the first item as soon as data loads so playback starts without needing a scroll.
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only re-runs when length changes
	useEffect(() => {
		if (activeId === null && items.length > 0) {
			setActiveId(items[0].id);
		}
	}, [items.length]);

	const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 });

	const onViewableItemsChanged = useCallback(
		({
			viewableItems,
		}: {
			viewableItems: ViewToken[];
			changed: ViewToken[];
		}) => {
			const first = viewableItems[0];
			if (first != null) {
				const id = (first.item as FeedItem).id;
				setActiveId(id);
				record(id, "view");
			} else {
				setActiveId(null);
			}
		},
		[record],
	);

	const onLayout = useCallback((e: LayoutChangeEvent) => {
		const { width, height } = e.nativeEvent.layout;
		setContainerSize({ width, height });
	}, []);

	const renderItem = useCallback(
		({ item }: { item: FeedItem }) => {
			if (!containerSize) return null;
			return (
				<VideoSlide
					item={item}
					containerHeight={containerSize.height}
					containerWidth={containerSize.width}
					isSaved={isSaved(item.id)}
					isActive={item.id === activeId}
					onSave={() => record(item.id, "save")}
					onWatch={() => record(item.id, "finish")}
				/>
			);
		},
		[containerSize, isSaved, record, activeId],
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

	if (items.length === 0) {
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
					data={items}
					keyExtractor={(item) => item.id}
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
