export type PostType = "opportunity_tip" | "mission_progress";

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
