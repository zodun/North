export type PostType = "opportunity_tip" | "mission_progress";

/**
 * kind distinguishes discussion intents on top of post_type:
 *   update   — plain progress note (default)
 *   question — asks the circle something; renders a Q marker + Answer affordance
 *   answer   — replies to a question; stores the question's id in parent_post_id
 *   story    — success story; gold star marker, surfaced into the feed's story slot
 */
export type PostKind = "update" | "question" | "answer" | "story";

export type CommunityPost = {
	id: string;
	user_id: string;
	post_type: PostType;
	caption: string | null;
	video_url: string | null;
	thumbnail_url: string | null;
	opportunity_id: string | null;
	created_at: string;
};

// ── Spaces view models ────────────────────────────────────────────────

export type InterestCommunity = {
	id: string;
	name: string;
	about: string;
	memberCount: number;
	joined: boolean;
};

export type MissionGroup = {
	id: string;
	name: string;
	goal: string;
	cadence: string;
	members: string[];
	joined: boolean;
};

export type GroupNote = {
	id: string;
	groupId: string;
	author: string;
	body: string;
	createdAt: string;
	isMine: boolean;
};

export type MentorAvailability = "open" | "limited" | "full";

export type Mentor = {
	id: string;
	name: string;
	role: string;
	org: string;
	focusAreas: string[];
	availability: MentorAvailability;
	introRequested: boolean;
};

export type CommunityEvent = {
	id: string;
	title: string;
	startsAt: string;
	city: string | null;
	online: boolean;
	host: string;
	rsvped: boolean;
};

export type Challenge = {
	id: string;
	title: string;
	tagline: string;
	endsAt: string;
	joined: boolean;
	participants: number;
	heldThisWeek: number;
	topThree: string[];
	/** Quiet, non-comparative description of the user's own standing. */
	yourStanding: string | null;
};

export type DmMessage = {
	id: string;
	fromMe: boolean;
	body: string;
	at: string;
};

export type DmThread = {
	id: string;
	personName: string;
	messages: DmMessage[];
};

export type AchievementKey =
	| "first_check_in"
	| "four_week_circle"
	| "helped_five";

export type Achievement = {
	key: AchievementKey;
	label: string;
	detail: string;
	earned: boolean;
	newest: boolean;
};

export type CreatorProfile = {
	name: string;
	bio: string;
	goal: string | null;
	following: boolean;
};
