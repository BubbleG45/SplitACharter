/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

// Create a unique cache name for this deployment
const CACHE_NAME = `cache-${version}`;

const ASSETS = [
	...build, // the app itself
	...files  // everything in `static`
];

self.addEventListener('install', (event: any) => {
	// Create a new cache and add all files to it
	async function addFilesToCache() {
		const cache = await caches.open(CACHE_NAME);
		await cache.addAll(ASSETS);
	}

	event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event: any) => {
	// Remove previous caches
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE_NAME) await caches.delete(key);
		}
	}

	event.waitUntil(deleteOldCaches());
});

self.addEventListener('fetch', (event: any) => {
	// ignore POST requests etc
	if (event.request.method !== 'GET') return;

	async function respond() {
		const url = new URL(event.request.url);
		const cache = await caches.open(CACHE_NAME);

		// serve build/files assets from cache
		if (ASSETS.includes(url.pathname)) {
			const cachedResponse = await cache.match(event.request);
			if (cachedResponse) return cachedResponse;
		}

		// try network first for HTML pages and dynamic routes, fallback to cache
		try {
			const response = await fetch(event.request);

			// if we're offline, fetch will fail
			if (response.status === 200) {
				cache.put(event.request, response.clone());
			}

			return response;
		} catch {
			const cachedResponse = await cache.match(event.request);
			if (cachedResponse) return cachedResponse;

			// Fallback to offline page or cached root if offline
			return (await cache.match('/')) || new Response('Offline', { status: 503 });
		}
	}

	event.respondWith(respond());
});
