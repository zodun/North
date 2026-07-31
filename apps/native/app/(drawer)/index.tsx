// The drawer's index is a pass-through — the app's real home is the
// tab loop. Kept only so "/" and "/(drawer)" resolve; hidden from the
// drawer menu. Sign-out lives on Profile; push-token registration
// happens in the tabs layout.

import { Redirect } from "expo-router";

export default function DrawerIndex() {
	return <Redirect href="/(drawer)/(tabs)/for-you" />;
}
