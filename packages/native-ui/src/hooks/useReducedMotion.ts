// useReducedMotion hook (DEC-25). Wraps AccessibilityInfo's
// `isReduceMotionEnabled()` + the `reduceMotionChanged` subscription
// so any component can branch on the user's OS preference.
//
// Components that ship animated transitions should read this value
// and skip / shorten their animations when true.

import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

export function useReducedMotion(): boolean {
	const [reduced, setReduced] = useState(false);

	useEffect(() => {
		let cancelled = false;
		AccessibilityInfo.isReduceMotionEnabled().then((value) => {
			if (!cancelled) setReduced(value);
		});
		const sub = AccessibilityInfo.addEventListener(
			"reduceMotionChanged",
			setReduced,
		);
		return () => {
			cancelled = true;
			sub.remove();
		};
	}, []);

	return reduced;
}
