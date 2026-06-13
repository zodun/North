"use client";

import { useEffect } from "react";

// In development the app ships no service worker (see next.config.ts — Serwist
// is production-only). But a SW registered by an earlier production build keeps
// running in the browser and serves stale cached bundles, which makes code
// changes "not show up". This unregisters any lingering SW and clears its
// caches on load, so dev always reflects the latest build. No-op in production.
export function DevSwCleanup() {
	useEffect(() => {
		if (process.env.NODE_ENV !== "development") return;
		if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
			navigator.serviceWorker
				.getRegistrations()
				.then((regs) => {
					for (const r of regs) void r.unregister();
				})
				.catch(() => {});
		}
		if (typeof caches !== "undefined") {
			caches
				.keys()
				.then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
				.catch(() => {});
		}
	}, []);
	return null;
}
