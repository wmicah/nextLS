"use client";

import { useMobileDetection } from "@/lib/mobile-detection";
import NotificationsPage from "./NotificationsPage";
import MobileNotificationsPage from "./MobileNotificationsPage";

interface NotificationsPageWrapperProps {}

export default function NotificationsPageWrapper({}: NotificationsPageWrapperProps) {
  const { isMobile } = useMobileDetection();

  if (isMobile) {
    return <MobileNotificationsPage />;
  }

  return <NotificationsPage />;
}

