"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  MoreVertical,
  Copy,
  Scissors,
  Trash2,
  Zap,
  GripVertical,
  Settings,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DayColumn from "./DayColumn";
import { useSelectionStore } from "@/lib/stores/selectionStore";
import { useClipboardStore } from "@/lib/stores/clipboardStore";
import { useUIStore } from "@/lib/stores/uiStore";
import { trpc } from "@/app/_trpc/client";
import LoadingSpinner from "@/components/common/LoadingSpinner";

interface WeekPlannerProps {
  program: any;
  currentWeek: number;
  selectedDays: string[];
  setSelectedDays: (days: string[]) => void;
}

const DAYS_OF_WEEK = [
  { number: 1, name: "Monday" },
  { number: 2, name: "Tuesday" },
  { number: 3, name: "Wednesday" },
  { number: 4, name: "Thursday" },
  { number: 5, name: "Friday" },
  { number: 6, name: "Saturday" },
  { number: 7, name: "Sunday" },
];

// Compact Draggable Exercise Component for Grid View
function DraggableExercise({
  exercise,
  dayNumber,
}: {
  exercise: any;
  dayNumber: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: exercise.id,
    transition: {
      duration: 200,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
    opacity: isDragging ? 0.8 : 1,
    scale: isDragging ? 1.05 : 1,
    zIndex: isDragging ? 1000 : "auto",
    boxShadow: isDragging ? "0 20px 40px rgba(0, 0, 0, 0.3)" : "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-700/50 rounded p-2 cursor-grab active:cursor-grabbing border transition-all duration-200 ease-out ${
        isDragging
          ? "border-blue-400 shadow-lg scale-105"
          : "border-gray-600 hover:border-gray-500 hover:shadow-md"
      }`}
    >
      <div className="flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="p-1 rounded hover:bg-gray-600/50 text-gray-400 hover:text-gray-300 transition-colors duration-150"
        >
          <GripVertical className="h-3 w-3" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white font-medium truncate">
            {exercise.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {exercise.sets && exercise.sets > 0 && (
              <span className="text-xs text-gray-400">{exercise.sets}s</span>
            )}
            {exercise.reps && exercise.reps > 0 && (
              <span className="text-xs text-gray-400">{exercise.reps}r</span>
            )}
            {exercise.supersetWithId && (
              <span className="text-xs bg-purple-500/20 text-purple-300 px-1 rounded">
                SS
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Droppable Day Container Component
function DroppableDayContainer({
  dayNumber,
  children,
  isSelected,
}: {
  dayNumber: number;
  children: React.ReactNode;
  isSelected: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-container-${dayNumber}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative rounded-lg border transition-all duration-300 ease-out hover:shadow-lg min-h-[200px] ${
        isSelected
          ? "ring-2 ring-blue-500 border-blue-500 shadow-blue-500/20"
          : isOver
          ? "ring-2 ring-blue-400 border-blue-400 bg-blue-500/10 scale-[1.02] shadow-lg"
          : "border-gray-600 hover:border-gray-500 hover:shadow-gray-500/10"
      }`}
      style={{
        backgroundColor: "#1F2323",
        transform: isOver ? "scale(1.02)" : "scale(1)",
      }}
    >
      {children}
    </div>
  );
}

