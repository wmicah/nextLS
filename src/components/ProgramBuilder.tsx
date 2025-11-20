"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { withMobileDetection } from "@/lib/mobile-detection";
import MobileProgramBuilderNew from "./MobileProgramBuilderNew";
import SupersetDescriptionModal from "./SupersetDescriptionModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUIStore } from "@/lib/stores/uiStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  Moon,
  MoreHorizontal,
  Edit,
  Play,
  Target,
  Save,
  Expand,
  Minimize,
  Video,
  Search,
  Clock,
  Sparkles,
  GripVertical,
  Link,
  Unlink,
  ArrowLeft,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/app/_trpc/client";
import CoachInstructionsDialog from "./CoachInstructionsDialog";
import CoachInstructionsDisplay from "./CoachInstructionsDisplay";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Types
import {
  DayKey,
  ProgramItem,
  Week,
  ProgramBuilderProps,
} from "./types/ProgramBuilder";

interface Routine {
  id: string;
  name: string;
  description: string;
  exercises: ProgramItem[];
}

const DAY_LABELS: Record<DayKey, string> = {
  sun: "Saturday",
  mon: "Sunday",
  tue: "Monday",
  wed: "Tuesday",
  thu: "Wednesday",
  fri: "Thursday",
  sat: "Friday",
};

// Exercise Edit Dialog Component
interface ExerciseEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: {
    title: string;
    description?: string;
    sets?: number;
    reps?: number;
    tempo?: string;
    duration?: string;
    coachInstructions?: {
      whatToDo: string;
      howToDoIt: string;
      keyPoints: string[];
      commonMistakes: string[];
      equipment?: string;
      setup?: string;
    };
  }) => void;
  exercise: ProgramItem | null;
}

