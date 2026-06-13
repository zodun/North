// Self-destructing service worker.
//
// An earlier production build registered a Serwist service worker that is still
// alive in some browsers. In development the app ships no SW, but the stale one
// keeps intercepting requests — failing Next.js RSC navigation fetches and
// serving stale bundles (so code changes and images don't show up).
//
// When the browser checks this script for an update it gets THIS file: it takes
// over immediately, deletes all caches, unregisters itself, and reloads open
// tabs so they fetch fresh from the network. After that, no SW controls the app
// in dev. (A future production build will regenerate a real sw.js via Serwist.)

self.addEventListener("install", () => {
	self.skipWaiting();
});

self.addEventListener("message", (event) => {
	if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		(async () => {
			try {
				const keys = await caches.keys();
				await Promise.all(keys.map((k) => caches.delete(k)));
			} catch {}
			try {
				await self.registration.unregister();
			} catch {}
			const clients = await self.clients.matchAll({ type: "window" });
			for (const client of clients) {
				try {
					client.navigate(client.url);
				} catch {}
			}
		})(),
	);
});

// Do not intercept any requests — let the network handle everything.
self.addEventListener("fetch", () => {});
