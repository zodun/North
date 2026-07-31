// Opportunities tab (OPP-03 / OPP-04 / OPP-05).
//
// OPP-03: Searchable, filterable feed of cleared opportunities.
// OPP-04: Save (toggle) + Apply (link-out + mark applied) per card.
// OPP-05: "Submit an opportunity" inline form → opportunity_submissions.

import { Card } from "@north/native-ui";
import { getNorthTokens } from "@north/tokens";
import { useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Linking,
	Pressable,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import { supabase, useSession } from "@/lib/auth-client";
import type { Opportunity } from "@/lib/opportunities/types";
import { useOpportunities } from "@/lib/opportunities/use-opportunities";
import { useOpportunityInteractions } from "@/lib/opportunities/use-opportunity-interactions";

// ── Category filter data ──────────────────────────────────────────────

type Cat = { id: string | null; label: string };

const CATEGORIES: Cat[] = [
	{ id: null, label: "All" },
	{ id: "job", label: "Jobs" },
	{ id: "internship", label: "Internships" },
	{ id: "scholarship", label: "Scholarships" },
	{ id: "accelerator", label: "Accelerators" },
	{ id: "grant", label: "Grants" },
	{ id: "community", label: "Communities" },
	{ id: "event", label: "Events" },
	{ id: "creator-programme", label: "Creator Programmes" },
];

// ── Category filter bar ───────────────────────────────────────────────

function FilterBar({
	active,
	onChange,
	p,
	t,
}: {
	active: string | null;
	onChange: (id: string | null) => void;
	p: ReturnType<typeof getNorthTokens>["p"];
	t: ReturnType<typeof getNorthTokens>["t"];
}) {
	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={filter.row}
			style={{ backgroundColor: p.bg }}
		>
			{CATEGORIES.map((cat) => {
				const selected = active === cat.id;
				return (
					<Pressable
						key={cat.id ?? "__all__"}
						onPress={() => onChange(cat.id)}
						accessibilityRole="button"
						accessibilityState={{ selected }}
						style={({ pressed }) => [
							filter.pill,
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
							{cat.label}
						</Text>
					</Pressable>
				);
			})}
		</ScrollView>
	);
}

const filter = StyleSheet.create({
	row: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		gap: 8,
		flexDirection: "row",
	},
	pill: {
		paddingHorizontal: 14,
		paddingVertical: 7,
		borderRadius: 20,
		borderWidth: 1,
	},
});

// ── Opportunity card ──────────────────────────────────────────────────

function OpportunityCard({
	item,
	isSaved,
	isApplied,
	onSave,
	onApply,
	p,
	t,
	d,
}: {
	item: Opportunity;
	isSaved: boolean;
	isApplied: boolean;
	onSave: () => void;
	onApply: () => void;
	p: ReturnType<typeof getNorthTokens>["p"];
	t: ReturnType<typeof getNorthTokens>["t"];
	d: ReturnType<typeof getNorthTokens>["d"];
}) {
	const catLabel =
		CATEGORIES.find((c) => c.id === item.category_id)?.label ??
		item.category_id;

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
							// Teal = on-course: saving marks intent, not the next action.
							borderColor: isSaved ? `${p.teal}66` : p.line,
							backgroundColor: isSaved ? `${p.teal}1a` : "transparent",
						},
					]}
					accessibilityLabel={isSaved ? "Unsave" : "Save"}
				>
					<Text
						style={[
							card.actionLabel,
							{ color: isSaved ? p.ink : p.inkMid, fontFamily: t.ui },
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
							borderColor: isApplied ? `${p.teal}66` : p.gold,
							backgroundColor: isApplied ? `${p.teal}1a` : p.gold,
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
			</View>
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
	actions: { flexDirection: "row", gap: 10 },
	actionBtn: {
		flex: 1,
		paddingVertical: 9,
		borderRadius: 8,
		borderWidth: 1,
		alignItems: "center",
	},
	actionLabel: { fontSize: 13, fontWeight: "500" },
});

// ── Submit form ───────────────────────────────────────────────────────

type SubmitFields = {
	title: string;
	org: string;
	opportunityType: string;
	location: string;
	deadline: string;
	description: string;
	externalUrl: string;
};

