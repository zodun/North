// Shared shell for the Community space sheets: a full-screen pageSheet
// with the same handle/header grammar as the PeopleSection modals, so
// every space feels like one system. Detail views inside a sheet swap
// the left slot to a Back affordance instead of stacking modals.

import type { getNorthTokens } from "@north/tokens";
import type { ReactNode } from "react";
import {
	KeyboardAvoidingView,
	Modal,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Tokens = ReturnType<typeof getNorthTokens>;

export function SpaceSheet({
	visible,
	title,
	p,
	t,
	onClose,
	onBack,
	backLabel,
	scroll = true,
	children,
}: {
	visible: boolean;
	title: string;
	p: Tokens["p"];
	t: Tokens["t"];
	onClose: () => void;
	/** When set, a quiet Back affordance replaces nothing — it sits left of the title. */
	onBack?: () => void;
	backLabel?: string;
	/** false for layouts that manage their own scrolling (e.g. message threads). */
	scroll?: boolean;
	children: ReactNode;
}) {
	const insets = useSafeAreaInsets();

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={onBack ?? onClose}
		>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={[s.root, { backgroundColor: p.bg }]}
			>
				<View style={s.handle} />
				<View style={[s.header, { borderBottomColor: p.line }]}>
					<View style={s.headerLeft}>
						{onBack ? (
							<TouchableOpacity
								onPress={onBack}
								hitSlop={12}
								accessibilityRole="button"
								accessibilityLabel={backLabel ?? "Back"}
							>
								<Text style={[s.back, { color: p.inkDim, fontFamily: t.ui }]}>
									‹ {backLabel ?? "Back"}
								</Text>
							</TouchableOpacity>
						) : null}
						<Text
							style={[s.title, { color: p.ink, fontFamily: t.ui }]}
							numberOfLines={1}
						>
							{title}
						</Text>
					</View>
					<TouchableOpacity onPress={onClose} hitSlop={12}>
						<Text style={[s.close, { color: p.inkDim, fontFamily: t.ui }]}>
							Done
						</Text>
					</TouchableOpacity>
				</View>

				{scroll ? (
					<ScrollView
						style={{ flex: 1 }}
						contentContainerStyle={[
							s.body,
							{ paddingBottom: insets.bottom + 32 },
						]}
						keyboardShouldPersistTaps="handled"
						showsVerticalScrollIndicator={false}
					>
						{children}
					</ScrollView>
				) : (
					<View style={{ flex: 1 }}>{children}</View>
				)}
			</KeyboardAvoidingView>
		</Modal>
	);
}

const s = StyleSheet.create({
	root: { flex: 1 },
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
		gap: 12,
	},
	headerLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		flexShrink: 1,
	},
	back: { fontSize: 14 },
	title: { fontSize: 16, fontWeight: "600", flexShrink: 1 },
	close: { fontSize: 14 },
	body: { paddingHorizontal: 20, paddingTop: 20 },
});
