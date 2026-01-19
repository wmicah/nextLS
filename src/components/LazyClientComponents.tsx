"use client";

import dynamic from "next/dynamic";

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

export function LazyClientComponents() {
  return (
    <>
      <ChatbotWrapper />
      <ClientBugReportButton />
      <CustomAnalytics />
      <ServiceWorkerRegistration />
    </>
  );
}