const BLANK_SUBMIT: SubmitFields = {
	title: "",
	org: "",
	opportunityType: "",
	location: "",
	deadline: "",
	description: "",
	externalUrl: "",
};

function SubmitForm({
	onDone,
	p,
	t,
}: {
	onDone: () => void;
	p: ReturnType<typeof getNorthTokens>["p"];
	t: ReturnType<typeof getNorthTokens>["t"];
}) {
	const { data: session } = useSession();
	const [fields, setFields] = useState<SubmitFields>(BLANK_SUBMIT);
	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	function set<K extends keyof SubmitFields>(k: K, v: string) {
		setFields((prev) => ({ ...prev, [k]: v }));
	}

	async function handleSubmit() {
		if (
			!fields.title.trim() ||
			!fields.org.trim() ||
			!fields.externalUrl.trim()
		)
			return;
		setSubmitting(true);
		const { error } = await supabase.from("opportunity_submissions").insert({
			submitted_by: session?.user.id ?? null,
			submitter_email: session?.user.email ?? null,
			title: fields.title.trim(),
			org: fields.org.trim(),
			opportunity_type: fields.opportunityType.trim() || null,
			location: fields.location.trim() || null,
			deadline: fields.deadline.trim() || null,
			description: fields.description.trim() || null,
			external_url: fields.externalUrl.trim(),
		});
		setSubmitting(false);
		if (!error) {
			setSubmitted(true);
			setFields(BLANK_SUBMIT);
		}
	}

	if (submitted) {
		return (
			<Card p={p}>
				<Text
					style={[
						form.heading,
						{
							color: p.ink,
							fontFamily: t.display,
						},
					]}
				>
					Thanks for the tip.
				</Text>
				<Text style={[form.body, { color: p.inkMid, fontFamily: t.ui }]}>
					The team will review it and add it to the feed if it's a fit.
				</Text>
				<TouchableOpacity onPress={onDone} style={form.doneBtn}>
					<Text
						style={[form.doneBtnLabel, { color: p.greenInk, fontFamily: t.ui }]}
					>
						Close
					</Text>
				</TouchableOpacity>
			</Card>
		);
	}

	const canSubmit =
		fields.title.trim() && fields.org.trim() && fields.externalUrl.trim();

	return (
		<Card p={p}>
			<Text
				style={[
					form.heading,
					{
						color: p.ink,
						fontFamily: t.display,
					},
				]}
			>
				Submit an opportunity
			</Text>
			<Text style={[form.sub, { color: p.inkDim, fontFamily: t.ui }]}>
				Know of a job, scholarship, or programme that should be here? Send it
				our way.
			</Text>

			<FormField label="Title *" p={p} t={t}>
				<TextInput
					value={fields.title}
					onChangeText={(v) => set("title", v)}
					placeholder="e.g. Software Engineer at Acme"
					placeholderTextColor={p.inkDim}
					style={[
						form.input,
						{ color: p.ink, fontFamily: t.ui, borderColor: p.line },
					]}
				/>
			</FormField>

			<FormField label="Organisation *" p={p} t={t}>
				<TextInput
					value={fields.org}
					onChangeText={(v) => set("org", v)}
					placeholder="Company or institution name"
					placeholderTextColor={p.inkDim}
					style={[
						form.input,
						{ color: p.ink, fontFamily: t.ui, borderColor: p.line },
					]}
				/>
			</FormField>

			<FormField label="Type" p={p} t={t}>
				<TextInput
					value={fields.opportunityType}
					onChangeText={(v) => set("opportunityType", v)}
					placeholder="e.g. Full-time, scholarship, internship"
					placeholderTextColor={p.inkDim}
					style={[
						form.input,
						{ color: p.ink, fontFamily: t.ui, borderColor: p.line },
					]}
				/>
			</FormField>

			<View style={form.row}>
				<View style={{ flex: 1 }}>
					<FormField label="Location" p={p} t={t}>
						<TextInput
							value={fields.location}
							onChangeText={(v) => set("location", v)}
							placeholder="Kingston / Remote"
							placeholderTextColor={p.inkDim}
							style={[
								form.input,
								{ color: p.ink, fontFamily: t.ui, borderColor: p.line },
							]}
						/>
					</FormField>
				</View>
				<View style={{ flex: 1 }}>
					<FormField label="Deadline" p={p} t={t}>
						<TextInput
							value={fields.deadline}
							onChangeText={(v) => set("deadline", v)}
							placeholder="30 Jun 2026"
							placeholderTextColor={p.inkDim}
							style={[
								form.input,
								{ color: p.ink, fontFamily: t.ui, borderColor: p.line },
							]}
						/>
					</FormField>
				</View>
			</View>

			<FormField label="Description" p={p} t={t}>
				<TextInput
					value={fields.description}
					onChangeText={(v) => set("description", v)}
					placeholder="Any extra context that would help the team"
					placeholderTextColor={p.inkDim}
					multiline
					maxLength={500}
					style={[
						form.textArea,
						{ color: p.ink, fontFamily: t.ui, borderColor: p.line },
					]}
				/>
			</FormField>

			<FormField label="Link *" p={p} t={t}>
				<TextInput
					value={fields.externalUrl}
					onChangeText={(v) => set("externalUrl", v)}
					placeholder="https://..."
					placeholderTextColor={p.inkDim}
					autoCapitalize="none"
					keyboardType="url"
					style={[
						form.input,
						{ color: p.ink, fontFamily: t.ui, borderColor: p.line },
					]}
				/>
			</FormField>

			<View style={form.btnRow}>
				<TouchableOpacity
					onPress={() => void handleSubmit()}
					disabled={!canSubmit || submitting}
					style={[
						form.submitBtn,
						{
							backgroundColor:
								canSubmit && !submitting ? p.accent : `${p.accent}44`,
						},
					]}
				>
					{submitting ? (
						<ActivityIndicator color={p.accentInk} size="small" />
					) : (
						<Text
							style={[
								form.submitLabel,
								{ color: p.accentInk, fontFamily: t.ui },
							]}
						>
							Submit
						</Text>
					)}
				</TouchableOpacity>
				<TouchableOpacity onPress={onDone} style={form.cancelBtn}>
					<Text
						style={[form.cancelLabel, { color: p.inkMid, fontFamily: t.ui }]}
					>
						Cancel
					</Text>
				</TouchableOpacity>
			</View>
		</Card>
	);
}

