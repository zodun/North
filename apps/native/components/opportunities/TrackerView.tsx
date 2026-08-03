// Application tracker view (OPP roadmap: Application tracker).
//
// Tracked opportunities grouped by pipeline stage — Saved → Applied →
// Interview → Offer / Closed — with a one-tap advance (gold: it is the
// next action), a quiet "mark closed" escape, and the deadline-reminder
// bell. Groups and rows rise in with the standard stagger.

import { Card, Icon, Rise, staggerDelay } from "@north/native-ui";
import type { NorthTokens } from "@north/tokens";
import { useState } from "react";
import {
	ActivityIndicator,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

import { categoryLabel } from "@/lib/opportunities/categories";
import { reminderEligible } from "@/lib/opportunities/reminders";
import {
	type ApplicationStatus,
	nextStatus,
	type Opportunity,
	STATUS_LABELS,
	STATUS_ORDER,
	type TrackedApplication,
} from "@/lib/opportunities/types";

function TrackerRow({
	row,
	onAdvance,
	onMarkClosed,
	onToggleReminder,
	p,
	t,
}: {
	row: TrackedApplication;
	onAdvance: (status: ApplicationStatus) => void;
	onMarkClosed: () => void;
	onToggleReminder: (opp: Opportunity) => Promise<string | null>;
	p: NorthTokens["p"];
	t: NorthTokens["t"];
}) {
	const [hint, setHint] = useState<string | null>(null);
	const { opportunity: opp, status, reminderId } = row;
	const next = nextStatus(status);
	const eligible = reminderEligible(opp);
	const catLabel = categoryLabel(opp.category_id);

	async function handleBell() {
		if (!eligible) {
			setHint("No usable deadline on this one, so no reminder.");
			return;
		}
		const result = await onToggleReminder(opp);
		setHint(result);
	}

	return (
		<Card p={p}>
			<Text style={[row_.eyebrow, { color: p.inkDim, fontFamily: t.ui }]}>
				{[catLabel, opp.org].filter(Boolean).join(" · ").toUpperCase()}
			</Text>
			<Text style={[row_.title, { color: p.ink, fontFamily: t.display }]}>
				{opp.title}
			</Text>
			{opp.deadline ? (
				<View style={row_.metaRow}>
					<Icon name="calendar" size={13} color={p.inkDim} />
					<Text style={[row_.meta, { color: p.inkDim, fontFamily: t.ui }]}>
						Deadline: {opp.deadline}
					</Text>
				</View>
			) : null}

			<View style={row_.actions}>
				{next ? (
					<TouchableOpacity
						onPress={() => onAdvance(next)}
						style={[row_.advanceBtn, { backgroundColor: p.accent }]}
						accessibilityLabel={`Move to ${STATUS_LABELS[next]}`}
					>
						<Text
							style={[
								row_.advanceLabel,
								{ color: p.accentInk, fontFamily: t.ui },
							]}
						>
							Move to {STATUS_LABELS[next]}
						</Text>
						<Icon name="arrowRight" size={13} color={p.accentInk} />
					</TouchableOpacity>
				) : (
					<View
						style={[
							row_.doneBadge,
							{
								borderColor: status === "offer" ? `${p.green}55` : p.line,
								backgroundColor:
									status === "offer" ? `${p.green}14` : "transparent",
							},
						]}
					>
						{status === "offer" ? (
							<Icon name="check" size={13} color={p.greenInk} />
						) : null}
						<Text
							style={[
								row_.doneLabel,
								{
									color: status === "offer" ? p.greenInk : p.inkDim,
									fontFamily: t.ui,
								},
							]}
						>
							{STATUS_LABELS[status]}
						</Text>
					</View>
				)}

				<View style={row_.iconActions}>
					<TouchableOpacity
						onPress={() => void handleBell()}
						style={[
							row_.iconBtn,
							{
								borderColor: reminderId ? p.gold : p.line,
								backgroundColor: reminderId ? p.accentSoft : "transparent",
								opacity: eligible ? 1 : 0.4,
							},
						]}
						accessibilityLabel={
							reminderId ? "Cancel deadline reminder" : "Set deadline reminder"
						}
						accessibilityState={{
							selected: reminderId !== null,
							disabled: !eligible,
						}}
					>
						<Icon
							name="bell"
							size={16}
							color={reminderId ? p.goldInk : p.inkDim}
						/>
					</TouchableOpacity>

					{status !== "closed" ? (
						<TouchableOpacity
							onPress={onMarkClosed}
							style={[row_.iconBtn, { borderColor: p.line }]}
							accessibilityLabel="Mark closed"
						>
							<Icon name="close" size={15} color={p.inkDim} />
						</TouchableOpacity>
					) : null}
				</View>
			</View>

			{hint ? (
				<Text style={[row_.hint, { color: p.inkDim, fontFamily: t.ui }]}>
					{hint}
				</Text>
			) : null}
		</Card>
	);
}

export function TrackerView({
	rows,
	loading,
	onSetStatus,
	onToggleReminder,
	p,
	t,
	d,
}: {
	rows: TrackedApplication[];
	loading: boolean;
	onSetStatus: (opportunityId: string, status: ApplicationStatus) => void;
	onToggleReminder: (opp: Opportunity) => Promise<string | null>;
	p: NorthTokens["p"];
	t: NorthTokens["t"];
	d: NorthTokens["d"];
}) {
	if (loading && rows.length === 0) {
		return (
			<View style={view.center}>
				<ActivityIndicator color={p.accent} />
			</View>
		);
	}

	if (rows.length === 0) {
		return (
			<View style={[view.center, { paddingHorizontal: d.scrnPad }]}>
				<Text style={[view.emptyText, { color: p.inkDim, fontFamily: t.ui }]}>
					Nothing tracked yet. Save or apply to an opportunity in Browse and it
					will show up here.
				</Text>
			</View>
		);
	}

	let rowIndex = 0;
	return (
		<View style={{ paddingHorizontal: d.scrnPad, paddingBottom: 48 }}>
			{STATUS_ORDER.map((status) => {
				const group = rows.filter((r) => r.status === status);
				if (group.length === 0) return null;
				return (
					<View key={status} style={{ marginTop: d.gap }}>
						<Text
							style={[view.groupTitle, { color: p.inkDim, fontFamily: t.ui }]}
						>
							{STATUS_LABELS[status].toUpperCase()} · {group.length}
						</Text>
						{group.map((row) => {
							const delay = staggerDelay(rowIndex);
							rowIndex += 1;
							return (
								<Rise
									key={row.opportunity.id}
									delay={delay}
									style={{ marginBottom: d.gap }}
								>
									<TrackerRow
										row={row}
										onAdvance={(next) => onSetStatus(row.opportunity.id, next)}
										onMarkClosed={() =>
											onSetStatus(row.opportunity.id, "closed")
										}
										onToggleReminder={onToggleReminder}
										p={p}
										t={t}
									/>
								</Rise>
							);
						})}
					</View>
				);
			})}
		</View>
	);
}

const row_ = StyleSheet.create({
	eyebrow: {
		fontSize: 10,
		fontWeight: "500",
		letterSpacing: 1.5,
		marginBottom: 6,
	},
	title: { fontSize: 17, lineHeight: 22, marginBottom: 6 },
	metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
	meta: { fontSize: 12 },
	actions: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginTop: 12,
		gap: 10,
	},
	advanceBtn: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingVertical: 9,
		paddingHorizontal: 14,
		borderRadius: 8,
	},
	advanceLabel: { fontSize: 13, fontWeight: "600" },
	doneBadge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 5,
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 8,
		borderWidth: 1,
	},
	doneLabel: { fontSize: 13, fontWeight: "500" },
	iconActions: { flexDirection: "row", gap: 8 },
	iconBtn: {
		width: 36,
		height: 36,
		borderRadius: 8,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	hint: { fontSize: 11, lineHeight: 15, marginTop: 8 },
});

const view = StyleSheet.create({
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingTop: 60,
	},
	emptyText: { fontSize: 14, lineHeight: 20, textAlign: "center" },
	groupTitle: {
		fontSize: 10,
		fontWeight: "500",
		letterSpacing: 1.5,
		marginBottom: 8,
	},
});