function ExerciseEditDialog({
  isOpen,
  onClose,
  onSubmit,
  exercise,
}: ExerciseEditDialogProps) {
  const [formData, setFormData] = useState({
    title: exercise?.title || "",
    description: exercise?.description ?? "",
    sets: exercise?.sets || undefined,
    reps: exercise?.reps || undefined,
    tempo: exercise?.tempo || "",
    duration: exercise?.duration || "",
    coachInstructions: exercise?.coachInstructions || {
      whatToDo: "",
      howToDoIt: "",
      keyPoints: [],
      commonMistakes: [],
      equipment: "",
      setup: "",
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when exercise changes or dialog opens
  useEffect(() => {
    if (isOpen && exercise) {
      console.log("=== ExerciseEditDialog: Loading exercise data ===");
      console.log("exercise:", exercise);
      console.log("exercise.description:", exercise.description);
      console.log("exercise.description type:", typeof exercise.description);
      setFormData({
        title: exercise.title || "",
        description: exercise.description ?? "", // Use nullish coalescing to preserve empty strings but handle null/undefined
        sets: exercise.sets || undefined,
        reps: exercise.reps || undefined,
        tempo: exercise.tempo || "",
        duration: exercise.duration || "",
        coachInstructions: exercise.coachInstructions || {
          whatToDo: "",
          howToDoIt: "",
          keyPoints: [],
          commonMistakes: [],
          equipment: "",
          setup: "",
        },
      });
      console.log("Form data set - description:", exercise.description ?? "");
    }
    // Reset submitting state when dialog closes
    if (!isOpen) {
      setIsSubmitting(false);
    }
  }, [exercise, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    onSubmit(formData);
  };

  const handleOpenChange = (open: boolean) => {
    // Only call onClose if not submitting (prevents double close)
    if (!open && !isSubmitting) {
      onClose();
    }
  };

  // Don't render anything if not open to prevent double rendering
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[#2A3133] border-gray-600 z-[120] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Exercise</DialogTitle>
          <DialogDescription className="text-gray-400">
            Update the exercise details and instructions
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title" className="text-gray-400 text-sm">
                Exercise Title
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e =>
                  setFormData(prev => ({ ...prev, title: e.target.value }))
                }
                className="bg-[#353A3A] border-gray-600 text-white"
                placeholder="Exercise name"
                required
              />
            </div>

            <div>
              <Label htmlFor="duration" className="text-gray-400 text-sm">
                Duration (optional)
              </Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={e =>
                  setFormData(prev => ({ ...prev, duration: e.target.value }))
                }
                className="bg-[#353A3A] border-gray-600 text-white"
                placeholder="e.g., 30 seconds"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="description" className="text-gray-400 text-sm">
                Exercise Description
              </Label>
              <span className="text-xs text-gray-500">
                {formData.description.length}/120
              </span>
            </div>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => {
                const value = e.target.value;
                if (value.length <= 120) {
                  setFormData(prev => ({ ...prev, description: value }));
                }
              }}
              className="bg-[#353A3A] border-gray-600 text-white"
              placeholder="Describe how to perform this exercise..."
              rows={3}
              maxLength={120}
            />
          </div>

          {/* Sets, Reps, Duration */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="sets" className="text-gray-400 text-sm">
                Sets
              </Label>
              <Input
                id="sets"
                type="number"
                value={formData.sets || ""}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    sets: e.target.value ? parseInt(e.target.value) : undefined,
                  }))
                }
                className="bg-[#353A3A] border-gray-600 text-white"
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="reps" className="text-gray-400 text-sm">
                Reps
              </Label>
              <Input
                id="reps"
                type="number"
                value={formData.reps || ""}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    reps: e.target.value ? parseInt(e.target.value) : undefined,
                  }))
                }
                className="bg-[#353A3A] border-gray-600 text-white"
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="tempo" className="text-gray-400 text-sm">
                Duration
              </Label>
              <Input
                id="tempo"
                value={formData.tempo}
                onChange={e =>
                  setFormData(prev => ({ ...prev, tempo: e.target.value }))
                }
                className="bg-[#353A3A] border-gray-600 text-white"
                placeholder="e.g., 30 seconds"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function ProgramBuilder({
  onSave,
  initialWeeks = [],
  programDetails,
  onOpenVideoLibrary,
  selectedVideoFromLibrary,
  onVideoProcessed,
}: ProgramBuilderProps) {
  const { addToast } = useUIStore();
  const [weeks, setWeeks] = useState<Week[]>(initialWeeks);
  const [selectedWeekId, setSelectedWeekId] = useState<string>("");
  const [selectedDayKey, setSelectedDayKey] = useState<DayKey>("sun");

  // Prevent double submission
  const isSubmittingRef = useRef(false);

  // Sync internal weeks state with initialWeeks prop changes
  useEffect(() => {
    if (initialWeeks && initialWeeks.length > 0) {
      setWeeks(initialWeeks);
    }
  }, [initialWeeks]);

  // Call onSave when weeks change to keep parent state in sync
  useEffect(() => {
    if (weeks.length > 0) {
      onSave?.(weeks);
    }
  }, [weeks, onSave]);

  // Auto-update duration based on number of weeks when in edit mode
  useEffect(() => {
    if (programDetails && weeks.length > 0) {
      // Update the duration in the parent component
      // This will trigger a re-render with the updated duration
      const updatedProgramDetails = {
        ...programDetails,
        duration: weeks.length,
      };
      // We need to call the parent's update function if it exists
      // For now, we'll rely on the parent to handle this
    }
  }, [weeks.length, programDetails]);
  const [isExerciseEditDialogOpen, setIsExerciseEditDialogOpen] =
    useState(false);
  const [editingExercise, setEditingExercise] = useState<ProgramItem | null>(
    null
  );
  const [isSupersetModalOpen, setIsSupersetModalOpen] = useState(false);
  const [pendingSupersetDrill, setPendingSupersetDrill] =
    useState<ProgramItem | null>(null);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<Set<string>>(
    new Set()
  );
  const [isAddingToExisting, setIsAddingToExisting] = useState(false);
  const [existingSupersetId, setExistingSupersetId] = useState<string | null>(
    null
  );
  const [isSupersetDescriptionModalOpen, setIsSupersetDescriptionModalOpen] =
    useState(false);
  const [pendingSupersetDescription, setPendingSupersetDescription] = useState<{
    supersetId: string;
    supersetName: string;
    currentData?: {
      exercises?: Array<{
        id: string;
        title: string;
        sets?: number;
        reps?: number;
        description?: string;
      }>;
      supersetDescription?: string;
    };
  } | null>(null);
  // tRPC hooks for routines
  const { data: routinesData = [], refetch: refetchRoutines } =
    trpc.routines.list.useQuery();

  // Transform database routines to match frontend interface
  const routines: Routine[] = routinesData.map(routine => ({
    id: routine.id,
    name: routine.name,
    description: routine.description || "",
    exercises: routine.exercises.map(exercise => ({
      id: exercise.id,
      title: exercise.title,
      type: exercise.type as
        | "exercise"
        | "drill"
        | "video"
        | "routine"
        | undefined,
      description: exercise.description || undefined,
      notes: exercise.notes || undefined,
      sets: exercise.sets || undefined,
      reps: exercise.reps || undefined,
      tempo: exercise.tempo || undefined,
      duration: exercise.duration || undefined,
      videoUrl: exercise.videoUrl || undefined,
      videoId: exercise.videoId || undefined,
      videoTitle: exercise.videoTitle || undefined,
      videoThumbnail: exercise.videoThumbnail || undefined,
      routineId: exercise.routineId,
    })),
  }));
  const createRoutineMutation = trpc.routines.create.useMutation({
    onSuccess: () => {
      refetchRoutines();
      setIsCreateRoutineModalOpen(false);
      setNewRoutine({ name: "", description: "", exercises: [] });
    },
  });
  const updateRoutineMutation = trpc.routines.update.useMutation({
    onSuccess: () => {
      refetchRoutines();
      // Also invalidate the tRPC cache to ensure all components get fresh data
      const utils = trpc.useUtils();
      utils.routines.list.invalidate();
      utils.routines.get.invalidate();
    },
  });
  const deleteRoutineMutation = trpc.routines.delete.useMutation({
    onSuccess: () => {
      refetchRoutines();
    },
  });

  const [isCreateRoutineModalOpen, setIsCreateRoutineModalOpen] =
    useState(false);
  const [isAddRoutineModalOpen, setIsAddRoutineModalOpen] = useState(false);
  const [routineSearchTerm, setRoutineSearchTerm] = useState("");
  const [pendingRoutineDay, setPendingRoutineDay] = useState<{
    weekId: string;
    dayKey: DayKey;
  } | null>(null);

  // Copy/paste functionality
  const [copiedDay, setCopiedDay] = useState<{
    weekId: string;
    dayKey: DayKey;
    items: ProgramItem[];
  } | null>(null);

  // Filter and sort routines
  const filteredRoutines = useMemo(() => {
    if (!routineSearchTerm.trim()) {
      return [...routines].sort((a, b) => a.name.localeCompare(b.name));
    }

    return [...routines]
      .filter(
        routine =>
          routine.name
            .toLowerCase()
            .includes(routineSearchTerm.toLowerCase()) ||
          routine.description
            ?.toLowerCase()
            .includes(routineSearchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [routines, routineSearchTerm]);

  // Reset search when modal opens
  const handleOpenAddRoutineModal = (weekId: string, dayKey: DayKey) => {
    setPendingRoutineDay({ weekId, dayKey });
    setRoutineSearchTerm("");
    setIsAddRoutineModalOpen(true);
  };

  // Copy day functionality
  const handleCopyDay = (weekId: string, dayKey: DayKey) => {
    const week = weeks.find(w => w.id === weekId);
    if (week) {
      const dayItems = week.days[dayKey] || [];
      setCopiedDay({ weekId, dayKey, items: [...dayItems] });
      addToast({
        type: "success",
        title: "Day Copied!",
        message: `${dayKey} has been copied. You can now paste it to another day.`,
      });
    }
  };

  // Paste day functionality
  const handlePasteDay = (targetWeekId: string, targetDayKey: DayKey) => {
    if (!copiedDay) return;

    const updatedWeeks = weeks.map(week => {
      if (week.id === targetWeekId) {
        const updatedDays = { ...week.days };
        // Create new items with unique IDs to avoid conflicts
        const newItems = copiedDay.items.map(item => ({
          ...item,
          id: `${item.type}-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
        }));
        updatedDays[targetDayKey] = newItems;
        return { ...week, days: updatedDays };
      }
      return week;
    });

    setWeeks(updatedWeeks);
    onSave?.(updatedWeeks);

    addToast({
      type: "success",
      title: "Day Pasted!",
      message: `Workout has been pasted to ${targetDayKey}.`,
    });
  };

  const [newRoutine, setNewRoutine] = useState({
    name: "",
    description: "",
    exercises: [] as ProgramItem[],
  });

  // Handlers
  const addWeek = useCallback(() => {
    const newWeekNumber = weeks.length + 1;
    const newWeek: Week = {
      id: `week-${newWeekNumber}`,
      name: `Week ${newWeekNumber}`,
      collapsed: false,
      days: {
        sun: [],
        mon: [],
        tue: [],
        wed: [],
        thu: [],
        fri: [],
        sat: [],
      },
    };
    const updatedWeeks = [...weeks, newWeek];
    setWeeks(updatedWeeks);
    // Call onSave to keep parent state in sync
    onSave?.(updatedWeeks);
  }, [weeks, onSave]);

  const deleteWeek = useCallback(
    (weekId: string) => {
      if (weeks.length === 1) return; // Don't delete the last week
      // Filter out the deleted week, then renumber remaining weeks sequentially
      const updatedWeeks = weeks
        .filter(week => week.id !== weekId)
        .map((week, index) => ({
          ...week,
          id: `week-${index + 1}`,
          name: `Week ${index + 1}`,
        }));
      setWeeks(updatedWeeks);
      // Call onSave to keep parent state in sync
      onSave?.(updatedWeeks);
    },
    [weeks, onSave]
  );

  const duplicateWeek = useCallback(
    (weekId: string) => {
      const weekToDuplicate = weeks.find(w => w.id === weekId);
      if (!weekToDuplicate) return;

      const newWeekNumber = weeks.length + 1;
      const newWeek: Week = {
        id: `week-${newWeekNumber}`,
        name: `Week ${newWeekNumber}`,
        collapsed: false,
        days: JSON.parse(JSON.stringify(weekToDuplicate.days)), // Deep copy
      };
      const updatedWeeks = [...weeks, newWeek];
      setWeeks(updatedWeeks);
    },
    [weeks]
  );

  const toggleCollapse = useCallback((weekId: string) => {
    setWeeks(prev => {
      const updatedWeeks = prev.map(week =>
        week.id === weekId ? { ...week, collapsed: !week.collapsed } : week
      );
      return updatedWeeks;
    });
  }, []);

  const toggleCollapseAll = useCallback(() => {
    const allCollapsed = weeks.every(week => week.collapsed);
    setWeeks(prev => {
      const updatedWeeks = prev.map(week => ({
        ...week,
        collapsed: !allCollapsed,
      }));
      return updatedWeeks;
    });
  }, [weeks]);

  const addItem = useCallback(
    (weekId: string, dayKey: DayKey, item: Omit<ProgramItem, "id">) => {
      const newItem: ProgramItem = {
        ...item,
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };

      const updatedWeeks = weeks.map(week => {
        if (week.id === weekId) {
          return {
            ...week,
            days: {
              ...week.days,
              [dayKey]: [...week.days[dayKey], newItem],
            },
          };
        }
        return week;
      });
      setWeeks(updatedWeeks);
    },
    [weeks]
  );

  const editItem = useCallback(
    (
      weekId: string,
      dayKey: DayKey,
      itemId: string,
      partial: Partial<ProgramItem>
    ) => {
      const updatedWeeks = weeks.map(week => {
        if (week.id === weekId) {
          return {
            ...week,
            days: {
              ...week.days,
              [dayKey]: week.days[dayKey].map(item =>
                item.id === itemId ? { ...item, ...partial } : item
              ),
            },
          };
        }
        return week;
      });
      setWeeks(updatedWeeks);
    },
    [weeks]
  );

  const deleteItem = useCallback(
    (weekId: string, dayKey: DayKey, itemId: string) => {
      const updatedWeeks = weeks.map(week => {
        if (week.id === weekId) {
          return {
            ...week,
            days: {
              ...week.days,
              [dayKey]: week.days[dayKey].filter(item => item.id !== itemId),
            },
          };
        }
        return week;
      });
      setWeeks(updatedWeeks);
    },
    [weeks]
  );

  const reorderItems = useCallback(
    (weekId: string, dayKey: DayKey, newItems: ProgramItem[]) => {
      const updatedWeeks = weeks.map(week => {
        if (week.id === weekId) {
          return {
            ...week,
            days: {
              ...week.days,
              [dayKey]: newItems,
            },
          };
        }
        return week;
      });
      setWeeks(updatedWeeks);
    },
    [weeks]
  );

  const handleSave = useCallback(() => {
    if (programDetails?.onSave) {
      // In edit mode, call the database save function with current weeks
      programDetails.onSave(weeks);
    } else {
      // In create mode, just update parent state
      onSave?.(weeks);
    }
  }, [weeks, onSave, programDetails]);

  const openEditItemDialog = useCallback(
    (weekId: string, dayKey: DayKey, item: ProgramItem) => {
      console.log("item:", item);
      console.log("item.description:", item.description);
      setSelectedWeekId(weekId);
      setSelectedDayKey(dayKey);

      // Use the new exercise edit dialog for ALL exercises (including videos)
      setEditingExercise(item);
      setIsExerciseEditDialogOpen(true);
    },
    []
  );

  const openAddFromLibrary = useCallback(
    (weekId: string, dayKey: DayKey) => {
      // IMMEDIATELY clear any existing edit state
      setEditingExercise(null);
      // Ensure dialog is never open (redundant but safe)
      setIsExerciseEditDialogOpen(false);

      // Ensure we're NOT in routine-creation mode when adding from library for normal days
      if (weekId !== "routine-creation") {
        // Clear any stale routine-creation state
        // Only set week/day if we have valid values
        if (weekId && dayKey) {
          setSelectedWeekId(weekId);
          setSelectedDayKey(dayKey);
        }
      } else {
        // If we ARE in routine-creation, set the flag
        setSelectedWeekId("routine-creation");
        setSelectedDayKey(dayKey || "sun");
      }

      // Use setTimeout to ensure state updates are processed before opening library
      setTimeout(() => {
        onOpenVideoLibrary?.();
      }, 0);
    },
    [onOpenVideoLibrary]
  );

  const handleVideoSelect = useCallback(
    (video: {
      id: string;
      title: string;
      description?: string;
      duration?: string;
      url?: string;
      thumbnail?: string;
    }) => {
      // Only process if we have valid state - prevent opening dialog accidentally
      if (!selectedWeekId || !selectedDayKey) {
        console.warn(
          "handleVideoSelect: Missing selectedWeekId or selectedDayKey"
        );
        return;
      }

      // Check if we're creating a routine
      if (selectedWeekId === "routine-creation") {
        // Use exercise edit dialog for routine creation too
        const videoItem: ProgramItem = {
          id: `temp-${Date.now()}`,
          title: video.title,
          type: "video",
          description: video.description || "",
          duration: video.duration || "",
          videoUrl: video.url || "",
          videoId: video.id,
          videoTitle: video.title,
          videoThumbnail: video.thumbnail || "",
        };
        // Only set editing exercise and open dialog if we're in routine creation mode
        setEditingExercise(videoItem);
        setIsExerciseEditDialogOpen(true);
        setSelectedWeekId("routine-creation"); // Keep this flag for the submit handler
      } else {
        // Normal video selection for program days - add directly without edit dialog
        // Only add if we have valid weekId and dayKey (not routine-creation)
        const videoItem: Omit<ProgramItem, "id"> = {
          title: video.title,
          type: "video",
          description: video.description || "",
          duration: video.duration || "",
          videoUrl: video.url || "",
          videoId: video.id,
          videoTitle: video.title,
          videoThumbnail: video.thumbnail || "",
        };

        // Add video directly to program without opening edit dialog
        addItem(selectedWeekId, selectedDayKey, videoItem);
      }
    },
    [selectedWeekId, selectedDayKey, addItem]
  );

  // Handle video selection from library
  useEffect(() => {
    if (selectedVideoFromLibrary) {
      // Only process if we have valid state (not in a transitional state)
      // This prevents the edit dialog from opening when it shouldn't
      if (selectedWeekId && selectedWeekId !== "" && selectedDayKey) {
        handleVideoSelect(selectedVideoFromLibrary);
      }
      onVideoProcessed?.(); // Clear the selected video after processing
    }
  }, [
    selectedVideoFromLibrary,
    onVideoProcessed,
    handleVideoSelect,
    selectedWeekId,
    selectedDayKey,
  ]);

  const handleExerciseEditSubmit = useCallback(
    (details: {
      title: string;
      description?: string;
      notes?: string;
      sets?: number;
      reps?: number;
      tempo?: string;
      duration?: string;
      coachInstructions?: {
        whatToDo: string;
        howToDoIt: string;
        keyPoints: string[];
        commonMistakes: string[];
        equipment?: string;
        setup?: string;
      };
    }) => {
      // Strict validation - must have editingExercise with valid ID
      if (!editingExercise || !editingExercise.id) {
        console.warn("Cannot submit: editingExercise is null or missing ID");
        setIsExerciseEditDialogOpen(false);
        setEditingExercise(null);
        return;
      }

      // Prevent double submission
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      // Create the updated exercise item
      const exerciseItem: Omit<ProgramItem, "id"> = {
        title: details.title,
        type: editingExercise.type || "exercise",
        description: details.description ?? "", // Use nullish coalescing to preserve empty strings
        notes: editingExercise.notes || "", // Keep existing notes from the exercise
        sets: details.sets,
        reps: details.reps,
        tempo: details.tempo || "",
        duration: details.duration || "",
        videoUrl: editingExercise.videoUrl,
        videoId: editingExercise.videoId,
        videoTitle: editingExercise.videoTitle,
        videoThumbnail: editingExercise.videoThumbnail,
        supersetId: editingExercise.supersetId,
        supersetOrder: editingExercise.supersetOrder,
        supersetDescription: editingExercise.supersetDescription,
        supersetInstructions: editingExercise.supersetInstructions,
        supersetNotes: editingExercise.supersetNotes,
        coachInstructions: details.coachInstructions,
      };

      // Check if we're creating a routine, adding a new video, or editing an existing exercise
      if (selectedWeekId === "routine-creation") {
        if (editingExercise.id.startsWith("temp-")) {
          // This is adding a new video to a routine being created
          const newExercise: ProgramItem = {
            id: editingExercise.id, // Use the existing temp ID
            title: details.title,
            type: editingExercise.type || "exercise",
            description: details.description || "",
            notes: editingExercise.notes || "", // Keep existing notes
            sets: details.sets,
            reps: details.reps,
            tempo: details.tempo || "",
            duration: details.duration || "",
            videoUrl: editingExercise.videoUrl,
            videoId: editingExercise.videoId,
            videoTitle: editingExercise.videoTitle,
            videoThumbnail: editingExercise.videoThumbnail,
            supersetId: editingExercise.supersetId,
            supersetOrder: editingExercise.supersetOrder,
            supersetDescription: editingExercise.supersetDescription,
            supersetInstructions: editingExercise.supersetInstructions,
            supersetNotes: editingExercise.supersetNotes,
            coachInstructions: details.coachInstructions,
          };
          setNewRoutine(prev => ({
            ...prev,
            exercises: [...(prev.exercises || []), newExercise],
          }));
        } else {
          // This is editing an existing exercise in a routine being created
          const updatedExercise: ProgramItem = {
            id: editingExercise.id, // Keep the existing ID
            title: details.title,
            type: editingExercise.type || "exercise",
            description: details.description || "",
            notes: editingExercise.notes || "", // Keep existing notes
            sets: details.sets,
            reps: details.reps,
            tempo: details.tempo || "",
            duration: details.duration || "",
            videoUrl: editingExercise.videoUrl,
            videoId: editingExercise.videoId,
            videoTitle: editingExercise.videoTitle,
            videoThumbnail: editingExercise.videoThumbnail,
            supersetId: editingExercise.supersetId,
            supersetOrder: editingExercise.supersetOrder,
            supersetDescription: editingExercise.supersetDescription,
            supersetInstructions: editingExercise.supersetInstructions,
            supersetNotes: editingExercise.supersetNotes,
            coachInstructions: details.coachInstructions,
          };
          setNewRoutine(prev => ({
            ...prev,
            exercises: (prev.exercises || []).map(ex =>
              ex.id === editingExercise.id ? updatedExercise : ex
            ),
          }));
        }
        setSelectedWeekId("routine-creation"); // Keep the flag
      } else if (editingExercise.id.startsWith("temp-")) {
        // This is a new video being added to a program
        addItem(selectedWeekId, selectedDayKey, exerciseItem);
      } else {
        // This is editing an existing exercise
        editItem(
          selectedWeekId,
          selectedDayKey,
          editingExercise.id,
          exerciseItem
        );
      }

      setIsExerciseEditDialogOpen(false);
      setEditingExercise(null);

      // Reset submission flag after a short delay
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 500);
    },
    [
      editingExercise,
      selectedWeekId,
      selectedDayKey,
      editItem,
      addItem,
      setNewRoutine,
    ]
  );

  // Routine management
  const handleCreateRoutine = () => {
    if (
      newRoutine.name.trim() &&
      newRoutine.description.trim() &&
      newRoutine.exercises.length > 0
    ) {
      createRoutineMutation.mutate({
        name: newRoutine.name.trim(),
        description: newRoutine.description.trim(),
        exercises: newRoutine.exercises.map(exercise => ({
          title: exercise.title,
          description: exercise.description,
          type: exercise.type,
          notes: exercise.notes,
          sets: exercise.sets,
          reps: exercise.reps,
          tempo: exercise.tempo,
          duration: exercise.duration,
          videoId: exercise.videoId,
          videoTitle: exercise.videoTitle,
          videoThumbnail: exercise.videoThumbnail,
          videoUrl: exercise.videoUrl,
        })),
      });
    }
  };

  // Convert day to routine (routineName is now user-provided)
  const handleConvertDayToRoutine = (
    routineName: string,
    items: ProgramItem[]
  ) => {
    const expandedExercises: any[] = [];

    // Process each item - expand routines into their individual exercises
    items.forEach(item => {
      if (item.type === "routine" && item.routineId) {
        // Find the routine in our routines list and expand its exercises
        const routine = routines.find(r => r.id === item.routineId);
        if (routine) {
          // Add all exercises from the routine
          routine.exercises.forEach(exercise => {
            expandedExercises.push({
              title: exercise.title,
              type: "exercise",
              notes: exercise.description || "",
              sets: exercise.sets ?? undefined,
              reps: exercise.reps ?? undefined,
              tempo: exercise.tempo || "",
              duration: exercise.duration || "",
              videoUrl: exercise.videoUrl ?? undefined,
              videoId: exercise.videoId ?? undefined,
              videoTitle: exercise.videoTitle ?? undefined,
              videoThumbnail: exercise.videoThumbnail ?? undefined,
            });
          });
        }
      } else {
        // Regular exercise - add as is
        expandedExercises.push({
          title: item.title,
          type: item.type || "exercise",
          notes: item.notes || "",
          sets: item.sets ?? undefined,
          reps: item.reps ?? undefined,
          tempo: item.tempo || "",
          duration: item.duration || "",
          videoUrl: item.videoUrl ?? undefined,
          videoId: item.videoId ?? undefined,
          videoTitle: item.videoTitle ?? undefined,
          videoThumbnail: item.videoThumbnail ?? undefined,
        });
      }
    });

    createRoutineMutation.mutate(
      {
        name: routineName,
        description: `Routine with ${expandedExercises.length} ${
          expandedExercises.length === 1 ? "exercise" : "exercises"
        }`,
        exercises: expandedExercises,
      },
      {
        onSuccess: () => {
          addToast({
            type: "success",
            title: "Routine Created!",
            message: `"${routineName}" has been created with ${
              expandedExercises.length
            } ${
              expandedExercises.length === 1 ? "exercise" : "exercises"
            }. Find it in the Routines tab!`,
          });
        },
        onError: error => {
          addToast({
            type: "error",
            title: "Error",
            message: `Failed to create routine: ${error.message}`,
          });
        },
      }
    );
  };

  const handleAddRoutineToDay = (
    routine: Routine,
    weekId: string,
    dayKey: DayKey
  ) => {
    const updatedWeeks = weeks.map(week => {
      if (week.id === weekId) {
        const updatedDays = { ...week.days };
        const routineItem: ProgramItem = {
          id: `routine-item-${Date.now()}`,
          title: routine.name,
          type: "routine" as const,
          notes: routine.description,
          routineId: routine.id,
          description: routine.description,
          duration: "",
          videoUrl: "",
          videoId: "",
          videoTitle: "",
          videoThumbnail: "",
          sets: undefined,
          reps: undefined,
          tempo: "",
          supersetId: undefined,
          supersetOrder: undefined,
          supersetDescription: undefined,
          supersetInstructions: undefined,
          supersetNotes: undefined,
        };
        updatedDays[dayKey] = [...updatedDays[dayKey], routineItem];
        return { ...week, days: updatedDays };
      }
      return week;
    });
    setWeeks(updatedWeeks);
    // onSave will be called by useEffect when weeks state updates
  };

  // Superset management
  const handleCreateSuperset = useCallback(
    (itemId: string, selectedItemIds: string[]) => {
      const updatedWeeks = weeks.map(week => {
        if (week.id === selectedWeekId) {
          const updatedDays = { ...week.days };
          const firstItem = updatedDays[selectedDayKey].find(
            i => i.id === itemId
          );

          if (firstItem && selectedItemIds.length > 0) {
            // Create a unique superset/circuit ID
            const groupId = `superset-${Date.now()}`;

            // Get all selected items
            const allSelectedItems = [firstItem];
            selectedItemIds.forEach(selectedId => {
              const selectedItem = updatedDays[selectedDayKey].find(
                i => i.id === selectedId
              );
              if (selectedItem) {
                allSelectedItems.push(selectedItem);
              }
            });

            // Set all items as part of the same group
            allSelectedItems.forEach((item, index) => {
              item.supersetId = groupId;
              item.supersetOrder = index + 1;
              item.type = "superset";
            });

            console.log(`Created ${allSelectedItems.length} exercise group:`, {
              groupId,
              exercises: allSelectedItems.map(item => ({
                id: item.id,
                title: item.title,
                supersetOrder: item.supersetOrder,
              })),
            });

            return { ...week, days: updatedDays };
          }
        }
        return week;
      });
      setWeeks(updatedWeeks);
      onSave?.(updatedWeeks);
    },
    [weeks, selectedWeekId, selectedDayKey, onSave]
  );

  const handleAddToSuperset = useCallback(
    (supersetId: string, itemId: string) => {
      const updatedWeeks = weeks.map(week => {
        if (week.id === selectedWeekId) {
          const updatedDays = { ...week.days };
          const existingItems = updatedDays[selectedDayKey].filter(
            i => i.supersetId === supersetId
          );
          const itemToAdd = updatedDays[selectedDayKey].find(
            i => i.id === itemId
          );

          if (itemToAdd && existingItems.length > 0) {
            // Add the item to the existing group
            const maxOrder = Math.max(
              ...existingItems.map(i => i.supersetOrder || 0)
            );
            itemToAdd.supersetId = supersetId;
            itemToAdd.supersetOrder = maxOrder + 1;
            itemToAdd.type = "superset";

            console.log(`Added exercise to group ${supersetId}:`, {
              exercise: {
                id: itemToAdd.id,
                title: itemToAdd.title,
                supersetOrder: itemToAdd.supersetOrder,
              },
              totalExercises: maxOrder + 1,
            });

            return { ...week, days: updatedDays };
          }
        }
        return week;
      });
      setWeeks(updatedWeeks);
      onSave?.(updatedWeeks);
    },
    [weeks, selectedWeekId, selectedDayKey, onSave]
  );

  const handleRemoveSuperset = useCallback(
    (itemId: string) => {
      const updatedWeeks = weeks.map(week => {
        if (week.id === selectedWeekId) {
          const updatedDays = { ...week.days };
          const item = updatedDays[selectedDayKey].find(i => i.id === itemId);
          if (item && item.supersetId) {
            // Find all items in the same superset group
            const supersetGroupId = item.supersetId;
            const supersetItems = updatedDays[selectedDayKey].filter(
              i => i.supersetId === supersetGroupId
            );

            // Remove superset properties from all items in the group
            supersetItems.forEach(supersetItem => {
              supersetItem.supersetId = undefined;
              supersetItem.supersetOrder = undefined;
              supersetItem.type = "exercise"; // Reset to default type
            });

            return { ...week, days: updatedDays };
          }
        }
        return week;
      });
      setWeeks(updatedWeeks);
    },
    [weeks, selectedWeekId, selectedDayKey, onSave]
  );

  const handleOpenSupersetModal = useCallback(
    (item: ProgramItem, existingGroupId?: string) => {
      setPendingSupersetDrill(item);
      setSelectedExerciseIds(new Set());
      if (existingGroupId) {
        setIsAddingToExisting(true);
        setExistingSupersetId(existingGroupId);
      } else {
        setIsAddingToExisting(false);
        setExistingSupersetId(null);
      }
      setIsSupersetModalOpen(true);
    },
    []
  );

  const toggleExerciseSelection = (itemId: string) => {
    setSelectedExerciseIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleConfirmSuperset = () => {
    if (!pendingSupersetDrill) return;

    if (isAddingToExisting && existingSupersetId) {
      // Add selected exercises to existing group
      const selectedArray = Array.from(selectedExerciseIds);
      selectedArray.forEach(itemId => {
        handleAddToSuperset(existingSupersetId, itemId);
      });
    } else {
      // Create new group
      const selectedArray = Array.from(selectedExerciseIds);
      if (selectedArray.length === 0) {
        // No exercises selected, close modal
        setIsSupersetModalOpen(false);
        return;
      }
      handleCreateSuperset(pendingSupersetDrill.id, selectedArray);
    }

    setIsSupersetModalOpen(false);
    setSelectedExerciseIds(new Set());
    setPendingSupersetDrill(null);
    setIsAddingToExisting(false);
    setExistingSupersetId(null);
  };

  // Helper function to get group name (Superset for 2, Circuit for 3+)
  const getGroupName = useCallback(
    (groupId: string): string => {
      const allItems = weeks.flatMap(week => Object.values(week.days).flat());
      const groupItems = allItems.filter(item => item.supersetId === groupId);
      return groupItems.length === 2 ? "Superset" : "Circuit";
    },
    [weeks]
  );

  // Helper function to get group exercise count
  const getGroupExerciseCount = useCallback(
    (groupId: string): number => {
      const allItems = weeks.flatMap(week => Object.values(week.days).flat());
      return allItems.filter(item => item.supersetId === groupId).length;
    },
    [weeks]
  );

  const onOpenSupersetDescriptionModal = useCallback(
    (supersetId: string, supersetName: string) => {
      // Find all exercises in the superset
      const allItems = weeks.flatMap(week => Object.values(week.days).flat());

      const supersetExercises = allItems
        .filter(item => item.supersetId === supersetId)
        .sort((a, b) => (a.supersetOrder || 0) - (b.supersetOrder || 0));

      console.log("supersetId:", supersetId);
      console.log("supersetExercises:", supersetExercises);
      console.log("All weeks data:", weeks);

      // Debug each exercise individually
      supersetExercises.forEach((ex, index) => {
        console.log(`Exercise ${index + 1}:`, {
          title: ex.title,
          sets: ex.sets,
          reps: ex.reps,
          description: ex.description,
          supersetOrder: ex.supersetOrder,
          supersetDescription: ex.supersetDescription,
        });
      });

      const firstExercise = supersetExercises[0];

      setPendingSupersetDescription({
        supersetId,
        supersetName,
        currentData: firstExercise
          ? {
              // Use the exercise's actual id as the identifier (not supersetOrder)
              // This ensures each exercise has a unique ID even if they share supersetOrder
              exercises: supersetExercises.map((ex, index) => ({
                id: ex.id || `temp-${index}`, // Use actual id, fallback to temp index
                title: ex.title,
                sets: ex.sets,
                reps: ex.reps,
                description: ex.description || ex.notes,
              })),
              supersetDescription: firstExercise.supersetDescription,
            }
          : undefined,
      });
      setIsSupersetDescriptionModalOpen(true);
    },
    [weeks]
  );

  const handleSupersetDescriptionSave = useCallback(
    (data: {
      exercises: Array<{
        id: string;
        title: string;
        sets?: number;
        reps?: number;
        description?: string;
      }>;
      supersetDescription?: string;
    }) => {
      if (!pendingSupersetDescription) return;

      console.log("Saved exercises from modal:", data.exercises);

      // Create a set of saved exercise IDs for quick lookup
      // The modal uses supersetOrder as the ID (or the item's id)
      const savedExerciseIds = new Set(data.exercises.map(ex => ex.id));
      console.log("Saved exercise IDs set:", Array.from(savedExerciseIds));

      const updatedWeeks = weeks.map(week => {
        const updatedDays = { ...week.days };
        Object.keys(updatedDays).forEach(dayKey => {
          // First, filter out deleted exercises, then update remaining ones
          const filteredItems = updatedDays[dayKey as DayKey].filter(
            (item: ProgramItem) => {
              // Keep items that are NOT in this superset
              if (item.supersetId !== pendingSupersetDescription.supersetId) {
                return true;
              }
              // For items in this superset, only keep if they're in the saved data
              // Match by the exercise's actual id (the modal uses ex.id as the identifier)
              const shouldKeep = savedExerciseIds.has(item.id);
              return shouldKeep;
            }
          );


          // Now update the remaining exercises
          updatedDays[dayKey as DayKey] = filteredItems.map(
            (item: ProgramItem) => {
              if (item.supersetId === pendingSupersetDescription.supersetId) {
                // Match exercise by its actual id (the modal uses ex.id as the identifier)
                const exerciseData = data.exercises.find(
                  ex => ex.id === item.id
                );

                if (exerciseData) {
                  console.log(
                    `Updating item ${item.title} (id: ${item.id}) with data:`,
                    exerciseData
                  );
                  const updatedItem = {
                    ...item,
                    sets: exerciseData.sets,
                    reps: exerciseData.reps,
                    // Preserve description - use empty string if undefined/null to ensure it's saved
                    description: exerciseData.description ?? "",
                    // Only set superset description on the first exercise (supersetOrder = 1)
                    supersetDescription:
                      item.supersetOrder === 1
                        ? data.supersetDescription
                        : item.supersetDescription,
                  };
                  return updatedItem;
                }
              }
              return item;
            }
          );
        });
        return { ...week, days: updatedDays };
      });

      console.log("Saving superset data:", data);
      console.log("Updated weeks:", updatedWeeks);

      setWeeks(updatedWeeks);
      onSave?.(updatedWeeks);
      setIsSupersetDescriptionModalOpen(false);
      setPendingSupersetDescription(null);
    },
    [weeks, pendingSupersetDescription, onSave]
  );

  const getSupersetGroups = useCallback(() => {
    const groups: { [key: string]: ProgramItem[] } = {};
    weeks.forEach(week => {
      Object.entries(week.days).forEach(([dayKey, items]) => {
        items.forEach(item => {
          if (item.supersetId) {
            const groupKey = `${week.id}-${dayKey}-${item.supersetId}`;
            if (!groups[groupKey]) {
              groups[groupKey] = [];
            }
            groups[groupKey].push(item);
          }
        });
      });
    });
    return Object.values(groups).map((items, index) => ({
      name: `Superset ${index + 1}`,
      items: items.sort(
        (a, b) => (a.supersetOrder || 0) - (b.supersetOrder || 0)
      ),
    }));
  }, [weeks, routines]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (active.id === over?.id) {
        return;
      }

      const oldIndex = weeks.findIndex(week => week.id === active.id);
      const newIndex = weeks.findIndex(week => week.id === over?.id);

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const updatedWeeks = arrayMove(weeks, oldIndex, newIndex);
      setWeeks(updatedWeeks);
    },
    [weeks]
  );

  const sensors = useSensors(
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    useSensor(PointerSensor)
  );

  return (
    <div
      className="min-h-screen p-4 overflow-x-auto"
      style={{ backgroundColor: "#2A3133" }}
    >
      {/* Program Details Header */}
      {programDetails && (
        <div className="mb-8 p-6 bg-[#353A3A] rounded-2xl border border-gray-600">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-4 mb-2">
                {programDetails.onBack && (
                  <Button
                    variant="ghost"
                    onClick={programDetails.onBack}
                    className="text-gray-400 hover:text-white"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                )}
                <h2 className="text-2xl font-bold text-white">
                  {programDetails.title || "Untitled Program"}
                </h2>
              </div>
              <p className="text-gray-400">
                {programDetails.description || "No description provided"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge
                variant="outline"
                className="bg-green-500/10 text-green-400 border-green-500/20"
              >
                {programDetails.level}
              </Badge>
              <Badge
                variant="outline"
                className="bg-purple-500/10 text-purple-400 border-purple-500/20"
              >
                {programDetails.duration} weeks
              </Badge>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  handleSave();
                }}
                disabled={programDetails.isSaving}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {programDetails.isSaving ? "Saving..." : "Save Program"}
              </Button>
            </div>
          </div>
          {programDetails.lastSaved && (
            <p className="text-sm text-gray-500 mt-2">
              Last saved: {programDetails.lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>
      )}

      {/* Top Toolbar - Only show when not in edit mode */}
      {!programDetails && (
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={addWeek}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Week
              </Button>
              <Button
                onClick={toggleCollapseAll}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
              >
                {weeks.every(week => week.collapsed) ? (
                  <>
                    <Expand className="h-4 w-4 mr-2" />
                    Expand All
                  </>
                ) : (
                  <>
                    <Minimize className="h-4 w-4 mr-2" />
                    Collapse All
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons - Show when in edit mode */}
      {programDetails && (
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={addWeek}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Week
            </Button>
            <Button
              onClick={toggleCollapseAll}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
            >
              {weeks.every(week => week.collapsed) ? (
                <>
                  <Expand className="h-4 w-4 mr-2" />
                  Expand All
                </>
              ) : (
                <>
                  <Minimize className="h-4 w-4 mr-2" />
                  Collapse All
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Weeks */}
      <div className="space-y-6">
        {weeks.map((week, weekIndex) => (
          <WeekCard
            key={week.id}
            week={week}
            weekIndex={weekIndex}
            onToggleCollapse={() => toggleCollapse(week.id)}
            onDelete={() => deleteWeek(week.id)}
            onDuplicate={() => duplicateWeek(week.id)}
            onAddItem={openAddFromLibrary}
            onEditItem={openEditItemDialog}
            onDeleteItem={deleteItem}
            onReorderItems={reorderItems}
            onAddRoutine={(routine, dayKey) =>
              handleAddRoutineToDay(routine, week.id, dayKey)
            }
            routines={routines}
            sensors={sensors}
            onDragEnd={handleDragEnd}
            onCreateSuperset={(itemId, existingId) => {
              const item = weeks
                .find(w => w.id === selectedWeekId)
                ?.days[selectedDayKey]?.find(i => i.id === itemId);
              if (item) {
                handleOpenSupersetModal(item, existingId);
              }
            }}
            onRemoveSuperset={handleRemoveSuperset}
            onOpenSupersetModal={handleOpenSupersetModal}
            onOpenSupersetDescriptionModal={onOpenSupersetDescriptionModal}
            getSupersetGroups={getSupersetGroups}
            onOpenAddRoutine={handleOpenAddRoutineModal}
            onConvertToRoutine={handleConvertDayToRoutine}
            onCopyDay={handleCopyDay}
            onPasteDay={handlePasteDay}
            copiedDay={copiedDay}
          />
        ))}
      </div>

      {/* Exercise Edit Dialog - Only render when open to prevent double modals */}
      {isExerciseEditDialogOpen && editingExercise && editingExercise.id && (
        <ExerciseEditDialog
          key={editingExercise.id} // Force remount when exercise changes
          isOpen={isExerciseEditDialogOpen}
          onClose={() => {
            setIsExerciseEditDialogOpen(false);
            setEditingExercise(null);
          }}
          onSubmit={handleExerciseEditSubmit}
          exercise={editingExercise}
        />
      )}

      {/* Superset/Circuit Modal */}
      <Dialog open={isSupersetModalOpen} onOpenChange={setIsSupersetModalOpen}>
        <DialogContent className="bg-[#2A3133] border-gray-600 z-[120] max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white">
              {isAddingToExisting
                ? `Add to ${
                    existingSupersetId
                      ? getGroupName(existingSupersetId)
                      : "Group"
                  }`
                : "Create Superset or Circuit"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {isAddingToExisting
                ? "Select exercises to add to this group"
                : "Select one or more exercises from the same day. Select 1 exercise for a Superset (2 total) or 2+ exercises for a Circuit (3+ total)."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 p-4">
            <div>
              <Label className="text-white">
                {isAddingToExisting ? "Current Group" : "First Exercise"}
              </Label>
              <div className="p-3 bg-gray-700 rounded border border-gray-600">
                <p className="text-white font-medium">
                  {pendingSupersetDrill?.title}
                </p>
                <p className="text-gray-400 text-sm">
                  {pendingSupersetDrill?.notes}
                </p>
              </div>
            </div>
            <div>
              <Label className="text-white">
                {isAddingToExisting
                  ? "Exercises to Add"
                  : selectedExerciseIds.size === 0
                  ? "Select Exercises (1 for Superset, 2+ for Circuit)"
                  : selectedExerciseIds.size === 1
                  ? "Selected: Superset (2 exercises)"
                  : `Selected: Circuit (${
                      selectedExerciseIds.size + 1
                    } exercises)`}
              </Label>
              <div className="max-h-64 overflow-y-auto border border-gray-600 rounded p-2 space-y-2 bg-gray-800">
                {weeks
                  .find(week => week.id === selectedWeekId)
                  ?.days[selectedDayKey]?.filter(item => {
                    // Don't show the pending drill or exercises already in the group
                    if (item.id === pendingSupersetDrill?.id) return false;
                    if (
                      isAddingToExisting &&
                      existingSupersetId &&
                      item.supersetId === existingSupersetId
                    )
                      return false;
                    // Don't show exercises already in other groups
                    if (!isAddingToExisting && item.supersetId) return false;
                    return true;
                  })
                  .map(item => (
                    <label
                      key={item.id}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-700 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedExerciseIds.has(item.id)}
                        onChange={() => toggleExerciseSelection(item.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">
                          {item.title}
                        </p>
                        {item.notes && (
                          <p className="text-gray-400 text-xs">{item.notes}</p>
                        )}
                      </div>
                    </label>
                  ))}
              </div>
            </div>
          </div>
          <DialogFooter className="border-t border-gray-700 p-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsSupersetModalOpen(false);
                setSelectedExerciseIds(new Set());
                setPendingSupersetDrill(null);
                setIsAddingToExisting(false);
                setExistingSupersetId(null);
              }}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSuperset}
              disabled={!isAddingToExisting && selectedExerciseIds.size === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isAddingToExisting ? "Add Exercises" : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Routine Modal */}
      <Dialog
        open={isCreateRoutineModalOpen}
        onOpenChange={setIsCreateRoutineModalOpen}
      >
        <DialogContent className="bg-[#2A3133] border-gray-600 max-w-4xl z-[110]">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Routine</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add videos/exercises to create a reusable routine. This routine
              can then be added to any program day.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Routine Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="routine-name" className="text-white">
                  Routine Name
                </Label>
                <Input
                  id="routine-name"
                  value={newRoutine.name}
                  onChange={e =>
                    setNewRoutine(prev => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Drive Warm-up, Core Stability"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="routine-description" className="text-white">
                  Description
                </Label>
                <Input
                  id="routine-description"
                  value={newRoutine.description}
                  onChange={e =>
                    setNewRoutine(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe what this routine focuses on..."
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>

            {/* Routine Day */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Routine Day</h3>
                <Button
                  onClick={() => {
                    // Open video library to select videos for the routine
                    onOpenVideoLibrary?.();
                    setSelectedWeekId("routine-creation");
                    setSelectedDayKey("sun");
                  }}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Add from Library
                </Button>
              </div>

              <Card className="bg-gray-700/50 border-gray-600">
                <CardContent className="p-4">
                  {!newRoutine.exercises ||
                  newRoutine.exercises.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>
                        No exercises added yet. Click "Add Exercise" to get
                        started.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {newRoutine.exercises?.map((exercise, index) => (
                        <div
                          key={exercise.id}
                          className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-600"
                        >
                          <div className="flex-1">
                            <Input
                              value={exercise.title}
                              onChange={e => {
                                const updatedExercises = [
                                  ...(newRoutine.exercises || []),
                                ];
                                updatedExercises[index] = {
                                  ...exercise,
                                  title: e.target.value,
                                };
                                setNewRoutine(prev => ({
                                  ...prev,
                                  exercises: updatedExercises,
                                }));
                              }}
                              placeholder="Exercise name"
                              className="bg-gray-700 border-gray-600 text-white mb-2"
                            />
                            <div className="grid grid-cols-3 gap-2">
                              <Input
                                value={exercise.sets || ""}
                                onChange={e => {
                                  const updatedExercises = [
                                    ...(newRoutine.exercises || []),
                                  ];
                                  updatedExercises[index] = {
                                    ...exercise,
                                    sets: e.target.value
                                      ? parseInt(e.target.value)
                                      : undefined,
                                  };
                                  setNewRoutine(prev => ({
                                    ...prev,
                                    exercises: updatedExercises,
                                  }));
                                }}
                                type="number"
                                className="bg-gray-700 border-gray-600 text-white text-sm"
                              />
                              <Input
                                value={exercise.reps || ""}
                                onChange={e => {
                                  const updatedExercises = [
                                    ...(newRoutine.exercises || []),
                                  ];
                                  updatedExercises[index] = {
                                    ...exercise,
                                    reps: e.target.value
                                      ? parseInt(e.target.value)
                                      : undefined,
                                  };
                                  setNewRoutine(prev => ({
                                    ...prev,
                                    exercises: updatedExercises,
                                  }));
                                }}
                                type="number"
                                className="bg-gray-700 border-gray-600 text-white text-sm"
                              />
                              <Input
                                value={exercise.tempo || ""}
                                onChange={e => {
                                  const updatedExercises = [
                                    ...(newRoutine.exercises || []),
                                  ];
                                  updatedExercises[index] = {
                                    ...exercise,
                                    tempo: e.target.value,
                                  };
                                  setNewRoutine(prev => ({
                                    ...prev,
                                    exercises: updatedExercises,
                                  }));
                                }}
                                placeholder="e.g., 30 seconds"
                                className="bg-gray-700 border-gray-600 text-white text-sm"
                              />
                            </div>
                            <Input
                              value={exercise.notes || ""}
                              onChange={e => {
                                const updatedExercises = [
                                  ...(newRoutine.exercises || []),
                                ];
                                updatedExercises[index] = {
                                  ...exercise,
                                  notes: e.target.value,
                                };
                                setNewRoutine(prev => ({
                                  ...prev,
                                  exercises: updatedExercises,
                                }));
                              }}
                              placeholder="Notes (optional)"
                              className="bg-gray-700 border-gray-600 text-white text-sm mt-2"
                            />
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingExercise(exercise);
                                setIsExerciseEditDialogOpen(true);
                                setSelectedWeekId("routine-creation");
                              }}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                              type="button"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const updatedExercises =
                                  newRoutine.exercises?.filter(
                                    (_, i) => i !== index
                                  ) || [];
                                setNewRoutine(prev => ({
                                  ...prev,
                                  exercises: updatedExercises,
                                }));
                              }}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              type="button"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateRoutineModalOpen(false);
                setNewRoutine({ name: "", description: "", exercises: [] });
              }}
              className="border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRoutine}
              disabled={
                !newRoutine.name.trim() ||
                !newRoutine.description.trim() ||
                !newRoutine.exercises ||
                newRoutine.exercises.length === 0
              }
              className="bg-green-600 hover:bg-green-700"
            >
              Create Routine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Routine to Day Modal */}
      <Dialog
        open={isAddRoutineModalOpen}
        onOpenChange={setIsAddRoutineModalOpen}
      >
        <DialogContent className="bg-[#2A3133] border-gray-600 max-w-2xl z-[120]">
          <DialogHeader>
            <DialogTitle className="text-white">Add Routine to Day</DialogTitle>
            <DialogDescription className="text-gray-400">
              Select a routine to add to this day. The routine will appear as a
              single item but expand to show all exercises for clients.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search routines..."
                value={routineSearchTerm}
                onChange={e => setRoutineSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {routines.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No routines created yet.</p>
                <p className="text-sm">
                  Create a routine first to use this feature.
                </p>
              </div>
            ) : filteredRoutines.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No routines found matching "{routineSearchTerm}"</p>
                <p className="text-sm">Try adjusting your search terms.</p>
              </div>
            ) : (
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {filteredRoutines.map(routine => (
                  <Card
                    key={routine.id}
                    className="bg-gray-700/50 border-gray-600 hover:bg-gray-600/50 cursor-pointer transition-colors"
                    onClick={() => {
                      if (pendingRoutineDay) {
                        handleAddRoutineToDay(
                          routine,
                          pendingRoutineDay.weekId,
                          pendingRoutineDay.dayKey
                        );
                        setIsAddRoutineModalOpen(false);
                        setPendingRoutineDay(null);
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-white mb-1">
                            {routine.name}
                          </h3>
                          <p className="text-sm text-gray-400 mb-2">
                            {routine.description || "No description provided"}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>
                              {routine.exercises.length} exercise
                              {routine.exercises.length !== 1 ? "s" : ""}
                            </span>
                            {routine.exercises.length > 0 && (
                              <span>
                                •{" "}
                                {routine.exercises
                                  .map(ex => ex.title)
                                  .join(", ")}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddRoutineModalOpen(false);
                setPendingRoutineDay(null);
              }}
              className="border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Superset Description Modal */}
      <SupersetDescriptionModal
        isOpen={isSupersetDescriptionModalOpen}
        onClose={() => {
          setIsSupersetDescriptionModalOpen(false);
          setPendingSupersetDescription(null);
        }}
        onSave={handleSupersetDescriptionSave}
        initialData={pendingSupersetDescription?.currentData}
        supersetName={pendingSupersetDescription?.supersetName || "Superset"}
      />
    </div>
  );
}

// Week Card Component
interface WeekCardProps {
  week: Week;
  weekIndex: number;
  onToggleCollapse: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddItem: (weekId: string, dayKey: DayKey) => void;
  onEditItem: (weekId: string, dayKey: DayKey, item: ProgramItem) => void;
  onDeleteItem: (weekId: string, dayKey: DayKey, itemId: string) => void;
  onReorderItems: (
    weekId: string,
    dayKey: DayKey,
    newItems: ProgramItem[]
  ) => void;
  onAddRoutine: (routine: Routine, dayKey: DayKey) => void;
  routines: Routine[];
  sensors: any; // DndContext sensors
  onDragEnd: (event: DragEndEvent) => void;
  onCreateSuperset: (itemId: string, existingSupersetId?: string) => void;
  onRemoveSuperset: (itemId: string) => void;
  onOpenSupersetModal: (item: ProgramItem, existingGroupId?: string) => void;
  onOpenSupersetDescriptionModal: (
    supersetId: string,
    supersetName: string
  ) => void;
  getSupersetGroups: () => { name: string; items: ProgramItem[] }[];
  onOpenAddRoutine: (weekId: string, dayKey: DayKey) => void;
  onConvertToRoutine: (dayLabel: string, items: ProgramItem[]) => void;
  onCopyDay: (weekId: string, dayKey: DayKey) => void;
  onPasteDay: (weekId: string, dayKey: DayKey) => void;
  copiedDay: {
    weekId: string;
    dayKey: DayKey;
    items: ProgramItem[];
  } | null;
}

function WeekCard({
  week,
  weekIndex,
  onToggleCollapse,
  onDelete,
  onDuplicate,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onReorderItems,
  onAddRoutine,
  routines,
  sensors,
  onDragEnd,
  onCreateSuperset,
  onRemoveSuperset,
  onOpenSupersetModal,
  onOpenSupersetDescriptionModal,
  getSupersetGroups,
  onOpenAddRoutine,
  onConvertToRoutine,
  onCopyDay,
  onPasteDay,
  copiedDay,
}: WeekCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: week.id,
      data: {
        type: "week",
        week,
      },
    });

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="bg-[#353A3A] border-gray-600 shadow-xl w-full"
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="p-1 h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-600 flex-shrink-0"
            >
              {week.collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <CardTitle className="text-xl font-bold text-white truncate">
              {week.name}
            </CardTitle>
            <Badge
              variant="outline"
              className="bg-blue-500/10 text-blue-400 border-blue-500/20 flex-shrink-0"
            >
              {weekIndex + 1}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onDuplicate}
              className="border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white h-8 w-8 p-0"
              title="Duplicate week"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="border-red-500 text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
              title="Delete week"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!week.collapsed && (
        <CardContent className="px-4 pb-6">
          <div className="grid grid-cols-7 gap-3">
            {DAY_KEYS.map(dayKey => (
              <DayCard
                key={dayKey}
                dayKey={dayKey}
                dayLabel={DAY_LABELS[dayKey]}
                items={week.days[dayKey]}
                weekId={week.id}
                onAddItem={() => onAddItem(week.id, dayKey)}
                onEditItem={item => onEditItem(week.id, dayKey, item)}
                onDeleteItem={itemId => onDeleteItem(week.id, dayKey, itemId)}
                onReorderItems={newItems =>
                  onReorderItems(week.id, dayKey, newItems)
                }
                onAddRoutine={() =>
                  onAddRoutine(
                    {
                      id: "temp-routine",
                      name: "New Routine",
                      description: "Description",
                      exercises: [],
                    },
                    dayKey
                  )
                }
                routines={routines}
                onCreateSuperset={onCreateSuperset}
                onRemoveSuperset={onRemoveSuperset}
                onOpenSupersetModal={onOpenSupersetModal}
                onOpenSupersetDescriptionModal={onOpenSupersetDescriptionModal}
                getSupersetGroups={getSupersetGroups}
                onOpenAddRoutine={onOpenAddRoutine}
                onConvertToRoutine={onConvertToRoutine}
                onCopyDay={() => onCopyDay(week.id, dayKey)}
                onPasteDay={() => onPasteDay(week.id, dayKey)}
                copiedDay={copiedDay}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Day Card Component
interface DayCardProps {
  dayKey: DayKey;
  dayLabel: string;
  items: ProgramItem[];
  weekId: string;
  onAddItem: () => void;
  onEditItem: (item: ProgramItem) => void;
  onDeleteItem: (itemId: string) => void;
  onReorderItems: (newItems: ProgramItem[]) => void;
  onAddRoutine: () => void;
  routines: Routine[];
  onCreateSuperset: (itemId: string, existingSupersetId?: string) => void;
  onRemoveSuperset: (itemId: string) => void;
  onOpenSupersetModal: (item: ProgramItem, existingGroupId?: string) => void;
  onOpenSupersetDescriptionModal: (
    supersetId: string,
    supersetName: string
  ) => void;
  getSupersetGroups: () => { name: string; items: ProgramItem[] }[];
  onOpenAddRoutine: (weekId: string, dayKey: DayKey) => void;
  onConvertToRoutine?: (dayLabel: string, items: ProgramItem[]) => void;
  onCopyDay: (weekId: string, dayKey: DayKey) => void;
  onPasteDay: (weekId: string, dayKey: DayKey) => void;
  copiedDay: {
    weekId: string;
    dayKey: DayKey;
    items: ProgramItem[];
  } | null;
}

function DayCard({
  dayKey,
  dayLabel,
  items,
  weekId,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onReorderItems,
  onAddRoutine,
  routines,
  onCreateSuperset,
  onRemoveSuperset,
  onOpenSupersetModal,
  onOpenSupersetDescriptionModal,
  getSupersetGroups,
  onOpenAddRoutine,
  onConvertToRoutine,
  onCopyDay,
  onPasteDay,
  copiedDay,
}: DayCardProps) {
  const [showRoutineInput, setShowRoutineInput] = useState(false);
  const [routineName, setRoutineName] = useState("");

  // Filter out rest day items and check if it's a rest day
  const nonRestItems = items.filter(item => item.type !== "rest");

  // Create a local getSupersetGroups function that works with the local items array
  const getLocalSupersetGroups = useCallback(() => {
    const groups: { [key: string]: ProgramItem[] } = {};
    nonRestItems.forEach(item => {
      if (item.supersetId) {
        if (!groups[item.supersetId]) {
          groups[item.supersetId] = [];
        }
        groups[item.supersetId].push(item);
      }
    });
    return Object.values(groups).map((items, index) => ({
      name: `Superset ${index + 1}`,
      items: items.sort(
        (a, b) => (a.supersetOrder || 0) - (b.supersetOrder || 0)
      ),
    }));
  }, [nonRestItems]);

  // For supersets, only show the first item in each group to avoid duplicates
  const filteredItems = nonRestItems.filter(item => {
    if (item.supersetId) {
      // Find the superset group using local function
      const supersetGroup = getLocalSupersetGroups().find(group =>
        group.items.some(groupItem => groupItem.id === item.id)
      );
      // Only show the first item in the superset group
      return supersetGroup && supersetGroup.items[0]?.id === item.id;
    }
    return true;
  });

  const isRestDay = filteredItems.length === 0;

  // Create sensors outside of conditional rendering
  const daySensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <div className="space-y-3">
      {/* Day Header */}
      <div className="text-center mb-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-medium text-gray-300">{dayLabel}</h3>
          <div className="flex items-center gap-1">
            {/* Copy Button */}
            <button
              onClick={() => onCopyDay(weekId, dayKey)}
              className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
              title="Copy this day"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
            {/* Paste Button */}
            <button
              onClick={() => onPasteDay(weekId, dayKey)}
              disabled={!copiedDay}
              className={`p-1 rounded transition-colors ${
                copiedDay
                  ? "text-gray-400 hover:text-white hover:bg-gray-600"
                  : "text-gray-600 cursor-not-allowed"
              }`}
              title={copiedDay ? "Paste copied day" : "No day copied"}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Day Content */}
      <Card
        className={cn(
          "min-h-[300px] w-full",
          isRestDay
            ? "bg-gray-700/30 border-gray-500/30"
            : "bg-gray-700/50 border-gray-500/50"
        )}
      >
        <CardContent className="p-3">
          {isRestDay ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
              <Moon className="h-6 w-6 mb-2 opacity-50" />
              <span className="text-xs font-medium">Rest Day</span>
            </div>
          ) : (
            <DndContext
              sensors={daySensors}
              collisionDetection={closestCenter}
              onDragEnd={event => {
                const { active, over } = event;
                if (over && active.id !== over.id) {
                  const oldIndex = filteredItems.findIndex(
                    item => item.id === active.id
                  );
                  const newIndex = filteredItems.findIndex(
                    item => item.id === over.id
                  );
                  if (oldIndex !== -1 && newIndex !== -1) {
                    // For reordering, we need to work with the original items array
                    // but maintain the superset grouping
                    const newItems = arrayMove(
                      nonRestItems,
                      oldIndex,
                      newIndex
                    );
                    // Update the items in the parent component
                    onReorderItems(newItems);
                  }
                }
              }}
            >
              <SortableContext
                items={filteredItems.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {filteredItems.map(item => (
                    <SortableDrillItem
                      key={item.id}
                      item={item}
                      onEdit={() => onEditItem(item)}
                      onDelete={() => onDeleteItem(item.id)}
                      onAddSuperset={() => onOpenSupersetModal(item)}
                      routines={routines}
                      onCreateSuperset={(itemId, existingId) => {
                        const item = items.find(i => i.id === itemId);
                        if (item) {
                          onOpenSupersetModal(item, existingId);
                        }
                      }}
                      onRemoveSuperset={onRemoveSuperset}
                      onOpenSupersetModal={onOpenSupersetModal}
                      onOpenSupersetDescriptionModal={
                        onOpenSupersetDescriptionModal
                      }
                      getSupersetGroups={getLocalSupersetGroups}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Add Buttons */}
      <div className="space-y-2">
        <Button
          onClick={() => onAddItem()}
          variant="outline"
          size="sm"
          className="w-full border-gray-500/50 text-gray-400 hover:bg-gray-600 hover:text-white hover:border-gray-400"
        >
          <Video className="h-3 w-3 mr-1" />
          Add from Library
        </Button>
        <Button
          onClick={() => onOpenAddRoutine(weekId, dayKey)}
          variant="outline"
          size="sm"
          className="w-full border-green-500/50 text-green-400 hover:bg-green-500/10 hover:border-green-400"
        >
          <Target className="h-3 w-3 mr-1" />
          Add Routine
        </Button>
        {!isRestDay && items.length > 0 && (
          <>
            {!showRoutineInput ? (
              <Button
                onClick={() => {
                  setShowRoutineInput(true);
                  setRoutineName("");
                }}
                variant="outline"
                size="sm"
                className="w-full border-blue-500/50 text-green-600 hover:bg-blue-500/10 hover:border-green-700"
              >
                Save as Routine
              </Button>
            ) : (
              <div className="space-y-2">
                <Input
                  type="text"
                  value={routineName}
                  onChange={e => setRoutineName(e.target.value)}
                  placeholder="Name of Routine"
                  className="w-full h-9 text-xs bg-stone-800 border-neutral-500/50 text-white placeholder-gray-500"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === "Enter" && routineName.trim()) {
                      const exercises = items.map(item => ({
                        title: item.title,
                        type: item.type || "exercise",
                        notes: item.notes || "",
                        sets: item.sets ?? undefined,
                        reps: item.reps ?? undefined,
                        tempo: item.tempo || "",
                        duration: item.duration || "",
                        videoUrl: item.videoUrl ?? undefined,
                        videoId: item.videoId ?? undefined,
                        videoTitle: item.videoTitle ?? undefined,
                        videoThumbnail: item.videoThumbnail ?? undefined,
                      }));
                      onConvertToRoutine?.(routineName.trim(), items);
                      setShowRoutineInput(false);
                      setRoutineName("");
                    } else if (e.key === "Escape") {
                      setShowRoutineInput(false);
                      setRoutineName("");
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setShowRoutineInput(false);
                      setRoutineName("");
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-7 text-xs border-gray-600 text-gray-400 hover:bg-gray-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (routineName.trim()) {
                        const exercises = items.map(item => ({
                          title: item.title,
                          type: item.type || "exercise",
                          notes: item.notes || "",
                          sets: item.sets ?? undefined,
                          reps: item.reps ?? undefined,
                          tempo: item.tempo || "",
                          duration: item.duration || "",
                          videoUrl: item.videoUrl ?? undefined,
                          videoId: item.videoId ?? undefined,
                          videoTitle: item.videoTitle ?? undefined,
                          videoThumbnail: item.videoThumbnail ?? undefined,
                        }));
                        onConvertToRoutine?.(routineName.trim(), items);
                        setShowRoutineInput(false);
                        setRoutineName("");
                      }
                    }}
                    disabled={!routineName.trim()}
                    size="sm"
                    className="flex-1 h-7 text-xs bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                  >
                    Create
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Sortable Drill Item Component
interface SortableDrillItemProps {
  item: ProgramItem;
  onEdit: () => void;
  onDelete: () => void;
  onAddSuperset: () => void;
  routines: Routine[];
  onCreateSuperset: (itemId: string, existingSupersetId?: string) => void;
  onRemoveSuperset: (itemId: string) => void;
  onOpenSupersetModal: (item: ProgramItem, existingGroupId?: string) => void;
  onOpenSupersetDescriptionModal: (
    supersetId: string,
    supersetName: string
  ) => void;
  getSupersetGroups: () => { name: string; items: ProgramItem[] }[];
}

function SortableDrillItem({
  item,
  onEdit,
  onDelete,
  onAddSuperset,
  routines,
  onCreateSuperset,
  onRemoveSuperset,
  onOpenSupersetModal,
  onOpenSupersetDescriptionModal,
  getSupersetGroups,
}: SortableDrillItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
  });

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
  };

  const isRoutine = item.type === "routine";
  const isSuperset = item.supersetId !== undefined;

  // Get superset group if this is a superset
  const supersetGroup = isSuperset
    ? getSupersetGroups().find(group =>
        group.items.some(groupItem => groupItem.id === item.id)
      )
    : null;

  // For supersets, only render the first item in the group to avoid duplicates
  const isFirstInSuperset =
    isSuperset && supersetGroup && supersetGroup.items[0]?.id === item.id;

  // Don't render if this is a superset but not the first item
  if (isSuperset && !isFirstInSuperset) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg p-3 border transition-all duration-200 group",
        isDragging && "opacity-50 scale-95",
        isSuperset
          ? "bg-purple-600/30 border-purple-500/50"
          : isRoutine
          ? "bg-green-900/20 border-green-400"
          : "bg-gray-800 border-gray-600"
      )}
    >
      {/* Superset/Circuit indicator */}
      {isSuperset && supersetGroup && (
        <div className="text-xs text-purple-300 mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Link className="h-3 w-3" />
            <span className="font-medium">
              {supersetGroup.items.length === 2
                ? "SUPERSET"
                : `CIRCUIT (${supersetGroup.items.length} exercises)`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const groupName =
                  supersetGroup.items.length === 2
                    ? "Superset"
                    : `Circuit (${supersetGroup.items.length})`;
                onOpenSupersetDescriptionModal(item.supersetId!, groupName);
              }}
              className="text-purple-300 hover:text-white hover:bg-purple-600/20 p-1 h-6"
              title="Edit group details"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onOpenSupersetModal(item, item.supersetId!);
              }}
              className="text-purple-300 hover:text-white hover:bg-purple-600/20 p-1 h-6"
              title="Add exercise to group"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Routine indicator */}
      {isRoutine && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-green-900/30 rounded-lg">
          <span className="text-green-300 text-xs font-medium">Routine</span>
        </div>
      )}

      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-white"
        >
          <GripVertical className="h-3 w-3" />
        </div>

        {/* Item content */}
        <div className="flex-1 min-w-0">
          {/* For supersets, show both titles stacked */}
          {isSuperset && supersetGroup ? (
            <div className="space-y-1">
              {supersetGroup.items.map((supersetItem, index) => (
                <div key={supersetItem.id} className="flex items-center gap-2">
                  <span className="text-xs font-medium text-white truncate whitespace-nowrap">
                    {supersetItem.title}
                  </span>
                  {index === 0 && (
                    <span className="text-xs text-purple-300 font-medium">
                      +
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-white truncate whitespace-nowrap">
                {item.title}
              </span>
            </div>
          )}

          {/* Notes - show notes from first item in superset */}
          {(isSuperset ? supersetGroup?.items[0]?.notes : item.notes) && (
            <p className="text-xs text-gray-400 line-clamp-2">
              {isSuperset ? supersetGroup?.items[0]?.notes : item.notes}
            </p>
          )}
        </div>

        {/* Action buttons - always visible */}
        <div className="flex items-center gap-1">
          {/* Superset Chain Link Button */}
          {!item.supersetId ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddSuperset}
              className="h-7 w-7 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 border border-blue-400/30"
              title="Add Superset"
            >
              <Link className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveSuperset(item.id)}
              className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10 border border-red-400/30"
              title="Remove Superset"
            >
              <Unlink className="h-4 w-4" />
            </Button>
          )}

          {!isSuperset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
                onEdit();
              }}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Exercise details at bottom - use first item's data for supersets */}
      {(() => {
        const displayItem = isSuperset ? supersetGroup?.items[0] : item;
        const details = [
          displayItem?.sets && `${displayItem.sets}s`,
          displayItem?.reps && `${displayItem.reps}r`,
          displayItem?.tempo && displayItem.tempo,
          displayItem?.duration && displayItem.duration,
        ].filter(Boolean);

        return (
          details.length > 0 && (
            <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-600/50">
              {details.join(" • ")}
            </div>
          )
        );
      })()}
    </div>
  );
}

// Program Item Card Component
interface ProgramItemCardProps {
  item: ProgramItem;
  onEdit: () => void;
  onDelete: () => void;
  onAddSuperset: () => void;
  routines: Routine[];
  onCreateSuperset: (itemId: string, existingSupersetId?: string) => void;
  onRemoveSuperset: (itemId: string) => void;
  onOpenSupersetDescriptionModal: (
    supersetId: string,
    supersetName: string
  ) => void;
  getSupersetGroups: () => { name: string; items: ProgramItem[] }[];
}

function ProgramItemCard({
  item,
  onEdit,
  onDelete,
  onAddSuperset,
  routines,
  onCreateSuperset,
  onRemoveSuperset,
  onOpenSupersetDescriptionModal,
  getSupersetGroups,
}: ProgramItemCardProps) {
  const getItemIcon = () => {
    switch (item.type) {
      case "exercise":
        return <Target className="h-3 w-3" />;
      case "drill":
        return <Play className="h-3 w-3" />;
      case "video":
        return <Video className="h-3 w-3" />;
      case "routine":
        return <GripVertical className="h-3 w-3" />;
      default:
        return <Target className="h-3 w-3" />;
    }
  };

  const getItemColor = () => {
    switch (item.type) {
      case "exercise":
        return "bg-green-400";
      case "drill":
        return "bg-blue-400";
      case "video":
        return "bg-purple-400";
      case "routine":
        return "bg-yellow-400";
      default:
        return "bg-green-400";
    }
  };

  const isSuperset = item.supersetId !== undefined;
  const supersetGroup = isSuperset
    ? getSupersetGroups().find(group =>
        group.items.some(groupItem => groupItem.id === item.id)
      )
    : null;

  return (
    <Card
      className={`${
        isSuperset
          ? "bg-purple-600/30 border-purple-500/50"
          : "bg-gray-600/50 border-gray-500/50"
      }`}
    >
      <CardContent className="p-3">
        {/* Superset Header */}
        {isSuperset && supersetGroup && (
          <div className="mb-3 pb-2 border-b border-purple-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4 text-purple-300" />
                <span className="text-sm font-medium text-purple-300">
                  {supersetGroup.items.length === 2
                    ? "SUPERSET"
                    : `CIRCUIT (${supersetGroup.items.length} exercises)`}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  onOpenSupersetDescriptionModal(
                    item.supersetId!,
                    supersetGroup.items.length === 2
                      ? "Superset"
                      : `Circuit (${supersetGroup.items.length})`
                  )
                }
                className="text-purple-300 hover:text-white hover:bg-purple-600/20 px-2 py-1 h-7 text-xs"
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit Instructions
              </Button>
            </div>
          </div>
        )}

        {/* Exercise Content */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className={cn("w-2 h-2 rounded-full", getItemColor())} />
                <span className="text-sm font-medium text-white truncate">
                  {item.title}
                </span>
              </div>

              {item.sets && item.reps && (
                <div className="text-xs text-gray-300 mb-1">
                  {item.sets} × {item.reps}
                  {item.tempo && ` @ ${item.tempo}`}
                </div>
              )}

              {item.duration && (
                <div className="text-xs text-gray-300 mb-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {item.duration}
                </div>
              )}

              {item.notes && (
                <p className="text-xs text-gray-400 line-clamp-2">
                  {item.notes}
                </p>
              )}

              {/* Coach Instructions */}
              {item.coachInstructions && (
                <div className="mt-2">
                  <CoachInstructionsDisplay
                    instructions={item.coachInstructions}
                    compact={true}
                    className="text-xs"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 ml-2">
              {/* Superset Controls */}
              {!isSuperset ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAddSuperset}
                  className="h-7 w-7 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 border border-blue-400/30"
                  title="Add Superset"
                >
                  <Link className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveSuperset(item.id)}
                  className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10 border border-red-400/30"
                  title="Remove Superset"
                >
                  <Unlink className="h-4 w-4" />
                </Button>
              )}

              {/* More Options Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-gray-500"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-700 border-gray-600">
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      e.preventDefault();
                      onEdit();
                    }}
                    className="text-white hover:bg-gray-600"
                  >
                    <Edit className="h-3 w-3 mr-2" />
                    Edit Exercise
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-600" />
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-red-400 hover:bg-red-400/10"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
// Export with mobile detection
export default withMobileDetection(MobileProgramBuilderNew, ProgramBuilder);
