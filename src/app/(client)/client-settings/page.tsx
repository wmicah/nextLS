"use client";

import dynamic from "next/dynamic";
import { useMobileDetection } from "@/lib/mobile-detection";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ComponentErrorFallback } from "@/components/ErrorFallback";
import { Suspense } from "react";

const ClientSettingsPage = dynamic(
  () => import("@/components/ClientSettingsPage"),
  { loading: () => null, ssr: false }
);
const MobileClientSettingsPage = dynamic(
  () => import("@/components/MobileClientSettingsPage"),
  { loading: () => null, ssr: false }
);

export default function ClientSettingsRoutePage() {
  const { isMobile, isClient } = useMobileDetection();
  if (!isClient) return null;
  const Component = isMobile ? MobileClientSettingsPage : ClientSettingsPage;
  return (
    <ErrorBoundary fallback={<ComponentErrorFallback />}>
      <Suspense fallback={null}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );
}
