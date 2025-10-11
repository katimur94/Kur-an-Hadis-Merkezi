// service-worker.js

const CACHE_NAME = 'dijital-medrese-cache-v1';

// All assets that are part of the app shell and are needed for the app to work offline.
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-512x512-maskable.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Amiri+Quran&family=Noto+Naskh+Arabic:wght@400;700&family=Lateef&family=Scheherazade+New:wght@400;700&family=Reem+Kufi:wght@400;700&family=Markazi+Text:wght@400;700&family=Cairo:wght@400;700&family=Almarai:wght@400;700&family=Tajawal:wght@400;700&family=Katibeh&family=Inter:wght@400;500;600;700&family=Rakkas&display=swap'
];


self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(APP_SHELL_URLS);
      })
      .catch(err => {
        console.error("Failed to cache app shell:", err);
      })
  );
});

self.addEventListener('activate', (event) => {
  // This event is fired when the service worker is activated.
  // We can use it to clean up old caches.
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const isApiRequest = event.request.url.startsWith('https://api.alquran.cloud/') ||
                       event.request.url.startsWith('https://api.aladhan.com/') ||
                       event.request.url.startsWith('https://nominatim.openstreetmap.org/');

  // For API requests, use a network-first strategy.
  if (isApiRequest) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return fetch(event.request)
          .then((response) => {
            // If the fetch is successful, clone the response and store it in the cache.
            if (response && response.status === 200) {
              cache.put(event.request.url, response.clone());
            }
            return response;
          })
          .catch(() => {
            // If the fetch fails (e.g., offline), try to match the request in the cache.
            return cache.match(event.request.url);
          });
      })
    );
    return;
  }
  
  // For all other requests (app shell, fonts, etc.), use a cache-first strategy.
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If we have a response in the cache, return it.
        // Otherwise, fetch it from the network and cache it for next time.
        return response || fetch(event.request).then(networkResponse => {
            return caches.open(CACHE_NAME).then(cache => {
                // Check if we got a valid response before caching
                if (networkResponse && networkResponse.status === 200) {
                    cache.put(event.request, networkResponse.clone());
                }
                return networkResponse;
            });
        });
      })
  );
});
