"use client";

import React, { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import PaywallModal from "./PaywallModal";
import { Loader2, Lock } from "lucide-react";

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showPaywall?: boolean;
}

export default function FeatureGate({
  feature,
  children,
  fallback,
  showPaywall = true,
}: FeatureGateProps) {
  const [showModal, setShowModal] = useState(false);

  const { data: hasAccess, isLoading } =
    trpc.subscription.hasFeatureAccess.useQuery(
      { feature },
      {
        retry: false,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
      }
    );

  const { data: clientCount } = trpc.subscription.getClientCount.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (hasAccess?.hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showPaywall) {
    return (
      <div className="flex items-center justify-center p-8 text-center">
        <div className="space-y-2">
          <Lock className="h-8 w-8 mx-auto text-gray-400" />
          <p className="text-sm text-gray-500">
            This feature requires a premium subscription
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-center p-8 text-center">
        <div className="space-y-4">
          <Lock className="h-12 w-12 mx-auto text-gray-400" />
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Premium Feature
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              This feature requires a premium subscription
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Upgrade Now
          </button>
        </div>
      </div>

      <PaywallModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        feature={feature}
        currentClientCount={clientCount?.clientCount || 0}
      />
    </>
  );
}

// Higher-order component for feature gating
export function withFeatureGate<T extends object>(
  Component: React.ComponentType<T>,
  feature: string,
  fallback?: React.ReactNode
) {
  return function FeatureGatedComponent(props: T) {
    return (
      <FeatureGate feature={feature} fallback={fallback}>
        <Component {...props} />
      </FeatureGate>
    );
  };
}

// Hook for checking feature access
export function useFeatureAccess(feature: string) {
  const { data: hasAccess, isLoading } =
    trpc.subscription.hasFeatureAccess.useQuery(
      { feature },
      {
        retry: false,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
      }
    );

  return {
    hasAccess: hasAccess?.hasAccess || false,
    isLoading,
  };
}

// Hook for checking client limit
export function useClientLimit() {
  const { data: canAdd, isLoading: canAddLoading } =
    trpc.subscription.canAddClient.useQuery();
  const { data: clientCount, isLoading: countLoading } =
    trpc.subscription.getClientCount.useQuery();

  return {
    canAddClient: canAdd?.canAdd || false,
    clientCount: clientCount?.clientCount || 0,
    isLoading: canAddLoading || countLoading,
  };
}
