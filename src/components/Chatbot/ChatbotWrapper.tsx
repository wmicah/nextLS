"use client";

import { usePageTracking } from "./usePageTracking";
import ChatbotWidget from "./ChatbotWidget";
import { usePathname } from "next/navigation";
import { trpc } from "@/app/_trpc/client";

export default function ChatbotWrapper() {
  usePageTracking();
  const pathname = usePathname();

  // Get user role to determine if chatbot should be shown
  const { data: userProfile } = trpc.user.getProfile.useQuery();

  // Hide chatbot on messaging pages
  const isMessagingPage =
    pathname.startsWith("/messages") ||
    pathname.startsWith("/client-messages") ||
    pathname.includes("/messages/");

  // Hide chatbot on all client pages (clients don't need AI chatbot)
  const isClientPage =
    pathname.startsWith("/client-") || pathname.startsWith("/client/");

  // Only show chatbot for coaches, not clients
  const shouldShowChatbot =
    userProfile?.role === "COACH" && !isMessagingPage && !isClientPage;

  if (!shouldShowChatbot) {
    return null;
  }

  return <ChatbotWidget />;
}
