"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { COLORS } from "@/lib/colors";
import {
  Loader2,
  ChevronDown,
  ChevronRight,
  Play,
  Dumbbell,
} from "lucide-react";
import { isYouTubeUrl } from "@/lib/youtube-utils";
import { extractYouTubeVideoId } from "@/lib/youtube";

interface MasterProgramViewerProps {
  isOpen: boolean;
  onClose: () => void;
  programId: string;
}

export default function MasterProgramViewer({
  isOpen,
  onClose,
  programId,
}: MasterProgramViewerProps) {
  const router = useRouter();
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [expandedRoutines, setExpandedRoutines] = useState<Set<string>>(new Set());

  const handleVideoClick = (videoId: string | null, videoUrl: string) => {
    if (videoId) {
      // Navigate to library with master tab active and specific video ID
      router.push(`/library?tab=master&videoId=${videoId}`);
    } else {
      // Fallback: just navigate to master library tab
      router.push("/library?tab=master");
    }
    onClose(); // Close the modal
  };

  // Fetch full program details
  const {
    data: program,
    isLoading,
    error,
  } = trpc.programs.getMasterLibraryById.useQuery(
    { programId },
    { 
      enabled: isOpen && !!programId,
      retry: 1,
    }
  );

  // Log errors when they occur
  useEffect(() => {
    if (error) {
      console.error("Error loading master library program:", error);
    }
  }, [error]);

  // Auto-expand all weeks, days, and routines when program loads
  useEffect(() => {
    if (program?.weeks) {
      const allWeekIds = new Set(program.weeks.map((w) => w.id));
      setExpandedWeeks(allWeekIds);

      const allDayIds = new Set<string>();
      const allRoutineIds = new Set<string>();

      program.weeks.forEach((week) => {
        week.days.forEach((day) => {
          allDayIds.add(day.id);
          // Check for routines in drills
          day.drills.forEach((drill: any) => {
            if (drill.routine?.id) {
              allRoutineIds.add(drill.routine.id);
            }
          });
        });
      });

      setExpandedDays(allDayIds);
      setExpandedRoutines(allRoutineIds);
    }
  }, [program]);

  const toggleWeek = (weekId: string) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekId)) {
        next.delete(weekId);
      } else {
        next.add(weekId);
      }
      return next;
    });
  };

  const toggleDay = (dayId: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) {
        next.delete(dayId);
      } else {
        next.add(dayId);
      }
      return next;
    });
  };

  const toggleRoutine = (routineId: string) => {
    setExpandedRoutines((prev) => {
      const next = new Set(prev);
      if (next.has(routineId)) {
        next.delete(routineId);
      } else {
        next.add(routineId);
      }
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="z-[120] max-w-5xl max-h-[90vh] [&>button]:hidden"
        style={{
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE,
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>
            {program?.title || "Program Details"}
          </DialogTitle>
          <DialogDescription className="text-sm mt-1" style={{ color: COLORS.TEXT_SECONDARY }}>
            {program?.description || "View all exercises and routines in this program"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: COLORS.GOLDEN_ACCENT }} />
            </div>
          ) : error ? (
            <div className="p-8 rounded-lg border text-center" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
              <p style={{ color: COLORS.TEXT_SECONDARY }}>
                Error loading program: {error.message}
              </p>
            </div>
          ) : !program ? (
            <div className="p-8 rounded-lg border text-center" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
              <p style={{ color: COLORS.TEXT_SECONDARY }}>Program not found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Program Info */}
              {program.level && (
                <div className="pb-4 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <span className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>{program.level}</span>
                </div>
              )}

              {/* Weeks */}
              {program.weeks && program.weeks.length > 0 ? (
                <div className="space-y-3">
                  {program.weeks.map((week) => (
                    <div
                      key={week.id}
                      className="rounded-lg border"
                      style={{
                        backgroundColor: COLORS.BACKGROUND_CARD,
                        borderColor: COLORS.BORDER_SUBTLE,
                      }}
                    >
                      {/* Week Header */}
                      <button
                        onClick={() => toggleWeek(week.id)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:opacity-80 transition-opacity"
                        style={{ color: COLORS.TEXT_PRIMARY }}
                      >
                        <div className="flex items-center gap-3">
                          {expandedWeeks.has(week.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span className="font-semibold">
                            Week {week.weekNumber}
                            {week.title && `: ${week.title}`}
                          </span>
                        </div>
                      </button>

                      {expandedWeeks.has(week.id) && week.days && week.days.length > 0 && (
                        <div className="px-4 pb-4 space-y-2">
                          {week.days.map((day) => (
                            <div
                              key={day.id}
                              className="rounded border"
                              style={{
                                backgroundColor: COLORS.BACKGROUND_DARK,
                                borderColor: COLORS.BORDER_SUBTLE,
                              }}
                            >
                              {/* Day Header */}
                              <button
                                onClick={() => toggleDay(day.id)}
                                className="w-full px-3 py-2 flex items-center justify-between hover:opacity-80 transition-opacity"
                                style={{ color: COLORS.TEXT_PRIMARY }}
                              >
                                <div className="flex items-center gap-2">
                                  {expandedDays.has(day.id) ? (
                                    <ChevronDown className="h-3 w-3" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3" />
                                  )}
                                  <span className="text-sm font-medium">
                                    Day {day.dayNumber}
                                    {day.title && `: ${day.title}`}
                                    {day.isRestDay && (
                                      <span className="ml-2 text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                                        (Rest Day)
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </button>

                              {expandedDays.has(day.id) && !day.isRestDay && day.drills && day.drills.length > 0 && (
                                <div className="px-3 pb-3 space-y-2">
                                  {day.drills.map((drill: any, index: number) => {
                                    // Check if this drill has a routine with exercises
                                    if (drill.routineId && drill.routine && drill.routine.exercises && Array.isArray(drill.routine.exercises)) {
                                      return (
                                        <div
                                          key={drill.id || `drill-${index}`}
                                          className="rounded border p-3"
                                          style={{
                                            backgroundColor: COLORS.BACKGROUND_CARD,
                                            borderColor: COLORS.BORDER_SUBTLE,
                                          }}
                                        >
                                          {/* Routine Header */}
                                          <button
                                            onClick={() => toggleRoutine(drill.routine.id)}
                                            className="w-full flex items-center justify-between mb-2 hover:opacity-80 transition-opacity"
                                            style={{ color: COLORS.TEXT_PRIMARY }}
                                          >
                                            <div className="flex items-center gap-2">
                                              {expandedRoutines.has(drill.routine.id) ? (
                                                <ChevronDown className="h-3 w-3" />
                                              ) : (
                                                <ChevronRight className="h-3 w-3" />
                                              )}
                                              <Dumbbell className="h-3 w-3" />
                                              <span className="font-medium text-sm">{drill.title || drill.routine.name}</span>
                                            </div>
                                          </button>

                                          {/* Routine Exercises */}
                                          {expandedRoutines.has(drill.routine.id) && drill.routine.exercises && drill.routine.exercises.length > 0 && (
                                            <div className="ml-6 space-y-2 mt-2">
                                              {drill.routine.exercises.map((exercise: any, exIndex: number) => (
                                                <div
                                                  key={exercise.id || `exercise-${exIndex}`}
                                                  className="rounded p-2 border"
                                                  style={{
                                                    backgroundColor: COLORS.BACKGROUND_DARK,
                                                    borderColor: COLORS.BORDER_SUBTLE,
                                                  }}
                                                >
                                                  <div className="flex items-start gap-3">
                                                    {exercise.videoUrl && (
                                                      <button
                                                        onClick={() => handleVideoClick(exercise.videoId || null, exercise.videoUrl)}
                                                        className="flex-shrink-0 w-20 h-14 rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                                      >
                                                        {isYouTubeUrl(exercise.videoUrl) ? (
                                                          <img
                                                            src={`https://img.youtube.com/vi/${extractYouTubeVideoId(exercise.videoUrl)}/mqdefault.jpg`}
                                                            alt={exercise.title}
                                                            className="w-full h-full object-cover"
                                                          />
                                                        ) : (
                                                          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>
                                                            <Play className="h-4 w-4" style={{ color: COLORS.TEXT_SECONDARY }} />
                                                          </div>
                                                        )}
                                                      </button>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                      <h4 className="font-medium text-sm mb-1" style={{ color: COLORS.TEXT_PRIMARY }}>
                                                        {exercise.title}
                                                      </h4>
                                                      {exercise.description && (
                                                        <p className="text-xs mb-2" style={{ color: COLORS.TEXT_SECONDARY }}>
                                                          {exercise.description}
                                                        </p>
                                                      )}
                                                      <div className="flex flex-wrap gap-3 text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                                                        {exercise.sets && <span>Sets: {exercise.sets}</span>}
                                                        {exercise.reps && <span>Reps: {exercise.reps}</span>}
                                                        {exercise.tempo && <span>Tempo: {exercise.tempo}</span>}
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {expandedRoutines.has(drill.routine.id) && (!drill.routine.exercises || drill.routine.exercises.length === 0) && (
                                            <div className="ml-6 mt-2 text-sm" style={{ color: COLORS.TEXT_MUTED }}>
                                              No exercises found in routine.
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }

                                    // Regular drill/exercise
                                    return (
                                      <div
                                        key={drill.id || `drill-${index}`}
                                        className="rounded p-3 border"
                                        style={{
                                          backgroundColor: COLORS.BACKGROUND_CARD,
                                          borderColor: COLORS.BORDER_SUBTLE,
                                        }}
                                      >
                                        <div className="flex items-start gap-3">
                                          {drill.videoUrl && (
                                            <button
                                              onClick={() => handleVideoClick(drill.videoId || null, drill.videoUrl)}
                                              className="flex-shrink-0 w-20 h-14 rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                            >
                                              {isYouTubeUrl(drill.videoUrl) ? (
                                                <img
                                                  src={`https://img.youtube.com/vi/${extractYouTubeVideoId(drill.videoUrl)}/mqdefault.jpg`}
                                                  alt={drill.title}
                                                  className="w-full h-full object-cover"
                                                />
                                              ) : (
                                                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>
                                                  <Play className="h-4 w-4" style={{ color: COLORS.TEXT_SECONDARY }} />
                                                </div>
                                              )}
                                            </button>
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-sm mb-1" style={{ color: COLORS.TEXT_PRIMARY }}>
                                              {drill.title}
                                            </h4>
                                            {drill.description && (
                                              <p className="text-xs mb-2" style={{ color: COLORS.TEXT_SECONDARY }}>
                                                {drill.description}
                                              </p>
                                            )}
                                            <div className="flex flex-wrap gap-3 text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                                              {drill.sets && <span>Sets: {drill.sets}</span>}
                                              {drill.reps && <span>Reps: {drill.reps}</span>}
                                              {drill.tempo && <span>Tempo: {drill.tempo}</span>}
                                            </div>
                                            {drill.notes && (
                                              <p className="text-xs mt-2 italic" style={{ color: COLORS.TEXT_MUTED }}>
                                                Notes: {drill.notes}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-lg border text-center" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
                  <p style={{ color: COLORS.TEXT_SECONDARY }}>No weeks or exercises found in this program</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

