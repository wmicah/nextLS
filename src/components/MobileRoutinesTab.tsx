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
import { COLORS } from "@/lib/colors";

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
          <Target className="h-16 w-16 mx-auto mb-4 opacity-50" style={{ color: COLORS.TEXT_MUTED }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
            {searchTerm ? "No routines found" : "No routines yet"}
          </h3>
          <p className="text-sm mb-6" style={{ color: COLORS.TEXT_SECONDARY }}>
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
              className="rounded-lg border transition-colors cursor-pointer"
              style={{
                backgroundColor: "#1C2021",
                borderColor: COLORS.BORDER_SUBTLE,
              }}
              onMouseEnter={(e) => {
                if (window.matchMedia("(hover: hover)").matches) {
                  e.currentTarget.style.backgroundColor = "#2A2F2F";
                  e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                }
              }}
              onMouseLeave={(e) => {
                if (window.matchMedia("(hover: hover)").matches) {
                  e.currentTarget.style.backgroundColor = "#1C2021";
                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                }
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.backgroundColor = "#1C2021";
                e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
              }}
              onClick={() => onViewRoutine(routine)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold truncate" style={{ color: COLORS.TEXT_PRIMARY }}>
                      {routine.name}
                    </CardTitle>
                    <p className="text-sm mt-1 line-clamp-2" style={{ color: COLORS.TEXT_SECONDARY }}>
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
                        className="p-2 transition-colors"
                        style={{ color: COLORS.TEXT_MUTED }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                          e.currentTarget.style.backgroundColor = "#2A2F2F";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = COLORS.TEXT_MUTED;
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent style={{ backgroundColor: "#1C2021", borderColor: COLORS.BORDER_SUBTLE }}>
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation();
                          onViewRoutine(routine);
                        }}
                        style={{ color: COLORS.TEXT_PRIMARY }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#2A2F2F";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation();
                          onEditRoutine(routine);
                        }}
                        style={{ color: COLORS.TEXT_PRIMARY }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#2A2F2F";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation();
                          onAssignRoutine(routine);
                        }}
                        style={{ color: COLORS.TEXT_PRIMARY }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#2A2F2F";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Assign
                      </DropdownMenuItem>
                      <DropdownMenuSeparator style={{ backgroundColor: COLORS.BORDER_SUBTLE }} />
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation();
                          onDeleteRoutine(routine);
                        }}
                        style={{ color: COLORS.RED_ALERT }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#2A2F2F";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
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
                    className="text-xs px-2 py-1 text-white"
                    style={{ backgroundColor: COLORS.GOLDEN_DARK }}
                  >
                    {routine.exercises.length} exercise
                    {routine.exercises.length !== 1 ? "s" : ""}
                  </Badge>
                  <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
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
                          <span style={{ color: COLORS.TEXT_MUTED }}>•</span>
                        )}
                      </div>
                    ))}
                    {routine.exercises.length > 3 && (
                      <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
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
