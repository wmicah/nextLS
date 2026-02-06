"use client";

import dynamic from "next/dynamic";
import { useMobileDetection } from "@/lib/mobile-detection";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ComponentErrorFallback } from "@/components/ErrorFallback";
import { Suspense } from "react";
import CoachPageSkeleton from "@/components/CoachPageSkeleton";

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
  if (!isClient) return <CoachPageSkeleton />;
  const Component = isMobile ? MobileLibraryPage : LibraryPage;
  return (
    <ErrorBoundary fallback={<ComponentErrorFallback />}>
      <Suspense fallback={null}>
        <Component noSidebar />
      </Suspense>
    </ErrorBoundary>
  );
}
