"use client";

import dynamic from "next/dynamic";
import { useMobileDetection } from "@/lib/mobile-detection";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ComponentErrorFallback } from "@/components/ErrorFallback";
import { Suspense } from "react";

const ClientSchedulePageClient = dynamic(
  () => import("@/app/client-schedule/ClientSchedulePageClient"),
  { loading: () => null, ssr: false }
);
const MobileClientSchedulePage = dynamic(
  () => import("@/components/MobileClientSchedulePage"),
  { loading: () => null, ssr: false }
);

export default function ClientScheduleRoutePage() {
  const { isMobile, isClient } = useMobileDetection();
  if (!isClient) return null;
  const Component = isMobile
    ? MobileClientSchedulePage
    : ClientSchedulePageClient;
  return (
    <ErrorBoundary fallback={<ComponentErrorFallback />}>
      <Suspense fallback={null}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );
}
