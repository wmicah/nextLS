"use client";

import dynamic from "next/dynamic";
import { useMobileDetection } from "@/lib/mobile-detection";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ComponentErrorFallback } from "@/components/ErrorFallback";
import { Suspense } from "react";

const VideosPage = dynamic(() => import("@/components/VideosPage"), {
  loading: () => null,
  ssr: false,
});

export default function VideosRoutePage() {
  const { isClient } = useMobileDetection();
  if (!isClient) return null;
  return (
    <ErrorBoundary fallback={<ComponentErrorFallback />}>
      <Suspense fallback={null}>
        <VideosPage noSidebar />
      </Suspense>
    </ErrorBoundary>
  );
}
