"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  console.log("=== MODAL RECEIVED DATA ===");
  console.log("initialData:", initialData);
  console.log("exercises[0]:", initialData?.exercises?.[0]);
  console.log("exercises[1]:", initialData?.exercises?.[1]);
  console.log("supersetDescription:", initialData?.supersetDescription);

  const [exercise1, setExercise1] = useState<Exercise>(
    initialData?.exercises?.[0] || {
      id: "1",
      title: "Exercise 1",
      sets: 3,
      reps: 10,
      description: "",
    }
  );
  const [exercise2, setExercise2] = useState<Exercise>(
    initialData?.exercises?.[1] || {
      id: "2",
      title: "Exercise 2",
      sets: 3,
      reps: 10,
      description: "",
    }
  );
  const [supersetDescription, setSupersetDescription] = useState(
    initialData?.supersetDescription || ""
  );

  // Update state when initialData changes
  React.useEffect(() => {
    if (initialData?.exercises?.[0]) {
      setExercise1(initialData.exercises[0]);
    }
    if (initialData?.exercises?.[1]) {
      setExercise2(initialData.exercises[1]);
    }
    if (initialData?.supersetDescription !== undefined) {
      setSupersetDescription(initialData.supersetDescription);
    }
  }, [initialData]);

  const updateExercise1 = (field: keyof Exercise, value: any) => {
    setExercise1({ ...exercise1, [field]: value });
  };

  const updateExercise2 = (field: keyof Exercise, value: any) => {
    setExercise2({ ...exercise2, [field]: value });
  };

  const handleSave = () => {
    onSave({
      exercises: [
        {
          ...exercise1,
          description: exercise1.description?.trim() || undefined,
        },
        {
          ...exercise2,
          description: exercise2.description?.trim() || undefined,
        },
      ],
      supersetDescription: supersetDescription.trim() || undefined,
    });
    onClose();
  };

  const handleCancel = () => {
    setExercise1(
      initialData?.exercises?.[0] || {
        id: "1",
        title: "Exercise 1",
        sets: 3,
        reps: 10,
        description: "",
      }
    );
    setExercise2(
      initialData?.exercises?.[1] || {
        id: "2",
        title: "Exercise 2",
        sets: 3,
        reps: 10,
        description: "",
      }
    );
    setSupersetDescription(initialData?.supersetDescription || "");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-600 w-full max-w-2xl max-h-[85vh] flex flex-col z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-white">
            {supersetName} - Exercise Details
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Superset Description */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-300">
              Superset Description
            </Label>
            <Textarea
              placeholder="Brief description of this superset..."
              value={supersetDescription}
              onChange={e => setSupersetDescription(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 min-h-[60px]"
              rows={2}
            />
          </div>

          {/* Exercise 1 */}
          <div className="bg-gray-700/50 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-medium text-white">Exercise 1</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">Sets</Label>
                <Input
                  type="number"
                  value={exercise1.sets || ""}
                  onChange={e =>
                    updateExercise1("sets", parseInt(e.target.value) || 0)
                  }
                  className="bg-gray-600 border-gray-500 text-white h-8"
                  min="1"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">Reps</Label>
                <Input
                  type="number"
                  value={exercise1.reps || ""}
                  onChange={e =>
                    updateExercise1("reps", parseInt(e.target.value) || 0)
                  }
                  className="bg-gray-600 border-gray-500 text-white h-8"
                  min="1"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Description</Label>
              <Textarea
                placeholder="Exercise instructions, form cues, or modifications..."
                value={exercise1.description || ""}
                onChange={e => updateExercise1("description", e.target.value)}
                className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 min-h-[60px]"
                rows={2}
              />
            </div>
          </div>

          {/* Exercise 2 */}
          <div className="bg-gray-700/50 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-medium text-white">Exercise 2</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">Sets</Label>
                <Input
                  type="number"
                  value={exercise2.sets || ""}
                  onChange={e =>
                    updateExercise2("sets", parseInt(e.target.value) || 0)
                  }
                  className="bg-gray-600 border-gray-500 text-white h-8"
                  min="1"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">Reps</Label>
                <Input
                  type="number"
                  value={exercise2.reps || ""}
                  onChange={e =>
                    updateExercise2("reps", parseInt(e.target.value) || 0)
                  }
                  className="bg-gray-600 border-gray-500 text-white h-8"
                  min="1"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Description</Label>
              <Textarea
                placeholder="Exercise instructions, form cues, or modifications..."
                value={exercise2.description || ""}
                onChange={e => updateExercise2("description", e.target.value)}
                className="bg-gray-600 border-gray-500 text-white placeholder-gray-400 min-h-[60px]"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Save Exercises
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
