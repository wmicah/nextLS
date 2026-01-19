"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
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
import MobileNavigation from "./MobileNavigation";
import MobileBottomNavigation from "./MobileBottomNavigation";
import CategoryDropdown from "./ui/CategoryDropdown";
import { COLORS, getGoldenAccent } from "@/lib/colors";

// Lazy load heavy modals and tabs - only loaded when needed
const SeamlessProgramModal = dynamic(() => import("./SeamlessProgramModal"), { ssr: false });
const MobileSeamlessProgramModal = dynamic(() => import("./MobileSeamlessProgramModal"), { ssr: false });
const SimpleAssignProgramModal = dynamic(() => import("./SimpleAssignProgramModal"), { ssr: false });
const MobileSimpleAssignProgramModal = dynamic(() => import("./MobileSimpleAssignProgramModal"), { ssr: false });
const ProgramDetailsModal = dynamic(() => import("./ProgramDetailsModal"), { ssr: false });
const MobileProgramDetailsModal = dynamic(() => import("./MobileProgramDetailsModal"), { ssr: false });
const SeamlessRoutineModal = dynamic(() => import("@/components/SeamlessRoutineModal"), { ssr: false });
const MobileSeamlessRoutineModal = dynamic(() => import("@/components/MobileSeamlessRoutineModal"), { ssr: false });
const RoutinesTab = dynamic(() => import("@/components/RoutinesTab"), { ssr: false });
const MobileRoutinesTab = dynamic(() => import("@/components/MobileRoutinesTab"), { ssr: false });
const VideoLibraryDialog = dynamic(() => import("@/components/VideoLibraryDialog"), { ssr: false });
const SimpleAssignRoutineModal = dynamic(() => import("@/components/SimpleAssignRoutineModal"), { ssr: false });
const MobileSimpleAssignRoutineModal = dynamic(() => import("@/components/MobileSimpleAssignRoutineModal"), { ssr: false });

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
        (exercise.type as
          | "exercise"
          | "drill"
          | "video"
          | "routine"
          | "superset") || "exercise",
      description: exercise.description || "",
      notes: exercise.notes || "",
      sets: exercise.sets ?? undefined,
      reps: exercise.reps ?? undefined,
      tempo: exercise.tempo || "",
      duration: exercise.duration || "",
      videoId: exercise.videoId ?? undefined,
      videoTitle: exercise.videoTitle || "",
      videoThumbnail: exercise.videoThumbnail || "",
      videoUrl: exercise.videoUrl || "",
      supersetId: exercise.supersetId || undefined,
      supersetOrder: exercise.supersetOrder ?? undefined,
      supersetDescription: exercise.supersetDescription || undefined,
      supersetInstructions: exercise.supersetInstructions || undefined,
      supersetNotes: exercise.supersetNotes || undefined,
      coachInstructions:
        exercise.coachInstructionsWhatToDo ||
        exercise.coachInstructionsHowToDoIt
          ? {
              whatToDo: exercise.coachInstructionsWhatToDo || "",
              howToDoIt: exercise.coachInstructionsHowToDoIt || "",
              keyPoints: exercise.coachInstructionsKeyPoints || [],
              commonMistakes: exercise.coachInstructionsCommonMistakes || [],
              equipment: exercise.coachInstructionsEquipment || undefined,
              setup: exercise.coachInstructionsSetup || undefined,
            }
          : undefined,
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

  const updateProgram = trpc.programs.update.useMutation({
    onSuccess: () => {
      utils.programs.list.invalidate();
      setIsEditModalOpen(false);
      setSelectedProgram(null);
      toast({
        title: "Program updated",
        description: "Your program has been updated successfully.",
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
    setIsEditModalOpen(true);
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

  // Filter clients with email for routine assignment
  const clientsWithEmail = useMemo(() => {
    if (!clients) return [];
    const result: any[] = [];
    for (const client of clients) {
      if (client.email !== null) {
        result.push(client);
      }
    }
    return result;
  }, [clients]);

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
          style={{ borderColor: COLORS.GOLDEN_ACCENT }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: COLORS.RED_ALERT }}>Error loading programs: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>
      {/* Mobile Header */}
      <div 
        className="sticky top-0 z-50 border-b px-4 pb-3"
        style={{ 
          paddingTop: `calc(0.75rem + env(safe-area-inset-top))`,
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold" style={{ color: COLORS.TEXT_PRIMARY }}>
              Training Programs
            </h1>
            <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
              {activeTab === "programs"
                ? "Manage programs"
                : "Manage routines"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: COLORS.GOLDEN_DARK,
                color: "#FFFFFF",
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
        <div className="flex space-x-1 p-1 rounded-xl border" style={{ backgroundColor: "#1C2021", borderColor: COLORS.BORDER_SUBTLE }}>
          <button
            onClick={() => setActiveTab("programs")}
            className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
              activeTab === "programs" ? "shadow-lg" : ""
            }`}
            style={{
              backgroundColor:
                activeTab === "programs" ? COLORS.GOLDEN_ACCENT : "transparent",
              color: activeTab === "programs" ? "#FFFFFF" : COLORS.TEXT_SECONDARY,
            }}
          >
            <span className="text-sm">Programs</span>
          </button>
          <button
            onClick={() => setActiveTab("routines")}
            className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
              activeTab === "routines" ? "shadow-lg" : ""
            }`}
            style={{
              backgroundColor:
                activeTab === "routines" ? COLORS.GOLDEN_ACCENT : "transparent",
              color: activeTab === "routines" ? "#FFFFFF" : COLORS.TEXT_SECONDARY,
            }}
          >
            <span className="text-sm">Routines</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="rounded-lg border p-4" style={{ backgroundColor: "#1C2021", borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: COLORS.TEXT_MUTED }} />
              <input
                type="text"
                placeholder="Search programs..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm"
                style={{
                  backgroundColor: "#2A2F2F",
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY
                }}
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
                  backgroundColor: "#2A2F2F",
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
                }}
              />

              {/* View Mode Toggle */}
              <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <button
                  onClick={() => setViewMode("grid")}
                  className="p-2 transition-all duration-200"
                  style={{
                    backgroundColor: viewMode === "grid" ? COLORS.GOLDEN_ACCENT : "#2A2F2F",
                    color: viewMode === "grid" ? "#FFFFFF" : COLORS.TEXT_PRIMARY
                  }}
                  title="Grid View"
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className="p-2 transition-all duration-200"
                  style={{
                    backgroundColor: viewMode === "list" ? COLORS.GOLDEN_ACCENT : "#2A2F2F",
                    color: viewMode === "list" ? "#FFFFFF" : COLORS.TEXT_PRIMARY
                  }}
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
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-colors"
              style={{ backgroundColor: COLORS.GOLDEN_DARK, color: "#FFFFFF" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
              }}
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
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-colors"
              style={{ backgroundColor: COLORS.GOLDEN_DARK, color: "#FFFFFF" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
              }}
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
              <div className="rounded-xl text-center p-8 border" style={{ backgroundColor: "#1C2021", borderColor: COLORS.BORDER_SUBTLE }}>
                <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#2A2F2F" }}>
                  <BookOpen className="h-8 w-8" style={{ color: COLORS.TEXT_MUTED }} />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
                  {searchTerm ? "No programs found" : "No programs created yet"}
                </h3>
                <p className="mb-6 max-w-sm mx-auto" style={{ color: COLORS.TEXT_SECONDARY }}>
                  {searchTerm
                    ? `No programs match "${searchTerm}". Try a different search term.`
                    : "Create your first training program to get started."}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="text-sm px-4 py-2 rounded-lg transition-colors"
                    style={{ backgroundColor: COLORS.GOLDEN_DARK, color: "#FFFFFF" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
                    }}
                  >
                    Create Your First Program
                  </button>
                )}
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="text-sm px-4 py-2 rounded-lg border transition-colors"
                    style={{ 
                      backgroundColor: "#2A2F2F", 
                      color: COLORS.TEXT_SECONDARY, 
                      borderColor: COLORS.BORDER_SUBTLE 
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#353A3A";
                      e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#2A2F2F";
                      e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                    }}
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
                        className="rounded-lg border p-4 transition-all duration-200 cursor-pointer"
                        style={{
                          backgroundColor: "#1C2021",
                          borderColor: COLORS.BORDER_SUBTLE,
                        }}
                        onMouseEnter={(e) => {
                          if (window.matchMedia("(hover: hover)").matches) {
                            e.currentTarget.style.backgroundColor = "#1F2426";
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
                        onClick={() => handleProgramClick(program)}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-semibold mb-1 line-clamp-2" style={{ color: COLORS.TEXT_PRIMARY }}>
                                {program.title}
                              </h3>
                              <p className="text-sm mb-2 line-clamp-2" style={{ color: COLORS.TEXT_SECONDARY }}>
                                {program.description || "No description"}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  onClick={e => e.stopPropagation()}
                                  className="p-1 rounded transition-colors"
                                  style={{ color: COLORS.TEXT_SECONDARY }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "#2A2F2F";
                                    e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                    e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                                  }}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent style={{ backgroundColor: "#1C2021", borderColor: COLORS.BORDER_SUBTLE }}>
                                  <DropdownMenuItem
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleProgramClick(program);
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
                                      handleAssignProgram(program);
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
                                    Assign to Client
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator style={{ backgroundColor: COLORS.BORDER_SUBTLE }} />
                                  <DropdownMenuItem
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleDeleteProgram(program.id);
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
                          </div>
                          <div className="flex items-center gap-2">
                            <span 
                              className="text-xs px-2 py-1 rounded text-white"
                              style={{ backgroundColor: COLORS.GOLDEN_DARK }}
                            >
                              {program.duration} weeks
                            </span>
                            {program.activeClientCount > 0 && (
                              <span 
                                className="text-xs px-2 py-1 rounded text-white"
                                style={{ backgroundColor: COLORS.GREEN_DARK }}
                              >
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
                        className="rounded-lg border p-4 transition-all duration-200 cursor-pointer"
                        style={{
                          backgroundColor: "#1C2021",
                          borderColor: COLORS.BORDER_SUBTLE,
                        }}
                        onMouseEnter={(e) => {
                          if (window.matchMedia("(hover: hover)").matches) {
                            e.currentTarget.style.backgroundColor = "#1F2426";
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
                        onClick={() => handleProgramClick(program)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold mb-1" style={{ color: COLORS.TEXT_PRIMARY }}>
                                {program.title}
                              </h3>
                              <p className="text-xs mb-2" style={{ color: COLORS.TEXT_SECONDARY }}>
                                {program.description || "No description"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  onClick={e => e.stopPropagation()}
                                  className="p-1 rounded transition-colors"
                                  style={{ color: COLORS.TEXT_SECONDARY }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "#2A2F2F";
                                    e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                    e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                                  }}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent style={{ backgroundColor: "#1C2021", borderColor: COLORS.BORDER_SUBTLE }}>
                                  <DropdownMenuItem
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleProgramClick(program);
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
                                      handleAssignProgram(program);
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
                                    Assign to Client
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator style={{ backgroundColor: COLORS.BORDER_SUBTLE }} />
                                  <DropdownMenuItem
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleDeleteProgram(program.id);
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
                          </div>
                          <div className="flex items-center gap-2">
                            <span 
                              className="text-xs px-2 py-1 rounded text-white"
                              style={{ backgroundColor: COLORS.GOLDEN_DARK }}
                            >
                              {program.duration} weeks
                            </span>
                            {program.activeClientCount > 0 && (
                              <span 
                                className="text-xs px-2 py-1 rounded text-white"
                                style={{ backgroundColor: COLORS.GREEN_DARK }}
                              >
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
            routines={routines as any}
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
      <MobileSeamlessProgramModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedVideoFromLibrary(null);
        }}
        onSubmit={async data => {
          try {
            await createProgram.mutateAsync({
              title: data.title,
              description: data.description || undefined,
              level: data.level as
                | "Drive"
                | "Whip"
                | "Separation"
                | "Stability"
                | "Extension",
              duration: data.duration,
              weeks: data.weeks,
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
        onOpenVideoLibrary={() => setIsVideoLibraryOpen(true)}
        selectedVideoFromLibrary={selectedVideoFromLibrary}
        onVideoProcessed={() => setSelectedVideoFromLibrary(null)}
      />

      <MobileSeamlessProgramModal
        isOpen={isEditModalOpen}
        program={selectedProgram || null}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProgram(null);
          setSelectedVideoFromLibrary(null);
        }}
        onSubmit={async data => {
          if (selectedProgram) {
            // Convert ProgramFormData to update format (remove order field from drills)
            const convertedWeeks = data.weeks.map(week => ({
              weekNumber: week.weekNumber,
              title: week.title,
              description: week.description,
              days: week.days.map(day => ({
                dayNumber: day.dayNumber,
                title: day.title,
                description: day.description,
                drills: day.drills.map(drill => {
                  // Remove order field and ensure all required fields are present
                  const { order, ...drillWithoutOrder } = drill;
                  return {
                    id: drill.id || `temp-${Date.now()}`,
                    title: drill.title,
                    description: drill.description,
                    duration: drill.duration,
                    videoUrl: drill.videoUrl,
                    notes: drill.notes,
                    type: drill.type,
                    sets: drill.sets,
                    reps: drill.reps,
                    tempo: drill.tempo,
                    videoId: drill.videoId,
                    videoTitle: drill.videoTitle,
                    videoThumbnail: drill.videoThumbnail,
                    routineId: drill.routineId,
                    supersetId: drill.supersetId,
                    supersetOrder: drill.supersetOrder,
                    supersetDescription: drill.supersetDescription,
                    supersetInstructions: drill.supersetInstructions,
                    supersetNotes: drill.supersetNotes,
                    coachInstructionsWhatToDo: drill.coachInstructionsWhatToDo,
                    coachInstructionsHowToDoIt:
                      drill.coachInstructionsHowToDoIt,
                    coachInstructionsKeyPoints:
                      drill.coachInstructionsKeyPoints,
                    coachInstructionsCommonMistakes:
                      drill.coachInstructionsCommonMistakes,
                    coachInstructionsEasier: drill.coachInstructionsEasier,
                    coachInstructionsHarder: drill.coachInstructionsHarder,
                    coachInstructionsEquipment:
                      drill.coachInstructionsEquipment,
                    coachInstructionsSetup: drill.coachInstructionsSetup,
                  };
                }),
              })),
            }));

            // Update existing program
            updateProgram.mutate({
              id: selectedProgram.id,
              title: data.title,
              description: data.description || undefined,
              weeks: convertedWeeks,
            });
          }
        }}
        onOpenVideoLibrary={() => setIsVideoLibraryOpen(true)}
        selectedVideoFromLibrary={selectedVideoFromLibrary}
        onVideoProcessed={() => setSelectedVideoFromLibrary(null)}
        onSuccess={() => {
          utils.programs.list.invalidate();
          setIsEditModalOpen(false);
          setSelectedProgram(null);
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

      <MobileSeamlessRoutineModal
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
        onSuccess={() => {
          utils.routines.list.invalidate();
          setIsRoutineModalOpen(false);
        }}
      />

      {/* Video Library Dialog - Shared between program and routine modals */}
      <VideoLibraryDialog
        isOpen={isVideoLibraryOpen}
        onClose={() => setIsVideoLibraryOpen(false)}
        onSelectVideo={video => {
          setSelectedVideoFromLibrary(video);
          setIsVideoLibraryOpen(false);
        }}
        editingItem={null}
      />

      {selectedRoutine && (
        <MobileSimpleAssignRoutineModal
          isOpen={isAssignRoutineModalOpen}
          onClose={() => setIsAssignRoutineModalOpen(false)}
          routine={selectedRoutine}
          clients={clientsWithEmail}
          onSuccess={() => {
            setIsAssignRoutineModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