export default function WeekPlanner({
  program,
  currentWeek,
  selectedDays,
  setSelectedDays,
}: WeekPlannerProps) {
  const { toggleSelectedDay } = useSelectionStore();
  const { clipboard, setClipboard } = useClipboardStore();
  const { addToast } = useUIStore();
  const [showDayMenu, setShowDayMenu] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedExercise, setDraggedExercise] = useState<any>(null);
  const [selectedDayForDetail, setSelectedDayForDetail] = useState<
    number | null
  >(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Add refresh trigger

  const utils = trpc.useUtils();

  // Get the program data directly from the cache to ensure it updates
  const programData = utils.programs.getById.getData({ id: program.id });
  const currentProgram = programData || program;

  const currentWeekData = currentProgram.weeks.find(
    (w: any) => w.weekNumber === currentWeek
  );

  // Force refetch when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      utils.programs.getById.refetch({ id: program.id });
    }
  }, [refreshTrigger, utils.programs.getById, program.id]);

  const handleExerciseAdded = () => {
    console.log("Exercise added, triggering refresh");
    setRefreshTrigger(prev => prev + 1);
  };

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduced from 8 for more responsive dragging
        delay: 100, // Small delay to prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleRestDayMutation = trpc.programs.toggleRestDay.useMutation({
    onSuccess: () => {
      utils.programs.getById.invalidate({ id: program.id });
      addToast({
        type: "success",
        title: "Rest day updated",
        message: "Rest day status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Error",
        message: error.message || "Failed to update rest day status.",
      });
    },
  });

  const updateWeekMutation = trpc.programs.updateWeek.useMutation({
    onSuccess: () => {
      utils.programs.getById.invalidate({ id: program.id });
      addToast({
        type: "success",
        title: "Week updated",
        message: "Week data has been updated successfully.",
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Error",
        message: error.message || "Failed to update week data.",
      });
    },
  });

  const createWeekMutation = trpc.programs.createWeek.useMutation({
    onSuccess: () => {
      utils.programs.getById.invalidate({ id: program.id });
      addToast({
        type: "success",
        title: "Week created",
        message: `Week ${currentWeek} has been created successfully.`,
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Error",
        message: error.message || "Failed to create week.",
      });
    },
  });

  const createDayMutation = trpc.programs.createDay.useMutation({
    onSuccess: () => {
      utils.programs.getById.invalidate({ id: program.id });
      addToast({
        type: "success",
        title: "Day created",
        message: "Day has been created successfully.",
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Error",
        message: error.message || "Failed to create day.",
      });
    },
  });

  const deleteWeekMutation = trpc.programs.deleteWeek.useMutation({
    onSuccess: () => {
      utils.programs.getById.invalidate({ id: program.id });
      addToast({
        type: "success",
        title: "Week deleted",
        message: `Week ${currentWeek} has been deleted successfully.`,
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Error",
        message: error.message || "Failed to delete week.",
      });
    },
  });

  const handleOpenDayDetail = (dayNumber: number) => {
    setSelectedDayForDetail(dayNumber);
  };

  const handleCloseDayDetail = () => {
    setSelectedDayForDetail(null);
  };

  // Helper function to clean data before sending to mutation
  const cleanDaysData = (days: any[]) => {
    return days.map((day: any) => ({
      ...day,
      title: day.title || "",
      description: day.description || "",
      warmupTitle: day.warmupTitle || "",
      warmupDescription: day.warmupDescription || "",
      drills: day.drills.map((drill: any) => ({
        ...drill,
        title: drill.title || "",
        description: drill.description || "",
        duration: drill.duration || "",
        videoUrl: drill.videoUrl || "",
        notes: drill.notes || "",
        tempo: drill.tempo || "",
        supersetWithId: drill.supersetWithId || "",
      })),
    }));
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Ctrl+A for select all implemented days
      if ((event.ctrlKey || event.metaKey) && event.key === "a") {
        event.preventDefault();
        event.stopPropagation();

        // Get all implemented days in the current week (days with actual content)
        const implementedDays =
          currentWeekData?.days
            ?.filter(
              (day: any) =>
                day && !day.isRestDay && day.drills && day.drills.length > 0
            )
            ?.map((day: any) => `${currentWeek}-${day.dayNumber}`) || [];

        if (implementedDays.length > 0) {
          setSelectedDays(implementedDays);
          addToast({
            type: "success",
            title: "Days selected",
            message: `${implementedDays.length} implemented day(s) selected.`,
          });
        } else {
          addToast({
            type: "info",
            title: "No days to select",
            message: "No implemented days found in this week.",
          });
        }
      }

      // Handle Ctrl+V for paste
      if ((event.ctrlKey || event.metaKey) && event.key === "v") {
        event.preventDefault();

        // If there are selected days, paste to the first selected day
        if (selectedDays.length > 0) {
          const firstSelectedDay = selectedDays[0];
          const dayNumber = parseInt(firstSelectedDay.split("-")[1]);
          handleDayMenuClick(dayNumber, "paste");
        } else {
          addToast({
            type: "info",
            title: "No day selected",
            message: "Please select a day first, then press Ctrl+V to paste.",
          });
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedDays,
    clipboard,
    addToast,
    currentWeekData,
    currentWeek,
    setSelectedDays,
  ]);

  if (!currentWeekData) {
    console.log("No week data found for week:", currentWeek);
    return (
      <div className="text-center py-16">
        <div className="text-gray-400 mb-4">No week data found</div>
        <button
          onClick={() => {
            createWeekMutation.mutate({
              programId: program.id,
              weekNumber: currentWeek,
              title: `Week ${currentWeek}`,
              description: "",
            });
          }}
          disabled={createWeekMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 mx-auto disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700 text-white"
        >
          {createWeekMutation.isPending ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {createWeekMutation.isPending
            ? "Creating..."
            : `Create Week ${currentWeek}`}
        </button>
      </div>
    );
  }

  const handleDayClick = (dayNumber: number, event: React.MouseEvent) => {
    const dayId = `${currentWeek}-${dayNumber}`;

    // Handle Ctrl/Cmd+click for multi-select
    if (event.ctrlKey || event.metaKey) {
      toggleSelectedDay(dayId);
    } else {
      // Single click - select only this day
      setSelectedDays([dayId]);
    }
  };

  const handleDayMenuClick = (dayNumber: number, action: string) => {
    const dayId = `${currentWeek}-${dayNumber}`;
    const dayData = currentWeekData.days.find(
      (d: any) => d.dayNumber === dayNumber
    );

    // Close menu immediately for better UX
    setShowDayMenu(null);

    switch (action) {
      case "copy":
        // Handle multiple day selection
        if (selectedDays.length > 1) {
          // Copy all selected days in order
          const selectedDayNumbers = selectedDays
            .map(dayId => parseInt(dayId.split("-")[1]))
            .sort((a, b) => a - b); // Sort by day number to maintain order

          const clipboardData = {
            days: selectedDayNumbers.map(dayNum => {
              const dayData = currentWeekData.days.find(
                (d: any) => d.dayNumber === dayNum
              );
              return {
                dayNumber: dayNum,
                isRest: dayData?.isRestDay || false,
                warmup: dayData?.warmupTitle
                  ? {
                      title: dayData.warmupTitle,
                      description: dayData.warmupDescription,
                    }
                  : undefined,
                items:
                  dayData?.drills?.map((drill: any) => ({
                    id: drill.id,
                    name: drill.title,
                    sets: drill.sets || 0,
                    reps: drill.reps || 0,
                    tempo: drill.tempo || "",
                    supersetWithId: drill.supersetWithId || "",
                  })) || [],
              };
            }),
          };
          setClipboard(clipboardData);
          addToast({
            type: "success",
            title: "Days copied",
            message: `${selectedDayNumbers.length} day(s) have been copied to clipboard.`,
          });
        } else if (dayData) {
          // Single day copy (existing functionality)
          const clipboardData = {
            days: [
              {
                dayNumber: dayNumber,
                isRest: dayData.isRestDay || false,
                warmup: dayData.warmupTitle
                  ? {
                      title: dayData.warmupTitle,
                      description: dayData.warmupDescription,
                    }
                  : undefined,
                items:
                  dayData.drills?.map((drill: any) => ({
                    id: drill.id,
                    name: drill.title,
                    sets: drill.sets || 0,
                    reps: drill.reps || 0,
                    tempo: drill.tempo || "",
                    supersetWithId: drill.supersetWithId || "",
                  })) || [],
              },
            ],
          };
          setClipboard(clipboardData);
          addToast({
            type: "success",
            title: "Day copied",
            message: `Day ${dayNumber} has been copied to clipboard.`,
          });
        }
        break;
      case "cut":
        // Handle multiple day selection
        if (selectedDays.length > 1) {
          // Cut all selected days in order
          const selectedDayNumbers = selectedDays
            .map(dayId => parseInt(dayId.split("-")[1]))
            .sort((a, b) => a - b); // Sort by day number to maintain order

          const clipboardData = {
            days: selectedDayNumbers.map(dayNum => {
              const dayData = currentWeekData.days.find(
                (d: any) => d.dayNumber === dayNum
              );
              return {
                dayNumber: dayNum,
                isRest: dayData?.isRestDay || false,
                warmup: dayData?.warmupTitle
                  ? {
                      title: dayData.warmupTitle,
                      description: dayData.warmupDescription,
                    }
                  : undefined,
                items:
                  dayData?.drills?.map((drill: any) => ({
                    id: drill.id,
                    name: drill.title,
                    sets: drill.sets || 0,
                    reps: drill.reps || 0,
                    tempo: drill.tempo || "",
                    supersetWithId: drill.supersetWithId || "",
                  })) || [],
              };
            }),
          };
          setClipboard(clipboardData);

          // Remove all selected days from the week data
          const updatedDays = currentWeekData.days.filter(
            (d: any) => !selectedDayNumbers.includes(d.dayNumber)
          );

          // Call the update week mutation
          updateWeekMutation.mutate({
            programId: program.id,
            weekNumber: currentWeek,
            days: cleanDaysData(updatedDays),
          });

          addToast({
            type: "success",
            title: "Days cut",
            message: `${selectedDayNumbers.length} day(s) have been cut to clipboard.`,
          });
        } else if (dayData) {
          // Single day cut (existing functionality)
          const clipboardData = {
            days: [
              {
                dayNumber: dayNumber,
                isRest: dayData.isRestDay || false,
                warmup: dayData.warmupTitle
                  ? {
                      title: dayData.warmupTitle,
                      description: dayData.warmupDescription,
                    }
                  : undefined,
                items:
                  dayData.drills?.map((drill: any) => ({
                    id: drill.id,
                    name: drill.title,
                    sets: drill.sets || 0,
                    reps: drill.reps || 0,
                    tempo: drill.tempo || "",
                    supersetWithId: drill.supersetWithId || "",
                  })) || [],
              },
            ],
          };
          setClipboard(clipboardData);

          // Remove the day from the week data
          const updatedDays = currentWeekData.days.filter(
            (d: any) => d.dayNumber !== dayNumber
          );

          // Call the update week mutation
          updateWeekMutation.mutate({
            programId: program.id,
            weekNumber: currentWeek,
            days: cleanDaysData(updatedDays),
          });

          addToast({
            type: "success",
            title: "Day cut",
            message: `Day ${dayNumber} has been cut to clipboard.`,
          });
        }
        break;
      case "delete":
        if (confirm(`Are you sure you want to delete Day ${dayNumber}?`)) {
          // Remove the day from the week data
          const updatedDays = currentWeekData.days.filter(
            (d: any) => d.dayNumber !== dayNumber
          );

          // Call the update week mutation
          updateWeekMutation.mutate({
            programId: program.id,
            weekNumber: currentWeek,
            days: cleanDaysData(updatedDays),
          });

          addToast({
            type: "success",
            title: "Day deleted",
            message: `Day ${dayNumber} has been deleted.`,
          });
        }
        break;
      case "rest":
        if (dayData) {
          toggleRestDayMutation.mutate({
            programId: program.id,
            weekNumber: currentWeek,
            dayNumber: dayNumber,
          });
        } else {
          addToast({
            type: "error",
            title: "Error",
            message: "Day data not found.",
          });
        }
        break;
      case "warmup":
        // TODO: Implement add warmup functionality
        addToast({
          type: "info",
          title: "Add warmup",
          message: "Warmup functionality will be implemented.",
        });
        break;
      case "paste":
        if (clipboard && clipboard.days && clipboard.days.length > 0) {
          // Handle multiple days paste
          if (clipboard.days.length > 1) {
            // Paste multiple days in order
            const updatedDays = [...currentWeekData.days];

            clipboard.days.forEach((clipboardDay: any, index: number) => {
              const targetDayNumber = dayNumber + index; // Paste in order starting from target day

              // Validate clipboard data structure
              if (!clipboardDay.items || !Array.isArray(clipboardDay.items)) {
                addToast({
                  type: "error",
                  title: "Invalid clipboard data",
                  message: "Clipboard data is corrupted or invalid.",
                });
                return;
              }

              // Find or create the target day
              let targetDay = updatedDays.find(
                (d: any) => d.dayNumber === targetDayNumber
              );

              if (!targetDay) {
                // Create new day if it doesn't exist
                targetDay = {
                  id: `day-${currentWeek}-${targetDayNumber}-${Date.now()}-${index}`,
                  dayNumber: targetDayNumber,
                  weekNumber: currentWeek,
                  isRestDay: false,
                  warmupTitle: "",
                  warmupDescription: "",
                  drills: [],
                };
                updatedDays.push(targetDay);
              }

              // Update the day with clipboard data
              const updatedDay = {
                ...targetDay,
                isRestDay: clipboardDay.isRest,
                warmupTitle: clipboardDay.warmup?.title || "",
                warmupDescription: clipboardDay.warmup?.description || "",
                drills: clipboardDay.items.map(
                  (item: any, drillIndex: number) => ({
                    id: `drill-${Date.now()}-${Math.random()
                      .toString(36)
                      .substr(2, 9)}-${index}-${drillIndex}`,
                    title: item.name,
                    description: "",
                    duration: "",
                    videoUrl: "",
                    notes: "",
                    sets: item.sets || 0,
                    reps: item.reps || 0,
                    tempo: item.tempo || "",
                    supersetWithId: item.supersetWithId || "",
                    order: drillIndex + 1,
                  })
                ),
              };

              // Replace the day in the array
              const dayIndex = updatedDays.findIndex(
                (d: any) => d.dayNumber === targetDayNumber
              );
              if (dayIndex !== -1) {
                updatedDays[dayIndex] = updatedDay;
              }
            });

            // Ensure all days have proper default values
            const finalUpdatedDays = updatedDays.map((d: any) => ({
              ...d,
              warmupTitle: d.warmupTitle || "",
              warmupDescription: d.warmupDescription || "",
            }));

            // Sort days by dayNumber
            finalUpdatedDays.sort(
              (a: any, b: any) => a.dayNumber - b.dayNumber
            );

            // Call the update week mutation
            updateWeekMutation.mutate(
              {
                programId: program.id,
                weekNumber: currentWeek,
                days: finalUpdatedDays,
              },
              {
                onSuccess: () => {
                  addToast({
                    type: "success",
                    title: "Days pasted",
                    message: `${clipboard.days.length} day(s) have been pasted in order.`,
                  });
                },
                onError: error => {
                  addToast({
                    type: "error",
                    title: "Paste failed",
                    message: `Failed to paste days: ${error.message}`,
                  });
                },
              }
            );
          } else {
            // Single day paste (existing functionality)
            const clipboardDay = clipboard.days[0];

            // Validate clipboard data structure
            if (!clipboardDay.items || !Array.isArray(clipboardDay.items)) {
              addToast({
                type: "error",
                title: "Invalid clipboard data",
                message: "Clipboard data is corrupted or invalid.",
              });
              break;
            }

            // Find or create the target day
            let targetDay = currentWeekData.days.find(
              (d: any) => d.dayNumber === dayNumber
            );

            if (!targetDay) {
              // Create new day if it doesn't exist
              targetDay = {
                id: `day-${currentWeek}-${dayNumber}-${Date.now()}`,
                dayNumber: dayNumber,
                weekNumber: currentWeek,
                isRestDay: false,
                warmupTitle: "",
                warmupDescription: "",
                drills: [],
              };
            }

            // Update the day with clipboard data
            const updatedDay = {
              ...targetDay,
              isRestDay: clipboardDay.isRest,
              warmupTitle: clipboardDay.warmup?.title || "",
              warmupDescription: clipboardDay.warmup?.description || "",
              drills: clipboardDay.items.map((item: any, index: number) => ({
                id: `drill-${Date.now()}-${Math.random()
                  .toString(36)
                  .substr(2, 9)}-${index}`,
                title: item.name,
                description: "",
                duration: "",
                videoUrl: "",
                notes: "",
                sets: item.sets || 0,
                reps: item.reps || 0,
                tempo: item.tempo || "",
                supersetWithId: item.supersetWithId || "",
                order: index + 1,
              })),
            };

            // Update the week data - ensure all days have proper default values
            const updatedDays = currentWeekData.days
              .filter((d: any) => d.dayNumber !== dayNumber)
              .map((d: any) => ({
                ...d,
                warmupTitle: d.warmupTitle || "",
                warmupDescription: d.warmupDescription || "",
              }));

            updatedDays.push(updatedDay);

            // Sort days by dayNumber
            updatedDays.sort((a: any, b: any) => a.dayNumber - b.dayNumber);

            // Call the update week mutation
            updateWeekMutation.mutate(
              {
                programId: program.id,
                weekNumber: currentWeek,
                days: updatedDays,
              },
              {
                onSuccess: () => {
                  addToast({
                    type: "success",
                    title: "Day pasted",
                    message: `Day ${dayNumber} has been updated with clipboard content.`,
                  });
                },
                onError: error => {
                  addToast({
                    type: "error",
                    title: "Paste failed",
                    message: `Failed to paste day: ${error.message}`,
                  });
                },
              }
            );
          }
        } else {
          addToast({
            type: "error",
            title: "Nothing to paste",
            message: "Clipboard is empty.",
          });
        }
        break;
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    // Find the dragged exercise
    const exerciseId = active.id as string;
    let foundExercise = null;

    for (const day of currentWeekData?.days || []) {
      const exercise = day.drills?.find(
        (drill: any) => drill.id === exerciseId
      );
      if (exercise) {
        foundExercise = { ...exercise, sourceDay: day.dayNumber };
        break;
      }
    }

    setDraggedExercise(foundExercise);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setDraggedExercise(null);

    if (!active || !over || !currentWeekData) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if we're dropping on a day container
    if (overId.startsWith("day-container-")) {
      const targetDayNumber = parseInt(overId.split("-")[2]);

      // Find which day the exercise is from
      let sourceDayNumber = null;
      for (const day of currentWeekData.days) {
        const exercise = day.drills?.find(
          (drill: any) => drill.id === activeId
        );
        if (exercise) {
          sourceDayNumber = day.dayNumber;
          break;
        }
      }

      if (sourceDayNumber && sourceDayNumber !== targetDayNumber) {
        // Move exercise between days
        moveExerciseBetweenDays(activeId, sourceDayNumber, targetDayNumber);
      }
    } else {
      // Reorder within the same day
      let dayNumber = null;
      for (const day of currentWeekData.days) {
        const exercise = day.drills?.find(
          (drill: any) => drill.id === activeId
        );
        if (exercise) {
          dayNumber = day.dayNumber;
          break;
        }
      }

      if (dayNumber) {
        const dayData = currentWeekData.days.find(
          (d: any) => d.dayNumber === dayNumber
        );
        if (dayData) {
          const oldIndex = dayData.drills.findIndex(
            (drill: any) => drill.id === activeId
          );
          const newIndex = dayData.drills.findIndex(
            (drill: any) => drill.id === overId
          );

          if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            reorderExercisesInDay(dayNumber, oldIndex, newIndex);
          }
        }
      }
    }
  };

  const moveExerciseBetweenDays = (
    exerciseId: string,
    sourceDay: number,
    targetDay: number
  ) => {
    const sourceDayData = currentWeekData.days.find(
      (d: any) => d.dayNumber === sourceDay
    );
    const targetDayData = currentWeekData.days.find(
      (d: any) => d.dayNumber === targetDay
    );

    if (!sourceDayData || !targetDayData) return;

    const exercise = sourceDayData.drills.find(
      (drill: any) => drill.id === exerciseId
    );
    if (!exercise) return;

    // Remove from source day
    const updatedSourceDrills = sourceDayData.drills.filter(
      (drill: any) => drill.id !== exerciseId
    );

    // Add to target day
    const updatedTargetDrills = [
      ...targetDayData.drills,
      { ...exercise, order: targetDayData.drills.length + 1 },
    ];

    // Update both days
    const updatedDays = currentWeekData.days.map((day: any) => {
      if (day.dayNumber === sourceDay) {
        return { ...day, drills: updatedSourceDrills };
      }
      if (day.dayNumber === targetDay) {
        return { ...day, drills: updatedTargetDrills };
      }
      return day;
    });

    updateWeekMutation.mutate({
      programId: program.id,
      weekNumber: currentWeek,
      days: cleanDaysData(updatedDays),
    });
  };

  const reorderExercisesInDay = (
    dayNumber: number,
    oldIndex: number,
    newIndex: number
  ) => {
    const dayData = currentWeekData.days.find(
      (d: any) => d.dayNumber === dayNumber
    );
    if (!dayData) return;

    const reorderedDrills = arrayMove(dayData.drills, oldIndex, newIndex);
    const updatedDrills = reorderedDrills.map((drill: any, index: number) => ({
      ...drill,
      order: index + 1,
    }));

    const updatedDays = currentWeekData.days.map((day: any) => {
      if (day.dayNumber === dayNumber) {
        return { ...day, drills: updatedDrills };
      }
      return day;
    });

    updateWeekMutation.mutate({
      programId: program.id,
      weekNumber: currentWeek,
      days: cleanDaysData(updatedDays),
    });
  };

  return (
    <div className="space-y-6">
      {/* Clean Week Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">
            {currentWeekData.title || `Week ${currentWeek}`}
          </h3>
          {currentWeekData.description && (
            <p className="text-gray-400 text-sm mt-1">
              {currentWeekData.description}
            </p>
          )}
        </div>
        {/* Remove Week Button - Clean Design */}
        <button
          onClick={() => {
            if (
              confirm(
                `Are you sure you want to delete Week ${currentWeek}? This will remove all days and exercises in this week.`
              )
            ) {
              deleteWeekMutation.mutate({
                programId: program.id,
                weekNumber: currentWeek,
              });
            }
          }}
          disabled={deleteWeekMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 border border-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Remove Week"
        >
          {deleteWeekMutation.isPending ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          {deleteWeekMutation.isPending ? "Deleting..." : "Remove Week"}
        </button>
      </div>

      {/* Horizontal Week Grid Layout */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
      >
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-4">
            {/* Day Headers */}
            {DAYS_OF_WEEK.map(day => (
              <div key={`header-${day.number}`} className="text-center">
                <h4 className="text-sm font-semibold text-gray-300">
                  {day.name}
                </h4>
              </div>
            ))}

            {/* Day Content */}
            {DAYS_OF_WEEK.map(day => {
              const dayData = currentWeekData?.days?.find(
                (d: any) => d.dayNumber === day.number
              );
              const dayId = `${currentWeek}-${day.number}`;
              const isSelected = selectedDays.includes(dayId);
              const isRestDay = dayData?.isRestDay || false;

              return (
                <DroppableDayContainer
                  key={day.number}
                  dayNumber={day.number}
                  isSelected={isSelected}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between p-3 border-b border-gray-600">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => handleDayClick(day.number, e)}
                        className={`text-sm font-semibold transition-colors ${
                          isSelected ? "text-blue-400" : "text-white"
                        }`}
                      >
                        {day.name}
                      </button>
                      {isRestDay && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30">
                          Rest
                        </span>
                      )}
                    </div>

                    {/* Menu Button */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setShowDayMenu(showDayMenu === dayId ? null : dayId)
                        }
                        className="p-1 rounded hover:bg-gray-700/50 transition-all duration-200"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </button>

                      {/* Day Menu */}
                      {showDayMenu === dayId && (
                        <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border shadow-xl z-20 bg-gray-800 border-gray-600">
                          <div className="p-2">
                            <div className="text-xs font-medium text-gray-400 px-2 py-1">
                              Day Actions
                            </div>
                            <button
                              onClick={() =>
                                handleDayMenuClick(day.number, "rest")
                              }
                              className="flex items-center gap-2 w-full px-2 py-2 text-xs text-white hover:bg-gray-700/50 rounded transition-colors"
                            >
                              <Zap className="h-3 w-3 text-orange-400" />
                              {isRestDay
                                ? "Remove Rest Day"
                                : "Set as Rest Day"}
                            </button>
                            <button
                              onClick={() =>
                                handleDayMenuClick(day.number, "warmup")
                              }
                              className="flex items-center gap-2 w-full px-2 py-2 text-xs text-white hover:bg-gray-700/50 rounded transition-colors"
                            >
                              <Zap className="h-3 w-3 text-yellow-400" />
                              Add Warmup
                            </button>
                            <button
                              onClick={() => {
                                handleOpenDayDetail(day.number);
                                setShowDayMenu(null);
                              }}
                              className="flex items-center gap-2 w-full px-2 py-2 text-xs text-white hover:bg-gray-700/50 rounded transition-colors"
                            >
                              <Settings className="h-3 w-3 text-blue-400" />
                              Edit Day
                            </button>
                            <div className="border-t border-gray-600 my-1" />
                            <div className="text-xs font-medium text-gray-400 px-2 py-1">
                              Clipboard
                            </div>
                            <button
                              onClick={() =>
                                handleDayMenuClick(day.number, "paste")
                              }
                              className="flex items-center gap-2 w-full px-2 py-2 text-xs text-white hover:bg-gray-700/50 rounded transition-colors"
                            >
                              <Plus className="h-3 w-3 text-green-400" />
                              Paste
                            </button>
                            <button
                              onClick={() =>
                                handleDayMenuClick(day.number, "copy")
                              }
                              className="flex items-center gap-2 w-full px-2 py-2 text-xs text-white hover:bg-gray-700/50 rounded transition-colors"
                            >
                              <Copy className="h-3 w-3 text-blue-400" />
                              Copy
                            </button>
                            <button
                              onClick={() =>
                                handleDayMenuClick(day.number, "cut")
                              }
                              className="flex items-center gap-2 w-full px-2 py-2 text-xs text-white hover:bg-gray-700/50 rounded transition-colors"
                            >
                              <Scissors className="h-3 w-3 text-purple-400" />
                              Cut
                            </button>
                            <div className="border-t border-gray-600 my-1" />
                            <button
                              onClick={() =>
                                handleDayMenuClick(day.number, "delete")
                              }
                              className="flex items-center gap-2 w-full px-2 py-2 text-xs text-red-400 hover:bg-red-500/20 rounded transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete Day
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Day Content */}
                  <div className="p-3">
                    {isRestDay ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Zap className="h-6 w-6 text-orange-400" />
                        </div>
                        <div className="text-orange-300 text-sm font-medium mb-1">
                          Rest Day
                        </div>
                        <p className="text-gray-500 text-xs">No exercises</p>
                      </div>
                    ) : dayData ? (
                      <div className="space-y-2">
                        {/* Warmup */}
                        {dayData.warmupTitle && (
                          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2">
                            <div className="flex items-center gap-1 mb-1">
                              <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                              <span className="text-xs font-medium text-yellow-300">
                                Warmup
                              </span>
                            </div>
                            <p className="text-xs text-white">
                              {dayData.warmupTitle}
                            </p>
                          </div>
                        )}

                        {/* Exercises */}
                        {dayData.drills && dayData.drills.length > 0 ? (
                          <SortableContext
                            items={dayData.drills.map((drill: any) => drill.id)}
                            strategy={horizontalListSortingStrategy}
                          >
                            <div className="space-y-2">
                              {dayData.drills
                                .slice(0, 3)
                                .map((exercise: any) => (
                                  <DraggableExercise
                                    key={exercise.id}
                                    exercise={exercise}
                                    dayNumber={day.number}
                                  />
                                ))}
                              {dayData.drills.length > 3 && (
                                <div className="text-center py-2">
                                  <span className="text-xs text-gray-400">
                                    +{dayData.drills.length - 3} more
                                  </span>
                                </div>
                              )}
                            </div>
                          </SortableContext>
                        ) : (
                          <div className="text-center py-6">
                            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                              <Plus className="h-4 w-4 text-gray-400" />
                            </div>
                            <button
                              onClick={() => {
                                handleOpenDayDetail(day.number);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 mx-auto disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Plus className="h-3 w-3" />
                              Add Exercise
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Plus className="h-4 w-4 text-gray-400" />
                        </div>
                        <button
                          onClick={() => {
                            createDayMutation.mutate({
                              programId: program.id,
                              weekNumber: currentWeek,
                              dayNumber: day.number,
                              title: day.name,
                              description: "",
                            });
                          }}
                          disabled={createDayMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 mx-auto disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {createDayMutation.isPending ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                          {createDayMutation.isPending
                            ? "Creating..."
                            : "Add Day"}
                        </button>
                      </div>
                    )}
                  </div>
                </DroppableDayContainer>
              );
            })}
          </div>
        </div>
      </DndContext>

      {/* Drag Overlay */}
      <DragOverlay>
        {draggedExercise ? (
          <div className="bg-gray-700/80 backdrop-blur-sm rounded p-2 shadow-2xl border border-blue-400 transform rotate-2">
            <div className="flex items-center gap-2">
              <GripVertical className="h-3 w-3 text-blue-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white font-medium truncate">
                  {draggedExercise.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {draggedExercise.sets && (
                    <span className="text-xs text-gray-300">
                      {draggedExercise.sets}s
                    </span>
                  )}
                  {draggedExercise.reps && (
                    <span className="text-xs text-gray-300">
                      {draggedExercise.reps}r
                    </span>
                  )}
                  {draggedExercise.supersetWithId && (
                    <span className="text-xs bg-purple-500/30 text-purple-200 px-1 rounded">
                      SS
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>

      {/* Detailed Day View Modal */}
      {selectedDayForDetail && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-600 max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  {
                    DAYS_OF_WEEK.find(d => d.number === selectedDayForDetail)
                      ?.name
                  }
                </h3>
                <button
                  onClick={handleCloseDayDetail}
                  className="p-2 rounded hover:bg-gray-700/50 transition-colors"
                >
                  <span className="text-gray-400 hover:text-white text-xl">
                    ×
                  </span>
                </button>
              </div>

              {(() => {
                const dayData = currentWeekData?.days.find(
                  (d: any) => d.dayNumber === selectedDayForDetail
                );

                if (!dayData) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-gray-400">Day not found</p>
                    </div>
                  );
                }

                return (
                  <DayColumn
                    day={dayData}
                    dayNumber={selectedDayForDetail}
                    weekNumber={currentWeek}
                    programId={program.id}
                    isSelected={false}
                    currentWeekData={currentWeekData}
                    onExerciseAdded={handleExerciseAdded}
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
