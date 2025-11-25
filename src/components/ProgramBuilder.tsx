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
import { COLORS } from "@/lib/colors";

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
      <DialogContent className="z-[120] max-w-2xl [&>button]:hidden"
        style={{
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE,
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>Edit Exercise</DialogTitle>
          <DialogDescription className="text-xs mt-0.5" style={{ color: COLORS.TEXT_SECONDARY }}>
            Update the exercise details and instructions
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="title" className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                Exercise Title
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e =>
                  setFormData(prev => ({ ...prev, title: e.target.value }))
                }
                className="mt-1.5 h-9 text-sm"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                }}
                placeholder="Exercise name"
                required
              />
            </div>

            <div>
              <Label htmlFor="duration" className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                Duration (optional)
              </Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={e =>
                  setFormData(prev => ({ ...prev, duration: e.target.value }))
                }
                className="mt-1.5 h-9 text-sm"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                }}
                placeholder="e.g., 30 seconds"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label htmlFor="description" className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                Exercise Description
              </Label>
              <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
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
              className="text-sm"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                borderColor: COLORS.BORDER_SUBTLE,
                color: COLORS.TEXT_PRIMARY,
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
              }}
              placeholder="Describe how to perform this exercise..."
              rows={3}
              maxLength={120}
            />
          </div>

          {/* Sets, Reps, Duration */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="sets" className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
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
                className="mt-1.5 h-9 text-sm"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                }}
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="reps" className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
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
                className="mt-1.5 h-9 text-sm"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                }}
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="tempo" className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                Duration
              </Label>
              <Input
                id="tempo"
                value={formData.tempo}
                onChange={e =>
                  setFormData(prev => ({ ...prev, tempo: e.target.value }))
                }
                className="mt-1.5 h-9 text-sm"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                }}
                placeholder="e.g., 30 seconds"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs h-8 px-3"
              style={{
                borderColor: COLORS.BORDER_SUBTLE,
                color: COLORS.TEXT_SECONDARY,
                backgroundColor: COLORS.BACKGROUND_CARD,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="text-xs h-8 px-3"
              style={{
                backgroundColor: COLORS.GOLDEN_DARK,
                color: COLORS.TEXT_PRIMARY,
              }}
              onMouseEnter={e => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
              }}
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
      style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
    >
      {/* Program Details Header */}
      {programDetails && (
        <div className="mb-6 p-4 rounded-lg border"
          style={{
            backgroundColor: COLORS.BACKGROUND_CARD,
            borderColor: COLORS.BORDER_SUBTLE,
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                {programDetails.onBack && (
                  <Button
                    variant="ghost"
                    onClick={programDetails.onBack}
                    className="p-1 h-8"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                      e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                    <span className="text-xs">Back</span>
                  </Button>
                )}
                <h2 className="text-lg font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>
                  {programDetails.title || "Untitled Program"}
                </h2>
              </div>
              <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                {programDetails.description || "No description provided"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="text-xs px-2 py-0.5"
                style={{
                  backgroundColor: "rgba(112, 207, 112, 0.1)",
                  color: COLORS.GREEN_PRIMARY,
                  borderColor: "rgba(112, 207, 112, 0.2)",
                }}
              >
                {programDetails.level}
              </Badge>
              <Badge
                variant="outline"
                className="text-xs px-2 py-0.5"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  color: COLORS.TEXT_SECONDARY,
                  borderColor: COLORS.BORDER_SUBTLE,
                }}
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
                className="text-xs h-8 px-3"
                style={{
                  backgroundColor: COLORS.GREEN_PRIMARY,
                  color: COLORS.TEXT_PRIMARY,
                }}
                onMouseEnter={e => {
                  if (!programDetails.isSaving) {
                    e.currentTarget.style.backgroundColor = COLORS.GREEN_DARK;
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = COLORS.GREEN_PRIMARY;
                }}
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                {programDetails.isSaving ? "Saving..." : "Save Program"}
              </Button>
            </div>
          </div>
          {programDetails.lastSaved && (
            <p className="text-xs mt-2" style={{ color: COLORS.TEXT_MUTED }}>
              Last saved: {programDetails.lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>
      )}

      {/* Top Toolbar - Only show when not in edit mode */}
      {!programDetails && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={addWeek}
                className="text-xs h-8 px-3"
                style={{
                  backgroundColor: COLORS.GOLDEN_DARK,
                  color: COLORS.TEXT_PRIMARY,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
                }}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Week
              </Button>
              <Button
                onClick={toggleCollapseAll}
                variant="outline"
                className="text-xs h-8 px-3"
                style={{
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_SECONDARY,
                  backgroundColor: COLORS.BACKGROUND_CARD,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                  e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                  e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                }}
              >
                {weeks.every(week => week.collapsed) ? (
                  <>
                    <Expand className="h-3.5 w-3.5 mr-1.5" />
                    Expand All
                  </>
                ) : (
                  <>
                    <Minimize className="h-3.5 w-3.5 mr-1.5" />
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
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Button
              onClick={addWeek}
              className="text-xs h-8 px-3"
              style={{
                backgroundColor: COLORS.GOLDEN_DARK,
                color: COLORS.TEXT_PRIMARY,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Week
            </Button>
            <Button
              onClick={toggleCollapseAll}
              variant="outline"
              className="text-xs h-8 px-3"
              style={{
                borderColor: COLORS.BORDER_SUBTLE,
                color: COLORS.TEXT_SECONDARY,
                backgroundColor: COLORS.BACKGROUND_CARD,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              }}
            >
              {weeks.every(week => week.collapsed) ? (
                <>
                  <Expand className="h-3.5 w-3.5 mr-1.5" />
                  Expand All
                </>
              ) : (
                <>
                  <Minimize className="h-3.5 w-3.5 mr-1.5" />
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
        <DialogContent className="z-[120] max-w-2xl max-h-[80vh] flex flex-col [&>button]:hidden"
          style={{
            backgroundColor: COLORS.BACKGROUND_DARK,
            borderColor: COLORS.BORDER_SUBTLE,
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>
              {isAddingToExisting
                ? `Add to ${
                    existingSupersetId
                      ? getGroupName(existingSupersetId)
                      : "Group"
                  }`
                : "Create Superset or Circuit"}
            </DialogTitle>
            <DialogDescription className="text-xs mt-0.5" style={{ color: COLORS.TEXT_SECONDARY }}>
              {isAddingToExisting
                ? "Select exercises to add to this group"
                : "Select one or more exercises from the same day. Select 1 exercise for a Superset (2 total) or 2+ exercises for a Circuit (3+ total)."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 p-4">
            <div>
              <Label className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                {isAddingToExisting ? "Current Group" : "First Exercise"}
              </Label>
              <div className="p-2.5 rounded-md border mt-1.5"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.BORDER_SUBTLE,
                }}
              >
                <p className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                  {pendingSupersetDrill?.title}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: COLORS.TEXT_SECONDARY }}>
                  {pendingSupersetDrill?.notes}
                </p>
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
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
              <div className="max-h-64 overflow-y-auto border rounded p-2 space-y-1.5 mt-1.5"
                style={{
                  backgroundColor: COLORS.BACKGROUND_DARK,
                  borderColor: COLORS.BORDER_SUBTLE,
                }}
              >
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
                      className="flex items-center space-x-2.5 p-2 rounded-md cursor-pointer transition-colors"
                      style={{
                        backgroundColor: selectedExerciseIds.has(item.id) ? COLORS.BACKGROUND_CARD_HOVER : "transparent",
                      }}
                      onMouseEnter={e => {
                        if (!selectedExerciseIds.has(item.id)) {
                          e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                        }
                      }}
                      onMouseLeave={e => {
                        if (!selectedExerciseIds.has(item.id)) {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedExerciseIds.has(item.id)}
                        onChange={() => toggleExerciseSelection(item.id)}
                        className="w-3.5 h-3.5 rounded"
                        style={{
                          accentColor: COLORS.GOLDEN_ACCENT,
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                          {item.title}
                        </p>
                        {item.notes && (
                          <p className="text-[10px] mt-0.5" style={{ color: COLORS.TEXT_SECONDARY }}>{item.notes}</p>
                        )}
                      </div>
                    </label>
                  ))}
              </div>
            </div>
          </div>
          <DialogFooter className="border-t p-3 gap-2" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <Button
              variant="outline"
              onClick={() => {
                setIsSupersetModalOpen(false);
                setSelectedExerciseIds(new Set());
                setPendingSupersetDrill(null);
                setIsAddingToExisting(false);
                setExistingSupersetId(null);
              }}
              className="text-xs h-8 px-3"
              style={{
                borderColor: COLORS.BORDER_SUBTLE,
                color: COLORS.TEXT_SECONDARY,
                backgroundColor: COLORS.BACKGROUND_CARD,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSuperset}
              disabled={!isAddingToExisting && selectedExerciseIds.size === 0}
              className="text-xs h-8 px-3"
              style={{
                backgroundColor: COLORS.GOLDEN_DARK,
                color: COLORS.TEXT_PRIMARY,
              }}
              onMouseEnter={e => {
                if (!isAddingToExisting && selectedExerciseIds.size === 0) return;
                e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
              }}
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
        <DialogContent className="max-w-4xl z-[110] [&>button]:hidden"
          style={{
            backgroundColor: COLORS.BACKGROUND_DARK,
            borderColor: COLORS.BORDER_SUBTLE,
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>Create New Routine</DialogTitle>
            <DialogDescription className="text-xs mt-0.5" style={{ color: COLORS.TEXT_SECONDARY }}>
              Add videos/exercises to create a reusable routine. This routine
              can then be added to any program day.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Routine Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="routine-name" className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                  Routine Name
                </Label>
                <Input
                  id="routine-name"
                  value={newRoutine.name}
                  onChange={e =>
                    setNewRoutine(prev => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Drive Warm-up, Core Stability"
                  className="mt-1.5 h-9 text-sm"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    borderColor: COLORS.BORDER_SUBTLE,
                    color: COLORS.TEXT_PRIMARY,
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = "#F28F3B";
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                  }}
                />
              </div>
              <div>
                <Label htmlFor="routine-description" className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
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
                  className="mt-1.5 h-9 text-sm"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    borderColor: COLORS.BORDER_SUBTLE,
                    color: COLORS.TEXT_PRIMARY,
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = "#F28F3B";
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                  }}
                />
              </div>
            </div>

            {/* Routine Day */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>Routine Day</h3>
                <Button
                  onClick={() => {
                    // Open video library to select videos for the routine
                    onOpenVideoLibrary?.();
                    setSelectedWeekId("routine-creation");
                    setSelectedDayKey("sun");
                  }}
                  size="sm"
                  className="text-xs h-8 px-3"
                  style={{
                    backgroundColor: "#F28F3B",
                    color: COLORS.TEXT_PRIMARY,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = "#D67A2F";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "#F28F3B";
                  }}
                >
                  <Video className="h-3.5 w-3.5 mr-1.5" />
                  Add from Library
                </Button>
              </div>

              <Card className="border"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.BORDER_SUBTLE,
                }}
              >
                <CardContent className="p-4">
                  {!newRoutine.exercises ||
                  newRoutine.exercises.length === 0 ? (
                    <div className="text-center py-6" style={{ color: COLORS.TEXT_SECONDARY }}>
                      <Target className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">
                        No exercises added yet. Click "Add Exercise" to get
                        started.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {newRoutine.exercises?.map((exercise, index) => (
                        <div
                          key={exercise.id}
                          className="flex items-center gap-2.5 p-2.5 rounded-md border"
                          style={{
                            backgroundColor: COLORS.BACKGROUND_DARK,
                            borderColor: COLORS.BORDER_SUBTLE,
                          }}
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
                              className="mb-1.5 h-8 text-xs"
                              style={{
                                backgroundColor: COLORS.BACKGROUND_CARD,
                                borderColor: COLORS.BORDER_SUBTLE,
                                color: COLORS.TEXT_PRIMARY,
                              }}
                              onFocus={e => {
                                e.currentTarget.style.borderColor = "#F28F3B";
                              }}
                              onBlur={e => {
                                e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                              }}
                            />
                            <div className="grid grid-cols-3 gap-1.5">
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
                                className="h-7 text-xs"
                                style={{
                                  backgroundColor: COLORS.BACKGROUND_CARD,
                                  borderColor: COLORS.BORDER_SUBTLE,
                                  color: COLORS.TEXT_PRIMARY,
                                }}
                                onFocus={e => {
                                  e.currentTarget.style.borderColor = "#F28F3B";
                                }}
                                onBlur={e => {
                                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                                }}
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
                                className="h-7 text-xs"
                                style={{
                                  backgroundColor: COLORS.BACKGROUND_CARD,
                                  borderColor: COLORS.BORDER_SUBTLE,
                                  color: COLORS.TEXT_PRIMARY,
                                }}
                                onFocus={e => {
                                  e.currentTarget.style.borderColor = "#F28F3B";
                                }}
                                onBlur={e => {
                                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                                }}
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
                                className="h-7 text-xs"
                                style={{
                                  backgroundColor: COLORS.BACKGROUND_CARD,
                                  borderColor: COLORS.BORDER_SUBTLE,
                                  color: COLORS.TEXT_PRIMARY,
                                }}
                                onFocus={e => {
                                  e.currentTarget.style.borderColor = "#F28F3B";
                                }}
                                onBlur={e => {
                                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                                }}
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
                              className="h-7 text-xs mt-1.5"
                              style={{
                                backgroundColor: COLORS.BACKGROUND_CARD,
                                borderColor: COLORS.BORDER_SUBTLE,
                                color: COLORS.TEXT_PRIMARY,
                              }}
                              onFocus={e => {
                                e.currentTarget.style.borderColor = "#F28F3B";
                              }}
                              onBlur={e => {
                                e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                              }}
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
                              className="p-1 h-7 w-7"
                              style={{ color: COLORS.GOLDEN_ACCENT }}
                              onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor = "transparent";
                              }}
                              type="button"
                            >
                              <Edit className="h-3.5 w-3.5" />
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
                              className="p-1 h-7 w-7"
                              style={{ color: COLORS.RED_ALERT }}
                              onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor = "transparent";
                              }}
                              type="button"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateRoutineModalOpen(false);
                setNewRoutine({ name: "", description: "", exercises: [] });
              }}
              className="text-xs h-8 px-3"
              style={{
                borderColor: COLORS.BORDER_SUBTLE,
                color: COLORS.TEXT_SECONDARY,
                backgroundColor: COLORS.BACKGROUND_CARD,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              }}
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
              className="text-xs h-8 px-3"
              style={{
                backgroundColor: "#F28F3B",
                color: COLORS.TEXT_PRIMARY,
              }}
              onMouseEnter={e => {
                if (!newRoutine.name.trim() ||
                    !newRoutine.description.trim() ||
                    !newRoutine.exercises ||
                    newRoutine.exercises.length === 0) return;
                e.currentTarget.style.backgroundColor = "#D67A2F";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "#F28F3B";
              }}
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
        <DialogContent className="max-w-2xl z-[120] [&>button]:hidden"
          style={{
            backgroundColor: COLORS.BACKGROUND_DARK,
            borderColor: COLORS.BORDER_SUBTLE,
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>Add Routine to Day</DialogTitle>
            <DialogDescription className="text-xs mt-0.5" style={{ color: COLORS.TEXT_SECONDARY }}>
              Select a routine to add to this day. The routine will appear as a
              single item but expand to show all exercises for clients.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5" style={{ color: COLORS.TEXT_SECONDARY }} />
              <Input
                type="text"
                placeholder="Search routines..."
                value={routineSearchTerm}
                onChange={e => setRoutineSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = "#F28F3B";
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                }}
              />
            </div>

            {routines.length === 0 ? (
              <div className="text-center py-6" style={{ color: COLORS.TEXT_SECONDARY }}>
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No routines created yet.</p>
                <p className="text-[10px] mt-1">
                  Create a routine first to use this feature.
                </p>
              </div>
            ) : filteredRoutines.length === 0 ? (
              <div className="text-center py-6" style={{ color: COLORS.TEXT_SECONDARY }}>
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No routines found matching "{routineSearchTerm}"</p>
                <p className="text-[10px] mt-1">Try adjusting your search terms.</p>
              </div>
            ) : (
              <div className="grid gap-2 max-h-96 overflow-y-auto">
                {filteredRoutines.map(routine => (
                  <Card
                    key={routine.id}
                    className="border cursor-pointer transition-colors"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_CARD,
                      borderColor: COLORS.BORDER_SUBTLE,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = "#F28F3B";
                      e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                      e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                    }}
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
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xs font-medium mb-1" style={{ color: COLORS.TEXT_PRIMARY }}>
                            {routine.name}
                          </h3>
                          <p className="text-[10px] mb-1.5" style={{ color: COLORS.TEXT_SECONDARY }}>
                            {routine.description || "No description provided"}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px]" style={{ color: COLORS.TEXT_MUTED }}>
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
                          className="text-xs h-7 px-2"
                          style={{
                            backgroundColor: "#F28F3B",
                            color: COLORS.TEXT_PRIMARY,
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = "#D67A2F";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = "#F28F3B";
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
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
              className="text-xs h-8 px-3"
              style={{
                borderColor: COLORS.BORDER_SUBTLE,
                color: COLORS.TEXT_SECONDARY,
                backgroundColor: COLORS.BACKGROUND_CARD,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              }}
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
      style={{
        ...style,
        backgroundColor: COLORS.BACKGROUND_CARD,
        borderColor: COLORS.BORDER_SUBTLE,
      }}
      className="shadow-xl w-full"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="p-1 h-7 w-7 flex-shrink-0"
              style={{ color: COLORS.TEXT_SECONDARY }}
              onMouseEnter={e => {
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {week.collapsed ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </Button>
            <CardTitle className="text-sm font-bold truncate" style={{ color: COLORS.TEXT_PRIMARY }}>
              {week.name}
            </CardTitle>
            <Badge
              variant="outline"
              className="text-xs px-2 py-0.5 flex-shrink-0"
              style={{
                backgroundColor: "rgba(229, 178, 50, 0.1)",
                color: COLORS.GOLDEN_ACCENT,
                borderColor: "rgba(229, 178, 50, 0.2)",
              }}
            >
              {weekIndex + 1}
            </Badge>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onDuplicate}
              className="h-7 w-7 p-0"
              style={{
                borderColor: COLORS.BORDER_SUBTLE,
                color: COLORS.TEXT_SECONDARY,
                backgroundColor: COLORS.BACKGROUND_CARD,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              }}
              title="Duplicate week"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="h-7 w-7 p-0"
              style={{
                borderColor: COLORS.RED_ALERT,
                color: COLORS.RED_ALERT,
                backgroundColor: "transparent",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = "rgba(217, 83, 79, 0.1)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
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
  // Configure pointer sensor with minimal activation constraint to allow smooth dragging
  const daySensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require 5px movement before drag starts (reduced from 8px)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <div className="space-y-3">
      {/* Day Header */}
      <div className="text-center mb-2.5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-medium" style={{ color: COLORS.TEXT_SECONDARY }}>{dayLabel}</h3>
          <div className="flex items-center gap-1">
            {/* Copy Button */}
            <button
              onClick={() => onCopyDay(weekId, dayKey)}
              className="p-1 rounded transition-colors"
              style={{ color: COLORS.TEXT_SECONDARY }}
              onMouseEnter={e => {
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              title="Copy this day"
            >
              <svg
                className="h-3.5 w-3.5"
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
              className="p-1 rounded transition-colors"
              style={{
                color: copiedDay ? COLORS.TEXT_SECONDARY : COLORS.TEXT_MUTED,
                cursor: copiedDay ? "pointer" : "not-allowed",
              }}
              onMouseEnter={e => {
                if (copiedDay) {
                  e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                  e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                }
              }}
              onMouseLeave={e => {
                if (copiedDay) {
                  e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
              title={copiedDay ? "Paste copied day" : "No day copied"}
            >
              <svg
                className="h-3.5 w-3.5"
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
        className="min-h-[250px] w-full border"
        style={{
          backgroundColor: isRestDay ? COLORS.BACKGROUND_DARK : COLORS.BACKGROUND_CARD,
          borderColor: COLORS.BORDER_SUBTLE,
        }}
      >
        <CardContent className="p-2.5">
          {isRestDay ? (
            <div className="flex flex-col items-center justify-center h-full text-center" style={{ color: COLORS.TEXT_SECONDARY }}>
              <Moon className="h-5 w-5 mb-1.5 opacity-50" />
              <span className="text-xs font-medium">Rest Day</span>
            </div>
          ) : (
            <DndContext
              sensors={daySensors}
              collisionDetection={closestCenter}
              onDragEnd={event => {
                const { active, over } = event;
                if (!over || active.id === over.id) return;
                
                // Find the dragged and target items in filteredItems (visible items)
                const draggedItem = filteredItems.find(
                  item => item.id === active.id
                );
                const targetItem = filteredItems.find(
                  item => item.id === over.id
                );
                
                if (!draggedItem || !targetItem) return;
                
                // For supersets, find all items in the group
                const draggedSupersetId = draggedItem.supersetId;
                let draggedGroupItems: ProgramItem[] = [draggedItem];
                
                if (draggedSupersetId) {
                  const supersetGroup = getLocalSupersetGroups().find(
                    group => group.items.some(item => item.id === draggedItem.id)
                  );
                  if (supersetGroup) {
                    draggedGroupItems = supersetGroup.items.sort(
                      (a, b) => (a.supersetOrder || 0) - (b.supersetOrder || 0)
                    );
                  }
                }
                
                // Find positions in nonRestItems (full array)
                const draggedIds = new Set(draggedGroupItems.map(item => item.id));
                const draggedIndices = nonRestItems
                  .map((item, idx) => draggedIds.has(item.id) ? idx : -1)
                  .filter(idx => idx !== -1)
                  .sort((a, b) => a - b);
                
                if (draggedIndices.length === 0) return;
                
                const draggedStartIndex = draggedIndices[0];
                const draggedEndIndex = draggedIndices[draggedIndices.length - 1];
                
                // Find target position - for supersets, use first item of group
                let targetItemToFind = targetItem;
                if (targetItem.supersetId) {
                  const targetSupersetGroup = getLocalSupersetGroups().find(
                    group => group.items.some(item => item.id === targetItem.id)
                  );
                  if (targetSupersetGroup) {
                    targetItemToFind = targetSupersetGroup.items.sort(
                      (a, b) => (a.supersetOrder || 0) - (b.supersetOrder || 0)
                    )[0];
                  }
                }
                
                let targetIndex = nonRestItems.findIndex(
                  item => item.id === targetItemToFind.id
                );
                
                if (targetIndex === -1) return;
                
                // For supersets, move all items together as a block
                if (draggedGroupItems.length > 1) {
                  // Remove all dragged items from the array
                  const itemsBeforeDragged = nonRestItems.slice(0, draggedStartIndex);
                  const itemsAfterDragged = nonRestItems.slice(draggedEndIndex + 1);
                  
                  // Adjust target index if moving down (items shift after removal)
                  if (draggedStartIndex < targetIndex) {
                    targetIndex = targetIndex - (draggedEndIndex - draggedStartIndex + 1);
                  }
                  
                  // Insert dragged items at new position
                  const newItems = [
                    ...itemsBeforeDragged,
                    ...itemsAfterDragged.slice(0, targetIndex),
                    ...draggedGroupItems,
                    ...itemsAfterDragged.slice(targetIndex),
                  ];
                  
                  onReorderItems(newItems);
                } else {
                  // Single item - use arrayMove for simplicity
                  const newItems = arrayMove(
                    nonRestItems,
                    draggedStartIndex,
                    targetIndex
                  );
                  onReorderItems(newItems);
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
      <div className="space-y-1.5">
        <Button
          onClick={() => onAddItem()}
          variant="outline"
          size="sm"
          className="w-full text-xs h-7"
          style={{
            borderColor: COLORS.BORDER_SUBTLE,
            color: COLORS.TEXT_SECONDARY,
            backgroundColor: COLORS.BACKGROUND_CARD,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
            e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
            e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
            e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
            e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
          }}
        >
          <Video className="h-3 w-3 mr-1" />
          Add from Library
        </Button>
        <Button
          onClick={() => onOpenAddRoutine(weekId, dayKey)}
          variant="outline"
          size="sm"
          className="w-full text-xs h-7"
          style={{
            borderColor: "rgba(242, 143, 59, 0.3)",
            color: "#F28F3B",
            backgroundColor: COLORS.BACKGROUND_CARD,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = "rgba(242, 143, 59, 0.1)";
            e.currentTarget.style.borderColor = "#F28F3B";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
            e.currentTarget.style.borderColor = "rgba(242, 143, 59, 0.3)";
          }}
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
                className="w-full text-xs h-7"
                style={{
                  borderColor: "rgba(242, 143, 59, 0.3)",
                  color: "#F28F3B",
                  backgroundColor: COLORS.BACKGROUND_CARD,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "rgba(242, 143, 59, 0.1)";
                  e.currentTarget.style.borderColor = "#F28F3B";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                  e.currentTarget.style.borderColor = "rgba(242, 143, 59, 0.3)";
                }}
              >
                Save as Routine
              </Button>
            ) : (
              <div className="space-y-1.5">
                <Input
                  type="text"
                  value={routineName}
                  onChange={e => setRoutineName(e.target.value)}
                  placeholder="Name of Routine"
                  className="w-full h-7 text-xs"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    borderColor: COLORS.BORDER_SUBTLE,
                    color: COLORS.TEXT_PRIMARY,
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = "#F28F3B";
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                  }}
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
                <div className="flex gap-1.5">
                  <Button
                    onClick={() => {
                      setShowRoutineInput(false);
                      setRoutineName("");
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-7 text-xs"
                    style={{
                      borderColor: COLORS.BORDER_SUBTLE,
                      color: COLORS.TEXT_SECONDARY,
                      backgroundColor: COLORS.BACKGROUND_CARD,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                      e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                      e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                    }}
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
                    className="flex-1 h-7 text-xs"
                    style={{
                      backgroundColor: "#F28F3B",
                      color: COLORS.TEXT_PRIMARY,
                      opacity: !routineName.trim() ? 0.5 : 1,
                    }}
                    onMouseEnter={e => {
                      if (routineName.trim()) {
                        e.currentTarget.style.backgroundColor = "#D67A2F";
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "#F28F3B";
                    }}
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
      style={{
        ...style,
        backgroundColor: isSuperset
          ? "rgba(242, 143, 59, 0.1)"
          : isRoutine
          ? "rgba(242, 143, 59, 0.1)"
          : COLORS.BACKGROUND_DARK,
        borderColor: isSuperset
          ? "rgba(242, 143, 59, 0.3)"
          : isRoutine
          ? "rgba(242, 143, 59, 0.3)"
          : COLORS.BORDER_SUBTLE,
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? "scale(0.95)" : undefined,
      }}
      className="rounded-md p-2 border transition-all duration-200 group"
    >
      {/* Superset/Circuit indicator */}
      {isSuperset && supersetGroup && (
        <div className="text-[10px] mb-1.5 flex items-center justify-between" style={{ color: "#F28F3B" }}>
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
              className="p-0.5 h-5 w-5"
              style={{ color: "#F28F3B" }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = "rgba(242, 143, 59, 0.2)";
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#F28F3B";
              }}
              title="Edit group details"
            >
              <Edit className="h-2.5 w-2.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onOpenSupersetModal(item, item.supersetId!);
              }}
              className="p-0.5 h-5 w-5"
              style={{ color: "#F28F3B" }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = "rgba(242, 143, 59, 0.2)";
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#F28F3B";
              }}
              title="Add exercise to group"
            >
              <Plus className="h-2.5 w-2.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Routine indicator */}
      {isRoutine && (
        <div className="flex items-center gap-1.5 mb-1.5 p-1.5 rounded-md" style={{ backgroundColor: "rgba(242, 143, 59, 0.1)" }}>
          <span className="text-xs font-medium" style={{ color: "#F28F3B" }}>Routine</span>
        </div>
      )}

      <div className="flex items-start gap-1.5">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5"
          style={{ color: COLORS.TEXT_SECONDARY }}
          onMouseEnter={e => {
            e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
          }}
        >
          <GripVertical className="h-3 w-3" />
        </div>

        {/* Item content */}
        <div className="flex-1 min-w-0">
          {/* For supersets, show both titles stacked */}
          {isSuperset && supersetGroup ? (
            <div className="space-y-0.5">
              {supersetGroup.items.map((supersetItem, index) => (
                <div key={supersetItem.id} className="flex items-center gap-1.5">
                  <span className="text-xs font-medium truncate whitespace-nowrap" style={{ color: COLORS.TEXT_PRIMARY }}>
                    {supersetItem.title}
                  </span>
                  {index === 0 && (
                    <span className="text-[10px] font-medium" style={{ color: "#F28F3B" }}>
                      +
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs font-medium truncate whitespace-nowrap" style={{ color: COLORS.TEXT_PRIMARY }}>
                {item.title}
              </span>
            </div>
          )}

          {/* Notes - show notes from first item in superset */}
          {(isSuperset ? supersetGroup?.items[0]?.notes : item.notes) && (
            <p className="text-[10px] line-clamp-2 mt-0.5" style={{ color: COLORS.TEXT_SECONDARY }}>
              {isSuperset ? supersetGroup?.items[0]?.notes : item.notes}
            </p>
          )}
        </div>

        {/* Action buttons - always visible */}
        <div className="flex items-center gap-0.5">
          {/* Superset Chain Link Button */}
          {!item.supersetId ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddSuperset}
              className="h-6 w-6 p-0 border"
              style={{
                color: COLORS.GOLDEN_ACCENT,
                borderColor: "rgba(229, 178, 50, 0.3)",
                backgroundColor: "transparent",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = "rgba(229, 178, 50, 0.1)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              title="Add Superset"
            >
              <Link className="h-3 w-3" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveSuperset(item.id)}
              className="h-6 w-6 p-0 border"
              style={{
                color: COLORS.RED_ALERT,
                borderColor: "rgba(217, 83, 79, 0.3)",
                backgroundColor: "transparent",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = "rgba(217, 83, 79, 0.1)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              title="Remove Superset"
            >
              <Unlink className="h-3 w-3" />
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
              className="h-5 w-5 p-0"
              style={{ color: COLORS.TEXT_SECONDARY }}
              onMouseEnter={e => {
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <Edit className="h-2.5 w-2.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-5 w-5 p-0"
            style={{ color: COLORS.RED_ALERT }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "rgba(217, 83, 79, 0.1)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <Trash2 className="h-2.5 w-2.5" />
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
            <div className="text-[10px] mt-1.5 pt-1.5 border-t" style={{ color: COLORS.TEXT_SECONDARY, borderColor: COLORS.BORDER_SUBTLE }}>
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
        return "bg-[#F28F3B]";
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
      className="border"
      style={{
        backgroundColor: isSuperset
          ? "rgba(242, 143, 59, 0.1)"
          : COLORS.BACKGROUND_CARD,
        borderColor: isSuperset
          ? "rgba(242, 143, 59, 0.3)"
          : COLORS.BORDER_SUBTLE,
      }}
    >
      <CardContent className="p-3">
        {/* Superset Header */}
        {isSuperset && supersetGroup && (
          <div className="mb-2.5 pb-2 border-b" style={{ borderColor: "rgba(242, 143, 59, 0.3)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Link className="h-3.5 w-3.5" style={{ color: "#F28F3B" }} />
                <span className="text-xs font-medium" style={{ color: "#F28F3B" }}>
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
                className="px-2 py-0.5 h-6 text-xs"
                style={{ color: "#F28F3B" }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "rgba(242, 143, 59, 0.2)";
                  e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#F28F3B";
                }}
              >
                <Edit className="h-2.5 w-2.5 mr-1" />
                Edit Instructions
              </Button>
            </div>
          </div>
        )}

        {/* Exercise Content */}
        <div className="space-y-1.5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <div className={cn("w-1.5 h-1.5 rounded-full", getItemColor())} />
                <span className="text-xs font-medium truncate" style={{ color: COLORS.TEXT_PRIMARY }}>
                  {item.title}
                </span>
              </div>

              {item.sets && item.reps && (
                <div className="text-[10px] mb-0.5" style={{ color: COLORS.TEXT_SECONDARY }}>
                  {item.sets} × {item.reps}
                  {item.tempo && ` @ ${item.tempo}`}
                </div>
              )}

              {item.duration && (
                <div className="text-[10px] mb-0.5 flex items-center gap-1" style={{ color: COLORS.TEXT_SECONDARY }}>
                  <Clock className="h-2.5 w-2.5" />
                  {item.duration}
                </div>
              )}

              {item.notes && (
                <p className="text-[10px] line-clamp-2" style={{ color: COLORS.TEXT_SECONDARY }}>
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
                  className="h-6 w-6 p-0 border"
                  style={{
                    color: COLORS.GOLDEN_ACCENT,
                    borderColor: "rgba(229, 178, 50, 0.3)",
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = "rgba(229, 178, 50, 0.1)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  title="Add Superset"
                >
                  <Link className="h-3 w-3" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveSuperset(item.id)}
                  className="h-6 w-6 p-0 border"
                  style={{
                    color: COLORS.RED_ALERT,
                    borderColor: "rgba(217, 83, 79, 0.3)",
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = "rgba(217, 83, 79, 0.1)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  title="Remove Superset"
                >
                  <Unlink className="h-3 w-3" />
                </Button>
              )}

              {/* More Options Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                      e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="border"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_DARK,
                    borderColor: COLORS.BORDER_SUBTLE,
                  }}
                >
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      e.preventDefault();
                      onEdit();
                    }}
                    className="text-xs"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <Edit className="h-3 w-3 mr-2" />
                    Edit Exercise
                  </DropdownMenuItem>
                  <DropdownMenuSeparator style={{ backgroundColor: COLORS.BORDER_SUBTLE }} />
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-xs"
                    style={{ color: COLORS.RED_ALERT }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = "rgba(217, 83, 79, 0.1)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
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
