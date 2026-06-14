export type FocusArea = { id: string; label: string; hue: string };

export const FOCUS_AREAS: FocusArea[] = [
	{ id: "craft", label: "Craft & Mastery", hue: "#7ec4bb" },
	{ id: "venture", label: "Building a venture", hue: "#d4a574" },
	{ id: "mind", label: "Mind & body", hue: "#9aaee0" },
	{ id: "people", label: "People & community", hue: "#c97a5a" },
	{ id: "money", label: "Money & freedom", hue: "#a8b97a" },
	{ id: "learn", label: "Deeper learning", hue: "#b39ad8" },
];

export type FeedItem = {
	id: string;
	kind: "essay" | "voice" | "story" | "opportunity";
	tag: string;
	eyebrow: string;
	title: string;
	body: string;
	source: string;
	match: number;
	reason: string;
};

export const FEED: FeedItem[] = [
	{
		id: "f1",
		kind: "essay",
		tag: "craft",
		eyebrow: "Essay · 6 min",
		title: "The work that compounds is the work no one sees.",
		body: "Three years in, the people who shipped invisibly are the ones still building. The audience came later, or not at all. It stopped mattering.",
		source: "Field Notes",
		match: 0.91,
		reason:
			"You chose Craft & Mastery and saved 2 essays on long-form work last week.",
	},
	{
		id: "f2",
		kind: "voice",
		tag: "venture",
		eyebrow: "Voice note · 11 min",
		title: "A first-time founder on why she stopped pitching.",
		body: '"I was performing the idea instead of testing it. The second I sold one, the deck disappeared."',
		source: "Direction",
		match: 0.86,
		reason:
			"You chose Building a venture and your last two missions were customer-facing.",
	},
	{
		id: "f3",
		kind: "opportunity",
		tag: "venture",
		eyebrow: "Opportunity · open",
		title: "On Deck Founders: Spring cohort applications close June 14.",
		body: "Remote-first, 8 weeks, no equity. Strong fit for solo builders who already have a prototype.",
		source: "On Deck",
		match: 0.78,
		reason: 'Matches your "ship a product" focus and your stated stage.',
	},
	{
		id: "f4",
		kind: "essay",
		tag: "mind",
		eyebrow: "Essay · 4 min",
		title: "Sleep is the part of the workout most people skip.",
		body: "Strength research has converged on a boring answer: the people who recover well outperform the people who train harder.",
		source: "Hesitancy",
		match: 0.73,
		reason: "You added Mind & body during onboarding.",
	},
	{
		id: "f5",
		kind: "story",
		tag: "people",
		eyebrow: "Founder story · 8 min",
		title: "How a logistics co-op grew quietly across three islands.",
		body: "No press, no decks. Seven drivers, one shared route board, and a rule that nobody owns more than 20% of the work.",
		source: "Direction",
		match: 0.69,
		reason: "You expressed interest in community-led ventures.",
	},
];

export type MissionTask = {
	id: string;
	label: string;
	est: string;
	done: boolean;
	kind: string;
};

export const MISSIONS = {
	today: {
		date: "Thursday · 28 May",
		title: "A quiet day to make one real thing.",
		intent:
			"Today is about finishing, not starting. You’ve opened three things this week. Close one.",
		tasks: [
			{
				id: "t1",
				label: "Pick the one thing you will finish today.",
				est: "2 min",
				done: true,
				kind: "choose",
			},
			{
				id: "t2",
				label: "Do 45 minutes on it, phone in the other room.",
				est: "45 min",
				done: false,
				kind: "deep",
			},
			{
				id: "t3",
				label: "Write one sentence on what changed.",
				est: "1 min",
				done: false,
				kind: "reflect",
			},
		] as MissionTask[],
	},
	yesterday: {
		date: "Wednesday · 27 May",
		summary:
			"You did 2 of 3. The one you skipped was the deep-work block, second time this week.",
	},
};

export type Opportunity = {
	id: string;
	title: string;
	org: string;
	type: string;
	location: string;
	deadline: string;
	match: number;
	why: string;
	tags: string[];
};

