"use client";

import { useState } from "react";
import {
  MoreVertical,
  Trash2,
  Edit,
  Link,
  Unlink,
  GripVertical,
} from "lucide-react";
import InlineNumber from "@/components/common/InlineNumber";
import MoreMenu, { menuItems } from "@/components/common/MoreMenu";
import { useUIStore } from "@/lib/stores/uiStore";
import { trpc } from "@/app/_trpc/client";

interface ExerciseRowProps {
  exercise: any;
  index: number;
  programId: string;
  onDelete: () => void;
  supersetExercises?: any[]; // Other exercises in the same superset
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export default function ExerciseRow({
  exercise,
  index,
  programId,
  onDelete,
  supersetExercises = [],
  onReorder,
}: ExerciseRowProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Debug logging
  console.log(
    "ExerciseRow rendering:",
    exercise.title,
    "isEditing:",
    isEditing
  );
  const { addToast } = useUIStore();
  const utils = trpc.useUtils();
  const [editedExercise, setEditedExercise] = useState({
    title: exercise.title,
    description: exercise.description || "",
    duration: exercise.duration || "",
    notes: exercise.notes || "",
    sets: exercise.sets || undefined,
    reps: exercise.reps || undefined,
    tempo: exercise.tempo || "",
    // Coach Instructions
    coachInstructions: exercise.coachInstructions || {
      whatToDo: "",
      howToDoIt: "",
      keyPoints: [],
      commonMistakes: [],
      equipment: "",
    },
  });

  // tRPC mutation for updating exercise
  const updateExerciseMutation = trpc.programs.updateExercise.useMutation({
    onSuccess: () => {
      utils.programs.getById.invalidate({ id: programId });
      addToast({
        type: "success",
        title: "Exercise updated",
        message: "Exercise details have been saved successfully.",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to update exercise",
        message: error.message,
      });
    },
  });

  const handleSave = () => {
    // If this exercise is part of a superset, we need to update both exercises
    if (exercise.supersetId && supersetExercises.length > 0) {
      // Update all exercises in the superset with the same data
      const updatePromises = supersetExercises.map(supersetExercise =>
        updateExerciseMutation.mutateAsync({
          exerciseId: supersetExercise.id,
          title: editedExercise.title,
          description: editedExercise.description,
          duration: editedExercise.duration,
          notes: editedExercise.notes,
          sets: editedExercise.sets,
          reps: editedExercise.reps,
          tempo: editedExercise.tempo,
          // Coach Instructions
          coachInstructions: editedExercise.coachInstructions,
        })
      );

      // Also update the current exercise
      updatePromises.push(
        updateExerciseMutation.mutateAsync({
          exerciseId: exercise.id,
          title: editedExercise.title,
          description: editedExercise.description,
          duration: editedExercise.duration,
          notes: editedExercise.notes,
          sets: editedExercise.sets,
          reps: editedExercise.reps,
          tempo: editedExercise.tempo,
          // Coach Instructions
          coachInstructions: editedExercise.coachInstructions,
        })
      );

      Promise.all(updatePromises)
        .then(() => {
          addToast({
            type: "success",
            title: "Superset updated",
            message: "All exercises in the superset have been updated.",
          });
          setIsEditing(false);
        })
        .catch((error: any) => {
          addToast({
            type: "error",
            title: "Failed to update superset",
            message: error.message,
          });
        });

      return;
    }

    // Regular exercise update
    updateExerciseMutation.mutate({
      exerciseId: exercise.id,
      title: editedExercise.title,
      description: editedExercise.description,
      duration: editedExercise.duration,
      notes: editedExercise.notes,
      sets: editedExercise.sets,
      reps: editedExercise.reps,
      tempo: editedExercise.tempo,
      // Coach Instructions
      coachInstructions: editedExercise.coachInstructions,
    });
  };

  const handleCancel = () => {
    setEditedExercise({
      title: exercise.title,
      description: exercise.description || "",
      duration: exercise.duration || "",
      notes: exercise.notes || "",
      sets: exercise.sets || undefined,
      reps: exercise.reps || undefined,
      tempo: exercise.tempo || "",
      // Coach Instructions
      coachInstructions: exercise.coachInstructions || {
        whatToDo: "",
        howToDoIt: "",
        keyPoints: [],
        commonMistakes: [],
        equipment: "",
      },
    });
    setIsEditing(false);
  };

  const handleLinkSuperset = () => {
    // TODO: Implement superset linking functionality
    addToast({
      type: "info",
      title: "Superset linking",
      message: "Select another exercise to link as superset.",
    });
  };

  const handleUnlinkSuperset = () => {
    // TODO: Implement superset unlinking functionality
    addToast({
      type: "success",
      title: "Superset unlinked",
      message: "Exercise has been unlinked from superset.",
    });
  };

  return (
    <div className="group relative">
      {/* Drag Handle */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      {/* Exercise Card */}
      <div
        className={`p-3 rounded-lg border transition-all duration-200 ${
          isEditing
            ? "ring-2 ring-sky-500 border-sky-500"
            : "border-gray-600 hover:border-gray-500"
        }`}
        style={{
          backgroundColor: "#2A2F2F",
        }}
      >
        {isEditing ? (
          /* Edit Mode */
          <div className="space-y-3">
            {/* Superset Indicator in Edit Mode */}
            {exercise.supersetId && (
              <div className="flex items-center gap-2 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded px-2 py-1">
                <Link className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400 font-medium">
                  Editing Superset - Changes will apply to all exercises in this
                  superset
                </span>
              </div>
            )}
            <div>
              <input
                type="text"
                value={editedExercise.title}
                onChange={e =>
                  setEditedExercise({
                    ...editedExercise,
                    title: e.target.value,
                  })
                }
                className="w-full p-2 rounded border text-white text-sm font-medium"
                style={{
                  backgroundColor: "#1F2323",
                  borderColor: "#606364",
                }}
                placeholder="Exercise title"
              />
            </div>

            <div>
              <textarea
                value={editedExercise.description}
                onChange={e =>
                  setEditedExercise({
                    ...editedExercise,
                    description: e.target.value,
                  })
                }
                rows={2}
                className="w-full p-2 rounded border text-white text-xs resize-none"
                style={{
                  backgroundColor: "#1F2323",
                  borderColor: "#606364",
                }}
                placeholder="Description (optional)"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={editedExercise.duration}
                  onChange={e =>
                    setEditedExercise({
                      ...editedExercise,
                      duration: e.target.value,
                    })
                  }
                  className="w-full p-2 rounded border text-white text-xs"
                  style={{
                    backgroundColor: "#1F2323",
                    borderColor: "#606364",
                  }}
                  placeholder="Duration (optional)"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={editedExercise.notes}
                  onChange={e =>
                    setEditedExercise({
                      ...editedExercise,
                      notes: e.target.value,
                    })
                  }
                  className="w-full p-2 rounded border text-white text-xs"
                  style={{
                    backgroundColor: "#1F2323",
                    borderColor: "#606364",
                  }}
                  placeholder="Notes (optional)"
                />
              </div>
            </div>

            {/* Sets, Reps, Duration */}
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  value={editedExercise.sets || ""}
                  onChange={e =>
                    setEditedExercise({
                      ...editedExercise,
                      sets: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  min={1}
                  max={99}
                  className="w-full p-2 rounded border text-white text-xs"
                  style={{
                    backgroundColor: "#1F2323",
                    borderColor: "#606364",
                  }}
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  value={editedExercise.reps || ""}
                  onChange={e =>
                    setEditedExercise({
                      ...editedExercise,
                      reps: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  min={1}
                  max={999}
                  className="w-full p-2 rounded border text-white text-xs"
                  style={{
                    backgroundColor: "#1F2323",
                    borderColor: "#606364",
                  }}
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={editedExercise.tempo}
                  onChange={e =>
                    setEditedExercise({
                      ...editedExercise,
                      tempo: e.target.value,
                    })
                  }
                  className="w-full p-2 rounded border text-white text-xs"
                  style={{
                    backgroundColor: "#1F2323",
                    borderColor: "#606364",
                  }}
                  placeholder="e.g., 30 seconds"
                />
              </div>
            </div>

            {/* Coach Instructions */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-300">
                Coach Instructions
              </div>
              <div>
                <input
                  type="text"
                  value={editedExercise.coachInstructions.whatToDo}
                  onChange={e =>
                    setEditedExercise({
                      ...editedExercise,
                      coachInstructions: {
                        ...editedExercise.coachInstructions,
                        whatToDo: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2 rounded border text-white text-xs"
                  style={{
                    backgroundColor: "#1F2323",
                    borderColor: "#606364",
                  }}
                  placeholder="What to do (optional)"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={editedExercise.coachInstructions.howToDoIt}
                  onChange={e =>
                    setEditedExercise({
                      ...editedExercise,
                      coachInstructions: {
                        ...editedExercise.coachInstructions,
                        howToDoIt: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2 rounded border text-white text-xs"
                  style={{
                    backgroundColor: "#1F2323",
                    borderColor: "#606364",
                  }}
                  placeholder="How to do it (optional)"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={editedExercise.coachInstructions.equipment}
                  onChange={e =>
                    setEditedExercise({
                      ...editedExercise,
                      coachInstructions: {
                        ...editedExercise.coachInstructions,
                        equipment: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2 rounded border text-white text-xs"
                  style={{
                    backgroundColor: "#1F2323",
                    borderColor: "#606364",
                  }}
                  placeholder="Equipment (optional)"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 px-3 py-1 rounded text-xs font-medium transition-all duration-200"
                style={{
                  backgroundColor: "#10B981",
                  color: "#FFFFFF",
                }}
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 px-3 py-1 rounded text-xs font-medium transition-all duration-200 border"
                style={{
                  backgroundColor: "transparent",
                  borderColor: "#606364",
                  color: "#FFFFFF",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h5 className="text-sm font-medium text-white">
                  {exercise.title}
                </h5>
                {exercise.description && (
                  <p className="text-xs text-gray-400 mt-1">
                    {exercise.description}
                  </p>
                )}
              </div>
              <div className="relative">
                <MoreMenu
                  items={[
                    {
                      ...menuItems.edit,
                      onClick: () => {
                        console.log(
                          "Edit button clicked for exercise:",
                          exercise.title
                        );
                        setIsEditing(true);
                      },
                    },
                    {
                      ...menuItems.linkSuperset,
                      onClick: handleLinkSuperset,
                      disabled: !!exercise.supersetWithId,
                    },
                    {
                      ...menuItems.unlinkSuperset,
                      onClick: handleUnlinkSuperset,
                      disabled: !exercise.supersetWithId,
                    },
                    {
                      ...menuItems.delete,
                      onClick: onDelete,
                    },
                  ]}
                />
              </div>
            </div>

            {/* Exercise Details */}
            <div className="flex items-center gap-4 text-xs text-gray-400">
              {exercise.duration && <span>Duration: {exercise.duration}</span>}
              {exercise.notes && <span>Notes: {exercise.notes}</span>}
            </div>

            {/* Sets, Reps, Duration Display */}
            {(exercise.sets || exercise.reps || exercise.tempo) && (
              <div className="flex items-center gap-3 text-xs text-gray-400">
                {exercise.sets && <span>Sets: {exercise.sets}</span>}
                {exercise.reps && <span>Reps: {exercise.reps}</span>}
                {exercise.tempo && <span>Duration: {exercise.tempo}</span>}
              </div>
            )}

            {/* Superset Indicator */}
            {exercise.supersetWithId && (
              <div className="flex items-center gap-2 text-xs">
                <Link className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Superset</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
