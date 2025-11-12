"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, Plus } from "lucide-react";

interface Exercise {
  id: string;
  title: string;
  sets?: number;
  reps?: number;
  description?: string;
}

interface SupersetDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    exercises: Exercise[];
    supersetDescription?: string;
  }) => void;
  initialData?: {
    exercises?: Exercise[];
    supersetDescription?: string;
  };
  supersetName?: string;
}

export default function SupersetDescriptionModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  supersetName = "Superset",
}: SupersetDescriptionModalProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [supersetDescription, setSupersetDescription] = useState("");

  // Initialize exercises from initialData
  useEffect(() => {
    if (initialData?.exercises && initialData.exercises.length > 0) {
      setExercises(initialData.exercises);
    } else {
      // Default to 2 exercises if no initial data
      setExercises([
        {
          id: "1",
          title: "Exercise 1",
          sets: 3,
          reps: 10,
          description: "",
        },
        {
          id: "2",
          title: "Exercise 2",
          sets: 3,
          reps: 10,
          description: "",
        },
      ]);
    }
    setSupersetDescription(initialData?.supersetDescription || "");
  }, [initialData, isOpen]);

  const updateExercise = (index: number, field: keyof Exercise, value: any) => {
    setExercises(prev =>
      prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex))
    );
  };

  const addExercise = () => {
    setExercises(prev => [
      ...prev,
      {
        id: `${Date.now()}`,
        title: `Exercise ${prev.length + 1}`,
        sets: 3,
        reps: 10,
        description: "",
      },
    ]);
  };

  const removeExercise = (index: number) => {
    if (exercises.length > 2) {
      setExercises(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSave = () => {
    onSave({
      exercises: exercises.map(ex => ({
        ...ex,
        description: ex.description?.trim() || undefined,
      })),
      supersetDescription: supersetDescription.trim() || undefined,
    });
    onClose();
  };

  const handleCancel = () => {
    if (initialData?.exercises && initialData.exercises.length > 0) {
      setExercises(initialData.exercises);
    } else {
      setExercises([
        {
          id: "1",
          title: "Exercise 1",
          sets: 3,
          reps: 10,
          description: "",
        },
        {
          id: "2",
          title: "Exercise 2",
          sets: 3,
          reps: 10,
          description: "",
        },
      ]);
    }
    setSupersetDescription(initialData?.supersetDescription || "");
    onClose();
  };

  if (!isOpen) return null;

  const isCircuit = exercises.length > 2;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        nested={true}
        className="bg-[#2A3133] border-[#606364] w-full max-w-[95vw] sm:max-w-3xl max-h-[90vh] flex flex-col"
      >
        <DialogHeader>
          <DialogTitle className="text-[#C3BCC2]">
            {isCircuit ? "Circuit" : "Superset"} - Exercise Details
            {isCircuit && ` (${exercises.length} exercises)`}
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Group Description */}
          <div className="space-y-2">
            <Label className="text-sm text-[#C3BCC2]">
              {isCircuit ? "Circuit" : "Superset"} Description
            </Label>
            <Textarea
              placeholder={`Brief description of this ${
                isCircuit ? "circuit" : "superset"
              }...`}
              value={supersetDescription}
              onChange={e => setSupersetDescription(e.target.value)}
              className="bg-[#353A3A] border-[#606364] text-[#C3BCC2] placeholder-[#ABA4AA] min-h-[60px]"
              rows={2}
            />
          </div>

          {/* Exercises List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-[#C3BCC2]">
                Exercises ({exercises.length})
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addExercise}
                className="border-[#606364] text-[#C3BCC2] hover:bg-[#353A3A] h-10 min-h-[44px]"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Exercise
              </Button>
            </div>

            {exercises.map((exercise, index) => (
              <div
                key={exercise.id || index}
                className="bg-[#353A3A] rounded-lg p-4 space-y-3 border border-[#606364]"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-[#C3BCC2]">
                    Exercise {index + 1}
                    {exercise.title &&
                      exercise.title !== `Exercise ${index + 1}` && (
                        <span className="text-[#ABA4AA] ml-2">
                          - {exercise.title}
                        </span>
                      )}
                  </h4>
                  {exercises.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExercise(index)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-8 w-8 p-0 min-h-[40px] min-w-[40px]"
                      title="Remove exercise"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-[#ABA4AA]">Sets</Label>
                    <Input
                      type="number"
                      value={exercise.sets || ""}
                      onChange={e =>
                        updateExercise(
                          index,
                          "sets",
                          parseInt(e.target.value) || undefined
                        )
                      }
                      className="bg-[#2A3133] border-[#606364] text-[#C3BCC2] h-10"
                      min="0"
                      placeholder="Sets"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-[#ABA4AA]">Reps</Label>
                    <Input
                      type="number"
                      value={exercise.reps || ""}
                      onChange={e =>
                        updateExercise(
                          index,
                          "reps",
                          parseInt(e.target.value) || undefined
                        )
                      }
                      className="bg-[#2A3133] border-[#606364] text-[#C3BCC2] h-10"
                      min="0"
                      placeholder="Reps"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-[#ABA4AA]">Description</Label>
                  <Textarea
                    placeholder="Exercise instructions, form cues, or modifications..."
                    value={exercise.description || ""}
                    onChange={e =>
                      updateExercise(index, "description", e.target.value)
                    }
                    className="bg-[#2A3133] border-[#606364] text-[#C3BCC2] placeholder-[#ABA4AA] min-h-[60px]"
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="border-t border-[#606364] p-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto border-[#606364] text-[#ABA4AA] hover:bg-[#2A3133] hover:text-[#C3BCC2] h-11 min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white h-11 min-h-[44px]"
          >
            Save {isCircuit ? "Circuit" : "Superset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
