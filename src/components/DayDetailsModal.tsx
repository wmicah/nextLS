"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  BookOpen,
  Target,
  X,
  Zap,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { formatTimeInUserTimezone } from "@/lib/timezone-utils";

interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  lessons: any[];
  programs: any[];
  routineAssignments: any[];
  onScheduleLesson: () => void;
  onAssignProgram: () => void;
  onAssignRoutine: () => void;
  onReplaceWithLesson: (replacementData: any) => void;
  onRemoveProgram?: (programData: any) => void;
  onRemoveRoutine?: (routineData: any) => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
}

export default function DayDetailsModal({
  isOpen,
  onClose,
  selectedDate,
  lessons,
  programs,
  routineAssignments,
  onScheduleLesson,
  onAssignProgram,
  onAssignRoutine,
  onReplaceWithLesson,
  onRemoveProgram,
  onRemoveRoutine,
  getStatusIcon,
  getStatusColor,
}: DayDetailsModalProps) {
  if (!isOpen || !selectedDate) return null;

  const handleReplaceWithLesson = (program: any) => {
    const replacementData = {
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

  const handleRemoveProgram = (program: any) => {
    if (onRemoveProgram && !isProgramFinished(program)) {
      const programData = {
        assignmentId: program.assignment.id,
        programId: program.assignment.programId,
        programTitle: program.title,
        dayDate: selectedDate.toISOString().split("T")[0],
      };
      onRemoveProgram(programData);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-2xl shadow-xl border w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 p-6 pb-0">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <div className="space-y-6">
            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Schedule Lesson */}
                <button
                  onClick={onScheduleLesson}
                  className="flex items-center gap-3 p-4 rounded-lg border transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/20 hover:border-yellow-500/30"
                >
                  <Calendar className="h-6 w-6" style={{ color: "#F59E0B" }} />
                  <div className="text-left">
                    <div className="font-medium" style={{ color: "#F59E0B" }}>
                      Schedule Lesson
                    </div>
                    <div className="text-sm text-yellow-600/80">
                      Book a lesson for this day
                    </div>
                  </div>
                </button>

                {/* Assign Program */}
                <button
                  onClick={onAssignProgram}
                  className="flex items-center gap-3 p-4 rounded-lg border transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 hover:border-blue-500/30"
                >
                  <BookOpen className="h-6 w-6" style={{ color: "#3B82F6" }} />
                  <div className="text-left">
                    <div className="font-medium" style={{ color: "#3B82F6" }}>
                      Assign Program
                    </div>
                    <div className="text-sm text-blue-600/80">
                      Start a program on this day
                    </div>
                  </div>
                </button>

                {/* Assign Routine */}
                <button
                  onClick={onAssignRoutine}
                  className="flex items-center gap-3 p-4 rounded-lg border transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer bg-green-500/10 hover:bg-green-500/20 border-green-500/20 hover:border-green-500/30"
                >
                  <Target className="h-6 w-6" style={{ color: "#10B981" }} />
                  <div className="text-left">
                    <div className="font-medium" style={{ color: "#10B981" }}>
                      Assign Routine
                    </div>
                    <div className="text-sm text-green-600/80">
                      Assign a routine for this day
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Scheduled Items */}
            <div className="space-y-6 pt-2">
              {/* Lessons */}
              {lessons.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Lessons
                  </h3>
                  <div className="space-y-3">
                    {lessons.map((lesson: any, index: number) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 ${getStatusColor(
                          lesson.status
                        )}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {formatTimeInUserTimezone(lesson.date)}
                            </div>
                            <div className="text-sm opacity-80">
                              {lesson.title || "Lesson"}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(lesson.status)}
                            <div className="text-xs">{lesson.status}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Programs */}
              {programs.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Programs
                  </h3>
                  <div className="space-y-3">
                    {programs.map((program: any, index: number) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg bg-blue-500/20 text-blue-100 border border-blue-400"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{program.title}</div>
                              <div className="text-sm opacity-80">
                                {program.description || "Workout Program"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {onRemoveProgram && !isProgramFinished(program) && (
                              <button
                                onClick={() => handleRemoveProgram(program)}
                                className="px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center gap-1"
                                style={{
                                  backgroundColor: "#EF4444",
                                  color: "#FFFFFF",
                                }}
                                title="Remove Program"
                              >
                                <Trash2 className="h-3 w-3" />
                                Remove Program
                              </button>
                            )}
                            {onRemoveProgram && isProgramFinished(program) && (
                              <div
                                className="px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 opacity-60"
                                style={{
                                  backgroundColor: "#6B7280",
                                  color: "#9CA3AF",
                                }}
                                title="Program has finished - cannot be removed"
                              >
                                <Trash2 className="h-3 w-3" />
                                Program Finished
                              </div>
                            )}
                            <button
                              onClick={() => handleReplaceWithLesson(program)}
                              className="px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 hover:bg-opacity-80"
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
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Routine Assignments
                  </h3>
                  <div className="space-y-3">
                    {routineAssignments.map(
                      (assignment: any, index: number) => (
                        <div
                          key={index}
                          className="p-4 rounded-lg bg-green-500/5 text-green-100 border border-green-500/20 transition-all duration-200 hover:bg-green-500/10"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-green-500/10">
                                <Target className="h-4 w-4 text-green-400" />
                              </div>
                              <div>
                                <div className="font-medium text-green-100">
                                  {assignment.routine.name}
                                </div>
                                <div className="text-sm text-green-200/80">
                                  {assignment.routine.description ||
                                    "No description"}
                                </div>
                                <div className="text-xs text-green-200/60 mt-1">
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
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-lg font-bold text-green-100">
                                  {assignment.progress}%
                                </div>
                                <div className="text-xs text-green-200/60">
                                  Progress
                                </div>
                              </div>
                              {onRemoveRoutine &&
                                !isRoutineFinished(assignment) && (
                                  <button
                                    onClick={() =>
                                      handleRemoveRoutine(assignment)
                                    }
                                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
                                    style={{
                                      backgroundColor: "#EF4444",
                                      color: "#FFFFFF",
                                    }}
                                    title="Remove Routine"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Remove
                                  </button>
                                )}
                              {onRemoveRoutine &&
                                isRoutineFinished(assignment) && (
                                  <div
                                    className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border opacity-60"
                                    style={{
                                      backgroundColor: "#6B7280",
                                      color: "#9CA3AF",
                                      borderColor: "#4B5563",
                                    }}
                                    title="Routine has finished - cannot be removed"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Routine Finished
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

              {/* Empty State - Only show if absolutely nothing is scheduled */}
              {lessons.length === 0 &&
                programs.length === 0 &&
                routineAssignments.length === 0 && (
                  <div className="text-center py-8">
                    <div className="space-y-4">
                      <div className="text-lg font-semibold text-white">
                        No items scheduled for this day
                      </div>
                      <div className="flex justify-center gap-4"></div>
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
