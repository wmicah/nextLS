"use client";

import dynamic from "next/dynamic";
import { trpc } from "@/app/_trpc/client";

// Lazy load non-critical client components
const ChatbotWrapper = dynamic(() => import("@/components/Chatbot/ChatbotWrapper"), {
  ssr: false,
});
const ClientBugReportButton = dynamic(() => import("@/components/ClientBugReportButton"), {
  ssr: false,
});
const ServiceWorkerRegistration = dynamic(() => import("@/components/ServiceWorkerRegistration"), {
  ssr: false,
});
const CustomAnalytics = dynamic(() => import("@/components/Analytics"), {
  ssr: false,
});
const NavigationPrefetch = dynamic(() => import("@/components/NavigationPrefetch"), {
  ssr: false,
});

export function LazyClientComponents() {
  // Get user role for navigation prefetching
  const { data: userProfile } = trpc.user.getProfile.useQuery(undefined, {
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    refetchOnWindowFocus: false,
  });

  return (
    <>
      <ChatbotWrapper />
      <ClientBugReportButton />
      <CustomAnalytics />
      <ServiceWorkerRegistration />
      <NavigationPrefetch userRole={userProfile?.role as "COACH" | "CLIENT" | null} />
    </>
  );
}

