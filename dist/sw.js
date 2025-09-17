// Service Worker for better mobile caching and session persistence
const CACHE_NAME = 'freegym-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Handle background sync for better mobile experience
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Sync user data in background
      syncUserData()
    );
  }
});

async function syncUserData() {
  try {
    // Sync user data with server
    const response = await fetch('/api/sync-user-data');
    if (response.ok) {
      console.log('User data synced successfully');
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

