"use client";

import dynamic from "next/dynamic";
import { useMobileDetection } from "@/lib/mobile-detection";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ComponentErrorFallback } from "@/components/ErrorFallback";
import { Suspense } from "react";

const ClientProgramPage = dynamic(
  () => import("@/components/ClientProgramPage"),
  {
    loading: () => null,
    ssr: false,
  }
);
const MobileClientProgramPage = dynamic(
  () => import("@/components/MobileClientProgramPage"),
  { loading: () => null, ssr: false }
);

export default function ClientDashboardRoutePage() {
  const { isMobile, isClient } = useMobileDetection();
  if (!isClient) return null;
  const Component = isMobile ? MobileClientProgramPage : ClientProgramPage;
  return (
    <ErrorBoundary fallback={<ComponentErrorFallback />}>
      <Suspense fallback={null}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );
}
