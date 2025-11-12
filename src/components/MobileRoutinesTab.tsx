"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Play,
  Target,
  Clock,
  Users,
  Calendar,
  Search,
  Grid3X3,
  List,
  Sparkles,
  Copy,
  Eye,
  Zap,
  Activity,
  Dumbbell,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  routineId?: string;
  supersetId?: string;
  supersetOrder?: number;
  supersetDescription?: string;
  supersetInstructions?: string;
  supersetNotes?: string;
  coachInstructions?: {
    whatToDo: string;
    howToDoIt: string;
    keyPoints: string[];
    commonMistakes: string[];
    equipment?: string;
    setup?: string;
  };
}

interface Routine {
  id: string;
  name: string;
  description: string;
  exercises: RoutineExercise[];
  createdAt: string;
  updatedAt: string;
}

interface MobileRoutinesTabProps {
  routines: Routine[];
  onRoutineClick: (routine: Routine) => void;
  onEditRoutine: (routine: Routine) => void;
  onAssignRoutine: (routine: Routine) => void;
  onDeleteRoutine: (routine: Routine) => void;
  onViewRoutine: (routine: Routine) => void;
  viewMode: "grid" | "list";
  searchTerm: string;
  selectedCategory: string;
  onSearchChange: (term: string) => void;
  onCategoryChange: (category: string) => void;
  onViewModeChange: (mode: "grid" | "list") => void;
}

export default function MobileRoutinesTab({
  routines,
  onRoutineClick,
  onEditRoutine,
  onAssignRoutine,
  onDeleteRoutine,
  onViewRoutine,
  viewMode,
  searchTerm,
  selectedCategory,
  onSearchChange,
  onCategoryChange,
  onViewModeChange,
}: MobileRoutinesTabProps) {
  const [sortBy, setSortBy] = useState("updated");

  // Filter and sort routines
  const filteredRoutines = routines
    .filter(
      routine =>
        routine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        routine.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "exercises") {
        return b.exercises.length - a.exercises.length;
      } else if (sortBy === "newest") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      // Default: updated (most recently updated first)
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const getExerciseIcon = (type: string) => {
    switch (type) {
      case "exercise":
        return <Dumbbell className="h-4 w-4" />;
      case "drill":
        return <Target className="h-4 w-4" />;
      case "video":
        return <Play className="h-4 w-4" />;
      case "routine":
        return <Activity className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getExerciseColor = (type: string) => {
    switch (type) {
      case "exercise":
        return "text-blue-400";
      case "drill":
        return "text-green-400";
      case "video":
        return "text-purple-400";
      case "routine":
        return "text-orange-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Routines List */}
      {filteredRoutines.length === 0 ? (
        <div className="text-center py-12">
          <Target className="h-16 w-16 mx-auto mb-4 text-[#ABA4AA] opacity-50" />
          <h3 className="text-lg font-medium text-[#C3BCC2] mb-2">
            {searchTerm ? "No routines found" : "No routines yet"}
          </h3>
          <p className="text-sm text-[#ABA4AA] mb-6">
            {searchTerm
              ? "Try adjusting your search terms"
              : "Create your first routine to get started"}
          </p>
        </div>
      ) : (
        <div
          className={cn(
            viewMode === "grid" ? "grid grid-cols-1 gap-4" : "space-y-4"
          )}
        >
          {filteredRoutines.map(routine => (
            <Card
              key={routine.id}
              className="bg-[#353A3A] border-[#606364] hover:bg-[#2A3133] transition-colors cursor-pointer"
              onClick={() => onViewRoutine(routine)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold text-[#C3BCC2] truncate">
                      {routine.name}
                    </CardTitle>
                    <p className="text-sm text-[#ABA4AA] mt-1 line-clamp-2">
                      {routine.description}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={e => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#ABA4AA] hover:text-[#C3BCC2] hover:bg-[#2A3133] p-2"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#353A3A] border-[#606364]">
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation();
                          onViewRoutine(routine);
                        }}
                        className="text-[#C3BCC2] hover:bg-[#2A3133]"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation();
                          onEditRoutine(routine);
                        }}
                        className="text-[#C3BCC2] hover:bg-[#2A3133]"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation();
                          onAssignRoutine(routine);
                        }}
                        className="text-[#C3BCC2] hover:bg-[#2A3133]"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Assign
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-[#606364]" />
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation();
                          onDeleteRoutine(routine);
                        }}
                        className="text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Exercise Count */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge
                    variant="secondary"
                    className="text-xs px-2 py-1 bg-[#4A5A70] text-[#ABA4AA]"
                  >
                    {routine.exercises.length} exercise
                    {routine.exercises.length !== 1 ? "s" : ""}
                  </Badge>
                  <span className="text-xs text-[#606364]">
                    Updated {new Date(routine.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Exercise Types Preview */}
                {routine.exercises.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {routine.exercises.slice(0, 3).map((exercise, index) => (
                      <div
                        key={exercise.id}
                        className="flex items-center gap-1 text-xs"
                      >
                        <div
                          className={cn(
                            "flex items-center gap-1",
                            getExerciseColor(exercise.type)
                          )}
                        >
                          {getExerciseIcon(exercise.type)}
                          <span className="truncate max-w-[80px]">
                            {exercise.title}
                          </span>
                        </div>
                        {index < Math.min(routine.exercises.length, 3) - 1 && (
                          <span className="text-[#606364]">•</span>
                        )}
                      </div>
                    ))}
                    {routine.exercises.length > 3 && (
                      <span className="text-xs text-[#606364]">
                        +{routine.exercises.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
