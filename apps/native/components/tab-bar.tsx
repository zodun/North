// Bottom tab bar — the five-tab loop on a floating white pill,
// hairline-bordered, flat by doctrine (no shadow). Two-tone: the active
// tab is ink with a small gold needle-dot underneath — gold marks where
// you are, which is the one "next action" the bar answers.

import { Icon, type IconName, MIN_TOUCH_TARGET } from "@north/native-ui";
import { getNorthTokens } from "@north/tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { tap } from "@/lib/haptics";

// biome-ignore lint/suspicious/noExplicitAny: BottomTabBarProps isn't a resolvable specifier
type TabsBarProps = any;

type TabSpec = {
	route: string;
	label: string;
	icon: IconName;
};

const TABS: TabSpec[] = [
	{ route: "for-you", label: "For You", icon: "forYou" },
	{ route: "mission", label: "Mission", icon: "mission" },
	{ route: "opportunities", label: "Open", icon: "opportunities" },
	{ route: "journal", label: "Journal", icon: "journal" },
	{ route: "community", label: "People", icon: "community" },
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
							tap();
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
								color={focused ? p.ink : p.inkDim}
								strokeWidth={focused ? 2 : 1.6}
							/>
							<Text
								style={{
									color: focused ? p.ink : p.inkDim,
									fontSize: 10,
									fontWeight: focused ? "700" : "500",
								}}
							>
								{tab.label}
							</Text>
							<View
								style={[
									styles.needleDot,
									{ backgroundColor: focused ? p.gold : "transparent" },
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