export const OPPORTUNITIES: Opportunity[] = [
	{
		id: "o1",
		title: "On Deck Founders: Spring",
		org: "On Deck",
		type: "Programme",
		location: "Remote · 8 weeks",
		deadline: "June 14",
		match: 0.84,
		why: 'Matches your "ship a product" focus and current stage.',
		tags: ["founder", "cohort", "no equity"],
	},
	{
		id: "o2",
		title: "Caribbean Climate Fellowship",
		org: "CCREEE",
		type: "Fellowship",
		location: "Kingston · hybrid",
		deadline: "July 02",
		match: 0.71,
		why: 'You added "work that matters regionally" during onboarding.',
		tags: ["regional", "paid", "6 months"],
	},
	{
		id: "o3",
		title: "Write for Field Notes: open call",
		org: "Field Notes",
		type: "Submission",
		location: "Remote",
		deadline: "Rolling",
		match: 0.66,
		why: "You’ve saved 4 essays on long-form work this month.",
		tags: ["writing", "paid", "low-effort"],
	},
	{
		id: "o4",
		title: "Founders meetup: Kingston",
		org: "StartUp JA",
		type: "Event",
		location: "Kingston · in person",
		deadline: "June 09",
		match: 0.62,
		why: "3 people in your focus areas are going.",
		tags: ["community", "evening", "free"],
	},
	{
		id: "o5",
		title: "Mozilla Tech Speakers",
		org: "Mozilla",
		type: "Programme",
		location: "Remote · 6 months",
		deadline: "June 30",
		match: 0.58,
		why: "Adjacent to your craft area; longer-term.",
		tags: ["speaking", "unpaid", "training"],
	},
];

export const JOURNAL = [
	{
		id: "j1",
		date: "Wed 27 May",
		text: "Picked up the project I almost binned last month. It was easier than I thought.",
	},
	{
		id: "j2",
		date: "Mon 25 May",
		text: "Said no to the freelance gig. First time it didn’t feel like loss.",
	},
	{
		id: "j3",
		date: "Fri 22 May",
		text: "Deep work block fell apart after 20 minutes. Not sure why.",
	},
	{
		id: "j4",
		date: "Wed 20 May",
		text: "Shipped the rough version. The feedback was harsher and kinder than expected.",
	},
];

export type OnboardingQ = {
	id: string;
	kind: "text" | "choice" | "multi" | "scale" | "consent";
	prompt: string;
	sub: string;
	placeholder?: string;
	options?: string[];
	scale?: string[];
	points?: string[];
	max?: number;
	optional?: boolean;
};

export const ONBOARDING_QS: OnboardingQ[] = [
	{
		id: "name",
		kind: "text",
		prompt: "What should we call you?",
		sub: "Used only inside the app. Change it any time.",
		placeholder: "Your first name",
	},
	{
		id: "season",
		kind: "choice",
		prompt: "Which feels closer to where you are right now?",
		sub: "There is no right answer. We use this once, then never again.",
		options: [
			"I know what I want and I’m moving on it.",
			"I know what I want but I’m stuck.",
			"I’m between things and figuring it out.",
			"I’m doing fine but I’ve drifted.",
		],
	},
	{
		id: "focus",
		kind: "multi",
		prompt: "Pick up to three focus areas.",
		sub: "These shape your feed, your missions, and the opportunities you see.",
		options: FOCUS_AREAS.map((f) => f.label),
		max: 3,
	},
	{
		id: "time",
		kind: "choice",
		prompt: "How much time can you give this on a real day?",
		sub: "Be honest. We tune your missions to fit.",
		options: ["10 minutes", "30 minutes", "1 hour", "Whatever the day allows"],
	},
	{
		id: "avoid",
		kind: "text",
		prompt: "Is there something you keep starting and not finishing?",
		sub: "No judgement. We use this to make missions that respect it, not push past it.",
		placeholder: "Optional, but useful",
		optional: true,
	},
	{
		id: "baseline",
		kind: "scale",
		prompt:
			"In a typical week, how much of your time goes toward what matters to you?",
		sub: "Baseline. We’ll ask again in four weeks.",
		scale: ["Not at all", "A little", "Somewhat", "Mostly", "Fully"],
	},
	{
		id: "consent",
		kind: "consent",
		prompt: "One last thing.",
		sub: "North learns from what you do. You can see, export, or delete this any time.",
		points: [
			"We store what you read, save, finish, and skip.",
			"We never sell it. We never use it for ads.",
			"You can wipe everything in two taps.",
		],
	},
];
