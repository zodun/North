import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
	CacheFirst,
	NetworkFirst,
	Serwist,
	StaleWhileRevalidate,
} from "serwist";

declare global {
	interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
		__SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
	}
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
	precacheEntries: self.__SW_MANIFEST,
	skipWaiting: true,
	clientsClaim: true,
	navigationPreload: true,
	runtimeCaching: [
		{
			matcher: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
			handler: new CacheFirst({
				cacheName: "google-fonts",
				plugins: [
					{
						cacheWillUpdate: async ({ response }) =>
							response?.status === 200 ? response : null,
					},
				],
			}),
		},
		{
			matcher: /^https:\/\/res\.cloudinary\.com\/.*/i,
			handler: new StaleWhileRevalidate({
				cacheName: "cloudinary-media",
				plugins: [
					{
						cacheWillUpdate: async ({ response }) =>
							response?.status === 200 ? response : null,
					},
				],
			}),
		},
		{
			matcher: ({ request }) => request.destination === "document",
			handler: new NetworkFirst({
				cacheName: "pages",
				plugins: [
					{
						cacheWillUpdate: async ({ response }) =>
							response?.status === 200 ? response : null,
					},
				],
			}),
		},
		{
			matcher: ({ request }) =>
				request.destination === "style" ||
				request.destination === "script" ||
				request.destination === "worker",
			handler: new StaleWhileRevalidate({
				cacheName: "static-assets",
			}),
		},
		{
			matcher: ({ request }) => request.destination === "image",
			handler: new CacheFirst({
				cacheName: "images",
				plugins: [
					{
						cacheWillUpdate: async ({ response }) =>
							response?.status === 200 ? response : null,
					},
				],
			}),
		},
	],
});

serwist.addEventListeners();
