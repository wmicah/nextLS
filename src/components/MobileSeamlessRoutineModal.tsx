"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, ArrowRight, X, Edit, GripVertical } from "lucide-react";
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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { trpc } from "@/app/_trpc/client";
import { useToast } from "@/lib/hooks/use-toast";
import VideoLibraryDialog from "./VideoLibraryDialog";
import SupersetDescriptionModal from "./SupersetDescriptionModal";

interface RoutineExercise {
  id: string;
  title: string;
  type: "exercise" | "drill" | "video" | "routine" | "superset";
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
  supersetId?: string; // ID of the superset group
  supersetOrder?: number; // Order within the superset (1, 2, etc.)
  supersetDescription?: string; // Superset description (only on first exercise)
  supersetInstructions?: string;
  supersetNotes?: string;
  coachInstructions?: {
    whatToDo: string;
    howToDoIt: string;
    keyPoints: string[];
    commonMistakes: string[];
    equipment?: string;
    setup?: string;
  };
}

interface Routine {
  id?: string;
  name: string;
  description: string;
  exercises: RoutineExercise[];
}

interface MobileSeamlessRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  routine?: {
    id: string;
    name: string;
    description: string;
    exercises: RoutineExercise[];
  } | null;
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
  onSuccess?: () => void;
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
    coachInstructions?: {
      whatToDo: string;
      howToDoIt: string;
      keyPoints: string[];
      commonMistakes: string[];
      equipment?: string;
      setup?: string;
    };
  }) => void;
  exercise: RoutineExercise | null;
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when exercise changes or dialog opens
  useEffect(() => {
    if (isOpen && exercise) {
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
    if (!open && !isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        nested={true}
        className="bg-[#2A3133] border-[#606364] max-w-[95vw] sm:max-w-2xl max-h-[90vh] flex flex-col z-[10002]"
      >
        <DialogHeader>
          <DialogTitle className="text-white">Edit Exercise</DialogTitle>
          <DialogDescription className="text-gray-400">
            Update the exercise details and instructions
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 flex-1 overflow-y-auto"
        >
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
                className="bg-[#353A3A] border-[#606364] text-white h-10"
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
                className="bg-[#353A3A] border-[#606364] text-white h-10"
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
              className="bg-[#353A3A] border-[#606364] text-white"
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
                className="bg-[#353A3A] border-[#606364] text-white h-10"
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
                className="bg-[#353A3A] border-[#606364] text-white h-10"
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
                className="bg-[#353A3A] border-[#606364] text-white h-10"
                placeholder="e.g., 2-0-2"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end pt-4 border-t border-[#606364]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-[#606364] text-gray-300 hover:bg-[#353A3A] w-full sm:w-auto h-11 min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto h-11 min-h-[44px]"
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

// Sortable Exercise Item Component
interface SortableExerciseItemProps {
  exercise: RoutineExercise;
  index: number;
  onUpdate: (index: number, field: keyof RoutineExercise, value: any) => void;
  onRemove: (index: number) => void;
  getExerciseColor: (type: string) => string;
  onCreateSuperset: (exerciseId: string, existingSupersetId?: string) => void;
  onRemoveSuperset: (exerciseId: string) => void;
  onOpenSupersetModal: (
    exercise: RoutineExercise,
    existingGroupId?: string
  ) => void;
  getSupersetGroups: () => { name: string; items: RoutineExercise[] }[];
  onEditExercise: (exercise: RoutineExercise) => void;
}

function SortableExerciseItem({
  exercise,
  index,
  onUpdate,
  onRemove,
  getExerciseColor,
  onCreateSuperset,
  onRemoveSuperset,
  onOpenSupersetModal,
  getSupersetGroups,
  onEditExercise,
}: SortableExerciseItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isSuperset = exercise.supersetId !== undefined;

  // Get superset group if this is a superset
  const supersetGroup = isSuperset
    ? getSupersetGroups().find(group =>
        group.items.some(groupItem => groupItem.id === exercise.id)
      )
    : null;

  // For supersets, only render the first item in the group to avoid duplicates
  const isFirstInSuperset =
    isSuperset && supersetGroup && supersetGroup.items[0]?.id === exercise.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-3 bg-[#353A3A] rounded-lg border border-[#606364] transition-colors ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-move text-gray-400 hover:text-gray-300 p-1 flex-shrink-0 touch-none"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Exercise number */}
      <div className="text-xs text-gray-500 font-mono w-6 text-center flex-shrink-0">
        {index + 1}
      </div>

      {/* Exercise type badge */}
      <Badge
        variant="outline"
        className={`${getExerciseColor(
          exercise.type
        )} text-xs px-2 py-1 flex-shrink-0 whitespace-nowrap`}
      >
        <span className="capitalize">{exercise.type}</span>
      </Badge>

      {/* Superset/Circuit indicator */}
      {isSuperset && supersetGroup && (
        <Badge
          variant="outline"
          className="bg-purple-600/20 border-purple-500/50 text-purple-300 text-xs px-2 py-1 flex-shrink-0 whitespace-nowrap"
        >
          {supersetGroup.items.length === 2
            ? "SUPERSET"
            : `CIRCUIT (${supersetGroup.items.length})`}
        </Badge>
      )}

      {/* Exercise name - read-only display with proper truncation */}
      <div className="bg-[#2A3133] border border-[#606364] text-white text-sm flex-1 min-w-0 h-9 px-3 py-2 rounded-md flex items-center overflow-hidden">
        <span className="truncate block w-full">
          {isSuperset && supersetGroup ? (
            <span className="truncate block">
              {supersetGroup.items.map((item, idx) => (
                <span key={item.id} className="inline">
                  {item.title || "Untitled Exercise"}
                  {idx < supersetGroup.items.length - 1 && " + "}
                </span>
              ))}
            </span>
          ) : (
            <span className="truncate block">
              {exercise.title || "Untitled Exercise"}
            </span>
          )}
        </span>
      </div>

      {/* Quick stats display */}
      <div className="flex flex-col items-center gap-1 text-xs text-gray-400 flex-shrink-0">
        <div className="flex items-center gap-1">
          {exercise.sets && (
            <span className="bg-[#2A3133] px-1.5 py-0.5 rounded text-xs whitespace-nowrap">
              {exercise.sets}s
            </span>
          )}
          {exercise.reps && (
            <span className="bg-[#2A3133] px-1.5 py-0.5 rounded text-xs whitespace-nowrap">
              {exercise.reps}r
            </span>
          )}
        </div>
        {exercise.tempo && (
          <span className="bg-[#2A3133] px-1.5 py-0.5 rounded text-xs whitespace-nowrap">
            {exercise.tempo}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onEditExercise(exercise)}
          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-1 h-8 w-8 min-h-[44px] min-w-[44px]"
        >
          <Edit className="h-4 w-4" />
        </Button>

        {/* Superset/Circuit Chain Link Button */}
        {!exercise.supersetId ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenSupersetModal(exercise)}
            className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 p-1 h-8 w-8 min-h-[44px] min-w-[44px]"
            title="Add Superset or Circuit"
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
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenSupersetModal(exercise, exercise.supersetId)}
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 p-1 h-8 w-8 min-h-[44px] min-w-[44px]"
              title="Add exercise to group"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemoveSuperset(exercise.id)}
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-1 h-8 w-8 min-h-[44px] min-w-[44px]"
              title="Remove from group"
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
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </Button>
          </>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 h-8 w-8 min-h-[44px] min-w-[44px]"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function MobileSeamlessRoutineModal({
  isOpen,
  onClose,
  routine,
  onOpenVideoLibrary,
  selectedVideoFromLibrary,
  onVideoProcessed,
  onSuccess,
}: MobileSeamlessRoutineModalProps) {
  // Generate unique IDs for temporary exercises
  const tempIdCounterRef = useRef(0);
  const generateTempId = () => {
    tempIdCounterRef.current++;
    return `temp-${Date.now()}-${tempIdCounterRef.current}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;
  };

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    "details" | "exercises" | "review"
  >("details");

  // Superset/Circuit management state
  const [isSupersetModalOpen, setIsSupersetModalOpen] = useState(false);
  const [pendingSupersetExercise, setPendingSupersetExercise] =
    useState<RoutineExercise | null>(null);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<Set<string>>(
    new Set()
  );
  const [isAddingToExisting, setIsAddingToExisting] = useState(false);
  const [existingSupersetId, setExistingSupersetId] = useState<string | null>(
    null
  );

  // Exercise edit dialog state
  const [isExerciseEditDialogOpen, setIsExerciseEditDialogOpen] =
    useState(false);
  const [editingExercise, setEditingExercise] =
    useState<RoutineExercise | null>(null);

  // Superset description modal state
  const [isSupersetDescriptionModalOpen, setIsSupersetDescriptionModalOpen] =
    useState(false);
  const [editingSuperset, setEditingSuperset] = useState<{
    supersetId: string;
    exercises: RoutineExercise[];
  } | null>(null);

  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Track if modal was just opened to preserve step when navigating
  const isInitialOpen = useRef(false);
  const hasUserMadeChanges = useRef(false);
  const lastRoutineIdRef = useRef<string | null>(null);

  // Set up drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before dragging starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      hasUserMadeChanges.current = true;
      setExercises(items => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Handle exercise edit submit
  const handleExerciseEditSubmit = (details: {
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
  }) => {
    if (!editingExercise) return;

    hasUserMadeChanges.current = true;
    const updatedExercise: RoutineExercise = {
      id: editingExercise.id,
      title: details.title,
      type: editingExercise.type,
      description: details.description || "",
      notes: editingExercise.notes || "",
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

    setExercises(prev => {
      const existingIndex = prev.findIndex(ex => ex.id === editingExercise.id);
      if (existingIndex >= 0) {
        return prev.map(ex =>
          ex.id === editingExercise.id ? updatedExercise : ex
        );
      } else {
        return [...prev, updatedExercise];
      }
    });

    setIsExerciseEditDialogOpen(false);
    setEditingExercise(null);
  };

  // Handle superset description modal save
  const handleSupersetDescriptionSave = (data: {
    exercises: Array<{
      id: string;
      title: string;
      sets?: number;
      reps?: number;
      description?: string;
    }>;
    supersetDescription?: string;
  }) => {
    if (!editingSuperset) return;

    hasUserMadeChanges.current = true;
    // Update all exercises in the superset
    setExercises(prev =>
      prev.map(exercise => {
        if (exercise.supersetId === editingSuperset.supersetId) {
          const updatedData = data.exercises.find(
            ex => ex.id === exercise.supersetOrder?.toString()
          );
          if (updatedData) {
            return {
              ...exercise,
              title: updatedData.title,
              sets: updatedData.sets,
              reps: updatedData.reps,
              description: updatedData.description,
              // Only set superset description on the first exercise
              supersetDescription:
                exercise.supersetOrder === 1
                  ? data.supersetDescription
                  : exercise.supersetDescription,
            };
          }
        }
        return exercise;
      })
    );

    setIsSupersetDescriptionModalOpen(false);
    setEditingSuperset(null);
  };

  // Create routine mutation
  const createRoutine = trpc.routines.create.useMutation({
    onSuccess: () => {
      utils.routines.list.invalidate();
      toast({
        title: "Routine created! 🎉",
        description: "Your new routine has been saved successfully.",
      });
      onSuccess?.();
      onClose();
    },
    onError: error => {
      toast({
        title: "Error",
        description: error.message || "Failed to create routine.",
        variant: "destructive",
      });
    },
  });

  // Update routine mutation
  const updateRoutine = trpc.routines.update.useMutation({
    onSuccess: () => {
      utils.routines.list.invalidate();
      if (routine?.id) {
        utils.routines.get.invalidate({ id: routine.id });
      }
      utils.routines.getRoutineAssignments.invalidate();
      utils.routines.getClientRoutineAssignments.invalidate();
      utils.routines.getRoutineAssignmentsForCalendar.invalidate();
      toast({
        title: "Routine updated! ✨",
        description: "Your routine has been updated successfully.",
      });
      onSuccess?.();
      onClose();
    },
    onError: error => {
      toast({
        title: "Error",
        description: error.message || "Failed to update routine.",
        variant: "destructive",
      });
    },
  });

  // Reset form ONLY when modal first opens (not when routine changes)
  useEffect(() => {
    if (isOpen && !isInitialOpen.current) {
      isInitialOpen.current = true;
      hasUserMadeChanges.current = false;
      lastRoutineIdRef.current = routine?.id || null;
      if (routine) {
        setName(routine.name);
        setDescription(routine.description);
        setExercises(routine.exercises);
        setCurrentStep("details");
      } else {
        setName("");
        setDescription("");
        setExercises([]);
        setCurrentStep("details");
      }
    } else if (!isOpen) {
      isInitialOpen.current = false;
      hasUserMadeChanges.current = false;
      lastRoutineIdRef.current = null;
    } else if (isOpen && routine) {
      const isDifferentRoutine = lastRoutineIdRef.current !== routine.id;
      if (isDifferentRoutine) {
        lastRoutineIdRef.current = routine.id;
        hasUserMadeChanges.current = false;
        setName(routine.name);
        setDescription(routine.description);
        setExercises(routine.exercises);
        setCurrentStep("details");
      } else if (!hasUserMadeChanges.current) {
        setName(routine.name);
        setDescription(routine.description);
      }
    }
  }, [isOpen, routine]);

  // Handle video selection from library
  useEffect(() => {
    if (selectedVideoFromLibrary) {
      setCurrentStep(prevStep => {
        return prevStep === "exercises" ? prevStep : "exercises";
      });
      handleVideoSelect(selectedVideoFromLibrary);
      onVideoProcessed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVideoFromLibrary]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in the routine name.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (routine?.id) {
        await updateRoutine.mutateAsync({
          id: routine.id,
          name: name.trim(),
          description: description.trim(),
          exercises: exercises.map((exercise, index) => ({
            ...exercise,
            order: index + 1,
          })),
        });
      } else {
        await createRoutine.mutateAsync({
          name: name.trim(),
          description: description.trim(),
          exercises: exercises.map((exercise, index) => ({
            ...exercise,
            order: index + 1,
          })),
        });
      }
    } catch (error) {
      console.error("Error saving routine:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateExercise = (
    index: number,
    field: keyof RoutineExercise,
    value: any
  ) => {
    hasUserMadeChanges.current = true;
    setExercises(prev =>
      prev.map((exercise, i) =>
        i === index ? { ...exercise, [field]: value } : exercise
      )
    );
  };

  const removeExercise = (index: number) => {
    hasUserMadeChanges.current = true;
    setExercises(prev => prev.filter((_, i) => i !== index));
  };

  const handleVideoSelect = (video: {
    id: string;
    title: string;
    description?: string;
    duration?: string;
    url?: string;
    thumbnail?: string;
  }) => {
    const alreadyExists = exercises.some(ex => ex.videoId === video.id);
    if (alreadyExists) {
      console.log("Video already in exercises, skipping duplicate");
      return;
    }

    let newExerciseId = generateTempId();
    while (exercises.some(ex => ex.id === newExerciseId)) {
      newExerciseId = generateTempId();
    }

    const newExercise: RoutineExercise = {
      id: newExerciseId,
      title: video.title,
      type: "video",
      description: video.description || "",
      duration: video.duration || "",
      videoUrl: video.url || "",
      videoId: video.id,
      videoTitle: video.title,
      videoThumbnail: video.thumbnail || "",
    };

    hasUserMadeChanges.current = true;
    setExercises(prev => [...prev, newExercise]);
  };

  const getExerciseColor = (type: string) => {
    switch (type) {
      case "exercise":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "drill":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "video":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "routine":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "superset":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  // Superset management functions
  const handleCreateSuperset = (
    exerciseId: string,
    selectedExerciseIds: string[]
  ) => {
    const firstExercise = exercises.find(ex => ex.id === exerciseId);

    if (firstExercise && selectedExerciseIds.length > 0) {
      const groupId = `superset-${Date.now()}`;

      const allSelectedExercises = [firstExercise];
      selectedExerciseIds.forEach(selectedId => {
        const selectedExercise = exercises.find(ex => ex.id === selectedId);
        if (selectedExercise) {
          allSelectedExercises.push(selectedExercise);
        }
      });

      hasUserMadeChanges.current = true;
      setExercises(prev =>
        prev.map(ex => {
          const selectedIndex = allSelectedExercises.findIndex(
            sel => sel.id === ex.id
          );
          if (selectedIndex !== -1) {
            return {
              ...ex,
              supersetId: groupId,
              supersetOrder: selectedIndex + 1,
              type: "superset",
            };
          }
          return ex;
        })
      );
    }
  };

  const handleAddToSuperset = (supersetId: string, exerciseId: string) => {
    const existingExercises = exercises.filter(
      ex => ex.supersetId === supersetId
    );
    const exerciseToAdd = exercises.find(ex => ex.id === exerciseId);

    if (exerciseToAdd && existingExercises.length > 0) {
      const maxOrder = Math.max(
        ...existingExercises.map(ex => ex.supersetOrder || 0)
      );
      hasUserMadeChanges.current = true;
      setExercises(prev =>
        prev.map(ex => {
          if (ex.id === exerciseId) {
            return {
              ...ex,
              supersetId: supersetId,
              supersetOrder: maxOrder + 1,
              type: "superset",
            };
          }
          return ex;
        })
      );
    }
  };

  const handleRemoveSuperset = (exerciseId: string) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (exercise && exercise.supersetId) {
      const supersetGroupId = exercise.supersetId;
      hasUserMadeChanges.current = true;
      setExercises(prev =>
        prev.map(ex => {
          if (ex.supersetId === supersetGroupId) {
            return {
              ...ex,
              supersetId: undefined,
              supersetOrder: undefined,
              type: "exercise",
            };
          }
          return ex;
        })
      );
    }
  };

  const handleOpenSupersetModal = (
    exercise: RoutineExercise,
    existingGroupId?: string
  ) => {
    setPendingSupersetExercise(exercise);
    setSelectedExerciseIds(new Set());
    if (existingGroupId) {
      setIsAddingToExisting(true);
      setExistingSupersetId(existingGroupId);
    } else {
      setIsAddingToExisting(false);
      setExistingSupersetId(null);
    }
    setIsSupersetModalOpen(true);
  };

  const toggleExerciseSelection = (exerciseId: string) => {
    setSelectedExerciseIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId);
      } else {
        newSet.add(exerciseId);
      }
      return newSet;
    });
  };

  const handleConfirmSuperset = () => {
    if (!pendingSupersetExercise) return;

    if (isAddingToExisting && existingSupersetId) {
      const selectedArray = Array.from(selectedExerciseIds);
      selectedArray.forEach(exerciseId => {
        handleAddToSuperset(existingSupersetId, exerciseId);
      });
    } else {
      const selectedArray = Array.from(selectedExerciseIds);
      if (selectedArray.length === 0) {
        setIsSupersetModalOpen(false);
        return;
      }
      handleCreateSuperset(pendingSupersetExercise.id, selectedArray);
    }

    setIsSupersetModalOpen(false);
    setSelectedExerciseIds(new Set());
    setPendingSupersetExercise(null);
    setIsAddingToExisting(false);
    setExistingSupersetId(null);
  };

  const getGroupName = (groupId: string): string => {
    const groupExercises = exercises.filter(ex => ex.supersetId === groupId);
    return groupExercises.length === 2 ? "Superset" : "Circuit";
  };

  const getSupersetGroups = () => {
    const groups: { [key: string]: RoutineExercise[] } = {};
    exercises.forEach(exercise => {
      if (exercise.supersetId) {
        if (!groups[exercise.supersetId]) {
          groups[exercise.supersetId] = [];
        }
        groups[exercise.supersetId].push(exercise);
      }
    });
    return Object.values(groups).map((items, index) => {
      const sortedItems = items.sort(
        (a, b) => (a.supersetOrder || 0) - (b.supersetOrder || 0)
      );
      const isCircuit = sortedItems.length > 2;
      return {
        name: isCircuit
          ? `Circuit ${index + 1} (${sortedItems.length} exercises)`
          : `Superset ${index + 1}`,
        items: sortedItems,
      };
    });
  };

  const canProceedToExercises = name.trim();
  const canProceedToReview =
    exercises.length > 0 && exercises.every(ex => ex.title.trim());

  // Filter exercises to show only first item in each superset group
  const filteredExercises = exercises.filter(exercise => {
    if (exercise.supersetId) {
      const supersetGroup = getSupersetGroups().find(group =>
        group.items.some(groupItem => groupItem.id === exercise.id)
      );
      return supersetGroup && supersetGroup.items[0]?.id === exercise.id;
    }
    return true;
  });

  // Remove any duplicate IDs
  const seenIds = new Set<string>();
  const uniqueFilteredExercises = filteredExercises.filter(exercise => {
    if (seenIds.has(exercise.id)) {
      return false;
    }
    seenIds.add(exercise.id);
    return true;
  });

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="bg-[#2A3133] border-[#606364] max-h-[90vh] overflow-hidden flex flex-col p-0 [&>button]:hidden max-w-[95vw] w-[95vw]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#606364]">
            <div>
              <DialogTitle className="text-white text-lg font-bold">
                {routine && routine.id ? "Edit Routine" : "Create New Routine"}
              </DialogTitle>
              <DialogDescription className="text-gray-400 mt-1 text-sm">
                {routine
                  ? "Update your routine details and exercises"
                  : "Build a reusable routine that can be added to any program"}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-600"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="px-4 py-3 border-b border-[#606364]">
            <div className="flex items-center justify-center space-x-4">
              {[
                { key: "details", label: "Details" },
                { key: "exercises", label: "Exercises" },
                { key: "review", label: "Review" },
              ].map((step, index) => {
                const isActive = currentStep === step.key;
                const isCompleted =
                  (step.key === "details" &&
                    canProceedToExercises &&
                    currentStep !== "details") ||
                  (step.key === "exercises" &&
                    canProceedToReview &&
                    currentStep !== "exercises") ||
                  (step.key === "review" &&
                    exercises.length > 0 &&
                    currentStep !== "review");

                return (
                  <div key={step.key} className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 ${
                        isActive
                          ? "bg-[#4A5A70] border-[#4A5A70] text-white"
                          : isCompleted
                          ? "bg-green-500 border-green-500 text-white"
                          : "bg-transparent border-gray-600 text-gray-400"
                      }`}
                    >
                      <span className="text-xs font-bold">
                        {isCompleted && !isActive ? "✓" : index + 1}
                      </span>
                    </div>
                    <span
                      className={`ml-2 text-xs font-medium ${
                        isActive ? "text-white" : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </span>
                    {index < 2 && (
                      <ArrowRight className="h-3 w-3 text-gray-600 mx-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {currentStep === "details" && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Routine Details
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Give your routine a name to get started (description is
                    optional)
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="routine-name"
                      className="text-white text-sm font-medium"
                    >
                      Routine Name *
                    </Label>
                    <Input
                      id="routine-name"
                      value={name}
                      onChange={e => {
                        setName(e.target.value);
                        hasUserMadeChanges.current = true;
                      }}
                      placeholder="e.g., Drive Warm-up, Core Stability, Power Development"
                      className="bg-[#353A3A] border-[#606364] text-white mt-2 h-11 text-base"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="routine-description"
                      className="text-white text-sm font-medium"
                    >
                      Description (Optional)
                    </Label>
                    <Textarea
                      id="routine-description"
                      value={description}
                      onChange={e => {
                        setDescription(e.target.value);
                        hasUserMadeChanges.current = true;
                      }}
                      placeholder="Describe what this routine focuses on and when to use it... (optional)"
                      className="bg-[#353A3A] border-[#606364] text-white mt-2 min-h-[80px] resize-none"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === "exercises" && (
              <div className="space-y-4">
                <div className="text-center mb-3">
                  <h3 className="text-base font-medium text-white mb-1">
                    Add Exercises
                  </h3>
                  <p className="text-sm text-gray-400">
                    Build your routine by adding exercises, drills, or videos
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Add Exercise Button */}
                  <Button
                    type="button"
                    onClick={() => onOpenVideoLibrary?.()}
                    className="w-full bg-[#4A5A70] hover:bg-[#606364] text-white h-11 min-h-[44px]"
                  >
                    Add from Video Library
                  </Button>

                  {/* Exercises List */}
                  {exercises.length === 0 ? (
                    <Card className="bg-[#353A3A] border-[#606364]">
                      <CardContent className="p-8 text-center">
                        <h4 className="text-base font-medium text-white mb-2">
                          No exercises added yet
                        </h4>
                        <p className="text-gray-400 text-sm mb-4">
                          Start building your routine by adding exercises from
                          your library or creating custom ones
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={uniqueFilteredExercises.map(ex => ex.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {uniqueFilteredExercises.map((exercise, index) => (
                            <SortableExerciseItem
                              key={exercise.id}
                              exercise={exercise}
                              index={index}
                              onUpdate={updateExercise}
                              onRemove={removeExercise}
                              getExerciseColor={getExerciseColor}
                              onCreateSuperset={(exerciseId, existingId) => {
                                const ex = exercises.find(
                                  e => e.id === exerciseId
                                );
                                if (ex) {
                                  handleOpenSupersetModal(ex, existingId);
                                }
                              }}
                              onRemoveSuperset={handleRemoveSuperset}
                              onOpenSupersetModal={handleOpenSupersetModal}
                              getSupersetGroups={getSupersetGroups}
                              onEditExercise={exercise => {
                                if (exercise.supersetId) {
                                  // This is a superset exercise - open superset modal
                                  const supersetExercises = exercises.filter(
                                    ex => ex.supersetId === exercise.supersetId
                                  );
                                  setEditingSuperset({
                                    supersetId: exercise.supersetId,
                                    exercises: supersetExercises,
                                  });
                                  setIsSupersetDescriptionModalOpen(true);
                                } else {
                                  // Regular exercise - open individual edit dialog
                                  setEditingExercise(exercise);
                                  setIsExerciseEditDialogOpen(true);
                                }
                              }}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </div>
            )}

            {currentStep === "review" && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Review Your Routine
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Double-check everything looks good before saving
                  </p>
                </div>

                <div className="space-y-4">
                  <Card className="bg-[#353A3A] border-[#606364]">
                    <CardContent className="p-4">
                      <h4 className="text-base font-semibold text-white mb-2">
                        {name}
                      </h4>
                      <p className="text-gray-400 text-sm mb-3">
                        {description || "No description"}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{exercises.length} exercises</span>
                        <span>Ready to use</span>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-2">
                    <h5 className="text-white font-medium text-sm">
                      Exercises:
                    </h5>
                    {uniqueFilteredExercises.map((exercise, index) => {
                      const supersetGroup = exercise.supersetId
                        ? getSupersetGroups().find(group =>
                            group.items.some(item => item.id === exercise.id)
                          )
                        : null;

                      return (
                        <div
                          key={exercise.id}
                          className="flex items-center gap-3 p-3 bg-[#353A3A] rounded-lg border border-[#606364]"
                        >
                          <div className="w-6 h-6 bg-[#4A5A70] rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-white font-medium text-sm">
                                {supersetGroup
                                  ? supersetGroup.items
                                      .map(item => item.title)
                                      .join(" + ")
                                  : exercise.title}
                              </span>
                              <Badge
                                variant="outline"
                                className={`${getExerciseColor(
                                  exercise.type
                                )} text-xs`}
                              >
                                <span className="capitalize">
                                  {exercise.type}
                                </span>
                              </Badge>
                              {supersetGroup && (
                                <Badge
                                  variant="outline"
                                  className="bg-purple-600/20 border-purple-500/50 text-purple-300 text-xs"
                                >
                                  {supersetGroup.items.length === 2
                                    ? "SUPERSET"
                                    : `CIRCUIT (${supersetGroup.items.length})`}
                                </Badge>
                              )}
                            </div>
                            {(exercise.sets ||
                              exercise.reps ||
                              exercise.tempo) && (
                              <div className="text-sm text-gray-400 mt-1">
                                {exercise.sets && `${exercise.sets} sets`}
                                {exercise.sets && exercise.reps && " • "}
                                {exercise.reps && `${exercise.reps} reps`}
                                {exercise.tempo && ` • ${exercise.tempo} tempo`}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-[#606364]">
            <div className="flex gap-2">
              {currentStep !== "details" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentStep === "exercises") setCurrentStep("details");
                    if (currentStep === "review") setCurrentStep("exercises");
                  }}
                  className="border-[#606364] text-gray-300 hover:bg-[#353A3A] text-sm h-11 min-h-[44px]"
                >
                  Back
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-[#606364] text-gray-300 hover:bg-[#353A3A] text-sm h-11 min-h-[44px]"
              >
                Cancel
              </Button>

              {currentStep === "details" && (
                <Button
                  onClick={() => setCurrentStep("exercises")}
                  disabled={!canProceedToExercises}
                  className="bg-[#4A5A70] hover:bg-[#606364] text-white text-sm h-11 min-h-[44px]"
                >
                  Next: Add Exercises
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}

              {currentStep === "exercises" && (
                <Button
                  onClick={() => setCurrentStep("review")}
                  disabled={!canProceedToReview}
                  className="bg-[#4A5A70] hover:bg-[#606364] text-white text-sm h-11 min-h-[44px]"
                >
                  Next: Review
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}

              {currentStep === "review" && (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm h-11 min-h-[44px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {routine ? "Updating..." : "Creating..."}
                    </>
                  ) : routine ? (
                    "Update Routine"
                  ) : (
                    "Create Routine"
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>

        {/* Superset/Circuit Modal */}
        <Dialog
          open={isSupersetModalOpen}
          onOpenChange={setIsSupersetModalOpen}
        >
          <DialogContent
            nested={true}
            className="bg-[#2A3133] border-[#606364] z-[10002] max-w-[95vw] sm:max-w-2xl max-h-[80vh] flex flex-col"
          >
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
                  : "Select one or more exercises. Select 1 exercise for a Superset (2 total) or 2+ exercises for a Circuit (3+ total)."}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-4 p-4">
              <div>
                <Label className="text-white">
                  {isAddingToExisting ? "Current Group" : "First Exercise"}
                </Label>
                <div className="p-3 bg-[#353A3A] rounded border border-[#606364]">
                  <p className="text-white font-medium">
                    {pendingSupersetExercise?.title}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {pendingSupersetExercise?.description ||
                      pendingSupersetExercise?.notes}
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
                <div className="max-h-64 overflow-y-auto border border-[#606364] rounded p-2 space-y-2 bg-[#353A3A]">
                  {exercises
                    .filter(ex => {
                      if (ex.id === pendingSupersetExercise?.id) return false;
                      if (
                        isAddingToExisting &&
                        existingSupersetId &&
                        ex.supersetId === existingSupersetId
                      )
                        return false;
                      if (!isAddingToExisting && ex.supersetId) return false;
                      return true;
                    })
                    .map(ex => (
                      <label
                        key={ex.id}
                        className="flex items-center space-x-3 p-2 hover:bg-[#2A3133] rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedExerciseIds.has(ex.id)}
                          onChange={() => toggleExerciseSelection(ex.id)}
                          className="w-4 h-4 text-blue-600 bg-[#353A3A] border-[#606364] rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">
                            {ex.title}
                          </p>
                          {(ex.description || ex.notes) && (
                            <p className="text-gray-400 text-xs">
                              {ex.description || ex.notes}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                </div>
              </div>
            </div>
            <DialogFooter className="border-t border-[#606364] p-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsSupersetModalOpen(false);
                  setSelectedExerciseIds(new Set());
                  setPendingSupersetExercise(null);
                  setIsAddingToExisting(false);
                  setExistingSupersetId(null);
                }}
                className="border-[#606364] text-gray-300 hover:bg-[#353A3A] w-full sm:w-auto h-11 min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSuperset}
                disabled={!isAddingToExisting && selectedExerciseIds.size === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto h-11 min-h-[44px]"
              >
                {isAddingToExisting ? "Add Exercises" : "Create Group"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Exercise Edit Dialog */}
        {editingExercise && editingExercise.id && (
          <ExerciseEditDialog
            key={editingExercise.id}
            isOpen={isExerciseEditDialogOpen}
            onClose={() => {
              setIsExerciseEditDialogOpen(false);
              setEditingExercise(null);
            }}
            onSubmit={handleExerciseEditSubmit}
            exercise={editingExercise}
          />
        )}
      </Dialog>

      {/* Superset Description Modal - Rendered outside main Dialog */}
      <SupersetDescriptionModal
        isOpen={isSupersetDescriptionModalOpen}
        onClose={() => {
          setIsSupersetDescriptionModalOpen(false);
          setEditingSuperset(null);
        }}
        onSave={handleSupersetDescriptionSave}
        initialData={
          editingSuperset
            ? {
                exercises: editingSuperset.exercises.map(ex => ({
                  id: ex.supersetOrder?.toString() || ex.id,
                  title: ex.title,
                  sets: ex.sets,
                  reps: ex.reps,
                  description: ex.description,
                })),
                supersetDescription: (editingSuperset.exercises[0] as any)
                  ?.supersetDescription,
              }
            : undefined
        }
        supersetName={
          editingSuperset
            ? editingSuperset.exercises.length === 2
              ? "Superset"
              : `Circuit (${editingSuperset.exercises.length})`
            : "Superset"
        }
      />
    </>
  );
}
