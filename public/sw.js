const CACHE_NAME = "next-level-softball-v1";
const urlsToCache = [
  "/",
  "/dashboard",
  "/clients",
  "/programs",
  "/schedule",
  "/library",
  "/analytics",
  "/videos",
  "/static/js/bundle.js",
  "/static/css/main.css",
];

// Install event - cache resources
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Return cached version or fetch from network
      return response || fetch(event.request);
    })
  );
});

// Push event - handle push notifications
self.addEventListener("push", event => {
  console.log("Push received:", event);

  const options = {
    body: event.data
      ? event.data.text()
      : "New notification from Next Level Softball",
    icon: "/icon-192x192.png",
    badge: "/icon-32x32.png",
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "View Details",
        icon: "/icon-32x32.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icon-32x32.png",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification("Next Level Softball", options)
  );
});

// Notification click event
self.addEventListener("notificationclick", event => {
  console.log("Notification click received:", event);

  event.notification.close();

  if (event.action === "explore") {
    // Open the app to the relevant page
    event.waitUntil(clients.openWindow("/dashboard"));
  } else if (event.action === "close") {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(clients.openWindow("/"));
  }
});

// Background sync for offline actions
self.addEventListener("sync", event => {
  if (event.tag === "background-sync") {
    event.waitUntil(
      // Sync offline data when connection is restored
      syncOfflineData()
    );
  }
});

async function syncOfflineData() {
  // Sync any offline actions when connection is restored
  console.log("Syncing offline data...");
}
