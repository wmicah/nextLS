"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { trpc } from "@/app/_trpc/client";
import { useToast } from "@/lib/hooks/use-toast";
import {
  Calendar,
  Users,
  TrendingUp,
  Clock,
  Play,
  CheckCircle,
  BookOpen,
  Target,
  Award,
  Edit3,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  Dumbbell,
} from "lucide-react";

interface Program {
  id: string;
  title: string;
  description: string | null;
  level?: string;
  duration?: number;
  status?: string;
  activeClientCount: number;
  totalWeeks: number;
  createdAt: string;
  updatedAt: string;
  weeks?: ProgramWeek[];
  assignments?: ProgramAssignment[];
}

interface ProgramWeek {
  id: string;
  weekNumber: number;
  title: string;
  description: string | null;
  days: ProgramDay[];
}

interface ProgramDay {
  id: string;
  dayNumber: number;
  title: string;
  description: string | null;
  isRestDay: boolean;
  drills: ProgramDrill[];
}

interface ProgramDrill {
  id: string;
  order: number;
  title: string;
  description: string | null;
  duration: string | null;
  videoUrl: string | null;
  notes: string | null;
}

interface ProgramAssignment {
  id: string;
  programId: string;
  clientId: string;
  assignedAt: string;
  startDate: string | null;
  completedAt: string | null;
  progress: number;
  client: {
    id: string;
    name: string;
    email: string | null;
    avatar: string | null;
  };
}

interface MobileProgramDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: Program | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onAssign?: () => void;
}

