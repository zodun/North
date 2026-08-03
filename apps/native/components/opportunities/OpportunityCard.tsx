// Opportunity card (OPP-03/04 + deadline reminder bell).
//
// Two-tone: white card, 1px line border, gold only on the next action
// (Apply). Save confirms with the green success ink, small. The bell
// appears once an item is saved/applied (i.e. tracked) and toggles the
// 3-days-before local reminder; an unusable deadline dims it and taps
// surface a quiet hint instead of doing nothing.

import { Card, Icon } from "@north/native-ui";
import type { NorthTokens } from "@north/tokens";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { categoryLabel } from "@/lib/opportunities/categories";
import { reminderEligible } from "@/lib/opportunities/reminders";
import type { Opportunity } from "@/lib/opportunities/types";

export function OpportunityCard({
	item,
	isSaved,
	isApplied,
	reminderOn,
	onSave,
	onApply,
	onToggleReminder,
	p,
	t,
	d,
}: {
	item: Opportunity;
	isSaved: boolean;
	isApplied: boolean;
	reminderOn: boolean;
	onSave: () => void;
	onApply: () => void;
	onToggleReminder: () => Promise<string | null>;
	p: NorthTokens["p"];
	t: NorthTokens["t"];
	d: NorthTokens["d"];
}) {
	const [hint, setHint] = useState<string | null>(null);
	const catLabel = categoryLabel(item.category_id);
	const eligible = reminderEligible(item);
	const tracked = isSaved || isApplied;

	async function handleBell() {
		if (!eligible) {
			setHint("No usable deadline on this one, so no reminder.");
			return;
		}
		const result = await onToggleReminder();
		setHint(result);
	}

	return (
		<Card p={p}>
			{/* Eyebrow: category + optional type */}
			<Text style={[card.eyebrow, { color: p.inkDim, fontFamily: t.ui }]}>
				{[catLabel, item.opportunity_type]
					.filter(Boolean)
					.join(" · ")
					.toUpperCase()}
			</Text>

			<Text
				style={[
					card.title,
					{
						color: p.ink,
						fontFamily: t.display,
						fontStyle: t.editorialItalic ? "italic" : "normal",
					},
				]}
			>
				{item.title}
			</Text>

			<Text style={[card.org, { color: p.inkMid, fontFamily: t.ui }]}>
				{item.org}
			</Text>

			{item.location || item.deadline ? (
				<Text style={[card.meta, { color: p.inkDim, fontFamily: t.ui }]}>
					{[item.location, item.deadline ? `Deadline: ${item.deadline}` : null]
						.filter(Boolean)
						.join(" · ")}
				</Text>
			) : null}

			{item.why ? (
				<Text style={[card.why, { color: p.inkMid, fontFamily: t.ui }]}>
					{item.why}
				</Text>
			) : null}

			{/* Actions */}
			<View style={[card.actions, { marginTop: d.gap }]}>
				<TouchableOpacity
					onPress={onSave}
					style={[
						card.actionBtn,
						{
							borderColor: isSaved ? `${p.green}55` : p.line,
							backgroundColor: isSaved ? `${p.green}14` : "transparent",
						},
					]}
					accessibilityLabel={isSaved ? "Unsave" : "Save"}
				>
					<Text
						style={[
							card.actionLabel,
							{ color: isSaved ? p.greenInk : p.inkMid, fontFamily: t.ui },
						]}
					>
						{isSaved ? "Saved" : "Save"}
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					onPress={onApply}
					style={[
						card.actionBtn,
						{
							// Gold = the needle: Apply is the next action on this card.
							borderColor: isApplied ? `${p.green}55` : p.gold,
							backgroundColor: isApplied ? `${p.green}14` : p.gold,
						},
					]}
					accessibilityLabel={isApplied ? "Applied" : "Apply"}
				>
					<Text
						style={[
							card.actionLabel,
							{
								color: isApplied ? p.greenInk : p.accentInk,
								fontFamily: t.ui,
							},
						]}
					>
						{isApplied ? "Applied ✓" : "Apply ↗"}
					</Text>
				</TouchableOpacity>

				{tracked ? (
					<TouchableOpacity
						onPress={() => void handleBell()}
						style={[
							card.bellBtn,
							{
								borderColor: reminderOn ? p.gold : p.line,
								backgroundColor: reminderOn ? p.accentSoft : "transparent",
								opacity: eligible ? 1 : 0.4,
							},
						]}
						accessibilityLabel={
							reminderOn ? "Cancel deadline reminder" : "Set deadline reminder"
						}
						accessibilityState={{ selected: reminderOn, disabled: !eligible }}
					>
						<Icon
							name="bell"
							size={17}
							color={reminderOn ? p.goldInk : p.inkDim}
						/>
					</TouchableOpacity>
				) : null}
			</View>

			{hint ? (
				<Text style={[card.hint, { color: p.inkDim, fontFamily: t.ui }]}>
					{hint}
				</Text>
			) : null}
		</Card>
	);
}

const card = StyleSheet.create({
	eyebrow: {
		fontSize: 10,
		fontWeight: "500",
		letterSpacing: 1.5,
		marginBottom: 6,
	},
	title: { fontSize: 20, lineHeight: 26, marginBottom: 4 },
	org: { fontSize: 13, marginBottom: 4 },
	meta: { fontSize: 12, marginBottom: 6 },
	why: { fontSize: 13, lineHeight: 19, fontStyle: "italic", marginBottom: 4 },
	actions: { flexDirection: "row", gap: 10, alignItems: "center" },
	actionBtn: {
		flex: 1,
		paddingVertical: 9,
		borderRadius: 8,
		borderWidth: 1,
		alignItems: "center",
	},
	actionLabel: { fontSize: 13, fontWeight: "500" },
	bellBtn: {
		width: 38,
		height: 38,
		borderRadius: 8,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	hint: { fontSize: 11, lineHeight: 15, marginTop: 8 },
});
