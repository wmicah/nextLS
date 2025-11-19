"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Dumbbell,
} from "lucide-react";

interface CoachInstructions {
  whatToDo: string;
  howToDoIt: string;
  keyPoints: string[];
  commonMistakes: string[];
  equipment?: string;
}

interface CoachInstructionsDisplayProps {
  instructions: CoachInstructions;
  className?: string;
  compact?: boolean;
}

export default function CoachInstructionsDisplay({
  instructions,
  className = "",
  compact = false,
}: CoachInstructionsDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);

  if (!instructions) return null;

  return (
    <Card className={`bg-[#353A3A] border-[#606364] ${className}`}>
      <CardHeader
        className="pb-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-400" />
          Coach Instructions
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 ml-auto" />
          ) : (
            <ChevronDown className="h-4 w-4 ml-auto" />
          )}
        </CardTitle>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* What to Do */}
          {instructions.whatToDo && (
            <div>
              <h4 className="text-white font-medium mb-2">What to Do</h4>
              <p className="text-[#C3BCC2] text-sm">{instructions.whatToDo}</p>
            </div>
          )}

          {/* How to Do It */}
          {instructions.howToDoIt && (
            <div>
              <h4 className="text-white font-medium mb-2">How to Do It</h4>
              <p className="text-[#C3BCC2] text-sm">{instructions.howToDoIt}</p>
            </div>
          )}

          {/* Key Points */}
          {instructions.keyPoints && instructions.keyPoints.length > 0 && (
            <div>
              <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-400" />
                Key Points
              </h4>
              <div className="space-y-2">
                {instructions.keyPoints.map((point, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2 bg-[#2A3133] rounded-lg"
                  >
                    <Badge
                      variant="secondary"
                      className="bg-yellow-400/20 text-yellow-300 mt-0.5"
                    >
                      {index + 1}
                    </Badge>
                    <span className="text-[#C3BCC2] text-sm">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Common Mistakes */}
          {instructions.commonMistakes &&
            instructions.commonMistakes.length > 0 && (
              <div>
                <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  Common Mistakes to Avoid
                </h4>
                <div className="space-y-2">
                  {instructions.commonMistakes.map((mistake, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-2 bg-[#2A3133] rounded-lg"
                    >
                      <Badge
                        variant="destructive"
                        className="bg-red-400/20 text-red-300 mt-0.5"
                      >
                        {index + 1}
                      </Badge>
                      <span className="text-[#C3BCC2] text-sm">{mistake}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Equipment */}
          {instructions.equipment && (
            <div>
              <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-blue-400" />
                Equipment
              </h4>
              <p className="text-[#C3BCC2] text-sm">{instructions.equipment}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
