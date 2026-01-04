import { useState, useEffect, useRef } from "react";

interface UsePersistedSortOptions {
  storageKey: string;
  defaultSortBy: string;
  defaultSortOrder?: "asc" | "desc";
}

/**
 * Custom hook to persist sort preferences in localStorage
 * @param options - Configuration object with storage key and defaults
 * @returns Tuple of [sortBy, setSortBy, sortOrder, setSortOrder]
 */
export function usePersistedSort({
  storageKey,
  defaultSortBy,
  defaultSortOrder = "asc",
}: UsePersistedSortOptions) {
  // Initialize state from localStorage if available, otherwise use defaults
  const getInitialValue = () => {
    if (typeof window === "undefined") {
      return { sortBy: defaultSortBy, sortOrder: defaultSortOrder };
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          sortBy: parsed.sortBy || defaultSortBy,
          sortOrder: parsed.sortOrder || defaultSortOrder,
        };
      }
    } catch (error) {
      console.error(`Error loading sort preferences from ${storageKey}:`, error);
    }

    return { sortBy: defaultSortBy, sortOrder: defaultSortOrder };
  };

  const initialValue = getInitialValue();
  const [sortBy, setSortByState] = useState<string>(initialValue.sortBy);
  const [sortOrder, setSortOrderState] = useState<"asc" | "desc">(
    initialValue.sortOrder
  );

  // Track if this is the initial mount to avoid saving on first render
  const isFirstRender = useRef(true);

  // Save to localStorage whenever sortBy or sortOrder changes (but not on initial mount)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Skip saving on the first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ sortBy, sortOrder })
      );
    } catch (error) {
      console.error(`Error saving sort preferences to ${storageKey}:`, error);
    }
  }, [sortBy, sortOrder, storageKey]);

  // Wrapper functions to update state
  const setSortBy = (value: string) => {
    setSortByState(value);
  };

  const setSortOrder = (value: "asc" | "desc") => {
    setSortOrderState(value);
  };

  return [sortBy, setSortBy, sortOrder, setSortOrder] as const;
}

