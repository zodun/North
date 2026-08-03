// Filter sheet for the Opportunities feed: category, country, deadline.
//
// A plain bottom sheet — white surface, 1px top border, no shadow, no
// blur. Selections are drafted locally and only committed on Apply so
// dismissing the sheet never mutates the feed.

import { Icon } from "@north/native-ui";
import type { NorthTokens } from "@north/tokens";
import { useEffect, useState } from "react";
import {
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

import { CATEGORY_OPTIONS } from "@/lib/opportunities/categories";
import {
	COUNTRY_OPTIONS,
	type CountryId,
	DEADLINE_OPTIONS,
	type DeadlineBucket,
	type OpportunityFilters,
} from "@/lib/opportunities/filters";

function Chip({
	label,
	selected,
	onPress,
	p,
	t,
}: {
	label: string;
	selected: boolean;
	onPress: () => void;
	p: NorthTokens["p"];
	t: NorthTokens["t"];
}) {
	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="button"
			accessibilityState={{ selected }}
			style={({ pressed }) => [
				sheet.chip,
				{
					backgroundColor: selected ? p.accent : p.surface,
					borderColor: selected ? p.accent : p.line,
					opacity: pressed ? 0.8 : 1,
				},
			]}
		>
			<Text
				style={{
					color: selected ? p.accentInk : p.inkMid,
					fontFamily: t.ui,
					fontSize: 12,
					fontWeight: selected ? "600" : "500",
				}}
			>
				{label}
			</Text>
		</Pressable>
	);
}

function Section({
	title,
	children,
	p,
	t,
}: {
	title: string;
	children: React.ReactNode;
	p: NorthTokens["p"];
	t: NorthTokens["t"];
}) {
	return (
		<View style={sheet.section}>
			<Text style={[sheet.sectionTitle, { color: p.inkDim, fontFamily: t.ui }]}>
				{title.toUpperCase()}
			</Text>
			<View style={sheet.chipWrap}>{children}</View>
		</View>
	);
}

export function FilterSheet({
	visible,
	category,
	filters,
	onApply,
	onClose,
	p,
	t,
}: {
	visible: boolean;
	category: string | null;
	filters: OpportunityFilters;
	onApply: (category: string | null, filters: OpportunityFilters) => void;
	onClose: () => void;
	p: NorthTokens["p"];
	t: NorthTokens["t"];
}) {
	const [draftCategory, setDraftCategory] = useState<string | null>(category);
	const [draftCountry, setDraftCountry] = useState<CountryId | null>(
		filters.country,
	);
	const [draftDeadline, setDraftDeadline] = useState<DeadlineBucket | null>(
		filters.deadline,
	);

	// Re-seed drafts each time the sheet opens.
	useEffect(() => {
		if (visible) {
			setDraftCategory(category);
			setDraftCountry(filters.country);
			setDraftDeadline(filters.deadline);
		}
	}, [visible, category, filters.country, filters.deadline]);

	function clearAll() {
		setDraftCategory(null);
		setDraftCountry(null);
		setDraftDeadline(null);
	}

	return (
		<Modal
			visible={visible}
			transparent
			animationType="slide"
			onRequestClose={onClose}
		>
			<View style={sheet.backdropWrap}>
				<Pressable
					style={[sheet.backdrop, { backgroundColor: `${p.night}59` }]}
					onPress={onClose}
					accessibilityLabel="Close filters"
				/>
				<View
					style={[
						sheet.panel,
						{ backgroundColor: p.surface, borderColor: p.line },
					]}
				>
					<View style={sheet.headerRow}>
						<Text
							style={[sheet.heading, { color: p.ink, fontFamily: t.display }]}
						>
							Filters
						</Text>
						<TouchableOpacity
							onPress={onClose}
							accessibilityLabel="Close"
							style={sheet.closeBtn}
						>
							<Icon name="close" size={18} color={p.inkMid} />
						</TouchableOpacity>
					</View>

					<ScrollView showsVerticalScrollIndicator={false} style={sheet.scroll}>
						<Section title="Category" p={p} t={t}>
							<Chip
								label="All"
								selected={draftCategory === null}
								onPress={() => setDraftCategory(null)}
								p={p}
								t={t}
							/>
							{CATEGORY_OPTIONS.map((cat) => (
								<Chip
									key={cat.id}
									label={cat.label}
									selected={draftCategory === cat.id}
									onPress={() =>
										setDraftCategory(draftCategory === cat.id ? null : cat.id)
									}
									p={p}
									t={t}
								/>
							))}
						</Section>

						<Section title="Country" p={p} t={t}>
							<Chip
								label="Anywhere"
								selected={draftCountry === null}
								onPress={() => setDraftCountry(null)}
								p={p}
								t={t}
							/>
							{COUNTRY_OPTIONS.map((c) => (
								<Chip
									key={c.id}
									label={c.label}
									selected={draftCountry === c.id}
									onPress={() =>
										setDraftCountry(draftCountry === c.id ? null : c.id)
									}
									p={p}
									t={t}
								/>
							))}
						</Section>

						<Section title="Deadline" p={p} t={t}>
							<Chip
								label="Any"
								selected={draftDeadline === null}
								onPress={() => setDraftDeadline(null)}
								p={p}
								t={t}
							/>
							{DEADLINE_OPTIONS.map((opt) => (
								<Chip
									key={opt.id}
									label={opt.label}
									selected={draftDeadline === opt.id}
									onPress={() =>
										setDraftDeadline(draftDeadline === opt.id ? null : opt.id)
									}
									p={p}
									t={t}
								/>
							))}
						</Section>
					</ScrollView>

					<View style={sheet.footerRow}>
						<TouchableOpacity onPress={clearAll} style={sheet.clearBtn}>
							<Text
								style={[
									sheet.clearLabel,
									{ color: p.inkMid, fontFamily: t.ui },
								]}
							>
								Clear all
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() =>
								onApply(draftCategory, {
									country: draftCountry,
									deadline: draftDeadline,
								})
							}
							style={[sheet.applyBtn, { backgroundColor: p.accent }]}
							accessibilityLabel="Apply filters"
						>
							<Text
								style={[
									sheet.applyLabel,
									{ color: p.accentInk, fontFamily: t.ui },
								]}
							>
								Show results
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const sheet = StyleSheet.create({
	backdropWrap: { flex: 1, justifyContent: "flex-end" },
	backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
	panel: {
		borderTopLeftRadius: 18,
		borderTopRightRadius: 18,
		borderWidth: 1,
		paddingTop: 18,
		paddingHorizontal: 20,
		paddingBottom: 28,
		maxHeight: "82%",
	},
	headerRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 6,
	},
	heading: { fontSize: 22, lineHeight: 28 },
	closeBtn: { padding: 6, margin: -6 },
	scroll: { flexGrow: 0 },
	section: { marginTop: 14 },
	sectionTitle: {
		fontSize: 10,
		fontWeight: "500",
		letterSpacing: 1.5,
		marginBottom: 8,
	},
	chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	chip: {
		paddingHorizontal: 14,
		paddingVertical: 7,
		borderRadius: 20,
		borderWidth: 1,
	},
	footerRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		marginTop: 20,
	},
	clearBtn: { paddingVertical: 12, paddingHorizontal: 4 },
	clearLabel: { fontSize: 14 },
	applyBtn: {
		flex: 1,
		paddingVertical: 13,
		borderRadius: 10,
		alignItems: "center",
	},
	applyLabel: { fontSize: 14, fontWeight: "600" },
});