function FormField({
	label,
	p,
	t,
	children,
}: {
	label: string;
	p: ReturnType<typeof getNorthTokens>["p"];
	t: ReturnType<typeof getNorthTokens>["t"];
	children: React.ReactNode;
}) {
	return (
		<View style={form.field}>
			<Text style={[form.label, { color: p.inkDim, fontFamily: t.ui }]}>
				{label}
			</Text>
			{children}
		</View>
	);
}

const form = StyleSheet.create({
	heading: { fontSize: 22, lineHeight: 28, marginBottom: 6 },
	sub: { fontSize: 13, lineHeight: 18, marginBottom: 14 },
	body: { fontSize: 14, lineHeight: 20, marginBottom: 14 },
	field: { marginBottom: 12 },
	label: { fontSize: 11, fontWeight: "500", marginBottom: 4 },
	input: {
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: 8,
		fontSize: 14,
	},
	textArea: {
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: 8,
		fontSize: 14,
		minHeight: 72,
		textAlignVertical: "top",
	},
	row: { flexDirection: "row", gap: 10 },
	btnRow: { flexDirection: "row", gap: 10, marginTop: 6 },
	submitBtn: {
		flex: 1,
		paddingVertical: 11,
		borderRadius: 8,
		alignItems: "center",
	},
	submitLabel: { fontSize: 14, fontWeight: "500" },
	cancelBtn: { paddingVertical: 11, paddingHorizontal: 16 },
	cancelLabel: { fontSize: 14 },
	doneBtn: { marginTop: 4 },
	doneBtnLabel: { fontSize: 14, fontWeight: "500" },
});

// ── Main screen ───────────────────────────────────────────────────────

