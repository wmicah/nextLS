// Disabled Service Worker - No caching at all
console.log("Service Worker disabled - no caching");

// Just claim clients but don't intercept any requests
self.addEventListener("activate", event => {
  console.log("Service Worker activated (disabled mode)");
  event.waitUntil(self.clients.claim());
});

// Don't intercept any fetch requests - let everything go through normally
self.addEventListener("fetch", event => {
  // Do absolutely nothing - let all requests go through without any service worker interference
  return;
});
