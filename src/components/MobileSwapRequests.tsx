"use client";

import { trpc } from "@/app/_trpc/client";
import {
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function MobileSwapRequests() {
  const {
    data: swapRequests,
    isLoading,
    refetch,
  } = trpc.timeSwap.getSwapRequests.useQuery();

  const approveSwap = trpc.timeSwap.approveSwapRequest.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const declineSwap = trpc.timeSwap.declineSwapRequest.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const cancelSwap = trpc.timeSwap.cancelSwapRequest.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      </div>
    );
  }

  if (
    !swapRequests ||
    (swapRequests.sent.length === 0 && swapRequests.received.length === 0)
  ) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-500" />
        <p className="text-gray-400">No swap requests at this time</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Received Requests */}
      {swapRequests.received.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-white">
            Requests to you ({swapRequests.received.length})
          </h3>
          <div className="space-y-4">
            {swapRequests.received.map(request => (
              <div
                key={request.id}
                className="border rounded-xl p-4 bg-gradient-to-br from-[#2A3133] to-[#353A3A] border-[#4A5A70]"
              >
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 mt-1 text-[#4A5A70]" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <p className="font-medium text-white">Another Client</p>
                      <span className="text-xs text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded">
                        Pending
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      {/* Their Lesson */}
                      <div className="p-3 rounded-lg bg-[#353A3A] border border-[#606364]">
                        <p className="text-xs font-medium mb-1 text-gray-400">
                          Their lesson:
                        </p>
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-sky-400 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-sky-300 truncate">
                              Lesson with client
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(
                                request.requesterEvent.date
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}{" "}
                              at{" "}
                              {new Date(
                                request.requesterEvent.date
                              ).toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Your Lesson */}
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-400/20">
                        <p className="text-xs font-medium mb-1 text-gray-400">
                          Your lesson:
                        </p>
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-blue-400 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-blue-300 truncate">
                              {request.targetEvent.title}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(
                                request.targetEvent.date
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}{" "}
                              at{" "}
                              {new Date(
                                request.targetEvent.date
                              ).toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {request.message && (
                      <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-400/20 mb-4">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-orange-300 mb-1">
                              Message:
                            </p>
                            <p className="text-xs text-orange-200">
                              "{request.message}"
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          approveSwap.mutate({ requestId: request.id })
                        }
                        disabled={approveSwap.isPending}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-3 py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {approveSwap.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          declineSwap.mutate({ requestId: request.id })
                        }
                        disabled={declineSwap.isPending}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-3 py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {declineSwap.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent Requests */}
      {swapRequests.sent.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-white">
            Your requests ({swapRequests.sent.length})
          </h3>
          <div className="space-y-4">
            {swapRequests.sent.map(request => (
              <div
                key={request.id}
                className="border rounded-xl p-4 bg-gradient-to-br from-[#2A3133] to-[#353A3A] border-[#4A5A70]"
              >
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 mt-1 text-gray-400" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <p className="font-medium text-white">
                        Request to Another Client
                      </p>
                      <span className="text-xs text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded">
                        Pending
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      {/* Your Lesson */}
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-400/20">
                        <p className="text-xs font-medium mb-1 text-gray-400">
                          Your lesson:
                        </p>
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-blue-400 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-blue-300 truncate">
                              {request.requesterEvent.title}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(
                                request.requesterEvent.date
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}{" "}
                              at{" "}
                              {new Date(
                                request.requesterEvent.date
                              ).toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Their Lesson */}
                      <div className="p-3 rounded-lg bg-[#353A3A] border border-[#606364]">
                        <p className="text-xs font-medium mb-1 text-gray-400">
                          Their lesson:
                        </p>
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-sky-400 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-sky-300 truncate">
                              Lesson with client
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(
                                request.targetEvent.date
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}{" "}
                              at{" "}
                              {new Date(
                                request.targetEvent.date
                              ).toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-400">
                        Sent{" "}
                        {new Date(request.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                          }
                        )}{" "}
                        at{" "}
                        {new Date(request.createdAt).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                      <button
                        onClick={() =>
                          cancelSwap.mutate({ swapRequestId: request.id })
                        }
                        disabled={cancelSwap.isPending}
                        className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                      >
                        {cancelSwap.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        Cancel Request
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
