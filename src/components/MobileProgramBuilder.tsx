"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CustomSelect from "./ui/CustomSelect";
import SupersetDescriptionModal from "./SupersetDescriptionModal";
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
  GripVertical,
  Link,
  Unlink,
  ArrowLeft,
  Calendar,
  Users,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/app/_trpc/client";
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
type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

interface ProgramItem {
  id: string;
  title: string;
  type?: "exercise" | "drill" | "video" | "routine" | "superset" | "rest";
  description?: string;
  notes?: string;
  sets?: number;
  reps?: number;
  tempo?: string;
  duration?: string;
  videoUrl?: string;
  videoId?: string;
  videoTitle?: string;
  videoThumbnail?: string;
  routineId?: string;
  supersetId?: string;
  supersetOrder?: number;
  supersetDescription?: string;
  supersetInstructions?: string;
  supersetNotes?: string;
}

interface Routine {
  id: string;
  name: string;
  description: string;
  exercises: ProgramItem[];
}

interface Week {
  id: string;
  name: string;
  days: Record<DayKey, ProgramItem[]>;
  collapsed?: boolean;
}

interface ProgramBuilderProps {
  onSave?: (weeks: Week[]) => void;
  initialWeeks?: Week[];
  programDetails?: {
    title: string;
    description?: string;
    level: string;
    duration: number;
    onBack?: () => void;
    onSave?: (weeks?: Week[]) => void;
    isSaving?: boolean;
    lastSaved?: Date | null;
  };
  onOpenVideoLibrary?: () => void;
  selectedVideoFromLibrary?: {
    id: string;
    title: string;
    description?: string;
    duration?: string;
    url?: string;
    thumbnail?: string;
  } | null;
  onVideoProcessed?: () => void;
  hideHeader?: boolean;
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

const DAY_KEYS: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export default function MobileProgramBuilder({
  onSave,
  initialWeeks = [],
  programDetails,
  onOpenVideoLibrary,
  selectedVideoFromLibrary,
  onVideoProcessed,
  hideHeader = false,
}: ProgramBuilderProps) {
  const [weeks, setWeeks] = useState<Week[]>(initialWeeks);
  const [selectedWeekId, setSelectedWeekId] = useState<string>("");
  const [selectedDayKey, setSelectedDayKey] = useState<DayKey>("sun");
  const [editingItem, setEditingItem] = useState<ProgramItem | null>(null);
  const [isVideoDetailsDialogOpen, setIsVideoDetailsDialogOpen] =
    useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{
    id: string;
    title: string;
    description?: string;
    duration?: string;
    url?: string;
    thumbnail?: string;
  } | null>(null);
  const [isExerciseEditDialogOpen, setIsExerciseEditDialogOpen] =
    useState(false);
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

  // Sync internal weeks state with initialWeeks prop changes
  useEffect(() => {
    if (initialWeeks && initialWeeks.length > 0) {
      setWeeks(initialWeeks);
    }
  }, [initialWeeks]);

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
  }, [weeks, onSave]);

  const deleteWeek = useCallback(
    (weekId: string) => {
      if (weeks.length === 1) return;
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
        days: JSON.parse(JSON.stringify(weekToDuplicate.days)),
      };
      const updatedWeeks = [...weeks, newWeek];
      setWeeks(updatedWeeks);
    },
    [weeks, onSave]
  );

  const toggleCollapse = useCallback((weekId: string) => {
    setWeeks(prev =>
      prev.map(week =>
        week.id === weekId ? { ...week, collapsed: !week.collapsed } : week
      )
    );
  }, []);

  const toggleCollapseAll = useCallback(() => {
    const allCollapsed = weeks.every(week => week.collapsed);
    setWeeks(prev => prev.map(week => ({ ...week, collapsed: !allCollapsed })));
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
      onSave?.(updatedWeeks);
    },
    [weeks, onSave]
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
      onSave?.(updatedWeeks);
    },
    [weeks, onSave]
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
      onSave?.(updatedWeeks);
    },
    [weeks, onSave]
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
      onSave?.(updatedWeeks);
    },
    [weeks, onSave]
  );

  const handleSave = useCallback(() => {
    if (programDetails?.onSave) {
      programDetails.onSave(weeks);
    } else {
      onSave?.(weeks);
    }
  }, [weeks, onSave, programDetails]);

  const openEditItemDialog = useCallback(
    (weekId: string, dayKey: DayKey, item: ProgramItem) => {
      setSelectedWeekId(weekId);
      setSelectedDayKey(dayKey);
      setEditingItem(item);

      // If item is part of a superset, open SupersetDescriptionModal instead
      if (item.supersetId) {
        // Find all exercises in the superset within the same week and day
        const week = weeks.find(w => w.id === weekId);
        if (week) {
          const supersetExercises = week.days[dayKey]
            .filter(ex => ex.supersetId === item.supersetId)
            .sort((a, b) => (a.supersetOrder || 0) - (b.supersetOrder || 0));

          const firstExercise = supersetExercises[0];
          const supersetName =
            supersetExercises.length === 2
              ? "Superset"
              : `Circuit (${supersetExercises.length})`;

          setPendingSupersetDescription({
            supersetId: item.supersetId,
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
                    description: ex.description || ex.notes || "",
                  })),
                  supersetDescription:
                    firstExercise.supersetDescription ||
                    firstExercise.supersetInstructions ||
                    firstExercise.supersetNotes ||
                    "",
                }
              : undefined,
          });
          setIsSupersetDescriptionModalOpen(true);
        }
      } else {
        // Regular exercise edit
        setEditingExercise(item);
        setIsExerciseEditDialogOpen(true);
      }
    },
    [weeks]
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
      if (selectedWeekId === "routine-creation") {
        const videoItem: ProgramItem = {
          id: `temp-${Date.now()}`,
          title: video.title,
          type: "video",
          notes: video.description || "",
          duration: video.duration || "",
          videoUrl: video.url || "",
          videoId: video.id,
          videoTitle: video.title,
          videoThumbnail: video.thumbnail || "",
        };
        setNewRoutine(prev => ({
          ...prev,
          exercises: [...(prev.exercises || []), videoItem],
        }));
        setSelectedWeekId("");
        setSelectedDayKey("sun");
      } else {
        setSelectedVideo(video);
        setIsVideoDetailsDialogOpen(true);
      }
    },
    [selectedWeekId]
  );

  // Handle video selection from library
  useEffect(() => {
    if (selectedVideoFromLibrary) {
      handleVideoSelect(selectedVideoFromLibrary);
      onVideoProcessed?.();
    }
  }, [selectedVideoFromLibrary, handleVideoSelect, onVideoProcessed]);

  const handleVideoDetailsSubmit = useCallback(
    (details: {
      notes?: string;
      sets?: number;
      reps?: number;
      tempo?: string;
    }) => {
      if (!selectedVideo) return;

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
      };

      if (editingItem) {
        editItem(selectedWeekId, selectedDayKey, editingItem.id, videoItem);
      } else {
        addItem(selectedWeekId, selectedDayKey, videoItem);
      }

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
      sets?: number;
      reps?: number;
      tempo?: string;
      duration?: string;
    }) => {
      if (!editingExercise) return;

      const updatedItem: Partial<ProgramItem> = {
        title: details.title,
        description: details.description || "",
        sets: details.sets,
        reps: details.reps,
        tempo: details.tempo || "",
        duration: details.duration || "",
      };

      editItem(selectedWeekId, selectedDayKey, editingExercise.id, updatedItem);
      setIsExerciseEditDialogOpen(false);
      setEditingExercise(null);
      setEditingItem(null);
    },
    [editingExercise, selectedWeekId, selectedDayKey, editItem]
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
      if (!pendingSupersetDescription || !selectedWeekId || !selectedDayKey)
        return;

      console.log("Saved exercises from modal:", data.exercises);

      // Create a set of saved exercise IDs for quick lookup
      const savedExerciseIds = new Set(data.exercises.map(ex => ex.id));
      console.log("Saved exercise IDs set:", Array.from(savedExerciseIds));

      const updatedWeeks = weeks.map(week => {
        if (week.id === selectedWeekId) {
          const updatedDays = { ...week.days };
          // First, filter out deleted exercises, then update remaining ones
          const filteredItems = updatedDays[selectedDayKey].filter(
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
          updatedDays[selectedDayKey] = filteredItems.map(
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
                    notes: exerciseData.description || item.notes || "",
                    // Only set superset description on the first exercise (supersetOrder = 1)
                    supersetDescription:
                      item.supersetOrder === 1
                        ? data.supersetDescription || ""
                        : item.supersetDescription,
                    supersetInstructions:
                      item.supersetOrder === 1
                        ? data.supersetDescription || ""
                        : item.supersetInstructions,
                    supersetNotes:
                      item.supersetOrder === 1
                        ? data.supersetDescription || ""
                        : item.supersetNotes,
                  };
                  return updatedItem;
                }
              }
              return item;
            }
          );
          return { ...week, days: updatedDays };
        }
        return week;
      });

      setWeeks(updatedWeeks);
      onSave?.(updatedWeeks);
      setIsSupersetDescriptionModalOpen(false);
      setPendingSupersetDescription(null);
    },
    [weeks, pendingSupersetDescription, selectedWeekId, selectedDayKey, onSave]
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
            const supersetGroupId = `superset-${Date.now()}`;
            item.supersetId = supersetGroupId;
            item.supersetOrder = 1;
            superset.supersetId = supersetGroupId;
            superset.supersetOrder = 2;

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
            const supersetGroupId = item.supersetId;
            const supersetItems = updatedDays[selectedDayKey].filter(
              i => i.supersetId === supersetGroupId
            );

            supersetItems.forEach(supersetItem => {
              supersetItem.supersetId = undefined;
              supersetItem.supersetOrder = undefined;
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

  const handleOpenSupersetModal = useCallback((item: ProgramItem) => {
    setPendingSupersetDrill(item);
    setIsSupersetModalOpen(true);
  }, []);

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
      onSave?.(updatedWeeks);
    },
    [weeks, onSave]
  );

  const sensors = useSensors(
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    useSensor(PointerSensor)
  );

  return (
    <div
      className="w-full max-w-full overflow-x-hidden"
      style={{ backgroundColor: hideHeader ? "transparent" : COLORS.BACKGROUND_DARK }}
    >
      {/* Mobile Header - Hide when embedded */}
      {!hideHeader && (
        <div className="sticky top-0 z-30 border-b py-3 px-4" style={{ backgroundColor: COLORS.BACKGROUND_DARK, borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="flex items-center justify-between w-full min-w-0">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {programDetails?.onBack && (
                <Button
                  variant="ghost"
                  onClick={programDetails.onBack}
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                    e.currentTarget.style.backgroundColor = "#1C2021";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold break-words truncate" style={{ color: COLORS.TEXT_PRIMARY }}>
                    {programDetails?.title || "Program Builder"}
                  </h1>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                onClick={handleSave}
                disabled={programDetails?.isSaving}
                className="p-3 rounded-lg text-white min-h-[44px] min-w-[44px] flex items-center justify-center shadow-lg transition-colors"
                style={{ backgroundColor: COLORS.GREEN_DARK }}
                onMouseEnter={(e) => {
                  if (!programDetails?.isSaving) {
                    e.currentTarget.style.backgroundColor = COLORS.GREEN_PRIMARY;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!programDetails?.isSaving) {
                    e.currentTarget.style.backgroundColor = COLORS.GREEN_DARK;
                  }
                }}
              >
                <Save className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Program Details Card */}
      {programDetails && (
        <div className="p-4">
          <Card className="rounded-lg border" style={{ backgroundColor: "#1C2021", borderColor: COLORS.BORDER_SUBTLE }}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h2 className="text-lg font-bold mb-1 break-words" style={{ color: COLORS.TEXT_PRIMARY }}>
                    {programDetails.title}
                  </h2>
                  <p className="text-sm break-words" style={{ color: COLORS.TEXT_SECONDARY }}>
                    {programDetails.description || "No description provided"}
                  </p>
                </div>
                <div className="flex items-center gap-2"></div>
                {programDetails.lastSaved && (
                  <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                    Last saved: {programDetails.lastSaved.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={addWeek}
            className="text-white h-14 rounded-lg shadow-lg font-medium transition-colors"
            style={{ backgroundColor: COLORS.GOLDEN_DARK }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
            }}
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Week
          </Button>
          <Button
            onClick={() => setIsCreateRoutineModalOpen(true)}
            variant="outline"
            className="h-14 rounded-lg font-medium transition-colors"
            style={{ 
              borderColor: COLORS.GREEN_DARK, 
              color: COLORS.GREEN_PRIMARY,
              backgroundColor: "transparent"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#1C2021";
              e.currentTarget.style.borderColor = COLORS.GREEN_PRIMARY;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = COLORS.GREEN_DARK;
            }}
          >
            <Target className="h-5 w-5 mr-2" />
            Create Routine
          </Button>
        </div>
        <Button
          onClick={toggleCollapseAll}
          variant="outline"
          className="w-full h-12 rounded-lg font-medium transition-colors"
          style={{ 
            borderColor: COLORS.BORDER_SUBTLE, 
            color: COLORS.TEXT_SECONDARY,
            backgroundColor: "transparent"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#1C2021";
            e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
            e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
            e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
          }}
        >
          {weeks.every(week => week.collapsed) ? (
            <>
              <Expand className="h-4 w-4 mr-2" />
              Expand All Weeks
            </>
          ) : (
            <>
              <Minimize className="h-4 w-4 mr-2" />
              Collapse All Weeks
            </>
          )}
        </Button>
      </div>

      {/* Weeks List */}
      <div className="px-4 pb-4 space-y-4">
        {weeks.map((week, weekIndex) => (
          <MobileWeekCard
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
            getSupersetGroups={getSupersetGroups}
            onOpenAddRoutine={(weekId, dayKey) => {
              setPendingRoutineDay({ weekId, dayKey });
              setIsAddRoutineModalOpen(true);
            }}
          />
        ))}
      </div>

      {/* Video Details Dialog */}
      <VideoDetailsDialog
        isOpen={isVideoDetailsDialogOpen}
        onClose={() => {
          setIsVideoDetailsDialogOpen(false);
          setSelectedVideo(null);
        }}
        onSubmit={handleVideoDetailsSubmit}
        video={selectedVideo}
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

      {/* Superset Modal */}
      <Dialog open={isSupersetModalOpen} onOpenChange={setIsSupersetModalOpen}>
        <DialogContent style={{ backgroundColor: "#1C2021", borderColor: COLORS.BORDER_SUBTLE }}>
          <DialogHeader>
            <DialogTitle style={{ color: COLORS.TEXT_PRIMARY }}>
              Create Superset
            </DialogTitle>
            <DialogDescription style={{ color: COLORS.TEXT_SECONDARY }}>
              Select another exercise from the same day to create a superset
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label style={{ color: COLORS.TEXT_PRIMARY }}>First Exercise</Label>
              <div className="p-3 rounded border" style={{ backgroundColor: "#2A2F2F", borderColor: COLORS.BORDER_SUBTLE }}>
                <p className="font-medium break-words" style={{ color: COLORS.TEXT_PRIMARY }}>
                  {pendingSupersetDrill?.title}
                </p>
                <p className="text-sm break-words" style={{ color: COLORS.TEXT_SECONDARY }}>
                  {pendingSupersetDrill?.notes}
                </p>
              </div>
            </div>
            <div>
              <Label style={{ color: COLORS.TEXT_PRIMARY }}>Second Exercise</Label>
              <CustomSelect
                value=""
                onChange={value => {
                  if (value && pendingSupersetDrill) {
                    handleCreateSuperset(pendingSupersetDrill.id, value);
                    setIsSupersetModalOpen(false);
                  }
                }}
                options={[
                  {
                    value: "",
                    label: "Select an exercise from the same day...",
                  },
                  ...(weeks
                    .find(week => week.id === selectedWeekId)
                    ?.days[selectedDayKey]?.filter(
                      item => item.id !== pendingSupersetDrill?.id
                    )
                    .map(item => ({
                      value: item.id,
                      label: item.title,
                    })) || []),
                ]}
                placeholder="Select an exercise from the same day..."
                style={{
                  backgroundColor: "#2A2F2F",
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Routine Modal */}
      <Dialog
        open={isCreateRoutineModalOpen}
        onOpenChange={setIsCreateRoutineModalOpen}
      >
        <DialogContent style={{ backgroundColor: "#1C2021", borderColor: COLORS.BORDER_SUBTLE }} className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: COLORS.TEXT_PRIMARY }}>
              Create New Routine
            </DialogTitle>
            <DialogDescription style={{ color: COLORS.TEXT_SECONDARY }}>
              Add videos/exercises to create a reusable routine
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="routine-name" style={{ color: COLORS.TEXT_PRIMARY }}>
                  Routine Name
                </Label>
                <Input
                  id="routine-name"
                  value={newRoutine.name}
                  onChange={e =>
                    setNewRoutine(prev => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Drive Warm-up, Core Stability"
                  style={{ backgroundColor: "#2A2F2F", borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_PRIMARY }}
                />
              </div>
              <div>
                <Label htmlFor="routine-description" style={{ color: COLORS.TEXT_PRIMARY }}>
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
                  style={{ backgroundColor: "#2A2F2F", borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_PRIMARY }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                  Routine Day
                </h3>
                <Button
                  onClick={() => {
                    onOpenVideoLibrary?.();
                    setEditingItem(null);
                    setSelectedWeekId("routine-creation");
                    setSelectedDayKey("sun");
                  }}
                  size="sm"
                  className="text-white transition-colors"
                  style={{ backgroundColor: COLORS.GOLDEN_DARK }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
                  }}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Add from Library
                </Button>
              </div>

              <Card className="rounded-lg border" style={{ backgroundColor: "#1C2021", borderColor: COLORS.BORDER_SUBTLE }}>
                <CardContent className="p-4">
                  {!newRoutine.exercises ||
                  newRoutine.exercises.length === 0 ? (
                    <div className="text-center py-8" style={{ color: COLORS.TEXT_SECONDARY }}>
                      <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="break-words">
                        No exercises added yet. Click "Add from Library" to get
                        started.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {newRoutine.exercises?.map((exercise, index) => (
                        <div
                          key={exercise.id}
                          className="flex items-center gap-3 p-3 rounded-lg border"
                          style={{ backgroundColor: "#2A2F2F", borderColor: COLORS.BORDER_SUBTLE }}
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
                              style={{ backgroundColor: "#1C2021", borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_PRIMARY }}
                              className="mb-2"
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
                                style={{ backgroundColor: "#1C2021", borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_PRIMARY }}
                                className="text-sm"
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
                                style={{ backgroundColor: "#1C2021", borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_PRIMARY }}
                                className="text-sm"
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
                                style={{ backgroundColor: "#1C2021", borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_PRIMARY }}
                                className="text-sm"
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
                              style={{ backgroundColor: "#1C2021", borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_PRIMARY }}
                              className="text-sm mt-2"
                            />
                          </div>
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
                            className="transition-colors"
                            style={{ color: COLORS.RED_ALERT }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#1C2021";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "transparent";
                            }}
                            type="button"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
              className="transition-colors"
              style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_SECONDARY }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#1C2021";
                e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
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
              className="transition-colors"
              style={{ backgroundColor: COLORS.GREEN_DARK }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = COLORS.GREEN_PRIMARY;
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = COLORS.GREEN_DARK;
                }
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
        <DialogContent style={{ backgroundColor: "#1C2021", borderColor: COLORS.BORDER_SUBTLE }} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: COLORS.TEXT_PRIMARY }}>
              Add Routine to Day
            </DialogTitle>
            <DialogDescription style={{ color: COLORS.TEXT_SECONDARY }}>
              Select a routine to add to this day
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {routines.length === 0 ? (
              <div className="text-center py-8" style={{ color: COLORS.TEXT_SECONDARY }}>
                <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="break-words">No routines created yet.</p>
                <p className="text-sm break-words">
                  Create a routine first to use this feature.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {routines.map(routine => (
                  <Card
                    key={routine.id}
                    className="rounded-lg border cursor-pointer transition-colors"
                    style={{ backgroundColor: "#1C2021", borderColor: COLORS.BORDER_SUBTLE }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#2A2F2F";
                      e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#1C2021";
                      e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
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
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium mb-1 break-words" style={{ color: COLORS.TEXT_PRIMARY }}>
                            {routine.name}
                          </h3>
                          <p className="text-sm mb-2 break-words" style={{ color: COLORS.TEXT_SECONDARY }}>
                            {routine.description || "No description provided"}
                          </p>
                          <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                            <span>
                              {routine.exercises.length} exercise
                              {routine.exercises.length !== 1 ? "s" : ""}
                            </span>
                            {routine.exercises.length > 0 && (
                              <span className="break-words">
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
                          className="text-white transition-colors"
                          style={{ backgroundColor: COLORS.GREEN_DARK }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = COLORS.GREEN_PRIMARY;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = COLORS.GREEN_DARK;
                          }}
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
              className="transition-colors"
              style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_SECONDARY }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#1C2021";
                e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Mobile Week Card Component
interface MobileWeekCardProps {
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
  sensors: any;
  onDragEnd: (event: DragEndEvent) => void;
  onCreateSuperset: (itemId: string, supersetId: string) => void;
  onRemoveSuperset: (itemId: string) => void;
  onOpenSupersetModal: (item: ProgramItem) => void;
  getSupersetGroups: () => { name: string; items: ProgramItem[] }[];
  onOpenAddRoutine: (weekId: string, dayKey: DayKey) => void;
}

function MobileWeekCard({
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
  getSupersetGroups,
  onOpenAddRoutine,
}: MobileWeekCardProps) {
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
      style={{ ...style, backgroundColor: "#1C2021", borderColor: COLORS.BORDER_SUBTLE }}
      className="rounded-lg border shadow-lg w-full"
    >
      <CardHeader className="pb-3 px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="p-2 h-10 w-10 flex-shrink-0 rounded-lg transition-colors"
              style={{ color: COLORS.TEXT_MUTED }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                e.currentTarget.style.backgroundColor = "#2A2F2F";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = COLORS.TEXT_MUTED;
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {week.collapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-bold break-words" style={{ color: COLORS.TEXT_PRIMARY }}>
                {week.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                  {Object.values(week.days).flat().length} exercises
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onDuplicate}
              className="h-8 w-8 p-0 rounded-lg transition-colors"
              style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_SECONDARY }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#2A2F2F";
                e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              }}
              title="Copy week"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 rounded-lg transition-colors"
              style={{ borderColor: COLORS.RED_DARK, color: COLORS.RED_ALERT }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#2A2F2F";
                e.currentTarget.style.borderColor = COLORS.RED_ALERT;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = COLORS.RED_DARK;
              }}
              title="Delete week"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!week.collapsed && (
        <CardContent className="px-4 pb-4">
          <div className="space-y-4">
            {DAY_KEYS.map(dayKey => (
              <MobileDayCard
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
                getSupersetGroups={getSupersetGroups}
                onOpenAddRoutine={onOpenAddRoutine}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Mobile Day Card Component
interface MobileDayCardProps {
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
  getSupersetGroups: () => { name: string; items: ProgramItem[] }[];
  onOpenAddRoutine: (weekId: string, dayKey: DayKey) => void;
}

function MobileDayCard({
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
  getSupersetGroups,
  onOpenAddRoutine,
}: MobileDayCardProps) {
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
      <div className="text-center">
        <h3 className="text-sm font-medium mb-1" style={{ color: COLORS.TEXT_PRIMARY }}>{dayLabel}</h3>
        <div className="text-xs uppercase tracking-wide" style={{ color: COLORS.TEXT_MUTED }}>
          {dayKey}
        </div>
      </div>

      {/* Day Content */}
      <Card
        className="min-h-[200px] w-full rounded-lg border"
        style={{
          backgroundColor: isRestDay ? "#1A1D1E" : "#1C2021",
          borderColor: COLORS.BORDER_SUBTLE,
        }}
      >
        <CardContent className="p-4">
          {isRestDay ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8" style={{ color: COLORS.TEXT_MUTED }}>
              <Moon className="h-8 w-8 mb-3 opacity-50" />
              <span className="text-sm font-medium">Rest Day</span>
              <span className="text-xs mt-1" style={{ color: COLORS.TEXT_MUTED }}>
                No exercises scheduled
              </span>
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
                    <MobileSortableDrillItem
                      key={item.id}
                      item={item}
                      onEdit={() => onEditItem(item)}
                      onDelete={() => onDeleteItem(item.id)}
                      onAddSuperset={() => onOpenSupersetModal(item)}
                      routines={routines}
                      onCreateSuperset={onCreateSuperset}
                      onRemoveSuperset={onRemoveSuperset}
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
          className="w-full h-12 rounded-lg font-medium transition-colors"
          style={{ 
            borderColor: COLORS.BORDER_SUBTLE, 
            color: COLORS.TEXT_SECONDARY,
            backgroundColor: "transparent"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#1C2021";
            e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
            e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
            e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
          }}
        >
          <Video className="h-4 w-4 mr-2" />
          Add from Library
        </Button>
        <Button
          onClick={() => onOpenAddRoutine(weekId, dayKey)}
          variant="outline"
          size="sm"
          className="w-full h-12 rounded-lg font-medium transition-colors"
          style={{ 
            borderColor: COLORS.GREEN_DARK, 
            color: COLORS.GREEN_PRIMARY,
            backgroundColor: "transparent"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#1C2021";
            e.currentTarget.style.borderColor = COLORS.GREEN_PRIMARY;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = COLORS.GREEN_DARK;
          }}
        >
          <Target className="h-4 w-4 mr-2" />
          Add Routine
        </Button>
      </div>
    </div>
  );
}

// Mobile Sortable Drill Item Component
interface MobileSortableDrillItemProps {
  item: ProgramItem;
  onEdit: () => void;
  onDelete: () => void;
  onAddSuperset: () => void;
  routines: Routine[];
  onCreateSuperset: (itemId: string, supersetId: string) => void;
  onRemoveSuperset: (itemId: string) => void;
  getSupersetGroups: () => { name: string; items: ProgramItem[] }[];
}

function MobileSortableDrillItem({
  item,
  onEdit,
  onDelete,
  onAddSuperset,
  routines,
  onCreateSuperset,
  onRemoveSuperset,
  getSupersetGroups,
}: MobileSortableDrillItemProps) {
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
          ? "#2A1F2F" 
          : isRoutine 
          ? "#1F2A1F" 
          : "#1C2021",
        borderColor: isSuperset 
          ? COLORS.GOLDEN_ACCENT 
          : isRoutine 
          ? COLORS.GREEN_DARK 
          : COLORS.BORDER_SUBTLE,
      }}
      className={cn(
        "rounded-lg p-4 border transition-all duration-200 shadow-sm",
        isDragging && "opacity-50 scale-95"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 flex-shrink-0 rounded-lg transition-colors"
          style={{ color: COLORS.TEXT_MUTED }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
            e.currentTarget.style.backgroundColor = "#2A2F2F";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = COLORS.TEXT_MUTED;
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Item content */}
        <div className="flex-1 min-w-0">
          {/* For supersets, show both titles stacked */}
          {isSuperset && supersetGroup ? (
            <div className="space-y-1 mb-2">
              {supersetGroup.items.map((supersetItem, index) => (
                <div key={supersetItem.id} className="flex items-center gap-2">
                  <span className="text-xs font-medium break-words" style={{ color: COLORS.TEXT_PRIMARY }}>
                    {supersetItem.title}
                  </span>
                  {index === 0 && (
                    <span className="text-xs font-medium" style={{ color: COLORS.GOLDEN_ACCENT }}>
                      +
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium break-words" style={{ color: COLORS.TEXT_PRIMARY }}>
                {item.title}
              </span>
            </div>
          )}

          {/* Exercise details - use first item's data for supersets */}
          {(() => {
            const displayItem = isSuperset ? supersetGroup?.items[0] : item;
            return (
              <div className="flex flex-wrap gap-1 text-xs mb-2" style={{ color: COLORS.TEXT_SECONDARY }}>
                {displayItem?.sets && (
                  <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: "#2A2F2F" }}>
                    Sets: {displayItem.sets}
                  </span>
                )}
                {displayItem?.reps && (
                  <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: "#2A2F2F" }}>
                    Reps: {displayItem.reps}
                  </span>
                )}
                {displayItem?.tempo && (
                  <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: "#2A2F2F" }}>
                    Duration: {displayItem.tempo}
                  </span>
                )}
                {displayItem?.duration && (
                  <span className="px-2 py-1 rounded text-xs flex items-center gap-1" style={{ backgroundColor: "#2A2F2F" }}>
                    <Clock className="h-3 w-3" />
                    {displayItem.duration}
                  </span>
                )}
              </div>
            );
          })()}

          {/* Notes */}
          {item.notes && (
            <p className="text-xs break-words line-clamp-2" style={{ color: COLORS.TEXT_SECONDARY }}>
              {item.notes}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          {/* Superset Chain Link Button */}
          {!item.supersetId ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddSuperset}
              className="h-8 w-8 p-0 border rounded-lg transition-colors"
              style={{ 
                color: COLORS.GOLDEN_ACCENT, 
                borderColor: COLORS.GOLDEN_DARK,
                backgroundColor: "transparent"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#1C2021";
                e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = COLORS.GOLDEN_DARK;
              }}
              title="Add Superset"
            >
              <Link className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveSuperset(item.id)}
              className="h-8 w-8 p-0 border rounded-lg transition-colors"
              style={{ 
                color: COLORS.RED_ALERT, 
                borderColor: COLORS.RED_DARK,
                backgroundColor: "transparent"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#1C2021";
                e.currentTarget.style.borderColor = COLORS.RED_ALERT;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = COLORS.RED_DARK;
              }}
              title="Remove Superset"
            >
              <Unlink className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-8 w-8 p-0 rounded-lg transition-colors"
            style={{ color: COLORS.TEXT_SECONDARY }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              e.currentTarget.style.backgroundColor = "#2A2F2F";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 rounded-lg transition-colors"
            style={{ color: COLORS.RED_ALERT }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#1C2021";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

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
  });

  // Update form data when exercise changes or dialog opens
  useEffect(() => {
    if (isOpen && exercise) {
      setFormData({
        title: exercise.title || "",
        description: exercise.description ?? "",
        sets: exercise.sets || undefined,
        reps: exercise.reps || undefined,
        tempo: exercise.tempo || "",
        duration: exercise.duration || "",
      });
    }
  }, [exercise, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSubmit(formData);
  };

  if (!isOpen || !exercise) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        nested={true}
        style={{ backgroundColor: "#1C2021", borderColor: COLORS.BORDER_SUBTLE }}
        className="max-w-[95vw] w-[95vw] max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle style={{ color: COLORS.TEXT_PRIMARY }}>Edit Exercise</DialogTitle>
          <DialogDescription style={{ color: COLORS.TEXT_SECONDARY }}>
            Update the exercise details and instructions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm" style={{ color: COLORS.TEXT_PRIMARY }}>
              Exercise Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e =>
                setFormData(prev => ({ ...prev, title: e.target.value }))
              }
              style={{ backgroundColor: "#2A2F2F", borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_PRIMARY }}
              className="mt-2"
              placeholder="Exercise name"
              required
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="description" className="text-sm" style={{ color: COLORS.TEXT_PRIMARY }}>
                Description
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
              style={{ backgroundColor: "#2A2F2F", borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_PRIMARY }}
              className="mt-2"
              placeholder="Describe how to perform this exercise..."
              rows={3}
              maxLength={120}
            />
          </div>

          {/* Sets, Reps, Tempo */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="sets" className="text-sm" style={{ color: COLORS.TEXT_PRIMARY }}>
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
                style={{ backgroundColor: "#2A2F2F", borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_PRIMARY }}
              className="mt-2"
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="reps" className="text-sm" style={{ color: COLORS.TEXT_PRIMARY }}>
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
                style={{ backgroundColor: "#2A2F2F", borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_PRIMARY }}
              className="mt-2"
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="tempo" className="text-sm" style={{ color: COLORS.TEXT_PRIMARY }}>
                Tempo
              </Label>
              <Input
                id="tempo"
                value={formData.tempo}
                onChange={e =>
                  setFormData(prev => ({ ...prev, tempo: e.target.value }))
                }
                style={{ backgroundColor: "#2A2F2F", borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_PRIMARY }}
              className="mt-2"
                placeholder="e.g., 2-0-2"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <Label htmlFor="duration" className="text-sm" style={{ color: COLORS.TEXT_PRIMARY }}>
              Duration (optional)
            </Label>
            <Input
              id="duration"
              value={formData.duration}
              onChange={e =>
                setFormData(prev => ({ ...prev, duration: e.target.value }))
              }
              style={{ backgroundColor: "#2A2F2F", borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_PRIMARY }}
              className="mt-2"
              placeholder="e.g., 30 seconds"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto transition-colors"
            style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_SECONDARY }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#1C2021";
              e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
              e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
              e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            className="w-full sm:w-auto text-white transition-colors"
            style={{ backgroundColor: COLORS.GOLDEN_DARK }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
            }}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  }) => void;
  video: {
    id: string;
    title: string;
    description?: string;
    duration?: string;
    url?: string;
    thumbnail?: string;
  } | null;
}

function VideoDetailsDialog({
  isOpen,
  onClose,
  onSubmit,
  video,
}: VideoDetailsDialogProps) {
  const [formData, setFormData] = useState({
    notes: "",
    sets: undefined as number | undefined,
    reps: undefined as number | undefined,
    tempo: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      notes: "",
      sets: undefined,
      reps: undefined,
      tempo: "",
    });
  };

  if (!video) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent style={{ backgroundColor: "#1C2021", borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_PRIMARY }}>
        <DialogHeader>
          <DialogTitle>Add Video Details</DialogTitle>
          <DialogDescription style={{ color: COLORS.TEXT_SECONDARY }} className="break-words">
            Add optional details for {video.title}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="notes" style={{ color: COLORS.TEXT_PRIMARY }}>
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={e =>
                setFormData(prev => ({ ...prev, notes: e.target.value }))
              }
              style={{ backgroundColor: "#2A2F2F", borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_PRIMARY }}
              placeholder="Additional instructions or notes..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="sets" style={{ color: COLORS.TEXT_PRIMARY }}>
                Sets (Optional)
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
                style={{ backgroundColor: "#2A2F2F", borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_PRIMARY }}
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="reps" style={{ color: COLORS.TEXT_PRIMARY }}>
                Reps (Optional)
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
                style={{ backgroundColor: "#2A2F2F", borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_PRIMARY }}
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="tempo" style={{ color: COLORS.TEXT_PRIMARY }}>
                Duration (Optional)
              </Label>
              <Input
                id="tempo"
                value={formData.tempo}
                onChange={e =>
                  setFormData(prev => ({ ...prev, tempo: e.target.value }))
                }
                style={{ backgroundColor: "#2A2F2F", borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_PRIMARY }}
                placeholder="e.g., 30 seconds or 2-0-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="transition-colors"
              style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_SECONDARY }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#1C2021";
                e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="text-white transition-colors"
              style={{ backgroundColor: COLORS.GOLDEN_DARK }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
              }}
            >
              Add Video
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
