import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase, useSession } from "../auth-client";
import { useAuthBypass } from "../dev-bypass";
import { applyOrder, personalize } from "../personalize";
import {
	matchesCountry,
	matchesDeadline,
	NO_FILTERS,
	type OpportunityFilters,
} from "./filters";
import { MOCK_OPPORTUNITIES } from "./fixtures";
import type { Opportunity } from "./types";

export function useOpportunities(
	categoryId: string | null,
	search: string,
	filters: OpportunityFilters = NO_FILTERS,
) {
	const bypass = useAuthBypass();
	const { data: session } = useSession();
	const [all, setAll] = useState<Opportunity[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		setError(null);
		if (bypass) {
			setAll(MOCK_OPPORTUNITIES);
			setLoading(false);
			return;
		}
		const { data, error: err } = await supabase
			.from("opportunities")
			.select(
				"id, title, org, category_id, opportunity_type, location, deadline, why, external_url, published_at",
			)
			.order("published_at", { ascending: false })
			.limit(200);

		if (err) {
			setError(err.message);
			setLoading(false);
			return;
		}

		let rows = (data ?? []) as Opportunity[];

		// Premium AI re-rank toward the user's direction (AI-07). The edge
		// function gates on premium and caches per day server-side; free users
		// and any failure keep the recency order.
		if (session && rows.length > 0) {
			const res = await personalize(
				"opportunities",
				rows.map((o) => ({
					id: o.id,
					label: `${o.opportunity_type ?? "opportunity"}: ${o.title} (${o.org})`,
				})),
			);
			if (res) rows = applyOrder(rows, res.order);
		}

		setAll(rows);
		setLoading(false);
	}, [bypass, session]);

	useEffect(() => {
		setLoading(true);
		void refresh();
	}, [refresh]);

	const { country, deadline } = filters;

	const items = useMemo(() => {
		let result = all;
		if (categoryId) {
			result = result.filter((o) => o.category_id === categoryId);
		}
		if (country) {
			result = result.filter((o) => matchesCountry(o.location, country));
		}
		if (deadline) {
			result = result.filter((o) => matchesDeadline(o.deadline, deadline));
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
	}, [all, categoryId, search, country, deadline]);

	return { items, loading, error, refresh };
}
