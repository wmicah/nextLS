"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Common navigation paths for coaches
 */
const COACH_PREFETCH_PATHS = [
  "/dashboard",
  "/clients",
  "/programs",
  "/library",
  "/schedule",
  "/messages",
];

/**
 * Common navigation paths for clients
 */
const CLIENT_PREFETCH_PATHS = [
  "/client-dashboard",
  "/client-schedule",
  "/client-messages",
  "/client-settings",
];

interface NavigationPrefetchProps {
  userRole?: "COACH" | "CLIENT" | null;
}

/**
 * Component that prefetches common navigation routes
 * This improves perceived performance by loading pages before user clicks
 */
export default function NavigationPrefetch({ userRole }: NavigationPrefetchProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't prefetch if on landing pages
    if (pathname === "/" || pathname === "/features" || pathname === "/pricing") {
      return;
    }

    // Determine which paths to prefetch based on user role
    const pathsToPrefetch = userRole === "CLIENT" 
      ? CLIENT_PREFETCH_PATHS 
      : COACH_PREFETCH_PATHS;

    // Prefetch paths with a small delay to not block initial render
    const timeoutId = setTimeout(() => {
      pathsToPrefetch.forEach(path => {
        // Don't prefetch current path
        if (path !== pathname) {
          router.prefetch(path);
        }
      });
    }, 2000); // Wait 2 seconds after page load

    return () => clearTimeout(timeoutId);
  }, [pathname, router, userRole]);

  // This component doesn't render anything
  return null;
}

/**
 * Hook to prefetch a specific route on hover/focus
 * Use on links that users are likely to click
 */
export function usePrefetchOnHover(path: string) {
  const router = useRouter();

  return {
    onMouseEnter: () => router.prefetch(path),
    onFocus: () => router.prefetch(path),
  };
}

/**
 * Hook to prefetch multiple routes
 */
export function usePrefetchRoutes(paths: string[]) {
  const router = useRouter();

  useEffect(() => {
    // Prefetch after a short delay
    const timeoutId = setTimeout(() => {
      paths.forEach(path => router.prefetch(path));
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [paths, router]);
}

