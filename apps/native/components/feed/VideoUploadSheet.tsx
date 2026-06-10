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
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { supabase, useSession } from "@/lib/auth-client";
import { useCreatePost } from "@/lib/community/use-community-posts";

const GOLD = "#e9c349";

type SelectedVideo = { uri: string; mimeType: string; name: string };

type Props = {
	visible: boolean;
	onClose: () => void;
	onPosted: () => void;
};

export function VideoUploadSheet({ visible, onClose, onPosted }: Props) {
	const insets = useSafeAreaInsets();
	const { create, submitting } = useCreatePost();
	const { data: session } = useSession();

	const [caption, setCaption] = useState("");
	const [posted, setPosted] = useState(false);
	const [selectedVideo, setSelectedVideo] = useState<SelectedVideo | null>(
		null,
	);
	const [uploading, setUploading] = useState(false);

	function reset() {
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
			const ext = asset.mimeType === "video/quicktime" ? "mov" : "mp4";
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
			const ext = asset.mimeType === "video/quicktime" ? "mov" : "mp4";
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
		if (!selectedVideo) return;
		setUploading(true);
		const videoUrl = await uploadVideo(selectedVideo);
		setUploading(false);
		if (!videoUrl) return;

		const id = await create({
			post_type: "mission_progress",
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
	const canSubmit = !!selectedVideo && !busy;

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={handleClose}
		>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={s.root}
			>
				<View style={s.handle} />

				<View style={s.header}>
					<Text style={s.headerTitle}>Share a video</Text>
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
					<View style={s.successWrap}>
						<View style={s.successIcon}>
							<Ionicons name="checkmark" size={36} color={GOLD} />
						</View>
						<Text style={s.successTitle}>Posted!</Text>
						<Text style={s.successSub}>Your video is now in the feed.</Text>
					</View>
				) : (
					<View style={[s.body, { paddingBottom: insets.bottom + 24 }]}>
						{/* Video picker */}
						{selectedVideo ? (
							<View style={s.videoSelected}>
								<View style={s.videoSelectedIcon}>
									<Ionicons name="videocam" size={28} color={GOLD} />
								</View>
								<View style={s.videoSelectedInfo}>
									<Text style={s.videoSelectedLabel}>Video ready</Text>
									<Text style={s.videoSelectedName} numberOfLines={1}>
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
							<View style={s.videoPickRow}>
								<Pressable
									onPress={() => void filmVideo()}
									style={({ pressed }) => [
										s.videoPickBtn,
										pressed && { opacity: 0.8 },
									]}
									accessibilityRole="button"
								>
									<Ionicons name="videocam-outline" size={24} color="#44474d" />
									<Text style={s.videoPickLabel}>Film video</Text>
								</Pressable>
								<View style={s.videoPickDivider} />
								<Pressable
									onPress={() => void pickFromLibrary()}
									style={({ pressed }) => [
										s.videoPickBtn,
										pressed && { opacity: 0.8 },
									]}
									accessibilityRole="button"
								>
									<Ionicons name="images-outline" size={24} color="#44474d" />
									<Text style={s.videoPickLabel}>Choose from library</Text>
								</Pressable>
							</View>
						)}

						{/* Caption */}
						<Text style={s.sectionLabel}>Caption (optional)</Text>
						<TextInput
							value={caption}
							onChangeText={setCaption}
							placeholder="Tell people what's in your video…"
							placeholderTextColor="#c5c6cd"
							multiline
							maxLength={280}
							style={s.captionInput}
							textAlignVertical="top"
						/>
						<Text style={s.charCount}>{caption.length}/280</Text>

						{/* Submit */}
						<Pressable
							onPress={() => void handleSubmit()}
							disabled={!canSubmit}
							style={({ pressed }) => [
								s.submitBtn,
								!canSubmit && s.submitBtnDisabled,
								pressed && canSubmit && { opacity: 0.9 },
							]}
							accessibilityRole="button"
						>
							{busy ? (
								<ActivityIndicator color="#000" size="small" />
							) : (
								<Text
									style={[s.submitLabel, !canSubmit && s.submitLabelDisabled]}
								>
									{uploading ? "Uploading…" : submitting ? "Posting…" : "Post"}
								</Text>
							)}
						</Pressable>
					</View>
				)}
			</KeyboardAvoidingView>
		</Modal>
	);
}

const s = StyleSheet.create({
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
	body: { flex: 1, paddingHorizontal: 20, paddingTop: 24, gap: 12 },

	sectionLabel: {
		fontSize: 12,
		fontWeight: "600",
		color: "#75777e",
		textTransform: "uppercase",
		letterSpacing: 0.8,
		marginTop: 4,
	},

	videoPickRow: {
		flexDirection: "row",
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#c5c6cd",
		backgroundColor: "#ffffff",
		overflow: "hidden",
	},
	videoPickBtn: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingVertical: 20,
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
		minHeight: 80,
		lineHeight: 22,
	},
	charCount: { fontSize: 11, color: "#c5c6cd", textAlign: "right" },

	submitBtn: {
		height: 52,
		backgroundColor: GOLD,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		marginTop: 8,
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
