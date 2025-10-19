"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
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
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
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
    description: exercise?.description || "",
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

  // Update form data when exercise changes
  useEffect(() => {
    if (exercise) {
      setFormData({
        title: exercise.title || "",
        description: exercise.description || "",
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
    }
  }, [exercise]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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

          {/* Sets, Reps, Tempo */}
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
                placeholder="3"
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
                placeholder="10"
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="tempo" className="text-gray-400 text-sm">
                Tempo
              </Label>
              <Input
                id="tempo"
                value={formData.tempo}
                onChange={e =>
                  setFormData(prev => ({ ...prev, tempo: e.target.value }))
                }
                className="bg-[#353A3A] border-gray-600 text-white"
                placeholder="2-1-2"
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
            >
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const DAY_KEYS: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

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
  const [editingItem, setEditingItem] = useState<ProgramItem | null>(null);
  const [isVideoDetailsDialogOpen, setIsVideoDetailsDialogOpen] =
    useState(false);
  const [isExerciseEditDialogOpen, setIsExerciseEditDialogOpen] =
    useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{
    id: string;
    title: string;
    description?: string;
    duration?: string;
    url?: string;
    thumbnail?: string;
  } | null>(null);
  const [editingExercise, setEditingExercise] = useState<ProgramItem | null>(
    null
  );
  const [isSupersetModalOpen, setIsSupersetModalOpen] = useState(false);
  const [pendingSupersetDrill, setPendingSupersetDrill] =
    useState<ProgramItem | null>(null);
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
  const [pendingRoutineDay, setPendingRoutineDay] = useState<{
    weekId: string;
    dayKey: DayKey;
  } | null>(null);
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
      const updatedWeeks = weeks.filter(week => week.id !== weekId);
      setWeeks(updatedWeeks);
    },
    [weeks]
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
      setSelectedWeekId(weekId);
      setSelectedDayKey(dayKey);
      setEditingItem(item);

      // Use the new exercise edit dialog for ALL exercises (including videos)
      setEditingExercise(item);
      setIsExerciseEditDialogOpen(true);
    },
    []
  );

  const openAddFromLibrary = useCallback(
    (weekId: string, dayKey: DayKey) => {
      setSelectedWeekId(weekId);
      setSelectedDayKey(dayKey);
      setEditingItem(null);
      onOpenVideoLibrary?.();
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
        setEditingExercise(videoItem);
        setIsExerciseEditDialogOpen(true);
        setSelectedWeekId("routine-creation"); // Keep this flag for the submit handler
      } else {
        // Normal video selection for program days - use new exercise edit dialog
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
        setEditingExercise(videoItem);
        setIsExerciseEditDialogOpen(true);
      }
    },
    [selectedWeekId]
  );

  // Handle video selection from library
  useEffect(() => {
    if (selectedVideoFromLibrary) {
      handleVideoSelect(selectedVideoFromLibrary);
      onVideoProcessed?.(); // Clear the selected video after processing
    }
  }, [selectedVideoFromLibrary, handleVideoSelect, onVideoProcessed]);

  const handleVideoDetailsSubmit = useCallback(
    (details: {
      notes?: string;
      sets?: number;
      reps?: number;
      tempo?: string;
      coachInstructions?: {
        whatToDo: string;
        howToDoIt: string;
        keyPoints: string[];
        commonMistakes: string[];
        modifications?: {
          easier?: string;
          harder?: string;
        };
        equipment?: string;
        setup?: string;
      };
    }) => {
      if (!selectedVideo) return;

      // Create the video item
      const videoItem: Omit<ProgramItem, "id"> = {
        title: selectedVideo.title,
        type: "video",
        notes: details.notes || "",
        duration: selectedVideo.duration || "",
        videoUrl: selectedVideo.url || "",
        videoId: selectedVideo.id,
        videoTitle: selectedVideo.title,
        videoThumbnail: selectedVideo.thumbnail || "",
        sets: details.sets,
        reps: details.reps,
        tempo: details.tempo || "",
        coachInstructions: details.coachInstructions,
      };

      // Add the video item to the program
      if (editingItem) {
        editItem(selectedWeekId, selectedDayKey, editingItem.id, videoItem);
      } else {
        addItem(selectedWeekId, selectedDayKey, videoItem);
      }

      // Close the dialog
      setIsVideoDetailsDialogOpen(false);
      setSelectedVideo(null);
      setEditingItem(null);
    },
    [
      selectedVideo,
      selectedWeekId,
      selectedDayKey,
      editingItem,
      addItem,
      editItem,
    ]
  );

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
      if (!editingExercise) return;

      // Create the updated exercise item
      const exerciseItem: Omit<ProgramItem, "id"> = {
        title: details.title,
        type: editingExercise.type || "exercise",
        description: details.description || "",
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
      setEditingItem(null);
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

    createRoutineMutation.mutate(
      {
        name: routineName,
        description: `Routine with ${items.length} ${
          items.length === 1 ? "exercise" : "exercises"
        }`,
        exercises: exercises as any,
      },
      {
        onSuccess: () => {
          addToast({
            type: "success",
            title: "Routine Created!",
            message: `"${routineName}" has been created with ${items.length} ${
              items.length === 1 ? "exercise" : "exercises"
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
          type: "routine",
          notes: routine.description,
          routineId: routine.id,
        };
        updatedDays[dayKey] = [...updatedDays[dayKey], routineItem];
        return { ...week, days: updatedDays };
      }
      return week;
    });
    setWeeks(updatedWeeks);
    onSave?.(updatedWeeks);
  };

  // Superset management
  const handleCreateSuperset = useCallback(
    (itemId: string, supersetId: string) => {
      const updatedWeeks = weeks.map(week => {
        if (week.id === selectedWeekId) {
          const updatedDays = { ...week.days };
          const item = updatedDays[selectedDayKey].find(i => i.id === itemId);
          const superset = updatedDays[selectedDayKey].find(
            i => i.id === supersetId
          );

          if (item && superset) {
            // Create a unique superset ID
            const supersetGroupId = `superset-${Date.now()}`;

            // Set both items as part of the same superset
            item.supersetId = supersetGroupId;
            item.supersetOrder = 1;
            item.type = "superset";
            superset.supersetId = supersetGroupId;
            superset.supersetOrder = 2;
            superset.type = "superset";

            console.log("=== CREATING SUPERSET ===");
            console.log("First exercise:", {
              id: item.id,
              title: item.title,
              supersetId: item.supersetId,
              supersetOrder: item.supersetOrder,
            });
            console.log("Second exercise:", {
              id: superset.id,
              title: superset.title,
              supersetId: superset.supersetId,
              supersetOrder: superset.supersetOrder,
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

  const handleOpenSupersetModal = useCallback((item: ProgramItem) => {
    setPendingSupersetDrill(item);
    setIsSupersetModalOpen(true);
  }, []);

  const onOpenSupersetDescriptionModal = useCallback(
    (supersetId: string, supersetName: string) => {
      // Find all exercises in the superset
      const allItems = weeks.flatMap(week => Object.values(week.days).flat());
      console.log(
        "All items before filtering:",
        allItems.map(item => ({
          id: item.id,
          title: item.title,
          supersetId: item.supersetId,
          supersetOrder: item.supersetOrder,
        }))
      );

      const supersetExercises = allItems
        .filter(item => item.supersetId === supersetId)
        .sort((a, b) => (a.supersetOrder || 0) - (b.supersetOrder || 0));

      console.log("=== LOADING SUPERSET DATA ===");
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
              exercises: supersetExercises.map(ex => ({
                id: ex.supersetOrder?.toString() || "1",
                title: ex.title,
                sets: ex.sets,
                reps: ex.reps,
                description: ex.description,
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

      const updatedWeeks = weeks.map(week => {
        const updatedDays = { ...week.days };
        Object.keys(updatedDays).forEach(dayKey => {
          updatedDays[dayKey as DayKey] = updatedDays[dayKey as DayKey].map(
            (item: ProgramItem) => {
              if (item.supersetId === pendingSupersetDescription.supersetId) {
                // Find the corresponding exercise data based on supersetOrder
                const exerciseData = data.exercises.find(
                  ex => ex.id === item.supersetOrder?.toString()
                );

                console.log("=== SAVING EXERCISE DATA ===");
                console.log("item.supersetOrder:", item.supersetOrder);
                console.log("exerciseData:", exerciseData);
                console.log("item.title:", item.title);
                console.log("data.exercises:", data.exercises);
                console.log("data.exercises[0]:", data.exercises[0]);
                console.log("data.exercises[1]:", data.exercises[1]);

                console.log(
                  "Before update - item.sets:",
                  item.sets,
                  "item.reps:",
                  item.reps,
                  "item.description:",
                  item.description
                );
                console.log(
                  "Before update - item.supersetId:",
                  item.supersetId,
                  "item.supersetOrder:",
                  item.supersetOrder
                );

                const updatedItem = {
                  ...item,
                  sets: exerciseData?.sets,
                  reps: exerciseData?.reps,
                  description: exerciseData?.description,
                  // Only set superset description on the first exercise (supersetOrder = 1)
                  supersetDescription:
                    item.supersetOrder === 1
                      ? data.supersetDescription
                      : item.supersetDescription,
                };

                console.log(
                  "After update - updatedItem.sets:",
                  updatedItem.sets,
                  "updatedItem.reps:",
                  updatedItem.reps,
                  "updatedItem.description:",
                  updatedItem.description
                );
                console.log(
                  "After update - updatedItem.supersetId:",
                  updatedItem.supersetId,
                  "updatedItem.supersetOrder:",
                  updatedItem.supersetOrder
                );
                return updatedItem;
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
            onCreateSuperset={handleCreateSuperset}
            onRemoveSuperset={handleRemoveSuperset}
            onOpenSupersetModal={handleOpenSupersetModal}
            onOpenSupersetDescriptionModal={onOpenSupersetDescriptionModal}
            getSupersetGroups={getSupersetGroups}
            onOpenAddRoutine={(weekId, dayKey) => {
              setPendingRoutineDay({ weekId, dayKey });
              setIsAddRoutineModalOpen(true);
            }}
            onConvertToRoutine={handleConvertDayToRoutine}
          />
        ))}
      </div>

      {/* Video Details Dialog */}

      <VideoDetailsDialogWithInstructions
        isOpen={isVideoDetailsDialogOpen}
        onClose={() => {
          setIsVideoDetailsDialogOpen(false);
          setSelectedVideo(null);
          setEditingItem(null);
        }}
        onSubmit={handleVideoDetailsSubmit}
        video={selectedVideo}
        existingItem={editingItem}
      />

      {/* Exercise Edit Dialog */}
      <ExerciseEditDialog
        isOpen={isExerciseEditDialogOpen}
        onClose={() => {
          setIsExerciseEditDialogOpen(false);
          setEditingExercise(null);
          setEditingItem(null);
        }}
        onSubmit={handleExerciseEditSubmit}
        exercise={editingExercise}
      />

      {/* Superset Modal */}
      <Dialog open={isSupersetModalOpen} onOpenChange={setIsSupersetModalOpen}>
        <DialogContent className="bg-[#2A3133] border-gray-600 z-[120]">
          <DialogHeader>
            <DialogTitle className="text-white">Create Superset</DialogTitle>
            <DialogDescription className="text-gray-400">
              Select another exercise from the same day to create a superset
              (minimal rest between exercises)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white">First Exercise</Label>
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
              <Label className="text-white">Second Exercise</Label>
              <select
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white"
                onChange={e => {
                  if (e.target.value && pendingSupersetDrill) {
                    handleCreateSuperset(
                      pendingSupersetDrill.id,
                      e.target.value
                    );
                    setIsSupersetModalOpen(false);
                  }
                }}
              >
                <option value="">
                  Select an exercise from the same day...
                </option>
                {weeks
                  .find(week => week.id === selectedWeekId)
                  ?.days[selectedDayKey]?.filter(
                    item => item.id !== pendingSupersetDrill?.id
                  )
                  .map(item => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
              </select>
            </div>
          </div>
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
                    setEditingItem(null);
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
                                placeholder="Sets"
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
                                placeholder="Reps"
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
                                placeholder="Tempo"
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
            {routines.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No routines created yet.</p>
                <p className="text-sm">
                  Create a routine first to use this feature.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {routines.map(routine => (
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
  onCreateSuperset: (itemId: string, supersetId: string) => void;
  onRemoveSuperset: (itemId: string) => void;
  onOpenSupersetModal: (item: ProgramItem) => void;
  onOpenSupersetDescriptionModal: (
    supersetId: string,
    supersetName: string
  ) => void;
  getSupersetGroups: () => { name: string; items: ProgramItem[] }[];
  onOpenAddRoutine: (weekId: string, dayKey: DayKey) => void;
  onConvertToRoutine: (dayLabel: string, items: ProgramItem[]) => void;
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="p-1 h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-600"
            >
              {week.collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <CardTitle className="text-xl font-bold text-white">
              {week.name}
            </CardTitle>
            <Badge
              variant="outline"
              className="bg-blue-500/10 text-blue-400 border-blue-500/20"
            >
              {weekIndex + 1}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onDuplicate}
              className="border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
            >
              <Copy className="h-4 w-4 mr-1" />
              Duplicate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="border-red-500 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
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
  onCreateSuperset: (itemId: string, supersetId: string) => void;
  onRemoveSuperset: (itemId: string) => void;
  onOpenSupersetModal: (item: ProgramItem) => void;
  onOpenSupersetDescriptionModal: (
    supersetId: string,
    supersetName: string
  ) => void;
  getSupersetGroups: () => { name: string; items: ProgramItem[] }[];
  onOpenAddRoutine: (weekId: string, dayKey: DayKey) => void;
  onConvertToRoutine?: (dayLabel: string, items: ProgramItem[]) => void;
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
        <h3 className="text-sm font-medium text-gray-300 mb-1">{dayLabel}</h3>
        <div className="text-xs text-gray-500 uppercase tracking-wide">
          {dayKey}
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
                      onCreateSuperset={onCreateSuperset}
                      onRemoveSuperset={onRemoveSuperset}
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
  onCreateSuperset: (itemId: string, supersetId: string) => void;
  onRemoveSuperset: (itemId: string) => void;
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
        "rounded-lg p-3 border transition-all duration-200",
        isDragging && "opacity-50 scale-95",
        isSuperset
          ? "bg-purple-600/30 border-purple-500/50"
          : isRoutine
          ? "bg-green-900/20 border-green-400"
          : "bg-gray-800 border-gray-600"
      )}
    >
      {/* Superset indicator */}
      {isSuperset && (
        <div className="text-xs text-purple-300 mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Link className="h-3 w-3" />
            <span className="font-medium">SUPERSET</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onOpenSupersetDescriptionModal(
                item.supersetId!,
                `Superset ${item.title}`
              )
            }
            className="text-purple-300 hover:text-white hover:bg-purple-600/20 p-1 h-6"
          >
            <Edit className="h-3 w-3" />
          </Button>
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
                  <span className="text-xs font-medium text-white truncate">
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
              <span className="text-xs font-medium text-white truncate">
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

        {/* Action buttons */}
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
              onClick={onEdit}
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
  onCreateSuperset: (itemId: string, supersetId: string) => void;
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
        {isSuperset && (
          <div className="mb-3 pb-2 border-b border-purple-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4 text-purple-300" />
                <span className="text-sm font-medium text-purple-300">
                  SUPERSET
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  onOpenSupersetDescriptionModal(
                    item.supersetId!,
                    `Superset ${item.title}`
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
                    onClick={onEdit}
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

// Video Details Dialog Component
interface VideoDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: {
    notes?: string;
    sets?: number;
    reps?: number;
    tempo?: string;
    coachInstructions?: {
      whatToDo: string;
      howToDoIt: string;
      keyPoints: string[];
      commonMistakes: string[];
      equipment?: string;
    };
  }) => void;
  video: {
    id: string;
    title: string;
    description?: string;
    duration?: string;
    url?: string;
    thumbnail?: string;
  } | null;
  existingItem?: ProgramItem | null; // Add existing item for editing
}

function VideoDetailsDialog({
  isOpen,
  onClose,
  onSubmit,
  video,
  existingItem,
}: VideoDetailsDialogProps) {
  const [formData, setFormData] = useState({
    notes: existingItem?.notes || "",
    sets: existingItem?.sets || undefined,
    reps: existingItem?.reps || undefined,
    tempo: existingItem?.tempo || "",
    coachInstructions: existingItem?.coachInstructions || undefined,
  });
  const [showCoachInstructions, setShowCoachInstructions] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    // Only reset form data if we're not editing an existing item
    if (!existingItem) {
      setFormData({
        notes: "",
        sets: undefined,
        reps: undefined,
        tempo: "",
        coachInstructions: undefined,
      });
    }
  };

  const handleQuickAdd = () => {
    // Add video with default values - no modal needed
    onSubmit({
      notes: "",
      sets: 3,
      reps: 10,
      tempo: "",
      coachInstructions: undefined,
    });
  };

  if (!video) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="bg-[#2A3133] border-gray-600 text-white z-[110] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-lg">Add Video</DialogTitle>
          <DialogDescription className="text-gray-400 text-sm">
            {video.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick Add Option */}
          <div className="p-3 bg-[#353A3A] rounded-lg border border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Quick Add</p>
                <p className="text-gray-400 text-xs">
                  Add with default settings (3 sets, 10 reps)
                </p>
              </div>
              <Button
                onClick={handleQuickAdd}
                className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1"
              >
                Add Now
              </Button>
            </div>
          </div>

          {/* Custom Settings */}
          <div className="border-t border-gray-600 pt-4">
            <p className="text-white text-sm font-medium mb-3">
              Custom Settings (Optional)
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="sets" className="text-gray-400 text-xs">
                    Sets
                  </Label>
                  <Input
                    id="sets"
                    type="number"
                    value={formData.sets || ""}
                    onChange={e => {
                      const value = parseInt(e.target.value);
                      if (value >= 0) {
                        setFormData(prev => ({
                          ...prev,
                          sets: value || undefined,
                        }));
                      }
                    }}
                    className="bg-[#353A3A] border-gray-600 text-white text-sm h-8"
                    placeholder="3"
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="reps" className="text-gray-400 text-xs">
                    Reps
                  </Label>
                  <Input
                    id="reps"
                    type="number"
                    value={formData.reps || ""}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        reps: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      }))
                    }
                    className="bg-[#353A3A] border-gray-600 text-white text-sm h-8"
                    placeholder="10"
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="tempo" className="text-gray-400 text-xs">
                    Tempo
                  </Label>
                  <Input
                    id="tempo"
                    value={formData.tempo}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, tempo: e.target.value }))
                    }
                    className="bg-[#353A3A] border-gray-600 text-white text-sm h-8"
                    placeholder="2-0-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes" className="text-gray-400 text-xs">
                  Notes
                </Label>
              </div>

              {/* Coach Instructions Button */}
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCoachInstructions(true)}
                  className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300 text-sm w-full"
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Add Coach Instructions
                </Button>
                {formData.coachInstructions && (
                  <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-yellow-300 text-xs">
                      ✓ Coach instructions added
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white text-sm flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm flex-1"
                >
                  Add Custom
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Add CoachInstructionsDialog component
function VideoDetailsDialogWithInstructions({
  isOpen,
  onClose,
  onSubmit,
  video,
  existingItem,
}: VideoDetailsDialogProps) {
  const [formData, setFormData] = useState({
    notes: existingItem?.notes || "",
    sets: existingItem?.sets || undefined,
    reps: existingItem?.reps || undefined,
    tempo: existingItem?.tempo || "",
    coachInstructions: existingItem?.coachInstructions || undefined,
  });
  const [showCoachInstructions, setShowCoachInstructions] = useState(false);

  // Update formData when existingItem changes
  useEffect(() => {
    if (existingItem) {
      setFormData({
        notes: existingItem.notes || "",
        sets: existingItem.sets || undefined,
        reps: existingItem.reps || undefined,
        tempo: existingItem.tempo || "",
        coachInstructions: existingItem.coachInstructions || undefined,
      });
    }
  }, [existingItem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    // Only reset form data if we're not editing an existing item
    if (!existingItem) {
      setFormData({
        notes: "",
        sets: undefined,
        reps: undefined,
        tempo: "",
        coachInstructions: undefined,
      });
    }
  };

  const handleQuickAdd = () => {
    onSubmit({
      notes: "",
      sets: 3,
      reps: 10,
      tempo: "",
      coachInstructions: undefined,
    });
  };

  const handleCoachInstructionsSubmit = (instructions: any) => {
    setFormData(prev => ({ ...prev, coachInstructions: instructions }));
    setShowCoachInstructions(false);
  };

  if (!video) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="bg-[#2A3133] border-gray-600 text-white z-[150] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">Add Video</DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              {video.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Quick Add Option */}
            <div className="p-3 bg-[#353A3A] rounded-lg border border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">Quick Add</p>
                  <p className="text-gray-400 text-xs">
                    Add with default settings (3 sets, 10 reps)
                  </p>
                </div>
                <Button
                  onClick={handleQuickAdd}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1"
                >
                  Add Now
                </Button>
              </div>
            </div>

            {/* Custom Settings */}
            <div className="border-t border-gray-600 pt-4">
              <p className="text-white text-sm font-medium mb-3">
                Custom Settings (Optional)
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="sets" className="text-gray-400 text-xs">
                      Sets
                    </Label>
                    <Input
                      id="sets"
                      type="number"
                      value={formData.sets || ""}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          sets: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        }))
                      }
                      className="bg-[#353A3A] border-gray-600 text-white text-sm h-8"
                      placeholder="3"
                      min="1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="reps" className="text-gray-400 text-xs">
                      Reps
                    </Label>
                    <Input
                      id="reps"
                      type="number"
                      value={formData.reps || ""}
                      onChange={e => {
                        const value = parseInt(e.target.value);
                        if (value >= 0) {
                          setFormData(prev => ({
                            ...prev,
                            reps: value || undefined,
                          }));
                        }
                      }}
                      className="bg-[#353A3A] border-gray-600 text-white text-sm h-8"
                      placeholder="10"
                      min="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tempo" className="text-gray-400 text-xs">
                      Tempo
                    </Label>
                    <Input
                      id="tempo"
                      value={formData.tempo}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          tempo: e.target.value,
                        }))
                      }
                      className="bg-[#353A3A] border-gray-600 text-white text-sm h-8"
                      placeholder="2-0-2"
                    />
                  </div>
                </div>

                {/* Coach Instructions Button */}
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCoachInstructions(true)}
                    className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300 text-sm w-full"
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Add Coach Instructions
                  </Button>
                  {formData.coachInstructions && (
                    <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-yellow-300 text-xs">
                        ✓ Coach instructions added
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white text-sm flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm flex-1"
                  >
                    Add Custom
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Coach Instructions Dialog */}
      <CoachInstructionsDialog
        isOpen={showCoachInstructions}
        onClose={() => setShowCoachInstructions(false)}
        onSubmit={handleCoachInstructionsSubmit}
        initialInstructions={formData.coachInstructions}
        exerciseTitle={video.title}
      />
    </>
  );
}

// Export with mobile detection
export default withMobileDetection(MobileProgramBuilderNew, ProgramBuilder);
