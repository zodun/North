"use client";

import { useEffect } from "react";

// Auto-loads new deploys so users stop seeing stale UI ("I don't see my change,
// clear the cache"). The service worker is skipWaiting + clientsClaim (see
// app/sw.ts), so a freshly deployed worker activates and takes control of open
// pages, firing `controllerchange`. We reload once when that happens so the page
// swaps onto the new JS/CSS. We also poll registration.update() on load, on tab
// focus, and periodically, so a long-open tab or installed PWA notices a deploy
// without any manual refresh. No-op in development (no SW is shipped there).
export function SwAutoUpdate() {
	useEffect(() => {
		if (process.env.NODE_ENV !== "production") return;
		if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
			return;
		}
		const sw = navigator.serviceWorker;

		// Reload when a NEW worker takes control. On a first-ever visit there is no
		// prior controller and the initial clientsClaim also fires controllerchange;
		// that first event just marks us as controlled (no reload). Every change
		// after that is a real deploy, so we reload once.
		let refreshing = false;
		let controlled = Boolean(sw.controller);
		const onControllerChange = () => {
			if (refreshing) return;
			if (!controlled) {
				controlled = true;
				return;
			}
			refreshing = true;
			window.location.reload();
		};
		sw.addEventListener("controllerchange", onControllerChange);

		// Nudge the browser to check for a new worker now, when the tab regains
		// focus, and every couple of minutes, so an open session self-updates.
		let cancelled = false;
		const check = async () => {
			try {
				const reg = await sw.getRegistration();
				if (!cancelled) await reg?.update();
			} catch {
				/* offline or not registered yet; ignore */
			}
		};
		void check();
		const onVisible = () => {
			if (document.visibilityState === "visible") void check();
		};
		document.addEventListener("visibilitychange", onVisible);
		const interval = window.setInterval(() => void check(), 120_000);

		return () => {
			cancelled = true;
			sw.removeEventListener("controllerchange", onControllerChange);
			document.removeEventListener("visibilitychange", onVisible);
			window.clearInterval(interval);
		};
	}, []);
	return null;
}
