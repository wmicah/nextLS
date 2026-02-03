"use client";

import dynamic from "next/dynamic";
import { useMobileDetection } from "@/lib/mobile-detection";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ComponentErrorFallback } from "@/components/ErrorFallback";
import { Suspense } from "react";

const ProgramsPage = dynamic(() => import("@/components/ProgramsPage"), {
  loading: () => null,
  ssr: false,
});
const MobileProgramsPage = dynamic(
  () => import("@/components/MobileProgramsPage"),
  { loading: () => null, ssr: false }
);

export default function ProgramsRoutePage() {
  const { isMobile, isClient } = useMobileDetection();
  if (!isClient) return null;
  const Component = isMobile ? MobileProgramsPage : ProgramsPage;
  return (
    <ErrorBoundary fallback={<ComponentErrorFallback />}>
      <Suspense fallback={null}>
        <Component noSidebar />
      </Suspense>
    </ErrorBoundary>
  );
}
