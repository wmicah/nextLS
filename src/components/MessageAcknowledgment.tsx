"use client";

import { useState } from "react";
import { CheckCircle, Clock, Loader2, XCircle } from "lucide-react";
import { trpc } from "@/app/_trpc/client";

interface MessageAcknowledgmentProps {
  messageId: string;
  requiresAcknowledgment: boolean;
  isAcknowledged: boolean;
  acknowledgedAt?: Date | null;
  isOwnMessage?: boolean; // Whether the current user sent this message
  messageData?: {
    type?: string;
    swapRequestId?: string;
  };
}

export default function MessageAcknowledgment({
  messageId,
  requiresAcknowledgment,
  isAcknowledged,
  acknowledgedAt,
  isOwnMessage = false,
  messageData,
}: MessageAcknowledgmentProps) {
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [localAcknowledged, setLocalAcknowledged] = useState(isAcknowledged);
  const utils = trpc.useUtils();
  
  // Check if this is a swap request
  const isSwapRequest = messageData?.type === "SWAP_REQUEST" && messageData?.swapRequestId;

  // Don't show anything if acknowledgment is not required
  if (!requiresAcknowledgment) {
    return null;
  }

  // Don't show acknowledgment button for own messages
  if (isOwnMessage) {
    return null;
  }

  const handleAcknowledge = async (swapAction?: "APPROVED" | "DECLINED") => {
    if (localAcknowledged || isAcknowledging) return;

    setIsAcknowledging(true);

    try {
      const response = await fetch("/api/messages/acknowledge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messageId, swapAction }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Acknowledgment successful:", result);
        setLocalAcknowledged(true);
        
        // Invalidate queries to refresh the UI
        if (isSwapRequest) {
          utils.messaging.getConversations.invalidate();
          utils.messaging.getMessages.invalidate();
          utils.timeSwap.getSwapRequestStatus.invalidate();
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error(
          "Failed to acknowledge message:",
          response.status,
          errorData
        );
        alert(
          `Failed to acknowledge message: ${errorData.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error acknowledging message:", error);
      alert(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsAcknowledging(false);
    }
  };

  if (localAcknowledged) {
    return (
      <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span>Acknowledged</span>
        {acknowledgedAt && (
          <span className="text-gray-500">
            {new Date(acknowledgedAt).toLocaleString()}
          </span>
        )}
      </div>
    );
  }

  // For swap requests, show Accept/Reject buttons
  if (isSwapRequest) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={() => handleAcknowledge("APPROVED")}
          disabled={isAcknowledging}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors duration-200"
        >
          {isAcknowledging ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Accepting...</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>Acknowledge & Accept</span>
            </>
          )}
        </button>
        <button
          onClick={() => handleAcknowledge("DECLINED")}
          disabled={isAcknowledging}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors duration-200"
        >
          {isAcknowledging ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Rejecting...</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" />
              <span>Acknowledge & Reject</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // Regular acknowledgment button
  return (
    <div className="flex items-center gap-2 mt-2">
      <button
        onClick={() => handleAcknowledge()}
        disabled={isAcknowledging}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors duration-200"
      >
        {isAcknowledging ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Acknowledging...</span>
          </>
        ) : (
          <>
            <Clock className="h-4 w-4" />
            <span>Acknowledge</span>
          </>
        )}
      </button>
    </div>
  );
}
