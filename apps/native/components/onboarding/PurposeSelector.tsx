// Two large identity cards: Builder or Explorer. The chosen card shows a
// confirmation line beneath the pair — the user's stance inside North.

import { getTokens } from "@north/tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { PURPOSE_OPTIONS } from "@/lib/onboarding/questions";

export type PurposeSelectorProps = {
	value: string | null;
	onChange: (id: string) => void;
};

export function PurposeSelector({ value, onChange }: PurposeSelectorProps) {
	const { p, t } = getTokens("warm", "humanist", "calm");
	const chosen = PURPOSE_OPTIONS.find((o) => o.id === value) ?? null;

	return (
		<View style={styles.wrap}>
			{PURPOSE_OPTIONS.map((opt) => {
				const selected = value === opt.id;
				const inkColor = opt.color === "#F5C842" ? "#8A6A00" : "#0A8F7F";
				return (
					<Pressable
						key={opt.id}
						accessibilityRole="radio"
						accessibilityState={{ selected }}
						accessibilityLabel={opt.title}
						onPress={() => onChange(opt.id)}
						style={({ pressed }) => [
							styles.card,
							{
								backgroundColor: selected ? `${opt.color}18` : p.surface,
								borderColor: selected ? opt.color : p.lineHi,
								opacity: pressed ? 0.88 : 1,
							},
						]}
					>
						<View style={styles.cardInner}>
							<View
								style={[
									styles.medallion,
									{
										borderColor: selected ? opt.color : `${opt.color}80`,
										backgroundColor: `${opt.color}20`,
									},
								]}
							>
								<Text
									style={{
										fontSize: 22,
										color: selected ? inkColor : p.inkDim,
										fontFamily: t.display,
										fontWeight: "900",
									}}
								>
									{opt.id === "builder" ? "→" : "◎"}
								</Text>
							</View>
							<View style={styles.cardText}>
								<Text
									style={{
										color: p.ink,
										fontFamily: t.display,
										fontSize: 20,
										fontWeight: "900",
									}}
								>
									{opt.title}
								</Text>
								<Text
									style={{
										color: p.inkMid,
										fontFamily: t.ui,
										fontSize: 13,
										lineHeight: 19,
										marginTop: 4,
									}}
								>
									{opt.creed}
								</Text>
							</View>
						</View>
					</Pressable>
				);
			})}
			{chosen && (
				<Text
					style={{
						color: chosen.color === "#F5C842" ? "#8A6A00" : "#0A8F7F",
						fontFamily: t.ui,
						fontSize: 13,
						fontWeight: "600",
						textAlign: "center",
						marginTop: 4,
					}}
					accessibilityLiveRegion="polite"
				>
					{chosen.sealed}
				</Text>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: { gap: 12 },
	card: {
		borderRadius: 20,
		borderWidth: 1.5,
		padding: 20,
	},
	cardInner: {
		flexDirection: "row",
		gap: 16,
		alignItems: "center",
	},
	medallion: {
		width: 52,
		height: 52,
		borderRadius: 999,
		borderWidth: 1.5,
		alignItems: "center",
		justifyContent: "center",
	},
	cardText: { flex: 1 },
});
