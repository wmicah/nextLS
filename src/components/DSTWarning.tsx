"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Clock, Info } from "lucide-react";
import { getDSTTransitionInfo, isDSTTransition } from "@/lib/dst-utils";

interface DSTWarningProps {
  lessonDate: Date;
  timezone?: string;
  showTransitionInfo?: boolean;
}

export default function DSTWarning({
  lessonDate,
  timezone = "America/New_York",
  showTransitionInfo = false,
}: DSTWarningProps) {
  const [dstInfo, setDstInfo] = useState<{
    springForward: { date: string; time: string; description: string };
    fallBack: { date: string; time: string; description: string };
  } | null>(null);

  const [isAffected, setIsAffected] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  useEffect(() => {
    const year = lessonDate.getFullYear();
    const transitions = getDSTTransitionInfo(year);
    setDstInfo(transitions);

    // Check if the lesson is affected by DST
    const affected = isDSTTransition(lessonDate, timezone);
    setIsAffected(affected);

    if (affected) {
      const lessonDateOnly = new Date(
        lessonDate.getFullYear(),
        lessonDate.getMonth(),
        lessonDate.getDate()
      );
      const fallBackDate = new Date(transitions.fallBack.date);
      const springForwardDate = new Date(transitions.springForward.date);

      if (lessonDateOnly.getTime() === fallBackDate.getTime()) {
        setWarningMessage(
          "⚠️ This lesson is scheduled on DST fall back day. Time will repeat from 2:00 AM to 1:00 AM."
        );
      } else if (lessonDateOnly.getTime() === springForwardDate.getTime()) {
        setWarningMessage(
          "⚠️ This lesson is scheduled on DST spring forward day. Time will jump from 2:00 AM to 3:00 AM."
        );
      }
    }
  }, [lessonDate, timezone]);

  if (!isAffected && !showTransitionInfo) {
    return null;
  }

  return (
    <div className="space-y-3">
      {isAffected && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 dark:bg-amber-900/20 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                Daylight Saving Time Warning
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                {warningMessage}
              </p>
              <div className="text-xs text-amber-600 dark:text-amber-400">
                <p>
                  💡 <strong>Tip:</strong> Consider scheduling for a different
                  day to avoid confusion.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTransitionInfo && dstInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/20 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                DST Transition Dates for {lessonDate.getFullYear()}
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-green-700 dark:text-green-300">
                    <strong>Spring Forward:</strong>{" "}
                    {dstInfo.springForward.date} at {dstInfo.springForward.time}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-orange-700 dark:text-orange-300">
                    <strong>Fall Back:</strong> {dstInfo.fallBack.date} at{" "}
                    {dstInfo.fallBack.time}
                  </span>
                </div>
              </div>
              <div className="mt-3 text-xs text-blue-600 dark:text-blue-400">
                <p>
                  <strong>Note:</strong> {dstInfo.springForward.description}
                </p>
                <p>
                  <strong>Note:</strong> {dstInfo.fallBack.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
