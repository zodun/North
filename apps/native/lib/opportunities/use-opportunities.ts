import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "../auth-client";
import type { Opportunity } from "./types";

export function useOpportunities(categoryId: string | null, search: string) {
	const [all, setAll] = useState<Opportunity[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		setError(null);
		const { data, error: err } = await supabase
			.from("opportunities")
			.select(
				"id, title, org, category_id, opportunity_type, location, deadline, why, external_url, published_at",
			)
			.order("published_at", { ascending: false })
			.limit(200);

		if (err) {
			setError(err.message);
		} else {
			setAll((data ?? []) as Opportunity[]);
		}
		setLoading(false);
	}, []);

	useEffect(() => {
		setLoading(true);
		void refresh();
	}, [refresh]);

	const items = useMemo(() => {
		let result = all;
		if (categoryId) {
			result = result.filter((o) => o.category_id === categoryId);
		}
		if (search.trim()) {
			const q = search.toLowerCase();
			result = result.filter(
				(o) =>
					o.title.toLowerCase().includes(q) ||
					o.org.toLowerCase().includes(q) ||
					(o.opportunity_type?.toLowerCase().includes(q) ?? false) ||
					(o.location?.toLowerCase().includes(q) ?? false),
			);
		}
		return result;
	}, [all, categoryId, search]);

	return { items, loading, error, refresh };
}
