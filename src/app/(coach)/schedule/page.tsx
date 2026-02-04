"use client";

import dynamic from "next/dynamic";
import { useMobileDetection } from "@/lib/mobile-detection";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ComponentErrorFallback } from "@/components/ErrorFallback";
import { Suspense } from "react";

const SchedulePageClient = dynamic(
  () => import("@/app/schedule/SchedulePageClient"),
  { loading: () => null, ssr: false }
);
const MobileSchedulePage = dynamic(
  () => import("@/components/MobileSchedulePage"),
  { loading: () => null, ssr: false }
);

export default function ScheduleRoutePage() {
  const { isMobile, isClient } = useMobileDetection();
  if (!isClient) return null;
  const Component = isMobile ? MobileSchedulePage : SchedulePageClient;
  return (
    <ErrorBoundary fallback={<ComponentErrorFallback />}>
      <Suspense fallback={null}>
        <Component noSidebar />
      </Suspense>
    </ErrorBoundary>
  );
}
