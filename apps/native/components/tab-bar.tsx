import { Icon, type IconName, MIN_TOUCH_TARGET } from "@north/native-ui";
import { getTokens } from "@north/tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";

// biome-ignore lint/suspicious/noExplicitAny: BottomTabBarProps isn't a resolvable specifier
type TabsBarProps = any;

type TabSpec =
	| { route: string; label: string; icon: IconName; centre?: false }
	| { route: "__add__"; label: string; centre: true };

const TABS: TabSpec[] = [
	{ route: "for-you", label: "For You", icon: "forYou" },
	{ route: "opportunities", label: "Open", icon: "opportunities" },
	{ route: "__add__", label: "Post", centre: true },
	{ route: "signal", label: "Signal", icon: "signal" },
	{ route: "profile", label: "You", icon: "profile" },
];

export function CustomTabBar({
	state,
	navigation,
	onAdd,
}: TabsBarProps & { onAdd?: () => void }) {
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
					if (tab.centre) {
						return (
							<Pressable
								key={tab.route}
								onPress={() => onAdd?.()}
								accessibilityRole="button"
								accessibilityLabel={tab.label}
								style={({ pressed }) => [
									styles.centreButton,
									{
										backgroundColor: p.accent,
										shadowColor: p.accent,
										opacity: pressed ? 0.85 : 1,
									},
								]}
							>
								<Text
									style={{
										fontSize: 28,
										color: p.accentInk,
										lineHeight: 32,
										marginTop: -2,
									}}
								>
									+
								</Text>
							</Pressable>
						);
					}

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
