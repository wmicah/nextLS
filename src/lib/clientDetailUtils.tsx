"use client";

import React from "react";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { COLORS, getRedAlert } from "@/lib/colors";

/**
 * Get status icon component for lesson status
 */
export function getStatusIcon(status: string): React.ReactNode {
  switch (status) {
    case "CONFIRMED":
      return (
        <CheckCircle
          className="h-4 w-4"
          style={{ color: COLORS.GREEN_PRIMARY }}
        />
      );
    case "DECLINED":
      return (
        <XCircle className="h-4 w-4" style={{ color: COLORS.RED_ALERT }} />
      );
    case "PENDING":
      return (
        <AlertCircle
          className="h-4 w-4"
          style={{ color: COLORS.GOLDEN_ACCENT }}
        />
      );
    default:
      return null;
  }
}

/**
 * Get status color styles for lesson status
 */
export function getStatusColor(status: string): {
  backgroundColor: string;
  color: string;
  borderColor: string;
} {
  switch (status) {
    case "CONFIRMED":
      return {
        backgroundColor: "rgba(245, 158, 11, 0.2)",
        color: COLORS.TEXT_PRIMARY,
        borderColor: "#F59E0B",
      };
    case "DECLINED":
      return {
        backgroundColor: getRedAlert(0.15),
        color: COLORS.TEXT_PRIMARY,
        borderColor: COLORS.RED_ALERT,
      };
    case "PENDING":
      return {
        backgroundColor: "rgba(245, 158, 11, 0.2)",
        color: COLORS.TEXT_PRIMARY,
        borderColor: "#F59E0B",
      };
    default:
      return {
        backgroundColor: "rgba(245, 158, 11, 0.2)",
        color: COLORS.TEXT_PRIMARY,
        borderColor: "#F59E0B",
      };
  }
}

