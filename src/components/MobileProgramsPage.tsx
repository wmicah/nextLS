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
  Activity,
} from "lucide-react";
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
import MobileCreateProgramModal from "./MobileCreateProgramModal";
import SimpleAssignProgramModal from "./SimpleAssignProgramModal";
import MobileSimpleAssignProgramModal from "./MobileSimpleAssignProgramModal";
import ProgramDetailsModal from "./ProgramDetailsModal";
import MobileProgramDetailsModal from "./MobileProgramDetailsModal";
import SeamlessRoutineModal from "@/components/SeamlessRoutineModal";
import MobileCreateRoutineModal from "@/components/MobileCreateRoutineModal";
import RoutinesTab from "@/components/RoutinesTab";
import MobileRoutinesTab from "@/components/MobileRoutinesTab";
import VideoLibraryDialog from "@/components/VideoLibraryDialog";
import SimpleAssignRoutineModal from "@/components/SimpleAssignRoutineModal";
import MobileSimpleAssignRoutineModal from "@/components/MobileSimpleAssignRoutineModal";
import MobileNavigation from "./MobileNavigation";
import MobileBottomNavigation from "./MobileBottomNavigation";
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
  supersetId?: string | null;
  supersetOrder?: number | null;
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

export default function MobileProgramsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [sortBy, setSortBy] = useState("updated");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedProgram, setSelectedProgram] =
    useState<ProgramListItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
          description: `The routine has been deleted and ${data.affectedPrograms.length} program(s) have been updated.`,
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

  const handleProgramClick = (program: ProgramListItem) => {
    setSelectedProgram(program);
    setIsDetailsModalOpen(true);
  };

  const handleAssignProgram = (program: ProgramListItem) => {
    setSelectedProgram(program);
    setIsAssignModalOpen(true);
  };

  const handleDeleteProgram = (programId: string) => {
    const program = programs.find(p => p.id === programId);
    const programName = program?.title || "this program";

    if (
      window.confirm(
        `Are you sure you want to delete "${programName}"?\n\nThis action cannot be undone.`
      )
    ) {
      deleteProgram.mutate({ id: programId });
    }
  };

  const handleRoutineClick = (routine: Routine) => {
    setSelectedRoutine(routine);
    setIsRoutineDetailsOpen(true);
  };

  const handleEditRoutine = (routine: Routine) => {
    setSelectedRoutine(routine);
    setIsRoutineModalOpen(true);
  };

  const handleAssignRoutine = (routine: Routine) => {
    setSelectedRoutine(routine);
    setIsAssignRoutineModalOpen(true);
  };

  const handleViewRoutine = (routine: Routine) => {
    const fullRoutine = routines.find(r => r.id === routine.id);
    if (fullRoutine) {
      setSelectedRoutine(fullRoutine);
      setIsRoutineDetailsOpen(true);
      // Ensure edit modal is closed
      setIsRoutineModalOpen(false);
    }
  };

  const handleDeleteRoutine = (routine: any) => {
    const routineName = routine?.name || "this routine";

    if (
      window.confirm(
        `Are you sure you want to delete "${routineName}"?\n\n` +
          `This action cannot be undone. If this routine is used in any programs, ` +
          `those exercises will be automatically replaced with rest days.`
      )
    ) {
      deleteRoutine.mutate({ id: routine.id });
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
      <div className="flex items-center justify-center h-64">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: "#4A5A70" }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-400">Error loading programs: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-[#2A3133] border-b border-[#606364] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#4A5A70" }}
            >
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">
                Training Programs
              </h1>
              <p className="text-xs text-gray-400">
                {activeTab === "programs"
                  ? "Manage programs"
                  : "Manage routines"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: "#4A5A70",
                color: "#C3BCC2",
              }}
            >
              {activeTab === "programs"
                ? `${programs.length}`
                : `${routines.length}`}
            </span>
            <MobileNavigation currentPage="programs" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20 space-y-4">
        {/* Tabs */}
        <div className="flex space-x-1 p-1 rounded-xl border bg-[#353A3A] border-[#606364]">
          <button
            onClick={() => setActiveTab("programs")}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === "programs" ? "shadow-lg" : ""
            }`}
            style={{
              backgroundColor:
                activeTab === "programs" ? "#4A5A70" : "transparent",
              color: activeTab === "programs" ? "#FFFFFF" : "#ABA4AA",
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>Programs</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("routines")}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === "routines" ? "shadow-lg" : ""
            }`}
            style={{
              backgroundColor:
                activeTab === "routines" ? "#4A5A70" : "transparent",
              color: activeTab === "routines" ? "#FFFFFF" : "#ABA4AA",
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <Target className="h-4 w-4" />
              <span>Routines</span>
            </div>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-[#353A3A] border border-[#606364] rounded-xl p-4">
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search programs..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-[#606364] border-[#ABA4AA] text-[#C3BCC2] text-sm"
              />
            </div>

            {/* Filters Row */}
            <div className="flex gap-2">
              {/* Category Dropdown */}
              <CategoryDropdown
                value={selectedCategory}
                onChange={setSelectedCategory}
                standardCategories={DEFAULT_PROGRAM_CATEGORIES}
                customCategories={programCategoriesData.filter(
                  cat => !DEFAULT_PROGRAM_CATEGORIES.includes(cat.name)
                )}
                style={{
                  backgroundColor: "#606364",
                  borderColor: "#ABA4AA",
                  color: "#C3BCC2",
                }}
              />

              {/* View Mode Toggle */}
              <div className="flex rounded-lg border border-[#ABA4AA] overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 transition-all duration-200 ${
                    viewMode === "grid" ? "bg-[#4A5A70]" : "bg-[#606364]"
                  } text-[#C3BCC2]`}
                  title="Grid View"
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 transition-all duration-200 ${
                    viewMode === "list" ? "bg-[#4A5A70]" : "bg-[#606364]"
                  } text-[#C3BCC2]`}
                  title="List View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          {activeTab === "programs" ? (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm"
              style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
            >
              <Plus className="h-4 w-4" />
              Create Program
            </button>
          ) : (
            <button
              onClick={() => {
                setSelectedRoutine(null);
                setIsRoutineModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm"
              style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
            >
              <Plus className="h-4 w-4" />
              Create Routine
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === "programs" && (
          <>
            {/* Programs List/Grid */}
            {filteredPrograms.length === 0 ? (
              <div className="bg-[#353A3A] border border-[#606364] rounded-xl text-center p-8">
                <div className="w-16 h-16 rounded-xl bg-[#4A5A70] flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-[#C3BCC2]" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-[#C3BCC2]">
                  {searchTerm ? "No programs found" : "No programs created yet"}
                </h3>
                <p className="mb-6 max-w-sm mx-auto text-[#ABA4AA]">
                  {searchTerm
                    ? `No programs match "${searchTerm}". Try a different search term.`
                    : "Create your first training program to get started."}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="text-sm px-4 py-2 rounded-lg bg-[#4A5A70] text-[#C3BCC2] mx-auto"
                  >
                    Create Your First Program
                  </button>
                )}
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="text-sm px-4 py-2 rounded-lg bg-transparent text-[#ABA4AA] border border-[#606364] mx-auto"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Grid View */}
                {viewMode === "grid" && (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredPrograms.map((program: ProgramListItem) => (
                      <div
                        key={program.id}
                        className="bg-[#353A3A] border border-[#606364] rounded-xl p-4 transition-all duration-200 hover:bg-[#3A4040] hover:border-[#4A5A70] cursor-pointer"
                        onClick={() => handleProgramClick(program)}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-semibold text-[#C3BCC2] mb-1 line-clamp-2">
                                {program.title}
                              </h3>
                              <p className="text-sm text-[#ABA4AA] mb-2 line-clamp-2">
                                {program.description || "No description"}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  onClick={e => e.stopPropagation()}
                                  className="p-1 rounded hover:bg-[#4A5A70]"
                                >
                                  <MoreHorizontal className="h-4 w-4 text-[#ABA4AA]" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-[#353A3A] border-[#606364]">
                                  <DropdownMenuItem
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleProgramClick(program);
                                    }}
                                    className="text-[#C3BCC2] hover:bg-[#4A5A70]"
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleAssignProgram(program);
                                    }}
                                    className="text-[#C3BCC2] hover:bg-[#4A5A70]"
                                  >
                                    <Users className="h-4 w-4 mr-2" />
                                    Assign to Client
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-[#606364]" />
                                  <DropdownMenuItem
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleDeleteProgram(program.id);
                                    }}
                                    className="text-red-400 hover:bg-red-900/20"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 rounded bg-[#4A5A70] text-[#C3BCC2]">
                              {program.level}
                            </span>
                            <span className="text-xs px-2 py-1 rounded bg-[#F59E0B] text-white">
                              {program.duration} weeks
                            </span>
                            {program.activeClientCount > 0 && (
                              <span className="text-xs px-2 py-1 rounded bg-[#10B981] text-white">
                                {program.activeClientCount} assigned
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* List View */}
                {viewMode === "list" && (
                  <div className="space-y-3">
                    {filteredPrograms.map((program: ProgramListItem) => (
                      <div
                        key={program.id}
                        className="bg-[#353A3A] border border-[#606364] rounded-xl p-4 transition-all duration-200 hover:bg-[#3A4040] hover:border-[#4A5A70] cursor-pointer"
                        onClick={() => handleProgramClick(program)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-[#C3BCC2] mb-1">
                                {program.title}
                              </h3>
                              <p className="text-sm text-[#ABA4AA] mb-2">
                                {program.description || "No description"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  onClick={e => e.stopPropagation()}
                                  className="p-1 rounded hover:bg-[#4A5A70]"
                                >
                                  <MoreHorizontal className="h-4 w-4 text-[#ABA4AA]" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-[#353A3A] border-[#606364]">
                                  <DropdownMenuItem
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleProgramClick(program);
                                    }}
                                    className="text-[#C3BCC2] hover:bg-[#4A5A70]"
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleAssignProgram(program);
                                    }}
                                    className="text-[#C3BCC2] hover:bg-[#4A5A70]"
                                  >
                                    <Users className="h-4 w-4 mr-2" />
                                    Assign to Client
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-[#606364]" />
                                  <DropdownMenuItem
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleDeleteProgram(program.id);
                                    }}
                                    className="text-red-400 hover:bg-red-900/20"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm px-3 py-1 rounded-lg bg-[#4A5A70] text-[#C3BCC2]">
                              {program.level}
                            </span>
                            <span className="text-sm px-3 py-1 rounded-lg bg-[#F59E0B] text-white">
                              {program.duration} weeks
                            </span>
                            {program.activeClientCount > 0 && (
                              <span className="text-sm px-3 py-1 rounded-lg bg-[#10B981] text-white">
                                {program.activeClientCount} assigned
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === "routines" && (
          <MobileRoutinesTab
            routines={routines}
            onRoutineClick={handleRoutineClick}
            onEditRoutine={handleEditRoutine}
            onAssignRoutine={handleAssignRoutine}
            onDeleteRoutine={handleDeleteRoutine}
            onViewRoutine={handleViewRoutine}
            viewMode={viewMode}
            searchTerm={searchTerm}
            selectedCategory={selectedCategory}
            onSearchChange={setSearchTerm}
            onCategoryChange={setSelectedCategory}
            onViewModeChange={setViewMode}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNavigation />

      {/* Modals */}
      <MobileCreateProgramModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async data => {
          try {
            // Transform the weeks data to match the TRPC endpoint format
            const transformedWeeks = data.weeks.map((week, weekIndex) => ({
              weekNumber: weekIndex + 1,
              title: week.name,
              description: "",
              days: Object.entries(week.days).map(
                ([dayKey, exercises], dayIndex) => ({
                  dayNumber: dayIndex + 1,
                  title: dayKey.charAt(0).toUpperCase() + dayKey.slice(1), // "mon" -> "Mon"
                  description: "",
                  drills: exercises.map((exercise, exerciseIndex) => ({
                    order: exerciseIndex + 1,
                    title: exercise.title,
                    description: exercise.description || "",
                    duration: exercise.duration || "",
                    videoUrl: exercise.videoUrl || "",
                    notes: exercise.notes || "",
                    sets: exercise.sets || undefined,
                    reps: exercise.reps || undefined,
                    tempo: exercise.tempo || "",
                    supersetId: exercise.supersetId || undefined,
                    supersetOrder: exercise.supersetOrder || undefined,
                  })),
                })
              ),
            }));

            await createProgram.mutateAsync({
              title: data.title,
              description: data.description,
              level: data.level as
                | "Drive"
                | "Whip"
                | "Separation"
                | "Stability"
                | "Extension",
              duration: data.duration,
              weeks: transformedWeeks,
            });
            toast({
              title: "Program created",
              description: "Your program has been created successfully.",
            });
          } catch (error) {
            console.error("Error creating program:", error);
            toast({
              title: "Error",
              description: "Failed to create program. Please try again.",
              variant: "destructive",
            });
          }
        }}
      />

      <SeamlessProgramModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={data => {
          console.log("Program updated:", data);
          utils.programs.list.invalidate();
          setIsEditModalOpen(false);
        }}
      />

      <MobileSimpleAssignProgramModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        programId={selectedProgram?.id}
        clientId={undefined}
        clientName={undefined}
        startDate={undefined}
      />

      {selectedProgram && (
        <MobileProgramDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          program={selectedProgram as any}
          onEdit={() => {
            setIsDetailsModalOpen(false);
            setIsEditModalOpen(true);
          }}
          onAssign={() => {
            setIsDetailsModalOpen(false);
            setIsAssignModalOpen(true);
          }}
          onDelete={() => {
            setIsDetailsModalOpen(false);
            handleDeleteProgram(selectedProgram.id);
          }}
        />
      )}

      <MobileCreateRoutineModal
        isOpen={isRoutineModalOpen}
        onClose={() => setIsRoutineModalOpen(false)}
        onSuccess={() => {
          utils.routines.list.invalidate();
          setIsRoutineModalOpen(false);
        }}
      />

      {selectedRoutine && (
        <MobileSimpleAssignRoutineModal
          isOpen={isAssignRoutineModalOpen}
          onClose={() => setIsAssignRoutineModalOpen(false)}
          routine={selectedRoutine}
          clients={
            (clients?.filter(client => client.email !== null) as any) || []
          }
          onSuccess={() => {
            setIsAssignRoutineModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
