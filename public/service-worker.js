const CACHE_NAME = "chat-app-cache-v1";

// Base files that won't have hashed names
const BASE_URLS_TO_CACHE = [
  "/",
  "/index.html",
  "/favicon.ico",
  "/chatapp.png",
  "/manifest.webmanifest"
];

// Install Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    // First, cache the base files we know won't change names
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Caching base files...");
        return cache.addAll(BASE_URLS_TO_CACHE);
      })
      .then(() => {
        // Then, fetch the asset-manifest.json to get current hashed filenames
        return fetch("/asset-manifest.json")
          .then(response => response.json())
          .then(assets => {
            const filesToCache = [];
            
            // Extract JS and CSS files from the manifest
            if (assets.files) {
              Object.values(assets.files).forEach(file => {
                if (file.endsWith('.js') || file.endsWith('.css')) {
                  filesToCache.push(file);
                }
              });
              
              // Cache these dynamically discovered files
              return caches.open(CACHE_NAME)
                .then(cache => cache.addAll(filesToCache));
            }
          });
      })
  );
  
  self.skipWaiting();
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
  // Claim any clients that match the worker's scope
  return self.clients.claim();
});

// Modified fetch handler to be more resilient with file changes
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle API requests differently (don't cache Firebase API requests)
  if (event.request.url.includes('firebaseio.com') || 
      event.request.url.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request)
        .then(response => {
          // Don't cache responses that aren't successful
          if (!response || response.status !== 200) {
            return response;
          }

          // Cache all successful responses from /static directory (handles new hashed files)
          if (event.request.url.includes('/static/')) {
            let responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }

          return response;
        })
        .catch(() => {
          // Return index.html for navigation requests when offline
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
    })
  );
});

// Handle message events (for communicating with the main thread)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
