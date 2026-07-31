// Dev-only "skip sign-in" escape hatch for design review. Renders on
// the auth screens in __DEV__ builds only; sets the auth bypass so the
// app shell opens with mock data (see lib/dev-mock.ts).

import { getNorthTokens } from "@north/tokens";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

import { setAuthBypass } from "@/lib/dev-bypass";

export function DevSkip({ color }: { color?: string }) {
	const { p, t } = getNorthTokens();
	const router = useRouter();

	if (!__DEV__) return null;

	return (
		<Pressable
			onPress={() => {
				setAuthBypass(true);
				router.replace("/(drawer)");
			}}
			hitSlop={8}
			accessibilityRole="button"
			accessibilityLabel="Skip sign-in (development only)"
			style={styles.wrap}
		>
			{({ pressed }) => (
				<Text
					style={[
						styles.label,
						{
							color: color ?? p.inkDim,
							fontFamily: t.ui,
							opacity: pressed ? 0.5 : 1,
						},
					]}
				>
					Skip sign-in · dev
				</Text>
			)}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	wrap: { alignItems: "center", paddingVertical: 8 },
	label: { fontSize: 12 },
});
