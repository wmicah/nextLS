"use client";

import dynamic from "next/dynamic";
import { useMobileDetection } from "@/lib/mobile-detection";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ComponentErrorFallback } from "@/components/ErrorFallback";
import { Suspense } from "react";
import CoachPageSkeleton from "@/components/CoachPageSkeleton";

const MessagesPage = dynamic(() => import("@/components/MessagesPage"), {
  loading: () => null,
  ssr: false,
});
const MobileMessagesPage = dynamic(
  () => import("@/components/MobileMessagesPage"),
  { loading: () => null, ssr: false }
);

export default function MessagesRoutePage() {
  const { isMobile, isClient } = useMobileDetection();
  if (!isClient) return <CoachPageSkeleton />;
  const Component = isMobile ? MobileMessagesPage : MessagesPage;
  return (
    <ErrorBoundary fallback={<ComponentErrorFallback />}>
      <Suspense fallback={null}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );
}
