// Full-bleed editorial slides for the For You pager: signal of the day,
// opportunity highlight, success story, article, trending discussion, and
// the weekly digest. All sit on the night ground (the feed is the one
// sanctioned dark surface) with Signal Gold as the single accent — the
// needle motif, the eyebrow, and the one CTA.

import {
	Icon,
	type IconName,
	MOTION,
	Rise,
	staggerDelay,
} from "@north/native-ui";
import { getNorthTokens } from "@north/tokens";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { FeedSlide } from "@/lib/feed/types";

const { p, t } = getNorthTokens();

const WHITE = "#FFFFFF";
const WHITE_MID = "rgba(255,255,255,0.72)";
const WHITE_DIM = "rgba(255,255,255,0.5)";

type Props = {
	slide: Exclude<FeedSlide, { type: "video" }>;
	onOpenLink: (url: string) => void;
	onJoinDiscussion: () => void;
	onSeeOpportunities: () => void;
};

export function StaticSlide({
	slide,
	onOpenLink,
	onJoinDiscussion,
	onSeeOpportunities,
}: Props) {
	switch (slide.type) {
		case "signal":
			return (
				<Frame eyebrow={`SIGNAL OF THE DAY · ${slide.dateLabel}`}>
					<Rise delay={staggerDelay(1)}>
						<Text style={s.quote}>{slide.quote}</Text>
					</Rise>
					{slide.attribution ? (
						<Rise delay={staggerDelay(2)}>
							<Text style={s.attribution}>— {slide.attribution}</Text>
						</Rise>
					) : null}
				</Frame>
			);

		case "opportunity":
			return (
				<Frame eyebrow="OPPORTUNITY">
					<Rise delay={staggerDelay(1)}>
						<Text style={s.headline}>{slide.title}</Text>
					</Rise>
					<Rise delay={staggerDelay(2)}>
						<View style={s.metaBlock}>
							{slide.org ? <Text style={s.metaStrong}>{slide.org}</Text> : null}
							{slide.deadline ? (
								<View style={s.metaRow}>
									<Icon name="clock" size={15} color={p.gold} />
									<Text style={s.metaGold}>{slide.deadline}</Text>
								</View>
							) : null}
						</View>
					</Rise>
					{slide.url ? (
						<Rise delay={staggerDelay(3)}>
							<Cta
								label="View"
								icon="externalLink"
								onPress={() => onOpenLink(slide.url as string)}
							/>
						</Rise>
					) : null}
				</Frame>
			);

		case "story":
			return (
				<Frame eyebrow="SUCCESS STORY">
					<Rise delay={staggerDelay(1)}>
						<Text style={s.headline}>{slide.title}</Text>
					</Rise>
					<Rise delay={staggerDelay(2)}>
						<Text style={s.bodyText}>{slide.excerpt}</Text>
					</Rise>
					{slide.author ? (
						<Rise delay={staggerDelay(3)}>
							<Text style={s.attribution}>— {slide.author}</Text>
						</Rise>
					) : null}
				</Frame>
			);

		case "article":
			return (
				<Frame eyebrow="ARTICLE">
					<Rise delay={staggerDelay(1)}>
						<Text style={s.headline}>{slide.title}</Text>
					</Rise>
					{slide.excerpt ? (
						<Rise delay={staggerDelay(2)}>
							<Text style={s.bodyText}>{slide.excerpt}</Text>
						</Rise>
					) : null}
					{slide.source ? (
						<Rise delay={staggerDelay(2)}>
							<Text style={s.attribution}>{slide.source}</Text>
						</Rise>
					) : null}
					{slide.url ? (
						<Rise delay={staggerDelay(3)}>
							<Cta
								label="Read"
								icon="arrowRight"
								onPress={() => onOpenLink(slide.url as string)}
							/>
						</Rise>
					) : null}
				</Frame>
			);

		case "discussion":
			return (
				<Frame eyebrow="TRENDING IN COMMUNITY">
					<Rise delay={staggerDelay(1)}>
						<Text style={s.quote}>"{slide.quote}"</Text>
					</Rise>
					<Rise delay={staggerDelay(2)}>
						<Text style={s.attribution}>— {slide.author}</Text>
					</Rise>
					<Rise delay={staggerDelay(3)}>
						<Cta
							label="Join discussion"
							icon="community"
							onPress={onJoinDiscussion}
						/>
					</Rise>
				</Frame>
			);

		case "digest":
			return (
				<Frame eyebrow={`YOUR WEEK · ${slide.weekLabel.toUpperCase()}`}>
					<Rise delay={staggerDelay(1)}>
						<Text style={s.headline}>That's the week's signal.</Text>
					</Rise>
					<Rise delay={staggerDelay(2)}>
						<View style={s.digestBlock}>
							<View style={s.digestRow}>
								<Text style={s.digestNumber}>{slide.newOpportunities}</Text>
								<Text style={s.digestLabel}>
									new{" "}
									{slide.newOpportunities === 1
										? "opportunity"
										: "opportunities"}{" "}
									for you
								</Text>
							</View>
							{slide.topStory ? (
								<View style={s.digestStory}>
									<Text style={s.digestStoryLabel}>Top story</Text>
									<Text style={s.digestStoryTitle} numberOfLines={2}>
										{slide.topStory}
									</Text>
								</View>
							) : null}
						</View>
					</Rise>
					<Rise delay={staggerDelay(3)}>
						<Cta
							label="See opportunities"
							icon="arrowRight"
							onPress={onSeeOpportunities}
						/>
					</Rise>
				</Frame>
			);
	}
}

