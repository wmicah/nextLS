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
  X,
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
import CreateProgramModal from "./CreateProgramModal";
import AssignProgramModal from "./AssignProgramModal";
import ProgramDetailsModal from "./ProgramDetailsModal";
import CreateRoutineModal from "@/components/CreateRoutineModal";
import RoutinesTab from "@/components/RoutinesTab";
import VideoLibraryDialog from "@/components/VideoLibraryDialog";
import Sidebar from "./Sidebar";

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

export default function MobileProgramsPage() {
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
  const [activeTab, setActiveTab] = useState<"programs" | "routines">(
    "programs"
  );
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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
    if (routine.id) {
      // Update existing routine
      updateRoutine.mutate({
        id: routine.id,
        name: routine.name,
        description: routine.description,
        exercises: routine.exercises.map((exercise, index) => ({
          ...exercise,
          order: index + 1,
        })),
      });
    } else {
      // Create new routine
      createRoutine.mutate({
        name: routine.name,
        description: routine.description,
        exercises: routine.exercises.map((exercise, index) => ({
          ...exercise,
          order: index + 1,
        })),
      });
    }
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

  const handleRoutineModalSubmit = (routine: {
    id?: string;
    name: string;
    description: string;
    exercises: RoutineExercise[];
  }) => {
    if (routine.id) {
      // Update existing routine
      updateRoutine.mutate({
        id: routine.id,
        name: routine.name,
        description: routine.description,
        exercises: routine.exercises.map((exercise, index) => ({
          ...exercise,
          order: index + 1,
        })),
      });
    } else {
      // Create new routine
      handleCreateRoutine(routine);
    }
    setIsRoutineModalOpen(false);
    setSelectedRoutine(null);
  };

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
        <div
          className="min-h-screen w-full max-w-full overflow-x-hidden"
          style={{ backgroundColor: "#2A3133" }}
        >
          <div className="flex items-center justify-center h-64">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2"
              style={{ borderColor: "#4A5A70" }}
            />
          </div>
        </div>
      </Sidebar>
    );
  }

  if (error) {
    return (
      <Sidebar>
        <div
          className="min-h-screen w-full max-w-full overflow-x-hidden"
          style={{ backgroundColor: "#2A3133" }}
        >
          <div className="flex items-center justify-center h-64">
            <p className="text-red-400">
              Error loading programs: {error.message}
            </p>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div
        className="min-h-screen w-full max-w-full overflow-x-hidden"
        style={{ backgroundColor: "#2A3133" }}
      >
        {/* Mobile Header */}
        <div className="sticky top-0 z-30 bg-[#2A3133] border-b border-[#606364] py-3">
          <div className="flex items-center justify-between w-full min-w-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <BookOpen className="h-4 w-4" style={{ color: "#C3BCC2" }} />
              </div>
              <h1 className="text-lg font-bold text-[#C3BCC2] truncate">
                Training Programs
              </h1>
              <span
                className="px-2 py-1 rounded-full text-xs font-medium flex-shrink-0"
                style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
              >
                {programs.length}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 rounded-lg bg-[#353A3A] border border-[#606364] min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <Search className="h-4 w-4 text-[#C3BCC2]" />
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 rounded-lg bg-[#353A3A] border border-[#606364] min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <Filter className="h-4 w-4 text-[#C3BCC2]" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showSearch && (
          <div className="py-3 bg-[#353A3A] border-b border-[#606364] w-full">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search programs..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-12 py-3 rounded-lg border text-sm"
                style={{
                  backgroundColor: "#2A3133",
                  borderColor: "#606364",
                  color: "#C3BCC2",
                }}
              />
              <button
                onClick={() => setShowSearch(false)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg"
              >
                <X className="h-4 w-4 text-[#ABA4AA]" />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Filters */}
        {showFilters && (
          <div className="py-3 bg-[#353A3A] border-b border-[#606364] w-full">
            <div className="flex items-center gap-2 mb-3 w-full">
              <Filter className="h-4 w-4 text-[#ABA4AA] flex-shrink-0" />
              <span className="text-sm font-medium text-[#C3BCC2] flex-1 min-w-0">
                View Options
              </span>
              <button
                onClick={() => setShowFilters(false)}
                className="ml-auto flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg"
              >
                <X className="h-4 w-4 text-[#ABA4AA]" />
              </button>
            </div>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === "grid"
                    ? "bg-[#4A5A70] text-[#C3BCC2]"
                    : "bg-[#2A3133] text-[#ABA4AA]"
                }`}
              >
                <Grid3X3 className="h-4 w-4 inline mr-2" />
                Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === "list"
                    ? "bg-[#4A5A70] text-[#C3BCC2]"
                    : "bg-[#2A3133] text-[#ABA4AA]"
                }`}
              >
                <List className="h-4 w-4 inline mr-2" />
                List
              </button>
            </div>
          </div>
        )}

        {/* Mobile Stats Cards - 2x2 Grid */}
        <div className="px-4 py-4 w-full">
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-xl border p-4"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-xs font-medium text-[#ABA4AA]">
                  Total
                </span>
              </div>
              <div className="text-2xl font-bold text-[#C3BCC2] mb-1">
                {programs.length}
              </div>
              <div className="text-xs text-[#ABA4AA]">Programs</div>
            </div>

            <div
              className="rounded-xl border p-4"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-red-400" />
                <span className="text-xs font-medium text-[#ABA4AA]">
                  Assigned
                </span>
              </div>
              <div className="text-2xl font-bold text-[#C3BCC2] mb-1">
                {programs.reduce(
                  (acc, program) => acc + program.activeClientCount,
                  0
                )}
              </div>
              <div className="text-xs text-[#ABA4AA]">Clients</div>
            </div>

            <div
              className="rounded-xl border p-4"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-green-400" />
                <span className="text-xs font-medium text-[#ABA4AA]">
                  Active
                </span>
              </div>
              <div className="text-2xl font-bold text-[#C3BCC2] mb-1">
                {programs.filter(p => p.activeClientCount > 0).length}
              </div>
              <div className="text-xs text-[#ABA4AA]">In Use</div>
            </div>

            <div
              className="rounded-xl border p-4"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-yellow-400" />
                <span className="text-xs font-medium text-[#ABA4AA]">
                  Recent
                </span>
              </div>
              <div className="text-2xl font-bold text-[#C3BCC2] mb-1">
                {
                  programs.filter(p => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(p.updatedAt) > weekAgo;
                  }).length
                }
              </div>
              <div className="text-xs text-[#ABA4AA]">This Week</div>
            </div>
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="px-4 mb-4">
          <div
            className="flex rounded-lg border overflow-hidden"
            style={{ borderColor: "#606364" }}
          >
            <button
              onClick={() => setActiveTab("programs")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === "programs"
                  ? "bg-[#4A5A70] text-[#C3BCC2]"
                  : "bg-[#353A3A] text-[#ABA4AA]"
              }`}
            >
              <BookOpen className="h-4 w-4 inline mr-2" />
              Programs
            </button>
            <button
              onClick={() => setActiveTab("routines")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === "routines"
                  ? "bg-[#4A5A70] text-[#C3BCC2]"
                  : "bg-[#353A3A] text-[#ABA4AA]"
              }`}
            >
              <Target className="h-4 w-4 inline mr-2" />
              Routines
            </button>
          </div>
        </div>

        {/* Mobile Quick Actions */}
        <div className="px-4 mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm"
              style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
            >
              <Plus className="h-4 w-4" />
              Create Program
            </button>
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm"
              style={{ backgroundColor: "#10B981", color: "#000000" }}
            >
              <Users className="h-4 w-4" />
              Assign
            </button>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="px-4 pb-6">
          {activeTab === "programs" && (
            <>
              {filteredPrograms.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center h-64 rounded-xl border text-center"
                  style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
                >
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: "#4A5A70" }}
                  >
                    <BookOpen
                      className="h-8 w-8"
                      style={{ color: "#C3BCC2" }}
                    />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-[#C3BCC2]">
                    No programs found
                  </h3>
                  <p className="text-sm mb-4 text-[#ABA4AA] max-w-xs">
                    {searchTerm
                      ? "Try adjusting your search terms"
                      : "Start building your programs by creating your first training program"}
                  </p>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 rounded-lg font-medium text-sm"
                    style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
                  >
                    Create First Program
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredPrograms.map((program: ProgramListItem) => (
                    <MobileProgramCard
                      key={program.id}
                      program={program}
                      onViewDetails={() => {
                        setSelectedProgram(program);
                        setIsDetailsModalOpen(true);
                      }}
                      onEdit={() => {
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
                const duplicatedRoutine = {
                  name: `${routine.name} (Copy)`,
                  description: routine.description,
                  exercises: routine.exercises,
                };
                handleCreateRoutine(duplicatedRoutine);
              }}
            />
          )}
        </div>

        {/* Floating Action Button */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-40"
          style={{ backgroundColor: "#4A5A70" }}
        >
          <Plus className="h-6 w-6 text-[#C3BCC2]" />
        </button>

        {/* Modals */}
        <CreateProgramModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateProgram}
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

        <CreateRoutineModal
          isOpen={isRoutineModalOpen}
          onClose={() => {
            setIsRoutineModalOpen(false);
            setSelectedRoutine(null);
          }}
          onSubmit={handleRoutineModalSubmit}
          routine={selectedRoutine}
          onOpenVideoLibrary={() => setIsVideoLibraryOpen(true)}
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

        {/* Video Library Dialog */}
        <VideoLibraryDialog
          isOpen={isVideoLibraryOpen}
          onClose={() => setIsVideoLibraryOpen(false)}
          onSelectVideo={video => {
            console.log("Video selected:", video);
            setIsVideoLibraryOpen(false);
          }}
          editingItem={null}
        />
      </div>
    </Sidebar>
  );
}

