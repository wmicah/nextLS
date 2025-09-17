"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Target, Video, GripVertical } from "lucide-react";

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

interface CreateRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (routine: {
    id?: string;
    name: string;
    description: string;
    exercises: RoutineExercise[];
  }) => void;
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

export default function CreateRoutineModal({
  isOpen,
  onClose,
  onSubmit,
  routine,
  onOpenVideoLibrary,
  selectedVideoFromLibrary,
  onVideoProcessed,
}: CreateRoutineModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);

  // Reset form when modal opens/closes or routine changes
  useEffect(() => {
    if (isOpen) {
      if (routine) {
        setName(routine.name);
        setDescription(routine.description);
        setExercises(routine.exercises);
      } else {
        setName("");
        setDescription("");
        setExercises([]);
      }
    }
  }, [isOpen, routine]);

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
    // Video library will be closed by parent component
  };

  // Handle video selection from library
  useEffect(() => {
    if (selectedVideoFromLibrary) {
      handleVideoSelect(selectedVideoFromLibrary);
      onVideoProcessed?.();
    }
  }, [selectedVideoFromLibrary, onVideoProcessed]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && description.trim()) {
      onSubmit({
        id: routine?.id,
        name: name.trim(),
        description: description.trim(),
        exercises,
      });
      onClose();
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

  const moveExercise = (fromIndex: number, toIndex: number) => {
    setExercises(prev => {
      const newExercises = [...prev];
      const [movedExercise] = newExercises.splice(fromIndex, 1);
      newExercises.splice(toIndex, 0, movedExercise);
      return newExercises;
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));
    if (dragIndex !== dropIndex) {
      moveExercise(dragIndex, dropIndex);
    }
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent
          className="bg-[#2A3133] border-gray-600 max-w-4xl max-h-[90vh] z-[100] overflow-hidden flex flex-col"
          style={{ zIndex: 100 }}
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {routine ? "Edit Routine" : "Create New Routine"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {routine
                ? "Update your routine details and exercises."
                : "Add videos/exercises to create a reusable routine. This routine can then be added to any program day."}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="flex-1 overflow-y-auto space-y-6 p-1">
              {/* Routine Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="routine-name" className="text-white">
                    Routine Name
                  </Label>
                  <Input
                    id="routine-name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g., Drive Warm-up, Core Stability"
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="routine-description" className="text-white">
                    Description
                  </Label>
                  <Input
                    id="routine-description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe what this routine focuses on..."
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
              </div>

              {/* Exercises Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">Exercises</h3>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => onOpenVideoLibrary?.()}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Add from Library
                    </Button>
                    <Button
                      type="button"
                      onClick={addEmptyExercise}
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Exercise
                    </Button>
                  </div>
                </div>

                <Card className="bg-gray-700/50 border-gray-600">
                  <CardContent className="p-4">
                    {exercises.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>
                          No exercises added yet. Click "Add Exercise" to get
                          started.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {exercises.map((exercise, index) => (
                          <div
                            key={exercise.id}
                            className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-600"
                            draggable
                            onDragStart={e => handleDragStart(e, index)}
                            onDragOver={handleDragOver}
                            onDrop={e => handleDrop(e, index)}
                          >
                            <div className="cursor-move text-gray-400 hover:text-gray-300">
                              <GripVertical className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <Input
                                value={exercise.title}
                                onChange={e =>
                                  updateExercise(index, "title", e.target.value)
                                }
                                placeholder="Exercise name"
                                className="bg-gray-700 border-gray-600 text-white mb-2"
                              />
                              <div className="grid grid-cols-3 gap-2">
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
                                  className="bg-gray-700 border-gray-600 text-white text-sm"
                                />
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
                                  className="bg-gray-700 border-gray-600 text-white text-sm"
                                />
                                <Input
                                  value={exercise.tempo || ""}
                                  onChange={e =>
                                    updateExercise(
                                      index,
                                      "tempo",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Tempo"
                                  className="bg-gray-700 border-gray-600 text-white text-sm"
                                />
                              </div>
                              <Input
                                value={exercise.notes || ""}
                                onChange={e =>
                                  updateExercise(index, "notes", e.target.value)
                                }
                                placeholder="Notes (optional)"
                                className="bg-gray-700 border-gray-600 text-white text-sm mt-2"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExercise(index)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
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

            <DialogFooter className="flex-shrink-0 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-gray-600 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!name.trim() || !description.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {routine ? "Update Routine" : "Create Routine"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
