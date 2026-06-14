// AI-02: Fallback mission templates per focus area.
//
// Used when the OpenAI call fails or the API key is not configured.
// Templates are rotated deterministically by day-of-year so consecutive
// days don't repeat. Each focus area has 3 variants.

export type TaskTemplate = {
	label: string;
	kind: "read" | "write" | "do" | "connect" | "reflect" | "commit";
	estimate_label: string;
};

export type MissionTemplate = {
	title: string;
	intent: string;
	tasks: [TaskTemplate, TaskTemplate, TaskTemplate];
};

export const FALLBACK_TEMPLATES: Record<string, MissionTemplate[]> = {
	craft: [
		{
			title: "Sharpen one skill deliberately today",
			intent:
				"Mastery compounds, one focused session moves you further than scattered effort.",
			tasks: [
				{
					label: "Identify the one skill gap that's limiting you right now",
					kind: "reflect",
					estimate_label: "10 min",
				},
				{
					label: "Do a timed practice block on exactly that gap",
					kind: "do",
					estimate_label: "30 min",
				},
				{
					label: "Note what shifted and what to target next session",
					kind: "write",
					estimate_label: "5 min",
				},
			],
		},
		{
			title: "Study excellent work and pull one principle",
			intent:
				"The fastest path to better craft is deliberate study of work you admire.",
			tasks: [
				{
					label: "Pick one piece of work in your field you genuinely admire",
					kind: "read",
					estimate_label: "5 min",
				},
				{
					label: "Study it closely, what specifically makes it work?",
					kind: "reflect",
					estimate_label: "20 min",
				},
				{
					label: "Write the one principle you'll carry into your own work",
					kind: "write",
					estimate_label: "10 min",
				},
			],
		},
		{
			title: "Close one open loop in your craft",
			intent: "Incompletion drains energy. Finishing something restores it.",
			tasks: [
				{
					label: "Pick one unfinished piece small enough to close today",
					kind: "reflect",
					estimate_label: "5 min",
				},
				{
					label: "Work on it until done or to a clear resting point",
					kind: "do",
					estimate_label: "40 min",
				},
				{
					label: "Mark it done and acknowledge that you closed it",
					kind: "commit",
					estimate_label: "5 min",
				},
			],
		},
	],

	venture: [
		{
			title: "Move one venture needle today",
			intent: "Ventures stall on accumulated small decisions. Make one.",
			tasks: [
				{
					label: "Name the single most important thing blocking forward motion",
					kind: "reflect",
					estimate_label: "10 min",
				},
				{
					label: "Take the smallest action that directly addresses it",
					kind: "do",
					estimate_label: "30 min",
				},
				{
					label: "Record what you did and what comes next",
					kind: "write",
					estimate_label: "5 min",
				},
			],
		},
		{
			title: "Talk to one person in your target market",
			intent:
				"Every conversation with a real customer or potential customer beats an hour of planning.",
			tasks: [
				{
					label: "Identify one person who represents your target customer",
					kind: "reflect",
					estimate_label: "5 min",
				},
				{
					label: "Reach out with a short, honest ask for 15 minutes",
					kind: "connect",
					estimate_label: "10 min",
				},
				{
					label: "Write down the one question you most need answered",
					kind: "write",
					estimate_label: "10 min",
				},
			],
		},
		{
			title: "Clarify your value proposition in plain language",
			intent:
				"If you can't explain what you're building in one sentence, that's the problem to solve.",
			tasks: [
				{
					label: "Write your current one-sentence value proposition",
					kind: "write",
					estimate_label: "10 min",
				},
				{
					label:
						"Read it aloud, does it make sense to someone who has never heard of your venture?",
					kind: "reflect",
					estimate_label: "10 min",
				},
				{
					label: "Rewrite it until it's clear, specific, and true",
					kind: "write",
					estimate_label: "15 min",
				},
			],
		},
	],

	mind: [
		{
			title: "Reset your mental state with one deliberate practice",
			intent:
				"Clarity isn't found, it's created by clearing the noise and returning to the body.",
			tasks: [
				{
					label: "Do 10 minutes of movement, a walk, stretch, or workout",
					kind: "do",
					estimate_label: "10 min",
				},
				{
					label: "Sit quietly for 5 minutes without a screen or task",
					kind: "reflect",
					estimate_label: "5 min",
				},
				{
					label: "Write one thing you're carrying that isn't yours to carry",
					kind: "write",
					estimate_label: "5 min",
				},
			],
		},
		{
			title: "Tend to one thing that supports your energy",
			intent:
				"High performance starts with the basics. Choose one to honour today.",
			tasks: [
				{
					label:
						"Name the one basic (sleep, food, movement) you've been neglecting",
					kind: "reflect",
					estimate_label: "5 min",
				},
				{
					label: "Take one concrete action to improve it today",
					kind: "do",
					estimate_label: "20 min",
				},
				{
					label: "Commit to repeating it tomorrow",
					kind: "commit",
					estimate_label: "2 min",
				},
			],
		},
		{
			title: "Examine one recurring thought clearly",
			intent:
				"Most anxiety lives in vague fears. Naming them specifically makes them smaller.",
			tasks: [
				{
					label: "Write the thought or worry you keep returning to",
					kind: "write",
					estimate_label: "5 min",
				},
				{
					label: "Ask: is this within my control? Write what is and what isn't",
					kind: "reflect",
					estimate_label: "15 min",
				},
				{
					label: "Identify one action you can take on the part that is yours",
					kind: "commit",
					estimate_label: "5 min",
				},
			],
		},
	],

	people: [
		{
			title: "Invest in one relationship with intention",
			intent:
				"Relationships erode slowly through neglect. One meaningful moment reverses that.",
			tasks: [
				{
					label: "Think of one person who deserves more of your attention",
					kind: "reflect",
					estimate_label: "5 min",
				},
				{
					label: "Reach out, not to ask for something, but to offer something",
					kind: "connect",
					estimate_label: "15 min",
				},
				{
					label: "Write what you want that relationship to look like in a year",
					kind: "write",
					estimate_label: "10 min",
				},
			],
		},
		{
			title: "Contribute something useful to your community",
			intent:
				"The people who lift communities are the ones who show up with something to give.",
			tasks: [
				{
					label:
						"Identify one group or community where you could add value today",
					kind: "reflect",
					estimate_label: "5 min",
				},
				{
					label: "Share knowledge, a resource, or an introduction that helps",
					kind: "connect",
					estimate_label: "20 min",
				},
				{
					label: "Note who you helped and what you shared",
					kind: "write",
					estimate_label: "5 min",
				},
			],
		},
		{
			title: "Repair or deepen one professional connection",
			intent:
				"Most opportunities come through people. Tending your network is strategic, not shallow.",
			tasks: [
				{
					label:
						"Identify someone you've lost touch with who matters to your work",
					kind: "reflect",
					estimate_label: "5 min",
				},
				{
					label: "Send a genuine message, no ask, just reconnection",
					kind: "connect",
					estimate_label: "10 min",
				},
				{
					label: "Schedule a proper catch-up if they respond positively",
					kind: "commit",
					estimate_label: "5 min",
				},
			],
		},
	],

	money: [
		{
			title: "Get clear on one financial number",
			intent:
				"Financial clarity isn't about having more, it's about knowing what you have and where it's going.",
			tasks: [
				{
					label:
						"Look at your actual income and expenses from the past 30 days",
					kind: "do",
					estimate_label: "15 min",
				},
				{
					label:
						"Identify one place money left without you consciously choosing it",
					kind: "reflect",
					estimate_label: "10 min",
				},
				{
					label: "Write one change to make before the end of this week",
					kind: "write",
					estimate_label: "5 min",
				},
			],
		},
		{
			title: "Take one concrete step toward a new income stream",
			intent:
				"Financial freedom is built through actions, not intentions. Do one thing today.",
			tasks: [
				{
					label: "Name the income stream you've been putting off starting",
					kind: "reflect",
					estimate_label: "5 min",
				},
				{
					label: "Take the smallest concrete first step on it",
					kind: "do",
					estimate_label: "30 min",
				},
				{
					label: "Set a specific deadline for the next step",
					kind: "commit",
					estimate_label: "5 min",
				},
			],
		},
		{
			title: "Remove one financial friction point",
			intent:
				"Money leaks through small, avoidable frictions. Closing one saves more than it costs.",
			tasks: [
				{
					label: "Identify one subscription, fee, or cost you've been ignoring",
					kind: "reflect",
					estimate_label: "10 min",
				},
				{
					label: "Cancel, renegotiate, or automate it today",
					kind: "do",
					estimate_label: "15 min",
				},
				{
					label:
						"Redirect that resource toward something that actually matters",
					kind: "commit",
					estimate_label: "5 min",
				},
			],
		},
	],

	learn: [
		{
			title: "Go deep on one concept you've been circling",
			intent:
				"Understanding accumulates through depth, not breadth. Choose one thing and follow it.",
			tasks: [
				{
					label:
						"Pick the concept or question you've been meaning to understand properly",
					kind: "reflect",
					estimate_label: "5 min",
				},
				{
					label: "Read one high-quality source on it, no skimming",
					kind: "read",
					estimate_label: "30 min",
				},
				{
					label:
						"Write the concept in your own words without looking at the source",
					kind: "write",
					estimate_label: "10 min",
				},
			],
		},
		{
			title: "Apply something you learned recently",
			intent: "Knowledge unused is knowledge fading. Today, use what you know.",
			tasks: [
				{
					label: "Name one thing you learned in the past week",
					kind: "reflect",
					estimate_label: "5 min",
				},
				{
					label: "Apply it to a real problem or project you're working on",
					kind: "do",
					estimate_label: "30 min",
				},
				{
					label: "Note what worked and what you'd adjust",
					kind: "write",
					estimate_label: "10 min",
				},
			],
		},
		{
			title: "Teach something to solidify your understanding",
			intent:
				"Teaching is the fastest way to find what you actually understand versus what you think you do.",
			tasks: [
				{
					label: "Pick a topic you've studied recently",
					kind: "reflect",
					estimate_label: "5 min",
				},
				{
					label:
						"Write a short explanation of it as if for someone new to the subject",
					kind: "write",
					estimate_label: "20 min",
				},
				{
					label:
						"Share it, a note to a friend, a post, a message to a colleague",
					kind: "connect",
					estimate_label: "10 min",
				},
			],
		},
	],
};

