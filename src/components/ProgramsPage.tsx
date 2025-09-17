"use client";

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
import AssignProgramModal from "./AssignProgramModal";
import ProgramDetailsModal from "./ProgramDetailsModal";
import SeamlessRoutineModal from "@/components/SeamlessRoutineModal";
import RoutinesTab from "@/components/RoutinesTab";
import VideoLibraryDialog from "@/components/VideoLibraryDialog";
import { withMobileDetection } from "@/lib/mobile-detection";
import MobileProgramsPage from "./MobileProgramsPage";

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
  notes?: string | null;
  sets?: number | null;
  reps?: number | null;
  tempo?: string | null;
  duration?: string | null;
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

function ProgramsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedProgram, setSelectedProgram] =
    useState<ProgramListItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [isRoutineDetailsOpen, setIsRoutineDetailsOpen] = useState(false);
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
      utils.routines.list.invalidate();
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

  const filteredPrograms = (programs || []).filter(
    (program: ProgramListItem) => {
      const matchesSearch =
        program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (program.description &&
          program.description.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesSearch;
    }
  );

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
          {/* Hero Header */}
          <div className="mb-8">
            <div className="rounded-2xl border relative overflow-hidden group">
              <div
                className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(135deg, #4A5A70 0%, #606364 50%, #353A3A 100%)",
                }}
              />
              <div className="relative p-8 bg-gradient-to-r from-transparent via-black/20 to-black/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h1
                        className="text-4xl font-bold mb-2"
                        style={{ color: "#C3BCC2" }}
                      >
                        Training Programs
                      </h1>
                      <p
                        className="flex items-center gap-2 text-lg"
                        style={{ color: "#ABA4AA" }}
                      >
                        <Sparkles className="h-5 w-5 text-yellow-400" />
                        {programs.length > 0
                          ? `Managing ${programs.length} ${
                              programs.length === 1 ? "program" : "programs"
                            } for your athletes`
                          : "Create comprehensive training programs for your clients"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-2xl font-bold"
                      style={{ color: "#C3BCC2" }}
                    >
                      {programs.length}
                    </div>
                    <div className="text-sm" style={{ color: "#ABA4AA" }}>
                      Programs Created
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div
              className="rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
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
                  background:
                    "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
                }}
              />
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p
                    className="text-sm font-medium mb-1"
                    style={{ color: "#ABA4AA" }}
                  >
                    Total Programs
                  </p>
                  <p
                    className="text-3xl font-bold mb-1"
                    style={{ color: "#C3BCC2" }}
                  >
                    {programs.length}
                  </p>
                  <p className="text-xs" style={{ color: "#ABA4AA" }}>
                    {programs.length > 0
                      ? "+2 this month"
                      : "Start your journey"}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
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
                  background:
                    "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)",
                }}
              />
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "#DC2626" }}
                  >
                    <Users className="h-6 w-6" style={{ color: "#C3BCC2" }} />
                  </div>
                  <Clock className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p
                    className="text-sm font-medium mb-1"
                    style={{ color: "#ABA4AA" }}
                  >
                    Assigned Clients
                  </p>
                  <p
                    className="text-3xl font-bold mb-1"
                    style={{ color: "#C3BCC2" }}
                  >
                    {programs.reduce(
                      (acc, program) => acc + program.activeClientCount,
                      0
                    )}
                  </p>
                  <p className="text-xs" style={{ color: "#ABA4AA" }}>
                    Active assignments
                  </p>
                </div>
              </div>
            </div>

            <div
              className="rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
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
                  background:
                    "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
                }}
              />
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "#10B981" }}
                  >
                    <BookOpen
                      className="h-6 w-6"
                      style={{ color: "#C3BCC2" }}
                    />
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p
                    className="text-sm font-medium mb-1"
                    style={{ color: "#ABA4AA" }}
                  >
                    Active Programs
                  </p>
                  <p
                    className="text-3xl font-bold mb-1"
                    style={{ color: "#C3BCC2" }}
                  >
                    {programs.filter(p => p.activeClientCount > 0).length}
                  </p>
                  <p className="text-xs" style={{ color: "#ABA4AA" }}>
                    In use by clients
                  </p>
                </div>
              </div>
            </div>

            <div
              className="rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
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
                  background:
                    "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
                }}
              />
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "#F59E0B" }}
                  >
                    <Calendar
                      className="h-6 w-6"
                      style={{ color: "#C3BCC2" }}
                    />
                  </div>
                  <Clock className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p
                    className="text-sm font-medium mb-1"
                    style={{ color: "#ABA4AA" }}
                  >
                    Recent Activity
                  </p>
                  <p
                    className="text-3xl font-bold mb-1"
                    style={{ color: "#C3BCC2" }}
                  >
                    {
                      programs.filter(p => {
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return new Date(p.updatedAt) > weekAgo;
                      }).length
                    }
                  </p>
                  <p className="text-xs" style={{ color: "#ABA4AA" }}>
                    This week
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <h2
                className="text-xl font-semibold"
                style={{ color: "#C3BCC2" }}
              >
                Quick Actions
              </h2>
            </div>
            <div className="flex flex-wrap gap-4">
              {/* Create Program button removed - only available in preview tab */}
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
                style={{
                  backgroundColor: "#353A3A",
                  color: "#C3BCC2",
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
                <Users className="h-5 w-5" />
                Assign to Clients
              </button>
              <button
                onClick={() => (window.location.href = "/library")}
                className="flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
                style={{
                  backgroundColor: "#353A3A",
                  color: "#C3BCC2",
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
                <BookOpen className="h-5 w-5" />
                Browse Library
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div
              className="flex rounded-xl border overflow-hidden"
              style={{ borderColor: "#606364" }}
            >
              <button
                onClick={() => setActiveTab("programs")}
                className={`px-6 py-3 transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeTab === "programs" ? "font-medium" : ""
                }`}
                style={{
                  backgroundColor:
                    activeTab === "programs" ? "#4A5A70" : "#353A3A",
                  color: "#C3BCC2",
                }}
              >
                <BookOpen className="h-4 w-4" />
                Programs
              </button>
              <button
                onClick={() => setActiveTab("routines")}
                className={`px-6 py-3 transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeTab === "routines" ? "font-medium" : ""
                }`}
                style={{
                  backgroundColor:
                    activeTab === "routines" ? "#4A5A70" : "#353A3A",
                  color: "#C3BCC2",
                }}
              >
                <Target className="h-4 w-4" />
                Routines
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "programs" && (
            <>
              {/* Search and Filters */}
              <div className="mb-8">
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5"
                      style={{ color: "#606364" }}
                    />
                    <input
                      type="text"
                      placeholder="Search programs..."
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
                        backgroundColor:
                          viewMode === "grid" ? "#4A5A70" : "#353A3A",
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
                        backgroundColor:
                          viewMode === "list" ? "#4A5A70" : "#353A3A",
                        color: "#C3BCC2",
                      }}
                    >
                      <List className="h-4 w-4" />
                      List
                    </button>
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
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm" style={{ color: "#ABA4AA" }}>
                      {filteredPrograms.length}{" "}
                      {filteredPrograms.length === 1 ? "program" : "programs"}{" "}
                      found
                    </div>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
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
                      Create Program
                    </button>
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
                    <div className="relative text-center">
                      <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                        style={{ backgroundColor: "#4A5A70" }}
                      >
                        <BookOpen
                          className="h-10 w-10"
                          style={{ color: "#C3BCC2" }}
                        />
                      </div>
                      <h3
                        className="text-2xl font-bold mb-3"
                        style={{ color: "#C3BCC2" }}
                      >
                        No programs found
                      </h3>
                      <p
                        className="text-center mb-8 max-w-md"
                        style={{ color: "#ABA4AA" }}
                      >
                        {searchTerm
                          ? "Try adjusting your search terms"
                          : "Start building your programs by creating your first training program"}
                      </p>
                      <div className="flex justify-center">
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
                          Create First Program
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
                        onDuplicate={() => {
                          // Handle duplicate
                          toast({
                            title: "Coming soon",
                            description:
                              "Duplicate functionality will be implemented soon.",
                          });
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
              onDuplicateRoutine={routine => {
                // Create a duplicate routine with a new name
                const duplicatedRoutine = {
                  name: `${routine.name} (Copy)`,
                  description: routine.description,
                  exercises: routine.exercises,
                };
                handleCreateRoutine(duplicatedRoutine);
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

          <AssignProgramModal
            isOpen={isAssignModalOpen}
            onClose={() => setIsAssignModalOpen(false)}
            programId={selectedProgram?.id}
            programTitle={selectedProgram?.title}
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

              <div className="flex items-center gap-4">
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
              <div className="flex items-center gap-2 mt-1">
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

// Export with mobile detection
export default withMobileDetection(MobileProgramsPage, ProgramsPage);
