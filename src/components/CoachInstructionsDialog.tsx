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
import { COLORS } from "@/lib/colors";

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
        className="max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl [&>button]:hidden"
        style={{
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE,
          zIndex: 300,
        }}
        onOpenAutoFocus={e => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2" style={{ color: COLORS.TEXT_PRIMARY }}>
            <Lightbulb className="h-4 w-4" style={{ color: COLORS.GOLDEN_ACCENT }} />
            Coach Instructions for "{exerciseTitle}"
          </DialogTitle>
          <DialogDescription className="text-xs mt-0.5" style={{ color: COLORS.TEXT_SECONDARY }}>
            Provide detailed guidance to help your client understand and perform
            this exercise correctly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* What to Do */}
          <Card className="border" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>What to Do</CardTitle>
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
                className="text-sm"
                style={{
                  backgroundColor: COLORS.BACKGROUND_DARK,
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                }}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* How to Do It */}
          <Card className="border" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>How to Do It</CardTitle>
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
                className="text-sm"
                style={{
                  backgroundColor: COLORS.BACKGROUND_DARK,
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                }}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Key Points */}
          <Card className="border" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2" style={{ color: COLORS.TEXT_PRIMARY }}>
                <Lightbulb className="h-3.5 w-3.5" style={{ color: COLORS.GOLDEN_ACCENT }} />
                Key Coaching Points
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="flex gap-2">
                <Input
                  value={newKeyPoint}
                  onChange={e => setNewKeyPoint(e.target.value)}
                  placeholder="Add a key coaching point..."
                  className="text-sm h-9"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_DARK,
                    borderColor: COLORS.BORDER_SUBTLE,
                    color: COLORS.TEXT_PRIMARY,
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                  }}
                  onKeyPress={e =>
                    e.key === "Enter" && (e.preventDefault(), addKeyPoint())
                  }
                />
                <Button
                  type="button"
                  onClick={addKeyPoint}
                  size="sm"
                  className="h-9 w-9 p-0"
                  style={{
                    backgroundColor: COLORS.GOLDEN_DARK,
                    color: COLORS.TEXT_PRIMARY,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="space-y-1.5">
                {instructions.keyPoints.map((point, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 rounded-md border"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_DARK,
                      borderColor: COLORS.BORDER_SUBTLE,
                    }}
                  >
                    <Badge
                      variant="secondary"
                      className="text-xs px-1.5 py-0.5"
                      style={{
                        backgroundColor: "rgba(229, 178, 50, 0.2)",
                        color: COLORS.GOLDEN_ACCENT,
                      }}
                    >
                      {index + 1}
                    </Badge>
                    <span className="flex-1 text-xs" style={{ color: COLORS.TEXT_PRIMARY }}>{point}</span>
                    <Button
                      type="button"
                      onClick={() => removeKeyPoint(index)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      style={{ color: COLORS.RED_ALERT }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = "rgba(217, 83, 79, 0.1)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Common Mistakes */}
          <Card className="border" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2" style={{ color: COLORS.TEXT_PRIMARY }}>
                <AlertTriangle className="h-3.5 w-3.5" style={{ color: COLORS.RED_ALERT }} />
                Common Mistakes to Avoid
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="flex gap-2">
                <Input
                  value={newMistake}
                  onChange={e => setNewMistake(e.target.value)}
                  placeholder="Add a common mistake to avoid..."
                  className="text-sm h-9"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_DARK,
                    borderColor: COLORS.BORDER_SUBTLE,
                    color: COLORS.TEXT_PRIMARY,
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                  }}
                  onKeyPress={e =>
                    e.key === "Enter" && (e.preventDefault(), addMistake())
                  }
                />
                <Button
                  type="button"
                  onClick={addMistake}
                  size="sm"
                  className="h-9 w-9 p-0"
                  style={{
                    backgroundColor: COLORS.GOLDEN_DARK,
                    color: COLORS.TEXT_PRIMARY,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="space-y-1.5">
                {instructions.commonMistakes.map((mistake, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 rounded-md border"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_DARK,
                      borderColor: COLORS.BORDER_SUBTLE,
                    }}
                  >
                    <Badge
                      variant="destructive"
                      className="text-xs px-1.5 py-0.5"
                      style={{
                        backgroundColor: "rgba(217, 83, 79, 0.2)",
                        color: COLORS.RED_ALERT,
                      }}
                    >
                      {index + 1}
                    </Badge>
                    <span className="flex-1 text-xs" style={{ color: COLORS.TEXT_PRIMARY }}>{mistake}</span>
                    <Button
                      type="button"
                      onClick={() => removeMistake(index)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      style={{ color: COLORS.RED_ALERT }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = "rgba(217, 83, 79, 0.1)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Equipment */}
          <Card className="border" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2" style={{ color: COLORS.TEXT_PRIMARY }}>
                <Dumbbell className="h-3.5 w-3.5" style={{ color: COLORS.GOLDEN_ACCENT }} />
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
                className="text-sm h-9"
                style={{
                  backgroundColor: COLORS.BACKGROUND_DARK,
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                }}
              />
            </CardContent>
          </Card>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleQuickFill}
              className="text-xs h-8 px-3"
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
              Quick Fill Template
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs h-8 px-3"
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
              type="button"
              onClick={handleSave}
              className="text-xs h-8 px-3"
              style={{
                backgroundColor: COLORS.GOLDEN_DARK,
                color: COLORS.TEXT_PRIMARY,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
              }}
            >
              Save Instructions
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
