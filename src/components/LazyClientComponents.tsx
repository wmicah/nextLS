"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";

// Lazy load non-critical client components (chatbot, analytics, prefetch, etc.)
const ChatbotWrapper = dynamic(
  () => import("@/components/Chatbot/ChatbotWrapper"),
  {
    ssr: false,
  }
);
const ClientBugReportButton = dynamic(
  () => import("@/components/ClientBugReportButton"),
  {
    ssr: false,
  }
);
const ServiceWorkerRegistration = dynamic(
  () => import("@/components/ServiceWorkerRegistration"),
  {
    ssr: false,
  }
);
const CustomAnalytics = dynamic(() => import("@/components/Analytics"), {
  ssr: false,
});
const NavigationPrefetch = dynamic(
  () => import("@/components/NavigationPrefetch"),
  {
    ssr: false,
  }
);

/** Delay in ms before loading non-critical UI on mobile so the main app becomes interactive first */
const MOBILE_DEFER_MS = 2800;

export function LazyClientComponents() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1024;
    const mobile = w < 640;
    setIsMobile(mobile);
    if (!mobile) {
      setShouldLoad(true);
      return;
    }
    const t = setTimeout(() => setShouldLoad(true), MOBILE_DEFER_MS);
    return () => clearTimeout(t);
  }, []);

  // On mobile, don't mount heavy non-critical components until after delay (faster TTI)
  if (!shouldLoad) return null;

  return <LazyClientComponentsInner />;
}

function LazyClientComponentsInner() {
  const { data: userProfile } = trpc.user.getProfile.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return (
    <>
      <ChatbotWrapper />
      <ClientBugReportButton />
      <CustomAnalytics />
      <ServiceWorkerRegistration />
      <NavigationPrefetch
        userRole={userProfile?.role as "COACH" | "CLIENT" | null}
      />
    </>
  );
}
