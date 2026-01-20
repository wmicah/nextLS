"use client";

import React from "react";
import { trpc } from "@/app/_trpc/client";
import { COLORS } from "@/lib/colors";
import { ChevronRight } from "lucide-react";

interface DrillItemComponentProps {
  item: {
    title: string;
    sets?: number;
    reps?: number;
    routineId?: string;
    id?: string;
  };
  itemId: string;
  isExpanded: boolean;
  onToggle: () => void;
  type: "program" | "routine";
  routineCache: Map<string, any>;
  setRoutineCache: React.Dispatch<React.SetStateAction<Map<string, any>>>;
}

export default function DrillItemComponent({
  item,
  itemId,
  isExpanded,
  onToggle,
  type,
  routineCache,
  setRoutineCache,
}: DrillItemComponentProps) {
  const hasRoutine = !!item.routineId;
  const routineId = item.routineId;
  const cachedRef = React.useRef<string | null>(null);

  // Fetch routine data if drill has a routineId and we don't have it cached
  const isCached = routineId ? routineCache.has(routineId) : false;
  const { data: routineData, isLoading: isLoadingRoutine } =
    trpc.routines.get.useQuery(
      { id: routineId || "" },
      {
        enabled: hasRoutine && !!routineId && !isCached,
      }
    );

  // Cache routine data when it's fetched (only once per routineId)
  React.useEffect(() => {
    if (routineData && routineId && cachedRef.current !== routineId) {
      cachedRef.current = routineId;
      setRoutineCache(prev => {
        // Only update if not already in cache
        if (prev.has(routineId)) {
          return prev;
        }
        const newCache = new Map(prev);
        newCache.set(routineId, routineData);
        return newCache;
      });
    }
  }, [routineData, routineId, setRoutineCache]);

  // Use cached data if available
  const routine = routineId ? routineCache.get(routineId) || routineData : null;
  const exercises = routine?.exercises || [];

  return (
    <div
      className="rounded border"
      style={{
        backgroundColor: COLORS.BACKGROUND_CARD,
        borderColor: COLORS.BORDER_SUBTLE,
        borderLeft: `3px solid ${type === "program" ? "#3B82F6" : "#10B981"}`,
      }}
    >
      <div className="px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            {hasRoutine && (
              <button
                onClick={onToggle}
                className="p-1 rounded transition-colors"
                style={{ color: COLORS.TEXT_SECONDARY }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                }}
              >
                <div
                  className="transition-transform duration-200 ease-in-out"
                  style={{
                    transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                  }}
                >
                  <ChevronRight className="h-3 w-3" />
                </div>
              </button>
            )}
            <div className="flex-1">
              <div
                className="text-sm font-medium"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {item.title}
              </div>
              {(item.sets || item.reps) && (
                <div
                  className="text-xs mt-1"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  {item.sets && item.reps
                    ? `${item.sets} sets × ${item.reps} reps`
                    : item.sets
                    ? `${item.sets} sets`
                    : `${item.reps} reps`}
                </div>
              )}
              {hasRoutine && (
                <div
                  className="text-xs mt-1"
                  style={{ color: COLORS.GREEN_PRIMARY }}
                >
                  Routine: {routine?.name || "Loading..."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Show routine exercises when expanded */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isExpanded && hasRoutine ? "1000px" : "0px",
          opacity: isExpanded && hasRoutine ? 1 : 0,
        }}
      >
        {hasRoutine && (
          <div
            className="px-3 pb-2 pt-0 border-t"
            style={{ borderColor: COLORS.BORDER_SUBTLE }}
          >
            {isLoadingRoutine && !routine ? (
              <div
                className="text-xs py-2"
                style={{ color: COLORS.TEXT_MUTED }}
              >
                Loading routine exercises...
              </div>
            ) : exercises.length > 0 ? (
              <div className="space-y-1.5 mt-2">
                <div
                  className="text-xs font-medium mb-1"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  Exercises:
                </div>
                {exercises.map((exercise: any, exIndex: number) => (
                  <div
                    key={exIndex}
                    className="pl-3 py-1.5 rounded transition-opacity duration-200"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_DARK,
                      opacity: isExpanded ? 1 : 0,
                    }}
                  >
                    <div
                      className="text-xs font-medium"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      {exercise.order}. {exercise.title}
                    </div>
                    {exercise.description && (
                      <div
                        className="text-[10px] mt-0.5"
                        style={{ color: COLORS.TEXT_SECONDARY }}
                      >
                        {exercise.description}
                      </div>
                    )}
                    {(exercise.sets || exercise.reps || exercise.duration) && (
                      <div
                        className="text-[10px] mt-0.5"
                        style={{ color: COLORS.TEXT_MUTED }}
                      >
                        {exercise.sets &&
                          exercise.reps &&
                          `${exercise.sets} sets × ${exercise.reps} reps`}
                        {exercise.duration && ` • ${exercise.duration}`}
                        {exercise.tempo && ` • Tempo: ${exercise.tempo}`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="text-xs py-2"
                style={{ color: COLORS.TEXT_MUTED }}
              >
                No exercises found in routine
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

