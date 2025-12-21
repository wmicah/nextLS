"use client";

import { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import { COLORS, getGoldenAccent } from "@/lib/colors";
import {
  Search,
  Grid3X3,
  List,
  Eye,
  Users,
  Target,
  AlertCircle,
  Loader2,
  Dumbbell,
} from "lucide-react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import SimpleAssignRoutineModal from "./SimpleAssignRoutineModal";
import SeamlessRoutineModal from "./SeamlessRoutineModal";

interface MasterRoutinesTabProps {
  onAssignRoutine?: (routine: any) => void;
}

export default function MasterRoutinesTab({
  onAssignRoutine,
}: MasterRoutinesTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("updated");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedRoutine, setSelectedRoutine] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Fetch master library routines
  const {
    data: masterRoutines = [],
    isLoading,
    error,
  } = trpc.routines.listMasterLibrary.useQuery({
    search: debouncedSearch || undefined,
  });

  // Fetch full routine details when viewing
  const {
    data: fullRoutineDetails,
    isLoading: detailsLoading,
  } = trpc.routines.getMasterLibraryById.useQuery(
    { routineId: selectedRoutine?.id || "" },
    { enabled: !!selectedRoutine?.id && isViewModalOpen }
  );

  // Filter and sort routines
  const filteredRoutines = masterRoutines.filter((routine: any) => {
    if (!debouncedSearch) return true;
    const searchLower = debouncedSearch.toLowerCase();
    return (
      routine.name.toLowerCase().includes(searchLower) ||
      (routine.description && routine.description.toLowerCase().includes(searchLower))
    );
  });

  const sortedRoutines = [...filteredRoutines].sort((a: any, b: any) => {
    switch (sortBy) {
      case "updated":
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case "created":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const handleViewDetails = (routine: any) => {
    setSelectedRoutine(routine);
    setIsViewModalOpen(true);
  };

  const handleAssign = (routine: any) => {
    setSelectedRoutine(routine);
    setIsAssignModalOpen(true);
  };

  if (error) {
    return (
      <div className="p-8 rounded-lg border" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="h-5 w-5" />
          <p>Error loading master library routines: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Search and Filters */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
              style={{ color: COLORS.TEXT_SECONDARY }}
            />
            <input
              type="text"
              placeholder="Search master library routines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                borderColor: COLORS.BORDER_SUBTLE,
                color: COLORS.TEXT_PRIMARY,
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-lg border text-sm"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                borderColor: COLORS.BORDER_SUBTLE,
                color: COLORS.TEXT_PRIMARY,
              }}
            >
              <option value="updated">Recently Updated</option>
              <option value="created">Recently Created</option>
              <option value="name">Name (A-Z)</option>
            </select>
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="p-2 rounded-lg border transition-colors"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                borderColor: COLORS.BORDER_SUBTLE,
                color: COLORS.TEXT_PRIMARY,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
              }}
            >
              {viewMode === "grid" ? (
                <List className="h-4 w-4" />
              ) : (
                <Grid3X3 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Routines List/Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: COLORS.GOLDEN_ACCENT }} />
        </div>
      ) : sortedRoutines.length === 0 ? (
        <div className="p-8 rounded-lg border text-center" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
          <p style={{ color: COLORS.TEXT_SECONDARY }}>
            {searchTerm
              ? "No master library routines found matching your search."
              : "No master library routines available."}
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-3"
          }
        >
          {sortedRoutines.map((routine: any) => (
            <div
              key={routine.id}
              className="p-4 rounded-lg border transition-all duration-200 cursor-pointer"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                borderColor: COLORS.BORDER_SUBTLE,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Dumbbell className="h-4 w-4" style={{ color: COLORS.GREEN_PRIMARY }} />
                    <h3
                      className="font-semibold text-sm"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      {routine.name}
                    </h3>
                  </div>
                  {routine.description && (
                    <p
                      className="text-xs line-clamp-2 mb-2"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
                      {routine.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(routine);
                  }}
                  className="flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_DARK,
                    color: COLORS.TEXT_PRIMARY,
                    border: `1px solid ${COLORS.BORDER_SUBTLE}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_DARK;
                  }}
                >
                  <Eye className="h-3 w-3 inline mr-1" />
                  View
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAssign(routine);
                  }}
                  className="flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: COLORS.GREEN_PRIMARY,
                    color: "#000000",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.GREEN_DARK;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.GREEN_PRIMARY;
                  }}
                >
                  <Users className="h-3 w-3 inline mr-1" />
                  Assign
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Modal - Read-only routine details */}
      {/* Note: SeamlessRoutineModal doesn't support read-only mode, but master library routines should be view-only */}
      {/* Users can still view details but cannot edit */}
      {selectedRoutine && isViewModalOpen && fullRoutineDetails && (
        <SeamlessRoutineModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedRoutine(null);
          }}
          routine={{
            id: fullRoutineDetails.id,
            name: fullRoutineDetails.name,
            description: fullRoutineDetails.description ?? "",
            exercises: fullRoutineDetails.exercises.map((ex: any) => ({
              id: ex.id,
              title: ex.title,
              type: (ex.type as "exercise" | "drill" | "video" | "routine" | "superset") || "exercise",
              description: ex.description ?? "",
              notes: ex.notes ?? "",
              sets: ex.sets ?? undefined,
              reps: ex.reps ?? undefined,
              tempo: ex.tempo ?? undefined,
              duration: ex.duration ?? undefined,
              videoUrl: ex.videoUrl ?? undefined,
              videoId: ex.videoId ?? undefined,
              videoTitle: ex.videoTitle ?? undefined,
              videoThumbnail: ex.videoThumbnail ?? undefined,
              supersetId: ex.supersetId ?? undefined,
              supersetOrder: ex.supersetOrder ?? undefined,
              supersetDescription: ex.supersetDescription ?? undefined,
              coachInstructions: ex.coachInstructionsWhatToDo ? {
                whatToDo: ex.coachInstructionsWhatToDo ?? "",
                howToDoIt: ex.coachInstructionsHowToDoIt ?? "",
                keyPoints: ex.coachInstructionsKeyPoints ?? [],
                commonMistakes: ex.coachInstructionsCommonMistakes ?? [],
                equipment: ex.coachInstructionsEquipment ?? undefined,
                setup: ex.coachInstructionsSetup ?? undefined,
              } : undefined,
            })),
          }}
          onOpenVideoLibrary={() => {}}
          selectedVideoFromLibrary={null}
          onVideoProcessed={() => {}}
        />
      )}

      {/* Assign Modal */}
      {selectedRoutine && isAssignModalOpen && (
        <SimpleAssignRoutineModal
          isOpen={isAssignModalOpen}
          onClose={() => {
            setIsAssignModalOpen(false);
            setSelectedRoutine(null);
          }}
          routineId={selectedRoutine.id}
          routineName={selectedRoutine.name}
        />
      )}
    </>
  );
}

