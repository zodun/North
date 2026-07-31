// Bottom tab bar — the sheet's five-tab loop on a floating white pill,
// hairline-bordered, flat by doctrine (no shadow). Each tab carries its
// section accent when active — gold for the For You needle, teal for
// Mission, violet for Opportunities, blue for Journal, green for
// Community — with labels on the darker ink variants so they stay
// ≥4.5:1 on white. Inactive tabs are quiet ink-dim outlines.

import { Icon, type IconName, MIN_TOUCH_TARGET } from "@north/native-ui";
import { getNorthTokens, type NorthPalette } from "@north/tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";

// biome-ignore lint/suspicious/noExplicitAny: BottomTabBarProps isn't a resolvable specifier
type TabsBarProps = any;

type AccentKey = keyof Pick<
	NorthPalette,
	"gold" | "teal" | "violet" | "blue" | "green"
>;
type AccentInkKey = keyof Pick<
	NorthPalette,
	"goldInk" | "tealInk" | "violetInk" | "blueInk" | "greenInk"
>;

type TabSpec = {
	route: string;
	label: string;
	icon: IconName;
	accent: AccentKey;
	accentInk: AccentInkKey;
};

const TABS: TabSpec[] = [
	{
		route: "for-you",
		label: "For You",
		icon: "forYou",
		accent: "gold",
		accentInk: "goldInk",
	},
	{
		route: "mission",
		label: "Mission",
		icon: "mission",
		accent: "teal",
		accentInk: "tealInk",
	},
	{
		route: "opportunities",
		label: "Open",
		icon: "opportunities",
		accent: "violet",
		accentInk: "violetInk",
	},
	{
		route: "journal",
		label: "Journal",
		icon: "journal",
		accent: "blue",
		accentInk: "blueInk",
	},
	{
		route: "community",
		label: "People",
		icon: "community",
		accent: "green",
		accentInk: "greenInk",
	},
];

export function CustomTabBar({ state, navigation }: TabsBarProps) {
	const { p } = getNorthTokens();

	return (
		<View style={[styles.outer, { backgroundColor: p.bg }]}>
			<View
				style={[
					styles.bar,
					{ backgroundColor: p.surface, borderColor: p.line },
				]}
			>
				{TABS.map((tab) => {
					const routeIndex = state.routes.findIndex(
						(r: { name: string }) => r.name === tab.route,
					);
					const focused = state.index === routeIndex && routeIndex !== -1;

					const onPress = () => {
						if (routeIndex === -1) return;
						const route = state.routes[routeIndex];
						if (!route) return;
						const event = navigation.emit({
							type: "tabPress",
							target: route.key,
							canPreventDefault: true,
						});
						if (!event.defaultPrevented && !focused) {
							navigation.navigate(route.name, route.params);
						}
					};

					return (
						<Pressable
							key={tab.route}
							onPress={onPress}
							accessibilityRole="button"
							accessibilityLabel={tab.label}
							accessibilityState={{ selected: focused }}
							style={({ pressed }) => [
								styles.tabButton,
								{ opacity: pressed ? 0.6 : 1 },
							]}
						>
							<Icon
								name={tab.icon}
								size={20}
								color={focused ? p[tab.accent] : p.inkDim}
								strokeWidth={focused ? 2 : 1.6}
							/>
							<Text
								style={{
									color: focused ? p[tab.accentInk] : p.inkDim,
									fontSize: 10,
									fontWeight: focused ? "700" : "500",
								}}
							>
								{tab.label}
							</Text>
							<View
								style={[
									styles.needleDot,
									{
										backgroundColor: focused ? p[tab.accent] : "transparent",
									},
								]}
							/>
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	outer: {
		paddingTop: 6,
		paddingBottom: 24,
	},
	bar: {
		marginHorizontal: 12,
		paddingHorizontal: 6,
		paddingVertical: 8,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-around",
		borderRadius: 24,
		borderWidth: 1,
	},
	tabButton: {
		minWidth: MIN_TOUCH_TARGET,
		minHeight: MIN_TOUCH_TARGET,
		paddingHorizontal: 10,
		paddingTop: 6,
		paddingBottom: 2,
		alignItems: "center",
		justifyContent: "center",
		gap: 3,
	},
	needleDot: {
		width: 4,
		height: 4,
		borderRadius: 2,
	},
});
