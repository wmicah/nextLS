"use client";

import { usePathname } from "next/navigation";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useKindeBrowserClient();

  // Pages that should have no navbar at all
  const noNavbarPages = ["/auth-callback", "/role-selection"];
  
  // Client pages that have their own navigation (ClientTopNav or MobileClientNavigation)
  const clientPages = [
    "/client-dashboard",
    "/client-program",
    "/client-schedule",
    "/client-messages",
    "/client-settings",
    "/client-notifications",
  ];

  // Don't show anything while loading auth state
  if (isLoading) {
    return null;
  }

  // No navbar on specific pages
  if (noNavbarPages.some(route => pathname.startsWith(route))) {
    return null;
  }

  // No navbar on client pages - they have their own navigation
  if (clientPages.some(route => pathname.startsWith(route))) {
    return null;
  }

  // Always show navbar on landing page (/), features page, and pricing page regardless of auth status
  if (pathname === "/" || pathname === "/features" || pathname === "/pricing") {
    return <Navbar />;
  }

  // Only show navbar for unauthenticated users on other pages
  if (!isAuthenticated) {
    return <Navbar />;
  }

  // No navbar for authenticated users on non-landing pages - they use the sidebar
  return null;
}
