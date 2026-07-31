// Intro carousel — four paged value-prop slides between Welcome and
// sign-up (ONB mockup: Onboarding 1–4). Each slide is one brand
// illustration, one display headline, one calm body line. Dots + a gold
// Next that becomes Get Started on the last slide; Skip is always
// available — the carousel persuades, it never gates.

import { Button } from "@north/native-ui";
import { getNorthTokens } from "@north/tokens";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
	FlatList,
	Image,
	type ImageSourcePropType,
	Pressable,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
	type ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Slide = {
	key: string;
	image: ImageSourcePropType;
	title: string;
	body: string;
};

const SLIDES: Slide[] = [
	{
		key: "direction",
		image: require("../../assets/images/brand/star-horizon.png"),
		title: "Discover your direction.",
		body: "North helps you find clarity, take action and build a life that matters.",
	},
	{
		key: "action",
		image: require("../../assets/images/brand/needle-flight.png"),
		title: "Turn purpose into action.",
		body: "Set missions, build habits and track your progress every day.",
	},
	{
		key: "opportunities",
		image: require("../../assets/images/brand/peak-sky.png"),
		title: "Find opportunities that fit you.",
		body: "Matched opportunities that help you grow and achieve your goals.",
	},
	{
		key: "reflect",
		image: require("../../assets/images/brand/compass-light.png"),
		title: "Reflect, learn and grow.",
		body: "Journal your thoughts, understand yourself and keep improving.",
	},
];

export default function IntroScreen() {
	const { p, t, d } = getNorthTokens();
	const router = useRouter();
	const { width } = useWindowDimensions();
	const listRef = useRef<FlatList<Slide>>(null);
	const [index, setIndex] = useState(0);

	const isLast = index === SLIDES.length - 1;

	const onViewableItemsChanged = useRef(
		({ viewableItems }: { viewableItems: ViewToken[] }) => {
			const first = viewableItems[0];
			if (first?.index != null) setIndex(first.index);
		},
	);
	const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 });

	function advance() {
		if (isLast) {
			router.push("/(auth)/sign-up");
			return;
		}
		listRef.current?.scrollToIndex({ index: index + 1, animated: true });
	}

	return (
		<SafeAreaView style={[styles.safe, { backgroundColor: p.bg }]}>
			{/* Skip */}
			<View style={[styles.topBar, { paddingHorizontal: d.scrnPad }]}>
				<Pressable
					onPress={() => router.push("/(auth)/sign-up")}
					hitSlop={12}
					accessibilityRole="button"
					accessibilityLabel="Skip intro"
					style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
				>
					<Text style={[styles.skip, { color: p.inkMid, fontFamily: t.ui }]}>
						Skip
					</Text>
				</Pressable>
			</View>

			<FlatList
				ref={listRef}
				data={SLIDES}
				keyExtractor={(s) => s.key}
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				onViewableItemsChanged={onViewableItemsChanged.current}
				viewabilityConfig={viewabilityConfig.current}
				getItemLayout={(_, i) => ({
					length: width,
					offset: width * i,
					index: i,
				})}
				renderItem={({ item }) => (
					<View style={[styles.slide, { width, paddingHorizontal: d.scrnPad }]}>
						<Image
							source={item.image}
							style={styles.illustration}
							resizeMode="contain"
						/>
						<Text
							style={[styles.title, { color: p.ink, fontFamily: t.display }]}
						>
							{item.title}
						</Text>
						<Text style={[styles.body, { color: p.inkMid, fontFamily: t.ui }]}>
							{item.body}
						</Text>
					</View>
				)}
			/>

			{/* Dots + CTA */}
			<View style={[styles.footer, { paddingHorizontal: d.scrnPad }]}>
				<View style={styles.dots}>
					{SLIDES.map((s, i) => (
						<View
							key={s.key}
							style={[
								styles.dot,
								{
									// Gold = the needle: the active dot is where you are.
									backgroundColor: i === index ? p.gold : p.line,
									width: i === index ? 20 : 6,
								},
							]}
						/>
					))}
				</View>
				<Button p={p} t={t} variant="primary" onPress={advance}>
					{isLast ? "Get Started" : "Next"}
				</Button>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1 },
	topBar: {
		height: 44,
		alignItems: "flex-end",
		justifyContent: "center",
	},
	skip: { fontSize: 15, fontWeight: "500" },
	slide: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
	},
	illustration: {
		width: 180,
		height: 180,
		marginBottom: 22,
	},
	title: {
		fontSize: 26,
		lineHeight: 32,
		letterSpacing: -0.5,
		textAlign: "center",
	},
	body: {
		fontSize: 15,
		lineHeight: 22,
		textAlign: "center",
		maxWidth: 300,
	},
	footer: { paddingTop: 8, paddingBottom: 20, gap: 20 },
	dots: {
		flexDirection: "row",
		gap: 6,
		alignSelf: "center",
		alignItems: "center",
	},
	dot: {
		height: 6,
		borderRadius: 3,
	},
});
