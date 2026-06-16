// Country name → flag emoji, for the community surfaces. Profiles store country
// as a free-text name (e.g. "India", "Jamaica"), so we map common names (plus a
// few aliases) to ISO 3166-1 alpha-2 and build the regional-indicator emoji.
// Unknown names return "" so the UI simply shows no flag.

const NAME_TO_ISO: Record<string, string> = {
	// Caribbean (launch market)
	jamaica: "jm",
	"trinidad and tobago": "tt",
	trinidad: "tt",
	barbados: "bb",
	bahamas: "bs",
	guyana: "gy",
	haiti: "ht",
	"dominican republic": "do",
	cuba: "cu",
	belize: "bz",
	"saint lucia": "lc",
	grenada: "gd",
	// Africa
	nigeria: "ng",
	ghana: "gh",
	kenya: "ke",
	"south africa": "za",
	egypt: "eg",
	ethiopia: "et",
	tanzania: "tz",
	uganda: "ug",
	rwanda: "rw",
	zimbabwe: "zw",
	zambia: "zm",
	cameroon: "cm",
	"ivory coast": "ci",
	"cote d'ivoire": "ci",
	senegal: "sn",
	morocco: "ma",
	algeria: "dz",
	tunisia: "tn",
	botswana: "bw",
	namibia: "na",
	// Americas
	"united states": "us",
	"united states of america": "us",
	usa: "us",
	america: "us",
	canada: "ca",
	mexico: "mx",
	brazil: "br",
	argentina: "ar",
	colombia: "co",
	chile: "cl",
	peru: "pe",
	venezuela: "ve",
	ecuador: "ec",
	// Asia
	india: "in",
	pakistan: "pk",
	bangladesh: "bd",
	"sri lanka": "lk",
	nepal: "np",
	china: "cn",
	japan: "jp",
	"south korea": "kr",
	indonesia: "id",
	philippines: "ph",
	vietnam: "vn",
	thailand: "th",
	malaysia: "my",
	singapore: "sg",
	"hong kong": "hk",
	// Middle East
	"united arab emirates": "ae",
	uae: "ae",
	"saudi arabia": "sa",
	qatar: "qa",
	kuwait: "kw",
	israel: "il",
	jordan: "jo",
	lebanon: "lb",
	turkey: "tr",
	// Europe
	"united kingdom": "gb",
	uk: "gb",
	england: "gb",
	britain: "gb",
	"great britain": "gb",
	scotland: "gb",
	wales: "gb",
	ireland: "ie",
	germany: "de",
	france: "fr",
	spain: "es",
	italy: "it",
	portugal: "pt",
	netherlands: "nl",
	belgium: "be",
	switzerland: "ch",
	sweden: "se",
	norway: "no",
	denmark: "dk",
	finland: "fi",
	poland: "pl",
	ukraine: "ua",
	russia: "ru",
	greece: "gr",
	austria: "at",
	"czech republic": "cz",
	czechia: "cz",
	romania: "ro",
	hungary: "hu",
	// Oceania
	australia: "au",
	"new zealand": "nz",
};

function iso2ToFlag(cc: string): string {
	return cc
		.toUpperCase()
		.replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

// Returns the flag emoji for a country name, or "" when unknown/empty.
export function countryFlag(name: string | null | undefined): string {
	if (!name) return "";
	const iso = NAME_TO_ISO[name.trim().toLowerCase()];
	return iso ? iso2ToFlag(iso) : "";
}
