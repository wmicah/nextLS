"use client";

import { useState, useEffect } from "react";
import { X, Search, BookOpen } from "lucide-react";
import { trpc } from "@/app/_trpc/client";
import { useToast } from "@/lib/hooks/use-toast";
import { COLORS } from "@/lib/colors";

interface QuickAssignProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  startDate: string;
}

export default function QuickAssignProgramModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  startDate,
}: QuickAssignProgramModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Get all programs
  const { data: programs = [] } = trpc.programs.list.useQuery();

  // Assignment mutation
  const assignProgramMutation = trpc.programs.assignToClients.useMutation({
    onSuccess: () => {
      toast({
        title: "Program Assigned!",
        description: `Program has been assigned to ${clientName}.`,
      });
      // Invalidate relevant queries to refresh the UI
      utils.clients.list.invalidate();
      utils.clients.getById.invalidate({ id: clientId });
      utils.clients.getAssignedPrograms.invalidate({ clientId });
      utils.library.getClientAssignments.invalidate({ clientId });
      utils.scheduling.getCoachSchedule.invalidate();
      utils.scheduling.getCoachUpcomingLessons.invalidate();
      utils.events.getUpcoming.invalidate();
      utils.programs.list.invalidate();
      onClose();
    },
    onError: error => {
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign program.",
        variant: "destructive",
      });
      setIsAssigning(false);
    },
  });

  // Filter programs based on search term
  const filteredPrograms = programs.filter(
    program =>
      program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.level.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (program.description &&
        program.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle program selection and immediate assignment
  const handleProgramSelect = (program: any) => {
    if (isAssigning) return;

    setIsAssigning(true);
    assignProgramMutation.mutate({
      programId: program.id,
      clientIds: [clientId],
      startDate: startDate,
      repetitions: 1,
    });
  };

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setIsAssigning(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}>
      <div
        className="rounded-2xl shadow-xl border w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: "#1C2021",
          borderColor: COLORS.BORDER_SUBTLE,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 p-6 pb-0">
          <div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: COLORS.TEXT_PRIMARY }}>
              Quick Assign Program
            </h2>
            <p style={{ color: COLORS.TEXT_SECONDARY }}>
              Assign a program to {clientName} for{" "}
              {new Date(startDate).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: COLORS.TEXT_SECONDARY }}
            onMouseEnter={(e) => e.currentTarget.style.color = COLORS.TEXT_PRIMARY}
            onMouseLeave={(e) => e.currentTarget.style.color = COLORS.TEXT_SECONDARY}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search programs by name, level, or description..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: "#2A2F2F",
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
                  focusRingColor: COLORS.GOLDEN_ACCENT + "50"
                }}
              />
            </div>
            {searchTerm && (
              <p className="text-sm mt-2" style={{ color: COLORS.TEXT_SECONDARY }}>
                {filteredPrograms.length} program
                {filteredPrograms.length !== 1 ? "s" : ""} found
              </p>
            )}
          </div>

          {/* Programs List */}
          <div className="space-y-2">
            {filteredPrograms.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-lg font-semibold mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
                  {searchTerm ? "No Programs Found" : "No Programs Available"}
                </div>
                <p style={{ color: COLORS.TEXT_SECONDARY }}>
                  {searchTerm
                    ? `No programs match "${searchTerm}"`
                    : "There are no programs available to assign."}
                </p>
              </div>
            ) : (
              filteredPrograms.map(program => (
                <div
                  key={program.id}
                  onClick={() => handleProgramSelect(program)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                    isAssigning
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:scale-[1.01]"
                  }`}
                  style={{
                    backgroundColor: "#2A2F2F",
                    borderColor: COLORS.BORDER_SUBTLE,
                  }}
                  onMouseEnter={(e) => {
                    if (!isAssigning) {
                      e.currentTarget.style.backgroundColor = "#353A3A";
                      e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isAssigning) {
                      e.currentTarget.style.backgroundColor = "#2A2F2F";
                      e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate" style={{ color: COLORS.TEXT_PRIMARY }}>
                          {program.title}
                        </div>
                      </div>
                    </div>
                    <div className="ml-3 flex-shrink-0">
                      <div className="text-sm font-medium" style={{ color: COLORS.GOLDEN_ACCENT }}>
                        {isAssigning ? "Assigning..." : "Click to Assign"}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
