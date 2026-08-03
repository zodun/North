// Opportunities tab (OPP-03 / OPP-04 / OPP-05 + tracker/filters).
//
// OPP-03: Searchable, filterable feed of cleared opportunities —
//         category chips plus a country/deadline filter sheet.
// OPP-04: Save (toggle) + Apply (link-out + mark applied) per card.
// OPP-05: "Submit an opportunity" inline form → opportunity_submissions.
// Tracker: Browse | Tracker toggle — saved/applied items move through
//          Saved → Applied → Interview → Offer/Closed, with local
//          deadline reminders (3 days before) via expo-notifications.

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

import { ActiveFilterChips } from "@/components/opportunities/ActiveFilterChips";
import { FilterSheet } from "@/components/opportunities/FilterSheet";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { TrackerView } from "@/components/opportunities/TrackerView";
import { supabase, useSession } from "@/lib/auth-client";
import { useAuthBypass } from "@/lib/dev-bypass";
import {
	BROWSE_CATEGORIES,
	CATEGORY_OPTIONS,
} from "@/lib/opportunities/categories";
import {
	countActiveFilters,
	NO_FILTERS,
	type OpportunityFilters,
} from "@/lib/opportunities/filters";
import type { Opportunity } from "@/lib/opportunities/types";
import { useApplicationTracker } from "@/lib/opportunities/use-application-tracker";
import { useOpportunities } from "@/lib/opportunities/use-opportunities";
import { useOpportunityInteractions } from "@/lib/opportunities/use-opportunity-interactions";

type Tokens = ReturnType<typeof getNorthTokens>;

// ── Category filter bar ───────────────────────────────────────────────