// ── Shared shell ─────────────────────────────────────────────────────────

function Frame({
	eyebrow,
	children,
}: {
	eyebrow: string;
	children: ReactNode;
}) {
	return (
		<View style={s.frame}>
			<Rise duration={MOTION.slow}>
				<View style={s.needle} />
				<Text style={s.eyebrow}>{eyebrow}</Text>
			</Rise>
			{children}
		</View>
	);
}

function Cta({
	label,
	icon,
	onPress,
}: {
	label: string;
	icon: IconName;
	onPress: () => void;
}) {
	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={label}
			style={({ pressed }) => [
				s.cta,
				{ backgroundColor: pressed ? p.goldDeep : p.gold },
			]}
		>
			<Text style={s.ctaText}>{label}</Text>
			<Icon name={icon} size={17} color={p.accentInk} strokeWidth={2} />
		</Pressable>
	);
}

const s = StyleSheet.create({
	frame: {
		flex: 1,
		backgroundColor: p.night,
		justifyContent: "center",
		paddingLeft: 28,
		paddingRight: 84, // clear the action rail
		gap: 18,
	},
	needle: {
		width: 28,
		height: 3,
		borderRadius: 2,
		backgroundColor: p.gold,
		marginBottom: 12,
	},
	eyebrow: {
		fontFamily: t.ui,
		fontWeight: "700",
		fontSize: 11,
		letterSpacing: 2,
		color: p.gold,
	},
	quote: {
		fontFamily: t.display,
		fontSize: 27,
		lineHeight: 36,
		letterSpacing: -0.5,
		color: WHITE,
	},
	headline: {
		fontFamily: t.display,
		fontSize: 28,
		lineHeight: 35,
		letterSpacing: -0.5,
		color: WHITE,
	},
	bodyText: {
		fontFamily: t.ui,
		fontSize: 15,
		lineHeight: 23,
		color: WHITE_MID,
	},
	attribution: {
		fontFamily: t.ui,
		fontSize: 14,
		fontWeight: "600",
		color: WHITE_DIM,
	},
	metaBlock: { gap: 8 },
	metaStrong: {
		fontFamily: t.ui,
		fontSize: 15,
		fontWeight: "700",
		color: "rgba(255,255,255,0.88)",
	},
	metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
	metaGold: {
		fontFamily: t.ui,
		fontSize: 14,
		fontWeight: "600",
		color: p.gold,
	},
	cta: {
		alignSelf: "flex-start",
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 20,
		height: 44,
		borderRadius: 22,
		marginTop: 4,
	},
	ctaText: {
		fontFamily: t.ui,
		fontSize: 14,
		fontWeight: "700",
		color: p.accentInk,
	},
	digestBlock: { gap: 16 },
	digestRow: { flexDirection: "row", alignItems: "baseline", gap: 10 },
	digestNumber: {
		fontFamily: t.display,
		fontSize: 44,
		letterSpacing: -1,
		color: p.gold,
	},
	digestLabel: {
		flex: 1,
		fontFamily: t.ui,
		fontSize: 15,
		color: WHITE_MID,
	},
	digestStory: {
		borderTopWidth: 1,
		borderTopColor: "rgba(255,255,255,0.12)",
		paddingTop: 14,
		gap: 4,
	},
	digestStoryLabel: {
		fontFamily: t.ui,
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 1.5,
		color: WHITE_DIM,
	},
	digestStoryTitle: {
		fontFamily: t.display,
		fontSize: 17,
		lineHeight: 23,
		color: WHITE,
	},
});
