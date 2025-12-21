"use client";

import React, { useState } from "react";
import { trpc } from "@/app/_trpc/client";
// import PaywallModal from "./PaywallModal";
import { Loader2, Lock } from "lucide-react";

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showPaywall?: boolean;
}

/**
 * FeatureGate component that checks subscription tier restrictions
 * 
 * Features:
 * - "master_library": Requires MASTER_LIBRARY or PREMADE_ROUTINES tier
 * - "premade_routines": Requires PREMADE_ROUTINES tier
 * - "add_client": Checks client limit
 */
export default function FeatureGate({
  feature,
  children,
  fallback,
  showPaywall = true,
}: FeatureGateProps) {
  const [showModal, setShowModal] = useState(false);

  // Get subscription restrictions for the current user
  // Note: This query will fail for non-coaches, but we handle that gracefully by allowing access
  const { data: restrictions, isLoading, error } =
    trpc.settings.getSubscriptionRestrictions.useQuery(undefined, {
      retry: false,
      // Query will fail for non-coaches - we handle this by allowing access
      enabled: true,
    });

  // If not a coach or restrictions not available, allow access (fallback for non-coaches)
  const hasAccess = React.useMemo(() => {
    // If query failed (e.g., user is not a coach) or restrictions not available, allow access
    // This prevents blocking non-coach users or when the query fails
    if (error || !restrictions) {
      return true;
    }

    switch (feature) {
      case "master_library":
        return restrictions.access.hasMasterLibraryAccess;
      case "premade_routines":
        return restrictions.access.hasPremadeRoutinesAccess;
      case "add_client":
        return restrictions.restrictions.canAddClient;
      default:
        // Unknown feature - allow access by default
        return true;
    }
  }, [feature, restrictions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (hasAccess) {
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

  // Get appropriate error message based on feature and restrictions
  const getErrorMessage = () => {
    if (!restrictions) {
      return "This feature requires a premium subscription";
    }

    switch (feature) {
      case "master_library":
        return "Master Library access requires a MASTER_LIBRARY or PREMADE_ROUTINES subscription. Please upgrade to access this feature.";
      case "premade_routines":
        return "Premade Routines access requires a PREMADE_ROUTINES subscription. Please upgrade to access this feature.";
      case "add_client":
        return restrictions.restrictions.clientLimitMessage || "You have reached your client limit. Please upgrade to add more clients.";
      default:
        return "This feature requires a premium subscription";
    }
  };

  return (
    <>
      <div className="flex items-center justify-center p-8 text-center">
        <div className="space-y-4">
          <Lock className="h-12 w-12 mx-auto text-gray-400" />
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Premium Feature
            </h3>
            <p className="text-sm text-gray-500 mt-1">{getErrorMessage()}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Upgrade Now
          </button>
        </div>
      </div>

      {/* PaywallModal temporarily disabled */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Feature Not Available
            </h3>
            <p className="text-gray-600 mb-4">{getErrorMessage()}</p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
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
  const { data: restrictions, isLoading, error } =
    trpc.settings.getSubscriptionRestrictions.useQuery(undefined, {
      retry: false,
      enabled: true,
    });

  const hasAccess = React.useMemo(() => {
    // If query failed (e.g., user is not a coach) or restrictions not available, allow access
    if (error || !restrictions) {
      return true;
    }

    switch (feature) {
      case "master_library":
        return restrictions.access.hasMasterLibraryAccess;
      case "premade_routines":
        return restrictions.access.hasPremadeRoutinesAccess;
      case "add_client":
        return restrictions.restrictions.canAddClient;
      default:
        return true;
    }
  }, [feature, restrictions]);

  return {
    hasAccess,
    isLoading,
  };
}

// Hook for checking client limit
export function useClientLimit() {
  const { data: restrictions, isLoading, error } =
    trpc.settings.getSubscriptionRestrictions.useQuery(undefined, {
      retry: false,
      enabled: true,
    });

  // If query failed or restrictions not available, return permissive defaults
  if (error || !restrictions) {
    return {
      canAddClient: true,
      clientCount: 0,
      clientLimit: 999,
      isLoading,
      restrictions: undefined,
    };
  }

  return {
    canAddClient: restrictions.restrictions.canAddClient,
    clientCount: restrictions.restrictions.currentClientCount,
    clientLimit: restrictions.restrictions.maxClients,
    isLoading,
    restrictions: restrictions.restrictions,
  };
}
