"use client";

import dynamic from "next/dynamic";
import { useMobileDetection } from "@/lib/mobile-detection";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ComponentErrorFallback } from "@/components/ErrorFallback";
import { Suspense } from "react";
import CoachPageSkeleton from "@/components/CoachPageSkeleton";

const NotificationsPageWrapper = dynamic(
  () => import("@/components/NotificationsPageWrapper"),
  { loading: () => null, ssr: false }
);

export default function NotificationsRoutePage() {
  const { isClient } = useMobileDetection();
  if (!isClient) return <CoachPageSkeleton />;
  return (
    <ErrorBoundary fallback={<ComponentErrorFallback />}>
      <Suspense fallback={null}>
        <NotificationsPageWrapper noSidebar />
      </Suspense>
    </ErrorBoundary>
  );
}
