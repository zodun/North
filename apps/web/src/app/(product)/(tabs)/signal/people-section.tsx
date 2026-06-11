"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/auth-client";

type Person = { id: string; name: string };
type PersonGoal = {
	id: string;
	person_id: string;
	month: string;
	goal: string;
};
type PersonCheckIn = {
	id: string;
	person_id: string;
	week_ending: string;
	signal: string | null;
	noise: string | null;
};

function getWeekEnding(): string {
	const d = new Date();
	const day = d.getDay();
	const diff = day === 0 ? 0 : 7 - day;
	d.setDate(d.getDate() + diff);
	return d.toISOString().slice(0, 10);
}

function getMonthKey(): string {
	const d = new Date();
	d.setDate(1);
	return d.toISOString().slice(0, 10);
}

export function PeopleSection() {
	const weekEnding = getWeekEnding();
	const monthKey = getMonthKey();

	const [people, setPeople] = useState<Person[]>([]);
	const [goals, setGoals] = useState<PersonGoal[]>([]);
	const [checkIns, setCheckIns] = useState<PersonCheckIn[]>([]);
	const [loading, setLoading] = useState(true);
	const [addName, setAddName] = useState("");
	const [adding, setAdding] = useState(false);
	const [showAdd, setShowAdd] = useState(false);
	const [selected, setSelected] = useState<Person | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		const [pRes, gRes, cRes] = await Promise.all([
			supabase.from("people").select("id, name").order("created_at"),
			supabase
				.from("person_goals")
				.select("id, person_id, month, goal")
				.eq("month", monthKey),
			supabase
				.from("person_check_ins")
				.select("id, person_id, week_ending, signal, noise")
				.eq("week_ending", weekEnding),
		]);
		setPeople((pRes.data ?? []) as Person[]);
		setGoals((gRes.data ?? []) as PersonGoal[]);
		setCheckIns((cRes.data ?? []) as PersonCheckIn[]);
		setLoading(false);
	}, [monthKey, weekEnding]);

	useEffect(() => {
		void load();
	}, [load]);

	async function addPerson() {
		const name = addName.trim();
		if (!name || adding) return;
		setAdding(true);
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			setAdding(false);
			return;
		}
		const { data } = await supabase
			.from("people")
			.insert({ name, user_id: user.id })
			.select("id, name")
			.single();
		if (data) setPeople((prev) => [...prev, data as Person]);
		setAddName("");
		setAdding(false);
		setShowAdd(false);
	}

	async function upsertGoal(personId: string, goal: string) {
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) return;
		const { data } = await supabase
			.from("person_goals")
			.upsert(
				{ person_id: personId, user_id: user.id, month: monthKey, goal },
				{ onConflict: "person_id,month" },
			)
			.select("id, person_id, month, goal")
			.single();
		if (data)
			setGoals((prev) => [
				...prev.filter((g) => g.person_id !== personId),
				data as PersonGoal,
			]);
	}

	async function upsertCheckIn(
		personId: string,
		signal: string,
		noise: string,
	) {
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) return;
		const { data } = await supabase
			.from("person_check_ins")
			.upsert(
				{
					person_id: personId,
					user_id: user.id,
					week_ending: weekEnding,
					signal: signal || null,
					noise: noise || null,
					updated_at: new Date().toISOString(),
				},
				{ onConflict: "person_id,week_ending" },
			)
			.select("id, person_id, week_ending, signal, noise")
			.single();
		if (data)
			setCheckIns((prev) => [
				...prev.filter((c) => c.person_id !== personId),
				data as PersonCheckIn,
			]);
	}

	const monthLabel = new Date(monthKey).toLocaleDateString("en-US", {
		month: "long",
		year: "numeric",
	});
	const weekLabel = `w/e ${new Date(weekEnding).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

	return (
		<div className="font-jakarta">
			{/* People card */}
			<div className="mb-2 flex items-center justify-between rounded-[14px] border border-white/[0.07] bg-white/[0.03] p-[14px]">
				<div>
					<p className="mb-0.5 font-bold text-[13px] text-white">People</p>
					<p className="text-[11px] text-white/35">
						Track others' signal and noise
					</p>
				</div>
				<button
					type="button"
					onClick={() => setShowAdd(true)}
					className="cursor-pointer rounded-[8px] border px-3 py-1.5 font-bold text-[11px]"
					style={{
						backgroundColor: "rgba(245,200,66,0.1)",
						borderColor: "rgba(245,200,66,0.25)",
						color: "#F5C842",
					}}
				>
					+ Add
				</button>
			</div>

			{!loading && people.length > 0 && (
				<div
					className="mb-2 flex gap-2 overflow-x-auto pb-1"
					style={{ scrollbarWidth: "none" }}
				>
					{people.map((person) => {
						const goal = goals.find((g) => g.person_id === person.id);
						const checkIn = checkIns.find((c) => c.person_id === person.id);
						return (
							<button
								key={person.id}
								type="button"
								onClick={() => setSelected(person)}
								className="w-36 shrink-0 cursor-pointer rounded-[14px] border border-white/[0.07] bg-white/[0.04] p-3.5 text-left transition-colors duration-200 hover:bg-white/[0.07] motion-reduce:transition-none"
							>
								<div
									className="mb-2 flex h-9 w-9 items-center justify-center rounded-full"
									style={{ backgroundColor: "rgba(245,200,66,0.15)" }}
								>
									<span className="font-bold text-[#F5C842] text-lg">
										{person.name[0]?.toUpperCase()}
									</span>
								</div>
								<p className="truncate font-bold text-[13px] text-white">
									{person.name}
								</p>
								{goal?.goal ? (
									<p className="mt-0.5 line-clamp-2 text-[11px] text-white/40 leading-4">
										{goal.goal}
									</p>
								) : (
									<p className="mt-0.5 text-[11px] text-white/30 italic">
										No goal set
									</p>
								)}
								<div className="mt-2 flex gap-1.5">
									<span
										className={`h-2 w-2 rounded-full ${checkIn?.signal ? "bg-[#3ECFBF]" : "bg-white/15"}`}
									/>
									<span
										className={`h-2 w-2 rounded-full ${checkIn?.noise ? "bg-[#f87171]" : "bg-white/15"}`}
									/>
								</div>
							</button>
						);
					})}
				</div>
			)}

			{/* Add person sheet */}
			{showAdd && (
				// biome-ignore lint/a11y/noStaticElementInteractions: modal backdrop
				// biome-ignore lint/a11y/useKeyWithClickEvents: modal backdrop closes on click
				<div
					className="fixed inset-0 z-50 flex items-end bg-black/60"
					onClick={() => setShowAdd(false)}
				>
					{/* biome-ignore lint/a11y/noStaticElementInteractions: inner sheet stops propagation */}
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation only */}
					<div
						className="w-full rounded-t-2xl bg-[#111] p-6 pb-10"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="mx-auto mb-5 h-1 w-9 rounded-full bg-white/20" />
						<h3 className="mb-4 font-semibold text-base text-white">
							Add person
						</h3>
						<label
							htmlFor="add-person-name"
							className="mb-1.5 block font-semibold text-[10px] text-white/40 uppercase tracking-widest"
						>
							Name
						</label>
						<input
							id="add-person-name"
							value={addName}
							onChange={(e) => setAddName(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && void addPerson()}
							placeholder="e.g. Alex, Team lead…"
							className="mb-4 w-full rounded-lg border border-white/10 bg-[#E8B84B]/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#E8B84B]/30"
						/>
						<button
							type="button"
							onClick={() => void addPerson()}
							disabled={!addName.trim() || adding}
							className="w-full rounded-xl py-3 font-semibold text-black text-sm transition-opacity disabled:opacity-40"
							style={{ backgroundColor: "#E8B84B" }}
						>
							{adding ? "Adding…" : "Add"}
						</button>
					</div>
				</div>
			)}

			{/* Person detail sheet */}
			{selected && (
				<PersonSheet
					person={selected}
					goal={goals.find((g) => g.person_id === selected.id)}
					checkIn={checkIns.find((c) => c.person_id === selected.id)}
					weekLabel={weekLabel}
					monthLabel={monthLabel}
					onSave={(sig, noi, goal) => {
						void Promise.all([
							upsertCheckIn(selected.id, sig, noi),
							goal !== undefined
								? upsertGoal(selected.id, goal)
								: Promise.resolve(),
						]);
					}}
					onClose={() => setSelected(null)}
				/>
			)}
		</div>
	);
}

function PersonSheet({
	person,
	goal,
	checkIn,
	weekLabel,
	monthLabel,
	onSave,
	onClose,
}: {
	person: Person;
	goal: PersonGoal | undefined;
	checkIn: PersonCheckIn | undefined;
	weekLabel: string;
	monthLabel: string;
	onSave: (signal: string, noise: string, goal?: string) => void;
	onClose: () => void;
}) {
	const [signal, setSignal] = useState(checkIn?.signal ?? "");
	const [noise, setNoise] = useState(checkIn?.noise ?? "");
	const [goalText, setGoalText] = useState(goal?.goal ?? "");
	const [saving, setSaving] = useState(false);

	async function handleSave() {
		if (saving) return;
		setSaving(true);
		const goalChanged = goalText !== (goal?.goal ?? "");
		onSave(signal, noise, goalChanged ? goalText : undefined);
		setSaving(false);
		onClose();
	}

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: modal backdrop
		// biome-ignore lint/a11y/useKeyWithClickEvents: modal backdrop closes on click
		<div
			className="fixed inset-0 z-50 flex items-end bg-black/60"
			onClick={onClose}
		>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: inner sheet stops propagation */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation only */}
			<div
				className="flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-[#111] pb-10"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="mx-auto mt-3 mb-2 h-1 w-9 shrink-0 rounded-full bg-white/20" />
				<div className="flex shrink-0 items-center justify-between border-white/8 border-b px-5 py-3">
					<span className="font-semibold text-base text-white">
						{person.name}
					</span>
					<button
						type="button"
						onClick={onClose}
						className="text-sm text-white/40"
					>
						Cancel
					</button>
				</div>
				<div className="flex-1 overflow-y-auto px-5 pt-5">
					<div className="mb-5">
						<p
							className="mb-2 font-semibold text-[10px] uppercase tracking-widest"
							style={{ color: "#E8B84B" }}
						>
							Goal · {monthLabel.toUpperCase()}
						</p>
						<textarea
							value={goalText}
							onChange={(e) => setGoalText(e.target.value)}
							placeholder="What should they achieve this month?"
							rows={3}
							className="w-full rounded-lg border bg-[#E8B84B]/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none"
							style={{ borderColor: "#E8B84B33" }}
						/>
					</div>
					<div className="mb-5">
						<p className="mb-2 font-semibold text-[#4ECCA3] text-[10px] uppercase tracking-widest">
							Signal · {weekLabel.toUpperCase()}
						</p>
						<textarea
							value={signal}
							onChange={(e) => setSignal(e.target.value)}
							placeholder="What positive signals did you pick up this week?"
							rows={3}
							className="w-full rounded-lg border border-[#4ECCA3]/20 bg-[#4ECCA3]/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none"
						/>
					</div>
					<div className="mb-6">
						<p className="mb-2 font-semibold text-[#f87171] text-[10px] uppercase tracking-widest">
							Noise · {weekLabel.toUpperCase()}
						</p>
						<textarea
							value={noise}
							onChange={(e) => setNoise(e.target.value)}
							placeholder="Any distractions or concerns to note?"
							rows={3}
							className="w-full rounded-lg border border-[#f87171]/20 bg-[#f87171]/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none"
						/>
					</div>
					<button
						type="button"
						onClick={() => void handleSave()}
						disabled={saving}
						className="w-full rounded-xl py-3 font-semibold text-black text-sm disabled:opacity-40"
						style={{ backgroundColor: "#E8B84B" }}
					>
						{saving ? "Saving…" : "Save"}
					</button>
				</div>
			</div>
		</div>
	);
}
