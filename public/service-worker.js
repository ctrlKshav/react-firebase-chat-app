const CACHE_NAME = "chat-app-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/static",
  "/chatapp.png",  // App icon
  "/manifest.webmanifest", // PWA manifest
];


// Install Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching files...");
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate Service Worker (Cleanup Old Caches)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  console.log("[Service Worker] Activated.");
});

// Fetch Request Handling
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).catch(() => {
        // Return index.html for non-cached routes (helps with Firebase hosting issues)
        if (event.request.mode === "navigate") {
          return caches.match("/index.html");
        }
      });
    })
  );
});
