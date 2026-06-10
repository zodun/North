import type { getTokens } from "@north/tokens";
import { useState } from "react";
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type {
	Person,
	PersonCheckIn,
	PersonGoal,
} from "@/lib/signal/use-people";

type Tokens = ReturnType<typeof getTokens>;

// ── Add-person modal ──────────────────────────────────────────────────────────

function AddPersonModal({
	visible,
	p,
	t,
	onAdd,
	onClose,
}: {
	visible: boolean;
	p: Tokens["p"];
	t: Tokens["t"];
	onAdd: (name: string) => Promise<void>;
	onClose: () => void;
}) {
	const insets = useSafeAreaInsets();
	const [name, setName] = useState("");
	const [saving, setSaving] = useState(false);

	async function handleAdd() {
		if (!name.trim() || saving) return;
		setSaving(true);
		await onAdd(name.trim());
		setName("");
		setSaving(false);
		onClose();
	}

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={onClose}
		>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={[s.modalRoot, { backgroundColor: p.bg }]}
			>
				<View style={s.modalHandle} />
				<View style={[s.modalHeader, { borderBottomColor: `${p.accent}22` }]}>
					<Text style={[s.modalTitle, { color: p.ink, fontFamily: t.ui }]}>
						Add person
					</Text>
					<TouchableOpacity onPress={onClose} hitSlop={12}>
						<Text style={[s.modalClose, { color: p.inkDim, fontFamily: t.ui }]}>
							Cancel
						</Text>
					</TouchableOpacity>
				</View>
				<View style={[s.modalBody, { paddingBottom: insets.bottom + 24 }]}>
					<Text style={[s.fieldLabel, { color: p.inkDim, fontFamily: t.ui }]}>
						NAME
					</Text>
					<TextInput
						value={name}
						onChangeText={setName}
						placeholder="e.g. Alex, Team lead…"
						placeholderTextColor={p.inkDim}
						autoFocus
						style={[
							s.input,
							{
								color: p.ink,
								fontFamily: t.ui,
								borderColor: `${p.accent}33`,
								backgroundColor: `${p.accent}0a`,
							},
						]}
						returnKeyType="done"
						onSubmitEditing={() => void handleAdd()}
					/>
					<TouchableOpacity
						onPress={() => void handleAdd()}
						disabled={!name.trim() || saving}
						style={[
							s.saveBtn,
							{
								backgroundColor:
									name.trim() && !saving ? p.accent : `${p.accent}44`,
							},
						]}
					>
						{saving ? (
							<ActivityIndicator color={p.bg} size="small" />
						) : (
							<Text style={[s.saveBtnLabel, { color: p.bg, fontFamily: t.ui }]}>
								Add
							</Text>
						)}
					</TouchableOpacity>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}

// ── Check-in + goal modal ─────────────────────────────────────────────────────

