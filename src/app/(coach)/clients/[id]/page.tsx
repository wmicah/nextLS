"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ComponentErrorFallback } from "@/components/ErrorFallback";
import { Suspense } from "react";

const ClientDetailsPage = dynamic(
  () => import("@/components/ClientDetailsPage"),
  { loading: () => null, ssr: false }
);

export default function ClientIdPage() {
  const params = useParams();
  const id = params.id as string;
  if (!id) return null;
  return (
    <ErrorBoundary fallback={<ComponentErrorFallback />}>
      <Suspense fallback={null}>
        <ClientDetailsPage clientId={id} noSidebar />
      </Suspense>
    </ErrorBoundary>
  );
}
