// The Community surface: the people you're moving with, as a weekly
// ritual. A progress card says how much of the circle you've checked in
// with; each person is a full-width row carrying their monthly goal and
// a peek of this week's note. Green is the section accent (growth in
// company); gold appears only on the one next action.

import { Icon, Rise } from "@north/native-ui";
import type { getNorthTokens } from "@north/tokens";
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

type Tokens = ReturnType<typeof getNorthTokens>;

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
				<View style={[s.modalHeader, { borderBottomColor: p.line }]}>
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
						placeholder="e.g. Renae, study partner…"
						placeholderTextColor={p.inkDim}
						autoFocus
						style={[
							s.input,
							{
								color: p.ink,
								fontFamily: t.ui,
								borderColor: p.line,
								backgroundColor: p.surface,
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
							<ActivityIndicator color={p.accentInk} size="small" />
						) : (
							<Text
								style={[
									s.saveBtnLabel,
									{ color: p.accentInk, fontFamily: t.ui },
								]}
							>
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
				<View style={[s.modalHeader, { borderBottomColor: p.line }]}>
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
							style={[s.sectionEyebrow, { color: p.goldInk, fontFamily: t.ui }]}
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
									borderColor: `${p.gold}33`,
									backgroundColor: `${p.gold}0a`,
								},
							]}
							textAlignVertical="top"
						/>
					</View>

					{/* Weekly signal */}
					<View style={s.section}>
						<Text
							style={[
								s.sectionEyebrow,
								{ color: p.greenInk, fontFamily: t.ui },
							]}
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
									borderColor: `${p.green}33`,
									backgroundColor: `${p.green}0a`,
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
							<ActivityIndicator color={p.accentInk} size="small" />
						) : (
							<Text
								style={[
									s.saveBtnLabel,
									{ color: p.accentInk, fontFamily: t.ui },
								]}
							>
								Save
							</Text>
						)}
					</TouchableOpacity>
				</ScrollView>
			</KeyboardAvoidingView>
		</Modal>
	);
}

// ── Person row ────────────────────────────────────────────────────────────────
//
// One quiet line per person: a green ring on the avatar means this
// week's check-in is done. No chips, no previews — the row is the
// invitation, the modal is the detail.

function PersonRow({
	person,
	goal,
	checkIn,
	first,
	p,
	t,
	onPress,
}: {
	person: Person;
	goal: PersonGoal | undefined;
	checkIn: PersonCheckIn | undefined;
	first: boolean;
	p: Tokens["p"];
	t: Tokens["t"];
	onPress: () => void;
}) {
	const checkedIn = !!(checkIn?.signal || checkIn?.noise);

	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={`${person.name}${checkedIn ? ", checked in this week" : ", not checked in yet"}`}
			style={({ pressed }) => [
				r.row,
				!first && {
					borderTopWidth: StyleSheet.hairlineWidth,
					borderTopColor: p.line,
				},
				pressed && { opacity: 0.7 },
			]}
		>
			<View
				style={[
					r.avatar,
					{ backgroundColor: p.surfaceHi },
					checkedIn && { borderWidth: 2, borderColor: p.green },
				]}
			>
				<Text
					style={[r.avatarLetter, { color: p.inkMid, fontFamily: t.display }]}
				>
					{person.name[0]?.toUpperCase() ?? "?"}
				</Text>
			</View>
			<View style={r.middle}>
				<Text
					style={[r.name, { color: p.ink, fontFamily: t.ui }]}
					numberOfLines={1}
				>
					{person.name}
				</Text>
				{goal?.goal ? (
					<Text
						style={[r.goal, { color: p.inkMid, fontFamily: t.ui }]}
						numberOfLines={1}
					>
						{goal.goal}
					</Text>
				) : null}
			</View>
			{checkedIn ? <Icon name="check" size={16} color={p.greenInk} /> : null}
		</Pressable>
	);
}

