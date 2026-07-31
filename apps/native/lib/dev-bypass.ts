// Dev-only auth bypass (requested for design review) — lets the welcome
// screen open the app shell without a session so the tabs can be seen.
// Guarded by __DEV__ at every call site; in a release build the flag can
// never be set and the routing gate ignores it.

import { useSyncExternalStore } from "react";

let bypassed = false;
const subscribers = new Set<() => void>();

export function setAuthBypass(value: boolean) {
	if (!__DEV__) return;
	bypassed = value;
	for (const notify of subscribers) notify();
}

export function useAuthBypass(): boolean {
	return useSyncExternalStore(
		(cb) => {
			subscribers.add(cb);
			return () => subscribers.delete(cb);
		},
		() => __DEV__ && bypassed,
		() => false,
	);
}
