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

export default function SwapRequests() {
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
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (
    !swapRequests ||
    (swapRequests.sent.length === 0 && swapRequests.received.length === 0)
  ) {
    return (
      <div className="text-center py-8">
        <Calendar
          className="h-12 w-12 mx-auto mb-3"
          style={{ color: "#ABA4AA" }}
        />
        <p style={{ color: "#ABA4AA" }}>No swap requests at this time</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Received Requests */}
      {swapRequests.received.length > 0 && (
        <div>
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: "#C3BCC2" }}
          >
            Requests to you ({swapRequests.received.length})
          </h3>
          <div className="space-y-4">
            {swapRequests.received.map(request => (
              <div
                key={request.id}
                className="border rounded-lg p-4"
                style={{
                  backgroundColor: "#2A3133",
                  borderColor: "#4A5A70",
                }}
              >
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 mt-1" style={{ color: "#4A5A70" }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium" style={{ color: "#C3BCC2" }}>
                        {request.requester.name}
                      </p>
                      <span className="text-sm" style={{ color: "#ABA4AA" }}>
                        wants to swap times
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div
                        className="p-3 rounded border"
                        style={{
                          backgroundColor: "#353A3A",
                          borderColor: "#606364",
                        }}
                      >
                        <p
                          className="text-sm font-medium mb-1"
                          style={{ color: "#C3BCC2" }}
                        >
                          Their lesson:
                        </p>
                        <div className="flex items-center gap-2">
                          <Clock
                            className="h-4 w-4"
                            style={{ color: "#ABA4AA" }}
                          />
                          <div>
                            <p
                              className="font-medium"
                              style={{ color: "#C3BCC2" }}
                            >
                              {request.requesterEvent.title}
                            </p>
                            <p className="text-sm" style={{ color: "#ABA4AA" }}>
                              {new Date(
                                request.requesterEvent.date
                              ).toLocaleDateString()}{" "}
                              at{" "}
                              {new Date(
                                request.requesterEvent.date
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div
                        className="p-3 rounded border"
                        style={{
                          backgroundColor: "#353A3A",
                          borderColor: "#606364",
                        }}
                      >
                        <p
                          className="text-sm font-medium mb-1"
                          style={{ color: "#C3BCC2" }}
                        >
                          Your lesson:
                        </p>
                        <div className="flex items-center gap-2">
                          <Clock
                            className="h-4 w-4"
                            style={{ color: "#ABA4AA" }}
                          />
                          <div>
                            <p
                              className="font-medium"
                              style={{ color: "#C3BCC2" }}
                            >
                              {request.targetEvent.title}
                            </p>
                            <p className="text-sm" style={{ color: "#ABA4AA" }}>
                              {new Date(
                                request.targetEvent.date
                              ).toLocaleDateString()}{" "}
                              at{" "}
                              {new Date(
                                request.targetEvent.date
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      className="p-3 rounded border"
                      style={{
                        backgroundColor: "#353A3A",
                        borderColor: "#606364",
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle
                          className="h-4 w-4 mt-0.5"
                          style={{ color: "#F59E0B" }}
                        />
                        <div>
                          <p
                            className="text-sm font-medium"
                            style={{ color: "#C3BCC2" }}
                          >
                            Message:
                          </p>
                          <p className="text-sm" style={{ color: "#ABA4AA" }}>
                            "{request.message}"
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          approveSwap.mutate({ requestId: request.id })
                        }
                        disabled={approveSwap.isPending}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {approveSwap.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Approve Swap
                      </button>
                      <button
                        onClick={() =>
                          declineSwap.mutate({ requestId: request.id })
                        }
                        disabled={declineSwap.isPending}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: "#C3BCC2" }}
          >
            Your requests ({swapRequests.sent.length})
          </h3>
          <div className="space-y-4">
            {swapRequests.sent.map(request => (
              <div
                key={request.id}
                className="border rounded-lg p-4"
                style={{
                  backgroundColor: "#2A3133",
                  borderColor: "#606364",
                }}
              >
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 mt-1" style={{ color: "#ABA4AA" }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium" style={{ color: "#C3BCC2" }}>
                        Request to {request.target.name}
                      </p>
                      <span
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: "#1F2937",
                          color: "#F59E0B",
                          borderColor: "#4B5563",
                        }}
                      >
                        Pending
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div
                        className="p-3 rounded border"
                        style={{
                          backgroundColor: "#353A3A",
                          borderColor: "#606364",
                        }}
                      >
                        <p
                          className="text-sm font-medium mb-1"
                          style={{ color: "#C3BCC2" }}
                        >
                          Your lesson:
                        </p>
                        <div className="flex items-center gap-2">
                          <Clock
                            className="h-4 w-4"
                            style={{ color: "#ABA4AA" }}
                          />
                          <div>
                            <p
                              className="font-medium"
                              style={{ color: "#C3BCC2" }}
                            >
                              {request.requesterEvent.title}
                            </p>
                            <p className="text-sm" style={{ color: "#ABA4AA" }}>
                              {new Date(
                                request.requesterEvent.date
                              ).toLocaleDateString()}{" "}
                              at{" "}
                              {new Date(
                                request.requesterEvent.date
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div
                        className="p-3 rounded border"
                        style={{
                          backgroundColor: "#353A3A",
                          borderColor: "#606364",
                        }}
                      >
                        <p
                          className="text-sm font-medium mb-1"
                          style={{ color: "#C3BCC2" }}
                        >
                          Their lesson:
                        </p>
                        <div className="flex items-center gap-2">
                          <Clock
                            className="h-4 w-4"
                            style={{ color: "#ABA4AA" }}
                          />
                          <div>
                            <p
                              className="font-medium"
                              style={{ color: "#C3BCC2" }}
                            >
                              {request.targetEvent.title}
                            </p>
                            <p className="text-sm" style={{ color: "#ABA4AA" }}>
                              {new Date(
                                request.targetEvent.date
                              ).toLocaleDateString()}{" "}
                              at{" "}
                              {new Date(
                                request.targetEvent.date
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="text-sm" style={{ color: "#ABA4AA" }}>
                        Sent {new Date(request.createdAt).toLocaleDateString()}{" "}
                        at{" "}
                        {new Date(request.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <button
                        onClick={() =>
                          cancelSwap.mutate({ swapRequestId: request.id })
                        }
                        disabled={cancelSwap.isPending}
                        className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
