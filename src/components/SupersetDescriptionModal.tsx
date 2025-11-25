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
import { Trash2 } from "lucide-react";
import { COLORS } from "@/lib/colors";

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
  }, [initialData, isOpen]);

  const updateExercise = (index: number, field: keyof Exercise, value: any) => {
    setExercises(prev =>
      prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex))
    );
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
        // Always send description as a string (empty string if blank) to ensure it's saved
        // This matches how routine exercises handle descriptions
        description: ex.description?.trim() || "",
      })),
      supersetDescription: initialData?.supersetDescription || undefined,
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
    onClose();
  };

  if (!isOpen) return null;

  const isCircuit = exercises.length > 2;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        nested={true}
        className="w-full max-w-[95vw] sm:max-w-3xl max-h-[90vh] flex flex-col [&>button]:hidden"
        style={{
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE,
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>
            <span style={{ color: "#EC4899" }}>{isCircuit ? "Circuit" : "Superset"}</span>
            {" - Exercise Details"}
            {isCircuit && ` (${exercises.length} exercises)`}
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Exercises List */}
          <div className="space-y-2.5">
            {exercises.map((exercise, index) => (
              <div
                key={exercise.id || index}
                className="rounded-md p-3 space-y-2.5 border"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.BORDER_SUBTLE,
                }}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                    Exercise {index + 1}
                    {exercise.title &&
                      exercise.title !== `Exercise ${index + 1}` && (
                        <span className="ml-2" style={{ color: COLORS.TEXT_SECONDARY }}>
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
                      className="h-7 w-7 p-0"
                      style={{ color: COLORS.RED_ALERT }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = "rgba(217, 83, 79, 0.1)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                      title="Remove exercise"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>Sets</Label>
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
                      className="h-9 text-sm"
                      style={{
                        backgroundColor: COLORS.BACKGROUND_DARK,
                        borderColor: COLORS.BORDER_SUBTLE,
                        color: COLORS.TEXT_PRIMARY,
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = "#EC4899";
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                      }}
                      min="0"
                      placeholder="Sets"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>Reps</Label>
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
                      className="h-9 text-sm"
                      style={{
                        backgroundColor: COLORS.BACKGROUND_DARK,
                        borderColor: COLORS.BORDER_SUBTLE,
                        color: COLORS.TEXT_PRIMARY,
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = "#EC4899";
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                      }}
                      min="0"
                      placeholder="Reps"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>Description</Label>
                  <Textarea
                    placeholder="Exercise instructions, form cues, or modifications..."
                    value={exercise.description || ""}
                    onChange={e =>
                      updateExercise(index, "description", e.target.value)
                    }
                    className="text-sm min-h-[60px]"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_DARK,
                      borderColor: COLORS.BORDER_SUBTLE,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = "#EC4899";
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                    }}
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="border-t p-3 flex flex-col gap-2 sm:flex-row sm:justify-end" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto text-xs h-8 px-3"
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
            onClick={handleSave}
            className="w-full sm:w-auto text-xs h-8 px-3"
            style={{
              backgroundColor: "#EC4899",
              color: COLORS.TEXT_PRIMARY,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "#DB2777";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "#EC4899";
            }}
          >
            Save {isCircuit ? "Circuit" : "Superset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
