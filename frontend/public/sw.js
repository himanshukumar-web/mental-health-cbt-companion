// Sera PWA Service Worker
// Network-first for API, Cache-first for static assets

const CACHE_NAME = "sera-pwa-v1";
const OFFLINE_URL = "/offline.html";

// Static assets to pre-cache on install
const PRECACHE_ASSETS = [
  "/",
  "/offline.html",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

// Install: pre-cache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: Network-first for navigations & API, Cache-first for static
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET and WebSocket requests
  if (request.method !== "GET") return;
  if (request.url.includes("/ws/")) return;

  // Navigation requests (HTML pages) — Network first, fallback to offline page
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the latest page
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // API requests — Network only (no caching)
  if (request.url.includes("/api/") || request.url.includes(":8000")) {
    event.respondWith(fetch(request));
    return;
  }

  // Static assets (JS, CSS, images, fonts) — Cache first, then network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Return cached, but also update cache in background (stale-while-revalidate)
        fetch(request).then((response) => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
