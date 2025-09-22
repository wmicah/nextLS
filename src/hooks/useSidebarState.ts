"use client";

import { useState, useEffect } from "react";

export function useSidebarState() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Get initial state from localStorage
    try {
      const saved = localStorage.getItem("nls_sidebar_open");
      if (saved !== null) {
        setIsOpen(saved === "1");
      }
    } catch {}

    // Listen for changes to localStorage (when sidebar state changes)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "nls_sidebar_open") {
        setIsOpen(e.newValue === "1");
      }
    };

    // Listen for custom events (for same-tab changes)
    const handleSidebarToggle = () => {
      try {
        const saved = localStorage.getItem("nls_sidebar_open");
        if (saved !== null) {
          setIsOpen(saved === "1");
        }
      } catch {}
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("sidebarToggle", handleSidebarToggle);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("sidebarToggle", handleSidebarToggle);
    };
  }, []);

  return isOpen;
}

