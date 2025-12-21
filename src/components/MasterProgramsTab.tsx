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
  Calendar,
  Target,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { format } from "date-fns";
import ProgramDetailsModal from "./ProgramDetailsModal";
import SimpleAssignProgramModal from "./SimpleAssignProgramModal";

interface MasterProgramsTabProps {
  onAssignProgram?: (program: any) => void;
}

export default function MasterProgramsTab({
  onAssignProgram,
}: MasterProgramsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [sortBy, setSortBy] = useState("updated");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedProgram, setSelectedProgram] = useState<any | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Fetch master library programs
  const {
    data: masterPrograms = [],
    isLoading,
    error,
  } = trpc.programs.listMasterLibrary.useQuery({
    search: debouncedSearch || undefined,
    category: selectedCategory !== "All Categories" ? selectedCategory : undefined,
  });

  // Fetch program categories for filtering
  const { data: categories = [] } = trpc.programs.getCategories.useQuery();

  // Filter and sort programs
  const filteredPrograms = masterPrograms.filter((program: any) => {
    if (selectedCategory !== "All Categories" && program.level !== selectedCategory) {
      return false;
    }
    return true;
  });

  const sortedPrograms = [...filteredPrograms].sort((a: any, b: any) => {
    switch (sortBy) {
      case "updated":
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case "created":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "title":
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  // Fetch full program details when viewing
  const {
    data: fullProgramDetails,
    isLoading: detailsLoading,
  } = trpc.programs.getMasterLibraryById.useQuery(
    { programId: selectedProgram?.id || "" },
    { enabled: !!selectedProgram?.id && isDetailsModalOpen }
  );

  const handleViewDetails = (program: any) => {
    setSelectedProgram(program);
    setIsDetailsModalOpen(true);
  };

  const handleAssign = (program: any) => {
    setSelectedProgram(program);
    setIsAssignModalOpen(true);
  };

  if (error) {
    return (
      <div className="p-8 rounded-lg border" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="h-5 w-5" />
          <p>Error loading master library programs: {error.message}</p>
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
              placeholder="Search master library programs..."
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
              <option value="title">Title (A-Z)</option>
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

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory("All Categories")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === "All Categories" ? "" : ""
              }`}
              style={{
                backgroundColor:
                  selectedCategory === "All Categories"
                    ? COLORS.GOLDEN_DARK
                    : COLORS.BACKGROUND_CARD,
                color:
                  selectedCategory === "All Categories"
                    ? COLORS.TEXT_PRIMARY
                    : COLORS.TEXT_SECONDARY,
                border: `1px solid ${COLORS.BORDER_SUBTLE}`,
              }}
            >
              All Categories
            </button>
            {categories.map((cat: any) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === cat.name ? "" : ""
                }`}
                style={{
                  backgroundColor:
                    selectedCategory === cat.name
                      ? COLORS.GOLDEN_DARK
                      : COLORS.BACKGROUND_CARD,
                  color:
                    selectedCategory === cat.name
                      ? COLORS.TEXT_PRIMARY
                      : COLORS.TEXT_SECONDARY,
                  border: `1px solid ${COLORS.BORDER_SUBTLE}`,
                }}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Programs List/Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: COLORS.GOLDEN_ACCENT }} />
        </div>
      ) : sortedPrograms.length === 0 ? (
        <div className="p-8 rounded-lg border text-center" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
          <p style={{ color: COLORS.TEXT_SECONDARY }}>
            {searchTerm
              ? "No master library programs found matching your search."
              : "No master library programs available."}
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
          {sortedPrograms.map((program: any) => (
            <div
              key={program.id}
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
                  <h3
                    className="font-semibold text-sm mb-1"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    {program.title}
                  </h3>
                  {program.description && (
                    <p
                      className="text-xs line-clamp-2 mb-2"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
                      {program.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 mb-3 text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                {program.level && (
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    <span>{program.level}</span>
                  </div>
                )}
                {program.duration && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{program.duration} week{program.duration !== 1 ? "s" : ""}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(program);
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
                    handleAssign(program);
                  }}
                  className="flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: COLORS.GOLDEN_ACCENT,
                    color: "#000000",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.GOLDEN_HOVER;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
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

      {/* Details Modal */}
      {selectedProgram && isDetailsModalOpen && (
        <ProgramDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedProgram(null);
          }}
          program={fullProgramDetails || selectedProgram}
        />
      )}

      {/* Assign Modal */}
      {selectedProgram && isAssignModalOpen && (
        <SimpleAssignProgramModal
          isOpen={isAssignModalOpen}
          onClose={() => {
            setIsAssignModalOpen(false);
            setSelectedProgram(null);
          }}
          programId={selectedProgram.id}
          clientId={undefined}
          clientName={undefined}
        />
      )}
    </>
  );
}

