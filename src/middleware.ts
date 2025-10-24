import { NextRequest, NextResponse } from "next/server";
import { captureError } from "@/lib/monitoring";

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100; // 100 requests per minute
const MAX_REQUESTS_PER_WINDOW_STRICT = 20; // 20 requests per minute for sensitive routes

// In-memory rate limiting store (in production, use Redis)
declare global {
  var rateLimitStore:
    | Map<string, { count: number; resetTime: number }>
    | undefined;
}

if (!globalThis.rateLimitStore) {
  globalThis.rateLimitStore = new Map();
}

// Security headers configuration
const securityHeaders = {
  // Basic security headers
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",

  // Advanced security headers
  "X-DNS-Prefetch-Control": "on", // Enable DNS prefetching for better performance
  "X-Download-Options": "noopen",
  "X-Permitted-Cross-Domain-Policies": "none",

  // Performance headers
  "Cache-Control": "public, max-age=31536000, immutable", // 1 year for static assets

  // Content Security Policy
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://www.youtube.com https://s.ytimg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.youtube.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob: https://www.youtube.com https://i.ytimg.com https://s.ytimg.com",
    "media-src 'self' https: blob: https://www.youtube.com",
    "connect-src 'self' https: wss: https://www.youtube.com",
    "frame-src 'self' https://www.google.com https://www.youtube.com https://www.youtube-nocookie.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; "),

  // HSTS (HTTP Strict Transport Security)
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",

  // Cross-Origin Resource Policy - More permissive for YouTube
  "Cross-Origin-Resource-Policy": "cross-origin",

  // Cross-Origin Opener Policy - More permissive for YouTube
  "Cross-Origin-Opener-Policy": "unsafe-none",

  // Cross-Origin Embedder Policy - More permissive for YouTube
  "Cross-Origin-Embedder-Policy": "unsafe-none",
};

// Bot detection patterns
const botPatterns = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /curl/i,
  /wget/i,
  /python/i,
  /java/i,
  /php/i,
  /go-http-client/i,
  /okhttp/i,
  /httpclient/i,
  /apache-httpclient/i,
  /postman/i,
  /insomnia/i,
  /thunder client/i,
];

// Suspicious request patterns
const suspiciousPatterns = [
  /\.\.\//, // Directory traversal
  /<script/i, // XSS attempts
  /javascript:/i, // JavaScript protocol
  /vbscript:/i, // VBScript protocol
  /on\w+\s*=/i, // Event handlers
  /union\s+select/i, // SQL injection
  /exec\s*\(/i, // Command execution
  /eval\s*\(/i, // Code evaluation
];

// Rate limiting function
function isRateLimited(ip: string, route: string): boolean {
  const store = globalThis.rateLimitStore as Map<
    string,
    { count: number; resetTime: number }
  >;
  const now = Date.now();
  const key = `${ip}:${route}`;
  const record = store.get(key);

  // Determine rate limit based on route sensitivity
  const maxRequests =
    route.includes("/api/") || route.includes("/auth/")
      ? MAX_REQUESTS_PER_WINDOW_STRICT
      : MAX_REQUESTS_PER_WINDOW;

  if (!record || now > record.resetTime) {
    // Reset or create new record
    store.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return false;
  }

  if (record.count >= maxRequests) {
    return true;
  }

  record.count++;
  return false;
}

// Bot detection function
function isBot(userAgent: string): boolean {
  return botPatterns.some(pattern => pattern.test(userAgent));
}

// Suspicious request detection
function isSuspiciousRequest(url: string, headers: Headers): boolean {
  const urlString = url.toLowerCase();

  // Check URL for suspicious patterns
  if (suspiciousPatterns.some(pattern => pattern.test(urlString))) {
    return true;
  }

  // Check headers for suspicious content
  const contentType = headers.get("content-type") || "";
  if (
    contentType.includes("text/html") &&
    !contentType.includes("application/json")
  ) {
    // Potential HTML injection
    return true;
  }

  return false;
}

// IP extraction with fallbacks
function extractIP(request: NextRequest): string {
  // Try various headers for real IP (useful behind proxies)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to connection remote address
  return "127.0.0.1";
}

// Main middleware function
export async function middleware(request: NextRequest) {
  try {
    const startTime = Date.now();
    const ip = extractIP(request);
    const userAgent = request.headers.get("user-agent") || "";
    const url = request.url;
    const pathname = request.nextUrl.pathname;

    // Generate unique request ID
    const requestId = `${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Add request ID to headers
    const response = NextResponse.next();
    response.headers.set("X-Request-ID", requestId);

    // Bot detection and blocking
    if (isBot(userAgent)) {
      captureError(new Error(`Bot detected: ${userAgent}`), {
        context: "middleware",
        ip,
        userAgent,
        pathname,
        requestId,
      });

      // Return 403 Forbidden for bots
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Suspicious request detection
    if (isSuspiciousRequest(url, request.headers)) {
      captureError(new Error(`Suspicious request detected: ${url}`), {
        context: "middleware",
        ip,
        userAgent,
        pathname,
        requestId,
        url,
      });

      // Return 400 Bad Request for suspicious requests
      return new NextResponse("Bad Request", { status: 400 });
    }

    // Rate limiting
    if (isRateLimited(ip, pathname)) {
      captureError(new Error(`Rate limit exceeded for IP: ${ip}`), {
        context: "middleware",
        ip,
        pathname,
        requestId,
      });

      // Return 429 Too Many Requests
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": MAX_REQUESTS_PER_WINDOW.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(
            Date.now() + RATE_LIMIT_WINDOW
          ).toISOString(),
        },
      });
    }

    // Apply security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Add performance-optimized cache headers based on route
    if (
      pathname.startsWith("/_next/static/") ||
      pathname.startsWith("/public/")
    ) {
      // Static assets - long cache
      response.headers.set(
        "Cache-Control",
        "public, max-age=31536000, immutable"
      );
    } else if (pathname.startsWith("/api/")) {
      // API routes - short cache
      response.headers.set("Cache-Control", "public, max-age=60, s-maxage=60");
    } else if (pathname.includes("/admin") || pathname.includes("/dashboard")) {
      // Admin/dashboard pages - no cache
      response.headers.set(
        "Cache-Control",
        "no-cache, no-store, must-revalidate"
      );
    } else {
      // Regular pages - medium cache
      response.headers.set(
        "Cache-Control",
        "public, max-age=300, s-maxage=300"
      );
    }

    // Add custom security headers
    response.headers.set("X-Request-ID", requestId);
    response.headers.set("X-Response-Time", `${Date.now() - startTime}ms`);

    // Log request for monitoring
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[${new Date().toISOString()}] ${
          request.method
        } ${pathname} - IP: ${ip} - UA: ${userAgent.substring(0, 100)}`
      );
    }

    return response;
  } catch (error) {
    // Log and capture any middleware errors
    captureError(error as Error, {
      context: "middleware",
      pathname: request.nextUrl.pathname,
    });

    // Return 500 Internal Server Error
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - uploadthing (file upload routes)
     * - stream-master-video (video streaming)
     * - generate-thumbnail (thumbnail generation)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public|uploadthing|stream-master-video|generate-thumbnail).*)",
  ],
};
