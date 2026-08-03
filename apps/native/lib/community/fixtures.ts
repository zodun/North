// Design-review fixtures for the Community spaces (bypass mode only).
// Caribbean-flavored seed data: the circle (Renae, Jordan, Shanice…),
// Kingston/Montego Bay events, mentors at NCB/GraceKennedy/Digicel.
// Mutations against these stay in memory — see use-spaces.ts.

import type {
	CommunityEvent,
	DmThread,
	GroupNote,
	InterestCommunity,
	Mentor,
	MissionGroup,
	PostKind,
} from "./types";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

function iso(msAgo: number): string {
	return new Date(Date.now() - msAgo).toISOString();
}

function inDays(days: number, hour = 18): string {
	const d = new Date(Date.now() + days * DAY);
	d.setHours(hour, 0, 0, 0);
	return d.toISOString();
}

// ── Interest communities ──────────────────────────────────────────────

export const FIXTURE_COMMUNITIES: InterestCommunity[] = [
	{
		id: "com-tech-kgn",
		name: "Tech Kingston",
		about: "Developers, designers and founders building from Kingston.",
		memberCount: 214,
		joined: true,
	},
	{
		id: "com-scholarships",
		name: "Scholarship Hunters",
		about: "Finding and winning funding, one application at a time.",
		memberCount: 342,
		joined: false,
	},
	{
		id: "com-farmers",
		name: "Young Farmers JA",
		about: "Modern farming, agri-business and making land pay.",
		memberCount: 96,
		joined: false,
	},
	{
		id: "com-creatives",
		name: "Creative Caribbean",
		about: "Writers, filmmakers and musicians across the region.",
		memberCount: 158,
		joined: false,
	},
	{
		id: "com-firstgen",
		name: "First-Gen Professionals",
		about: "Careers nobody at home can quite explain. We compare notes.",
		memberCount: 77,
		joined: false,
	},
];

// ── Mission groups ────────────────────────────────────────────────────

export const FIXTURE_GROUPS: MissionGroup[] = [
	{
		id: "grp-uwi",
		name: "UWI Applicants",
		goal: "Submit UWI applications by September",
		cadence: "Check-in Sundays",
		members: ["Renae", "Marlon", "Tanya", "Akeem"],
		joined: true,
	},
	{
		id: "grp-cxc",
		name: "CXC Morning Crew",
		goal: "One past paper before 8am",
		cadence: "Weekday mornings",
		members: ["Renae", "Shanice", "Dwayne"],
		joined: false,
	},
	{
		id: "grp-portfolio",
		name: "Portfolio Builders",
		goal: "Ship one case study a month",
		cadence: "Check-in Thursdays",
		members: ["Jordan", "Tanya", "Kemar"],
		joined: false,
	},
];

export const FIXTURE_GROUP_NOTES: GroupNote[] = [
	{
		id: "gn-1",
		groupId: "grp-uwi",
		author: "Renae",
		body: "Personal statement draft two done. Cutting it from 800 to 600 words tonight.",
		createdAt: iso(3 * HOUR),
		isMine: false,
	},
	{
		id: "gn-2",
		groupId: "grp-uwi",
		author: "Marlon",
		body: "Got my transcript from the ministry — took two weeks, start yours early if you haven't.",
		createdAt: iso(26 * HOUR),
		isMine: false,
	},
	{
		id: "gn-3",
		groupId: "grp-uwi",
		author: "Tanya",
		body: "Sunday check-in: forms 60% done. The referee section is the slow part.",
		createdAt: iso(2 * DAY),
		isMine: false,
	},
	{
		id: "gn-4",
		groupId: "grp-cxc",
		author: "Shanice",
		body: "Maths paper 2 this morning. Vectors still rough — anyone has a good video?",
		createdAt: iso(7 * HOUR),
		isMine: false,
	},
	{
		id: "gn-5",
		groupId: "grp-portfolio",
		author: "Jordan",
		body: "Publishing my NCB internship write-up Thursday. Screenshots are the hard part.",
		createdAt: iso(30 * HOUR),
		isMine: false,
	},
];

// ── Mentors ───────────────────────────────────────────────────────────

