"use client";

import { useState, useEffect } from "react";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, ArrowRight, X } from "lucide-react";
import { trpc } from "@/app/_trpc/client";
import { useToast } from "@/lib/hooks/use-toast";

interface RoutineExercise {
  id: string;
  title: string;
  type: "exercise" | "drill" | "video" | "routine";
  notes?: string;
  sets?: number;
  reps?: number;
  tempo?: string;
  duration?: string;
  videoUrl?: string;
  videoId?: string;
  videoTitle?: string;
  videoThumbnail?: string;
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

export default function SeamlessRoutineModal({
  isOpen,
  onClose,
  routine,
  onOpenVideoLibrary,
  selectedVideoFromLibrary,
  onVideoProcessed,
}: SeamlessRoutineModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    "details" | "exercises" | "review"
  >("details");

  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Reset form when modal opens/closes or routine changes
  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen, routine]);

  // Handle video selection from library
  useEffect(() => {
    if (selectedVideoFromLibrary) {
      handleVideoSelect(selectedVideoFromLibrary);
      onVideoProcessed?.();
    }
  }, [selectedVideoFromLibrary, onVideoProcessed]);

  const handleVideoSelect = (video: {
    id: string;
    title: string;
    description?: string;
    duration?: string;
    url?: string;
    thumbnail?: string;
  }) => {
    const newExercise: RoutineExercise = {
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
    setExercises(prev => [...prev, newExercise]);
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
    onSuccess: () => {
      utils.routines.list.invalidate();
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
    if (!name.trim() || !description.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in both name and description.",
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
    setExercises(prev =>
      prev.map((exercise, i) =>
        i === index ? { ...exercise, [field]: value } : exercise
      )
    );
  };

  const removeExercise = (index: number) => {
    setExercises(prev => prev.filter((_, i) => i !== index));
  };

  const addEmptyExercise = () => {
    const newExercise: RoutineExercise = {
      id: `temp-${Date.now()}`,
      title: "",
      type: "exercise",
      notes: "",
    };
    setExercises(prev => [...prev, newExercise]);
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
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const canProceedToExercises = name.trim() && description.trim();
  const canProceedToReview =
    exercises.length > 0 && exercises.every(ex => ex.title.trim());

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="bg-[#2A3133] border-gray-600 max-w-4xl max-h-[90vh] z-[100] overflow-hidden flex flex-col p-0 [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <div>
            <DialogTitle className="text-white text-2xl font-bold">
              {routine ? "Edit Routine" : "Create New Routine"}
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
                  Give your routine a name and description to get started
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
                    autoFocus
                  />
                </div>

                <div>
                  <Label
                    htmlFor="routine-description"
                    className="text-white text-sm font-medium"
                  >
                    Description *
                  </Label>
                  <Textarea
                    id="routine-description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe what this routine focuses on and when to use it..."
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
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-1 h-12"
                  >
                    Add from Video Library
                  </Button>
                  <Button
                    type="button"
                    onClick={addEmptyExercise}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-600 flex-1 h-12"
                  >
                    Add Custom Exercise
                  </Button>
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
                      <div className="flex gap-3 justify-center">
                        <Button
                          onClick={() => onOpenVideoLibrary?.()}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Add from Library
                        </Button>
                        <Button
                          onClick={addEmptyExercise}
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-600"
                        >
                          Add Exercise
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {exercises.map((exercise, index) => (
                      <Card
                        key={exercise.id}
                        className="bg-[#353A3A] border-gray-600 hover:border-gray-500 transition-colors"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-gray-300 text-sm font-medium">
                                {index + 1}
                              </div>
                              <Badge
                                variant="outline"
                                className={getExerciseColor(exercise.type)}
                              >
                                <span className="capitalize">
                                  {exercise.type}
                                </span>
                              </Badge>
                            </div>

                            <div className="flex-1 space-y-3">
                              <Input
                                value={exercise.title}
                                onChange={e =>
                                  updateExercise(index, "title", e.target.value)
                                }
                                placeholder="Exercise name"
                                className="bg-[#2A3133] border-gray-600 text-white text-lg font-medium"
                              />

                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <Label className="text-gray-400 text-xs">
                                    Sets
                                  </Label>
                                  <Input
                                    value={exercise.sets || ""}
                                    onChange={e =>
                                      updateExercise(
                                        index,
                                        "sets",
                                        e.target.value
                                          ? parseInt(e.target.value)
                                          : undefined
                                      )
                                    }
                                    placeholder="Sets"
                                    type="number"
                                    className="bg-[#2A3133] border-gray-600 text-white"
                                  />
                                </div>
                                <div>
                                  <Label className="text-gray-400 text-xs">
                                    Reps
                                  </Label>
                                  <Input
                                    value={exercise.reps || ""}
                                    onChange={e =>
                                      updateExercise(
                                        index,
                                        "reps",
                                        e.target.value
                                          ? parseInt(e.target.value)
                                          : undefined
                                      )
                                    }
                                    placeholder="Reps"
                                    type="number"
                                    className="bg-[#2A3133] border-gray-600 text-white"
                                  />
                                </div>
                                <div>
                                  <Label className="text-gray-400 text-xs">
                                    Tempo
                                  </Label>
                                  <Input
                                    value={exercise.tempo || ""}
                                    onChange={e =>
                                      updateExercise(
                                        index,
                                        "tempo",
                                        e.target.value
                                      )
                                    }
                                    placeholder="e.g., 2-0-2"
                                    className="bg-[#2A3133] border-gray-600 text-white"
                                  />
                                </div>
                              </div>

                              <Textarea
                                value={exercise.notes || ""}
                                onChange={e =>
                                  updateExercise(index, "notes", e.target.value)
                                }
                                placeholder="Notes (optional)"
                                className="bg-[#2A3133] border-gray-600 text-white resize-none"
                                rows={2}
                              />
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExercise(index)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 mt-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
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
                            <span className="capitalize">{exercise.type}</span>
                          </Badge>
                        </div>
                        {(exercise.sets || exercise.reps || exercise.tempo) && (
                          <div className="text-sm text-gray-400 mt-1">
                            {exercise.sets && `${exercise.sets} sets`}
                            {exercise.sets && exercise.reps && " • "}
                            {exercise.reps && `${exercise.reps} reps`}
                            {exercise.tempo && ` • ${exercise.tempo} tempo`}
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
    </Dialog>
  );
}
