"use client";

import { useMobileDetection } from "@/lib/mobile-detection";
import NotificationsPage from "./NotificationsPage";
import MobileNotificationsPage from "./MobileNotificationsPage";
import Sidebar from "./Sidebar";
import ClientSidebar from "./ClientSidebar";
import { trpc } from "@/app/_trpc/client";

interface NotificationsPageWrapperProps {}

export default function NotificationsPageWrapper({}: NotificationsPageWrapperProps) {
  const { isMobile } = useMobileDetection();
  const { data: userProfile } = trpc.user.getProfile.useQuery();

  // Determine if user is a coach or client
  const isCoach = userProfile?.role === "COACH";

  const NotificationsContent = () => {
    if (isMobile) {
      return <MobileNotificationsPage />;
    }
    return <NotificationsPage />;
  };

  // Use appropriate sidebar based on user role
  if (isCoach) {
    return (
      <Sidebar>
        <NotificationsContent />
      </Sidebar>
    );
  } else {
    // For clients, we need to pass user data to ClientSidebar
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
}




