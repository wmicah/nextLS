"use client";

import { useState, useEffect } from "react";
import { X, Search, Target } from "lucide-react";
import { trpc } from "@/app/_trpc/client";
import { useToast } from "@/lib/hooks/use-toast";

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

  // Get all routines
  const { data: routines = [] } = trpc.routines.list.useQuery();

  // Assignment mutation
  const assignRoutineMutation = trpc.routines.assign.useMutation({
    onSuccess: () => {
      toast({
        title: "Routine Assigned!",
        description: `Routine has been assigned to ${clientName}.`,
      });
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-2xl shadow-xl border w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 p-6 pb-0">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Assign Routine
            </h2>
            <p className="text-gray-400">
              Assign a routine to {clientName} for{" "}
              {new Date(startDate + "T00:00:00").toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search routines by name or description..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                style={{
                  backgroundColor: "#2A3133",
                  borderColor: "#606364",
                }}
              />
            </div>
            {searchTerm && (
              <p className="text-gray-400 text-sm mt-2">
                {filteredRoutines.length} routine
                {filteredRoutines.length !== 1 ? "s" : ""} found
              </p>
            )}
          </div>

          {/* Routines List */}
          <div className="space-y-3">
            {filteredRoutines.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-lg font-semibold text-white mb-2">
                  {searchTerm ? "No Routines Found" : "No Routines Available"}
                </div>
                <p className="text-gray-400">
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
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    isAssigning
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:scale-[1.02] hover:shadow-lg"
                  }`}
                  style={{
                    backgroundColor: "#2A3133",
                    borderColor: "#606364",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <Target className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {routine.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          {routine.exercises?.length || 0} exercise
                          {(routine.exercises?.length || 0) !== 1 ? "s" : ""}
                        </div>
                        {routine.description && (
                          <div className="text-sm text-gray-500 mt-1">
                            {routine.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-400">
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

