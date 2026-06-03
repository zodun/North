// For You feed (FEED-01 – FEED-05).
//
// FEED-01: vertical full-screen FlatList pager — pagingEnabled + snap.
// FEED-02: video-ready visibility via onViewableItemsChanged. For M1 all
//          content is link-out; autoplay wires in M2 when hosted video lands.
// FEED-03: like/save/share persisted to content_interactions via RLS.
// FEED-04: horizontal category filter bar with client-side filtering.
// FEED-05: items served ordered by sort_order from the 60-item M1 seed.
//
// Dwell tracking (SIGCAP-02 prep): view recorded on enter, long_dwell at
// 30 s, pass recorded when dwell < 3 s.

import { getTokens } from "@north/tokens";
import { useCallback, useRef, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	StyleSheet,
	Text,
	View,
	type ViewToken,
} from "react-native";

import { CategoryFilter } from "@/components/feed/CategoryFilter";
import { ContentCard } from "@/components/feed/ContentCard";
import type { FeedItem } from "@/lib/feed/types";
import { useFeed } from "@/lib/feed/use-feed";
import { useInteractions } from "@/lib/feed/use-interactions";

const FILTER_BAR_HEIGHT = 52; // CategoryFilter wrapper height

export default function ForYou() {
	const { p, t } = getTokens("warm", "humanist", "calm");
	const [category, setCategory] = useState<string | null>(null);
	const { items, loading, error } = useFeed(category);
	const { isSaved, isMatters, record } = useInteractions(items);

	// Measured height of the FlatList container (excludes category bar + tab bar).
	const [listHeight, setListHeight] = useState(0);

	// Dwell tracking refs (SIGCAP-02 prep).
	const dwellStart = useRef<Record<string, number>>({});
	const dwellTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

	const viewabilityConfig = useRef({
		itemVisiblePercentThreshold: 60,
	});

	const onViewableItemsChanged = useCallback(
		({ changed }: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
			for (const change of changed) {
				const id = (change.item as FeedItem).id;
				if (change.isViewable) {
					// Record view and start dwell timer.
					dwellStart.current[id] = Date.now();
					record(id, "view");
					dwellTimers.current[id] = setTimeout(() => {
						record(id, "long_dwell", 30_000);
						delete dwellTimers.current[id];
					}, 30_000);
				} else {
					// Item left viewport.
					const start = dwellStart.current[id];
					if (start !== undefined) {
						const dwell = Date.now() - start;
						if (dwell < 3_000) record(id, "pass", dwell);
						delete dwellStart.current[id];
					}
					const timer = dwellTimers.current[id];
					if (timer !== undefined) {
						clearTimeout(timer);
						delete dwellTimers.current[id];
					}
				}
			}
		},
		[record],
	);

	if (loading) {
		return (
			<View style={[styles.center, { backgroundColor: p.bg }]}>
				<ActivityIndicator color={p.accent} />
			</View>
		);
	}

	if (error) {
		return (
			<View style={[styles.center, { backgroundColor: p.bg }]}>
				<Text style={{ color: p.inkMid, fontFamily: t.ui, fontSize: 14 }}>
					{error}
				</Text>
			</View>
		);
	}

	if (items.length === 0) {
		return (
			<View style={[styles.root, { backgroundColor: p.bg }]}>
				<CategoryFilter active={category} onChange={setCategory} />
				<View style={styles.center}>
					<Text style={{ color: p.inkMid, fontFamily: t.ui, fontSize: 14 }}>
						Nothing here yet.
					</Text>
				</View>
			</View>
		);
	}

	return (
		<View style={[styles.root, { backgroundColor: p.bg }]}>
			<CategoryFilter active={category} onChange={setCategory} />

			<View
				style={styles.listContainer}
				onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}
			>
				{listHeight > 0 && (
					<FlatList
						data={items}
						keyExtractor={(item) => item.id}
						pagingEnabled
						showsVerticalScrollIndicator={false}
						decelerationRate="fast"
						snapToAlignment="start"
						snapToInterval={listHeight}
						getItemLayout={(_, index) => ({
							length: listHeight,
							offset: listHeight * index,
							index,
						})}
						onViewableItemsChanged={onViewableItemsChanged}
						viewabilityConfig={viewabilityConfig.current}
						renderItem={({ item }) => (
							<ContentCard
								item={item}
								height={listHeight}
								isSaved={isSaved(item.id)}
								isMatters={isMatters(item.id)}
								onSave={() => record(item.id, "save")}
								onMatters={() => record(item.id, "matters")}
								onShare={() => record(item.id, "share")}
							/>
						)}
					/>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1 },
	listContainer: { flex: 1 },
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
});
