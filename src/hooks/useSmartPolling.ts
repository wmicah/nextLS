import { useEffect, useState, useCallback, useRef } from "react";

/**
 * Smart polling hook that:
 * 1. Pauses polling when tab is not visible
 * 2. Reduces frequency when user is idle
 * 3. Resumes immediately when tab becomes visible
 * 4. Supports exponential backoff on errors
 */

interface UseSmartPollingOptions {
  /** Base interval in milliseconds */
  interval: number;
  /** Whether polling is enabled */
  enabled?: boolean;
  /** Callback to execute on each poll */
  onPoll: () => void | Promise<void>;
  /** Interval when tab is hidden (0 = pause completely) */
  hiddenInterval?: number;
  /** Interval after user has been idle for idleThreshold */
  idleInterval?: number;
  /** Time in ms before considering user idle */
  idleThreshold?: number;
  /** Enable exponential backoff on errors */
  backoffOnError?: boolean;
  /** Maximum backoff interval */
  maxBackoff?: number;
}

export function useSmartPolling({
  interval,
  enabled = true,
  onPoll,
  hiddenInterval = 0, // Default: pause when hidden
  idleInterval,
  idleThreshold = 60000, // 1 minute
  backoffOnError = false,
  maxBackoff = 60000, // 1 minute max
}: UseSmartPollingOptions) {
  const [isVisible, setIsVisible] = useState(true);
  const [isIdle, setIsIdle] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const lastActivityRef = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === "visible";
      setIsVisible(visible);
      
      // If becoming visible, poll immediately
      if (visible && enabled) {
        onPoll();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, onPoll]);

  // Track user activity for idle detection
  useEffect(() => {
    if (!idleInterval) return;

    const resetActivity = () => {
      lastActivityRef.current = Date.now();
      setIsIdle(false);
    };

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    events.forEach(event => {
      window.addEventListener(event, resetActivity, { passive: true });
    });

    // Check for idle state periodically
    const idleCheck = setInterval(() => {
      if (Date.now() - lastActivityRef.current > idleThreshold) {
        setIsIdle(true);
      }
    }, 10000); // Check every 10 seconds

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetActivity);
      });
      clearInterval(idleCheck);
    };
  }, [idleInterval, idleThreshold]);

  // Calculate current interval based on state
  const getCurrentInterval = useCallback(() => {
    // If tab is hidden
    if (!isVisible) {
      return hiddenInterval; // 0 means pause
    }

    // If user is idle and idleInterval is set
    if (isIdle && idleInterval) {
      return idleInterval;
    }

    // If there have been errors and backoff is enabled
    if (backoffOnError && errorCount > 0) {
      const backoff = Math.min(interval * Math.pow(2, errorCount), maxBackoff);
      return backoff;
    }

    return interval;
  }, [isVisible, isIdle, interval, hiddenInterval, idleInterval, backoffOnError, errorCount, maxBackoff]);

  // Main polling effect
  useEffect(() => {
    if (!enabled) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    const poll = async () => {
      const currentInterval = getCurrentInterval();
      
      // If interval is 0, don't poll (paused)
      if (currentInterval === 0) {
        return;
      }

      try {
        await onPoll();
        setErrorCount(0); // Reset error count on success
      } catch (error) {
        console.error("Polling error:", error);
        if (backoffOnError) {
          setErrorCount(prev => prev + 1);
        }
      }

      // Schedule next poll
      timeoutRef.current = setTimeout(poll, currentInterval);
    };

    // Start polling
    const currentInterval = getCurrentInterval();
    if (currentInterval > 0) {
      timeoutRef.current = setTimeout(poll, currentInterval);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [enabled, getCurrentInterval, onPoll, backoffOnError]);

  return {
    isVisible,
    isIdle,
    errorCount,
    /** Force an immediate poll */
    pollNow: onPoll,
    /** Reset error count (e.g., after manual retry) */
    resetErrors: () => setErrorCount(0),
  };
}

/**
 * Hook to get visibility-aware refetch interval for React Query
 * Returns the appropriate interval based on tab visibility
 */
export function useVisibilityAwareInterval(
  activeInterval: number,
  hiddenInterval: number | false = false
): number | false {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === "visible");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  if (!isVisible) {
    return hiddenInterval;
  }

  return activeInterval;
}
