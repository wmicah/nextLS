"use client";

import React from "react";
import { COLORS, getRedAlert } from "@/lib/colors";
import { CalendarEventData } from "@/types/calendar-events";

interface CalendarEventProps {
  event: CalendarEventData;
  onMouseEnter: (e: React.MouseEvent<HTMLDivElement>, event: CalendarEventData) => void;
  onMouseLeave: () => void;
}

const CalendarEvent = React.memo(({ event, onMouseEnter, onMouseLeave }: CalendarEventProps) => {
  const getEventStyles = () => {
    switch (event.type) {
      case "program-day":
      case "temporary-program":
        return {
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          borderColor: "#3B82F6",
          dotColor: "#3B82F6",
        };
      case "routine":
        if (event.isCompleted) {
          return {
            backgroundColor: "rgba(16, 185, 129, 0.2)",
            borderColor: "#10B981",
            dotColor: "#10B981",
          };
        }
        if (event.isMissed) {
          return {
            backgroundColor: getRedAlert(0.1),
            borderColor: COLORS.RED_ALERT,
            dotColor: COLORS.RED_ALERT,
          };
        }
        return {
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          borderColor: "#10B981",
          dotColor: "#10B981",
        };
      case "lesson":
        // Status-based colors for lessons
        if (event.status === "DECLINED") {
          return {
            backgroundColor: getRedAlert(0.15),
            borderColor: COLORS.RED_ALERT,
            dotColor: COLORS.RED_ALERT,
          };
        }
        return {
          backgroundColor: "rgba(245, 158, 11, 0.2)",
          borderColor: "#F59E0B",
          dotColor: "#F59E0B",
        };
      case "pending-lesson":
        return {
          backgroundColor: "rgba(245, 158, 11, 0.2)",
          borderColor: "#F59E0B",
          dotColor: "#F59E0B",
        };
      case "video":
        return {
          backgroundColor: "rgba(139, 92, 246, 0.2)",
          borderColor: "#8B5CF6",
          dotColor: "#8B5CF6",
        };
      default:
        return {
          backgroundColor: COLORS.BACKGROUND_CARD,
          borderColor: COLORS.BORDER_SUBTLE,
          dotColor: COLORS.TEXT_SECONDARY,
        };
    }
  };

  const styles = getEventStyles();

  return (
    <div
      className="text-[10px] px-1.5 py-0.5 rounded border mb-0.5 flex items-center gap-1 cursor-pointer"
      style={{
        backgroundColor: styles.backgroundColor,
        color: COLORS.TEXT_PRIMARY,
        borderColor: styles.borderColor,
      }}
      onMouseEnter={e => onMouseEnter(e, event)}
      onMouseLeave={onMouseLeave}
    >
      <div
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{
          backgroundColor: styles.dotColor,
        }}
      />
      <span className="truncate">{event.title}</span>
    </div>
  );
});

CalendarEvent.displayName = "CalendarEvent";

export default CalendarEvent;

