"use client";

import React from "react";
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
import { Plus, Trash2, ArrowRight, X, GripVertical, Edit } from "lucide-react";
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
import { trpc } from "@/app/_trpc/client";
import { useToast } from "@/lib/hooks/use-toast";
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
  supersetId?: string; // ID of the superset group
  supersetOrder?: number; // Order within the superset (1, 2, etc.)
  supersetDescription?: string; // Superset description (only on first exercise)
  coachInstructions?: {
    whatToDo: string;
    howToDoIt: string;
    keyPoints: string[];
    commonMistakes: string[];
    equipment?: string;
    setup?: string;
  };
}

interface SeamlessRoutineModalProps {
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
      <DialogContent
        nested={true}
        className="bg-[#2A3133] border-gray-600 max-w-2xl"
      >
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
      className={`flex items-center gap-2 p-3 bg-[#353A3A] rounded-lg border border-gray-600 hover:border-gray-500 transition-colors overflow-hidden ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-move text-gray-400 hover:text-gray-300 p-1 flex-shrink-0"
      >
        <GripVertical className="h-3 w-3" />
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
      <div className="bg-[#2A3133] border border-gray-600 text-white text-sm flex-1 min-w-0 h-8 px-3 py-2 rounded-md flex items-center overflow-hidden">
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

      {/* Action buttons - hide when edit form is expanded */}
      <div
        className="flex items-center gap-1 flex-shrink-0"
        id={`action-buttons-${exercise.id}`}
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onEditExercise(exercise)}
          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-1 h-6 w-6 flex-shrink-0"
        >
          <Edit className="h-3 w-3" />
        </Button>

        {/* Superset/Circuit Chain Link Button */}
        {!exercise.supersetId ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenSupersetModal(exercise)}
            className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 p-1 h-6 w-6 flex-shrink-0"
            title="Add Superset or Circuit"
          >
            <svg
              className="h-3 w-3"
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
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 p-1 h-6 w-6 flex-shrink-0"
              title="Add exercise to group"
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemoveSuperset(exercise.id)}
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-1 h-6 w-6 flex-shrink-0"
              title="Remove from group"
            >
              <svg
                className="h-3 w-3"
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
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 h-6 w-6 flex-shrink-0"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Inline edit form - appears below the exercise */}
      <div id={`edit-form-${exercise.id}`} className="hidden w-full">
        <div className="mt-2 p-3 bg-[#2A3133] rounded border border-gray-600">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <Label className="text-gray-400 text-xs block mb-1">Sets</Label>
              <Input
                value={exercise.sets || ""}
                onChange={e => {
                  const value = parseInt(e.target.value);
                  if (value >= 0) {
                    onUpdate(index, "sets", value || undefined);
                  }
                }}
                type="number"
                min="0"
                className="bg-[#353A3A] border-gray-500 text-white text-sm h-8"
              />
            </div>
            <div className="flex-1">
              <Label className="text-gray-400 text-xs block mb-1">Reps</Label>
              <Input
                value={exercise.reps || ""}
                onChange={e => {
                  const value = parseInt(e.target.value);
                  if (value >= 0) {
                    onUpdate(index, "reps", value || undefined);
                  }
                }}
                type="number"
                min="0"
                className="bg-[#353A3A] border-gray-500 text-white text-sm h-8"
              />
            </div>
            <div className="flex-1">
              <Label className="text-gray-400 text-xs block mb-1">
                Duration
              </Label>
              <Input
                value={exercise.tempo || ""}
                onChange={e => onUpdate(index, "tempo", e.target.value)}
                placeholder="e.g., 30 seconds or 2-0-2"
                className="bg-[#353A3A] border-gray-500 text-white text-sm h-8"
              />
            </div>
          </div>
          <div>
            <Label className="text-gray-400 text-xs block mb-1">Notes</Label>
            <Textarea
              value={exercise.notes || ""}
              onChange={e => onUpdate(index, "notes", e.target.value)}
              placeholder="Add any notes or instructions..."
              className="bg-[#353A3A] border-gray-500 text-white text-sm resize-none w-full"
              rows={2}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SeamlessRoutineModal({
  isOpen,
  onClose,
  routine,
  onOpenVideoLibrary,
  selectedVideoFromLibrary,
  onVideoProcessed,
}: SeamlessRoutineModalProps) {
  // Generate unique IDs for temporary exercises
  // Use a ref-based counter + timestamp + random to ensure absolute uniqueness across renders
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
      coachInstructions: details.coachInstructions,
    };

    // Check if the exercise already exists in the array
    setExercises(prev => {
      const existingIndex = prev.findIndex(ex => ex.id === editingExercise.id);
      if (existingIndex >= 0) {
        // Exercise exists - update it
        return prev.map(ex =>
          ex.id === editingExercise.id ? updatedExercise : ex
        );
      } else {
        // New exercise - add it
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
                  : (exercise as any).supersetDescription,
            };
          }
        }
        return exercise;
      })
    );

    setIsSupersetDescriptionModalOpen(false);
    setEditingSuperset(null);
  };

  // Set up drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
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

  // Function to close all expanded edit forms
  const closeAllEditForms = () => {
    exercises.forEach(exercise => {
      const editForm = document.getElementById(`edit-form-${exercise.id}`);
      const actionButtons = document.getElementById(
        `action-buttons-${exercise.id}`
      );
      if (editForm && !editForm.classList.contains("hidden")) {
        editForm.classList.add("hidden");
        // Show action buttons when form is closed
        if (actionButtons) {
          actionButtons.style.display = "flex";
        }
      }
    });
  };

  // Handle click outside to close expanded forms
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest('[id^="edit-form-"]') &&
        !target.closest('button[onclick*="edit-form"]')
      ) {
        closeAllEditForms();
      }
    };

    if (exercises.length > 0) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }

    return undefined;
  }, [exercises.length]);

  // Track if modal was just opened to preserve step when navigating
  const isInitialOpen = useRef(false);
  const hasUserMadeChanges = useRef(false);
  const lastRoutineIdRef = useRef<string | null>(null);

  // Reset form ONLY when modal first opens (not when routine changes)
  useEffect(() => {
    if (isOpen && !isInitialOpen.current) {
      // Modal just opened - reset everything
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
      // Modal closed - reset flags for next open
      isInitialOpen.current = false;
      hasUserMadeChanges.current = false;
      lastRoutineIdRef.current = null;
    } else if (isOpen && routine) {
      // Modal is open - check if this is a different routine
      const isDifferentRoutine = lastRoutineIdRef.current !== routine.id;
      if (isDifferentRoutine) {
        // Different routine - reset everything
        lastRoutineIdRef.current = routine.id;
        hasUserMadeChanges.current = false;
        setName(routine.name);
        setDescription(routine.description);
        setExercises(routine.exercises);
        setCurrentStep("details");
      } else if (!hasUserMadeChanges.current) {
        // Same routine, no user changes - only update name/description if they changed
        setName(routine.name);
        setDescription(routine.description);
        // DON'T update exercises or reset step - preserve user's work
      }
      // If user has made changes, don't overwrite anything
    }
  }, [isOpen, routine]);

  // Handle video selection from library - ensure we stay on exercises step
  useEffect(() => {
    if (selectedVideoFromLibrary) {
      // Ensure we're on the exercises step when adding a video
      setCurrentStep(prevStep => {
        // Only change to exercises if we're not already there
        return prevStep === "exercises" ? prevStep : "exercises";
      });
      handleVideoSelect(selectedVideoFromLibrary);
      onVideoProcessed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVideoFromLibrary]);

  const handleVideoSelect = (video: {
    id: string;
    title: string;
    description?: string;
    duration?: string;
    url?: string;
    thumbnail?: string;
  }) => {
    // Add video directly to exercises - use functional update to ensure we get latest state
    setExercises(prev => {
      // Check if this video is already added (by videoId to prevent duplicates)
      const alreadyExists = prev.some(ex => ex.videoId === video.id);
      if (alreadyExists) {
        console.log("Video already in exercises, skipping duplicate");
        return prev;
      }

      // Generate unique ID
      let newExerciseId = generateTempId();
      // Ensure ID is unique (very unlikely but safety check)
      while (prev.some(ex => ex.id === newExerciseId)) {
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

      // Mark that user has made changes
      hasUserMadeChanges.current = true;
      const updated = [...prev, newExercise];
      console.log(
        "✅ Video added to exercises:",
        newExercise.title,
        "Total exercises:",
        updated.length
      );
      return updated;
    });
  };

  // Routine mutations
  const createRoutine = trpc.routines.create.useMutation({
    onSuccess: () => {
      utils.routines.list.invalidate();
      toast({
        title: "Routine created! 🎉",
        description: "Your new routine has been saved successfully.",
      });
      onClose();
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create routine",
        variant: "destructive",
      });
    },
  });

  const updateRoutine = trpc.routines.update.useMutation({
    onSuccess: updatedRoutine => {
      // Invalidate all routine-related queries to ensure fresh data everywhere
      utils.routines.list.invalidate();
      // Invalidate the specific routine query if we have an ID
      if (routine?.id) {
        utils.routines.get.invalidate({ id: routine.id });
      }
      // Also invalidate all routine-related queries that might be cached
      utils.routines.getRoutineAssignments.invalidate();
      utils.routines.getClientRoutineAssignments.invalidate();
      utils.routines.getRoutineAssignmentsForCalendar.invalidate();
      toast({
        title: "Routine updated! ✨",
        description: "Your routine has been updated successfully.",
      });
      onClose();
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update routine",
        variant: "destructive",
      });
    },
  });

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
        // Update existing routine
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
        // Create new routine
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

  const addEmptyExercise = () => {
    hasUserMadeChanges.current = true;
    setExercises(prev => {
      let newExerciseId = generateTempId();
      // Ensure ID is unique (very unlikely but safety check)
      while (prev.some(ex => ex.id === newExerciseId)) {
        newExerciseId = generateTempId();
      }
      const newExercise: RoutineExercise = {
        id: newExerciseId,
        title: "",
        type: "exercise",
        notes: "",
      };
      return [...prev, newExercise];
    });
  };

  // Icons removed for cleaner design

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
      // Create a unique superset/circuit ID
      const groupId = `superset-${Date.now()}`;

      // Get all selected exercises
      const allSelectedExercises = [firstExercise];
      selectedExerciseIds.forEach(selectedId => {
        const selectedExercise = exercises.find(ex => ex.id === selectedId);
        if (selectedExercise) {
          allSelectedExercises.push(selectedExercise);
        }
      });

      // Update all exercises to be part of the same group
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
      // Find all exercises in the same superset group
      const supersetGroupId = exercise.supersetId;
      const supersetExercises = exercises.filter(
        ex => ex.supersetId === supersetGroupId
      );

      // Remove superset properties from all exercises in the group
      setExercises(prev =>
        prev.map(ex => {
          if (ex.supersetId === supersetGroupId) {
            return {
              ...ex,
              supersetId: undefined,
              supersetOrder: undefined,
              type: "exercise", // Reset to default type
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
      // Add selected exercises to existing group
      const selectedArray = Array.from(selectedExerciseIds);
      selectedArray.forEach(exerciseId => {
        handleAddToSuperset(existingSupersetId, exerciseId);
      });
    } else {
      // Create new group
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

  // Helper function to get group name (Superset for 2, Circuit for 3+)
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="bg-[#2A3133] border-gray-600 max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 [&>button]:hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-600">
            <div>
              <DialogTitle className="text-white text-2xl font-bold">
                {routine && routine.id ? "Edit Routine" : "Create New Routine"}
              </DialogTitle>
              <DialogDescription className="text-gray-400 mt-1">
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
          <div className="px-6 py-4 border-b border-gray-600">
            <div className="flex items-center justify-center space-x-8">
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
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                        isActive
                          ? "bg-[#4A5A70] border-[#4A5A70] text-white"
                          : isCompleted
                          ? "bg-green-500 border-green-500 text-white"
                          : "bg-transparent border-gray-600 text-gray-400"
                      }`}
                    >
                      <span className="text-sm font-bold">
                        {isCompleted && !isActive ? "✓" : index + 1}
                      </span>
                    </div>
                    <span
                      className={`ml-3 text-sm font-medium ${
                        isActive ? "text-white" : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </span>
                    {index < 2 && (
                      <ArrowRight className="h-4 w-4 text-gray-600 mx-4" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {currentStep === "details" && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Routine Details
                  </h3>
                  <p className="text-gray-400">
                    Give your routine a name to get started (description is
                    optional)
                  </p>
                </div>

                <div className="max-w-2xl mx-auto space-y-6">
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
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g., Drive Warm-up, Core Stability, Power Development"
                      className="bg-[#353A3A] border-gray-600 text-white mt-2 h-12 text-lg"
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
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Describe what this routine focuses on and when to use it... (optional)"
                      className="bg-[#353A3A] border-gray-600 text-white mt-2 min-h-[100px] resize-none"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === "exercises" && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Add Exercises
                  </h3>
                  <p className="text-gray-400">
                    Build your routine by adding exercises, drills, or videos
                  </p>
                </div>

                <div className="max-w-4xl mx-auto">
                  {/* Add Exercise Buttons */}
                  <div className="flex gap-4 mb-6">
                    <Button
                      type="button"
                      onClick={() => onOpenVideoLibrary?.()}
                      className="bg-gray-600 hover:bg-blue-900 hover:cursor-pointer text-white flex-1 h-12"
                    >
                      Add from Video Library
                    </Button>

                    {exercises.length > 0 && (
                      <Button
                        type="button"
                        onClick={closeAllEditForms}
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-600 h-12 px-4"
                      >
                        Close All
                      </Button>
                    )}
                  </div>

                  {/* Exercises List */}
                  {exercises.length === 0 ? (
                    <Card className="bg-[#353A3A] border-gray-600">
                      <CardContent className="p-12 text-center">
                        <h4 className="text-lg font-medium text-white mb-2">
                          No exercises added yet
                        </h4>
                        <p className="text-gray-400 mb-6">
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
                        items={Array.from(
                          new Set(exercises.map(exercise => exercise.id))
                        )}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {(() => {
                            // Filter out duplicate superset items (only show first item in each group)
                            let filteredExercises = exercises.filter(
                              exercise => {
                                if (exercise.supersetId) {
                                  const supersetGroup =
                                    getSupersetGroups().find(group =>
                                      group.items.some(
                                        groupItem =>
                                          groupItem.id === exercise.id
                                      )
                                    );
                                  return (
                                    supersetGroup &&
                                    supersetGroup.items[0]?.id === exercise.id
                                  );
                                }
                                return true;
                              }
                            );

                            // Remove any duplicate IDs (keep first occurrence)
                            const seenIds = new Set<string>();
                            filteredExercises = filteredExercises.filter(
                              exercise => {
                                if (seenIds.has(exercise.id)) {
                                  console.warn(
                                    `Duplicate exercise ID detected and removed: ${exercise.id}`
                                  );
                                  return false;
                                }
                                seenIds.add(exercise.id);
                                return true;
                              }
                            );

                            return filteredExercises.map((exercise, index) => (
                              <SortableExerciseItem
                                key={exercise.id}
                                exercise={exercise}
                                index={index}
                                onUpdate={updateExercise}
                                onRemove={removeExercise}
                                getExerciseColor={getExerciseColor}
                                onCreateSuperset={(exerciseId, existingId) => {
                                  const exercise = exercises.find(
                                    ex => ex.id === exerciseId
                                  );
                                  if (exercise) {
                                    handleOpenSupersetModal(
                                      exercise,
                                      existingId
                                    );
                                  }
                                }}
                                onRemoveSuperset={handleRemoveSuperset}
                                onOpenSupersetModal={handleOpenSupersetModal}
                                getSupersetGroups={getSupersetGroups}
                                onEditExercise={exercise => {
                                  if (exercise.supersetId) {
                                    // This is a superset exercise - open superset modal
                                    const supersetExercises = exercises.filter(
                                      ex =>
                                        ex.supersetId === exercise.supersetId
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
                            ));
                          })()}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </div>
            )}

            {currentStep === "review" && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Review Your Routine
                  </h3>
                  <p className="text-gray-400">
                    Double-check everything looks good before saving
                  </p>
                </div>

                <div className="max-w-2xl mx-auto space-y-6">
                  <Card className="bg-[#353A3A] border-gray-600">
                    <CardContent className="p-6">
                      <h4 className="text-lg font-semibold text-white mb-2">
                        {name}
                      </h4>
                      <p className="text-gray-400 mb-4">{description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>{exercises.length} exercises</span>
                        <span>Ready to use</span>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-3">
                    <h5 className="text-white font-medium">Exercises:</h5>
                    {exercises.map((exercise, index) => (
                      <div
                        key={exercise.id}
                        className="flex items-center gap-3 p-3 bg-[#353A3A] rounded-lg border border-gray-600"
                      >
                        <div className="w-6 h-6 bg-[#4A5A70] rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">
                              {exercise.title}
                            </span>
                            <Badge
                              variant="outline"
                              className={getExerciseColor(exercise.type)}
                            >
                              <span className="capitalize">
                                {exercise.type}
                              </span>
                            </Badge>
                          </div>
                          {(exercise.sets ||
                            exercise.reps ||
                            exercise.tempo) && (
                            <div className="text-sm text-gray-400 mt-1">
                              {exercise.sets && `${exercise.sets} sets`}
                              {exercise.sets && exercise.reps && " • "}
                              {exercise.reps && `${exercise.reps} reps`}
                              {exercise.tempo &&
                                ` • ${exercise.tempo} duration`}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-600">
            <div className="flex gap-3">
              {currentStep !== "details" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentStep === "exercises") setCurrentStep("details");
                    if (currentStep === "review") setCurrentStep("exercises");
                  }}
                  className="border-gray-600 text-gray-300 hover:bg-gray-600"
                >
                  Back
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-gray-600 text-gray-300 hover:bg-gray-600"
              >
                Cancel
              </Button>

              {currentStep === "details" && (
                <Button
                  onClick={() => setCurrentStep("exercises")}
                  disabled={!canProceedToExercises}
                  className="bg-[#4A5A70] hover:bg-[#606364] text-white"
                >
                  Next: Add Exercises
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}

              {currentStep === "exercises" && (
                <Button
                  onClick={() => setCurrentStep("review")}
                  disabled={!canProceedToReview}
                  className="bg-[#4A5A70] hover:bg-[#606364] text-white"
                >
                  Next: Review
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}

              {currentStep === "review" && (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {routine ? "Updating..." : "Creating..."}
                    </>
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
            className="bg-[#2A3133] border-gray-600 max-w-2xl max-h-[80vh] flex flex-col"
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
                <div className="p-3 bg-gray-700 rounded border border-gray-600">
                  <p className="text-white font-medium">
                    {pendingSupersetExercise?.title}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {pendingSupersetExercise?.notes}
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
                  {exercises
                    .filter(ex => {
                      // Don't show the pending exercise or exercises already in the group
                      if (ex.id === pendingSupersetExercise?.id) return false;
                      if (
                        isAddingToExisting &&
                        existingSupersetId &&
                        ex.supersetId === existingSupersetId
                      )
                        return false;
                      // Don't show exercises already in other groups
                      if (!isAddingToExisting && ex.supersetId) return false;
                      return true;
                    })
                    .map(ex => (
                      <label
                        key={ex.id}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-700 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedExerciseIds.has(ex.id)}
                          onChange={() => toggleExerciseSelection(ex.id)}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">
                            {ex.title}
                          </p>
                          {ex.notes && (
                            <p className="text-gray-400 text-xs">{ex.notes}</p>
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
                  setPendingSupersetExercise(null);
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

        {/* Exercise Edit Dialog */}
        {editingExercise && editingExercise.id && (
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
