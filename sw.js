const CACHE_NAME = 'cardio-run-v1';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core',
    'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter',
    'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl',
    'https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection',
    'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js'
];

// Install Event: Cache core files
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

// Fetch Event: Serve from Cache first, then Network
self.addEventListener('fetch', (e) => {
    // Special handling for TensorFlow Models (cache them dynamically)
    if (e.request.url.includes('tfhub') || e.request.url.includes('model.json') || e.request.url.includes('bin')) {
        e.respondWith(
            caches.open('tf-models').then(cache => {
                return cache.match(e.request).then(response => {
                    return response || fetch(e.request).then(networkResponse => {
                        cache.put(e.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
    } else {
        // Standard Strategy for app files
        e.respondWith(
            caches.match(e.request).then((response) => response || fetch(e.request))
        );
    }
});