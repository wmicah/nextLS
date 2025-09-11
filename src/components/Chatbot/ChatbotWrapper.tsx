"use client";

import { usePageTracking } from "./usePageTracking";
import ChatbotWidget from "./ChatbotWidget";
import { usePathname } from "next/navigation";

export default function ChatbotWrapper() {
  usePageTracking();
  const pathname = usePathname();

  // Hide chatbot on messaging pages
  const isMessagingPage =
    pathname.startsWith("/messages") ||
    pathname.startsWith("/client-messages") ||
    pathname.includes("/messages/");

  if (isMessagingPage) {
    return null;
  }

  return <ChatbotWidget />;
}
