import { useCallback, useEffect, useState } from "react";
import { supabase, useSession } from "../auth-client";

export type Person = {
	id: string;
	name: string;
};

export type PersonGoal = {
	id: string;
	person_id: string;
	month: string;
	goal: string;
};

export type PersonCheckIn = {
	id: string;
	person_id: string;
	week_ending: string;
	signal: string | null;
	noise: string | null;
};

export function usePeople() {
	const { data: session } = useSession();
	const [people, setPeople] = useState<Person[]>([]);
	const [goals, setGoals] = useState<PersonGoal[]>([]);
	const [checkIns, setCheckIns] = useState<PersonCheckIn[]>([]);
	const [loading, setLoading] = useState(true);

	const thisMonth = new Date();
	thisMonth.setDate(1);
	const monthKey = thisMonth.toISOString().slice(0, 10);

	const weekEnding = (() => {
		const d = new Date();
		const day = d.getDay();
		const diff = day === 0 ? 0 : 7 - day;
		d.setDate(d.getDate() + diff);
		return d.toISOString().slice(0, 10);
	})();

	const load = useCallback(async () => {
		if (!session?.user.id) return;
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
	}, [session?.user.id, monthKey, weekEnding]);

	useEffect(() => {
		void load();
	}, [load]);

	async function addPerson(name: string): Promise<Person | null> {
		if (!session?.user.id) return null;
		const { data, error } = await supabase
			.from("people")
			.insert({ name, user_id: session.user.id })
			.select("id, name")
			.single();
		if (error || !data) return null;
		const person = data as Person;
		setPeople((prev) => [...prev, person]);
		return person;
	}

	async function upsertGoal(personId: string, goal: string) {
		if (!session?.user.id) return;
		const { data } = await supabase
			.from("person_goals")
			.upsert(
				{
					person_id: personId,
					user_id: session.user.id,
					month: monthKey,
					goal,
				},
				{ onConflict: "person_id,month" },
			)
			.select("id, person_id, month, goal")
			.single();
		if (data) {
			const g = data as PersonGoal;
			setGoals((prev) => [...prev.filter((x) => x.person_id !== personId), g]);
		}
	}

	async function upsertCheckIn(
		personId: string,
		signal: string,
		noise: string,
	) {
		if (!session?.user.id) return;
		const { data } = await supabase
			.from("person_check_ins")
			.upsert(
				{
					person_id: personId,
					user_id: session.user.id,
					week_ending: weekEnding,
					signal: signal || null,
					noise: noise || null,
					updated_at: new Date().toISOString(),
				},
				{ onConflict: "person_id,week_ending" },
			)
			.select("id, person_id, week_ending, signal, noise")
			.single();
		if (data) {
			const ci = data as PersonCheckIn;
			setCheckIns((prev) => [
				...prev.filter((x) => x.person_id !== personId),
				ci,
			]);
		}
	}

	return {
		people,
		goals,
		checkIns,
		loading,
		weekEnding,
		monthKey,
		addPerson,
		upsertGoal,
		upsertCheckIn,
		refresh: load,
	};
}
