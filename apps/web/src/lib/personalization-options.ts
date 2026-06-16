// Shared option lists for the "who you are" personalization fields
// (profiles.career_stage / fields / country). Used by both the onboarding flow
// and the editable Preferences section on Profile so the two never drift, the
// stored value must round-trip identically between where it's set and where
// it's edited.

// Single-select. Stored verbatim in profiles.career_stage so the personalize
// prompt reads naturally ("Career stage: 0 to 2 years in").
export const CAREER_STAGES: { value: string; sub: string }[] = [
	{ value: "Student", sub: "Still studying" },
	{ value: "About to graduate", sub: "In the final stretch" },
	{ value: "0 to 2 years in", sub: "Just getting started" },
	{ value: "3 to 5 years in", sub: "Finding my stride" },
	{ value: "Building my own thing", sub: "Self-employed or founder" },
];

// Multi-select up to 2, the biggest relevance lever for a global audience, so
// we keep it focused. Stored in profiles.fields (text[]).
export const FIELDS = [
	"Tech / Engineering",
	"Design",
	"Business / Finance",
	"Marketing / Growth",
	"Science / Research",
	"Creative / Media",
	"Social impact",
	"Still figuring it out",
];
export const MAX_FIELDS = 2;

// Topical / creative interests beyond work or study. Stored in profiles.interests
// (text[]); the user can add their own via a free-text "other" field. Drives
// non-academic opportunity matching and feed personalization.
export const INTEREST_OPTIONS = [
	"Poetry",
	"Writing",
	"Music",
	"Visual art",
	"Photography",
	"Film",
	"Fashion",
	"Dance",
	"Theatre",
	"Sport",
	"Gaming",
	"Activism",
	"Faith",
	"Cooking",
	"Travel",
	"Nature",
];

// Stored in profiles.country. Curated rather than exhaustive, "Somewhere else"
// catches the long tail. A native <select> gives the OS picker on mobile.
export const COUNTRIES = [
	"United States",
	"United Kingdom",
	"Canada",
	"Australia",
	"India",
	"Nigeria",
	"Kenya",
	"Ghana",
	"South Africa",
	"Egypt",
	"Jamaica",
	"Brazil",
	"Mexico",
	"Argentina",
	"Colombia",
	"Germany",
	"France",
	"Spain",
	"Italy",
	"Netherlands",
	"Sweden",
	"Poland",
	"Portugal",
	"Ireland",
	"Switzerland",
	"United Arab Emirates",
	"Saudi Arabia",
	"Turkey",
	"Pakistan",
	"Bangladesh",
	"Indonesia",
	"Philippines",
	"Vietnam",
	"Singapore",
	"Malaysia",
	"Japan",
	"South Korea",
	"China",
	"Hong Kong",
	"New Zealand",
	"Somewhere else",
];
