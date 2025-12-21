"use client";

import { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import { COLORS, getGoldenAccent } from "@/lib/colors";
import {
  Users,
  AlertCircle,
  Loader2,
} from "lucide-react";
import MasterProgramViewer from "./MasterProgramViewer";
import SimpleAssignProgramModal from "./SimpleAssignProgramModal";

interface MasterProgramsTabProps {
  onAssignProgram?: (program: any) => void;
}

export default function MasterProgramsTab({
  onAssignProgram,
}: MasterProgramsTabProps) {
  const [selectedProgram, setSelectedProgram] = useState<any | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Fetch master library programs
  const {
    data: masterPrograms = [],
    isLoading,
    error,
    refetch: refetchPrograms,
  } = trpc.programs.listMasterLibrary.useQuery(
    {},
    {
      staleTime: 2 * 60 * 1000, // Cache for 2 minutes
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: true, // Refetch on mount to get latest data
      refetchOnReconnect: true, // Refetch on reconnect
    }
  );

  // Sort programs by most recently updated
  const sortedPrograms = [...masterPrograms].sort((a: any, b: any) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const handleViewDetails = (program: any) => {
    setSelectedProgram(program);
    setIsViewerOpen(true);
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
      {/* Programs List/Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: COLORS.GOLDEN_ACCENT }} />
        </div>
      ) : sortedPrograms.length === 0 ? (
        <div className="p-8 rounded-lg border text-center" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
          <p style={{ color: COLORS.TEXT_SECONDARY }}>
            No master library programs available.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <span>{program.level}</span>
                  </div>
                )}
                {program.duration && (
                  <div className="flex items-center gap-1">
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
                  Assign
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Program Viewer Modal */}
      {selectedProgram && (
        <MasterProgramViewer
          isOpen={isViewerOpen}
          onClose={() => {
            setIsViewerOpen(false);
            setSelectedProgram(null);
          }}
          programId={selectedProgram.id}
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