// Mobile Program Card Component
function MobileProgramCard({
  program,
  onViewDetails,
  onEdit,
  onAssign,
  onDelete,
  onDuplicate,
}: {
  program: ProgramListItem;
  onViewDetails: () => void;
  onEdit: () => void;
  onAssign: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  return (
    <div
      className="rounded-xl border p-3 transition-all duration-300 w-full h-full flex flex-col"
      style={{
        backgroundColor: "#353A3A",
        borderColor: "#606364",
      }}
    >
      {/* Header with icon and title */}
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#4A5A70" }}
        >
          <BookOpen className="h-5 w-5" style={{ color: "#C3BCC2" }} />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1 rounded-lg transition-all duration-300 min-h-[32px] min-w-[32px] flex items-center justify-center"
              style={{ color: "#ABA4AA" }}
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

      {/* Title */}
      <h3 className="text-sm font-bold text-[#C3BCC2] line-clamp-2 mb-2 flex-1">
        {program.title}
      </h3>

      {/* Description */}
      {program.description && (
        <p className="text-xs mb-3 line-clamp-2 text-[#ABA4AA] flex-1">
          {program.description}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3 text-[#ABA4AA]" />
          <span className="text-xs text-[#ABA4AA]">
            {program.activeClientCount}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-[#ABA4AA]" />
          <span className="text-xs text-[#ABA4AA]">
            {new Date(program.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-lg font-medium text-xs transition-all duration-300"
          style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
        >
          <Edit className="h-3 w-3" />
          Edit
        </button>
        <button
          onClick={onAssign}
          className="flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-lg font-medium text-xs transition-all duration-300"
          style={{ backgroundColor: "#10B981", color: "#000000" }}
        >
          <Users className="h-3 w-3" />
          Assign
        </button>
      </div>
    </div>
  );
}
