// Opportunity category taxonomy (OPP roadmap set).
//
// The first 12 ids are the roadmap categories; the last two are legacy
// ids that already exist in opportunity_categories / seeded data and
// must keep working. New ids are inserted into the DB by migration
// 20260731T*_opportunity_tracker.sql.

export type CategoryOption = { id: string; label: string };

export const CATEGORY_OPTIONS: CategoryOption[] = [
	{ id: "job", label: "Jobs" },
	{ id: "internship", label: "Internships" },
	{ id: "scholarship", label: "Scholarships" },
	{ id: "competition", label: "Competitions" },
	{ id: "fellowship", label: "Fellowships" },
	{ id: "grant", label: "Grants" },
	{ id: "accelerator", label: "Accelerators" },
	{ id: "conference", label: "Conferences" },
	{ id: "volunteering", label: "Volunteering" },
	{ id: "course", label: "Courses" },
	{ id: "mentorship", label: "Mentorships" },
	{ id: "event", label: "Events" },
	// Legacy ids retained so existing rows keep filtering + labelling.
	{ id: "community", label: "Communities" },
	{ id: "creator-programme", label: "Creator Programmes" },
];

/** Chip-bar set: "All" (null id) followed by every category. */
export const BROWSE_CATEGORIES: { id: string | null; label: string }[] = [
	{ id: null, label: "All" },
	...CATEGORY_OPTIONS,
];

export function categoryLabel(id: string | null): string | null {
	if (!id) return null;
	return CATEGORY_OPTIONS.find((c) => c.id === id)?.label ?? id;
}
