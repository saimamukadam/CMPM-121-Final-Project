// sw.js - service worker script to enable offline support + make app installable

const CACHE_NAME = "game-cache-v1";
const urlsToCache = [
    "/CMPM-121-Final-Project/",
    "/CMPM-121-Final-Project/index.html",
    "/CMPM-121-Final-Project/style.css",
    "/CMPM-121-Final-Project/main.js",
    "/CMPM-121-Final-Project/tomato.png",
    "/CMPM-121-Final-Project/pick.png"
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("Opened cache");
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Serve from cache or fetch from network
            return response || fetch(event.request);
        })
    );
});

// activate event - clean up old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log("Deleting old cache: ", cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});