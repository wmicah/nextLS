"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CssTooltipProps {
  /** Trigger element (e.g. icon button) */
  children: React.ReactNode;
  /** Tooltip content - shown on hover */
  content: React.ReactNode;
  /** Placement relative to trigger */
  placement?: "top" | "bottom" | "left" | "right";
  /** Optional delay before show (ms) - use CSS variable --tooltip-delay */
  className?: string;
  /** Optional class for the tooltip content wrapper */
  contentClassName?: string;
}

/**
 * CSS-only tooltip: hover (and focus) to show content.
 * Uses transitions, directional arrow, and placement like the
 * [CSS tooltip collection](https://www.sliderrevolution.com/resources/css-tooltip/).
 */
export function CssTooltip({
  children,
  content,
  placement = "bottom",
  className,
  contentClassName,
}: CssTooltipProps) {
  return (
    <div
      className={cn("css-tooltip-wrapper inline-block", className)}
      data-placement={placement}
    >
      <span className="css-tooltip-trigger inline-flex cursor-help">
        {children}
      </span>
      <div
        className={cn(
          "css-tooltip-content rounded-lg border px-4 py-3 text-sm shadow-xl",
          contentClassName
        )}
        role="tooltip"
      >
        {content}
        {/* Arrow via border trick */}
        <span
          className="css-tooltip-arrow absolute w-0 h-0 border-[6px] border-transparent"
          aria-hidden
        />
      </div>
    </div>
  );
}
