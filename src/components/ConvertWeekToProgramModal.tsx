"use client";

import { useState } from "react";
import { X, Loader2, Calendar, BookOpen, Target, Video } from "lucide-react";
import { format } from "date-fns";
import { trpc } from "@/app/_trpc/client";
import { useUIStore } from "@/lib/stores/uiStore";
import { startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";

interface ConvertWeekToProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekStart: Date; // Start of the week (Sunday)
  clientId: string;
  onSuccess?: () => void;
  // Data functions to get assignments for each day
  getLessonsForDate: (date: Date) => any[];
  getProgramsForDate: (date: Date) => any[];
  getRoutineAssignmentsForDate: (date: Date) => any[];
  getVideosForDate: (date: Date) => any[];
}

export default function ConvertWeekToProgramModal({
  isOpen,
  onClose,
  weekStart,
  clientId,
  onSuccess,
  getLessonsForDate,
  getProgramsForDate,
  getRoutineAssignmentsForDate,
  getVideosForDate,
}: ConvertWeekToProgramModalProps) {
  const { addToast } = useUIStore();
  const [programTitle, setProgramTitle] = useState("");
  const [programDescription, setProgramDescription] = useState("");
  const [programLevel, setProgramLevel] = useState<
    "Drive" | "Whip" | "Separation" | "Stability" | "Extension"
  >("Drive");

  const utils = trpc.useUtils();

  // Get all days in the week
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Gather all assignments for the week
  const gatherWeekData = () => {
    const weekData: Array<{
      date: Date;
      dayNumber: number;
      routines: any[];
      programs: any[];
      videos: any[];
      lessons: any[];
    }> = [];

    weekDays.forEach((day, index) => {
      const routines = getRoutineAssignmentsForDate(day);
      const programs = getProgramsForDate(day);
      const videos = getVideosForDate(day);
      const lessons = getLessonsForDate(day); // For reference, won't convert

      weekData.push({
        date: day,
        dayNumber: index + 1,
        routines,
        programs,
        videos,
        lessons,
      });
    });

    return weekData;
  };

  const weekData = gatherWeekData();

  // Helper to get drills from a routine
  // Returns a single drill entry that references the routine (not expanded exercises)
  // Clients will see the exercises, but coaches/programs see it as a routine reference
  const getDrillsFromRoutine = (routineAssignment: any): any[] => {
    // Routine assignments already include the routine with exercises
    const routine = routineAssignment.routine;
    if (!routine) return [];

    // Instead of breaking down into individual exercises, create a single drill entry
    // that references the routine via routineId
    // This way coaches see it as "Routine: [Name]" but clients still see all exercises
    return [
      {
        order: 1, // Will be adjusted when combining with other drills
        title: `Routine: ${routine.name}`,
        description: routine.description || `Complete all exercises in ${routine.name}`,
        routineId: routine.id, // This links the drill to the routine
        type: "routine",
        // Don't include individual exercise details - let the system expand them for clients
      },
    ];
  };

  // Helper to get drills from a program day
  const getDrillsFromProgramDay = (program: any): any[] => {
    if (program.programDay?.drills) {
      return program.programDay.drills.map((drill: any, index: number) => ({
        order: drill.order !== undefined ? drill.order : index + 1,
        title: drill.title || `Drill ${index + 1}`,
        description: drill.description || undefined,
        duration:
          typeof drill.duration === "string"
            ? drill.duration
            : drill.duration?.toString() || undefined,
        videoUrl: drill.videoUrl || undefined,
        notes: drill.notes || undefined,
        sets: drill.sets || undefined,
        reps: drill.reps || undefined,
        tempo: drill.tempo || undefined,
        routineId: drill.routineId || undefined,
        supersetId: drill.supersetId || undefined,
        supersetOrder: drill.supersetOrder || undefined,
        type: drill.type || undefined,
        videoId: drill.videoId || undefined,
        videoTitle: drill.videoTitle || undefined,
        videoThumbnail: drill.videoThumbnail || undefined,
        supersetDescription: drill.supersetDescription || undefined,
        supersetInstructions: drill.supersetInstructions || undefined,
        supersetNotes: drill.supersetNotes || undefined,
        coachInstructionsWhatToDo: drill.coachInstructionsWhatToDo || undefined,
        coachInstructionsHowToDoIt: drill.coachInstructionsHowToDoIt || undefined,
        coachInstructionsKeyPoints: drill.coachInstructionsKeyPoints || undefined,
        coachInstructionsCommonMistakes:
          drill.coachInstructionsCommonMistakes || undefined,
        coachInstructionsEasier: drill.coachInstructionsEasier || undefined,
        coachInstructionsHarder: drill.coachInstructionsHarder || undefined,
        coachInstructionsEquipment:
          drill.coachInstructionsEquipment || undefined,
        coachInstructionsSetup: drill.coachInstructionsSetup || undefined,
      }));
    }
    return [];
  };

  // Helper to create drill from video
  const getDrillFromVideo = (video: any): any => ({
    order: 1,
    title: video.title || "Video Assignment",
    description: video.description || video.assignment?.notes || undefined,
    videoUrl: video.assignment?.video?.url || undefined,
    videoId: video.assignment?.video?.id || undefined,
    videoTitle: video.assignment?.video?.title || video.title || undefined,
    videoThumbnail: video.assignment?.video?.thumbnail || undefined,
    notes: video.assignment?.notes || undefined,
    type: "video",
  });

  // Convert week data to program structure
  const convertWeekToProgram = () => {
    const days = weekData.map((dayData, dayIndex) => {
      const allDrills: any[] = [];
      let orderCounter = 1;

      // Add drills from routines (as routine references, not expanded exercises)
      dayData.routines.forEach((routine) => {
        const drills = getDrillsFromRoutine(routine);
        drills.forEach((drill) => {
          allDrills.push({
            ...drill,
            order: orderCounter++,
          });
        });
      });

      // Add drills from programs
      dayData.programs.forEach((program) => {
        // Skip rest days and empty programs
        if (program.isRestDay || !program.programDay?.drills?.length) return;

        const drills = getDrillsFromProgramDay(program);
        drills.forEach((drill) => {
          allDrills.push({
            ...drill,
            order: orderCounter++,
          });
        });
      });

      // Add drills from videos
      dayData.videos.forEach((video) => {
        const drill = getDrillFromVideo(video);
        allDrills.push({
          ...drill,
          order: orderCounter++,
        });
      });

      // Determine day title
      const dayName = format(dayData.date, "EEEE");
      let dayTitle = dayName;

      // Try to get title from program day if available
      if (dayData.programs.length > 0) {
        const programDay = dayData.programs[0]?.programDay;
        if (programDay?.title) {
          dayTitle = programDay.title;
        }
      }

      // If no drills, mark as rest day
      const isRestDay = allDrills.length === 0;

      return {
        dayNumber: dayData.dayNumber,
        title: isRestDay ? `${dayName} - Rest Day` : dayTitle,
        description: isRestDay
          ? "Recovery day"
          : dayData.programs[0]?.programDay?.description || undefined,
        drills: allDrills,
        isRestDay,
      };
    });

    return {
      title: programTitle || `Week of ${format(weekStart, "MMM d, yyyy")}`,
      description: programDescription || undefined,
      level: programLevel,
      duration: 1, // Always 1 week
      weeks: [
        {
          weekNumber: 1,
          title: `Week of ${format(weekStart, "MMM d")}`,
          description: `Converted from assignments from ${format(weekStart, "MMM d")} to ${format(weekEnd, "MMM d, yyyy")}`,
          days: days,
        },
      ],
    };
  };

  // Create program mutation
  const createProgramMutation = trpc.programs.create.useMutation({
    onSuccess: () => {
      addToast({
        type: "success",
        title: "Program Created!",
        message: "Week has been successfully converted to a program.",
      });
      utils.programs.list.invalidate();
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error) => {
      addToast({
        type: "error",
        title: "Conversion Failed",
        message: error.message || "Failed to convert week to program.",
      });
    },
  });

  const handleConvert = () => {
    if (!programTitle.trim()) {
      addToast({
        type: "error",
        title: "Title Required",
        message: "Please enter a program title.",
      });
      return;
    }

    const programData = convertWeekToProgram();
    createProgramMutation.mutate(programData);
  };

  // Calculate totals for preview
  const totals = {
    routines: weekData.reduce((sum, day) => sum + day.routines.length, 0),
    programs: weekData.reduce((sum, day) => sum + day.programs.length, 0),
    videos: weekData.reduce((sum, day) => sum + day.videos.length, 0),
    lessons: weekData.reduce((sum, day) => sum + day.lessons.length, 0),
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-2xl shadow-xl border w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 p-6 pb-0">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Convert Week to Program
            </h2>
            <p className="text-sm" style={{ color: "#ABA4AA" }}>
              {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-6">
          {/* Preview */}
          <div className="p-4 rounded-lg border" style={{ borderColor: "#606364" }}>
            <h3 className="text-lg font-semibold text-white mb-4">Week Preview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-400" />
                <span className="text-white">{totals.routines} Routines</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-400" />
                <span className="text-white">{totals.programs} Programs</span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-purple-400" />
                <span className="text-white">{totals.videos} Videos</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-yellow-400" />
                <span className="text-white">{totals.lessons} Lessons</span>
                <span className="text-xs" style={{ color: "#ABA4AA" }}>
                  (skipped)
                </span>
              </div>
            </div>
          </div>

          {/* Program Details Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Program Title *
              </label>
              <input
                type="text"
                value={programTitle}
                onChange={(e) => setProgramTitle(e.target.value)}
                placeholder="e.g., Client Week Program"
                className="w-full px-4 py-2 rounded-lg border text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: "#1F2323",
                  borderColor: "#606364",
                }}
                maxLength={60}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Description (Optional)
              </label>
              <textarea
                value={programDescription}
                onChange={(e) => setProgramDescription(e.target.value)}
                placeholder="Optional description for this program"
                rows={3}
                className="w-full px-4 py-2 rounded-lg border text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: "#1F2323",
                  borderColor: "#606364",
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Level *
              </label>
              <select
                value={programLevel}
                onChange={(e) =>
                  setProgramLevel(
                    e.target.value as
                      | "Drive"
                      | "Whip"
                      | "Separation"
                      | "Stability"
                      | "Extension"
                  )
                }
                className="w-full px-4 py-2 rounded-lg border text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: "#1F2323",
                  borderColor: "#606364",
                }}
              >
                <option value="Drive">Drive</option>
                <option value="Whip">Whip</option>
                <option value="Separation">Separation</option>
                <option value="Stability">Stability</option>
                <option value="Extension">Extension</option>
              </select>
            </div>
          </div>

          {/* Day-by-Day Preview */}
          <div className="p-4 rounded-lg border" style={{ borderColor: "#606364" }}>
            <h3 className="text-lg font-semibold text-white mb-4">Day Breakdown</h3>
            <div className="space-y-2 text-sm">
              {weekData.map((day, index) => {
                // Count routines as 1 drill each (routine reference)
                // Count programs and videos as individual drills
                const totalDrills =
                  day.routines.length + // Each routine is 1 drill reference
                  day.programs.reduce(
                    (sum, p) =>
                      sum + (p.isRestDay ? 0 : getDrillsFromProgramDay(p).length),
                    0
                  ) +
                  day.videos.length;

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded"
                    style={{ backgroundColor: "#1F2323" }}
                  >
                    <span className="text-white">
                      {format(day.date, "EEEE, MMM d")}
                    </span>
                    <span className="text-gray-400">
                      {totalDrills > 0
                        ? `${totalDrills} drill${totalDrills !== 1 ? "s" : ""}`
                        : "Rest day"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: "#606364" }}>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-700"
              style={{ color: "#C3BCC2" }}
            >
              Cancel
            </button>
            <button
              onClick={handleConvert}
              disabled={createProgramMutation.isPending || !programTitle.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{ backgroundColor: "#4A5A70", color: "#FFFFFF" }}
            >
              {createProgramMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Converting...
                </>
              ) : (
                "Convert to Program"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

