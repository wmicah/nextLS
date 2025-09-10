"use client";

import React, { useState, useEffect } from "react";

/**
 * Custom hook for mobile detection
 * Returns true if screen width is less than 768px
 */
export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Mark as client-side
    setIsClient(true);

    const checkMobile = () => {
      const isMobileWidth = window.innerWidth < 768;
      const userAgent = navigator.userAgent;
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          userAgent
        );
      const shouldBeMobile = isMobileWidth || isMobileDevice;

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
