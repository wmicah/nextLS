"use client";

import { useMobileDetection } from "@/lib/mobile-detection";
import NotificationsPage from "./NotificationsPage";
import MobileNotificationsPage from "./MobileNotificationsPage";
import Sidebar from "./Sidebar";
import ClientSidebar from "./ClientSidebar";
import { trpc } from "@/app/_trpc/client";

interface NotificationsPageWrapperProps {
  noSidebar?: boolean;
}

export default function NotificationsPageWrapper({
  noSidebar = false,
}: NotificationsPageWrapperProps) {
  const { isMobile } = useMobileDetection();
  const { data: userProfile } = trpc.user.getProfile.useQuery();

  const NotificationsContent = () => {
    if (isMobile) {
      return <MobileNotificationsPage />;
    }
    return <NotificationsPage />;
  };

  // When layout provides sidebar (noSidebar), render content only
  if (noSidebar) {
    return <NotificationsContent />;
  }

  // Legacy: use appropriate sidebar based on user role
  const isCoach = userProfile?.role === "COACH";
  if (isCoach) {
    return (
      <Sidebar>
        <NotificationsContent />
      </Sidebar>
    );
  }
  return (
    <ClientSidebar
      user={{
        name: userProfile?.name || "",
        email: userProfile?.email || "",
      }}
    >
      <NotificationsContent />
    </ClientSidebar>
  );
}
