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
  type: "exercise" | "drill" | "video" | "routine";
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
}

export default function RoutinesTab({
  routines,
  onCreateRoutine,
  onUpdateRoutine,
  onDeleteRoutine,
  onViewDetails,
  onDuplicateRoutine,
}: RoutinesTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filter routines based on search term
  const filteredRoutines = routines.filter(
    routine =>
      routine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      routine.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="space-y-6">
      {/* Search and View Controls */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5"
              style={{ color: "#606364" }}
            />
            <input
              type="text"
              placeholder="Search routines..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-300"
              style={{
                backgroundColor: "#353A3A",
                borderColor: "#606364",
                color: "#C3BCC2",
              }}
            />
          </div>

          <div
            className="flex rounded-xl border overflow-hidden"
            style={{ borderColor: "#606364" }}
          >
            <button
              onClick={() => setViewMode("grid")}
              className={`px-4 py-3 transition-all duration-300 flex items-center justify-center gap-2 ${
                viewMode === "grid" ? "font-medium" : ""
              }`}
              style={{
                backgroundColor: viewMode === "grid" ? "#4A5A70" : "#353A3A",
                color: "#C3BCC2",
              }}
            >
              <Grid3X3 className="h-4 w-4" />
              Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-3 transition-all duration-300 flex items-center justify-center gap-2 ${
                viewMode === "list" ? "font-medium" : ""
              }`}
              style={{
                backgroundColor: viewMode === "list" ? "#4A5A70" : "#353A3A",
                color: "#C3BCC2",
              }}
            >
              <List className="h-4 w-4" />
              List
            </button>
          </div>
        </div>
      </div>

      {/* Routines Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold" style={{ color: "#C3BCC2" }}>
              Your Routines
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm" style={{ color: "#ABA4AA" }}>
              {filteredRoutines.length}{" "}
              {filteredRoutines.length === 1 ? "routine" : "routines"} found
            </div>
            <button
              onClick={() =>
                onCreateRoutine({
                  name: "",
                  description: "",
                  exercises: [],
                })
              }
              className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
              style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = "#606364";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "#4A5A70";
              }}
            >
              <Plus className="h-4 w-4" />
              Create Routine
            </button>
          </div>
        </div>

        {filteredRoutines.length === 0 ? (
          <div className="text-center py-16">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: "#353A3A" }}
            >
              <Target className="h-10 w-10" style={{ color: "#606364" }} />
            </div>
            <h3
              className="text-xl font-semibold mb-3"
              style={{ color: "#f0fdf4" }}
            >
              {searchTerm ? "No routines found" : "No routines created yet"}
            </h3>
            <p className="mb-6" style={{ color: "#ABA4AA" }}>
              {searchTerm
                ? "Try adjusting your search terms"
                : "Create your first routine to get started"}
            </p>
            {!searchTerm && (
              <button
                onClick={() =>
                  onCreateRoutine({
                    name: "",
                    description: "",
                    exercises: [],
                  })
                }
                className="flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-medium mx-auto"
                style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "#606364";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "#4A5A70";
                }}
              >
                <Plus className="h-4 w-4" />
                Create Your First Routine
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoutines.map((routine, index) => (
              <div
                key={routine.id}
                className="rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group"
                style={{
                  backgroundColor: "#353A3A",
                  borderColor: "#606364",
                  animationDelay: `${index * 100}ms`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "#3a4040";
                  e.currentTarget.style.borderColor = "#10B981";
                  e.currentTarget.style.boxShadow =
                    "0 20px 40px rgba(16, 185, 129, 0.05)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "#353A3A";
                  e.currentTarget.style.borderColor = "#606364";
                  e.currentTarget.style.boxShadow =
                    "0 4px 20px rgba(0, 0, 0, 0.1)";
                }}
              >
                {/* Gradient overlay */}
                <div
                  className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
                  style={{
                    background:
                      "linear-gradient(135deg, #4A5A70 0%, #606364 50%, #353A3A 100%)",
                  }}
                />

                <div className="relative p-6">
                  {/* Header with title and quick actions */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="mb-2">
                        <h3
                          className="text-lg font-bold line-clamp-1"
                          style={{ color: "#f0fdf4" }}
                        >
                          {routine.name}
                        </h3>
                      </div>
                      <p
                        className="text-sm line-clamp-2 mb-3"
                        style={{ color: "#a7f3d0" }}
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
                        className="p-2 rounded-lg transition-all duration-200 transform hover:scale-110"
                        style={{
                          backgroundColor: "#4A5A70",
                          color: "#f0fdf4",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = "#606364";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = "#4A5A70";
                        }}
                        title="Edit Routine"
                      >
                        <Edit className="h-4 w-4" />
                      </button>

                      {onDuplicateRoutine && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onDuplicateRoutine(routine);
                          }}
                          className="p-2 rounded-lg transition-all duration-200 transform hover:scale-110"
                          style={{
                            backgroundColor: "#10B981",
                            color: "#f0fdf4",
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = "#059669";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = "#10B981";
                          }}
                          title="Duplicate Routine"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-2 rounded-lg transition-all duration-200 transform hover:scale-110"
                            style={{
                              backgroundColor: "#606364",
                              color: "#f0fdf4",
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = "#4A5A70";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = "#606364";
                            }}
                            onClick={e => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          className="rounded-xl border shadow-xl z-50"
                          style={{
                            backgroundColor: "#1f2937",
                            borderColor: "#374151",
                            position: "absolute",
                          }}
                        >
                          {onViewDetails && (
                            <DropdownMenuItem
                              onClick={() => onViewDetails(routine)}
                              className="rounded-lg mx-1 my-1"
                              style={{ color: "#f9fafb" }}
                              onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor =
                                  "#374151";
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor =
                                  "transparent";
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator
                            style={{ backgroundColor: "#374151" }}
                          />
                          <DropdownMenuItem
                            onClick={() => onDeleteRoutine(routine.id)}
                            className="rounded-lg mx-1 my-1"
                            style={{ color: "#fca5a5" }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = "#7f1d1d";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Exercise Count */}
                  <div className="mb-4">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "#f0fdf4" }}
                    >
                      {routine.exercises.length}{" "}
                      {routine.exercises.length === 1
                        ? "Exercise"
                        : "Exercises"}
                    </span>
                  </div>

                  {/* Exercise Types Preview */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {Array.from(new Set(routine.exercises.map(ex => ex.type)))
                      .slice(0, 3)
                      .map(type => (
                        <span
                          key={type}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                          style={{
                            backgroundColor:
                              getExerciseColor(type).split(" ")[0],
                            color: getExerciseColor(type).split(" ")[1],
                          }}
                        >
                          {getExerciseIcon(type)}
                          <span className="capitalize">{type}</span>
                        </span>
                      ))}
                    {Array.from(new Set(routine.exercises.map(ex => ex.type)))
                      .length > 3 && (
                      <span
                        className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium"
                        style={{
                          backgroundColor: "#606364",
                          color: "#f9fafb",
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
                    <div className="mb-4">
                      <div
                        className="text-xs font-medium mb-3"
                        style={{ color: "#a7f3d0" }}
                      >
                        Included Exercises:
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {routine.exercises.map((exercise, idx) => (
                          <div
                            key={exercise.id}
                            className="flex items-center gap-2 text-xs"
                            style={{ color: "#a7f3d0" }}
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: "#10B981" }}
                            />
                            <span className="truncate">{exercise.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer with date and quick stats */}
                  <div
                    className="flex items-center justify-between pt-3 border-t"
                    style={{ borderColor: "#2d4a3e" }}
                  >
                    <div
                      className="flex items-center gap-2 text-xs"
                      style={{ color: "#a7f3d0" }}
                    >
                      <Calendar className="h-3 w-3" />
                      <span>Created {formatDate(routine.createdAt)}</span>
                    </div>

                    {/* Quick action indicator */}
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3" style={{ color: "#fbbf24" }} />
                      <span
                        className="text-xs font-medium"
                        style={{ color: "#fbbf24" }}
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
          <div className="space-y-4">
            {filteredRoutines.map((routine, index) => (
              <div
                key={routine.id}
                className="rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-1 cursor-pointer relative overflow-hidden group"
                style={{
                  backgroundColor: "#353A3A",
                  borderColor: "#606364",
                  animationDelay: `${index * 50}ms`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "#3a4040";
                  e.currentTarget.style.borderColor = "#10B981";
                  e.currentTarget.style.boxShadow =
                    "0 10px 30px rgba(16, 185, 129, 0.05)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "#353A3A";
                  e.currentTarget.style.borderColor = "#606364";
                  e.currentTarget.style.boxShadow =
                    "0 4px 20px rgba(0, 0, 0, 0.1)";
                }}
              >
                {/* Gradient overlay */}
                <div
                  className="absolute inset-0 opacity-3 group-hover:opacity-8 transition-opacity duration-300"
                  style={{
                    background:
                      "linear-gradient(135deg, #4A5A70 0%, #606364 50%, #353A3A 100%)",
                  }}
                />

                <div className="relative p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="mb-3">
                        <div className="flex items-center gap-3 mb-1">
                          <h3
                            className="font-bold text-lg truncate"
                            style={{ color: "#a7f3d0" }}
                          >
                            {routine.name}
                          </h3>
                          <span
                            className="text-sm font-semibold"
                            style={{ color: "#f0fdf4" }}
                          >
                            {routine.exercises.length}{" "}
                            {routine.exercises.length === 1
                              ? "Exercise"
                              : "Exercises"}
                          </span>
                        </div>

                        <p
                          className="text-sm mb-3 line-clamp-1"
                          style={{ color: "#a7f3d0" }}
                        >
                          {routine.description}
                        </p>

                        <div className="flex items-center gap-6 text-xs">
                          <div
                            className="flex items-center gap-1"
                            style={{ color: "#a7f3d0" }}
                          >
                            <Calendar className="h-3 w-3" />
                            <span>Created {formatDate(routine.createdAt)}</span>
                          </div>
                          <div
                            className="flex items-center gap-1"
                            style={{ color: "#a7f3d0" }}
                          >
                            <Zap className="h-3 w-3" />
                            <span>Ready to use</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onUpdateRoutine(routine);
                      }}
                      className="p-2 rounded-lg transition-all duration-200 transform hover:scale-110"
                      style={{
                        backgroundColor: "#4A5A70",
                        color: "#f0fdf4",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = "#606364";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = "#4A5A70";
                      }}
                      title="Edit Routine"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    {onDuplicateRoutine && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onDuplicateRoutine(routine);
                        }}
                        className="p-2 rounded-lg transition-all duration-200 transform hover:scale-110"
                        style={{
                          backgroundColor: "#10B981",
                          color: "#f0fdf4",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = "#059669";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = "#10B981";
                        }}
                        title="Duplicate Routine"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="p-2 rounded-lg transition-all duration-200 transform hover:scale-110"
                          style={{
                            backgroundColor: "#606364",
                            color: "#f0fdf4",
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = "#4A5A70";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = "#606364";
                          }}
                          onClick={e => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="rounded-xl border shadow-xl z-50"
                        style={{
                          backgroundColor: "#1f2937",
                          borderColor: "#374151",
                          position: "absolute",
                        }}
                      >
                        {onViewDetails && (
                          <DropdownMenuItem
                            onClick={() => onViewDetails(routine)}
                            className="rounded-lg mx-1 my-1"
                            style={{ color: "#f9fafb" }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = "#374151";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator
                          style={{ backgroundColor: "#374151" }}
                        />
                        <DropdownMenuItem
                          onClick={() => onDeleteRoutine(routine.id)}
                          className="rounded-lg mx-1 my-1"
                          style={{ color: "#fca5a5" }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = "#7f1d1d";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
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
