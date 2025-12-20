"use client";

import { useState, useEffect } from "react";
import { X, Search, Target } from "lucide-react";
import { trpc } from "@/app/_trpc/client";
import { useToast } from "@/lib/hooks/use-toast";
import { COLORS, getGoldenAccent } from "@/lib/colors";

interface QuickAssignRoutineFromDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  startDate: string;
}

export default function QuickAssignRoutineFromDayModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  startDate,
}: QuickAssignRoutineFromDayModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Get all routines
  const { data: routines = [] } = trpc.routines.list.useQuery();

  // Assignment mutation
  const assignRoutineMutation = trpc.routines.assign.useMutation({
    onSuccess: () => {
      toast({
        title: "Routine Assigned!",
        description: `Routine has been assigned to ${clientName}.`,
      });
      // Invalidate relevant queries to refresh the UI
      utils.clients.list.invalidate();
      utils.clients.getById.invalidate({ id: clientId });
      utils.clients.getAssignedPrograms.invalidate({ clientId });
      utils.library.getClientAssignments.invalidate({ clientId });
      utils.scheduling.getCoachSchedule.invalidate();
      utils.scheduling.getCoachUpcomingLessons.invalidate();
      utils.events.getUpcoming.invalidate();
      utils.routines.list.invalidate();
      onClose();
    },
    onError: error => {
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign routine.",
        variant: "destructive",
      });
      setIsAssigning(false);
    },
  });

  // Filter routines based on search term
  const filteredRoutines = routines.filter(
    routine =>
      routine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (routine.description &&
        routine.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle routine selection and immediate assignment
  const handleRoutineSelect = (routine: any) => {
    if (isAssigning) return;

    setIsAssigning(true);
    assignRoutineMutation.mutate({
      routineId: routine.id,
      clientIds: [clientId],
      startDate: startDate,
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
              Assign Routine
            </h2>
            <p style={{ color: COLORS.TEXT_SECONDARY }}>
              Assign a routine to {clientName} for{" "}
              {new Date(startDate + "T00:00:00").toLocaleDateString()}
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
                placeholder="Search routines by name or description..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: "#2A2F2F",
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
                  focusRingColor: COLORS.GREEN_DARK + "50"
                }}
              />
            </div>
            {searchTerm && (
              <p className="text-sm mt-2" style={{ color: COLORS.TEXT_SECONDARY }}>
                {filteredRoutines.length} routine
                {filteredRoutines.length !== 1 ? "s" : ""} found
              </p>
            )}
          </div>

          {/* Routines List */}
          <div className="space-y-2">
            {filteredRoutines.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-lg font-semibold mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
                  {searchTerm ? "No Routines Found" : "No Routines Available"}
                </div>
                <p style={{ color: COLORS.TEXT_SECONDARY }}>
                  {searchTerm
                    ? `No routines match "${searchTerm}"`
                    : "There are no routines available to assign."}
                </p>
              </div>
            ) : (
              filteredRoutines.map(routine => (
                <div
                  key={routine.id}
                  onClick={() => handleRoutineSelect(routine)}
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
                      e.currentTarget.style.borderColor = COLORS.GREEN_DARK;
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
                          {routine.name}
                        </div>
                      </div>
                    </div>
                    <div className="ml-3 flex-shrink-0">
                      <div className="text-sm font-medium" style={{ color: COLORS.GREEN_PRIMARY }}>
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