export default function MobileProgramDetailsModal({
  isOpen,
  onClose,
  program,
  onEdit,
  onDelete,
  onAssign,
}: MobileProgramDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "structure" | "assignments"
  >("overview");
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const { toast } = useToast();

  // Get program details
  const { data: programDetails, isLoading } = trpc.programs.getById.useQuery(
    { id: program?.id || "" },
    { enabled: !!program?.id }
  );

  const toggleWeekExpansion = (weekId: string) => {
    setExpandedWeeks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(weekId)) {
        newSet.delete(weekId);
      } else {
        newSet.add(weekId);
      }
      return newSet;
    });
  };

  const toggleDayExpansion = (dayId: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dayId)) {
        newSet.delete(dayId);
      } else {
        newSet.add(dayId);
      }
      return newSet;
    });
  };

  if (!isOpen || !program) return null;

  const currentProgram = programDetails || program;

  return (
    <div className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-[#2A3133] w-full max-w-md rounded-xl max-h-[90vh] overflow-hidden relative z-[61]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#606364]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#4A5A70] flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white line-clamp-1">
                {currentProgram.title}
              </h2>
              <p className="text-xs text-gray-400">Program Details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#4A5A70] text-[#ABA4AA]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#606364]">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "overview"
                ? "text-[#4A5A70] border-b-2 border-[#4A5A70]"
                : "text-[#ABA4AA] hover:text-[#C3BCC2]"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("structure")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "structure"
                ? "text-[#4A5A70] border-b-2 border-[#4A5A70]"
                : "text-[#ABA4AA] hover:text-[#C3BCC2]"
            }`}
          >
            Structure
          </button>
          <button
            onClick={() => setActiveTab("assignments")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "assignments"
                ? "text-[#4A5A70] border-b-2 border-[#4A5A70]"
                : "text-[#ABA4AA] hover:text-[#C3BCC2]"
            }`}
          >
            Assignments
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[calc(90vh-200px)] overflow-y-auto">
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Program Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#ABA4AA]" />
                  <h3 className="text-sm font-semibold text-[#C3BCC2]">
                    Program Information
                  </h3>
                </div>

                <div className="bg-[#353A3A] border border-[#606364] rounded-lg p-3 space-y-2">
                  <div>
                    <h4 className="text-sm font-semibold text-[#C3BCC2]">
                      Title
                    </h4>
                    <p className="text-sm text-[#ABA4AA]">
                      {currentProgram.title}
                    </p>
                  </div>
                  {currentProgram.description && (
                    <div>
                      <h4 className="text-sm font-semibold text-[#C3BCC2]">
                        Description
                      </h4>
                      <p className="text-sm text-[#ABA4AA]">
                        {currentProgram.description}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded bg-[#4A5A70] text-[#C3BCC2]">
                      {currentProgram.level || "No level"}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-[#F59E0B] text-white">
                      {currentProgram.duration} weeks
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#ABA4AA]" />
                  <h3 className="text-sm font-semibold text-[#C3BCC2]">
                    Statistics
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#353A3A] border border-[#606364] rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-[#4A5A70]">
                      {currentProgram.weeks?.length || 0}
                    </div>
                    <div className="text-xs text-[#ABA4AA]">Total Weeks</div>
                  </div>
                  <div className="bg-[#353A3A] border border-[#606364] rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-[#F59E0B]">
                      {currentProgram.duration || 0}
                    </div>
                    <div className="text-xs text-[#ABA4AA]">
                      Duration (weeks)
                    </div>
                  </div>
                </div>
              </div>

              {/* Created Date */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#ABA4AA]" />
                  <h3 className="text-sm font-semibold text-[#C3BCC2]">
                    Created
                  </h3>
                </div>
                <p className="text-sm text-[#ABA4AA]">
                  {format(new Date(currentProgram.createdAt), "MMM dd, yyyy")}
                </p>
              </div>
            </div>
          )}

          {activeTab === "structure" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-[#ABA4AA]" />
                <h3 className="text-sm font-semibold text-[#C3BCC2]">
                  Program Structure
                </h3>
              </div>

              {currentProgram.weeks && currentProgram.weeks.length > 0 ? (
                <div className="space-y-3">
                  {currentProgram.weeks.map(week => (
                    <div
                      key={week.id}
                      className="bg-[#353A3A] border border-[#606364] rounded-lg"
                    >
                      <button
                        onClick={() => toggleWeekExpansion(week.id)}
                        className="w-full p-3 flex items-center justify-between text-left"
                      >
                        <div>
                          <h4 className="text-sm font-semibold text-[#C3BCC2]">
                            {week.title}
                          </h4>
                          {week.description && (
                            <p className="text-xs text-[#ABA4AA] mt-1">
                              {week.description}
                            </p>
                          )}
                        </div>
                        {expandedWeeks.has(week.id) ? (
                          <ChevronDown className="h-4 w-4 text-[#ABA4AA]" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-[#ABA4AA]" />
                        )}
                      </button>

                      {expandedWeeks.has(week.id) && (
                        <div className="px-3 pb-3 space-y-2">
                          {week.days.map(day => (
                            <div
                              key={day.id}
                              className="bg-[#2A3133] border border-[#606364] rounded-lg"
                            >
                              <button
                                onClick={() => toggleDayExpansion(day.id)}
                                className="w-full p-2 flex items-center justify-between text-left"
                              >
                                <div className="flex items-center gap-2">
                                  <Dumbbell className="h-3 w-3 text-[#ABA4AA]" />
                                  <span className="text-xs text-[#C3BCC2]">
                                    {day.title}
                                  </span>
                                </div>
                                {expandedDays.has(day.id) ? (
                                  <ChevronDown className="h-3 w-3 text-[#ABA4AA]" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 text-[#ABA4AA]" />
                                )}
                              </button>

                              {expandedDays.has(day.id) && (
                                <div className="px-2 pb-2 space-y-1">
                                  {day.drills.map(drill => (
                                    <div
                                      key={drill.id}
                                      className="text-xs text-[#ABA4AA] px-2 py-1"
                                    >
                                      {drill.order}. {drill.title}
                                    </div>
                                  ))}
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
                <div className="text-center py-8">
                  <Target className="h-8 w-8 text-[#ABA4AA] mx-auto mb-2" />
                  <p className="text-sm text-[#ABA4AA]">
                    No structure available
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "assignments" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#ABA4AA]" />
                <h3 className="text-sm font-semibold text-[#C3BCC2]">
                  Client Assignments
                </h3>
              </div>

              <div className="text-center py-8">
                <Users className="h-8 w-8 text-[#ABA4AA] mx-auto mb-2" />
                <p className="text-sm text-[#ABA4AA]">No assignments yet</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#606364] bg-[#353A3A]">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#606364] text-[#ABA4AA] hover:bg-[#4A5A70] transition-colors"
            >
              Close
            </button>
            {onAssign && (
              <button
                onClick={onAssign}
                className="px-4 py-2 rounded-lg bg-[#10B981] text-white hover:bg-[#059669] transition-colors flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Assign
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-4 py-2 rounded-lg bg-[#4A5A70] text-white hover:bg-[#606364] transition-colors flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