const r = StyleSheet.create({
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 14,
		paddingVertical: 12,
	},
	avatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	avatarLetter: { fontSize: 16 },
	middle: { flex: 1, gap: 1 },
	name: { fontSize: 14.5, fontWeight: "600" },
	goal: { fontSize: 12, lineHeight: 16 },
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

	const checkedIn = people.filter((person) =>
		checkIns.some((c) => c.person_id === person.id && (c.signal || c.noise)),
	).length;
	const allDone = people.length > 0 && checkedIn === people.length;

	if (people.length === 0) {
		return (
			<View>
				<View
					style={[
						s.emptyCard,
						{ backgroundColor: p.surface, borderColor: p.line },
					]}
				>
					<View style={[s.emptyIcon, { backgroundColor: p.surfaceHi }]}>
						<Icon name="community" size={26} color={p.inkMid} />
					</View>
					<Text
						style={[s.emptyHeading, { color: p.ink, fontFamily: t.display }]}
					>
						Direction is easier in company.
					</Text>
					<Text style={[s.emptyText, { color: p.inkMid, fontFamily: t.ui }]}>
						Add the people you're moving with — a mentor, a study partner, a
						friend on the same path — and leave one honest note on their week.
					</Text>
					<TouchableOpacity
						onPress={() => setAddVisible(true)}
						accessibilityRole="button"
						style={[s.emptyBtn, { backgroundColor: p.accent }]}
					>
						<Text
							style={[
								s.emptyBtnLabel,
								{ color: p.accentInk, fontFamily: t.ui },
							]}
						>
							Add your first person
						</Text>
					</TouchableOpacity>
				</View>
				<AddPersonModal
					visible={addVisible}
					p={p}
					t={t}
					onAdd={onAddPerson}
					onClose={() => setAddVisible(false)}
				/>
			</View>
		);
	}

	return (
		<Rise>
			<View style={s.headerRow}>
				<Text style={[s.headerEyebrow, { color: p.inkDim, fontFamily: t.ui }]}>
					YOUR CIRCLE
				</Text>
				<Text
					style={[
						s.headerCount,
						{ color: allDone ? p.greenInk : p.inkDim, fontFamily: t.ui },
					]}
				>
					{allDone
						? "Circle complete"
						: `${checkedIn} of ${people.length} checked in`}
				</Text>
			</View>

			<View
				style={[s.group, { backgroundColor: p.surface, borderColor: p.line }]}
			>
				{people.map((person, i) => (
					<PersonRow
						key={person.id}
						person={person}
						goal={goals.find((g) => g.person_id === person.id)}
						checkIn={checkIns.find((c) => c.person_id === person.id)}
						first={i === 0}
						p={p}
						t={t}
						onPress={() => setSelectedPerson(person)}
					/>
				))}
				<Pressable
					onPress={() => setAddVisible(true)}
					accessibilityRole="button"
					accessibilityLabel="Add a person"
					style={({ pressed }) => [
						s.addRow,
						{ borderTopColor: p.line },
						pressed && { opacity: 0.6 },
					]}
				>
					<View style={[s.addCircle, { borderColor: p.lineHi }]}>
						<Text style={[s.addPlus, { color: p.inkMid, fontFamily: t.ui }]}>
							+
						</Text>
					</View>
					<Text style={[s.addLabel, { color: p.inkMid, fontFamily: t.ui }]}>
						Add person
					</Text>
				</Pressable>
			</View>

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
		</Rise>
	);
}

const s = StyleSheet.create({
	headerRow: {
		flexDirection: "row",
		alignItems: "baseline",
		justifyContent: "space-between",
		marginBottom: 8,
		paddingHorizontal: 2,
	},
	headerEyebrow: { fontSize: 10, fontWeight: "600", letterSpacing: 2 },
	headerCount: { fontSize: 11, fontWeight: "500" },
	group: {
		borderRadius: 16,
		borderWidth: 1,
		overflow: "hidden",
	},
	addRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 14,
		paddingVertical: 11,
		borderTopWidth: StyleSheet.hairlineWidth,
	},
	addCircle: {
		width: 40,
		height: 40,
		borderRadius: 20,
		borderWidth: 1,
		borderStyle: "dashed",
		alignItems: "center",
		justifyContent: "center",
	},
	addPlus: { fontSize: 18, lineHeight: 20 },
	addLabel: { fontSize: 13, fontWeight: "500" },
	emptyCard: {
		borderRadius: 18,
		borderWidth: 1,
		padding: 24,
		alignItems: "center",
	},
	emptyIcon: {
		width: 56,
		height: 56,
		borderRadius: 28,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 14,
	},
	emptyHeading: {
		fontSize: 20,
		lineHeight: 26,
		textAlign: "center",
		marginBottom: 8,
	},
	emptyText: {
		fontSize: 13,
		lineHeight: 20,
		textAlign: "center",
		marginBottom: 18,
	},
	emptyBtn: {
		borderRadius: 10,
		paddingHorizontal: 18,
		paddingVertical: 12,
	},
	emptyBtnLabel: { fontSize: 14, fontWeight: "600" },
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
