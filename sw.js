// sw.js - service worker script to enable offline support + make app installable

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('game-cache').then((cache) => {
            return cache.addAll(['./index.html', './main.ts', './style.css']);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response)) => {
            return response || fetch(event.request);
        })
    );
});