export const FIXTURE_MENTORS: Mentor[] = [
	{
		id: "men-andrea",
		name: "Andrea Chin",
		role: "Senior Product Manager",
		org: "NCB",
		focusAreas: ["Fintech", "Product careers"],
		availability: "open",
		introRequested: false,
	},
	{
		id: "men-damion",
		name: "Damion Whyte",
		role: "Engineering Lead",
		org: "Digicel",
		focusAreas: ["Software", "First tech jobs"],
		availability: "limited",
		introRequested: false,
	},
	{
		id: "men-karen",
		name: "Karen Salmon",
		role: "Brand Manager",
		org: "GraceKennedy",
		focusAreas: ["Marketing", "FMCG"],
		availability: "open",
		introRequested: false,
	},
	{
		id: "men-nadine",
		name: "Nadine Brown",
		role: "Scholarship Advisor",
		org: "UWI Mona",
		focusAreas: ["Funding", "Applications"],
		availability: "limited",
		introRequested: false,
	},
	{
		id: "men-omar",
		name: "Omar Reid",
		role: "Agronomist",
		org: "GraceKennedy",
		focusAreas: ["Agri-business", "Field research"],
		availability: "full",
		introRequested: false,
	},
];

// ── Events ────────────────────────────────────────────────────────────

export const FIXTURE_EVENTS: CommunityEvent[] = [
	{
		id: "evt-techkgn",
		title: "Tech Kingston Meetup — August",
		startsAt: inDays(6),
		city: "Kingston",
		online: false,
		host: "Tech Kingston",
		rsvped: true,
	},
	{
		id: "evt-cv",
		title: "CV Clinic with Andrea Chin",
		startsAt: inDays(3, 17),
		city: null,
		online: true,
		host: "NCB mentors",
		rsvped: false,
	},
	{
		id: "evt-agri",
		title: "Agri Expo Youth Day",
		startsAt: inDays(12, 10),
		city: "Montego Bay",
		online: false,
		host: "Young Farmers JA",
		rsvped: false,
	},
	{
		id: "evt-scholar",
		title: "Scholarship Q&A Night",
		startsAt: inDays(9, 19),
		city: null,
		online: true,
		host: "Scholarship Hunters",
		rsvped: false,
	},
];

// ── Challenges ────────────────────────────────────────────────────────
//
// Calm by design: participation counts and steady first names, no rank
// numerals, no pressure copy. yourStanding reads like a note to self.

export type FixtureChallenge = {
	id: string;
	title: string;
	tagline: string;
	endsAt: string;
	joined: boolean;
	participants: number;
	heldThisWeek: number;
	topThree: string[];
	yourStanding: string | null;
};

export const FIXTURE_CHALLENGES: FixtureChallenge[] = [
	{
		id: "chl-pages",
		title: "7 mornings, 7 pages",
		tagline: "One page of anything, every morning for a week.",
		endsAt: inDays(4, 23),
		joined: true,
		participants: 23,
		heldThisWeek: 12,
		topThree: ["Renae", "Marlon", "Tanya"],
		yourStanding: "You're on day 4 of 7 — steady.",
	},
	{
		id: "chl-friday",
		title: "Apply Friday",
		tagline: "Send one application every Friday this month.",
		endsAt: inDays(16, 23),
		joined: false,
		participants: 41,
		heldThisWeek: 18,
		topThree: ["Jordan", "Shanice", "Akeem"],
		yourStanding: null,
	},
];

// ── Direct messages ───────────────────────────────────────────────────

export const FIXTURE_DM_THREADS: DmThread[] = [
	{
		id: "dm-renae",
		personName: "Renae",
		messages: [
			{
				id: "dm-r-1",
				fromMe: false,
				body: "You reach the library yet? I'm at the back table.",
				at: iso(5 * HOUR),
			},
			{
				id: "dm-r-2",
				fromMe: true,
				body: "On the way — bringing the past papers from last week.",
				at: iso(5 * HOUR - 8 * 60_000),
			},
			{
				id: "dm-r-3",
				fromMe: false,
				body: "Good. Vectors first today, I promised Shanice we'd sort it.",
				at: iso(5 * HOUR - 12 * 60_000),
			},
			{
				id: "dm-r-4",
				fromMe: true,
				body: "Deal. See you in 20.",
				at: iso(4 * HOUR),
			},
		],
	},
	{
		id: "dm-jordan",
		personName: "Jordan",
		messages: [
			{
				id: "dm-j-1",
				fromMe: true,
				body: "Saw your post — I can look over the CV tonight if you send it.",
				at: iso(28 * HOUR),
			},
			{
				id: "dm-j-2",
				fromMe: false,
				body: "You're a star. Just emailed it. Be honest about the summary section.",
				at: iso(27 * HOUR),
			},
			{
				id: "dm-j-3",
				fromMe: true,
				body: "Read it. Summary is good — but lead with the NCB project, not the coursework.",
				at: iso(20 * HOUR),
			},
			{
				id: "dm-j-4",
				fromMe: false,
				body: "That's fair. Reworking it now, sending Friday. Thank you!",
				at: iso(19 * HOUR),
			},
		],
	},
];

