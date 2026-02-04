"use client";

import React, { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import { Loader2, Lock, Users, ArrowRight, X } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Subscription Enforcement Component
 *
 * Blocks coaches who are at or over their client limit from using the service
 * until they either:
 * 1. Upgrade their subscription (preferred)
 * 2. Remove/archive clients to get below their limit
 *
 * This component should be placed in the main layout or dashboard to enforce
 * subscription limits across the application.
 */
export default function SubscriptionEnforcement({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [showClientManagement, setShowClientManagement] = useState(false);

  // Get subscription restrictions for the current user
  const {
    data: restrictions,
    isLoading,
    error,
  } = trpc.settings.getSubscriptionRestrictions.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: true,
  });

  // If loading or error (e.g., not a coach), allow access
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // If not a coach or restrictions not available, allow access
  if (error || !restrictions) {
    return <>{children}</>;
  }

  // Check if coach is at or over their limit
  const isBlocked =
    restrictions.restrictions.currentClientCount >=
    restrictions.restrictions.maxClients;
  const isOverLimit = restrictions.restrictions.clientLimitExceeded;

  // If not blocked, allow access
  if (!isBlocked) {
    return <>{children}</>;
  }

  // Coach is blocked - show enforcement screen
  const currentCount = restrictions.restrictions.currentClientCount;
  const limit = restrictions.restrictions.maxClients;
  const overBy = currentCount - limit;

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl border border-gray-200 p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 rounded-full">
              <Lock className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Subscription Limit Reached
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Action required to continue using the platform
              </p>
            </div>
          </div>
        </div>

        {/* Status Message */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-900">
                {isOverLimit
                  ? `You currently have ${currentCount} active clients, which exceeds your limit of ${limit} client${limit === 1 ? "" : "s"}.`
                  : `You have reached your client limit of ${limit} active client${limit === 1 ? "" : "s"}.`}
              </p>
              <p className="text-sm text-red-700 mt-1">
                {isOverLimit
                  ? `You are ${overBy} client${overBy === 1 ? "" : "s"} over your subscription limit.`
                  : "You cannot add more clients or use platform features until you resolve this."}
              </p>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {/* Upgrade Option (Primary/Recommended) */}
          <div className="border-2 border-green-500 rounded-lg p-6 bg-green-50">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Recommended: Upgrade Your Subscription
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upgrade to a higher tier to increase your client limit and
                  continue using all platform features. This is the quickest way
                  to restore full access.
                </p>
                <div className="bg-white rounded-md p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Current Limit:
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {limit} clients
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-medium text-gray-700">
                      Recommended Limit:
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      {Math.ceil(currentCount / 25) * 25 || 25} clients
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push("/pricing")}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <span>Upgrade Subscription</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>

          {/* Remove Clients Option (Secondary) */}
          <div className="border border-gray-300 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Alternative: Remove Clients
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {isOverLimit
                    ? `Archive or remove ${overBy} client${overBy === 1 ? "" : "s"} to get below your limit of ${limit}.`
                    : `Archive or remove ${currentCount - limit + 1} client${currentCount - limit + 1 === 1 ? "" : "s"} to add more clients.`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowClientManagement(true)}
              className="w-full bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Manage Clients
            </button>
          </div>
        </div>

        {/* Client Management Modal */}
        {showClientManagement && (
          <ClientManagementModal
            currentCount={currentCount}
            limit={limit}
            onClose={() => setShowClientManagement(false)}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Modal for managing clients to get below the limit
 */
function ClientManagementModal({
  currentCount,
  limit,
  onClose,
}: {
  currentCount: number;
  limit: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const utils = trpc.useUtils();

  /** Minimal client type to avoid deep tRPC inference. */
  type SubEnforcementClient = {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  // Get clients list
  const { data: clientsRaw, isLoading } = trpc.clients.list.useQuery({
    archived: false,
  });
  const clients = clientsRaw as SubEnforcementClient[] | undefined;

  // Get current restrictions to check if we're below limit after archiving
  const { data: restrictions } =
    trpc.settings.getSubscriptionRestrictions.useQuery(undefined, {
      refetchInterval: query => {
        // Only poll while modal is open and we're still over limit
        const count =
          query.state.data?.restrictions.currentClientCount ?? currentCount;
        const max = query.state.data?.restrictions.maxClients ?? limit;
        return count >= max ? 2000 : false; // Poll every 2s if still over limit, stop if below
      },
    });

  // Close modal automatically if we're now below the limit
  React.useEffect(() => {
    if (
      restrictions &&
      restrictions.restrictions.currentClientCount <
        restrictions.restrictions.maxClients
    ) {
      onClose();
    }
  }, [
    restrictions?.restrictions.currentClientCount,
    restrictions?.restrictions.maxClients,
    onClose,
  ]);

  // Archive client mutation
  const archiveClient = trpc.clients.archive.useMutation({
    onSuccess: async () => {
      // Invalidate queries to refresh data
      await utils.clients.list.invalidate();
      await utils.settings.getSubscriptionRestrictions.invalidate();
      // The useEffect above will close the modal if we're now below limit
    },
  });

  const clientsToRemove = currentCount - limit + 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Manage Clients
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Remove or archive clients to get below your limit of {limit}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : !clients || clients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No clients found</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>
                    You need to remove {clientsToRemove} client
                    {clientsToRemove === 1 ? "" : "s"}
                  </strong>{" "}
                  to get below your limit.
                </p>
              </div>

              {clients.map(client => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{client.name}</p>
                    {client.email && (
                      <p className="text-sm text-gray-500">{client.email}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Are you sure you want to archive ${client.name}? This will remove them from your active clients list.`
                        )
                      ) {
                        archiveClient.mutate({ id: client.id });
                      }
                    }}
                    disabled={archiveClient.isPending}
                    className="ml-4 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {archiveClient.isPending ? "Archiving..." : "Archive"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Current: {clients?.length || 0} / Limit: {limit}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => router.push("/pricing")}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                Upgrade Instead
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
