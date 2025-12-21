"use client";

import { useMobileDetection } from "@/lib/mobile-detection";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ComponentErrorFallback } from "@/components/ErrorFallback";

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
import VideosPage from "./VideosPage";
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
    return (
      <ErrorBoundary fallback={<ComponentErrorFallback />}>
        {isMobile ? <MobileDashboard /> : <Dashboard />}
      </ErrorBoundary>
    );
  }

  if (pathname === "/clients") {
    return (
      <ErrorBoundary fallback={<ComponentErrorFallback />}>
        {isMobile ? <MobileClientsPage /> : <ClientsPage />}
      </ErrorBoundary>
    );
  }

  if (pathname === "/library") {
    return (
      <ErrorBoundary fallback={<ComponentErrorFallback />}>
        {isMobile ? <MobileLibraryPage /> : <LibraryPage />}
      </ErrorBoundary>
    );
  }

  if (pathname === "/programs") {
    return (
      <ErrorBoundary fallback={<ComponentErrorFallback />}>
        {isMobile ? <MobileProgramsPage /> : <ProgramsPage />}
      </ErrorBoundary>
    );
  }

  if (pathname === "/schedule") {
    return (
      <ErrorBoundary fallback={<ComponentErrorFallback />}>
        {isMobile ? <MobileSchedulePage /> : <SchedulePageClient />}
      </ErrorBoundary>
    );
  }

  if (pathname === "/notifications") {
    return (
      <ErrorBoundary fallback={<ComponentErrorFallback />}>
        {isMobile ? <MobileNotificationsPage /> : <NotificationsPage />}
      </ErrorBoundary>
    );
  }

  if (pathname === "/messages") {
    return (
      <ErrorBoundary fallback={<ComponentErrorFallback />}>
        {isMobile ? <MobileMessagesPage /> : <MessagesPage />}
      </ErrorBoundary>
    );
  }

  if (pathname === "/videos") {
    return (
      <ErrorBoundary fallback={<ComponentErrorFallback />}>
        <VideosPage />
      </ErrorBoundary>
    );
  }

  // Client pages
  if (pathname === "/client-dashboard") {
    return (
      <ErrorBoundary fallback={<ComponentErrorFallback />}>
        {isMobile ? <MobileClientProgramPage /> : <ClientProgramPage />}
      </ErrorBoundary>
    );
  }

  if (pathname === "/client-schedule") {
    return (
      <ErrorBoundary fallback={<ComponentErrorFallback />}>
        {isMobile ? <MobileClientSchedulePage /> : <ClientSchedulePageClient />}
      </ErrorBoundary>
    );
  }

  if (pathname === "/client-messages") {
    return (
      <ErrorBoundary fallback={<ComponentErrorFallback />}>
        {isMobile ? <MobileClientMessagesPage /> : <ClientMessagesPage />}
      </ErrorBoundary>
    );
  }

  if (pathname === "/client-settings") {
    return (
      <ErrorBoundary fallback={<ComponentErrorFallback />}>
        {isMobile ? <MobileClientSettingsPage /> : <ClientSettingsPage />}
      </ErrorBoundary>
    );
  }

  if (pathname === "/client-notifications") {
    return (
      <ErrorBoundary fallback={<ComponentErrorFallback />}>
        {isMobile ? <MobileNotificationsPage /> : <NotificationsPage />}
      </ErrorBoundary>
    );
  }

  // For other pages, render the children as-is
  return <>{children}</>;
}
