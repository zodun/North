// Custom tab bar with the raised centre Mission button (DEC-24).
// Implements BottomTabBarProps so it's drop-in via the `tabBar` prop
// on expo-router's <Tabs>. Renders 5 buttons; the centre Mission
// button sits raised above the bar in an accent circle, matching the
// prototype's app-shell.jsx.
//
// All buttons hit MIN_TOUCH_TARGET (44pt) per WCAG (DEC-25).

import { Icon, type IconName, MIN_TOUCH_TARGET } from "@north/native-ui";
import { getTokens } from "@north/tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";

// Minimal shape of what expo-router's <Tabs> passes to a custom
// tabBar prop. Avoids depending on @react-navigation/bottom-tabs
// at the top-level package.json (it's bundled inside expo-router
// and not exposed as its own resolvable specifier).
// Loose structural shape — the real type is expo-router's bundled
// BottomTabBarProps from @react-navigation/bottom-tabs, which isn't
// a directly resolvable specifier. We pull only what we use; the
// layout-side spread upcasts to this shape.
// biome-ignore lint/suspicious/noExplicitAny: see comment above
type TabsBarProps = any;

type TabSpec = {
	route: string;
	label: string;
	icon: IconName;
	centre?: boolean;
};

const TABS: TabSpec[] = [
	{ route: "for-you", label: "For You", icon: "forYou" },
	{ route: "opportunities", label: "Open", icon: "opportunities" },
	{ route: "mission", label: "Mission", icon: "mission", centre: true },
	{ route: "signal", label: "Signal", icon: "signal" },
	{ route: "profile", label: "You", icon: "profile" },
];

export function CustomTabBar({ state, navigation }: TabsBarProps) {
	// Default to the warm/humanist combo per the prototype's final
	// recommendation (chat transcript). A future tweak panel could
	// thread these through.
	const { p, t } = getTokens("warm", "humanist", "calm");

	return (
		<View style={[styles.outer, { backgroundColor: p.bg }]}>
			<View
				style={[
					styles.bar,
					{
						backgroundColor: `${p.surface}cc`,
						borderColor: p.line,
					},
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

					if (tab.centre) {
						return (
							<Pressable
								key={tab.route}
								onPress={onPress}
								accessibilityRole="button"
								accessibilityLabel={tab.label}
								accessibilityState={{ selected: focused }}
								style={({ pressed }) => [
									styles.centreButton,
									{
										backgroundColor: p.accent,
										shadowColor: p.accent,
										opacity: pressed ? 0.9 : 1,
									},
								]}
							>
								<Icon
									name={tab.icon}
									size={22}
									color={p.accentInk}
									strokeWidth={1.8}
								/>
							</Pressable>
						);
					}

					return (
						<Pressable
							key={tab.route}
							onPress={onPress}
							accessibilityRole="button"
							accessibilityLabel={tab.label}
							accessibilityState={{ selected: focused }}
							style={({ pressed }) => [
								styles.tabButton,
								{ opacity: pressed ? 0.7 : 1 },
							]}
						>
							<Icon
								name={tab.icon}
								size={20}
								color={focused ? p.accent : p.inkMid}
								strokeWidth={1.6}
							/>
							<Text
								style={{
									color: focused ? p.accent : p.inkMid,
									fontFamily: t.ui,
									fontSize: 10,
									fontWeight: focused ? "600" : "500",
								}}
							>
								{tab.label}
							</Text>
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
		paddingVertical: 10,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-around",
		borderRadius: 22,
		borderWidth: 1,
	},
	tabButton: {
		minWidth: MIN_TOUCH_TARGET,
		minHeight: MIN_TOUCH_TARGET,
		paddingHorizontal: 10,
		paddingVertical: 6,
		alignItems: "center",
		justifyContent: "center",
		gap: 4,
	},
	centreButton: {
		width: 50,
		height: 50,
		borderRadius: 25,
		alignItems: "center",
		justifyContent: "center",
		marginTop: -16,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.35,
		shadowRadius: 14,
		elevation: 6,
	},
});
