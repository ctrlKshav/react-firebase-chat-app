// service-worker.js
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

// Set debug to false in production
workbox.setConfig({ debug: true });

// Custom precaching list for critical resources
workbox.precaching.precacheAndRoute([
  { url: '/', revision: null },
  { url: '/index.html', revision: null },
  { url: '/manifest.json', revision: null },
  { url: '/favicon.ico', revision: null },
  { url: '/chatapp.png', revision: null }
]);

// Special handling for manifest.json
workbox.routing.registerRoute(
  ({ url }) => url.pathname.endsWith('manifest.json'),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'manifest-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 1, // Only cache one version of the manifest
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200], // Cache successful responses and opaque responses
      })
    ]
  })
);

// Cache JS and CSS files with a Cache First strategy
workbox.routing.registerRoute(
  ({ request }) => 
    request.destination === 'script' || 
    request.destination === 'style',
  new workbox.strategies.CacheFirst({
    cacheName: 'static-resources',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Cache images with a Cache First strategy
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Use Network First for API calls
workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

// Default strategy for everything else - Stale While Revalidate
workbox.routing.setDefaultHandler(
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'default-cache',
  })
);

// Offline fallback
workbox.routing.setCatchHandler(({ event }) => {
  // Return the precached offline page if a document is being requested
  if (event.request.destination === 'document') {
    return workbox.precaching.matchPrecache('/index.html');
  }
  
  return Response.error();
});

// Skip waiting and clients claim to update service worker faster
self.skipWaiting();
workbox.core.clientsClaim();

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('Workbox Service Worker loaded!');