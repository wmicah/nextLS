"use client";
import React from "react";

import { useState, useCallback } from "react";
import { trpc } from "@/app/_trpc/client";
import { useDebounce } from "@/lib/hooks/use-debounce";
import {
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  Edit,
  Copy,
  Archive,
  Trash2,
  Eye,
  MoreHorizontal,
  Target,
  Award,
  BookOpen,
  Play,
  AlertCircle,
  Sparkles,
  Video,
  Activity,
} from "lucide-react";
import Sidebar from "./Sidebar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Separator } from "./ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Alert, AlertDescription } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";
import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";
import SeamlessProgramModal from "./SeamlessProgramModal";
import SimpleAssignProgramModal from "./SimpleAssignProgramModal";
import ProgramDetailsModal from "./ProgramDetailsModal";
import SeamlessRoutineModal from "@/components/SeamlessRoutineModal";
import RoutinesTab from "@/components/RoutinesTab";
import VideoLibraryDialog from "@/components/VideoLibraryDialog";
import SimpleAssignRoutineModal from "@/components/SimpleAssignRoutineModal";
import { withMobileDetection } from "@/lib/mobile-detection";
import CategoryDropdown from "./ui/CategoryDropdown";

interface ProgramWeek {
  id: string;
  weekNumber: number;
  title: string;
  description: string | null;
  days: ProgramDay[];
}

interface ProgramDay {
  id: string;
  dayNumber: number;
  title: string;
  description: string | null;
  isRestDay: boolean;
  drills: ProgramDrill[];
}

interface ProgramDrill {
  id: string;
  title: string;
  type: string | null;
  description?: string | null;
  notes?: string | null;
  sets?: number | null;
  reps?: number | null;
  tempo?: string | null;
  duration?: string | null;
  videoUrl?: string | null;
  videoId?: string | null;
  videoTitle?: string | null;
  videoThumbnail?: string | null;
  routineId?: string | null;
  supersetId?: string | null;
  supersetOrder?: number | null;
  supersetDescription?: string | null;
  supersetInstructions?: string | null;
  supersetNotes?: string | null;
  coachInstructions?: {
    whatToDo?: string;
    howToDoIt?: string;
    keyPoints?: string[];
    commonMistakes?: string[];
    easier?: string;
    harder?: string;
    equipment?: string;
    setup?: string;
  };
}

interface ProgramListItem {
  id: string;
  title: string;
  description: string | null;
  level: string;
  duration: number;
  status: string;
  activeClientCount: number;
  totalWeeks: number;
  weeks: ProgramWeek[];
  assignments: any[];
  createdAt: string;
  updatedAt: string;
}

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
}

interface Routine {
  id: string;
  name: string;
  description: string;
  exercises: RoutineExercise[];
  createdAt: string;
  updatedAt: string;
}

// Default program categories
const DEFAULT_PROGRAM_CATEGORIES = [
  "Drive",
  "Whip",
  "Separation",
  "Stability",
  "Extension",
];

function ProgramsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [sortBy, setSortBy] = useState("updated");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedProgram, setSelectedProgram] =
    useState<ProgramListItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [isRoutineDetailsOpen, setIsRoutineDetailsOpen] = useState(false);
  const [isAssignRoutineModalOpen, setIsAssignRoutineModalOpen] =
    useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [isVideoLibraryOpen, setIsVideoLibraryOpen] = useState(false);
  const [selectedVideoFromLibrary, setSelectedVideoFromLibrary] = useState<{
    id: string;
    title: string;
    description?: string;
    duration?: string;
    url?: string;
    thumbnail?: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"programs" | "routines">(
    "programs"
  );

  const debouncedSearch = useDebounce(searchTerm, 300);
  const { toast } = useToast();

  const {
    data: programs = [],
    isLoading,
    error,
  } = trpc.programs.list.useQuery();

  const { data: clients = [] } = trpc.clients.list.useQuery({
    archived: false,
  });

  // Fetch program categories
  const { data: programCategoriesData = [] } =
    trpc.programs.getCategories.useQuery();

  // Fetch routines from database
  const { data: routinesData = [] } = trpc.routines.list.useQuery();

  // Transform database routines to match frontend interface
  const routines: Routine[] = routinesData.map(routine => ({
    id: routine.id,
    name: routine.name,
    description: routine.description || "",
    exercises: routine.exercises.map(exercise => ({
      id: exercise.id,
      title: exercise.title,
      type:
        (exercise.type as "exercise" | "drill" | "video" | "routine") ||
        "exercise",
      notes: exercise.notes || "",
      sets: exercise.sets ?? undefined,
      reps: exercise.reps ?? undefined,
      tempo: exercise.tempo || "",
      duration: exercise.duration || "",
      videoId: exercise.videoId ?? undefined,
      videoTitle: exercise.videoTitle || "",
      videoThumbnail: exercise.videoThumbnail || "",
      videoUrl: exercise.videoUrl || "",
    })),
    createdAt: new Date(routine.createdAt).toISOString(),
    updatedAt: new Date(routine.updatedAt).toISOString(),
  }));

  const utils = trpc.useUtils();

  const createProgram = trpc.programs.create.useMutation({
    onSuccess: () => {
      utils.programs.list.invalidate();
      setIsCreateModalOpen(false);
      toast({
        title: "Program created",
        description: "Your new program has been created successfully.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const deleteProgram = trpc.programs.delete.useMutation({
    onSuccess: () => {
      utils.programs.list.invalidate();
      toast({
        title: "Program deleted",
        description: "The program has been deleted successfully.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Routine mutations
  const createRoutine = trpc.routines.create.useMutation({
    onSuccess: () => {
      utils.routines.list.invalidate();
      toast({
        title: "Routine created",
        description: "Your new routine has been created successfully.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create routine",
        variant: "destructive",
      });
    },
  });

  const updateRoutine = trpc.routines.update.useMutation({
    onSuccess: () => {
      // Invalidate all routine queries
      utils.routines.list.invalidate();
      utils.routines.get.invalidate();
      utils.routines.getRoutineAssignments.invalidate();
      utils.routines.getClientRoutineAssignments.invalidate();
      utils.routines.getRoutineAssignmentsForCalendar.invalidate();
      toast({
        title: "Routine updated",
        description: "Your routine has been updated successfully.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update routine",
        variant: "destructive",
      });
    },
  });

  const deleteRoutine = trpc.routines.delete.useMutation({
    onSuccess: data => {
      utils.routines.list.invalidate();
      utils.programs.list.invalidate(); // Refresh programs to show changes

      if (data.affectedPrograms.length > 0) {
        toast({
          title: "Routine deleted with program updates",
          description: `Routine deleted successfully. ${
            data.replacedDrills
          } exercise(s) in ${
            data.affectedPrograms.length
          } program(s) were replaced with rest days: ${data.affectedPrograms.join(
            ", "
          )}`,
        });
      } else {
        toast({
          title: "Routine deleted",
          description: "The routine has been deleted successfully.",
        });
      }
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete routine",
        variant: "destructive",
      });
    },
  });

  const handleCreateProgram = useCallback(
    (data: any) => {
      createProgram.mutate(data);
    },
    [createProgram]
  );

  const handleDeleteProgram = useCallback(
    (programId: string, programName: string) => {
      if (
        window.confirm(
          `Are you sure you want to delete "${programName}"? This action cannot be undone.`
        )
      ) {
        deleteProgram.mutate({ id: programId });
      }
    },
    [deleteProgram]
  );

  // Routine management functions
  const handleCreateRoutine = (routine: {
    id?: string;
    name: string;
    description: string;
    exercises: RoutineExercise[];
  }) => {
    // For new routines (empty name and description), set selectedRoutine to null
    // This will make the modal show "Create New Routine" instead of "Edit Routine"
    if (
      !routine.name &&
      !routine.description &&
      routine.exercises.length === 0
    ) {
      setSelectedRoutine(null);
    } else {
      // For existing routines (like duplicates), set the routine data
      const routineData: Routine = {
        id: routine.id || "",
        name: routine.name,
        description: routine.description,
        exercises: routine.exercises,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setSelectedRoutine(routineData);
    }
    setIsRoutineModalOpen(true);
    // Ensure details modal is closed
    setIsRoutineDetailsOpen(false);
  };

  const handleUpdateRoutine = (routine: {
    id: string;
    name: string;
    description: string;
    exercises: RoutineExercise[];
  }) => {
    // Find the full routine data from the routines array
    const fullRoutine = routines.find(r => r.id === routine.id);
    if (fullRoutine) {
      setSelectedRoutine(fullRoutine);
      setIsRoutineModalOpen(true);
      // Ensure details modal is closed
      setIsRoutineDetailsOpen(false);
    }
  };

  const handleViewRoutineDetails = (routine: {
    id: string;
    name: string;
    description: string;
    exercises: RoutineExercise[];
  }) => {
    // Find the full routine data from the routines array
    const fullRoutine = routines.find(r => r.id === routine.id);
    if (fullRoutine) {
      setSelectedRoutine(fullRoutine);
      setIsRoutineDetailsOpen(true);
      // Ensure edit modal is closed
      setIsRoutineModalOpen(false);
    }
  };

  // Note: handleRoutineModalSubmit removed - new SeamlessRoutineModal handles submission internally

  const handleDeleteRoutine = (routineId: string) => {
    const routine = routines.find(r => r.id === routineId);
    const routineName = routine?.name || "this routine";

    if (
      window.confirm(
        `Are you sure you want to delete "${routineName}"?\n\n` +
          `This action cannot be undone. If this routine is used in any programs, ` +
          `those exercises will be automatically replaced with rest days.`
      )
    ) {
      deleteRoutine.mutate({ id: routineId });
    }
  };

  const filteredPrograms = (programs || [])
    .filter((program: ProgramListItem) => {
      const matchesSearch =
        program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (program.description &&
          program.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        selectedCategory === "All Categories" ||
        program.level === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.title.localeCompare(b.title);
      } else if (sortBy === "assigned") {
        return b.activeClientCount - a.activeClientCount;
      } else if (sortBy === "newest") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      // Default: updated (most recently updated first)
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  // Calculate stats
  const totalAssignments = programs.reduce(
    (acc, program) => acc + program.activeClientCount,
    0
  );
  const activePrograms = programs.filter(p => p.activeClientCount > 0).length;
  const unassignedPrograms = programs.filter(
    p => p.activeClientCount === 0
  ).length;

  if (isLoading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-64">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: "#4A5A70" }}
          />
        </div>
      </Sidebar>
    );
  }

  if (error) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-400">
            Error loading programs: {error.message}
          </p>
        </div>
      </Sidebar>
    );
  }

  return (
    <>
      <Sidebar>
        <div
          className="min-h-screen p-6"
          style={{ backgroundColor: "#2A3133" }}
        >
          {/* Compact Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1
                className="text-2xl font-bold mb-1"
                style={{ color: "#C3BCC2" }}
              >
                Training Programs
              </h1>
              <p className="text-sm" style={{ color: "#ABA4AA" }}>
                {activeTab === "programs"
                  ? "Create and manage comprehensive training programs for your athletes"
                  : "Build reusable exercise routines to use in your programs"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: "#4A5A70",
                  color: "#C3BCC2",
                }}
              >
                {activeTab === "programs"
                  ? `${programs.length} ${
                      programs.length === 1 ? "Program" : "Programs"
                    }`
                  : `${routines.length} ${
                      routines.length === 1 ? "Routine" : "Routines"
                    }`}
              </span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4 bg-[#1A1D1E] rounded-xl p-3 border border-[#4A5A70]">
              {/* Left: Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("programs")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all duration-200 font-medium ${
                    activeTab === "programs"
                      ? "bg-[#4A5A70] text-white shadow-lg"
                      : "text-gray-400 hover:text-white hover:bg-[#2D3748]"
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  Programs
                </button>
                <button
                  onClick={() => setActiveTab("routines")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all duration-200 font-medium ${
                    activeTab === "routines"
                      ? "bg-[#4A5A70] text-white shadow-lg"
                      : "text-gray-400 hover:text-white hover:bg-[#2D3748]"
                  }`}
                >
                  <Target className="h-4 w-4" />
                  Routines
                </button>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex gap-2">
                {activeTab === "programs" ? (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm"
                    style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = "#606364";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "#4A5A70";
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Create Program
                  </button>
                ) : (
                  <button
                    onClick={() => setIsRoutineModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm"
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
                )}
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "programs" && (
            <>
              {/* Enhanced Search and Filters - Matching LibraryPage */}
              <div
                className="rounded-xl p-4 mb-8 shadow-xl border relative"
                style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
              >
                <div className="flex gap-3 items-center">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                      style={{ color: "#ABA4AA" }}
                    />
                    <input
                      type="text"
                      placeholder="Search programs..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-300 text-sm"
                      style={{
                        backgroundColor: "#606364",
                        borderColor: "#ABA4AA",
                        color: "#C3BCC2",
                      }}
                    />
                  </div>

                  {/* Filters - Right Side */}
                  <div className="flex gap-2 items-center flex-shrink-0">
                    <CategoryDropdown
                      value={selectedCategory}
                      onChange={setSelectedCategory}
                      standardCategories={DEFAULT_PROGRAM_CATEGORIES}
                      customCategories={programCategoriesData.filter(
                        (cat: any) =>
                          !DEFAULT_PROGRAM_CATEGORIES.includes(cat.name)
                      )}
                      style={{
                        backgroundColor: "#606364",
                        borderColor: "#ABA4AA",
                        color: "#C3BCC2",
                      }}
                    />

                    {/* Sort Dropdown */}
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                      className="px-3 py-2.5 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-300 text-sm whitespace-nowrap"
                      style={{
                        backgroundColor: "#606364",
                        borderColor: "#ABA4AA",
                        color: "#C3BCC2",
                      }}
                    >
                      <option value="updated">Recently Updated</option>
                      <option value="name">Name (A-Z)</option>
                      <option value="assigned">Most Assigned</option>
                      <option value="newest">Newest First</option>
                    </select>

                    {/* View Mode Toggle */}
                    <div
                      className="flex rounded-lg border overflow-hidden"
                      style={{ borderColor: "#ABA4AA" }}
                    >
                      <button
                        onClick={() => setViewMode("grid")}
                        className={`p-2 transition-all duration-200 ${
                          viewMode === "grid" ? "" : ""
                        }`}
                        style={{
                          backgroundColor:
                            viewMode === "grid" ? "#4A5A70" : "#606364",
                          color: "#C3BCC2",
                        }}
                        title="Grid View"
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setViewMode("list")}
                        className={`p-2 transition-all duration-200 ${
                          viewMode === "list" ? "" : ""
                        }`}
                        style={{
                          backgroundColor:
                            viewMode === "list" ? "#4A5A70" : "#606364",
                          color: "#C3BCC2",
                        }}
                        title="List View"
                      >
                        <List className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Programs Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <h2
                      className="text-xl font-semibold"
                      style={{ color: "#C3BCC2" }}
                    >
                      Your Programs
                    </h2>
                    <Badge
                      variant="secondary"
                      className="text-sm px-3 py-1"
                      style={{
                        backgroundColor: "#606364",
                        color: "#C3BCC2",
                      }}
                    >
                      {filteredPrograms.length}{" "}
                      {filteredPrograms.length === 1 ? "program" : "programs"}
                    </Badge>
                  </div>
                </div>

                {filteredPrograms.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center h-96 rounded-2xl shadow-xl border relative overflow-hidden"
                    style={{
                      backgroundColor: "#353A3A",
                      borderColor: "#606364",
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-5"
                      style={{
                        background:
                          "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
                      }}
                    />
                    <div className="relative text-center px-4">
                      <div className="mb-6 relative">
                        <div className="absolute inset-0 animate-ping opacity-20">
                          <Target
                            className="h-20 w-20 mx-auto"
                            style={{ color: "#4A5A70" }}
                          />
                        </div>
                        <div
                          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto relative"
                          style={{ backgroundColor: "#4A5A70" }}
                        >
                          <BookOpen
                            className="h-10 w-10"
                            style={{ color: "#C3BCC2" }}
                          />
                        </div>
                      </div>
                      <h3
                        className="text-2xl font-bold mb-3"
                        style={{ color: "#C3BCC2" }}
                      >
                        {searchTerm || selectedCategory !== "All Categories"
                          ? "No Programs Found"
                          : "Start Building Your Programs"}
                      </h3>
                      <p
                        className="text-center mb-8 max-w-md mx-auto"
                        style={{ color: "#ABA4AA" }}
                      >
                        {searchTerm || selectedCategory !== "All Categories" ? (
                          <>
                            No programs match your current filters. Try
                            adjusting your search terms or{" "}
                            <button
                              onClick={() => {
                                setSearchTerm("");
                                setSelectedCategory("All Categories");
                              }}
                              className="underline hover:text-blue-400 transition-colors"
                            >
                              clear all filters
                            </button>{" "}
                            to see all programs.
                          </>
                        ) : (
                          "Create comprehensive training programs for your athletes. Build structured workouts with exercises, drills, and progressions."
                        )}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        {(searchTerm ||
                          selectedCategory !== "All Categories") &&
                        programs.length > 0 ? (
                          <button
                            onClick={() => {
                              setSearchTerm("");
                              setSelectedCategory("All Categories");
                            }}
                            className="px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
                            style={{
                              backgroundColor: "#606364",
                              color: "#C3BCC2",
                            }}
                          >
                            <Filter className="h-5 w-5 inline-block mr-2" />
                            Clear Filters
                          </button>
                        ) : null}
                        <button
                          onClick={() => setIsCreateModalOpen(true)}
                          className="px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
                          style={{
                            backgroundColor: "#4A5A70",
                            color: "#C3BCC2",
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = "#606364";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = "#4A5A70";
                          }}
                        >
                          <Plus className="h-5 w-5 inline-block mr-2" />
                          Create Program
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "gap-6",
                      viewMode === "grid"
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                        : "space-y-4"
                    )}
                  >
                    {filteredPrograms.map((program: ProgramListItem) => (
                      <ProgramCard
                        key={program.id}
                        program={program}
                        viewMode={viewMode}
                        onViewDetails={() => {
                          setSelectedProgram(program);
                          setIsDetailsModalOpen(true);
                        }}
                        onEdit={() => {
                          // Handle edit - navigate to edit page
                          window.location.href = `/programs/${program.id}`;
                        }}
                        onAssign={() => {
                          setSelectedProgram(program);
                          setIsAssignModalOpen(true);
                        }}
                        onDelete={() =>
                          handleDeleteProgram(program.id, program.title)
                        }
                        onDuplicate={async () => {
                          // Create a duplicate program with a new name
                          console.log("=== DUPLICATING PROGRAM ===");
                          console.log("Original program:", program);
                          console.log(
                            "Original program drills:",
                            program.weeks[0]?.days[0]?.drills
                          );
                          console.log(
                            "First drill details:",
                            program.weeks[0]?.days[0]?.drills[0]
                          );
                          const duplicatedProgram = {
                            title: `${program.title} (Copy)`,
                            description: program.description || undefined,
                            level: program.level as
                              | "Drive"
                              | "Whip"
                              | "Separation"
                              | "Stability"
                              | "Extension",
                            duration: program.duration,
                            weeks: program.weeks.map(week => ({
                              weekNumber: week.weekNumber,
                              title: week.title,
                              description: week.description || undefined,
                              days: week.days.map(dayData => ({
                                dayNumber: dayData.dayNumber,
                                title: dayData.title,
                                description: dayData.description || undefined,
                                drills: dayData.drills.map(
                                  (drill: any, index) => ({
                                    order: index + 1,
                                    title: drill.title,
                                    type: drill.type || undefined,
                                    description: drill.description || undefined,
                                    duration: drill.duration || undefined,
                                    videoUrl: drill.videoUrl || undefined,
                                    videoId: drill.videoId || undefined,
                                    videoTitle: drill.videoTitle || undefined,
                                    videoThumbnail:
                                      drill.videoThumbnail || undefined,
                                    notes: drill.notes || undefined,
                                    sets: drill.sets || undefined,
                                    reps: drill.reps || undefined,
                                    tempo: drill.tempo || undefined,
                                    routineId: drill.routineId || undefined,
                                    supersetId: drill.supersetId || undefined,
                                    supersetOrder:
                                      drill.supersetOrder || undefined,
                                    supersetDescription:
                                      drill.supersetDescription || undefined,
                                    supersetInstructions:
                                      drill.supersetInstructions || undefined,
                                    supersetNotes:
                                      drill.supersetNotes || undefined,
                                    // Coach Instructions - flatten the nested object
                                    coachInstructionsWhatToDo:
                                      drill.coachInstructions?.whatToDo ||
                                      drill.coachInstructionsWhatToDo ||
                                      undefined,
                                    coachInstructionsHowToDoIt:
                                      drill.coachInstructions?.howToDoIt ||
                                      drill.coachInstructionsHowToDoIt ||
                                      undefined,
                                    coachInstructionsKeyPoints:
                                      drill.coachInstructions?.keyPoints ||
                                      drill.coachInstructionsKeyPoints ||
                                      undefined,
                                    coachInstructionsCommonMistakes:
                                      drill.coachInstructions?.commonMistakes ||
                                      drill.coachInstructionsCommonMistakes ||
                                      undefined,
                                    coachInstructionsEasier:
                                      drill.coachInstructions?.easier ||
                                      drill.coachInstructionsEasier ||
                                      undefined,
                                    coachInstructionsHarder:
                                      drill.coachInstructions?.harder ||
                                      drill.coachInstructionsHarder ||
                                      undefined,
                                    coachInstructionsEquipment:
                                      drill.coachInstructions?.equipment ||
                                      drill.coachInstructionsEquipment ||
                                      undefined,
                                    coachInstructionsSetup:
                                      drill.coachInstructions?.setup ||
                                      drill.coachInstructionsSetup ||
                                      undefined,
                                  })
                                ),
                              })),
                            })),
                          };

                          console.log(
                            "Duplicated program data:",
                            duplicatedProgram
                          );
                          console.log(
                            "Duplicated program drills:",
                            duplicatedProgram.weeks[0]?.days[0]?.drills
                          );

                          try {
                            console.log(
                              "About to call createProgram.mutateAsync"
                            );
                            // Create the program directly without opening modal
                            await createProgram.mutateAsync(duplicatedProgram);
                            console.log(
                              "createProgram.mutateAsync completed successfully"
                            );
                            toast({
                              title: "Program Duplicated",
                              description: `"${duplicatedProgram.title}" has been created successfully.`,
                            });
                          } catch (error) {
                            console.error("Error duplicating program:", error);
                            toast({
                              title: "Error",
                              description:
                                "Failed to duplicate program. Please try again.",
                              variant: "destructive",
                            });
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "routines" && (
            <RoutinesTab
              routines={routines}
              onCreateRoutine={handleCreateRoutine}
              onUpdateRoutine={handleUpdateRoutine}
              onDeleteRoutine={handleDeleteRoutine}
              onViewDetails={handleViewRoutineDetails}
              onDuplicateRoutine={async routine => {
                // Create a duplicate routine with a new name
                const duplicatedRoutine = {
                  name: `${routine.name} (Copy)`,
                  description: routine.description,
                  exercises: routine.exercises,
                };

                try {
                  // Create the routine directly without opening modal
                  await createRoutine.mutateAsync(duplicatedRoutine);
                  toast({
                    title: "Routine Duplicated",
                    description: `"${duplicatedRoutine.name}" has been created successfully.`,
                  });
                } catch (error) {
                  console.error("Error duplicating routine:", error);
                  toast({
                    title: "Error",
                    description:
                      "Failed to duplicate routine. Please try again.",
                    variant: "destructive",
                  });
                }
              }}
              onAssignRoutine={routine => {
                setSelectedRoutine(routine);
                setIsAssignRoutineModalOpen(true);
              }}
            />
          )}

          {/* Modals */}
          <SeamlessProgramModal
            isOpen={isCreateModalOpen}
            onClose={() => {
              console.log(
                "SeamlessProgramModal onClose called - closing modal"
              );
              setIsCreateModalOpen(false);
            }}
            onSubmit={handleCreateProgram}
            onOpenVideoLibrary={() => setIsVideoLibraryOpen(true)}
            selectedVideoFromLibrary={selectedVideoFromLibrary}
            onVideoProcessed={() => setSelectedVideoFromLibrary(null)}
          />

          <SimpleAssignProgramModal
            isOpen={isAssignModalOpen}
            onClose={() => setIsAssignModalOpen(false)}
            clientId={undefined} // No specific client pre-selected
            clientName={undefined}
            programId={selectedProgram?.id} // Pre-select the program being assigned
          />

          <ProgramDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            program={selectedProgram as any}
          />

          <SeamlessRoutineModal
            isOpen={isRoutineModalOpen}
            onClose={() => {
              setIsRoutineModalOpen(false);
              setSelectedRoutine(null);
              setSelectedVideoFromLibrary(null);
            }}
            routine={selectedRoutine}
            onOpenVideoLibrary={() => setIsVideoLibraryOpen(true)}
            selectedVideoFromLibrary={selectedVideoFromLibrary}
            onVideoProcessed={() => setSelectedVideoFromLibrary(null)}
          />

          <SimpleAssignRoutineModal
            isOpen={isAssignRoutineModalOpen}
            onClose={() => {
              setIsAssignRoutineModalOpen(false);
              setSelectedRoutine(null);
            }}
            routineId={selectedRoutine?.id}
            clientId={undefined} // No specific client pre-selected
            clientName={undefined}
            startDate={undefined}
          />

          {/* Routine Details Modal */}
          {selectedRoutine && (
            <div
              className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${
                isRoutineDetailsOpen ? "block" : "hidden"
              }`}
              onClick={() => {
                setIsRoutineDetailsOpen(false);
                setSelectedRoutine(null);
              }}
            >
              <div
                className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedRoutine.name}
                  </h2>
                  <button
                    onClick={() => {
                      setIsRoutineDetailsOpen(false);
                      setSelectedRoutine(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Description
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    {selectedRoutine.description || "No description provided"}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Exercises ({selectedRoutine.exercises.length})
                  </h3>
                  {selectedRoutine.exercises.length > 0 ? (
                    <div className="space-y-2">
                      {selectedRoutine.exercises.map((exercise, index) => (
                        <div
                          key={exercise.id}
                          className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {exercise.title}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                {exercise.type}
                              </p>
                              {exercise.notes && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {exercise.notes}
                                </p>
                              )}
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              #{index + 1}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">
                      No exercises added to this routine yet.
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => {
                      setIsRoutineDetailsOpen(false);
                      setSelectedRoutine(null);
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setIsRoutineDetailsOpen(false);
                      handleUpdateRoutine(selectedRoutine);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Edit Routine
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Sidebar>

      {/* Video Library Dialog - Rendered completely outside Sidebar */}
      <VideoLibraryDialog
        isOpen={isVideoLibraryOpen}
        onClose={() => setIsVideoLibraryOpen(false)}
        onSelectVideo={video => {
          console.log("Video selected:", video);
          // Store the selected video so it can be passed to the modal
          setSelectedVideoFromLibrary(video);
          setIsVideoLibraryOpen(false);
        }}
        editingItem={null}
      />
    </>
  );
}

// Program Card Component
function ProgramCard({
  program,
  viewMode,
  onViewDetails,
  onEdit,
  onAssign,
  onDelete,
  onDuplicate,
}: {
  program: ProgramListItem;
  viewMode: "grid" | "list";
  onViewDetails: () => void;
  onEdit: () => void;
  onAssign: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  if (viewMode === "list") {
    return (
      <div
        className="rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = "#3A4040";
          e.currentTarget.style.borderColor = "#4A5A70";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = "#353A3A";
          e.currentTarget.style.borderColor = "#606364";
        }}
      >
        <div
          className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
          style={{
            background: "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
          }}
        />

        <div className="relative p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <h3
                className="text-base font-bold mb-1 line-clamp-1"
                style={{ color: "#C3BCC2" }}
              >
                {program.title}
              </h3>

              <p
                className="text-sm mb-2 line-clamp-1"
                style={{ color: "#ABA4AA" }}
              >
                {program.description}
              </p>

              <div className="flex items-center gap-4 flex-wrap">
                <div
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: "#4A5A70",
                    color: "#C3BCC2",
                  }}
                >
                  {program.level}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" style={{ color: "#ABA4AA" }} />
                  <span style={{ color: "#ABA4AA" }} className="text-xs">
                    {program.activeClientCount} assigned
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" style={{ color: "#ABA4AA" }} />
                  <span style={{ color: "#ABA4AA" }} className="text-xs">
                    {new Date(program.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onViewDetails}
                className="p-2 rounded-lg transition-all duration-300 transform hover:scale-110"
                style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "#606364";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "#4A5A70";
                }}
              >
                <Eye className="h-4 w-4" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-2 rounded-lg transition-all duration-300 transform hover:scale-110"
                    style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = "#606364";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "#4A5A70";
                    }}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="bg-[#353A3A] border-gray-600"
                  style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
                >
                  <DropdownMenuItem
                    onClick={onEdit}
                    className="text-white hover:bg-[#606364]"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onAssign}
                    className="text-white hover:bg-[#606364]"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Assign
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDuplicate}
                    className="text-white hover:bg-[#606364]"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-600" />
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-red-400 hover:bg-red-400/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group"
      style={{
        backgroundColor: "#353A3A",
        borderColor: "#606364",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = "#3A4040";
        e.currentTarget.style.borderColor = "#4A5A70";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = "#353A3A";
        e.currentTarget.style.borderColor = "#606364";
      }}
    >
      <div className="relative p-6">
        {/* Header with icon and title */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div>
              <h3
                className="text-lg font-bold line-clamp-1"
                style={{ color: "#C3BCC2" }}
              >
                {program.title}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <div
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: "#4A5A70",
                    color: "#C3BCC2",
                  }}
                >
                  {program.level}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" style={{ color: "#ABA4AA" }} />
                  <span style={{ color: "#ABA4AA" }} className="text-xs">
                    {program.activeClientCount} assigned
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1.5 rounded-lg transition-all duration-300 transform hover:scale-110"
                style={{ color: "#ABA4AA" }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = "#C3BCC2";
                  e.currentTarget.style.backgroundColor = "#606364";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = "#ABA4AA";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="bg-[#353A3A] border-gray-600"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <DropdownMenuItem
                onClick={onViewDetails}
                className="text-white hover:bg-[#606364]"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDuplicate}
                className="text-white hover:bg-[#606364]"
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-600" />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-red-400 hover:bg-red-400/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {program.description && (
          <p className="text-sm mb-4 line-clamp-2" style={{ color: "#ABA4AA" }}>
            {program.description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 font-medium text-sm"
            style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "#606364";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "#4A5A70";
            }}
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={onAssign}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 font-medium text-sm"
            style={{
              backgroundColor: "#10B981",
              color: "#000000",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "#34D399";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "#10B981";
            }}
          >
            <Users className="h-4 w-4 text-black" />
            Assign
          </button>
        </div>

        {/* Footer with creation date */}
        <div
          className="flex items-center gap-1 mt-3 pt-3 border-t"
          style={{ borderColor: "#606364" }}
        >
          <Calendar className="h-3 w-3" style={{ color: "#ABA4AA" }} />
          <span style={{ color: "#ABA4AA" }} className="text-xs">
            Created {new Date(program.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// Export the component
export default ProgramsPage;
