"use client";

import React, { useRef } from "react";
import { COLORS } from "@/lib/colors";
import { HoveredEventState } from "@/types/calendar-events";

interface EventHoverCardProps {
  hoveredEvent: HoveredEventState | null;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const EventHoverCard = React.memo(({ hoveredEvent, onMouseEnter, onMouseLeave }: EventHoverCardProps) => {
  if (!hoveredEvent) return null;

  const { event, triggerRect, placement } = hoveredEvent;

  // Calculate position
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;
  
  const tooltipWidth = 280;
  const tooltipMaxHeight = 250; // Approximate max height of the card
  const gap = 4;

  // Calculate available space
  const spaceBelow = viewportHeight - triggerRect.bottom;
  const spaceAbove = triggerRect.top;
  
  // Check if card would overflow when positioned below
  const wouldOverflowBelow = spaceBelow < tooltipMaxHeight + gap;
  // Check if there's enough space above
  const hasEnoughSpaceAbove = spaceAbove >= tooltipMaxHeight + gap;
  
  // Prefer above if it would overflow below AND there's space above
  // Use the placement from hoveredEvent if available, otherwise calculate
  const finalPlacement = (wouldOverflowBelow && hasEnoughSpaceAbove) ? "top" : (placement || "bottom");

  // Horizontal positioning - center on trigger, but keep within viewport
  let left = triggerRect.left + triggerRect.width / 2;
  left = Math.max(
    tooltipWidth / 2 + 8,
    Math.min(left, viewportWidth - tooltipWidth / 2 - 8)
  );

  // Vertical positioning
  const finalTop = finalPlacement === "top"
    ? triggerRect.top - gap
    : triggerRect.bottom + gap;

  const getEventColor = () => {
    switch (event.type) {
      case "program-day":
      case "temporary-program":
        return {
          accent: "#3B82F6",
        };
      case "routine":
        return {
          accent: "#10B981",
        };
      case "lesson":
      case "pending-lesson":
        return {
          accent: "#F59E0B",
        };
      case "video":
        return {
          accent: "#8B5CF6",
        };
      default:
        return {
          accent: COLORS.TEXT_SECONDARY,
        };
    }
  };

  const colors = getEventColor();
  const itemType = event.type === "program-day" || event.type === "temporary-program" ? "drill" : "exercise";

  return (
    <div
      className="fixed z-50 pointer-events-auto"
      style={{
        opacity: 1, // Start visible, no fade-in animation to prevent flicker
        transformOrigin: finalPlacement === "top" ? "center bottom" : "center top",
        left: `${left}px`,
        top: `${finalTop}px`,
        transform: `translate(-50%, ${finalPlacement === "top" ? "calc(-100% - 4px)" : "4px"})`,
        maxWidth: `${tooltipWidth}px`,
        width: "max-content",
        transition: "opacity 0.1s ease-out, transform 0.1s ease-out", // Smooth transition when switching events
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className="rounded-lg border"
        style={{
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE,
          borderLeft: `3px solid ${colors.accent}`,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Header */}
        <div
          className="px-2.5 py-1.5 border-b"
          style={{
            borderColor: COLORS.BORDER_SUBTLE,
            backgroundColor: COLORS.BACKGROUND_DARK,
          }}
        >
          <div className="flex-1 min-w-0">
            <div
              className="text-xs font-semibold"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              {event.title}
            </div>
            {event.items && event.items.length > 0 && (
              <div
                className="text-[10px] mt-0.5"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                {event.items.length} {itemType}
                {event.items.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>

        {/* Items List */}
        {event.items && event.items.length > 0 && (
          <div
            className="max-h-[180px] overflow-y-auto p-1.5"
            style={{
              backgroundColor: COLORS.BACKGROUND_DARK,
            }}
          >
            <div className="space-y-0.5">
              {event.items.map((item, index) => (
                <div
                  key={index}
                  className="px-1.5 py-1"
                >
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[10px]"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      {item.title}
                    </div>
                    {(item.sets || item.reps) && (
                      <div
                        className="text-[9px] mt-0.5"
                        style={{ color: COLORS.TEXT_SECONDARY }}
                      >
                        {item.sets && item.reps
                          ? `${item.sets} sets × ${item.reps} reps`
                          : item.sets
                          ? `${item.sets} sets`
                          : `${item.reps} reps`}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description if no items */}
        {(!event.items || event.items.length === 0) && event.description && (
          <div
            className="px-2.5 py-2 text-[10px]"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            {event.description}
          </div>
        )}
      </div>
    </div>
  );
});

EventHoverCard.displayName = "EventHoverCard";

export default EventHoverCard;

