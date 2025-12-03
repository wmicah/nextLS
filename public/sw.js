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
  console.log("📦 Service worker installing...");
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("Opened cache");
      // Don't fail installation if some resources can't be cached
      return cache.addAll(urlsToCache).catch(err => {
        console.warn("Some resources failed to cache:", err);
        // Return empty array to continue installation
        return [];
      });
    })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", event => {
  console.log("✅ Service worker activating...");
  // Take control of all pages immediately
  event.waitUntil(
    self.clients.claim().then(() => {
      console.log("✅ Service worker activated and controlling clients");
      // Clean up old caches
      return caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      });
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
  console.log("📱 Notification click received:", event);
  console.log("📱 Notification data:", event.notification.data);

  event.notification.close();

  // Get notification data to determine where to navigate
  const data = event.notification.data || {};
  let url = "/";

  // Determine navigation based on notification type
  // Use the URL from data if provided (most reliable)
  if (data.url) {
    url = data.url.startsWith("/") ? data.url : `/${data.url}`;
  } else {
    // Fallback routing based on type (matching notification-routing.ts logic)
    switch (data.type) {
      case "message":
      case "MESSAGE":
        // Use the URL from data if provided (most reliable - includes role-based routing)
        if (data.url) {
          url = data.url.startsWith("/") ? data.url : `/${data.url}`;
        } else if (data.conversationId) {
          // Fallback: try coach route first, but this should rarely be used
          // since we now send the correct URL in the push notification
          url = `/messages?conversation=${data.conversationId}`;
        } else if (data.messageId) {
          url = `/messages?message=${data.messageId}`;
        } else {
          url = "/messages";
        }
        break;
      
      case "lesson_scheduled":
      case "LESSON_SCHEDULED":
      case "lesson_cancelled":
      case "LESSON_CANCELLED":
      case "lesson_restored":
      case "LESSON_RESTORED":
      case "schedule_request":
      case "SCHEDULE_REQUEST":
        if (data.eventId) {
          url = `/schedule?event=${data.eventId}`;
        } else {
          url = "/schedule";
        }
        break;
      
      case "lesson":
      case "lesson_reminder":
        if (data.eventId) {
          url = `/schedule?event=${data.eventId}`;
        } else {
          url = "/schedule";
        }
        break;
      
      case "client_join_request":
      case "CLIENT_JOIN_REQUEST":
      case "client_join":
        if (data.clientId) {
          url = `/clients?client=${data.clientId}`;
        } else if (data.clientUserId) {
          url = `/clients?user=${data.clientUserId}`;
        } else {
          url = "/clients";
        }
        break;
      
      case "client":
        if (data.clientId) {
          url = `/clients/${data.clientId}`;
        } else {
          url = "/clients";
        }
        break;
      
      case "workout_assigned":
      case "WORKOUT_ASSIGNED":
      case "program_assigned":
      case "PROGRAM_ASSIGNED":
      case "workout_completed":
      case "WORKOUT_COMPLETED":
        if (data.programId) {
          url = `/programs?program=${data.programId}`;
        } else if (data.drillId) {
          url = `/programs?drill=${data.drillId}`;
        } else {
          url = "/programs";
        }
        break;
      
      case "progress_update":
      case "PROGRESS_UPDATE":
        if (data.programId) {
          url = `/programs?program=${data.programId}&tab=progress`;
        } else {
          url = "/programs";
        }
        break;
      
      case "program":
      case "program_assignment":
      case "routine_assignment":
      case "video_assignment":
      case "daily_workout_reminder":
        url = "/dashboard";
        break;
      
      case "video_submission":
      case "VIDEO_SUBMISSION":
        if (data.videoSubmissionId) {
          url = `/videos?submission=${data.videoSubmissionId}`;
        } else {
          url = "/videos";
        }
        break;
      
      case "time_swap_request":
      case "TIME_SWAP_REQUEST":
      case "swap_request":
      case "swap_approval":
        if (data.swapRequestId) {
          url = `/time-swap?request=${data.swapRequestId}`;
        } else {
          url = "/time-swap";
        }
        break;
      
      default:
        url = "/dashboard";
    }
  }

  console.log("📱 Navigating to:", url);

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then(async clientList => {
        // Get the origin to construct absolute URLs
        // Try to get origin from existing client, or use registration scope
        let origin = "";
        if (clientList.length > 0) {
          try {
            const clientUrl = new URL(clientList[0].url);
            origin = clientUrl.origin;
          } catch (e) {
            console.warn("⚠️ Could not parse client URL:", e);
          }
        }
        
        // Fallback: try to get from registration scope or self.location
        if (!origin) {
          try {
            origin = self.location.origin;
          } catch (e) {
            // If self.location is not available, try registration scope
            const registration = await self.registration;
            if (registration && registration.scope) {
              const scopeUrl = new URL(registration.scope);
              origin = scopeUrl.origin;
            }
          }
        }
        
        // If still no origin, use a relative URL (will work if app is already open)
        const absoluteUrl = url.startsWith("http") 
          ? url 
          : origin 
            ? `${origin}${url}` 
            : url;
        
        console.log("📱 Origin:", origin);
        console.log("📱 Absolute URL:", absoluteUrl);
        console.log("📱 Found clients:", clientList.length);

        // Check if there's already a window/tab open with matching path
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          try {
            const clientUrl = new URL(client.url);
            const targetUrl = new URL(absoluteUrl);
            
            // Compare paths and query strings (ignore hash and protocol)
            const clientPath = clientUrl.pathname + clientUrl.search;
            const targetPath = targetUrl.pathname + targetUrl.search;
            
            if (clientPath === targetPath && "focus" in client) {
              console.log("📱 Focusing existing window:", client.url);
              await client.focus();
              // Also navigate to ensure we're on the right page
              if ("navigate" in client && typeof client.navigate === "function") {
                await client.navigate(absoluteUrl);
              }
              return;
            }
          } catch (urlError) {
            console.warn("⚠️ Error parsing client URL:", urlError);
          }
        }
        
        // If we have any open window, focus it and navigate
        if (clientList.length > 0) {
          const client = clientList[0];
          console.log("📱 Focusing and navigating existing window to:", absoluteUrl);
          try {
            // Focus the window first
            if ("focus" in client) {
              await client.focus();
            }
            
            // Post message to navigate (the app will handle this)
            client.postMessage({
              type: "NAVIGATE",
              url: absoluteUrl,
            });
            
            // Also try direct navigation if supported
            if ("navigate" in client && typeof client.navigate === "function") {
              await client.navigate(absoluteUrl);
            }
            return;
          } catch (navError) {
            console.warn("⚠️ Error navigating existing window:", navError);
          }
        }
        
        // If no existing window, try to open a new one
        console.log("📱 Opening new window:", absoluteUrl);
        try {
          if (clients.openWindow) {
            const newWindow = await clients.openWindow(absoluteUrl);
            if (newWindow) {
              console.log("✅ Opened new window");
              return;
            } else {
              // openWindow returned null - might need user gesture
              console.warn("⚠️ openWindow returned null - may need user gesture");
              // Fallback: try to focus any existing window and navigate
              if (clientList.length > 0 && "focus" in clientList[0]) {
                await clientList[0].focus();
                clientList[0].postMessage({
                  type: "NAVIGATE",
                  url: absoluteUrl,
                });
              }
            }
          }
        } catch (openError) {
          console.error("❌ Error opening window:", openError);
          // Last resort: try to focus any existing window and navigate
          if (clientList.length > 0 && "focus" in clientList[0]) {
            await clientList[0].focus();
            clientList[0].postMessage({
              type: "NAVIGATE",
              url: absoluteUrl,
            });
          }
        }
      })
      .catch(error => {
        console.error("❌ Error handling notification click:", error);
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
