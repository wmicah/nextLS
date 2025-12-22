"use client";
import React from "react";

import { useState, useCallback } from "react";
import { trpc } from "@/app/_trpc/client";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { COLORS } from "@/lib/colors";
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
import MasterProgramsTab from "@/components/MasterProgramsTab";
import MasterRoutinesTab from "@/components/MasterRoutinesTab";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
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
  const [activeTab, setActiveTab] = useState<"programs" | "routines" | "masterPrograms" | "masterRoutines" | "premadePrograms">(
    "programs"
  );

  // Get user profile to check subscription tier
  const { data: userProfile } = trpc.user.getProfile.useQuery();
  // PREMADE_ROUTINES tier includes MASTER_LIBRARY access (higher tiers get all lower tier features)
  const hasMasterLibraryAccess = 
    userProfile?.subscriptionTier === "MASTER_LIBRARY" || 
    userProfile?.subscriptionTier === "PREMADE_ROUTINES";
  // Only PREMADE_ROUTINES tier gets the premade programs tab
  const hasPremadeProgramsAccess = 
    userProfile?.subscriptionTier === "PREMADE_ROUTINES";
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [programToRename, setProgramToRename] = useState<ProgramListItem | null>(null);
  const [renameTitle, setRenameTitle] = useState("");

  const debouncedSearch = useDebounce(searchTerm, 300);
  const { toast } = useToast();

  const {
    data: programs = [],
    isLoading,
    error,
  } = trpc.programs.list.useQuery();

  // Fetch coach's active clients (including organization clients if coach is in an org)
  const { data: clients = [] } = trpc.clients.list.useQuery({
    archived: false,
    scope: "organization", // Include organization clients if coach is in an organization
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

  const renameProgram = trpc.programs.update.useMutation({
    onSuccess: () => {
      utils.programs.list.invalidate();
      setIsRenameModalOpen(false);
      setProgramToRename(null);
      setRenameTitle("");
      toast({
        title: "Program renamed",
        description: "The program has been renamed successfully.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to rename program",
        variant: "destructive",
      });
    },
  });

  const handleRename = (program: ProgramListItem) => {
    setProgramToRename(program);
    setRenameTitle(program.title);
    setIsRenameModalOpen(true);
  };

  const handleRenameSubmit = () => {
    if (!programToRename || !renameTitle.trim()) return;
    renameProgram.mutate({
      id: programToRename.id,
      title: renameTitle.trim(),
    });
  };

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
        // Case-insensitive alphabetical sort
        const titleA = (a.title || "").trim().toLowerCase();
        const titleB = (b.title || "").trim().toLowerCase();
        return titleA.localeCompare(titleB, undefined, { sensitivity: "base" });
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
            style={{ borderColor: COLORS.GOLDEN_ACCENT }}
          />
        </div>
      </Sidebar>
    );
  }

  if (error) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-64">
          <p style={{ color: COLORS.RED_ALERT }}>
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
          className="min-h-screen"
          style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
        >
          {/* Header with Golden Bar Indicator */}
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <div>
                  <h1
                    className="text-lg font-semibold pl-2"
                    style={{
                      color: COLORS.TEXT_PRIMARY,
                      borderLeft: `3px solid ${COLORS.GOLDEN_ACCENT}`,
                    }}
                  >
                    Training Programs
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    color: COLORS.TEXT_SECONDARY,
                    border: `1px solid ${COLORS.BORDER_SUBTLE}`,
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
          </div>

          {/* Tab Navigation */}
          <div className="mb-4">
            <div className="flex items-center justify-between gap-3 rounded-lg p-2.5 border"
              style={{ 
                backgroundColor: COLORS.BACKGROUND_DARK, 
                borderColor: COLORS.BORDER_SUBTLE 
              }}
            >
              {/* Left: Tabs */}
              <div className="flex gap-1.5">
                <button
                  onClick={() => setActiveTab("programs")}
                  className={`px-3 py-1.5 rounded-md transition-all duration-200 text-xs font-medium ${
                    activeTab === "programs" ? "" : ""
                  }`}
                  style={{
                    backgroundColor: activeTab === "programs" ? COLORS.GOLDEN_DARK : "transparent",
                    color: activeTab === "programs" ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
                  }}
                  onMouseEnter={e => {
                    if (activeTab !== "programs") {
                      e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                      e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                    }
                  }}
                  onMouseLeave={e => {
                    if (activeTab !== "programs") {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                    }
                  }}
                >
                  Programs
                </button>
                <button
                  onClick={() => setActiveTab("routines")}
                  className={`px-3 py-1.5 rounded-md transition-all duration-200 text-xs font-medium ${
                    activeTab === "routines" ? "" : ""
                  }`}
                  style={{
                    backgroundColor: activeTab === "routines" ? COLORS.GOLDEN_DARK : "transparent",
                    color: activeTab === "routines" ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
                  }}
                  onMouseEnter={e => {
                    if (activeTab !== "routines") {
                      e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                      e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                    }
                  }}
                  onMouseLeave={e => {
                    if (activeTab !== "routines") {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                    }
                  }}
                >
                  Routines
                </button>
                {hasMasterLibraryAccess && (
                  <>
                    <button
                      onClick={() => setActiveTab("masterPrograms")}
                      className={`px-3 py-1.5 rounded-md transition-all duration-200 text-xs font-medium ${
                        activeTab === "masterPrograms" ? "" : ""
                      }`}
                      style={{
                        backgroundColor: activeTab === "masterPrograms" ? COLORS.GOLDEN_DARK : "transparent",
                        color: activeTab === "masterPrograms" ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
                      }}
                      onMouseEnter={e => {
                        if (activeTab !== "masterPrograms") {
                          e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                          e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                        }
                      }}
                      onMouseLeave={e => {
                        if (activeTab !== "masterPrograms") {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                        }
                      }}
                    >
                      Master Programs
                    </button>
                    <button
                      onClick={() => setActiveTab("masterRoutines")}
                      className={`px-3 py-1.5 rounded-md transition-all duration-200 text-xs font-medium ${
                        activeTab === "masterRoutines" ? "" : ""
                      }`}
                      style={{
                        backgroundColor: activeTab === "masterRoutines" ? COLORS.GOLDEN_DARK : "transparent",
                        color: activeTab === "masterRoutines" ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
                      }}
                      onMouseEnter={e => {
                        if (activeTab !== "masterRoutines") {
                          e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                          e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                        }
                      }}
                      onMouseLeave={e => {
                        if (activeTab !== "masterRoutines") {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                        }
                      }}
                    >
                      Master Routines
                    </button>
                  </>
                )}
                {hasPremadeProgramsAccess && (
                  <button
                    onClick={() => setActiveTab("premadePrograms")}
                    className={`px-3 py-1.5 rounded-md transition-all duration-200 text-xs font-medium ${
                      activeTab === "premadePrograms" ? "" : ""
                    }`}
                    style={{
                      backgroundColor: activeTab === "premadePrograms" ? COLORS.GOLDEN_DARK : "transparent",
                      color: activeTab === "premadePrograms" ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
                    }}
                    onMouseEnter={e => {
                      if (activeTab !== "premadePrograms") {
                        e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                        e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                      }
                    }}
                    onMouseLeave={e => {
                      if (activeTab !== "premadePrograms") {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                      }
                    }}
                  >
                    Premade Programs
                  </button>
                )}
              </div>

              {/* Right: Action Buttons - Only show for own programs/routines, not master library */}
              {(activeTab === "programs" || activeTab === "routines") && (
                <div className="flex gap-1.5">
                  {activeTab === "programs" ? (
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all duration-200 text-xs font-medium"
                      style={{ backgroundColor: COLORS.GOLDEN_DARK, color: COLORS.TEXT_PRIMARY }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Create Program</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsRoutineModalOpen(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all duration-200 text-xs font-medium"
                      style={{ backgroundColor: COLORS.GOLDEN_DARK, color: COLORS.TEXT_PRIMARY }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Create Routine</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "programs" && (
            <>
              {/* Enhanced Search and Filters - Matching LibraryPage */}
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
                      placeholder="Search programs..."
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
                    <CategoryDropdown
                      value={selectedCategory}
                      onChange={setSelectedCategory}
                      standardCategories={DEFAULT_PROGRAM_CATEGORIES}
                      customCategories={programCategoriesData.filter(
                        (cat: any) =>
                          !DEFAULT_PROGRAM_CATEGORIES.includes(cat.name)
                      )}
                      style={{
                        backgroundColor: COLORS.BACKGROUND_DARK,
                        borderColor: COLORS.BORDER_SUBTLE,
                        color: COLORS.TEXT_PRIMARY,
                      }}
                    />

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
                      <option value="assigned" style={{ backgroundColor: COLORS.BACKGROUND_DARK, color: COLORS.TEXT_PRIMARY }}>Most Assigned</option>
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
                          backgroundColor:
                            viewMode === "grid" ? COLORS.GOLDEN_DARK : "transparent",
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
                          backgroundColor:
                            viewMode === "list" ? COLORS.GOLDEN_DARK : "transparent",
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

              {/* Programs Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h2
                      className="text-sm font-semibold"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      Your Programs
                    </h2>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: COLORS.BACKGROUND_CARD,
                        color: COLORS.TEXT_SECONDARY,
                        border: `1px solid ${COLORS.BORDER_SUBTLE}`,
                      }}
                    >
                      {filteredPrograms.length}{" "}
                      {filteredPrograms.length === 1 ? "program" : "programs"}
                    </span>
                  </div>
                </div>

                {filteredPrograms.length === 0 ? (
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
                          <BookOpen
                            className="h-8 w-8"
                            style={{ color: COLORS.GOLDEN_ACCENT }}
                          />
                        </div>
                      </div>
                      <h3
                        className="text-lg font-bold mb-2"
                        style={{ color: COLORS.TEXT_PRIMARY }}
                      >
                        {searchTerm || selectedCategory !== "All Categories"
                          ? "No Programs Found"
                          : "Start Building Your Programs"}
                      </h3>
                      <p
                        className="text-center mb-6 max-w-md mx-auto text-xs"
                        style={{ color: COLORS.TEXT_SECONDARY }}
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
                              className="underline transition-colors"
                              style={{ color: COLORS.GOLDEN_ACCENT }}
                              onMouseEnter={e => {
                                e.currentTarget.style.color = COLORS.GOLDEN_HOVER;
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.color = COLORS.GOLDEN_ACCENT;
                              }}
                            >
                              clear all filters
                            </button>{" "}
                            to see all programs.
                          </>
                        ) : (
                          "Create comprehensive training programs for your athletes. Build structured workouts with exercises, drills, and progressions."
                        )}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        {(searchTerm ||
                          selectedCategory !== "All Categories") &&
                        programs.length > 0 ? (
                          <button
                            onClick={() => {
                              setSearchTerm("");
                              setSelectedCategory("All Categories");
                            }}
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
                            <Filter className="h-3.5 w-3.5 inline-block mr-1.5" />
                            Clear Filters
                          </button>
                        ) : null}
                        <button
                          onClick={() => setIsCreateModalOpen(true)}
                          className="px-3 py-1.5 rounded-md transition-all duration-200 text-xs font-medium"
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
                          <Plus className="h-3.5 w-3.5 inline-block mr-1.5" />
                          Create Program
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "gap-3",
                      viewMode === "grid"
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                        : "space-y-2.5"
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
                        onRename={() => handleRename(program)}
                        onAssign={() => {
                          setSelectedProgram(program);
                          setIsAssignModalOpen(true);
                        }}
                        onDelete={() =>
                          handleDeleteProgram(program.id, program.title)
                        }
                        onDuplicate={async () => {
                          try {
                            // Fetch the full program structure for duplication
                            const fullProgram = await utils.programs.getById.fetch({ id: program.id });
                            
                            // Create a duplicate program with a new name
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
                              weeks: fullProgram.weeks.map(week => ({
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

                            // Create the program directly without opening modal
                            await createProgram.mutateAsync(duplicatedProgram);
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

          {/* Master Library Tabs - Only shown if user has MASTER_LIBRARY tier */}
          {hasMasterLibraryAccess && (
            <>
              {activeTab === "masterPrograms" && (
                <MasterProgramsTab
                  onAssignProgram={(program) => {
                    setSelectedProgram(program);
                    setIsAssignModalOpen(true);
                  }}
                />
              )}

              {activeTab === "masterRoutines" && (
                <MasterRoutinesTab
                  onAssignRoutine={(routine) => {
                    setSelectedRoutine(routine);
                    setIsAssignRoutineModalOpen(true);
                  }}
                />
              )}
            </>
          )}

          {/* Premade Programs Tab - Only shown if user has PREMADE_ROUTINES tier */}
          {hasPremadeProgramsAccess && activeTab === "premadePrograms" && (
            <MasterProgramsTab
              onAssignProgram={(program) => {
                setSelectedProgram(program);
                setIsAssignModalOpen(true);
              }}
            />
          )}

          {/* Modals */}
          <SeamlessProgramModal
            isOpen={isCreateModalOpen}
            onClose={() => {
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

          {/* Rename Program Dialog */}
          <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
            <DialogContent
              className="max-w-md [&>button]:hidden"
              style={{
                backgroundColor: COLORS.BACKGROUND_DARK,
                borderColor: COLORS.BORDER_SUBTLE,
              }}
            >
              <DialogHeader>
                <DialogTitle className="text-lg font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>
                  Rename Program
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5" style={{ color: COLORS.TEXT_SECONDARY }}>
                  Enter a new name for this program
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-3">
                <div>
                  <Label htmlFor="rename-title" className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                    Program Name
                  </Label>
                  <Input
                    id="rename-title"
                    value={renameTitle}
                    onChange={e => setRenameTitle(e.target.value)}
                    className="mt-1.5 h-9 text-sm"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_CARD,
                      borderColor: COLORS.BORDER_SUBTLE,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                    }}
                    placeholder="Program name"
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        handleRenameSubmit();
                      }
                    }}
                    autoFocus
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsRenameModalOpen(false);
                    setProgramToRename(null);
                    setRenameTitle("");
                  }}
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
                  onClick={handleRenameSubmit}
                  disabled={!renameTitle.trim() || renameProgram.isPending}
                  className="text-xs h-8 px-3"
                  style={{
                    backgroundColor: COLORS.GOLDEN_DARK,
                    color: COLORS.TEXT_PRIMARY,
                  }}
                  onMouseEnter={e => {
                    if (!renameProgram.isPending) {
                      e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
                  }}
                >
                  {renameProgram.isPending ? "Renaming..." : "Rename"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
  onRename,
  onAssign,
  onDelete,
  onDuplicate,
}: {
  program: ProgramListItem;
  viewMode: "grid" | "list";
  onViewDetails: () => void;
  onEdit: () => void;
  onRename: () => void;
  onAssign: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  if (viewMode === "list") {
    return (
      <div
        className="rounded-lg shadow-lg border transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer relative overflow-hidden group"
        style={{
          backgroundColor: COLORS.BACKGROUND_CARD,
          borderColor: COLORS.BORDER_SUBTLE,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
          e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
          e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
        }}
      >
        <div className="relative p-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <h3
                className="text-sm font-bold mb-1 line-clamp-1"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {program.title}
              </h3>

              <p
                className="text-xs mb-2 line-clamp-1"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                {program.description}
              </p>

              <div className="flex items-center gap-3 flex-wrap">
                <div
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium border"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_DARK,
                    color: COLORS.TEXT_SECONDARY,
                    borderColor: COLORS.BORDER_SUBTLE,
                  }}
                >
                  {program.level}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" style={{ color: COLORS.TEXT_MUTED }} />
                  <span style={{ color: COLORS.TEXT_MUTED }} className="text-[10px]">
                    {program.activeClientCount} assigned
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" style={{ color: COLORS.TEXT_MUTED }} />
                  <span style={{ color: COLORS.TEXT_MUTED }} className="text-[10px]">
                    {new Date(program.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={onViewDetails}
                className="p-1.5 rounded-md transition-all duration-300"
                style={{ backgroundColor: COLORS.GOLDEN_DARK, color: COLORS.TEXT_PRIMARY }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
                }}
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-1.5 rounded-md transition-all duration-300"
                    style={{ backgroundColor: COLORS.GOLDEN_DARK, color: COLORS.TEXT_PRIMARY }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
                    }}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  style={{ backgroundColor: COLORS.BACKGROUND_DARK, borderColor: COLORS.BORDER_SUBTLE }}
                >
                  <DropdownMenuItem
                    onClick={onRename}
                    style={{ color: COLORS.TEXT_PRIMARY }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onViewDetails}
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
                  <DropdownMenuSeparator style={{ backgroundColor: COLORS.BORDER_SUBTLE }} />
                  <DropdownMenuItem
                    onClick={onDelete}
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
      </div>
    );
  }

  return (
    <div
      className="rounded-lg shadow-lg border transition-all duration-300 transform hover:-translate-y-1 cursor-pointer relative overflow-hidden group"
      style={{
        backgroundColor: COLORS.BACKGROUND_CARD,
        borderColor: COLORS.BORDER_SUBTLE,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
        e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
        e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
      }}
    >
      <div className="relative p-3">
        {/* Header with icon and title */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div>
              <h3
                className="text-xs font-bold line-clamp-1"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {program.title}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <div
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium border"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_DARK,
                    color: COLORS.TEXT_SECONDARY,
                    borderColor: COLORS.BORDER_SUBTLE,
                  }}
                >
                  {program.level}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" style={{ color: COLORS.TEXT_MUTED }} />
                  <span style={{ color: COLORS.TEXT_MUTED }} className="text-[10px]">
                    {program.activeClientCount} assigned
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 rounded-md transition-all duration-300"
                style={{ color: COLORS.TEXT_SECONDARY }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                  e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              style={{ backgroundColor: COLORS.BACKGROUND_DARK, borderColor: COLORS.BORDER_SUBTLE }}
            >
              <DropdownMenuItem
                onClick={onRename}
                style={{ color: COLORS.TEXT_PRIMARY }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onViewDetails}
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
              <DropdownMenuSeparator style={{ backgroundColor: COLORS.BORDER_SUBTLE }} />
              <DropdownMenuItem
                onClick={onDelete}
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

        {/* Description */}
        {program.description && (
          <p className="text-xs mb-2 line-clamp-2" style={{ color: COLORS.TEXT_SECONDARY }}>
            {program.description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-1.5">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md transition-all duration-200 text-xs font-medium"
            style={{ backgroundColor: COLORS.BACKGROUND_CARD, color: COLORS.TEXT_SECONDARY, border: `1px solid ${COLORS.BORDER_SUBTLE}` }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
              e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
              e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
            }}
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            onClick={onAssign}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md transition-all duration-200 text-xs font-medium"
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
            <Users className="h-3.5 w-3.5" />
            Assign
          </button>
        </div>

        {/* Footer with creation date */}
        <div
          className="flex items-center gap-1 mt-2 pt-2 border-t"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <Calendar className="h-3 w-3" style={{ color: COLORS.TEXT_MUTED }} />
          <span style={{ color: COLORS.TEXT_MUTED }} className="text-[10px]">
            Created {new Date(program.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// Export the component
export default ProgramsPage;
