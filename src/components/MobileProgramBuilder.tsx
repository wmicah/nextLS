"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CustomSelect from "./ui/CustomSelect";
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

// Types
type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

interface ProgramItem {
  id: string;
  title: string;
  type?: "exercise" | "drill" | "video" | "routine" | "rest";
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
  const [isSupersetModalOpen, setIsSupersetModalOpen] = useState(false);
  const [pendingSupersetDrill, setPendingSupersetDrill] =
    useState<ProgramItem | null>(null);
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
      const updatedWeeks = weeks.filter(week => week.id !== weekId);
      setWeeks(updatedWeeks);
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

      if (item.type === "video") {
        onOpenVideoLibrary?.();
      }
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
      className="min-h-screen w-full max-w-full overflow-x-hidden"
      style={{ backgroundColor: "#2A3133" }}
    >
      {/* Mobile Header */}
      <div className="sticky top-0 z-30 bg-[#2A3133] border-b border-[#606364] py-3">
        <div className="flex items-center justify-between w-full min-w-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {programDetails?.onBack && (
              <Button
                variant="ghost"
                onClick={programDetails.onBack}
                className="p-2 text-[#C3BCC2] hover:text-white hover:bg-[#353A3A] min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#4A5A70" }}
            >
              <Calendar className="h-4 w-4" style={{ color: "#C3BCC2" }} />
            </div>
            <h1 className="text-lg font-bold text-[#C3BCC2] break-words">
              {programDetails?.title || "Program Builder"}
            </h1>
            <span
              className="px-2 py-1 rounded-full text-xs font-medium flex-shrink-0"
              style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
            >
              {weeks.length} week{weeks.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={handleSave}
              disabled={programDetails?.isSaving}
              className="p-2 rounded-lg bg-green-600 hover:bg-green-700 text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Program Details Card */}
      {programDetails && (
        <div className="p-4">
          <Card className="bg-[#353A3A] border-[#606364]">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h2 className="text-lg font-bold text-[#C3BCC2] mb-1 break-words">
                    {programDetails.title}
                  </h2>
                  <p className="text-sm text-[#ABA4AA] break-words">
                    {programDetails.description || "No description provided"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-400 border-green-500/20 text-xs"
                  >
                    {programDetails.level}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs"
                  >
                    {programDetails.duration} weeks
                  </Badge>
                </div>
                {programDetails.lastSaved && (
                  <p className="text-xs text-[#ABA4AA]">
                    Last saved: {programDetails.lastSaved.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={addWeek}
            className="bg-blue-600 hover:bg-blue-700 text-white h-12"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Week
          </Button>
          <Button
            onClick={() => setIsCreateRoutineModalOpen(true)}
            variant="outline"
            className="border-green-500/50 text-green-400 hover:bg-green-500/10 h-12"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Routine
          </Button>
        </div>
        <div className="mt-3">
          <Button
            onClick={toggleCollapseAll}
            variant="outline"
            className="w-full border-[#606364] text-[#C3BCC2] hover:bg-[#353A3A] hover:text-white h-12"
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

      {/* Superset Modal */}
      <Dialog open={isSupersetModalOpen} onOpenChange={setIsSupersetModalOpen}>
        <DialogContent className="bg-[#2A3133] border-[#606364]">
          <DialogHeader>
            <DialogTitle className="text-[#C3BCC2]">
              Create Superset
            </DialogTitle>
            <DialogDescription className="text-[#ABA4AA]">
              Select another exercise from the same day to create a superset
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[#C3BCC2]">First Exercise</Label>
              <div className="p-3 bg-[#353A3A] rounded border border-[#606364]">
                <p className="text-[#C3BCC2] font-medium break-words">
                  {pendingSupersetDrill?.title}
                </p>
                <p className="text-[#ABA4AA] text-sm break-words">
                  {pendingSupersetDrill?.notes}
                </p>
              </div>
            </div>
            <div>
              <Label className="text-[#C3BCC2]">Second Exercise</Label>
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
                  backgroundColor: "#353A3A",
                  borderColor: "#606364",
                  color: "#C3BCC2",
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
        <DialogContent className="bg-[#2A3133] border-[#606364] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#C3BCC2]">
              Create New Routine
            </DialogTitle>
            <DialogDescription className="text-[#ABA4AA]">
              Add videos/exercises to create a reusable routine
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="routine-name" className="text-[#C3BCC2]">
                  Routine Name
                </Label>
                <Input
                  id="routine-name"
                  value={newRoutine.name}
                  onChange={e =>
                    setNewRoutine(prev => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Drive Warm-up, Core Stability"
                  className="bg-[#353A3A] border-[#606364] text-[#C3BCC2]"
                />
              </div>
              <div>
                <Label htmlFor="routine-description" className="text-[#C3BCC2]">
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
                  className="bg-[#353A3A] border-[#606364] text-[#C3BCC2]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-[#C3BCC2]">
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
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Add from Library
                </Button>
              </div>

              <Card className="bg-[#353A3A]/50 border-[#606364]">
                <CardContent className="p-4">
                  {!newRoutine.exercises ||
                  newRoutine.exercises.length === 0 ? (
                    <div className="text-center py-8 text-[#ABA4AA]">
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
                          className="flex items-center gap-3 p-3 bg-[#2A3133] rounded-lg border border-[#606364]"
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
                              className="bg-[#353A3A] border-[#606364] text-[#C3BCC2] mb-2"
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
                                className="bg-[#353A3A] border-[#606364] text-[#C3BCC2] text-sm"
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
                                className="bg-[#353A3A] border-[#606364] text-[#C3BCC2] text-sm"
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
                                className="bg-[#353A3A] border-[#606364] text-[#C3BCC2] text-sm"
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
                              className="bg-[#353A3A] border-[#606364] text-[#C3BCC2] text-sm mt-2"
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
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
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
              className="border-[#606364] text-[#ABA4AA]"
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
        <DialogContent className="bg-[#2A3133] border-[#606364] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#C3BCC2]">
              Add Routine to Day
            </DialogTitle>
            <DialogDescription className="text-[#ABA4AA]">
              Select a routine to add to this day
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {routines.length === 0 ? (
              <div className="text-center py-8 text-[#ABA4AA]">
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
                    className="bg-[#353A3A]/50 border-[#606364] hover:bg-[#353A3A] cursor-pointer transition-colors"
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
                          <h3 className="font-medium text-[#C3BCC2] mb-1 break-words">
                            {routine.name}
                          </h3>
                          <p className="text-sm text-[#ABA4AA] mb-2 break-words">
                            {routine.description || "No description provided"}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-[#ABA4AA]">
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
              className="border-[#606364] text-[#ABA4AA]"
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
      style={style}
      className="bg-[#353A3A] border-[#606364] shadow-lg w-full"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="p-1 h-8 w-8 text-[#ABA4AA] hover:text-[#C3BCC2] hover:bg-[#2A3133] flex-shrink-0"
            >
              {week.collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <CardTitle className="text-lg font-bold text-[#C3BCC2] break-words">
              {week.name}
            </CardTitle>
            <Badge
              variant="outline"
              className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs flex-shrink-0"
            >
              {weekIndex + 1}
            </Badge>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onDuplicate}
              className="border-[#606364] text-[#ABA4AA] hover:bg-[#2A3133] hover:text-[#C3BCC2] h-8 px-2"
            >
              <Copy className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Duplicate</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="border-red-500 text-red-400 hover:bg-red-500/10 h-8 px-2"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Delete</span>
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
  const isRestDay = nonRestItems.length === 0;

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
      <div className="text-center">
        <h3 className="text-sm font-medium text-[#C3BCC2] mb-1">{dayLabel}</h3>
        <div className="text-xs text-[#ABA4AA] uppercase tracking-wide">
          {dayKey}
        </div>
      </div>

      {/* Day Content */}
      <Card
        className={cn(
          "min-h-[200px] w-full",
          isRestDay
            ? "bg-[#2A3133]/30 border-[#606364]/30"
            : "bg-[#2A3133]/50 border-[#606364]/50"
        )}
      >
        <CardContent className="p-3">
          {isRestDay ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-[#ABA4AA]">
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
                  const oldIndex = nonRestItems.findIndex(
                    item => item.id === active.id
                  );
                  const newIndex = nonRestItems.findIndex(
                    item => item.id === over.id
                  );
                  if (oldIndex !== -1 && newIndex !== -1) {
                    const newItems = arrayMove(
                      nonRestItems,
                      oldIndex,
                      newIndex
                    );
                    onReorderItems(newItems);
                  }
                }
              }}
            >
              <SortableContext
                items={nonRestItems.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {nonRestItems.map(item => (
                    <MobileSortableDrillItem
                      key={item.id}
                      item={item}
                      onEdit={() => onEditItem(item)}
                      onDelete={() => onDeleteItem(item.id)}
                      onAddSuperset={() => onOpenSupersetModal(item)}
                      routines={routines}
                      onCreateSuperset={onCreateSuperset}
                      onRemoveSuperset={onRemoveSuperset}
                      getSupersetGroups={getSupersetGroups}
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
          className="w-full border-[#606364]/50 text-[#ABA4AA] hover:bg-[#2A3133] hover:text-[#C3BCC2] hover:border-[#606364] h-10"
        >
          <Video className="h-3 w-3 mr-1" />
          Add from Library
        </Button>
        <Button
          onClick={() => onOpenAddRoutine(weekId, dayKey)}
          variant="outline"
          size="sm"
          className="w-full border-green-500/50 text-green-400 hover:bg-green-500/10 hover:border-green-400 h-10"
        >
          <Target className="h-3 w-3 mr-1" />
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
          : "bg-[#2A3133] border-[#606364]"
      )}
    >
      {/* Superset indicator */}
      {isSuperset && (
        <div className="text-xs text-purple-300 mb-2 flex items-center gap-1">
          <Link className="h-3 w-3" />
          <span className="font-medium">SUPERSET</span>
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
          className="cursor-grab active:cursor-grabbing p-1 text-[#ABA4AA] hover:text-[#C3BCC2] flex-shrink-0"
        >
          <GripVertical className="h-3 w-3" />
        </div>

        {/* Item content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-[#C3BCC2] break-words">
              {item.title}
            </span>
          </div>

          {/* Exercise details */}
          <div className="flex flex-wrap gap-1 text-xs text-[#ABA4AA] mb-2">
            {item.sets && (
              <span className="px-2 py-1 bg-[#2A3133]/50 rounded text-xs">
                Sets: {item.sets}
              </span>
            )}
            {item.reps && (
              <span className="px-2 py-1 bg-[#2A3133]/50 rounded text-xs">
                Reps: {item.reps}
              </span>
            )}
            {item.tempo && (
              <span className="px-2 py-1 bg-[#2A3133]/50 rounded text-xs">
                Tempo: {item.tempo}
              </span>
            )}
            {item.duration && (
              <span className="px-2 py-1 bg-[#2A3133]/50 rounded text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {item.duration}
              </span>
            )}
          </div>

          {/* Notes */}
          {item.notes && (
            <p className="text-xs text-[#ABA4AA] break-words line-clamp-2">
              {item.notes}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-1 flex-shrink-0">
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

          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-6 w-6 p-0 text-[#ABA4AA] hover:text-[#C3BCC2] hover:bg-[#2A3133]"
          >
            <Edit className="h-3 w-3" />
          </Button>
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
    </div>
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#2A3133] border-[#606364] text-[#C3BCC2] z-[100]">
        <DialogHeader>
          <DialogTitle>Add Video Details</DialogTitle>
          <DialogDescription className="text-[#ABA4AA] break-words">
            Add optional details for {video.title}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="notes" className="text-[#C3BCC2]">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={e =>
                setFormData(prev => ({ ...prev, notes: e.target.value }))
              }
              className="bg-[#353A3A] border-[#606364] text-[#C3BCC2]"
              placeholder="Additional instructions or notes..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="sets" className="text-[#C3BCC2]">
                Sets (Optional)
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
                className="bg-[#353A3A] border-[#606364] text-[#C3BCC2]"
                placeholder="3"
                min="1"
              />
            </div>

            <div>
              <Label htmlFor="reps" className="text-[#C3BCC2]">
                Reps (Optional)
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
                className="bg-[#353A3A] border-[#606364] text-[#C3BCC2]"
                placeholder="10"
                min="1"
              />
            </div>

            <div>
              <Label htmlFor="tempo" className="text-[#C3BCC2]">
                Tempo (Optional)
              </Label>
              <Input
                id="tempo"
                value={formData.tempo}
                onChange={e =>
                  setFormData(prev => ({ ...prev, tempo: e.target.value }))
                }
                className="bg-[#353A3A] border-[#606364] text-[#C3BCC2]"
                placeholder="2-0-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-[#606364] text-[#ABA4AA] hover:bg-[#2A3133] hover:text-[#C3BCC2]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add Video
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
