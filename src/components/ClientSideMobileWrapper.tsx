"use client";

import dynamic from "next/dynamic";
import { useMobileDetection } from "@/lib/mobile-detection";
import { usePathname } from "next/navigation";
import { ReactNode, Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ComponentErrorFallback } from "@/components/ErrorFallback";

// Loading skeleton component for page transitions
const PageSkeleton = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
  </div>
);

// ============================================================
// DYNAMIC IMPORTS - Only load what's needed for the current page
// ============================================================

// Dashboard components
const Dashboard = dynamic(() => import("./Dashboard"), {
  loading: PageSkeleton,
  ssr: false,
});
const MobileDashboard = dynamic(() => import("./MobileDashboard"), {
  loading: PageSkeleton,
  ssr: false,
});

// Clients components
const ClientsPage = dynamic(() => import("./ClientsPage"), {
  loading: PageSkeleton,
  ssr: false,
});
const MobileClientsPage = dynamic(() => import("./MobileClientsPage"), {
  loading: PageSkeleton,
  ssr: false,
});

// Library components
const LibraryPage = dynamic(() => import("./LibraryPage"), {
  loading: PageSkeleton,
  ssr: false,
});
const MobileLibraryPage = dynamic(() => import("./MobileLibraryPage"), {
  loading: PageSkeleton,
  ssr: false,
});

// Programs components
const ProgramsPage = dynamic(() => import("./ProgramsPage"), {
  loading: PageSkeleton,
  ssr: false,
});
const MobileProgramsPage = dynamic(() => import("./MobileProgramsPage"), {
  loading: PageSkeleton,
  ssr: false,
});

// Schedule components
const SchedulePageClient = dynamic(() => import("../app/schedule/SchedulePageClient"), {
  loading: PageSkeleton,
  ssr: false,
});
const MobileSchedulePage = dynamic(() => import("./MobileSchedulePage"), {
  loading: PageSkeleton,
  ssr: false,
});

// Notifications components
const NotificationsPage = dynamic(() => import("./NotificationsPage"), {
  loading: PageSkeleton,
  ssr: false,
});
const MobileNotificationsPage = dynamic(() => import("./MobileNotificationsPage"), {
  loading: PageSkeleton,
  ssr: false,
});

// Messages components
const MessagesPage = dynamic(() => import("./MessagesPage"), {
  loading: PageSkeleton,
  ssr: false,
});
const MobileMessagesPage = dynamic(() => import("./MobileMessagesPage"), {
  loading: PageSkeleton,
  ssr: false,
});

// Videos component
const VideosPage = dynamic(() => import("./VideosPage"), {
  loading: PageSkeleton,
  ssr: false,
});

// Client-side pages (for client users)
const ClientProgramPage = dynamic(() => import("./ClientProgramPage"), {
  loading: PageSkeleton,
  ssr: false,
});
const MobileClientProgramPage = dynamic(() => import("./MobileClientProgramPage"), {
  loading: PageSkeleton,
  ssr: false,
});
const ClientSchedulePageClient = dynamic(() => import("../app/client-schedule/ClientSchedulePageClient"), {
  loading: PageSkeleton,
  ssr: false,
});
const MobileClientSchedulePage = dynamic(() => import("./MobileClientSchedulePage"), {
  loading: PageSkeleton,
  ssr: false,
});
const ClientMessagesPage = dynamic(() => import("./ClientMessagesPage"), {
  loading: PageSkeleton,
  ssr: false,
});
const MobileClientMessagesPage = dynamic(() => import("./MobileClientMessagesPage"), {
  loading: PageSkeleton,
  ssr: false,
});
const ClientSettingsPage = dynamic(() => import("./ClientSettingsPage"), {
  loading: PageSkeleton,
  ssr: false,
});
const MobileClientSettingsPage = dynamic(() => import("./MobileClientSettingsPage"), {
  loading: PageSkeleton,
  ssr: false,
});

interface ClientSideMobileWrapperProps {
  children?: ReactNode;
}

// Route to component mapping for cleaner code
const ROUTE_COMPONENTS: Record<string, { desktop: React.ComponentType; mobile: React.ComponentType }> = {
  "/dashboard": { desktop: Dashboard, mobile: MobileDashboard },
  "/clients": { desktop: ClientsPage, mobile: MobileClientsPage },
  "/library": { desktop: LibraryPage, mobile: MobileLibraryPage },
  "/programs": { desktop: ProgramsPage, mobile: MobileProgramsPage },
  "/schedule": { desktop: SchedulePageClient, mobile: MobileSchedulePage },
  "/notifications": { desktop: NotificationsPage, mobile: MobileNotificationsPage },
  "/messages": { desktop: MessagesPage, mobile: MobileMessagesPage },
  "/client-dashboard": { desktop: ClientProgramPage, mobile: MobileClientProgramPage },
  "/client-schedule": { desktop: ClientSchedulePageClient, mobile: MobileClientSchedulePage },
  "/client-messages": { desktop: ClientMessagesPage, mobile: MobileClientMessagesPage },
  "/client-settings": { desktop: ClientSettingsPage, mobile: MobileClientSettingsPage },
  "/client-notifications": { desktop: NotificationsPage, mobile: MobileNotificationsPage },
};

// Special case - VideosPage has no mobile variant
const DESKTOP_ONLY_ROUTES: Record<string, React.ComponentType> = {
  "/videos": VideosPage,
};

export default function ClientSideMobileWrapper({
  children,
}: ClientSideMobileWrapperProps) {
  const { isMobile, isClient } = useMobileDetection();
  const pathname = usePathname();

  // Don't render anything until we know if we're on client side
  if (!isClient) {
    return <PageSkeleton />;
  }

  // Check for desktop-only routes first
  if (DESKTOP_ONLY_ROUTES[pathname]) {
    const Component = DESKTOP_ONLY_ROUTES[pathname];
    return (
      <ErrorBoundary fallback={<ComponentErrorFallback />}>
        <Suspense fallback={<PageSkeleton />}>
          <Component />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // Check mapped routes
  const routeConfig = ROUTE_COMPONENTS[pathname];
  if (routeConfig) {
    const Component = isMobile ? routeConfig.mobile : routeConfig.desktop;
    return (
      <ErrorBoundary fallback={<ComponentErrorFallback />}>
        <Suspense fallback={<PageSkeleton />}>
          <Component />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // For other pages, render the children as-is
  return <>{children}</>;
}
