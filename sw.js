const CACHE_NAME = 'birds-map-cache-v2'; // Increment this version when you update files
const urlsToCache = [
    '/',
    '/index.html',
    '/leaflet.css',
    '/leaflet.js',
    '/data.csv',
];

// Install the service worker and cache initial resources
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

// Activate the service worker and clean up old caches
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch resources with different strategies
self.addEventListener('fetch', event => {
    if (event.request.url.includes('/index.html')) {
        // Network-first strategy for HTML files
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Update the cache with the new response
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, response.clone());
                        return response;
                    });
                })
                .catch(() => {
                    // If network fails, fall back to the cache
                    return caches.match(event.request);
                })
        );
    } else {
        // Stale-while-revalidate strategy for other requests
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                    });
                    return networkResponse;
                });
                return cachedResponse || fetchPromise;
            })
        );
    }
});
