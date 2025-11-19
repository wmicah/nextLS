"use client";

import { useState } from "react";
import { CheckCircle, Clock, Loader2 } from "lucide-react";

interface MessageAcknowledgmentProps {
  messageId: string;
  requiresAcknowledgment: boolean;
  isAcknowledged: boolean;
  acknowledgedAt?: Date | null;
  isOwnMessage?: boolean; // Whether the current user sent this message
}

export default function MessageAcknowledgment({
  messageId,
  requiresAcknowledgment,
  isAcknowledged,
  acknowledgedAt,
  isOwnMessage = false,
}: MessageAcknowledgmentProps) {
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [localAcknowledged, setLocalAcknowledged] = useState(isAcknowledged);

  // Don't show anything if acknowledgment is not required
  if (!requiresAcknowledgment) {
    return null;
  }

  // Don't show acknowledgment button for own messages
  if (isOwnMessage) {
    return null;
  }

  const handleAcknowledge = async () => {
    if (localAcknowledged || isAcknowledging) return;

    setIsAcknowledging(true);

    try {
      const response = await fetch("/api/messages/acknowledge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messageId }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Acknowledgment successful:", result);
        setLocalAcknowledged(true);
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

  return (
    <div className="flex items-center gap-2 mt-2">
      <button
        onClick={handleAcknowledge}
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
