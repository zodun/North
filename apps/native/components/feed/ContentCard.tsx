// Full-screen content card for the For You feed (FEED-01/02).
//
// For M1, all items are link-out; the primary CTA opens the external_url
// in the device browser. The video-ready structure is in place:
// `cloudinary_public_id` will drive inline video in M2 once hosted media is
// uploaded. Visibility detection (view/dwell events) is handled in for-you.tsx.

import { Icon } from "@north/native-ui";
import { getNorthTokens } from "@north/tokens";
import * as Linking from "expo-linking";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { FeedItem } from "@/lib/feed/types";
import { FeedActions } from "./FeedActions";

const KIND_LABEL: Record<FeedItem["kind"], string> = {
	essay: "Essay",
	voice: "Watch",
	story: "Story",
	opportunity: "Opportunity",
	video: "Video",
};

const KIND_CTA: Record<FeedItem["kind"], string> = {
	essay: "Read",
	voice: "Watch",
	story: "Read",
	opportunity: "View",
	video: "Watch",
};

const CATEGORY_LABEL: Record<string, string> = {
	purpose: "Purpose",
	careers: "Careers",
	entrepreneurship: "Entrepreneurship",
	"remote-work": "Remote work",
	ai: "AI",
	"caribbean-success": "Caribbean success",
	"self-development": "Self development",
	opportunities: "Opportunities",
	productivity: "Productivity",
	"mental-clarity": "Mental clarity",
};

type Props = {
	item: FeedItem;
	height: number;
	isSaved: boolean;
	isMatters: boolean;
	onSave: () => void;
	onMatters: () => void;
	onShare: () => void;
};

// memo: re-renders only when its own props change, not when a sibling card's
// interaction state changes (critical with renderItem useCallback in for-you.tsx).
export const ContentCard = memo(function ContentCard({
	item,
	height,
	isSaved,
	isMatters,
	onSave,
	onMatters,
	onShare,
}: Props) {
	const { p, t, d } = getNorthTokens();

	const category = item.content_category_id
		? CATEGORY_LABEL[item.content_category_id]
		: null;
	const cta = KIND_CTA[item.kind];
	const kindLabel = KIND_LABEL[item.kind];

	const openLink = () => {
		if (item.external_url) {
			Linking.openURL(item.external_url);
		}
	};

	return (
		<View
			style={[
				styles.card,
				{ height, backgroundColor: p.bg, paddingHorizontal: d.scrnPad },
			]}
		>
			{/* Eyebrow: kind + category */}
			<View style={styles.eyebrow}>
				<Text
					style={[styles.eyebrowText, { color: p.accent, fontFamily: t.ui }]}
				>
					{kindLabel}
					{category ? ` · ${category}` : ""}
				</Text>
			</View>

			{/* Title */}
			<View style={styles.titleBlock}>
				<Text
					style={[
						styles.title,
						{
							color: p.ink,
							fontFamily: t.display,
							fontWeight: String(t.displayWeight) as "400" | "600" | "700",
						},
					]}
					numberOfLines={6}
				>
					{item.title}
				</Text>

				{/* Attribution */}
				{item.attribution_text ? (
					<Text
						style={[styles.attribution, { color: p.inkDim, fontFamily: t.ui }]}
						numberOfLines={2}
					>
						{item.attribution_text}
					</Text>
				) : null}
			</View>

			{/* CTA */}
			{item.external_url ? (
				<Pressable
					onPress={openLink}
					accessibilityRole="link"
					accessibilityLabel={`${cta}: ${item.title}`}
					style={({ pressed }) => [
						styles.cta,
						{
							backgroundColor: p.surface,
							borderColor: p.lineHi,
							opacity: pressed ? 0.8 : 1,
						},
					]}
				>
					<Text
						style={{
							color: p.ink,
							fontFamily: t.ui,
							fontSize: 15,
							fontWeight: "600",
						}}
					>
						{cta}
					</Text>
					<Icon name="externalLink" size={16} color={p.inkMid} />
				</Pressable>
			) : null}

			{/* Source line */}
			{item.source ? (
				<Text style={[styles.source, { color: p.inkDim, fontFamily: t.ui }]}>
					{item.source}
				</Text>
			) : null}

			{/* Right-side action buttons */}
			<FeedActions
				p={p}
				t={t}
				itemId={item.id}
				externalUrl={item.external_url}
				title={item.title}
				isSaved={isSaved}
				isMatters={isMatters}
				onSave={onSave}
				onMatters={onMatters}
				onShare={onShare}
			/>
		</View>
	);
});

const styles = StyleSheet.create({
	card: {
		justifyContent: "center",
		paddingBottom: 40,
	},
	eyebrow: {
		marginBottom: 16,
	},
	eyebrowText: {
		fontSize: 12,
		fontWeight: "600",
		letterSpacing: 0.4,
		textTransform: "uppercase",
	},
	titleBlock: {
		gap: 12,
		marginBottom: 28,
	},
	title: {
		fontSize: 28,
		lineHeight: 36,
		letterSpacing: -0.5,
	},
	attribution: {
		fontSize: 13,
		lineHeight: 19,
	},
	cta: {
		alignSelf: "flex-start",
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderRadius: 12,
		borderWidth: 1,
	},
	source: {
		marginTop: 12,
		fontSize: 11,
		letterSpacing: 0.2,
	},
});
