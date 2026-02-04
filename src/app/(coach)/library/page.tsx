"use client";

import dynamic from "next/dynamic";
import { useMobileDetection } from "@/lib/mobile-detection";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ComponentErrorFallback } from "@/components/ErrorFallback";
import { Suspense } from "react";

const LibraryPage = dynamic(() => import("@/components/LibraryPage"), {
  loading: () => null,
  ssr: false,
});
const MobileLibraryPage = dynamic(
  () => import("@/components/MobileLibraryPage"),
  { loading: () => null, ssr: false }
);

export default function LibraryRoutePage() {
  const { isMobile, isClient } = useMobileDetection();
  if (!isClient) return null;
  const Component = isMobile ? MobileLibraryPage : LibraryPage;
  return (
    <ErrorBoundary fallback={<ComponentErrorFallback />}>
      <Suspense fallback={null}>
        <Component noSidebar />
      </Suspense>
    </ErrorBoundary>
  );
}
