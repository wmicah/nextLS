"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Lightbulb, AlertTriangle, Dumbbell } from "lucide-react";

interface CoachInstructions {
  whatToDo: string;
  howToDoIt: string;
  keyPoints: string[];
  commonMistakes: string[];
  equipment?: string;
}

interface CoachInstructionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (instructions: CoachInstructions) => void;
  initialInstructions?: CoachInstructions;
  exerciseTitle: string;
}

export default function CoachInstructionsDialog({
  isOpen,
  onClose,
  onSubmit,
  initialInstructions,
  exerciseTitle,
}: CoachInstructionsDialogProps) {
  const [instructions, setInstructions] = useState<CoachInstructions>({
    whatToDo: "",
    howToDoIt: "",
    keyPoints: [],
    commonMistakes: [],
    equipment: "",
  });

  // Update instructions when initialInstructions changes
  useEffect(() => {
    if (initialInstructions) {
      setInstructions(initialInstructions);
    }
  }, [initialInstructions]);

  const [newKeyPoint, setNewKeyPoint] = useState("");
  const [newMistake, setNewMistake] = useState("");

  const addKeyPoint = () => {
    if (newKeyPoint.trim()) {
      setInstructions(prev => ({
        ...prev,
        keyPoints: [...prev.keyPoints, newKeyPoint.trim()],
      }));
      setNewKeyPoint("");
    }
  };

  const removeKeyPoint = (index: number) => {
    setInstructions(prev => ({
      ...prev,
      keyPoints: prev.keyPoints.filter((_, i) => i !== index),
    }));
  };

  const addMistake = () => {
    if (newMistake.trim()) {
      setInstructions(prev => ({
        ...prev,
        commonMistakes: [...prev.commonMistakes, newMistake.trim()],
      }));
      setNewMistake("");
    }
  };

  const removeMistake = (index: number) => {
    setInstructions(prev => ({
      ...prev,
      commonMistakes: prev.commonMistakes.filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    onSubmit(instructions);
    onClose();
  };

  const handleQuickFill = () => {
    // Pre-fill with common coaching template
    setInstructions(prev => ({
      ...prev,
      whatToDo: `Perform ${exerciseTitle} with proper form and control`,
      howToDoIt:
        "Focus on controlled movement, maintain proper posture throughout",
      keyPoints: [
        "Keep core engaged",
        "Maintain proper breathing",
        "Control the movement",
      ],
      commonMistakes: [
        "Rushing the movement",
        "Poor posture",
        "Not engaging core",
      ],
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="bg-[#2A3133]/95 border-[#606364] text-[#C3BCC2] max-w-2xl max-h-[80vh] overflow-y-auto backdrop-blur-md shadow-2xl"
        style={{ zIndex: 300 }}
        onOpenAutoFocus={e => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-white text-xl flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-400" />
            Coach Instructions for "{exerciseTitle}"
          </DialogTitle>
          <DialogDescription className="text-[#ABA4AA]">
            Provide detailed guidance to help your client understand and perform
            this exercise correctly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* What to Do */}
          <Card className="bg-[#353A3A] border-[#606364]">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">What to Do</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={instructions.whatToDo}
                onChange={e =>
                  setInstructions(prev => ({
                    ...prev,
                    whatToDo: e.target.value,
                  }))
                }
                placeholder="Briefly describe what the client should accomplish with this exercise..."
                className="bg-[#2A3133] border-[#606364] text-[#C3BCC2] placeholder-[#ABA4AA]"
                rows={3}
              />
            </CardContent>
          </Card>

          {/* How to Do It */}
          <Card className="bg-[#353A3A] border-[#606364]">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">How to Do It</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={instructions.howToDoIt}
                onChange={e =>
                  setInstructions(prev => ({
                    ...prev,
                    howToDoIt: e.target.value,
                  }))
                }
                placeholder="Provide step-by-step instructions on how to perform the exercise..."
                className="bg-[#2A3133] border-[#606364] text-[#C3BCC2] placeholder-[#ABA4AA]"
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Key Points */}
          <Card className="bg-[#353A3A] border-[#606364]">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-400" />
                Key Coaching Points
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newKeyPoint}
                  onChange={e => setNewKeyPoint(e.target.value)}
                  placeholder="Add a key coaching point..."
                  className="bg-[#2A3133] border-[#606364] text-[#C3BCC2] placeholder-[#ABA4AA]"
                  onKeyPress={e =>
                    e.key === "Enter" && (e.preventDefault(), addKeyPoint())
                  }
                />
                <Button
                  type="button"
                  onClick={addKeyPoint}
                  size="sm"
                  className="bg-[#4A5A70] hover:bg-[#606364] text-white"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {instructions.keyPoints.map((point, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-[#2A3133] rounded-lg border border-[#606364]"
                  >
                    <Badge
                      variant="secondary"
                      className="bg-yellow-400/20 text-yellow-300"
                    >
                      {index + 1}
                    </Badge>
                    <span className="flex-1 text-[#C3BCC2]">{point}</span>
                    <Button
                      type="button"
                      onClick={() => removeKeyPoint(index)}
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Common Mistakes */}
          <Card className="bg-[#353A3A] border-[#606364]">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                Common Mistakes to Avoid
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newMistake}
                  onChange={e => setNewMistake(e.target.value)}
                  placeholder="Add a common mistake to avoid..."
                  className="bg-[#2A3133] border-[#606364] text-[#C3BCC2] placeholder-[#ABA4AA]"
                  onKeyPress={e =>
                    e.key === "Enter" && (e.preventDefault(), addMistake())
                  }
                />
                <Button
                  type="button"
                  onClick={addMistake}
                  size="sm"
                  className="bg-[#4A5A70] hover:bg-[#606364] text-white"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {instructions.commonMistakes.map((mistake, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-[#2A3133] rounded-lg border border-[#606364]"
                  >
                    <Badge
                      variant="destructive"
                      className="bg-red-400/20 text-red-300"
                    >
                      {index + 1}
                    </Badge>
                    <span className="flex-1 text-[#C3BCC2]">{mistake}</span>
                    <Button
                      type="button"
                      onClick={() => removeMistake(index)}
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Equipment */}
          <Card className="bg-[#353A3A] border-[#606364]">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-blue-400" />
                Equipment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={instructions.equipment || ""}
                onChange={e =>
                  setInstructions(prev => ({
                    ...prev,
                    equipment: e.target.value,
                  }))
                }
                placeholder="Required equipment..."
                className="bg-[#2A3133] border-[#606364] text-[#C3BCC2] placeholder-[#ABA4AA]"
              />
            </CardContent>
          </Card>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleQuickFill}
              className="border-[#606364] text-[#C3BCC2] hover:bg-[#4A5A70]"
            >
              Quick Fill Template
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-[#606364] text-[#C3BCC2] hover:bg-[#4A5A70]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="bg-[#4A5A70] hover:bg-[#606364] text-white"
            >
              Save Instructions
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
