// Service Worker for enhanced caching and offline functionality
const CACHE_NAME = "nextls-v6";
const STATIC_CACHE = "nextls-static-v6";
const DYNAMIC_CACHE = "nextls-dynamic-v6";

// Files to cache immediately
const STATIC_FILES = [
  "/",
  "/dashboard",
  "/clients",
  "/programs",
  "/schedule",
  "/library",
  "/messages",
  "/settings",
  "/admin",
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  "/api/trpc/",
  "/api/health",
  "/api/thumbnail/",
  "/api/master-video/",
];

// API endpoints that should NOT be cached (always fetch fresh)
const NO_CACHE_PATTERNS = [
  "/api/trpc/",
  "/api/library/",
  "/api/clients/",
  "/api/programs/",
  "/api/schedule/",
  "/api/messages/",
  "/api/notifications/",
  "/api/analytics/",
  "/api/admin/",
];

// Install event - cache static files
self.addEventListener("install", event => {
  console.log("Service Worker installing...");
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(cache => {
        console.log("Caching static files...");
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log("Static files cached successfully");
        return self.skipWaiting();
      })
      .catch(error => {
        console.error("Failed to cache static files:", error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", event => {
  console.log("Service Worker activating...");
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE;
            })
            .map(cacheName => {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log("Service Worker activated - clearing all caches");
        // Force clear all caches to ensure fresh start
        return caches.delete(DYNAMIC_CACHE);
      })
      .then(() => {
        console.log("Service Worker activated");
        return self.clients.claim();
      })
  );
});

// Fetch event - NO CACHING for Vercel
self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }

  // For Vercel: Don't cache anything, let everything go through normally
  console.log(
    "Service Worker: Allowing request to go through without caching:",
    url.pathname
  );
  return;
});

// Handle API requests with cache-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);

  // Check if this API should NOT be cached (always fetch fresh)
  const shouldNotCache = NO_CACHE_PATTERNS.some(pattern =>
    url.pathname.includes(pattern)
  );

  if (shouldNotCache) {
    console.log("Fetching fresh data (no cache):", url.pathname);
    return fetch(request);
  }

  // Check if this API should be cached
  const shouldCache = API_CACHE_PATTERNS.some(pattern =>
    url.pathname.includes(pattern)
  );

  if (!shouldCache) {
    return fetch(request);
  }

  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log("Serving API from cache:", url.pathname);
      return cachedResponse;
    }

    // Fetch from network
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      console.log("Cached API response:", url.pathname);
    }

    return networkResponse;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

// Handle static assets with cache-first strategy
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fetch from network
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error("Static request failed:", error);
    throw error;
  }
}

// Handle page requests with network-first strategy
async function handlePageRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log("Serving page from cache:", request.url);
      return cachedResponse;
    }

    throw error;
  }
}
