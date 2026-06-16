"use client";

import { useEffect } from "react";

// In development the app ships no service worker (see next.config.ts, Serwist
// is production-only). But a SW registered by an earlier production build (or an
// installed PWA) keeps running in the browser and serves stale cached bundles,
// which makes code changes "not show up". This unregisters any lingering SW and
// clears its caches on load. Crucially, if it actually evicted something, it
// reloads ONCE (guarded by sessionStorage) so the page comes back on fresh
// assets without the user having to hard-refresh. No-op in production.
const RELOAD_FLAG = "north_sw_evicted";

export function DevSwCleanup() {
	useEffect(() => {
		if (process.env.NODE_ENV !== "development") return;
		if (typeof window === "undefined") return;

		(async () => {
			let evicted = false;

			if ("serviceWorker" in navigator) {
				const regs = await navigator.serviceWorker
					.getRegistrations()
					.catch(() => [] as readonly ServiceWorkerRegistration[]);
				if (regs.length > 0) {
					evicted = true;
					await Promise.all(regs.map((r) => r.unregister())).catch(() => {});
				}
			}

			if (typeof caches !== "undefined") {
				const keys = await caches.keys().catch(() => [] as string[]);
				if (keys.length > 0) {
					evicted = true;
					await Promise.all(keys.map((k) => caches.delete(k))).catch(() => {});
				}
			}

			// We just removed a stale install. One reload swaps the cached bundle
			// for the live dev assets; the flag prevents a reload loop.
			if (evicted && !sessionStorage.getItem(RELOAD_FLAG)) {
				sessionStorage.setItem(RELOAD_FLAG, "1");
				window.location.reload();
			}
		})();
	}, []);
	return null;
}
