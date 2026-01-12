"use client";

import React, { useState, useEffect } from "react";

/**
 * Custom hook for mobile detection
 * Returns true if screen width is less than 1024px (includes iPad)
 */
export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Mark as client-side
    setIsClient(true);

    const checkMobile = () => {
      const width = window.innerWidth;
      const userAgent = navigator.userAgent;

      // Better iPad detection - distinguish from Mac
      // Safari on iPad reports as "MacIntel" but we can detect iPad more accurately
      const isIPad =
        /iPad/i.test(userAgent) ||
        (navigator.platform === "MacIntel" && 
         navigator.maxTouchPoints > 1 && 
         !window.matchMedia("(pointer: fine)").matches); // iPad doesn't have fine pointer

      // Check if it's actually a Mac (not iPad)
      const isMacDesktop = 
        navigator.platform === "MacIntel" && 
        navigator.maxTouchPoints === 0 && // Mac desktops don't have touch points
        window.matchMedia("(pointer: fine)").matches; // Mac has fine pointer (mouse/trackpad)

      // Mobile width: phones and small tablets only (640px = typical mobile breakpoint)
      const isMobileWidth = width < 640;

      // Touch device detection (but exclude Mac desktops)
      const isTouchDevice =
        ("ontouchstart" in window || navigator.maxTouchPoints > 0) && !isMacDesktop;

      // Should use mobile layout: only for actual mobile devices
      // Desktop users (including Mac) get desktop layout even with narrow windows
      const shouldBeMobile =
        (isMobileWidth && !isMacDesktop) ||
        (isIPad && width < 1024) ||
        (isTouchDevice && width < 640 && !isMacDesktop);

      setIsMobile(shouldBeMobile);
    };

    // Initial check
    checkMobile();

    // Add resize listener
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  return { isMobile, isClient };
}

/**
 * Higher-order component for mobile detection
 * Renders mobile component if mobile, desktop component if desktop
 */
export function withMobileDetection<T extends object>(
  MobileComponent: React.ComponentType<T>,
  DesktopComponent: React.ComponentType<T>
) {
  return function MobileDetectedComponent(props: T) {
    const { isMobile, isClient } = useMobileDetection();

    // Show loading while determining screen size
    if (!isClient) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300" />
        </div>
      );
    }

    // Render appropriate component
    if (isMobile) {
      return <MobileComponent {...props} />;
    }

    return <DesktopComponent {...props} />;
  };
}