function FilterBar({
	active,
	onChange,
	p,
	t,
}: {
	active: string | null;
	onChange: (id: string | null) => void;
	p: Tokens["p"];
	t: Tokens["t"];
}) {
	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={filter.row}
			style={{ backgroundColor: p.bg }}
		>
			{BROWSE_CATEGORIES.map((cat) => {
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

// ── Browse | Tracker toggle ───────────────────────────────────────────

type Mode = "browse" | "tracker";

function ModeToggle({
	mode,
	onChange,
	trackedCount,
	p,
	t,
}: {
	mode: Mode;
	onChange: (mode: Mode) => void;
	trackedCount: number;
	p: Tokens["p"];
	t: Tokens["t"];
}) {
	const segments: { id: Mode; label: string }[] = [
		{ id: "browse", label: "Browse" },
		{
			id: "tracker",
			label: trackedCount > 0 ? `Tracker · ${trackedCount}` : "Tracker",
		},
	];
	return (
		<View
			style={[toggle.wrap, { borderColor: p.line, backgroundColor: p.surface }]}
		>
			{segments.map((seg) => {
				const selected = mode === seg.id;
				return (
					<Pressable
						key={seg.id}
						onPress={() => onChange(seg.id)}
						accessibilityRole="button"
						accessibilityState={{ selected }}
						style={[
							toggle.segment,
							{ backgroundColor: selected ? p.ink : "transparent" },
						]}
					>
						<Text
							style={{
								color: selected ? p.surface : p.inkMid,
								fontFamily: t.ui,
								fontSize: 13,
								fontWeight: selected ? "600" : "500",
							}}
						>
							{seg.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}

const toggle = StyleSheet.create({
	wrap: {
		flexDirection: "row",
		borderWidth: 1,
		borderRadius: 10,
		padding: 3,
		gap: 3,
	},
	segment: {
		flex: 1,
		paddingVertical: 8,
		borderRadius: 7,
		alignItems: "center",
	},
});

// ── Submit form ───────────────────────────────────────────────────────

type SubmitFields = {
	title: string;
	org: string;
	categoryId: string | null;
	location: string;
	deadline: string;
	description: string;
	externalUrl: string;
};

const BLANK_SUBMIT: SubmitFields = {
	title: "",
	org: "",
	categoryId: null,
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
	p: Tokens["p"];
	t: Tokens["t"];
}) {
	const bypass = useAuthBypass();
	const { data: session } = useSession();
	const [fields, setFields] = useState<SubmitFields>(BLANK_SUBMIT);
	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	function set<K extends keyof SubmitFields>(k: K, v: SubmitFields[K]) {
		setFields((prev) => ({ ...prev, [k]: v }));
	}

	async function handleSubmit() {
		if (
			!fields.title.trim() ||
			!fields.org.trim() ||
			!fields.externalUrl.trim()
		)
			return;
		if (bypass) {
			// Dev bypass: no session to attribute the row to — fake success.
			setSubmitted(true);
			setFields(BLANK_SUBMIT);
			return;
		}
		setSubmitting(true);
		const categoryLabelText = fields.categoryId
			? (CATEGORY_OPTIONS.find((c) => c.id === fields.categoryId)?.label ??
				null)
			: null;
		const { error } = await supabase.from("opportunity_submissions").insert({
			submitted_by: session?.user.id ?? null,
			submitter_email: session?.user.email ?? null,
			title: fields.title.trim(),
			org: fields.org.trim(),
			opportunity_type: categoryLabelText,
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
			<View
				style={[form.card, { backgroundColor: p.surface, borderColor: p.line }]}
			>
				<Text style={[form.heading, { color: p.ink, fontFamily: t.display }]}>
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
			</View>
		);
	}

	const canSubmit =
		fields.title.trim() && fields.org.trim() && fields.externalUrl.trim();

	return (
		<View
			style={[form.card, { backgroundColor: p.surface, borderColor: p.line }]}
		>
			<Text style={[form.heading, { color: p.ink, fontFamily: t.display }]}>
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

			<FormField label="Category" p={p} t={t}>
				<View style={form.catWrap}>
					{CATEGORY_OPTIONS.map((cat) => {
						const selected = fields.categoryId === cat.id;
						return (
							<Pressable
								key={cat.id}
								onPress={() => set("categoryId", selected ? null : cat.id)}
								accessibilityRole="button"
								accessibilityState={{ selected }}
								style={[
									form.catChip,
									{
										backgroundColor: selected ? p.accent : p.surface,
										borderColor: selected ? p.accent : p.line,
									},
								]}
							>
								<Text
									style={{
										color: selected ? p.accentInk : p.inkMid,
										fontFamily: t.ui,
										fontSize: 11,
										fontWeight: selected ? "600" : "500",
									}}
								>
									{cat.label}
								</Text>
							</Pressable>
						);
					})}
				</View>
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
		</View>
	);
}

function FormField({
	label,
	p,
	t,
	children,
}: {
	label: string;
	p: Tokens["p"];
	t: Tokens["t"];
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
	card: { borderRadius: 18, borderWidth: 1, padding: 18 },
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
	catWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
	catChip: {
		paddingHorizontal: 11,
		paddingVertical: 6,
		borderRadius: 14,
		borderWidth: 1,
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
	const [mode, setMode] = useState<Mode>("browse");
	const [activeCategory, setActiveCategory] = useState<string | null>(null);
	const [filters, setFilters] = useState<OpportunityFilters>(NO_FILTERS);
	const [search, setSearch] = useState("");
	const [showSubmit, setShowSubmit] = useState(false);
	const [showFilters, setShowFilters] = useState(false);

	const { items, loading, error } = useOpportunities(
		activeCategory,
		search,
		filters,
	);
	const { saved, toggleSave, markApplied } = useOpportunityInteractions();
	const tracker = useApplicationTracker();

	const filterCount = countActiveFilters(filters) + (activeCategory ? 1 : 0);

	function handleApply(item: Opportunity) {
		void markApplied(item.id).then(() => tracker.refresh());
		if (item.external_url) {
			void Linking.openURL(item.external_url);
		}
	}

	function handleSave(item: Opportunity) {
		void toggleSave(item.id).then(() => tracker.refresh());
	}

	const topBar = (
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

			{/* Browse | Tracker */}
			<View style={{ marginHorizontal: d.scrnPad, marginTop: 14 }}>
				<ModeToggle
					mode={mode}
					onChange={setMode}
					trackedCount={tracker.rows.length}
					p={p}
					t={t}
				/>
			</View>
		</View>
	);

	const browseHeader = (
		<View>
			{topBar}

			{/* Search + Filters */}
			<View
				style={{
					marginHorizontal: d.scrnPad,
					marginTop: 12,
					marginBottom: 4,
				}}
			>
				<View style={screen.searchRow}>
					<View
						style={[
							screen.searchWrap,
							{ borderColor: p.line, backgroundColor: p.surface },
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
					<TouchableOpacity
						onPress={() => setShowFilters(true)}
						accessibilityLabel="Open filters"
						style={[
							screen.filterBtn,
							{
								borderColor: filterCount > 0 ? p.gold : p.line,
								backgroundColor: filterCount > 0 ? p.accentSoft : p.surface,
							},
						]}
					>
						<Text
							style={{
								color: filterCount > 0 ? p.goldInk : p.inkMid,
								fontFamily: t.ui,
								fontSize: 13,
								fontWeight: "500",
							}}
						>
							{filterCount > 0 ? `Filters · ${filterCount}` : "Filters"}
						</Text>
					</TouchableOpacity>
				</View>

				<ActiveFilterChips
					category={activeCategory}
					filters={filters}
					onClearCategory={() => setActiveCategory(null)}
					onClearCountry={() => setFilters((f) => ({ ...f, country: null }))}
					onClearDeadline={() => setFilters((f) => ({ ...f, deadline: null }))}
					p={p}
					t={t}
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

	const browseFooter = (
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

	const filterSheet = (
		<FilterSheet
			visible={showFilters}
			category={activeCategory}
			filters={filters}
			onApply={(category, next) => {
				setActiveCategory(category);
				setFilters(next);
				setShowFilters(false);
			}}
			onClose={() => setShowFilters(false)}
			p={p}
			t={t}
		/>
	);

	// ── Tracker mode ──────────────────────────────────────────────────
	if (mode === "tracker") {
		return (
			<SafeAreaView style={[screen.safe, { backgroundColor: p.bg }]}>
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ flexGrow: 1 }}
				>
					{topBar}
					<TrackerView
						rows={tracker.rows}
						loading={tracker.loading}
						onSetStatus={(id, status) => void tracker.setStatus(id, status)}
						onToggleReminder={tracker.toggleReminder}
						p={p}
						t={t}
						d={d}
					/>
				</ScrollView>
			</SafeAreaView>
		);
	}

	// ── Browse mode ───────────────────────────────────────────────────
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
				ListHeaderComponent={browseHeader}
				ListFooterComponent={browseFooter}
				ListEmptyComponent={
					<View style={[screen.empty, { paddingHorizontal: d.scrnPad }]}>
						<Text
							style={[screen.emptyText, { color: p.inkDim, fontFamily: t.ui }]}
						>
							{search.trim() || filterCount > 0
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
							reminderOn={Boolean(tracker.reminders[item.id])}
							onSave={() => handleSave(item)}
							onApply={() => handleApply(item)}
							onToggleReminder={() => tracker.toggleReminder(item)}
							p={p}
							t={t}
							d={d}
						/>
					</View>
				)}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ flexGrow: 1 }}
			/>
			{filterSheet}
		</SafeAreaView>
	);
}

const screen = StyleSheet.create({
	safe: { flex: 1 },
	center: { flex: 1, alignItems: "center", justifyContent: "center" },
	heading: { fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
	searchRow: { flexDirection: "row", gap: 8, alignItems: "center" },
	searchWrap: {
		flex: 1,
		borderWidth: 1,
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	searchInput: { fontSize: 14 },
	filterBtn: {
		borderWidth: 1,
		borderRadius: 10,
		paddingHorizontal: 14,
		paddingVertical: 11,
	},
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
