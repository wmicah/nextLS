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
    description: string; // CHANGED: Make description required, always present (even if empty string)
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
  // Initialize form data with empty defaults
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    sets: undefined as number | undefined,
    reps: undefined as number | undefined,
    tempo: "",
    duration: "",
    coachInstructions: {
      whatToDo: "",
      howToDoIt: "",
      keyPoints: [] as string[],
      commonMistakes: [] as string[],
      equipment: "",
      setup: "",
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CRITICAL: Update form data whenever the exercise changes or dialog opens
  // This ensures the form always shows the current exercise data including description
  useEffect(() => {
    if (isOpen && exercise) {
      console.log("=== ExerciseEditDialog: Loading exercise data ===");
      console.log("exercise object:", exercise);
      console.log("exercise.description:", exercise.description);
      console.log("exercise.description type:", typeof exercise.description);
      console.log("exercise.description === ''?", exercise.description === "");

      // CRITICAL: Always ensure description is a string, never undefined or null
      const formDescription = exercise.description ?? "";
      console.log("Setting form description to:", formDescription);
      console.log("Form description type:", typeof formDescription);
      console.log("Form description length:", formDescription.length);

      // Update all form fields with the exercise data
      setFormData({
        title: exercise.title || "",
        description: formDescription, // Always use the description from exercise
        sets: exercise.sets || undefined,
        reps: exercise.reps || undefined,
        tempo: exercise.tempo || "",
        duration: exercise.duration || "",
        coachInstructions: exercise.coachInstructions
          ? {
              whatToDo: exercise.coachInstructions.whatToDo || "",
              howToDoIt: exercise.coachInstructions.howToDoIt || "",
              keyPoints: exercise.coachInstructions.keyPoints || [],
              commonMistakes: exercise.coachInstructions.commonMistakes || [],
              equipment: exercise.coachInstructions.equipment || "",
              setup: exercise.coachInstructions.setup || "",
            }
          : {
              whatToDo: "",
              howToDoIt: "",
              keyPoints: [],
              commonMistakes: [],
              equipment: "",
              setup: "",
            },
      });

      console.log("✅ Form data description length:", formDescription.length);
    } else if (!isOpen) {
      // Reset form data when dialog closes
      setFormData({
        title: "",
        description: "",
        sets: undefined,
        reps: undefined,
        tempo: "",
        duration: "",
        coachInstructions: {
          whatToDo: "",
          howToDoIt: "",
          keyPoints: [],
          commonMistakes: [],
          equipment: "",
          setup: "",
        },
      });
      setIsSubmitting(false);
    }
  }, [exercise, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    console.log("=== ExerciseEditDialog: Form submitted ===");
    console.log("formData:", formData);
    console.log("formData.description:", formData.description);
    console.log("formData.description type:", typeof formData.description);
    console.log("formData.description === ''?", formData.description === "");
    console.log("formData.description length:", formData.description?.length);

    setIsSubmitting(true);
    // CRITICAL: Ensure description is always included, even if empty string
    // Explicitly pass description to guarantee it's always present
    const submitData = {
      ...formData,
      description: formData.description ?? "", // Force description to always be a string
    };
    console.log("📤 Submitting form data:", submitData);
    console.log("📤 Description in submit:", submitData.description);
    console.log("📤 Description type:", typeof submitData.description);
    onSubmit(submitData);
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

  // CRITICAL: Reset submitting state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
    }
  }, [isOpen]);

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

  // CRITICAL: Fetch the routine fresh from the database when editing
  // This ensures we get the complete data including descriptions
  // The routine prop from routines.list may not have all fields
  const { data: fetchedRoutine, isLoading: isLoadingRoutine } =
    trpc.routines.get.useQuery(
      { id: routine?.id || "" },
      {
        enabled: isOpen && !!routine?.id, // Only fetch when modal is open and we have a routine ID
        refetchOnWindowFocus: false,
        refetchOnMount: true, // Always refetch when component mounts
      }
    );

  // Use the fetched routine if available, otherwise fall back to the prop
  // The fetched routine will have complete data including descriptions
  // CRITICAL: Only use fetchedRoutine when it's available and we're editing
  // If we're creating a new routine (no routine.id), don't use fetchedRoutine
  const routineToUse =
    routine?.id && fetchedRoutine
      ? fetchedRoutine // Use fetched routine when editing (has complete data)
      : routine; // Use prop routine when creating new or fetch hasn't completed yet

  // Handle exercise edit submit
  const handleExerciseEditSubmit = (details: {
    title: string;
    description: string; // CHANGED: Make description required, always present
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

    console.log("details:", details);
    console.log("details.description:", details.description);
    console.log("details.description type:", typeof details.description);
    console.log("details has description property:", "description" in details);
    console.log("editingExercise before update:", editingExercise);

    hasUserMadeChanges.current = true;

    // CRITICAL: description is now required, but we still ensure it's always a string
    // Use explicit check to handle any edge cases
    const descriptionValue =
      typeof details.description === "string"
        ? details.description
        : details.description ?? "";

    console.log("🔍 Description value determined:", {
      detailsDescription: details.description,
      detailsDescriptionType: typeof details.description,
      detailsHasDescription: "description" in details,
      descriptionValue,
      descriptionValueType: typeof descriptionValue,
      descriptionIsString: typeof descriptionValue === "string",
    });

    const updatedExercise: RoutineExercise = {
      ...editingExercise, // Spread all existing fields first (preserves superset fields, video fields, etc.)
      title: details.title,
      description: descriptionValue, // ALWAYS set explicitly, never rely on optional property
      sets: details.sets,
      reps: details.reps,
      tempo: details.tempo || "",
      duration: details.duration || "",
      coachInstructions:
        details.coachInstructions || editingExercise.coachInstructions,
    };

    console.log("updatedExercise after update:", updatedExercise);
    console.log("updatedExercise.description:", updatedExercise.description);

    // Check if the exercise already exists in the array
    setExercises(prev => {
      const existingIndex = prev.findIndex(ex => ex.id === editingExercise.id);
      if (existingIndex >= 0) {
        // Exercise exists - update it
        const updated = prev.map(ex =>
          ex.id === editingExercise.id ? updatedExercise : ex
        );
        const updatedExerciseInArray = updated.find(
          ex => ex.id === editingExercise.id
        );
        console.log("Updated exercise in array:", updatedExerciseInArray);
        return updated;
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

    console.log("Saved exercises from modal:", data.exercises);
    console.log("Editing superset ID:", editingSuperset.supersetId);
    console.log("Current exercises before update:", exercises);

    // Create a map of saved exercise IDs for quick lookup
    // The modal uses supersetOrder as the ID, so we need to match by that
    const savedExerciseIds = new Set(data.exercises.map(ex => ex.id));
    console.log("Saved exercise IDs set:", Array.from(savedExerciseIds));

    // Update exercises: remove deleted ones, update existing ones
    setExercises(prev => {
      console.log("Previous exercises count:", prev.length);

      const filtered = prev.filter(exercise => {
        // Keep exercises that are NOT in this superset
        if (exercise.supersetId !== editingSuperset.supersetId) {
          return true;
        }
        // For exercises in this superset, only keep if they're in the saved data
        // Match by supersetOrder (which is what the modal uses as ID)
        const exerciseKey = exercise.supersetOrder?.toString();
        const shouldKeep = exerciseKey
          ? savedExerciseIds.has(exerciseKey)
          : false;
        return shouldKeep;
      });

      console.log("Exercises after filter:", filtered.length);

      const updated = filtered.map(exercise => {
        // Update exercises that are in the superset and in the saved data
        if (exercise.supersetId === editingSuperset.supersetId) {
          const exerciseKey = exercise.supersetOrder?.toString();
          const updatedData = exerciseKey
            ? data.exercises.find(ex => ex.id === exerciseKey)
            : null;
          if (updatedData) {
            console.log(
              `Updating exercise ${exercise.title} with data:`,
              updatedData
            );
            return {
              ...exercise,
              title: updatedData.title,
              sets: updatedData.sets,
              reps: updatedData.reps,
              description: updatedData.description || "",
              // Only set superset description on the first exercise
              supersetDescription:
                exercise.supersetOrder === 1
                  ? data.supersetDescription
                  : (exercise as any).supersetDescription,
            };
          }
        }
        return exercise;
      });

      console.log("Final updated exercises count:", updated.length);

      return updated;
    });

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

  // Load routine data when modal opens
  // CRITICAL: Use a separate effect that runs when fetchedRoutine becomes available
  // This ensures we get complete data including descriptions when editing
  useEffect(() => {
    if (!isOpen) {
      // Modal closed - reset flags for next open
      isInitialOpen.current = false;
      hasUserMadeChanges.current = false;
      lastRoutineIdRef.current = null;
      return;
    }

    // Modal is open - check if we need to load routine data
    if (!isInitialOpen.current) {
      // Modal just opened - mark as opened but wait for data if editing
      isInitialOpen.current = true;
      hasUserMadeChanges.current = false;
      lastRoutineIdRef.current = routine?.id || null;

      if (!routine?.id) {
        // Creating new routine - initialize empty
        setName("");
        setDescription("");
        setExercises([]);
        setCurrentStep("details");
      }
      // If editing, wait for fetchedRoutine in the next effect
    }
  }, [isOpen, routine?.id]);

  // Load routine data when fetchedRoutine becomes available (for editing)
  // This effect runs when fetchedRoutine loads from the database
  useEffect(() => {
    if (!isOpen || !routine?.id) return;
    if (isLoadingRoutine) return; // Still loading
    if (!fetchedRoutine) return; // Not yet available
    if (!isInitialOpen.current) return; // Modal hasn't been marked as opened yet

    // Check if this is a different routine or if we haven't loaded this one yet
    const isDifferentRoutine = lastRoutineIdRef.current !== fetchedRoutine.id;
    const hasNotLoadedYet = lastRoutineIdRef.current === null;

    // Only load if it's a different routine, or if we haven't loaded yet and user hasn't made changes
    if (!isDifferentRoutine && !hasNotLoadedYet) {
      // Same routine already loaded - don't reload unless user hasn't made changes
      if (hasUserMadeChanges.current) {
        console.log("⚠️ Skipping reload - user has made changes");
        return;
      }
    }

    console.log("routine from database:", fetchedRoutine);
    console.log("routine.exercises:", fetchedRoutine.exercises);

    setName(fetchedRoutine.name);
    setDescription(fetchedRoutine.description ?? "");

    // Ensure descriptions are preserved when loading from database
    const loadedExercises: RoutineExercise[] = fetchedRoutine.exercises.map(
      (ex: any) => {
        // The database returns coachInstructions as flat fields, not nested
        const exAny = ex as any;
        const loaded: RoutineExercise = {
          id: ex.id,
          title: ex.title,
          type: (ex.type || "exercise") as
            | "exercise"
            | "drill"
            | "video"
            | "routine"
            | "superset",
          description: ex.description ?? "", // Convert null/undefined to empty string
          notes: ex.notes ?? "",
          sets: ex.sets ?? undefined,
          reps: ex.reps ?? undefined,
          tempo: ex.tempo ?? "",
          duration: ex.duration ?? "",
          videoUrl: ex.videoUrl ?? "",
          videoId: ex.videoId ?? undefined,
          videoTitle: ex.videoTitle ?? undefined,
          videoThumbnail: ex.videoThumbnail ?? undefined,
          supersetId: ex.supersetId ?? undefined,
          supersetOrder: ex.supersetOrder ?? undefined,
          supersetDescription: ex.supersetDescription ?? undefined,
          coachInstructions:
            exAny.coachInstructionsWhatToDo || exAny.coachInstructionsHowToDoIt
              ? {
                  whatToDo: exAny.coachInstructionsWhatToDo ?? "",
                  howToDoIt: exAny.coachInstructionsHowToDoIt ?? "",
                  keyPoints: exAny.coachInstructionsKeyPoints || [],
                  commonMistakes: exAny.coachInstructionsCommonMistakes || [],
                  equipment: exAny.coachInstructionsEquipment ?? undefined,
                  setup: exAny.coachInstructionsSetup ?? undefined,
                }
              : undefined,
        };
        console.log(`Loaded exercise ${ex.title}:`, {
          description: loaded.description,
          descriptionType: typeof loaded.description,
          originalDescription: ex.description,
          originalDescriptionType: typeof ex.description,
          originalIsNull: ex.description === null,
          originalIsUndefined: ex.description === undefined,
          hasDescription:
            loaded.description !== undefined && loaded.description !== null,
          descriptionLength: loaded.description?.length || 0,
        });
        return loaded;
      }
    );

    console.log("✅ Loaded exercises into state:", loadedExercises);

    setExercises(loadedExercises);
    setCurrentStep("details");
    lastRoutineIdRef.current = fetchedRoutine.id;
    hasUserMadeChanges.current = false; // Reset after loading
  }, [isOpen, routine?.id, fetchedRoutine, isLoadingRoutine]);

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
        description: video.description ?? "",
        notes: undefined, // No notes initially for videos
        duration: video.duration || "",
        videoUrl: video.url || "",
        videoId: video.id,
        videoTitle: video.title,
        videoThumbnail: video.thumbnail || "",
      };

      console.log("Video object:", video);
      console.log("Video description:", video.description);
      console.log("Video description type:", typeof video.description);
      console.log("New exercise:", newExercise);
      console.log("New exercise description:", newExercise.description);

      // Mark that user has made changes
      hasUserMadeChanges.current = true;
      const updated = [...prev, newExercise];
      return updated;
    });
  };

  // Routine mutations
  const createRoutine = trpc.routines.create.useMutation({
    onSuccess: createdRoutine => {
      console.log("🎉 [CREATE SUCCESS] Exercises:", createdRoutine.exercises);

      utils.routines.list.invalidate();

      toast({
        title: "Routine created! 🎉",
        description: "Your new routine has been saved successfully.",
      });

      // CRITICAL: Reset submitting state and close modal
      // Use requestAnimationFrame to ensure state update happens before close
      requestAnimationFrame(() => {
        setIsSubmitting(false);
        // Close modal after a brief delay to allow state update to propagate
        setTimeout(() => {
          onClose();
        }, 50);
      });
    },
    onError: (error: unknown) => {
      console.error("Error creating routine:", error);
      setIsSubmitting(false);
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
      console.log("🎉 [UPDATE SUCCESS] Exercises:", updatedRoutine.exercises);

      // Invalidate all routine-related queries to ensure fresh data everywhere
      utils.routines.list.invalidate();
      // Invalidate the specific routine query if we have an ID
      if (routineToUse?.id) {
        utils.routines.get.invalidate({ id: routineToUse.id });
      }
      // Also invalidate all routine-related queries that might be cached
      utils.routines.getRoutineAssignments.invalidate();
      utils.routines.getClientRoutineAssignments.invalidate();
      utils.routines.getRoutineAssignmentsForCalendar.invalidate();

      toast({
        title: "Routine updated! ✨",
        description: "Your routine has been updated successfully.",
      });

      // CRITICAL: Reset submitting state and close modal
      // Use requestAnimationFrame to ensure state update happens before close
      requestAnimationFrame(() => {
        setIsSubmitting(false);
        // Close modal after a brief delay to allow state update to propagate
        setTimeout(() => {
          onClose();
        }, 50);
      });
    },
    onError: (error: unknown) => {
      console.error("Error updating routine:", error);
      setIsSubmitting(false);
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

    // Add a timeout fallback to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      console.error("⏱️ Mutation timeout - resetting submitting state");
      setIsSubmitting(false);
      toast({
        title: "Timeout",
        description:
          "The request is taking longer than expected. Please try again.",
        variant: "destructive",
      });
    }, 30000); // 30 second timeout

    try {
      console.log("exercises before mapping:", exercises);

      const mappedExercises = exercises.map((exercise, index) => {
        // CRITICAL: Always explicitly include description, even if empty string
        // Don't rely on spread operator - explicitly set every field we need
        const mapped: any = {
          title: exercise.title,
          type: exercise.type,
          description: exercise.description ?? "", // Always set to string, never undefined
          notes: exercise.notes ?? "",
          sets: exercise.sets,
          reps: exercise.reps,
          tempo: exercise.tempo,
          duration: exercise.duration,
          videoId: exercise.videoId,
          videoTitle: exercise.videoTitle,
          videoThumbnail: exercise.videoThumbnail,
          videoUrl: exercise.videoUrl,
          supersetId: exercise.supersetId,
          supersetOrder: exercise.supersetOrder,
          supersetDescription: exercise.supersetDescription,
          supersetInstructions: (exercise as any).supersetInstructions,
          supersetNotes: (exercise as any).supersetNotes,
          order: index + 1,
        };
        console.log(`Exercise ${index} (${exercise.title}):`, {
          description: mapped.description,
          descriptionType: typeof mapped.description,
          hasDescription:
            mapped.description !== undefined && mapped.description !== null,
          descriptionLength: mapped.description?.length || 0,
          originalExercise: exercise,
        });
        return mapped;
      });

      console.log("✅ Mapped exercises for save:", mappedExercises);

      if (routineToUse?.id) {
        // Update existing routine
        console.log("🔄 Updating existing routine:", routineToUse.id);
        console.log("🔄 Payload being sent:", {
          id: routineToUse.id,
          name: name.trim(),
          description: description.trim(),
          exercises: mappedExercises.map(ex => ({
            title: ex.title,
            description: ex.description,
            descriptionType: typeof ex.description,
            descriptionLength: ex.description?.length || 0,
          })),
        });
        await updateRoutine.mutateAsync({
          id: routineToUse.id,
          name: name.trim(),
          description: description.trim(),
          exercises: mappedExercises,
        });
        // Clear timeout on success
        clearTimeout(timeoutId);
        // Note: setIsSubmitting(false) is handled in onSuccess/onError callbacks
      } else {
        // Create new routine
        console.log("✨ Payload being sent:", {
          name: name.trim(),
          description: description.trim(),
          exercises: mappedExercises.map(ex => ({
            title: ex.title,
            description: ex.description,
            descriptionType: typeof ex.description,
            descriptionLength: ex.description?.length || 0,
          })),
        });
        await createRoutine.mutateAsync({
          name: name.trim(),
          description: description.trim(),
          exercises: mappedExercises,
        });
        // Clear timeout on success
        clearTimeout(timeoutId);
        // Note: setIsSubmitting(false) is handled in onSuccess/onError callbacks
      }
    } catch (error) {
      // Clear timeout on error
      clearTimeout(timeoutId);
      // This catch block handles any unexpected errors outside the mutation
      console.error("Error saving routine:", error);
      setIsSubmitting(false);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save routine. Please try again.",
        variant: "destructive",
      });
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
                                    // CRITICAL: Log the exercise to verify it has description
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
                  description: ex.description || "",
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
