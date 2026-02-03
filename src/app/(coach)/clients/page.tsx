"use client";

import dynamic from "next/dynamic";
import { useMobileDetection } from "@/lib/mobile-detection";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ComponentErrorFallback } from "@/components/ErrorFallback";
import { Suspense } from "react";

const ClientsPage = dynamic(() => import("@/components/ClientsPage"), {
  loading: () => null,
  ssr: false,
});
const MobileClientsPage = dynamic(
  () => import("@/components/MobileClientsPage"),
  { loading: () => null, ssr: false }
);

export default function ClientsRoutePage() {
  const { isMobile, isClient } = useMobileDetection();
  if (!isClient) return null;
  const Component = isMobile ? MobileClientsPage : ClientsPage;
  return (
    <ErrorBoundary fallback={<ComponentErrorFallback />}>
      <Suspense fallback={null}>
        <Component noSidebar />
      </Suspense>
    </ErrorBoundary>
  );
}