// Default templates for any unmapped focus area.
const DEFAULT_TEMPLATES: MissionTemplate[] = [
	{
		title: "Make one deliberate move toward what matters",
		intent:
			"Every meaningful journey is made of small, purposeful steps. Take one today.",
		tasks: [
			{
				label:
					"Write down the one thing that would move you furthest if done today",
				kind: "reflect",
				estimate_label: "10 min",
			},
			{
				label: "Do it, or the most important part of it",
				kind: "do",
				estimate_label: "30 min",
			},
			{
				label: "Record what you completed and what comes next",
				kind: "write",
				estimate_label: "5 min",
			},
		],
	},
	{
		title: "Clear one obstacle that keeps coming up",
		intent:
			"Recurring blockers don't resolve themselves. Name it today and address it.",
		tasks: [
			{
				label: "Name the obstacle that keeps slowing you down",
				kind: "reflect",
				estimate_label: "10 min",
			},
			{
				label: "Identify the smallest action that reduces it",
				kind: "reflect",
				estimate_label: "10 min",
			},
			{
				label: "Take that action",
				kind: "do",
				estimate_label: "25 min",
			},
		],
	},
	{
		title: "Invest in your future self today",
		intent:
			"Small, consistent deposits into growth compound faster than occasional large efforts.",
		tasks: [
			{
				label: "Read something that will matter to where you want to be",
				kind: "read",
				estimate_label: "20 min",
			},
			{
				label: "Write down the most useful idea from what you read",
				kind: "write",
				estimate_label: "10 min",
			},
			{
				label: "Commit to doing this again tomorrow",
				kind: "commit",
				estimate_label: "2 min",
			},
		],
	},
];

/**
 * Pick a template for the user's primary focus area, rotating by day-of-year
 * so consecutive days don't repeat.
 */
export function pickTemplate(
	primaryFocusAreaId: string,
	missionDate: string,
): MissionTemplate {
	const templates = FALLBACK_TEMPLATES[primaryFocusAreaId] ?? DEFAULT_TEMPLATES;
	const dayOfYear = getDayOfYear(missionDate);
	return templates[dayOfYear % templates.length];
}

function getDayOfYear(dateStr: string): number {
	const d = new Date(`${dateStr}T00:00:00Z`);
	const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 0));
	const diff = d.getTime() - start.getTime();
	return Math.floor(diff / (1000 * 60 * 60 * 24));
}
