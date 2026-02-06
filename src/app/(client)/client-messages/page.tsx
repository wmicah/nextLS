"use client";

import dynamic from "next/dynamic";
import { useMobileDetection } from "@/lib/mobile-detection";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ComponentErrorFallback } from "@/components/ErrorFallback";
import { Suspense } from "react";

const ClientMessagesPage = dynamic(
  () => import("@/components/ClientMessagesPage"),
  { loading: () => null, ssr: false }
);
const MobileClientMessagesPage = dynamic(
  () => import("@/components/MobileClientMessagesPage"),
  { loading: () => null, ssr: false }
);

export default function ClientMessagesRoutePage() {
  const { isMobile, isClient } = useMobileDetection();
  if (!isClient) return null;
  const Component = isMobile ? MobileClientMessagesPage : ClientMessagesPage;
  return (
    <ErrorBoundary fallback={<ComponentErrorFallback />}>
      <Suspense fallback={null}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );
}
