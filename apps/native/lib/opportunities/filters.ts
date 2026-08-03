// Country + deadline filtering for the Opportunities feed.
//
// The opportunities table has no reliable `country` column yet (the
// tracker migration adds one for the future), so country is derived
// client-side from the free-text `location` field via keyword match.
// Deadlines are free text too ("30 Jun 2026", "2026-06-30", "Rolling"),
// so parseDeadline is deliberately forgiving and returns null for
// anything it cannot read — those rows land in the "No deadline" bucket.

export type CountryId = "jm" | "tt" | "bb" | "caribbean" | "remote";

export const COUNTRY_OPTIONS: { id: CountryId; label: string }[] = [
	{ id: "jm", label: "Jamaica" },
	{ id: "tt", label: "Trinidad & Tobago" },
	{ id: "bb", label: "Barbados" },
	{ id: "caribbean", label: "Caribbean-wide" },
	{ id: "remote", label: "Remote / Global" },
];

export type DeadlineBucket = "week" | "month" | "later" | "none";

export const DEADLINE_OPTIONS: { id: DeadlineBucket; label: string }[] = [
	{ id: "week", label: "This week" },
	{ id: "month", label: "This month" },
	{ id: "later", label: "Later" },
	{ id: "none", label: "No deadline" },
];

export type OpportunityFilters = {
	country: CountryId | null;
	deadline: DeadlineBucket | null;
};

export const NO_FILTERS: OpportunityFilters = { country: null, deadline: null };

export function countryLabel(id: CountryId | null): string | null {
	if (!id) return null;
	return COUNTRY_OPTIONS.find((c) => c.id === id)?.label ?? id;
}

export function deadlineLabel(id: DeadlineBucket | null): string | null {
	if (!id) return null;
	return DEADLINE_OPTIONS.find((d) => d.id === id)?.label ?? id;
}

// ── Country matching ─────────────────────────────────────────────────

const COUNTRY_KEYWORDS: Record<CountryId, RegExp> = {
	jm: /jamaica|kingston|montego|mandeville|ocho rios|spanish town/i,
	tt: /trinidad|tobago|port of spain|port-of-spain|san fernando/i,
	bb: /barbados|bridgetown/i,
	caribbean: /caribbean|caricom|west indies|regional/i,
	remote: /remote|global|online|worldwide|anywhere|virtual/i,
};

/**
 * True when a location string reads as the given country. A location can
 * match more than one option ("Remote (Jamaica eligible)" matches both
 * `jm` and `remote`) — the filter is inclusive on purpose.
 */
export function matchesCountry(
	location: string | null,
	country: CountryId,
): boolean {
	if (!location) return false;
	return COUNTRY_KEYWORDS[country].test(location);
}

// ── Deadline parsing + bucketing ─────────────────────────────────────

const MONTH_INDEX: Record<string, number> = {
	jan: 0,
	feb: 1,
	mar: 2,
	apr: 3,
	may: 4,
	jun: 5,
	jul: 6,
	aug: 7,
	sep: 8,
	oct: 9,
	nov: 10,
	dec: 11,
};

function monthFromName(name: string): number | null {
	const idx = MONTH_INDEX[name.slice(0, 3).toLowerCase()];
	return idx === undefined ? null : idx;
}

/** End-of-day date for a free-text deadline, or null if unreadable. */
export function parseDeadline(raw: string | null): Date | null {
	if (!raw) return null;
	const s = raw.trim();
	if (!s) return null;
	if (/rolling|ongoing|open|varies|tba|tbd|n\/a|none/i.test(s)) return null;

	// ISO: 2026-06-30 (optionally with a time suffix we ignore).
	const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
	if (iso) {
		return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 23, 59);
	}

	// "30 Jun 2026" / "30 June, 2026".
	const dmy = /^(\d{1,2})\s+([A-Za-z]+),?\s+(\d{4})$/.exec(s);
	if (dmy) {
		const month = monthFromName(dmy[2]);
		const day = Number(dmy[1]);
		if (month !== null && day >= 1 && day <= 31) {
			return new Date(Number(dmy[3]), month, day, 23, 59);
		}
	}

	// "Jun 30, 2026" / "June 30 2026".
	const mdy = /^([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})$/.exec(s);
	if (mdy) {
		const month = monthFromName(mdy[1]);
		const day = Number(mdy[2]);
		if (month !== null && day >= 1 && day <= 31) {
			return new Date(Number(mdy[3]), month, day, 23, 59);
		}
	}

	const parsed = Date.parse(s);
	if (!Number.isNaN(parsed)) return new Date(parsed);
	return null;
}

const DAY_MS = 86_400_000;

export function matchesDeadline(
	raw: string | null,
	bucket: DeadlineBucket,
	now: Date = new Date(),
): boolean {
	const deadline = parseDeadline(raw);
	if (bucket === "none") return deadline === null;
	if (!deadline) return false;
	const days = (deadline.getTime() - now.getTime()) / DAY_MS;
	if (bucket === "week") return days >= 0 && days <= 7;
	if (bucket === "month") return days >= 0 && days <= 31;
	return days > 31; // "later"
}

export function countActiveFilters(filters: OpportunityFilters): number {
	return (filters.country ? 1 : 0) + (filters.deadline ? 1 : 0);
}
