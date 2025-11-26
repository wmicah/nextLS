// Polyfills for browser environment
// Fixes "global is not defined" errors in Next.js

if (typeof window !== "undefined") {
  // Polyfill global for browser environment
  // Some libraries expect Node.js 'global' but we're in browser
  if (typeof global === "undefined") {
    (window as any).global = window;
  }
  
  // Also set it on globalThis for broader compatibility
  if (typeof globalThis !== "undefined" && typeof (globalThis as any).global === "undefined") {
    (globalThis as any).global = globalThis;
  }
}

