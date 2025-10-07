"use client";

import { useMobileDetection } from "@/lib/mobile-detection";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

// Import all the mobile and desktop components
import Dashboard from "./Dashboard";
import MobileDashboard from "./MobileDashboard";
import ClientsPage from "./ClientsPage";
import MobileClientsPage from "./MobileClientsPage";
import LibraryPage from "./LibraryPage";
import MobileLibraryPage from "./MobileLibraryPage";
import ProgramsPage from "./ProgramsPage";
import MobileProgramsPage from "./MobileProgramsPage";
import SchedulePageClient from "../app/schedule/SchedulePageClient";
import MobileSchedulePage from "./MobileSchedulePage";
import NotificationsPage from "./NotificationsPage";
import MobileNotificationsPage from "./MobileNotificationsPage";
import MessagesPage from "./MessagesPage";
import MobileMessagesPage from "./MobileMessagesPage";
// Client components
import ClientProgramPage from "./ClientProgramPage";
import MobileClientProgramPage from "./MobileClientProgramPage";
import ClientSchedulePageClient from "../app/client-schedule/ClientSchedulePageClient";
import MobileClientSchedulePage from "./MobileClientSchedulePage";
import ClientMessagesPage from "./ClientMessagesPage";
import MobileClientMessagesPage from "./MobileClientMessagesPage";
import ClientSettingsPage from "./ClientSettingsPage";
import MobileClientSettingsPage from "./MobileClientSettingsPage";

interface ClientSideMobileWrapperProps {
  children?: ReactNode;
}

export default function ClientSideMobileWrapper({
  children,
}: ClientSideMobileWrapperProps) {
  const { isMobile, isClient } = useMobileDetection();
  const pathname = usePathname();

  // Don't render anything until we know if we're on client side
  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300" />
      </div>
    );
  }

  // Determine which component to render based on pathname and mobile detection
  if (pathname === "/dashboard") {
    return isMobile ? <MobileDashboard /> : <Dashboard />;
  }

  if (pathname === "/clients") {
    return isMobile ? <MobileClientsPage /> : <ClientsPage />;
  }

  if (pathname === "/library") {
    return isMobile ? <MobileLibraryPage /> : <LibraryPage />;
  }

  if (pathname === "/programs") {
    return isMobile ? <MobileProgramsPage /> : <ProgramsPage />;
  }

  if (pathname === "/schedule") {
    return isMobile ? <MobileSchedulePage /> : <SchedulePageClient />;
  }

  if (pathname === "/notifications") {
    return isMobile ? <MobileNotificationsPage /> : <NotificationsPage />;
  }

  if (pathname === "/messages") {
    return isMobile ? <MobileMessagesPage /> : <MessagesPage />;
  }

  // Client pages
  if (pathname === "/client-dashboard") {
    return isMobile ? <MobileClientProgramPage /> : <ClientProgramPage />;
  }

  if (pathname === "/client-schedule") {
    return isMobile ? (
      <MobileClientSchedulePage />
    ) : (
      <ClientSchedulePageClient />
    );
  }

  if (pathname === "/client-messages") {
    return isMobile ? <MobileClientMessagesPage /> : <ClientMessagesPage />;
  }

  if (pathname === "/client-settings") {
    return isMobile ? <MobileClientSettingsPage /> : <ClientSettingsPage />;
  }

  if (pathname === "/client-notifications") {
    return isMobile ? <MobileNotificationsPage /> : <NotificationsPage />;
  }

  // For other pages, render the children as-is
  return <>{children}</>;
}
