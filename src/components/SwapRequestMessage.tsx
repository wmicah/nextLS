"use client";

import { trpc } from "@/app/_trpc/client";
import {
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import FormattedMessage from "./FormattedMessage";

interface SwapRequestMessageProps {
  message: {
    id: string;
    content: string;
    sender: {
      id: string;
    };
    data?: {
      type: string;
      swapRequestId: string;
      requesterName: string;
      requesterEventTitle: string;
      targetEventTitle: string;
      requesterEventDate: string;
      targetEventDate: string;
      cancelledBy?: string;
    };
  };
  onResponse?: () => void;
}

export default function SwapRequestMessage({
  message,
  onResponse,
}: SwapRequestMessageProps) {
  const { data: currentUser } = trpc.user.getProfile.useQuery();
  const utils = trpc.useUtils();

  // Fetch current swap request status if this is a swap request message
  const { data: swapRequestStatus } =
    trpc.timeSwap.getSwapRequestStatus.useQuery(
      { swapRequestId: message.data?.swapRequestId || "" },
      {
        enabled:
          !!message.data?.swapRequestId &&
          message.data?.type === "SWAP_REQUEST",
      }
    );

  const respondToSwap = trpc.timeSwap.respondToSwapRequest.useMutation({
    onSuccess: data => {
      alert(data.message);
      // Invalidate queries to refresh the UI and show new messages
      utils.messaging.getConversations.invalidate();
      utils.messaging.getMessages.invalidate();
      utils.timeSwap.getSwapRequestStatus.invalidate();
      if (onResponse) onResponse();
    },
    onError: error => {
      alert(`Error: ${error.message}`);
    },
  });

  // Check if current user is the sender of the message
  const isCurrentUserSender = currentUser?.id === message.sender.id;

  const handleResponse = (response: "APPROVED" | "DECLINED") => {
    if (message.data?.swapRequestId) {
      respondToSwap.mutate({
        swapRequestId: message.data.swapRequestId,
        response,
      });
    }
  };

  if (!message.data) {
    return (
      <div className="p-3 bg-gray-50 rounded-lg">
        <FormattedMessage content={message.content} />
      </div>
    );
  }

  // Handle approval messages
  if (message.data.type === "SWAP_APPROVAL") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5" style={{ color: "#10B981" }} />
          <h4 className="font-semibold" style={{ color: "#C3BCC2" }}>
            Switch Request Approved
          </h4>
        </div>
        <FormattedMessage content={message.content} />
      </div>
    );
  }

  // Handle decline messages
  if (message.data.type === "SWAP_DECLINE") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <XCircle className="h-5 w-5" style={{ color: "#EF4444" }} />
          <h4 className="font-semibold" style={{ color: "#C3BCC2" }}>
            Switch Request Declined
          </h4>
        </div>
        <FormattedMessage content={message.content} />
      </div>
    );
  }

  // Handle cancellation messages
  if (message.data.type === "SWAP_CANCELLATION") {
    return (
      <div
        className="p-4 border rounded-lg"
        style={{ backgroundColor: "#2A3133", borderColor: "#DC2626" }}
      >
        <div className="flex items-center gap-3 mb-2">
          <XCircle className="h-5 w-5" style={{ color: "#DC2626" }} />
          <h4 className="font-semibold" style={{ color: "#C3BCC2" }}>
            Switch Request Cancelled
          </h4>
        </div>
        <div className="mb-2" style={{ color: "#ABA4AA" }}>
          <FormattedMessage content={message.content} />
        </div>
        <p className="text-sm" style={{ color: "#ABA4AA" }}>
          {message.data.cancelledBy} has cancelled their switch request.
        </p>
      </div>
    );
  }

  // Handle regular swap requests
  if (message.data.type !== "SWAP_REQUEST") {
    return (
      <div className="p-3 rounded-lg" style={{ backgroundColor: "#2A3133" }}>
        <FormattedMessage content={message.content} />
      </div>
    );
  }

  return (
    <div
      className="p-4 border rounded-lg"
      style={{ backgroundColor: "#2A3133", borderColor: "#4A5A70" }}
    >
      <div className="flex items-start gap-3 mb-4">
        <AlertCircle className="h-5 w-5 mt-0.5" style={{ color: "#4A5A70" }} />
        <div className="flex-1">
          <h3 className="font-medium mb-2" style={{ color: "#C3BCC2" }}>
            Time Switch Request
          </h3>
          <div className="text-sm mb-3" style={{ color: "#ABA4AA" }}>
            <FormattedMessage content={message.content} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div
          className="p-3 rounded border"
          style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
        >
          <p className="text-sm font-medium mb-2" style={{ color: "#C3BCC2" }}>
            Their lesson:
          </p>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" style={{ color: "#ABA4AA" }} />
            <div>
              <p className="font-medium" style={{ color: "#C3BCC2" }}>
                {message.data.requesterEventTitle}
              </p>
              <p className="text-sm" style={{ color: "#ABA4AA" }}>
                {new Date(message.data.requesterEventDate).toLocaleDateString()}{" "}
                at{" "}
                {new Date(message.data.requesterEventDate).toLocaleTimeString(
                  [],
                  {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  }
                )}
              </p>
            </div>
          </div>
        </div>

        <div
          className="p-3 rounded border"
          style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
        >
          <p className="text-sm font-medium mb-2" style={{ color: "#C3BCC2" }}>
            Your lesson:
          </p>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" style={{ color: "#ABA4AA" }} />
            <div>
              <p className="font-medium" style={{ color: "#C3BCC2" }}>
                {message.data.targetEventTitle}
              </p>
              <p className="text-sm" style={{ color: "#ABA4AA" }}>
                {new Date(message.data.targetEventDate).toLocaleDateString()} at{" "}
                {new Date(message.data.targetEventDate).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="p-3 rounded border"
        style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
      >
        <div className="flex items-start gap-2">
          <AlertCircle
            className="h-4 w-4 mt-0.5"
            style={{ color: "#F59E0B" }}
          />
          <div>
            <p className="text-sm font-medium" style={{ color: "#C3BCC2" }}>
              What happens if you approve:
            </p>
            <ul className="text-sm mt-1 space-y-1" style={{ color: "#ABA4AA" }}>
              <li>
                • You agree to come in their time slot for this lesson (only
                this time)
              </li>
              <li>• Your coach will be notified</li>
              <li>• No further action needed</li>
            </ul>
          </div>
        </div>
      </div>

      {!isCurrentUserSender ? (
        swapRequestStatus?.status === "PENDING" ? (
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => handleResponse("APPROVED")}
              disabled={respondToSwap.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "#10B981",
                color: "#FFFFFF",
                border: "1px solid #059669",
              }}
              onMouseEnter={e => {
                if (!respondToSwap.isPending) {
                  e.currentTarget.style.backgroundColor = "#059669";
                }
              }}
              onMouseLeave={e => {
                if (!respondToSwap.isPending) {
                  e.currentTarget.style.backgroundColor = "#10B981";
                }
              }}
            >
              {respondToSwap.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Approve Switch
            </button>
            <button
              onClick={() => handleResponse("DECLINED")}
              disabled={respondToSwap.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "#EF4444",
                color: "#FFFFFF",
                border: "1px solid #DC2626",
              }}
              onMouseEnter={e => {
                if (!respondToSwap.isPending) {
                  e.currentTarget.style.backgroundColor = "#DC2626";
                }
              }}
              onMouseLeave={e => {
                if (!respondToSwap.isPending) {
                  e.currentTarget.style.backgroundColor = "#EF4444";
                }
              }}
            >
              {respondToSwap.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Decline
            </button>
          </div>
        ) : (
          <div className="text-center py-3">
            <p className="text-sm" style={{ color: "#ABA4AA" }}>
              This switch request has been{" "}
              {swapRequestStatus?.status?.toLowerCase()}.
            </p>
          </div>
        )
      ) : (
        <div className="text-center py-3">
          <p className="text-sm" style={{ color: "#ABA4AA" }}>
            Waiting for response from another client...
          </p>
        </div>
      )}
    </div>
  );
}