function PersonModal({
	person,
	goal,
	checkIn,
	weekEnding,
	monthKey,
	p,
	t,
	onSaveCheckIn,
	onSaveGoal,
	onClose,
}: {
	person: Person;
	goal: PersonGoal | undefined;
	checkIn: PersonCheckIn | undefined;
	weekEnding: string;
	monthKey: string;
	p: Tokens["p"];
	t: Tokens["t"];
	onSaveCheckIn: (signal: string, noise: string) => Promise<void>;
	onSaveGoal: (goal: string) => Promise<void>;
	onClose: () => void;
}) {
	const insets = useSafeAreaInsets();
	const [signal, setSignal] = useState(checkIn?.signal ?? "");
	const [noise, setNoise] = useState(checkIn?.noise ?? "");
	const [goalText, setGoalText] = useState(goal?.goal ?? "");
	const [saving, setSaving] = useState(false);

	const weekLabel = (() => {
		const d = new Date(weekEnding);
		return `w/e ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
	})();

	const monthLabel = (() => {
		const d = new Date(monthKey);
		return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
	})();

	async function handleSave() {
		if (saving) return;
		setSaving(true);
		await Promise.all([
			onSaveCheckIn(signal, noise),
			goalText !== (goal?.goal ?? "")
				? onSaveGoal(goalText)
				: Promise.resolve(),
		]);
		setSaving(false);
		onClose();
	}

	return (
		<Modal
			visible
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={onClose}
		>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={[s.modalRoot, { backgroundColor: p.bg }]}
			>
				<View style={s.modalHandle} />
				<View style={[s.modalHeader, { borderBottomColor: `${p.accent}22` }]}>
					<Text style={[s.modalTitle, { color: p.ink, fontFamily: t.ui }]}>
						{person.name}
					</Text>
					<TouchableOpacity onPress={onClose} hitSlop={12}>
						<Text style={[s.modalClose, { color: p.inkDim, fontFamily: t.ui }]}>
							Cancel
						</Text>
					</TouchableOpacity>
				</View>

				<ScrollView
					style={{ flex: 1 }}
					contentContainerStyle={[
						s.modalBody,
						{ paddingBottom: insets.bottom + 24 },
					]}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					{/* Monthly goal */}
					<View style={s.section}>
						<Text
							style={[s.sectionEyebrow, { color: p.accent, fontFamily: t.ui }]}
						>
							GOAL · {monthLabel.toUpperCase()}
						</Text>
						<TextInput
							value={goalText}
							onChangeText={setGoalText}
							placeholder="What should they achieve this month?"
							placeholderTextColor={p.inkDim}
							multiline
							style={[
								s.input,
								{
									color: p.ink,
									fontFamily: t.ui,
									borderColor: `${p.accent}33`,
									backgroundColor: `${p.accent}0a`,
								},
							]}
							textAlignVertical="top"
						/>
					</View>

					{/* Weekly signal */}
					<View style={s.section}>
						<Text
							style={[s.sectionEyebrow, { color: "#4ECCA3", fontFamily: t.ui }]}
						>
							SIGNAL · {weekLabel.toUpperCase()}
						</Text>
						<TextInput
							value={signal}
							onChangeText={setSignal}
							placeholder="What positive signals did you pick up this week?"
							placeholderTextColor={p.inkDim}
							multiline
							style={[
								s.input,
								{
									color: p.ink,
									fontFamily: t.ui,
									borderColor: "#4ECCA333",
									backgroundColor: "#4ECCA30a",
								},
							]}
							textAlignVertical="top"
						/>
					</View>

					{/* Weekly noise */}
					<View style={s.section}>
						<Text
							style={[s.sectionEyebrow, { color: p.warn, fontFamily: t.ui }]}
						>
							NOISE · {weekLabel.toUpperCase()}
						</Text>
						<TextInput
							value={noise}
							onChangeText={setNoise}
							placeholder="Any distractions or concerns to note?"
							placeholderTextColor={p.inkDim}
							multiline
							style={[
								s.input,
								{
									color: p.ink,
									fontFamily: t.ui,
									borderColor: `${p.warn}33`,
									backgroundColor: `${p.warn}0a`,
								},
							]}
							textAlignVertical="top"
						/>
					</View>

					<TouchableOpacity
						onPress={() => void handleSave()}
						disabled={saving}
						style={[
							s.saveBtn,
							{ backgroundColor: saving ? `${p.accent}44` : p.accent },
						]}
					>
						{saving ? (
							<ActivityIndicator color={p.bg} size="small" />
						) : (
							<Text style={[s.saveBtnLabel, { color: p.bg, fontFamily: t.ui }]}>
								Save
							</Text>
						)}
					</TouchableOpacity>
				</ScrollView>
			</KeyboardAvoidingView>
		</Modal>
	);
}

// ── Person card ───────────────────────────────────────────────────────────────

function PersonCard({
	person,
	goal,
	checkIn,
	p,
	t,
	onPress,
}: {
	person: Person;
	goal: PersonGoal | undefined;
	checkIn: PersonCheckIn | undefined;
	p: Tokens["p"];
	t: Tokens["t"];
	onPress: () => void;
}) {
	const hasSignal = !!checkIn?.signal;
	const hasNoise = !!checkIn?.noise;
	const hasGoal = !!goal?.goal;

	return (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => [
				pc.card,
				{
					backgroundColor: p.surface ?? "#1a1f2e",
					borderColor: `${p.accent}22`,
				},
				pressed && { opacity: 0.8 },
			]}
		>
			<View style={pc.avatar}>
				<Text
					style={[pc.avatarLetter, { color: p.accent, fontFamily: t.display }]}
				>
					{person.name[0]?.toUpperCase() ?? "?"}
				</Text>
			</View>
			<Text
				style={[pc.name, { color: p.ink, fontFamily: t.ui }]}
				numberOfLines={1}
			>
				{person.name}
			</Text>
			{hasGoal ? (
				<Text
					style={[pc.goal, { color: p.inkDim, fontFamily: t.ui }]}
					numberOfLines={2}
				>
					{goal?.goal}
				</Text>
			) : (
				<Text
					style={[
						pc.goal,
						{ color: p.inkDim, fontFamily: t.ui, fontStyle: "italic" },
					]}
				>
					No goal set
				</Text>
			)}
			<View style={pc.indicators}>
				<View
					style={[
						pc.dot,
						{ backgroundColor: hasSignal ? "#4ECCA3" : `${p.inkDim}44` },
					]}
				/>
				<View
					style={[
						pc.dot,
						{ backgroundColor: hasNoise ? p.warn : `${p.inkDim}44` },
					]}
				/>
			</View>
		</Pressable>
	);
}

const pc = StyleSheet.create({
	card: {
		width: 140,
		borderRadius: 12,
		borderWidth: 1,
		padding: 14,
		gap: 6,
		marginRight: 10,
	},
	avatar: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "rgba(232,184,75,0.15)",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 4,
	},
	avatarLetter: { fontSize: 18, fontWeight: "600" },
	name: { fontSize: 13, fontWeight: "600" },
	goal: { fontSize: 11, lineHeight: 16 },
	indicators: { flexDirection: "row", gap: 5, marginTop: 4 },
	dot: { width: 7, height: 7, borderRadius: 3.5 },
});

// ── Main exported section ─────────────────────────────────────────────────────

export function PeopleSection({
	people,
	goals,
	checkIns,
	weekEnding,
	monthKey,
	p,
	t,
	onAddPerson,
	onSaveCheckIn,
	onSaveGoal,
}: {
	people: Person[];
	goals: PersonGoal[];
	checkIns: PersonCheckIn[];
	weekEnding: string;
	monthKey: string;
	p: Tokens["p"];
	t: Tokens["t"];
	onAddPerson: (name: string) => Promise<void>;
	onSaveCheckIn: (
		personId: string,
		signal: string,
		noise: string,
	) => Promise<void>;
	onSaveGoal: (personId: string, goal: string) => Promise<void>;
}) {
	const [addVisible, setAddVisible] = useState(false);
	const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

	const selectedGoal = goals.find((g) => g.person_id === selectedPerson?.id);
	const selectedCheckIn = checkIns.find(
		(c) => c.person_id === selectedPerson?.id,
	);

	return (
		<View>
			<View style={s.sectionHeader}>
				<Text style={[s.sectionTitle, { color: p.ink, fontFamily: t.ui }]}>
					People
				</Text>
				<TouchableOpacity onPress={() => setAddVisible(true)} hitSlop={8}>
					<Text style={[s.addBtn, { color: p.accent, fontFamily: t.ui }]}>
						+ Add
					</Text>
				</TouchableOpacity>
			</View>

			{people.length === 0 ? (
				<Pressable
					onPress={() => setAddVisible(true)}
					style={[
						s.emptyCard,
						{
							backgroundColor: p.surface ?? "#1a1f2e",
							borderColor: `${p.accent}22`,
						},
					]}
				>
					<Text style={[s.emptyText, { color: p.inkDim, fontFamily: t.ui }]}>
						Add people to track their signal and noise each week.
					</Text>
				</Pressable>
			) : (
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{ paddingRight: 8 }}
				>
					{people.map((person) => (
						<PersonCard
							key={person.id}
							person={person}
							goal={goals.find((g) => g.person_id === person.id)}
							checkIn={checkIns.find((c) => c.person_id === person.id)}
							p={p}
							t={t}
							onPress={() => setSelectedPerson(person)}
						/>
					))}
				</ScrollView>
			)}

			<AddPersonModal
				visible={addVisible}
				p={p}
				t={t}
				onAdd={onAddPerson}
				onClose={() => setAddVisible(false)}
			/>

			{selectedPerson ? (
				<PersonModal
					person={selectedPerson}
					goal={selectedGoal}
					checkIn={selectedCheckIn}
					weekEnding={weekEnding}
					monthKey={monthKey}
					p={p}
					t={t}
					onSaveCheckIn={(sig, noi) =>
						onSaveCheckIn(selectedPerson.id, sig, noi)
					}
					onSaveGoal={(goal) => onSaveGoal(selectedPerson.id, goal)}
					onClose={() => setSelectedPerson(null)}
				/>
			) : null}
		</View>
	);
}

const s = StyleSheet.create({
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 12,
	},
	sectionTitle: { fontSize: 16, fontWeight: "600" },
	addBtn: { fontSize: 13, fontWeight: "600" },
	emptyCard: {
		borderRadius: 12,
		borderWidth: 1,
		padding: 16,
	},
	emptyText: { fontSize: 13, lineHeight: 20 },
	modalRoot: { flex: 1 },
	modalHandle: {
		width: 36,
		height: 4,
		borderRadius: 2,
		backgroundColor: "#c5c6cd",
		alignSelf: "center",
		marginTop: 12,
		marginBottom: 4,
	},
	modalHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingVertical: 14,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	modalTitle: { fontSize: 16, fontWeight: "600" },
	modalClose: { fontSize: 14 },
	modalBody: { paddingHorizontal: 20, paddingTop: 20 },
	section: { marginBottom: 20 },
	sectionEyebrow: {
		fontSize: 10,
		fontWeight: "600",
		letterSpacing: 1.5,
		marginBottom: 8,
	},
	fieldLabel: {
		fontSize: 10,
		fontWeight: "600",
		letterSpacing: 1.5,
		marginBottom: 8,
	},
	input: {
		borderWidth: 1,
		borderRadius: 8,
		padding: 12,
		fontSize: 14,
		lineHeight: 20,
		minHeight: 72,
		textAlignVertical: "top",
	},
	saveBtn: {
		paddingVertical: 14,
		borderRadius: 10,
		alignItems: "center",
		marginTop: 4,
	},
	saveBtnLabel: { fontSize: 15, fontWeight: "600" },
});
