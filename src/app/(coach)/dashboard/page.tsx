"use client";

import dynamic from "next/dynamic";
import { useMobileDetection } from "@/lib/mobile-detection";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ComponentErrorFallback } from "@/components/ErrorFallback";
import { Suspense } from "react";

const Dashboard = dynamic(() => import("@/components/Dashboard"), {
  loading: () => null,
  ssr: false,
});
const MobileDashboard = dynamic(() => import("@/components/MobileDashboard"), {
  loading: () => null,
  ssr: false,
});

export default function DashboardPage() {
  const { isMobile, isClient } = useMobileDetection();
  if (!isClient) return null;
  const Component = isMobile ? MobileDashboard : Dashboard;
  return (
    <ErrorBoundary fallback={<ComponentErrorFallback />}>
      <Suspense fallback={null}>
        <Component noSidebar />
      </Suspense>
    </ErrorBoundary>
  );
}
