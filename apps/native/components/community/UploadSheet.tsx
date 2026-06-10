import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { supabase, useSession } from "@/lib/auth-client";
import type { PostType } from "@/lib/community/types";
import { useCreatePost } from "@/lib/community/use-community-posts";

const GOLD = "#e9c349";

const POST_TYPES: {
	id: PostType;
	label: string;
	icon: keyof typeof Ionicons.glyphMap;
	description: string;
}[] = [
	{
		id: "opportunity_tip",
		label: "Opportunity Tip",
		icon: "bulb-outline",
		description: "Share an opportunity you've heard about",
	},
	{
		id: "mission_progress",
		label: "Mission Progress",
		icon: "trending-up-outline",
		description: "Show progress on your mission",
	},
];

type SelectedVideo = { uri: string; mimeType: string; name: string };

type Props = {
	visible: boolean;
	onClose: () => void;
	onPosted: () => void;
};

export function UploadSheet({ visible, onClose, onPosted }: Props) {
	const insets = useSafeAreaInsets();
	const { create, submitting } = useCreatePost();
	const { data: session } = useSession();

	const [postType, setPostType] = useState<PostType>("opportunity_tip");
	const [caption, setCaption] = useState("");
	const [posted, setPosted] = useState(false);
	const [selectedVideo, setSelectedVideo] = useState<SelectedVideo | null>(
		null,
	);
	const [uploading, setUploading] = useState(false);

	function reset() {
		setPostType("opportunity_tip");
		setCaption("");
		setPosted(false);
		setSelectedVideo(null);
	}

	function handleClose() {
		reset();
		onClose();
	}

	async function filmVideo() {
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		if (status !== "granted") {
			Alert.alert(
				"Camera access required",
				"Enable camera access in Settings to film videos.",
			);
			return;
		}
		const result = await ImagePicker.launchCameraAsync({
			mediaTypes: "videos",
			videoMaxDuration: 60,
			quality: 0.8,
		});
		if (!result.canceled && result.assets[0]) {
			const asset = result.assets[0];
			const ext =
				(asset.mimeType ?? "video/mp4") === "video/quicktime" ? "mov" : "mp4";
			setSelectedVideo({
				uri: asset.uri,
				mimeType: asset.mimeType ?? "video/mp4",
				name: `video.${ext}`,
			});
		}
	}

	async function pickFromLibrary() {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: "videos",
			videoMaxDuration: 60,
			quality: 0.8,
		});
		if (!result.canceled && result.assets[0]) {
			const asset = result.assets[0];
			const ext =
				(asset.mimeType ?? "video/mp4") === "video/quicktime" ? "mov" : "mp4";
			setSelectedVideo({
				uri: asset.uri,
				mimeType: asset.mimeType ?? "video/mp4",
				name: `video.${ext}`,
			});
		}
	}

	async function uploadVideo(video: SelectedVideo): Promise<string | null> {
		if (!session?.user.id) return null;
		const path = `${session.user.id}/${Date.now()}.${video.name.split(".").pop()}`;

		const response = await fetch(video.uri);
		const arrayBuffer = await response.arrayBuffer();

		const { error } = await supabase.storage
			.from("community-videos")
			.upload(path, arrayBuffer, {
				contentType: video.mimeType,
				upsert: false,
			});

		if (error) {
			Alert.alert("Upload failed", error.message);
			return null;
		}

		return supabase.storage.from("community-videos").getPublicUrl(path).data
			.publicUrl;
	}

	async function handleSubmit() {
		setUploading(true);
		let videoUrl: string | null = null;

		if (selectedVideo) {
			videoUrl = await uploadVideo(selectedVideo);
			if (!videoUrl) {
				setUploading(false);
				return;
			}
		}

		setUploading(false);
		const id = await create({
			post_type: postType,
			caption,
			video_url: videoUrl,
		});
		if (id) {
			setPosted(true);
			setTimeout(() => {
				handleClose();
				onPosted();
			}, 1400);
		}
	}

	const busy = submitting || uploading;
	const canSubmit = (caption.trim().length > 0 || !!selectedVideo) && !busy;

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={handleClose}
		>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={styles.root}
			>
				<View style={styles.handle} />

				<View style={styles.header}>
					<Text style={styles.headerTitle}>Share with the community</Text>
					<Pressable
						onPress={handleClose}
						hitSlop={12}
						accessibilityRole="button"
						accessibilityLabel="Close"
					>
						<Ionicons name="close" size={24} color="#44474d" />
					</Pressable>
				</View>

				{posted ? (
					<View style={styles.successWrap}>
						<View style={styles.successIcon}>
							<Ionicons name="checkmark" size={36} color={GOLD} />
						</View>
						<Text style={styles.successTitle}>Posted!</Text>
						<Text style={styles.successSub}>Your post is now in the feed.</Text>
					</View>
				) : (
					<ScrollView
						style={styles.scroll}
						contentContainerStyle={[
							styles.body,
							{ paddingBottom: insets.bottom + 24 },
						]}
						keyboardShouldPersistTaps="handled"
						showsVerticalScrollIndicator={false}
					>
						{/* Post type */}
						<Text style={styles.sectionLabel}>What are you sharing?</Text>
						<View style={styles.typeRow}>
							{POST_TYPES.map((t) => {
								const active = postType === t.id;
								return (
									<Pressable
										key={t.id}
										onPress={() => setPostType(t.id)}
										style={({ pressed }) => [
											styles.typeCard,
											active && styles.typeCardActive,
											pressed && { opacity: 0.85 },
										]}
										accessibilityRole="button"
										accessibilityState={{ selected: active }}
									>
										<Ionicons
											name={t.icon}
											size={22}
											color={active ? GOLD : "#75777e"}
										/>
										<Text
											style={[
												styles.typeLabel,
												active && styles.typeLabelActive,
											]}
										>
											{t.label}
										</Text>
										<Text style={styles.typeDesc}>{t.description}</Text>
									</Pressable>
								);
							})}
						</View>

						{/* Video */}
						<Text style={[styles.sectionLabel, { marginTop: 16 }]}>
							Video (optional)
						</Text>
						{selectedVideo ? (
							<View style={styles.videoSelected}>
								<View style={styles.videoSelectedIcon}>
									<Ionicons name="videocam" size={28} color={GOLD} />
								</View>
								<View style={styles.videoSelectedInfo}>
									<Text style={styles.videoSelectedLabel}>Video ready</Text>
									<Text style={styles.videoSelectedName} numberOfLines={1}>
										{selectedVideo.name}
									</Text>
								</View>
								<Pressable
									onPress={() => setSelectedVideo(null)}
									hitSlop={10}
									accessibilityRole="button"
									accessibilityLabel="Remove video"
								>
									<Ionicons name="close-circle" size={22} color="#c5c6cd" />
								</Pressable>
							</View>
						) : (
							<View style={styles.videoPickRow}>
								<Pressable
									onPress={() => void filmVideo()}
									style={({ pressed }) => [
										styles.videoPickBtn,
										pressed && { opacity: 0.8 },
									]}
									accessibilityRole="button"
								>
									<Ionicons name="videocam-outline" size={24} color="#44474d" />
									<Text style={styles.videoPickLabel}>Film video</Text>
								</Pressable>
								<View style={styles.videoPickDivider} />
								<Pressable
									onPress={() => void pickFromLibrary()}
									style={({ pressed }) => [
										styles.videoPickBtn,
										pressed && { opacity: 0.8 },
									]}
									accessibilityRole="button"
								>
									<Ionicons name="images-outline" size={24} color="#44474d" />
									<Text style={styles.videoPickLabel}>Choose from library</Text>
								</Pressable>
							</View>
						)}

						{/* Caption */}
						<Text style={[styles.sectionLabel, { marginTop: 16 }]}>
							Caption{selectedVideo ? " (optional)" : ""}
						</Text>
						<TextInput
							value={caption}
							onChangeText={setCaption}
							placeholder={
								postType === "opportunity_tip"
									? "e.g. Just heard about an amazing fellowship for Caribbean founders…"
									: "e.g. Week 3 of my product-building mission, shipped the MVP today…"
							}
							placeholderTextColor="#c5c6cd"
							multiline
							maxLength={280}
							style={styles.captionInput}
							textAlignVertical="top"
						/>
						<Text style={styles.charCount}>{caption.length}/280</Text>

						{/* Submit */}
						<Pressable
							onPress={() => void handleSubmit()}
							disabled={!canSubmit}
							style={({ pressed }) => [
								styles.submitBtn,
								!canSubmit && styles.submitBtnDisabled,
								pressed && canSubmit && { opacity: 0.9 },
							]}
							accessibilityRole="button"
						>
							{busy ? (
								<ActivityIndicator color="#000" size="small" />
							) : (
								<Text
									style={[
										styles.submitLabel,
										!canSubmit && styles.submitLabelDisabled,
									]}
								>
									{uploading ? "Uploading…" : submitting ? "Posting…" : "Post"}
								</Text>
							)}
						</Pressable>
					</ScrollView>
				)}
			</KeyboardAvoidingView>
		</Modal>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1, backgroundColor: "#f9f9f9" },
	handle: {
		width: 36,
		height: 4,
		borderRadius: 2,
		backgroundColor: "#c5c6cd",
		alignSelf: "center",
		marginTop: 12,
		marginBottom: 4,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingVertical: 14,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "#c5c6cd",
	},
	headerTitle: { fontSize: 16, fontWeight: "600", color: "#1a1c1c" },
	scroll: { flex: 1 },
	body: { paddingHorizontal: 20, paddingTop: 20 },

	sectionLabel: {
		fontSize: 12,
		fontWeight: "600",
		color: "#75777e",
		textTransform: "uppercase",
		letterSpacing: 0.8,
		marginBottom: 8,
	},
	typeRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
	typeCard: {
		flex: 1,
		padding: 14,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#c5c6cd",
		backgroundColor: "#ffffff",
		gap: 6,
	},
	typeCardActive: {
		borderColor: GOLD,
		backgroundColor: "rgba(233,195,73,0.08)",
	},
	typeLabel: { fontSize: 13, fontWeight: "600", color: "#44474d" },
	typeLabelActive: { color: "#1a1c1c" },
	typeDesc: { fontSize: 11, color: "#75777e", lineHeight: 15 },

	videoPickRow: {
		flexDirection: "row",
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#c5c6cd",
		backgroundColor: "#ffffff",
		overflow: "hidden",
		marginBottom: 4,
	},
	videoPickBtn: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingVertical: 18,
	},
	videoPickDivider: {
		width: StyleSheet.hairlineWidth,
		backgroundColor: "#c5c6cd",
	},
	videoPickLabel: { fontSize: 14, fontWeight: "500", color: "#44474d" },

	videoSelected: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		backgroundColor: "#ffffff",
		borderWidth: 1,
		borderColor: GOLD,
		borderRadius: 12,
		padding: 14,
		marginBottom: 4,
	},
	videoSelectedIcon: {
		width: 48,
		height: 48,
		borderRadius: 10,
		backgroundColor: "rgba(233,195,73,0.12)",
		alignItems: "center",
		justifyContent: "center",
	},
	videoSelectedInfo: { flex: 1 },
	videoSelectedLabel: {
		fontSize: 13,
		fontWeight: "600",
		color: "#1a1c1c",
		marginBottom: 2,
	},
	videoSelectedName: { fontSize: 11, color: "#75777e" },

	captionInput: {
		backgroundColor: "#ffffff",
		borderWidth: 1,
		borderColor: "#c5c6cd",
		borderRadius: 12,
		padding: 14,
		fontSize: 15,
		color: "#1a1c1c",
		minHeight: 90,
		lineHeight: 22,
		marginBottom: 4,
	},
	charCount: {
		fontSize: 11,
		color: "#c5c6cd",
		textAlign: "right",
		marginBottom: 16,
	},

	submitBtn: {
		height: 52,
		backgroundColor: GOLD,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	submitBtnDisabled: { backgroundColor: "rgba(233,195,73,0.35)" },
	submitLabel: { fontSize: 15, fontWeight: "700", color: "#1a1400" },
	submitLabelDisabled: { color: "rgba(26,20,0,0.4)" },

	successWrap: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: 12,
	},
	successIcon: {
		width: 72,
		height: 72,
		borderRadius: 36,
		backgroundColor: "rgba(233,195,73,0.15)",
		alignItems: "center",
		justifyContent: "center",
	},
	successTitle: { fontSize: 22, fontWeight: "700", color: "#1a1c1c" },
	successSub: { fontSize: 14, color: "#75777e" },
});
