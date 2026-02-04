"use client";

import React from "react";
import { COLORS, getGoldenAccent } from "@/lib/colors";

interface ClientDetailWalkthroughHintProps {
  message: string;
  className?: string;
  /** Popup style: floating with shadow and optional arrow pointing at target */
  variant?: "inline" | "popup";
  /** Which side the arrow points (for popup variant) */
  pointerSide?: "left" | "right" | "top" | "bottom";
}

/**
 * Non-blocking onboarding hint. Inline = card in flow. Popup = floating with arrow.
 */
export default function ClientDetailWalkthroughHint({
  message,
  className = "",
  variant = "inline",
  pointerSide = "right",
}: ClientDetailWalkthroughHintProps) {
  const isPopup = variant === "popup";

  return (
    <div
      className={`relative rounded-xl border px-4 py-3 text-sm max-w-[280px] min-w-0 shrink-0 ${className}`}
      style={{
        backgroundColor: "rgba(26, 31, 35, 0.98)",
        borderColor: isPopup
          ? getGoldenAccent(0.4)
          : "rgba(255, 255, 255, 0.08)",
        boxShadow: isPopup
          ? `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px ${getGoldenAccent(0.15)}`
          : "0 4px 16px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.06)",
      }}
    >
      <p
        className="break-words leading-snug"
        style={{ color: COLORS.TEXT_PRIMARY }}
      >
        {message}
      </p>
      {/* Arrow pointing at target (popup variant) */}
      {isPopup && (
        <div
          className="absolute w-0 h-0 border-[8px] border-transparent"
          style={{
            ...(pointerSide === "right" && {
              right: "-16px",
              top: "50%",
              transform: "translateY(-50%)",
              borderLeftColor: "rgba(26, 31, 35, 0.98)",
            }),
            ...(pointerSide === "left" && {
              left: "-16px",
              top: "50%",
              transform: "translateY(-50%)",
              borderRightColor: "rgba(26, 31, 35, 0.98)",
            }),
            ...(pointerSide === "bottom" && {
              bottom: "-16px",
              left: "50%",
              transform: "translateX(-50%)",
              borderTopColor: "rgba(26, 31, 35, 0.98)",
            }),
            ...(pointerSide === "top" && {
              top: "-16px",
              left: "50%",
              transform: "translateX(-50%)",
              borderBottomColor: "rgba(26, 31, 35, 0.98)",
            }),
          }}
          aria-hidden
        />
      )}
    </div>
  );
}
