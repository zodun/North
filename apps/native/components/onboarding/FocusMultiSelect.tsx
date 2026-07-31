// Card-grid multi-select for Q3 (focus areas). Caps the selection at
// `max` and prevents toggling additional cards on once the cap is hit.
// Mirrors the web onboarding's focus step: ink-on-white cards with
// North's own wayfinding glyphs; selecting one earns the single gold
// accent (gold = the needle / next action — Three-Meaning Rule). The
// badge shows pick order, not a checkmark: the first pick leads the
// personalisation downstream. Each card is a 44pt+ tap target (DEC-25).

import { getNorthTokens } from "@north/tokens";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FOCUS_AREAS, FOCUS_AREAS_MAX } from "@/lib/onboarding/questions";

import { FocusGlyph } from "./FocusGlyphs";

// Display name/desc only — stored ids and labels are untouched. Kept in
// lockstep with apps/web/src/app/onboarding/page.tsx FOCUS_META.
const FOCUS_META: Record<string, { name: string; desc: string }> = {
	craft: { name: "Craft", desc: "Make things" },
	venture: { name: "Venture", desc: "Build something" },
	mind: { name: "Mind", desc: "Feel steady" },
	people: { name: "People", desc: "Connect" },
	money: { name: "Money", desc: "Get free" },
	learn: { name: "Learn", desc: "Go deep" },
};

export type FocusMultiSelectProps = {
	value: string[];
	onChange: (next: string[]) => void;
	max?: number;
};

export function FocusMultiSelect({
	value,
	onChange,
	max = FOCUS_AREAS_MAX,
}: FocusMultiSelectProps) {
	const { p, t } = getNorthTokens();
	const atCap = value.length >= max;

	return (
		<View style={styles.wrap}>
			<View style={styles.grid}>
				{FOCUS_AREAS.map((area) => {
					const meta = FOCUS_META[area.id];
					const order = value.indexOf(area.id);
					const selected = order >= 0;
					const disabled = !selected && atCap;
					return (
						<Pressable
							key={area.id}
							accessibilityRole="checkbox"
							accessibilityState={{ checked: selected, disabled }}
							accessibilityLabel={area.label}
							disabled={disabled}
							onPress={() => {
								if (selected) {
									onChange(value.filter((id) => id !== area.id));
								} else if (!atCap) {
									onChange([...value, area.id]);
								}
							}}
							style={({ pressed }) => [
								styles.card,
								{
									// accentSoft (16%) rather than the web's 8% wash —
									// selection has to stay legible on mid-range panels.
									backgroundColor: selected ? p.accentSoft : p.surface,
									borderColor: selected ? p.gold : p.line,
									opacity: disabled ? 0.4 : 1,
									transform: [{ scale: pressed ? 0.97 : 1 }],
								},
							]}
						>
							{selected && (
								<View style={[styles.badge, { backgroundColor: p.gold }]}>
									<Text
										style={[
											styles.badgeText,
											{ color: p.accentInk, fontFamily: t.ui },
										]}
									>
										{order + 1}
									</Text>
								</View>
							)}
							<FocusGlyph
								id={area.id}
								size={24}
								color={selected ? p.goldInk : "rgba(14,20,32,0.72)"}
							/>
							<Text style={[styles.name, { color: p.ink, fontFamily: t.ui }]}>
								{meta.name}
							</Text>
							<Text
								style={[styles.desc, { color: p.inkDim, fontFamily: t.ui }]}
							>
								{meta.desc}
							</Text>
						</Pressable>
					);
				})}
			</View>
			<Text style={[styles.cap, { color: p.inkDim, fontFamily: t.ui }]}>
				<Text style={{ color: value.length > 0 ? p.goldInk : p.inkDim }}>
					{value.length}
				</Text>
				{` of ${max} selected`}
				{value.length > 1 ? " · your first pick leads" : ""}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: { gap: 14 },
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 10,
	},
	card: {
		// Two columns with a 10px gutter; minHeight comfortably clears 44pt
		// and keeps all six cards near one viewport on a 640dp-tall phone.
		flexBasis: "48%",
		flexGrow: 1,
		minHeight: 96,
		borderRadius: 16,
		borderWidth: 1,
		padding: 13,
		gap: 5,
		alignItems: "flex-start",
	},
	badge: {
		position: "absolute",
		top: 10,
		right: 10,
		width: 20,
		height: 20,
		borderRadius: 10,
		alignItems: "center",
		justifyContent: "center",
	},
	badgeText: { fontSize: 11, fontWeight: "900" },
	name: { fontSize: 14, fontWeight: "800", marginTop: 2 },
	desc: { fontSize: 11 },
	cap: { fontSize: 12, textAlign: "center" },
});
