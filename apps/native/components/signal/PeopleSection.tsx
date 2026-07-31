// The Community surface: the people you're moving with, as a weekly
// ritual. A progress card says how much of the circle you've checked in
// with; each person is a full-width row carrying their monthly goal and
// a peek of this week's note. Green is the section accent (growth in
// company); gold appears only on the one next action.

import { Icon, ProgressRing, Rise, staggerDelay } from "@north/native-ui";
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

// ── This-week ritual card ─────────────────────────────────────────────────────

function WeekPulseCard({
	people,
	checkIns,
	p,
	t,
}: {
	people: Person[];
	checkIns: PersonCheckIn[];
	p: Tokens["p"];
	t: Tokens["t"];
}) {
	const checkedIn = people.filter((person) =>
		checkIns.some((c) => c.person_id === person.id && (c.signal || c.noise)),
	).length;
	const allDone = checkedIn === people.length;

	return (
		<View style={[w.card, { backgroundColor: p.surface, borderColor: p.line }]}>
			<View style={{ flex: 1 }}>
				<Text style={[w.eyebrow, { color: p.inkDim, fontFamily: t.ui }]}>
					THIS WEEK
				</Text>
				<Text style={[w.count, { color: p.ink, fontFamily: t.display }]}>
					{checkedIn} of {people.length}
				</Text>
				<Text style={[w.sub, { color: p.inkMid, fontFamily: t.ui }]}>
					{allDone
						? "Circle complete. See you Sunday."
						: "checked in — one honest note each is enough."}
				</Text>
			</View>
			<ProgressRing
				p={p}
				value={people.length > 0 ? checkedIn / people.length : 0}
				size={64}
				strokeWidth={7}
				color={p.green}
				trackColor="rgba(13,19,33,0.07)"
				accessibilityLabel={`${checkedIn} of ${people.length} people checked in this week`}
			>
				<Icon name="community" size={22} color={p.greenInk} />
			</ProgressRing>
		</View>
	);
}

const w = StyleSheet.create({
	card: {
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
		borderRadius: 18,
		borderWidth: 1,
		padding: 16,
	},
	eyebrow: {
		fontSize: 10,
		fontWeight: "600",
		letterSpacing: 2,
		marginBottom: 6,
	},
	count: { fontSize: 24, lineHeight: 28 },
	sub: { fontSize: 12, lineHeight: 17, marginTop: 4 },
});

// ── Person row ────────────────────────────────────────────────────────────────

function PersonRow({
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
	const checkedIn = !!(checkIn?.signal || checkIn?.noise);
	const note = checkIn?.signal || checkIn?.noise || null;

	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={`${person.name}${checkedIn ? ", checked in" : ", not checked in yet"}`}
			style={({ pressed }) => [
				r.row,
				{ backgroundColor: p.surface, borderColor: p.line },
				pressed && { opacity: 0.75 },
			]}
		>
			<View style={[r.avatar, { backgroundColor: `${p.green}1a` }]}>
				<Text
					style={[r.avatarLetter, { color: p.greenInk, fontFamily: t.display }]}
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
				) : (
					<Text
						style={[
							r.goal,
							{ color: p.inkDim, fontFamily: t.ui, fontStyle: "italic" },
						]}
					>
						No goal this month
					</Text>
				)}
				{note ? (
					<View style={r.noteRow}>
						<View
							style={[
								r.noteDot,
								{ backgroundColor: checkIn?.signal ? p.green : p.warn },
							]}
						/>
						<Text
							style={[r.note, { color: p.inkDim, fontFamily: t.ui }]}
							numberOfLines={1}
						>
							{note}
						</Text>
					</View>
				) : null}
			</View>

			{checkedIn ? (
				<View style={[r.chip, { backgroundColor: `${p.green}1f` }]}>
					<Text style={[r.chipLabel, { color: p.greenInk, fontFamily: t.ui }]}>
						Checked in
					</Text>
				</View>
			) : (
				<View style={[r.chip, { borderWidth: 1, borderColor: p.lineHi }]}>
					<Text style={[r.chipLabel, { color: p.inkMid, fontFamily: t.ui }]}>
						Check in
					</Text>
				</View>
			)}
		</Pressable>
	);
}

const r = StyleSheet.create({
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		borderRadius: 14,
		borderWidth: 1,
		paddingHorizontal: 14,
		paddingVertical: 13,
	},
	avatar: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: "center",
		justifyContent: "center",
	},
	avatarLetter: { fontSize: 18 },
	middle: { flex: 1, gap: 2 },
	name: { fontSize: 15, fontWeight: "600" },
	goal: { fontSize: 12, lineHeight: 17 },
	noteRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
	noteDot: { width: 5, height: 5, borderRadius: 2.5 },
	note: { fontSize: 11, lineHeight: 15, flex: 1 },
	chip: {
		borderRadius: 999,
		paddingHorizontal: 10,
		paddingVertical: 5,
	},
	chipLabel: { fontSize: 11, fontWeight: "600" },
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

	if (people.length === 0) {
		return (
			<View>
				<View
					style={[
						s.emptyCard,
						{ backgroundColor: p.surface, borderColor: p.line },
					]}
				>
					<View style={[s.emptyIcon, { backgroundColor: `${p.green}1a` }]}>
						<Icon name="community" size={26} color={p.greenInk} />
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
		<View style={s.stack}>
			<Rise>
				<WeekPulseCard people={people} checkIns={checkIns} p={p} t={t} />
			</Rise>

			{people.map((person, i) => (
				<Rise key={person.id} delay={staggerDelay(i + 1)}>
					<PersonRow
						person={person}
						goal={goals.find((g) => g.person_id === person.id)}
						checkIn={checkIns.find((c) => c.person_id === person.id)}
						p={p}
						t={t}
						onPress={() => setSelectedPerson(person)}
					/>
				</Rise>
			))}

			<Rise delay={staggerDelay(people.length + 1)}>
				<Pressable
					onPress={() => setAddVisible(true)}
					accessibilityRole="button"
					accessibilityLabel="Add a person"
					style={({ pressed }) => [
						s.addRow,
						{ borderColor: p.lineHi },
						pressed && { opacity: 0.6 },
					]}
				>
					<Text style={[s.addRowLabel, { color: p.inkMid, fontFamily: t.ui }]}>
						+ Add someone you're moving with
					</Text>
				</Pressable>
			</Rise>

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
	stack: { gap: 10 },
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
	addRow: {
		borderRadius: 14,
		borderWidth: 1,
		borderStyle: "dashed",
		paddingVertical: 14,
		alignItems: "center",
	},
	addRowLabel: { fontSize: 13, fontWeight: "500" },
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
