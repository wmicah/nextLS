"use client";

import { useEffect, useRef, useState } from "react";

interface UseSmartPollingOptions {
  baseInterval?: number;
  maxInterval?: number;
  backoffMultiplier?: number;
  resetOnActivity?: boolean;
  pauseWhenInactive?: boolean;
}

export function useSmartPolling({
  baseInterval = 30000, // 30 seconds
  maxInterval = 300000, // 5 minutes
  backoffMultiplier = 1.5,
  resetOnActivity = true,
  pauseWhenInactive = true,
}: UseSmartPollingOptions = {}) {
  const [interval, setInterval] = useState(baseInterval);
  const [isActive, setIsActive] = useState(true);
  const lastActivityRef = useRef(Date.now());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  // Track user activity
  useEffect(() => {
    if (!resetOnActivity) return;

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      if (resetOnActivity) {
        setInterval(baseInterval);
      }
    };

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, [baseInterval, resetOnActivity]);

  // Check if user is inactive
  useEffect(() => {
    if (!pauseWhenInactive) return;

    const checkInactivity = (): void => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityRef.current;

      // Consider inactive after 5 minutes
      const inactiveThreshold = 5 * 60 * 1000;

      if (timeSinceActivity > inactiveThreshold && isActive) {
        setIsActive(false);
      } else if (timeSinceActivity <= inactiveThreshold && !isActive) {
        setIsActive(true);
      }
    };

    const intervalId = window.setInterval(checkInactivity, 60000); // Check every minute
    return () => clearInterval(intervalId);
  }, [isActive, pauseWhenInactive]);

  // Exponential backoff on errors
  const handleError = () => {
    setInterval(prev => {
      const newInterval = Math.min(prev * backoffMultiplier, maxInterval);
      return newInterval;
    });
  };

  // Reset interval on success
  const handleSuccess = () => {
    if (interval !== baseInterval) {
      setInterval(baseInterval);
    }
  };

  return {
    interval: isActive ? interval : 0, // 0 means no polling
    isActive,
    handleError,
    handleSuccess,
  };
}
