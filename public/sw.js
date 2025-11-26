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
  console.log("📬 Push event received:", event);
  console.log("📬 Push event data:", event.data ? "Has data" : "No data");

  let notificationData = {
    title: "Next Level Coaching",
    body: "You have a new notification",
    icon: "/icon-192x192.png",
    badge: "/icon-32x32.png",
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    tag: "default",
    requireInteraction: false,
  };

  // Parse notification payload if available
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log("📬 Parsed payload:", payload);
      notificationData = {
        ...notificationData,
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        data: {
          ...notificationData.data,
          ...payload.data,
        },
        tag: payload.tag || notificationData.tag,
        requireInteraction: payload.requireInteraction || false,
      };
    } catch (e) {
      console.error("❌ Error parsing push payload:", e);
      // If JSON parsing fails, try as text
      try {
        notificationData.body = event.data.text() || notificationData.body;
      } catch (textError) {
        console.error("❌ Error reading push data as text:", textError);
      }
    }
  }

  console.log("📬 Showing notification:", notificationData.title, notificationData.body);

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
      .then(() => {
        console.log("✅ Notification shown successfully");
      })
      .catch(error => {
        console.error("❌ Error showing notification:", error);
      })
  );
});

// Notification click event
self.addEventListener("notificationclick", event => {
  console.log("Notification click received:", event);

  event.notification.close();

  // Get notification data to determine where to navigate
  const data = event.notification.data || {};
  let url = "/";

  // Determine navigation based on notification type
  if (data.type === "message" && data.conversationId) {
    url = `/messages?conversationId=${data.conversationId}`;
  } else if (data.type === "lesson" && data.lessonId) {
    url = `/schedule`;
  } else if (data.type === "client" && data.clientId) {
    url = `/clients/${data.clientId}`;
  } else if (data.type === "program" && data.programId) {
    url = `/programs/${data.programId}`;
  } else if (data.url) {
    url = data.url;
  } else {
    // Default to dashboard
    url = "/dashboard";
  }

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then(clientList => {
        // Check if there's already a window/tab open with the target URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }
        // If no existing window, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
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