export default function Opportunities() {
	const { p, t, d } = getNorthTokens();
	const [activeCategory, setActiveCategory] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [showSubmit, setShowSubmit] = useState(false);

	const { items, loading, error } = useOpportunities(activeCategory, search);
	const { saved, toggleSave, markApplied } = useOpportunityInteractions();

	function handleApply(item: Opportunity) {
		void markApplied(item.id);
		if (item.external_url) {
			void Linking.openURL(item.external_url);
		}
	}

	const header = (
		<View>
			{/* Screen title */}
			<Text
				style={[
					screen.heading,
					{
						color: p.ink,
						fontFamily: t.display,
						marginHorizontal: d.scrnPad,
						marginTop: 16,
					},
				]}
			>
				Opportunities
			</Text>

			{/* Search bar */}
			<View
				style={[
					screen.searchWrap,
					{
						marginHorizontal: d.scrnPad,
						marginTop: 14,
						marginBottom: 4,
						borderColor: p.line,
						backgroundColor: p.surface,
					},
				]}
			>
				<TextInput
					value={search}
					onChangeText={setSearch}
					placeholder="Search opportunities…"
					placeholderTextColor={p.inkDim}
					style={[screen.searchInput, { color: p.ink, fontFamily: t.ui }]}
					returnKeyType="search"
					clearButtonMode="while-editing"
				/>
			</View>

			{/* Category filter */}
			<FilterBar
				active={activeCategory}
				onChange={setActiveCategory}
				p={p}
				t={t}
			/>
		</View>
	);

	const footer = (
		<View
			style={{ paddingHorizontal: d.scrnPad, paddingTop: 8, paddingBottom: 48 }}
		>
			{showSubmit ? (
				<SubmitForm onDone={() => setShowSubmit(false)} p={p} t={t} />
			) : (
				<TouchableOpacity
					onPress={() => setShowSubmit(true)}
					style={[screen.submitTrigger, { borderColor: p.line }]}
				>
					<Text
						style={[
							screen.submitTriggerLabel,
							{ color: p.inkMid, fontFamily: t.ui },
						]}
					>
						Know of an opportunity that should be here? Submit it ↓
					</Text>
				</TouchableOpacity>
			)}
		</View>
	);

	if (loading) {
		return (
			<SafeAreaView style={[screen.safe, { backgroundColor: p.bg }]}>
				<View style={screen.center}>
					<ActivityIndicator color={p.accent} />
				</View>
			</SafeAreaView>
		);
	}

	if (error) {
		return (
			<SafeAreaView style={[screen.safe, { backgroundColor: p.bg }]}>
				<View style={screen.center}>
					<Text style={{ color: p.warn, fontFamily: t.ui, fontSize: 14 }}>
						{error}
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={[screen.safe, { backgroundColor: p.bg }]}>
			<FlatList
				data={items}
				keyExtractor={(item) => item.id}
				ListHeaderComponent={header}
				ListFooterComponent={footer}
				ListEmptyComponent={
					<View style={[screen.empty, { paddingHorizontal: d.scrnPad }]}>
						<Text
							style={[screen.emptyText, { color: p.inkDim, fontFamily: t.ui }]}
						>
							{search.trim() || activeCategory
								? "No opportunities match this filter."
								: "No opportunities yet — check back soon."}
						</Text>
					</View>
				}
				renderItem={({ item }) => (
					<View style={{ paddingHorizontal: d.scrnPad, marginBottom: d.gap }}>
						<OpportunityCard
							item={item}
							isSaved={saved[item.id]?.saved ?? false}
							isApplied={saved[item.id]?.applied ?? false}
							onSave={() => void toggleSave(item.id)}
							onApply={() => handleApply(item)}
							p={p}
							t={t}
							d={d}
						/>
					</View>
				)}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ flexGrow: 1 }}
			/>
		</SafeAreaView>
	);
}

const screen = StyleSheet.create({
	safe: { flex: 1 },
	center: { flex: 1, alignItems: "center", justifyContent: "center" },
	heading: { fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
	searchWrap: {
		borderWidth: 1,
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	searchInput: { fontSize: 14 },
	empty: { paddingTop: 40 },
	emptyText: { fontSize: 14, textAlign: "center" },
	submitTrigger: {
		paddingVertical: 14,
		borderWidth: 1,
		borderRadius: 10,
		alignItems: "center",
		borderStyle: "dashed",
	},
	submitTriggerLabel: { fontSize: 13 },
});
