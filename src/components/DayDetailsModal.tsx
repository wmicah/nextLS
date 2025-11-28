"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { format } from "date-fns";
import { formatTimeInUserTimezone } from "@/lib/timezone-utils";
import { COLORS, getGoldenAccent } from "@/lib/colors";

interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  lessons: any[];
  programs: any[];
  routineAssignments: any[];
  videoAssignments?: any[];
  onScheduleLesson: () => void;
  onAssignProgram: () => void;
  onAssignRoutine: () => void;
  onAssignVideo: () => void;
  onReplaceWithLesson: (replacementData: any) => void;
  onRemoveProgram?: (programData: any, action: "entire" | "day") => void;
  onRemoveRoutine?: (routineData: any) => void;
  onRemoveLesson?: (lessonData: any) => void;
  onRemoveVideo?: (videoData: any) => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => {
    backgroundColor: string;
    color: string;
    borderColor: string;
  };
}

export default function DayDetailsModal({
  isOpen,
  onClose,
  selectedDate,
  lessons,
  programs,
  routineAssignments,
  videoAssignments = [],
  onScheduleLesson,
  onAssignProgram,
  onAssignRoutine,
  onAssignVideo,
  onReplaceWithLesson,
  onRemoveProgram,
  onRemoveRoutine,
  onRemoveLesson,
  onRemoveVideo,
  getStatusIcon,
  getStatusColor,
}: DayDetailsModalProps) {
  if (!isOpen || !selectedDate) return null;

  const handleReplaceWithLesson = (program: any) => {
    const replacementData = {
      assignmentId: program.assignment.id,
      programId: program.assignment.programId,
      programTitle: program.title,
      dayDate: selectedDate.toISOString().split("T")[0],
    };
    onReplaceWithLesson(replacementData);
  };

  // Check if a program has finished completely
  const isProgramFinished = (programData: any) => {
    if (
      !programData.assignment ||
      !programData.assignment.startDate ||
      !programData.program?.duration
    ) {
      return false; // If we don't have the required data, assume it's not finished
    }

    const startDate = new Date(programData.assignment.startDate);
    const programDurationDays = programData.program.duration * 7; // Convert weeks to days
    const endDate = new Date(
      startDate.getTime() + programDurationDays * 24 * 60 * 60 * 1000
    );

    // Program is finished if current date is past the end date
    return new Date() > endDate;
  };

  const handleRemoveProgram = (program: any, action: "entire" | "day") => {
    if (onRemoveProgram && !isProgramFinished(program)) {
      // Handle different program types
      let programData;

      if (program.isTemporary) {
        // For temporary programs, use replacementId as assignmentId
        programData = {
          assignmentId: program.replacementId,
          programId: program.id, // Use the temporary program ID
          programTitle: program.title,
          dayDate: selectedDate.toISOString().split("T")[0],
          isTemporary: true,
          replacementId: program.replacementId,
        };
      } else {
        // For regular programs, use the assignment data
        programData = {
          assignmentId: program.assignment.id,
          programId: program.assignment.programId,
          programTitle: program.title,
          dayDate: selectedDate.toISOString().split("T")[0],
        };
      }

      onRemoveProgram(programData, action);
    }
  };

  // Check if a routine assignment has finished (date has passed)
  const isRoutineFinished = (assignment: any) => {
    if (!assignment.startDate && !assignment.assignedAt) {
      return false; // If we don't have date data, assume it's not finished
    }

    const assignmentDate = new Date(
      assignment.startDate || assignment.assignedAt
    );
    const today = new Date();

    // Set both dates to start of day for accurate comparison
    const assignmentDay = new Date(
      assignmentDate.getFullYear(),
      assignmentDate.getMonth(),
      assignmentDate.getDate()
    );
    const todayDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    // Routine is finished if the assignment date is in the past
    return assignmentDay < todayDay;
  };

  const handleRemoveRoutine = (assignment: any) => {
    if (onRemoveRoutine && !isRoutineFinished(assignment)) {
      const routineData = {
        assignmentId: assignment.id,
        routineId: assignment.routine.id,
        routineName: assignment.routine.name,
        dayDate: selectedDate.toISOString().split("T")[0],
      };
      onRemoveRoutine(routineData);
    }
  };

  const handleRemoveLesson = (lesson: any) => {
    if (onRemoveLesson) {
      const lessonData = {
        lessonId: lesson.id,
        lessonTitle: lesson.title || "Lesson",
        dayDate: selectedDate.toISOString().split("T")[0],
      };
      onRemoveLesson(lessonData);
    }
  };

  const handleRemoveVideo = (assignment: any) => {
    if (onRemoveVideo) {
      const videoData = {
        assignmentId: assignment.id,
        videoId: assignment.video?.id,
        videoTitle: assignment.video?.title || "Video Assignment",
        dayDate: selectedDate.toISOString().split("T")[0],
      };
      onRemoveVideo(videoData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-lg shadow-xl border w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 p-4 pb-0">
          <div>
            <h2
              className="text-lg font-semibold mb-1"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: COLORS.TEXT_SECONDARY }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor =
                COLORS.BACKGROUND_CARD_HOVER;
              e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pb-4">
          <div className="space-y-4">
            {/* Quick Actions */}
            <div>
              <h3
                className="text-sm font-semibold mb-3"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {/* Schedule Lesson */}
                <button
                  onClick={onScheduleLesson}
                  className="flex items-center justify-center p-3 rounded-lg border transition-all duration-200 cursor-pointer bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/20 hover:border-yellow-500/30"
                >
                  <div className="text-center">
                    <div
                      className="text-xs font-medium"
                      style={{ color: "#F59E0B" }}
                    >
                      Schedule Lesson
                    </div>
                    <div className="text-[10px] text-yellow-600/80">
                      Book a lesson
                    </div>
                  </div>
                </button>

                {/* Assign Program */}
                <button
                  onClick={onAssignProgram}
                  className="flex items-center justify-center p-3 rounded-lg border transition-all duration-200 cursor-pointer bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 hover:border-blue-500/30"
                >
                  <div className="text-center">
                    <div
                      className="text-xs font-medium"
                      style={{ color: "#3B82F6" }}
                    >
                      Assign Program
                    </div>
                    <div className="text-[10px] text-blue-600/80">
                      Start a program
                    </div>
                  </div>
                </button>

                {/* Assign Routine */}
                <button
                  onClick={onAssignRoutine}
                  className="flex items-center justify-center p-3 rounded-lg border transition-all duration-200 cursor-pointer bg-green-500/10 hover:bg-green-500/20 border-green-500/20 hover:border-green-500/30"
                >
                  <div className="text-center">
                    <div
                      className="text-xs font-medium"
                      style={{ color: "#10B981" }}
                    >
                      Assign Routine
                    </div>
                    <div className="text-[10px] text-green-600/80">
                      Assign a routine
                    </div>
                  </div>
                </button>

                {/* Assign Video */}
                <button
                  onClick={onAssignVideo}
                  className="flex items-center justify-center p-3 rounded-lg border transition-all duration-200 cursor-pointer bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20 hover:border-purple-500/30"
                >
                  <div className="text-center">
                    <div
                      className="text-xs font-medium"
                      style={{ color: "#8B5CF6" }}
                    >
                      Assign Video
                    </div>
                    <div className="text-[10px] text-purple-600/80">
                      Assign a video
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Scheduled Items */}
            <div className="space-y-4 pt-2">
              {/* Lessons */}
              {lessons.length > 0 && (
                <div>
                  <h3
                    className="text-sm font-semibold mb-3"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    Lessons
                  </h3>
                  <div className="space-y-2">
                    {lessons.map((lesson: any, index: number) => {
                      const statusStyles = getStatusColor(lesson.status);
                      return (
                        <div
                          key={index}
                          className="p-3 rounded-lg border"
                          style={{
                            backgroundColor: statusStyles.backgroundColor,
                            color: statusStyles.color,
                            borderColor: statusStyles.borderColor,
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div
                                className="text-sm font-medium"
                                style={{ color: COLORS.TEXT_PRIMARY }}
                              >
                                {formatTimeInUserTimezone(lesson.date)}
                              </div>
                              <div
                                className="text-xs"
                                style={{ color: COLORS.TEXT_SECONDARY }}
                              >
                                {lesson.title || "Lesson"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div
                                className="text-[10px]"
                                style={{ color: COLORS.TEXT_MUTED }}
                              >
                                {lesson.status}
                              </div>
                              {onRemoveLesson && (
                                <button
                                  onClick={() => handleRemoveLesson(lesson)}
                                  className="px-2 py-1 rounded text-[10px] font-medium transition-all duration-200"
                                  style={{
                                    backgroundColor: "#EF4444",
                                    color: "#FFFFFF",
                                  }}
                                  title="Remove Lesson"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Programs */}
              {programs.length > 0 && (
                <div>
                  <h3
                    className="text-sm font-semibold mb-3"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    Programs
                  </h3>
                  <div className="space-y-2">
                    {programs.map((program: any, index: number) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg border"
                        style={{
                          backgroundColor: COLORS.BACKGROUND_CARD,
                          borderColor: COLORS.GOLDEN_ACCENT,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div>
                              <div
                                className="text-sm font-medium"
                                style={{ color: COLORS.TEXT_PRIMARY }}
                              >
                                {program.title}
                              </div>
                              <div
                                className="text-xs"
                                style={{ color: COLORS.TEXT_SECONDARY }}
                              >
                                {program.description || "Workout Program"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {onRemoveProgram && !isProgramFinished(program) && (
                              <>
                                <button
                                  onClick={() =>
                                    handleRemoveProgram(program, "entire")
                                  }
                                  className="px-2 py-1 rounded text-[10px] font-medium transition-all duration-200"
                                  style={{
                                    backgroundColor: "#EF4444",
                                    color: "#FFFFFF",
                                  }}
                                  title="Remove entire program from client"
                                >
                                  Remove Entire
                                </button>
                                <button
                                  onClick={() =>
                                    handleRemoveProgram(program, "day")
                                  }
                                  className="px-2 py-1 rounded text-[10px] font-medium transition-all duration-200"
                                  style={{
                                    backgroundColor: "#F59E0B",
                                    color: "#FFFFFF",
                                  }}
                                  title="Remove just this program day"
                                >
                                  Remove Day
                                </button>
                              </>
                            )}
                            {onRemoveProgram && isProgramFinished(program) && (
                              <div
                                className="px-2 py-1 rounded text-[10px] font-medium opacity-60"
                                style={{
                                  backgroundColor: "#6B7280",
                                  color: "#9CA3AF",
                                }}
                                title="Program has finished - cannot be removed"
                              >
                                Finished
                              </div>
                            )}
                            <button
                              onClick={() => handleReplaceWithLesson(program)}
                              className="px-2 py-1 rounded text-[10px] font-medium transition-all duration-200 hover:bg-opacity-80"
                              style={{
                                backgroundColor: "#10B981",
                                color: "#000000",
                              }}
                              title="Replace workout with lesson"
                            >
                              Replace with Lesson
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Routine Assignments */}
              {routineAssignments.length > 0 && (
                <div>
                  <h3
                    className="text-sm font-semibold mb-3"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    Routine Assignments
                  </h3>
                  <div className="space-y-2">
                    {routineAssignments.map(
                      (assignment: any, index: number) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg border transition-all duration-200"
                          style={{
                            backgroundColor: COLORS.BACKGROUND_CARD,
                            borderColor: COLORS.GREEN_PRIMARY,
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div>
                                <div
                                  className="text-sm font-medium"
                                  style={{ color: COLORS.TEXT_PRIMARY }}
                                >
                                  {assignment.routine.name}
                                </div>
                                <div
                                  className="text-xs"
                                  style={{ color: COLORS.TEXT_SECONDARY }}
                                >
                                  {assignment.routine.description ||
                                    "No description"}
                                </div>
                                <div
                                  className="text-[10px] mt-1"
                                  style={{ color: COLORS.TEXT_MUTED }}
                                >
                                  Assigned{" "}
                                  {format(
                                    new Date(
                                      assignment.startDate ||
                                        assignment.assignedAt
                                    ),
                                    "MMM dd, yyyy"
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div
                                  className="text-sm font-bold"
                                  style={{ color: COLORS.GREEN_PRIMARY }}
                                >
                                  {assignment.progress}%
                                </div>
                                <div
                                  className="text-[10px]"
                                  style={{ color: COLORS.TEXT_MUTED }}
                                >
                                  Progress
                                </div>
                              </div>
                              {onRemoveRoutine &&
                                !isRoutineFinished(assignment) && (
                                  <button
                                    onClick={() =>
                                      handleRemoveRoutine(assignment)
                                    }
                                    className="px-2 py-1 rounded text-[10px] font-medium transition-all duration-200"
                                    style={{
                                      backgroundColor: "#EF4444",
                                      color: "#FFFFFF",
                                    }}
                                    title="Remove Routine"
                                  >
                                    Remove
                                  </button>
                                )}
                              {onRemoveRoutine &&
                                isRoutineFinished(assignment) && (
                                  <div
                                    className="px-2 py-1 rounded text-[10px] font-medium border opacity-60"
                                    style={{
                                      backgroundColor: "#6B7280",
                                      color: "#9CA3AF",
                                      borderColor: "#4B5563",
                                    }}
                                    title="Routine has finished - cannot be removed"
                                  >
                                    Finished
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Video Assignments */}
              {videoAssignments.length > 0 && (
                <div>
                  <h3
                    className="text-sm font-semibold mb-3"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    Video Assignments
                  </h3>
                  <div className="space-y-2">
                    {videoAssignments.map((assignment: any, index: number) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg border transition-all duration-200"
                        style={{
                          backgroundColor: COLORS.BACKGROUND_CARD,
                          borderColor: COLORS.BORDER_SUBTLE,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div>
                              <div
                                className="text-sm font-medium"
                                style={{ color: COLORS.TEXT_PRIMARY }}
                              >
                                {assignment.title}
                              </div>
                              <div
                                className="text-xs"
                                style={{ color: COLORS.TEXT_SECONDARY }}
                              >
                                {assignment.description || "Video to complete"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {onRemoveVideo && (
                              <button
                                onClick={() => handleRemoveVideo(assignment)}
                                className="px-2 py-1 rounded text-[10px] font-medium transition-all duration-200 border"
                                style={{
                                  backgroundColor: "#EF4444",
                                  color: "#FFFFFF",
                                  borderColor: "#DC2626",
                                }}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State - Only show if absolutely nothing is scheduled */}
              {lessons.length === 0 &&
                programs.length === 0 &&
                routineAssignments.length === 0 &&
                videoAssignments.length === 0 && (
                  <div className="text-center py-6">
                    <div className="space-y-2">
                      <div
                        className="text-sm font-semibold"
                        style={{ color: COLORS.TEXT_PRIMARY }}
                      >
                        No items scheduled for this day
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
