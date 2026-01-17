const CACHE_NAME = 'exar-play-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './public/manifest.json',
    './src/main.js',
    './src/scenes/BootScene.js',
    './src/scenes/PreloadScene.js',
    './src/scenes/MainMenuScene.js',
    './src/scenes/SettingsScene.js',
    './src/scenes/TutorialScene.js',
    './src/scenes/CalibrationScene.js',
    './src/scenes/GameScene.js',
    './src/scenes/GameOverScene.js',
    './src/game/Player.js',
    './src/game/ObstacleManager.js',
    './src/game/PoseDetector.js',
    './src/services/PoseService.js',
    './src/managers/ThemeManager.js'
];

const EXTERNAL_ASSETS = [
    'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js',
    'https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.3/dist/pose-detection.min.js',
    'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching app assets');
                // Cache local assets first
                return cache.addAll(ASSETS_TO_CACHE)
                    .then(() => {
                        // Try to cache external assets (don't fail if they can't be cached)
                        return Promise.allSettled(
                            EXTERNAL_ASSETS.map(url =>
                                fetch(url).then(response => cache.put(url, response))
                            )
                        );
                    });
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip chrome-extension and other non-http requests
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Return offline fallback for HTML requests
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('./index.html');
                        }
                    });
            })
    );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