// ── Discussion (kinds: update / question / answer / story) ────────────

export type FixtureDiscussionPost = {
	id: string;
	author: string;
	authorGoal: string | null;
	caption: string;
	hoursAgo: number;
	kind: PostKind;
	parentId: string | null;
	parentAuthor: string | null;
};

export const FIXTURE_DISCUSSION: FixtureDiscussionPost[] = [
	{
		id: "fx-post-1",
		author: "Jordan",
		authorGoal: "Apply to 3 internships",
		caption:
			"Sent my second application today — the NCB one. Anyone willing to look over a CV?",
		hoursAgo: 2,
		kind: "update",
		parentId: null,
		parentAuthor: null,
	},
	{
		id: "fx-post-2",
		author: "Shanice",
		authorGoal: null,
		caption:
			"Anyone else doing the HEART digital skills course? Looking for a study partner.",
		hoursAgo: 6,
		kind: "question",
		parentId: null,
		parentAuthor: null,
	},
	{
		id: "fx-post-3",
		author: "Tanya",
		authorGoal: "Submit UWI applications by September",
		caption:
			"@Shanice I'm three modules in — it's good. Message me, we can pace it together.",
		hoursAgo: 4,
		kind: "answer",
		parentId: "fx-post-2",
		parentAuthor: "Shanice",
	},
	{
		id: "fx-post-4",
		author: "Renae",
		authorGoal: "Finish the CXC prep module",
		caption: "Past papers every morning this week. Two topics left.",
		hoursAgo: 9,
		kind: "update",
		parentId: null,
		parentAuthor: null,
	},
	{
		id: "fx-post-5",
		author: "Marlon",
		authorGoal: "Get into UWI Mona",
		caption:
			"Acceptance letter came this morning. Six months of Sunday check-ins with the UWI group — it works. Keep going.",
		hoursAgo: 22,
		kind: "story",
		parentId: null,
		parentAuthor: null,
	},
	{
		id: "fx-post-6",
		author: "Akeem",
		authorGoal: null,
		caption:
			"Is the Branson Centre accelerator worth it for a one-person farm business?",
		hoursAgo: 30,
		kind: "question",
		parentId: null,
		parentAuthor: null,
	},
	{
		id: "fx-post-7",
		author: "Zoe",
		authorGoal: "Ship the first portfolio case study",
		caption: "Outlined my case study this morning. One small step.",
		hoursAgo: 26,
		kind: "update",
		parentId: null,
		parentAuthor: null,
	},
];

// ── Creator bios (profile sheet) ──────────────────────────────────────

export const FIXTURE_CREATOR_BIOS: Record<
	string,
	{ bio: string; goal: string | null }
> = {
	Renae: {
		bio: "CXC candidate in Kingston. Mornings are for past papers.",
		goal: "Finish the CXC prep module",
	},
	Jordan: {
		bio: "Final-year student chasing a fintech internship.",
		goal: "Apply to 3 internships",
	},
	Shanice: {
		bio: "Learning digital skills through HEART. Looking for study partners.",
		goal: "Complete the HEART digital skills course",
	},
	Tanya: {
		bio: "UWI applicant and part-time tutor in Half Way Tree.",
		goal: "Submit UWI applications by September",
	},
	Marlon: {
		bio: "Incoming UWI Mona student. Proof that Sunday check-ins work.",
		goal: "Get into UWI Mona",
	},
	Akeem: {
		bio: "Runs a small farm in St. Elizabeth. Growing it into a business.",
		goal: "Register the farm as a business",
	},
	Zoe: {
		bio: "Building a design portfolio, one case study at a time.",
		goal: "Ship the first portfolio case study",
	},
};

export const FIXTURE_DEFAULT_BIO = "Part of the North community.";
