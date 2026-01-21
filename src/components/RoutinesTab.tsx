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
}

interface Routine {
  id: string;
  name: string;
  description: string;
  exercises: RoutineExercise[];
  createdAt: string;
  updatedAt: string;
}

interface RoutinesTabProps {
  routines: Routine[];
  onCreateRoutine: (routine: {
    id?: string;
    name: string;
    description: string;
    exercises: RoutineExercise[];
  }) => void;
  onUpdateRoutine: (routine: {
    id: string;
    name: string;
    description: string;
    exercises: RoutineExercise[];
  }) => void;
  onDeleteRoutine: (routineId: string) => void;
  onViewDetails?: (routine: {
    id: string;
    name: string;
    description: string;
    exercises: RoutineExercise[];
  }) => void;
  onDuplicateRoutine?: (routine: Routine) => void;
  onAssignRoutine?: (routine: Routine) => void;
}

export default function RoutinesTab({
  routines,
  onCreateRoutine,
  onUpdateRoutine,
  onDeleteRoutine,
  onViewDetails,
  onDuplicateRoutine,
  onAssignRoutine,
}: RoutinesTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("updated");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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

  // Calculate stats
  const totalExercises = routines.reduce(
    (acc, routine) => acc + routine.exercises.length,
    0
  );
  const avgExercisesPerRoutine =
    routines.length > 0 ? Math.round(totalExercises / routines.length) : 0;

  const getExerciseIcon = (type: string) => {
    switch (type) {
      case "exercise":
        return <Target className="h-3 w-3" />;
      case "drill":
        return <Play className="h-3 w-3" />;
      case "video":
        return <Play className="h-3 w-3" />;
      case "routine":
        return <Target className="h-3 w-3" />;
      default:
        return <Target className="h-3 w-3" />;
    }
  };

  const getExerciseColor = (type: string) => {
    switch (type) {
      case "exercise":
        return "bg-green-500/20 text-green-300";
      case "drill":
        return "bg-blue-500/20 text-blue-300";
      case "video":
        return "bg-purple-500/20 text-purple-300";
      case "routine":
        return "bg-yellow-500/20 text-yellow-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-3">
      {/* Enhanced Search and Filters - Matching Programs Tab */}
      <div
        className="rounded-lg p-3 mb-4 shadow-lg border"
        style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}
      >
        <div className="flex gap-2 items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5"
              style={{ color: COLORS.TEXT_SECONDARY }}
            />
            <input
              type="text"
              placeholder="Search routines..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-md border text-xs focus:outline-none transition-all duration-300"
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
          </div>

          {/* Filters - Right Side */}
          <div className="flex gap-1.5 items-center flex-shrink-0">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-2 py-1.5 rounded-md border text-xs focus:outline-none transition-all duration-300 whitespace-nowrap"
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
            >
              <option value="updated" style={{ backgroundColor: COLORS.BACKGROUND_DARK, color: COLORS.TEXT_PRIMARY }}>Recently Updated</option>
              <option value="name" style={{ backgroundColor: COLORS.BACKGROUND_DARK, color: COLORS.TEXT_PRIMARY }}>Name (A-Z)</option>
              <option value="exercises" style={{ backgroundColor: COLORS.BACKGROUND_DARK, color: COLORS.TEXT_PRIMARY }}>Most Exercises</option>
              <option value="newest" style={{ backgroundColor: COLORS.BACKGROUND_DARK, color: COLORS.TEXT_PRIMARY }}>Newest First</option>
            </select>

            {/* View Mode Toggle */}
            <div
              className="flex rounded-md border overflow-hidden"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}
            >
              <button
                onClick={() => setViewMode("grid")}
                className={`px-2 py-1.5 transition-all duration-300 flex items-center gap-1 text-xs ${
                  viewMode === "grid" ? "font-medium" : ""
                }`}
                style={{
                  backgroundColor: viewMode === "grid" ? COLORS.GOLDEN_DARK : "transparent",
                  color: viewMode === "grid" ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
                }}
                onMouseEnter={e => {
                  if (viewMode !== "grid") {
                    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                  }
                }}
                onMouseLeave={e => {
                  if (viewMode !== "grid") {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
                title="Grid View"
              >
                <Grid3X3 className="h-3.5 w-3.5" />
                <span>Grid</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-2 py-1.5 transition-all duration-300 flex items-center gap-1 text-xs ${
                  viewMode === "list" ? "font-medium" : ""
                }`}
                style={{
                  backgroundColor: viewMode === "list" ? COLORS.GOLDEN_DARK : "transparent",
                  color: viewMode === "list" ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
                }}
                onMouseEnter={e => {
                  if (viewMode !== "list") {
                    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                  }
                }}
                onMouseLeave={e => {
                  if (viewMode !== "list") {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
                title="List View"
              >
                <List className="h-3.5 w-3.5" />
                <span>List</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Routines Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold" style={{ color: COLORS.TEXT_PRIMARY }}>
              Your Routines
            </h2>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                color: COLORS.TEXT_SECONDARY,
                border: `1px solid ${COLORS.BORDER_SUBTLE}`,
              }}
            >
              {filteredRoutines.length}{" "}
              {filteredRoutines.length === 1 ? "routine" : "routines"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onCreateRoutine({
                  name: "",
                  description: "",
                  exercises: [],
                })
              }
              className="px-2.5 py-1.5 rounded-md transition-all duration-200 text-xs font-medium"
              style={{ backgroundColor: "#F28F3B", color: COLORS.BACKGROUND_DARK }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = "#D67A2F";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "#F28F3B";
              }}
            >
              Create Routine
            </button>
          </div>
        </div>

        {filteredRoutines.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-64 rounded-lg shadow-lg border relative overflow-hidden"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            <div className="relative text-center px-4">
              <div className="mb-4 relative">
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto relative"
                  style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
                >
                  <Target className="h-8 w-8" style={{ color: COLORS.GOLDEN_ACCENT }} />
                </div>
              </div>
              <h3
                className="text-lg font-bold mb-2"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {searchTerm
                  ? "No routines match your search"
                  : "No routines yet"}
              </h3>
              <p
                className="text-center mb-6 max-w-md mx-auto text-xs"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                {searchTerm ? (
                  <>
                    Try adjusting your search or{" "}
                    <button
                      onClick={() => setSearchTerm("")}
                      className="underline transition-colors"
                      style={{ color: COLORS.GOLDEN_ACCENT }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = COLORS.GOLDEN_HOVER;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = COLORS.GOLDEN_ACCENT;
                      }}
                    >
                      clear search
                    </button>
                  </>
                ) : (
                  "Create reusable exercise routines that can be quickly added to programs"
                )}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                {searchTerm && routines.length > 0 ? (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="px-3 py-1.5 rounded-md transition-all duration-200 text-xs font-medium"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_CARD,
                      color: COLORS.TEXT_SECONDARY,
                      border: `1px solid ${COLORS.BORDER_SUBTLE}`,
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
                    Clear Search
                  </button>
                ) : null}
                <button
                  onClick={() =>
                    onCreateRoutine({
                      name: "",
                      description: "",
                      exercises: [],
                    })
                  }
                  className="px-3 py-1.5 rounded-md transition-all duration-200 text-xs font-medium"
                  style={{
                    backgroundColor: "#F28F3B",
                    color: COLORS.BACKGROUND_DARK,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = "#D67A2F";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "#F28F3B";
                  }}
                >
                  Create Routine
                </button>
              </div>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredRoutines.map((routine, index) => (
              <div
                key={routine.id}
                className="rounded-lg shadow-lg border transition-all duration-300 transform hover:-translate-y-1 cursor-pointer relative overflow-hidden group"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.BORDER_SUBTLE,
                  animationDelay: `${index * 100}ms`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                  e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                  e.currentTarget.style.boxShadow = "0 10px 25px rgba(0, 0, 0, 0.3)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div className="relative p-3">
                  {/* Header with title and quick actions */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="mb-1.5">
                        <h3
                          className="text-xs font-bold line-clamp-1"
                          style={{ color: COLORS.TEXT_PRIMARY }}
                        >
                          {routine.name}
                        </h3>
                      </div>
                      <p
                        className="text-[10px] line-clamp-2 mb-2"
                        style={{ color: COLORS.TEXT_SECONDARY }}
                      >
                        {routine.description}
                      </p>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onUpdateRoutine(routine);
                        }}
                        className="px-2 py-1 rounded-md transition-all duration-200 text-[10px] font-medium"
                        style={{
                          backgroundColor: "#F28F3B",
                          color: COLORS.BACKGROUND_DARK,
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = "#D67A2F";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = "#F28F3B";
                        }}
                        title="Edit Routine"
                      >
                        Edit
                      </button>

                      {onDuplicateRoutine && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onDuplicateRoutine(routine);
                          }}
                          className="px-2 py-1 rounded-md transition-all duration-200 text-[10px] font-medium"
                          style={{
                            backgroundColor: "#F28F3B",
                            color: COLORS.BACKGROUND_DARK,
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = "#D67A2F";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = "#F28F3B";
                          }}
                          title="Duplicate Routine"
                        >
                          Duplicate
                        </button>
                      )}

                      {onAssignRoutine && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onAssignRoutine(routine);
                          }}
                          className="px-2 py-1 rounded-md transition-all duration-200 text-[10px] font-medium"
                          style={{
                            backgroundColor: "#F28F3B",
                            color: COLORS.BACKGROUND_DARK,
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = "#D67A2F";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = "#F28F3B";
                          }}
                          title="Assign Routine to Clients"
                        >
                          Assign
                        </button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="px-2 py-1 rounded-md transition-all duration-200 text-[10px] font-medium"
                            style={{
                              backgroundColor: "#F28F3B",
                              color: COLORS.BACKGROUND_DARK,
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = "#D67A2F";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = "#F28F3B";
                            }}
                            onClick={e => e.stopPropagation()}
                          >
                            More
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          style={{
                            backgroundColor: COLORS.BACKGROUND_DARK,
                            borderColor: COLORS.BORDER_SUBTLE,
                            position: "absolute",
                          }}
                        >
                          {onViewDetails && (
                            <DropdownMenuItem
                              onClick={() => onViewDetails(routine)}
                              style={{ color: COLORS.TEXT_PRIMARY }}
                              onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor = "transparent";
                              }}
                            >
                              View Details
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator
                            style={{ backgroundColor: COLORS.BORDER_SUBTLE }}
                          />
                          <DropdownMenuItem
                            onClick={() => onDeleteRoutine(routine.id)}
                            style={{ color: COLORS.RED_ALERT }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = "transparent";
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Exercise Count */}
                  <div className="mb-2">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      {routine.exercises.length}{" "}
                      {routine.exercises.length === 1
                        ? "Exercise"
                        : "Exercises"}
                    </span>
                  </div>

                  {/* Exercise Types Preview */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {Array.from(new Set(routine.exercises.map(ex => ex.type)))
                      .slice(0, 3)
                      .map(type => (
                        <span
                          key={type}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border"
                          style={{
                            backgroundColor: COLORS.BACKGROUND_DARK,
                            color: COLORS.TEXT_SECONDARY,
                            borderColor: COLORS.BORDER_SUBTLE,
                          }}
                        >
                          <span className="capitalize">{type}</span>
                        </span>
                      ))}
                    {Array.from(new Set(routine.exercises.map(ex => ex.type)))
                      .length > 3 && (
                      <span
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border"
                        style={{
                          backgroundColor: COLORS.BACKGROUND_DARK,
                          color: COLORS.TEXT_MUTED,
                          borderColor: COLORS.BORDER_SUBTLE,
                        }}
                      >
                        +
                        {Array.from(
                          new Set(routine.exercises.map(ex => ex.type))
                        ).length - 3}{" "}
                        more
                      </span>
                    )}
                  </div>

                  {/* Included Exercises */}
                  {routine.exercises.length > 0 && (
                    <div className="mb-2">
                      <div
                        className="text-[10px] font-medium mb-1.5"
                        style={{ color: COLORS.TEXT_SECONDARY }}
                      >
                        Included Exercises:
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {routine.exercises.map((exercise, idx) => (
                          <div
                            key={exercise.id}
                            className="flex items-center gap-1.5 text-[10px]"
                            style={{ color: COLORS.TEXT_SECONDARY }}
                          >
                            <div
                              className="w-1 h-1 rounded-full flex-shrink-0"
                              style={{ backgroundColor: "#F28F3B" }}
                            />
                            <span className="truncate">{exercise.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer with date and quick stats */}
                  <div
                    className="flex items-center justify-between pt-2 border-t"
                    style={{ borderColor: COLORS.BORDER_SUBTLE }}
                  >
                    <div
                      className="flex items-center gap-1.5 text-[10px]"
                      style={{ color: COLORS.TEXT_MUTED }}
                    >
                      <Calendar className="h-3 w-3" />
                      <span>Created {formatDate(routine.createdAt)}</span>
                    </div>

                    {/* Quick action indicator */}
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3" style={{ color: COLORS.GOLDEN_ACCENT }} />
                      <span
                        className="text-[10px] font-medium"
                        style={{ color: COLORS.GOLDEN_ACCENT }}
                      >
                        Ready
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredRoutines.map((routine, index) => (
              <div
                key={routine.id}
                className="rounded-lg shadow-sm border transition-all duration-200 cursor-pointer relative overflow-hidden group"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.BORDER_SUBTLE,
                  animationDelay: `${index * 50}ms`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                  e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div className="relative p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="mb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <h3
                            className="font-bold text-sm truncate"
                            style={{ color: COLORS.TEXT_PRIMARY }}
                          >
                            {routine.name}
                          </h3>
                          <span
                            className="text-xs font-semibold"
                            style={{ color: COLORS.TEXT_SECONDARY }}
                          >
                            {routine.exercises.length}{" "}
                            {routine.exercises.length === 1
                              ? "Exercise"
                              : "Exercises"}
                          </span>
                        </div>

                        <p
                          className="text-xs mb-2 line-clamp-1"
                          style={{ color: COLORS.TEXT_SECONDARY }}
                        >
                          {routine.description}
                        </p>

                        <div className="flex items-center gap-4 text-[10px]">
                          <div
                            className="flex items-center gap-1"
                            style={{ color: COLORS.TEXT_MUTED }}
                          >
                            <Calendar className="h-3 w-3" />
                            <span>Created {formatDate(routine.createdAt)}</span>
                          </div>
                          <div
                            className="flex items-center gap-1"
                            style={{ color: COLORS.TEXT_MUTED }}
                          >
                            <Zap className="h-3 w-3" />
                            <span>Ready to use</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onUpdateRoutine(routine);
                      }}
                      className="px-2 py-1 rounded-md transition-all duration-200 text-xs font-medium"
                      style={{
                        backgroundColor: "#F28F3B",
                        color: COLORS.BACKGROUND_DARK,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = "#D67A2F";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = "#F28F3B";
                      }}
                      title="Edit Routine"
                    >
                      Edit
                    </button>

                    {onDuplicateRoutine && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onDuplicateRoutine(routine);
                        }}
                        className="px-2 py-1 rounded-md transition-all duration-200 text-xs font-medium"
                        style={{
                          backgroundColor: "#F28F3B",
                          color: COLORS.BACKGROUND_DARK,
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = "#D67A2F";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = "#F28F3B";
                        }}
                        title="Duplicate Routine"
                      >
                        Duplicate
                      </button>
                    )}

                    {onAssignRoutine && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onAssignRoutine(routine);
                        }}
                        className="px-2 py-1 rounded-md transition-all duration-200 text-xs font-medium"
                        style={{
                          backgroundColor: "#F28F3B",
                          color: COLORS.BACKGROUND_DARK,
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = "#D67A2F";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = "#F28F3B";
                        }}
                        title="Assign Routine to Clients"
                      >
                        Assign
                      </button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="px-2 py-1 rounded-md transition-all duration-200 text-xs font-medium"
                          style={{
                            backgroundColor: "#F28F3B",
                            color: COLORS.BACKGROUND_DARK,
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = "#D67A2F";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = "#F28F3B";
                          }}
                          onClick={e => e.stopPropagation()}
                        >
                          More
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        style={{
                          backgroundColor: COLORS.BACKGROUND_DARK,
                          borderColor: COLORS.BORDER_SUBTLE,
                          position: "absolute",
                        }}
                      >
                        {onViewDetails && (
                          <DropdownMenuItem
                            onClick={() => onViewDetails(routine)}
                            style={{ color: COLORS.TEXT_PRIMARY }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = "transparent";
                            }}
                          >
                            View Details
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator
                          style={{ backgroundColor: COLORS.BORDER_SUBTLE }}
                        />
                        <DropdownMenuItem
                          onClick={() => onDeleteRoutine(routine.id)}
                          style={{ color: COLORS.RED_ALERT }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
