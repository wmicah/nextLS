"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import { useUIStore } from "@/lib/stores/uiStore";
import { Calendar, Users, Target, X, Search } from "lucide-react";
import { format } from "date-fns";
import { COLORS } from "@/lib/colors";

interface AssignRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  routineId?: string;
  routineName?: string;
  clientId?: string;
  clientName?: string;
  startDate?: string; // Pre-filled start date
}

interface Client {
  id: string;
  name: string;
  email: string | null;
  avatar?: string | null;
  programAssignments: {
    id: string;
    programId: string;
    assignedAt: string;
    progress: number;
    program: {
      id: string;
      title: string;
    };
  }[];
}

export default function AssignRoutineModal({
  isOpen,
  onClose,
  routineId,
  clientId,
  startDate: propStartDate,
}: AssignRoutineModalProps) {
  const [selectedRoutine, setSelectedRoutine] = useState<string>(
    routineId || ""
  );

  // Update selectedRoutine when routineId prop changes
  useEffect(() => {
    if (routineId) {
      setSelectedRoutine(routineId);
    }
  }, [routineId]);

  const [selectedClients, setSelectedClients] = useState<string[]>(
    clientId ? [clientId] : []
  );
  const [startDate, setStartDate] = useState<string>(() => {
    if (propStartDate) {
      return propStartDate;
    }
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  // Update startDate when propStartDate changes
  useEffect(() => {
    if (propStartDate) {
      console.log(
        "AssignRoutineModal: propStartDate changed to:",
        propStartDate
      );
      setStartDate(propStartDate);
    }
  }, [propStartDate]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [viewMode, setViewMode] = useState<"assign" | "manage">("assign");

  const { addToast } = useUIStore();
  const utils = trpc.useUtils();

  // Get all routines
  const { data: routines = [] } = trpc.routines.list.useQuery();

  // Get all active clients (exclude archived)
  const { data: clientsData = [] } = trpc.clients.list.useQuery({
    archived: false,
  });
  // Typed list to avoid "type instantiation is excessively deep" from tRPC inference
  const clients: Client[] = (clientsData as Client[]) ?? [];

  // Sort clients alphabetically by name
  const sortedClients: Client[] = [...clients].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "")
  );

  // Get selected routine details
  const { data: selectedRoutineData } = trpc.routines.get.useQuery(
    { id: selectedRoutine },
    { enabled: !!selectedRoutine }
  );

  // Get routine assignments for the selected routine
  const { data: routineAssignments = [] } =
    trpc.routines.getRoutineAssignments.useQuery(
      { routineId: selectedRoutine },
      { enabled: !!selectedRoutine }
    );

  // Assignment mutation
  const assignRoutineMutation = trpc.routines.assign.useMutation({
    onSuccess: data => {
      addToast({
        type: "success",
        title: "Routine assigned successfully",
        message: `Routine has been assigned to ${data.assignedCount} client(s).`,
      });

      // Invalidate and refetch data
      utils.clients.list.invalidate();
      utils.routines.list.invalidate();
      if (selectedRoutine) {
        utils.routines.getRoutineAssignments.invalidate({
          routineId: selectedRoutine,
        });
      }
      // Invalidate calendar queries to refresh routine assignments
      utils.routines.getRoutineAssignmentsForCalendar.invalidate();
      utils.routines.getClientRoutineAssignments.invalidate();

      setIsAssigning(false);
      onClose();
    },
    onError: error => {
      addToast({
        type: "error",
        title: "Assignment failed",
        message: error.message || "Failed to assign routine to clients.",
      });
      setIsAssigning(false);
    },
  });

  // Unassignment mutation
  const unassignRoutineMutation = trpc.routines.unassign.useMutation({
    onSuccess: data => {
      addToast({
        type: "success",
        title: "Routine unassigned successfully",
        message: `Routine has been unassigned from ${data.unassignedCount} client(s).`,
      });

      // Invalidate and refetch data
      utils.clients.list.invalidate();
      utils.routines.list.invalidate();
      if (selectedRoutine) {
        utils.routines.getRoutineAssignments.invalidate({
          routineId: selectedRoutine,
        });
      }
      // Invalidate calendar queries to refresh routine assignments
      utils.routines.getRoutineAssignmentsForCalendar.invalidate();
      utils.routines.getClientRoutineAssignments.invalidate();
    },
    onError: error => {
      addToast({
        type: "error",
        title: "Unassignment failed",
        message: error.message || "Failed to unassign routine from clients.",
      });
    },
  });

  const handleAssign = async () => {
    if (!selectedRoutine) {
      addToast({
        type: "error",
        title: "No routine selected",
        message: "Please select a routine to assign.",
      });
      return;
    }

    if (selectedClients.length === 0) {
      addToast({
        type: "error",
        title: "No clients selected",
        message: "Please select at least one client to assign the routine to.",
      });
      return;
    }

    if (!startDate) {
      addToast({
        type: "error",
        title: "Start date required",
        message: "Please select a start date for the routine.",
      });
      return;
    }

    const requestData = {
      routineId: selectedRoutine,
      clientIds: selectedClients,
      startDate: startDate,
    };

    console.log("AssignRoutineModal: Current startDate state:", startDate);
    console.log("AssignRoutineModal: propStartDate prop:", propStartDate);
    console.log("Sending routine assignment request:", requestData);

    setIsAssigning(true);
    assignRoutineMutation.mutate(requestData);
  };

  const handleUnassign = (clientIds: string[]) => {
    if (!selectedRoutine) return;

    if (
      confirm(
        `Are you sure you want to unassign this routine from ${clientIds.length} client(s)?`
      )
    ) {
      unassignRoutineMutation.mutate({
        routineId: selectedRoutine,
        clientIds,
      });
    }
  };

  const toggleClientSelection = (clientId: string) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
    >
      <div
        className="rounded-2xl shadow-2xl border max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
        style={{
          backgroundColor: "#1C2021",
          borderColor: COLORS.BORDER_SUBTLE,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div className="flex items-center gap-3">
            <div>
              <h2
                className="text-2xl font-bold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Assign Routine
              </h2>
              <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                Assign standalone routines to clients for extra training
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all duration-300"
            style={{
              color: COLORS.TEXT_SECONDARY,
              backgroundColor: "transparent",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "#2A2F2F";
              e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
            }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Mode Toggle */}
          <div
            className="flex rounded-xl border overflow-hidden mb-6"
            style={{ borderColor: COLORS.BORDER_SUBTLE }}
          >
            <button
              onClick={() => setViewMode("assign")}
              className={`px-6 py-3 transition-all duration-300 flex items-center justify-center gap-2 ${
                viewMode === "assign" ? "font-medium" : ""
              }`}
              style={{
                backgroundColor:
                  viewMode === "assign" ? COLORS.GREEN_DARK : "#2A2F2F",
                color:
                  viewMode === "assign"
                    ? COLORS.TEXT_PRIMARY
                    : COLORS.TEXT_SECONDARY,
              }}
            >
              Assign Routine
            </button>
            <button
              onClick={() => setViewMode("manage")}
              className={`px-6 py-3 transition-all duration-300 flex items-center justify-center gap-2 ${
                viewMode === "manage" ? "font-medium" : ""
              }`}
              style={{
                backgroundColor:
                  viewMode === "manage" ? COLORS.GREEN_DARK : "#2A2F2F",
                color:
                  viewMode === "manage"
                    ? COLORS.TEXT_PRIMARY
                    : COLORS.TEXT_SECONDARY,
              }}
            >
              Manage Assignments
            </button>
          </div>

          {viewMode === "assign" ? (
            <div className="space-y-6">
              {/* Routine Selection */}
              <div>
                <label
                  className="block text-sm font-medium mb-3"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Select Routine
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {routines.map(routine => (
                    <div
                      key={routine.id}
                      className="p-4 rounded-xl border cursor-pointer transition-all duration-300"
                      style={{
                        backgroundColor:
                          selectedRoutine === routine.id
                            ? COLORS.GREEN_DARK
                            : "#2A2F2F",
                        borderColor:
                          selectedRoutine === routine.id
                            ? COLORS.GREEN_DARK
                            : COLORS.BORDER_SUBTLE,
                      }}
                      onMouseEnter={e => {
                        if (selectedRoutine !== routine.id) {
                          e.currentTarget.style.backgroundColor = "#353A3A";
                          e.currentTarget.style.borderColor = COLORS.GREEN_DARK;
                        }
                      }}
                      onMouseLeave={e => {
                        if (selectedRoutine !== routine.id) {
                          e.currentTarget.style.backgroundColor = "#2A2F2F";
                          e.currentTarget.style.borderColor =
                            COLORS.BORDER_SUBTLE;
                        }
                      }}
                      onClick={() => setSelectedRoutine(routine.id)}
                    >
                      <h3
                        className="font-semibold mb-2 transition-colors duration-300"
                        style={{
                          color:
                            selectedRoutine === routine.id
                              ? COLORS.TEXT_PRIMARY
                              : COLORS.TEXT_PRIMARY,
                        }}
                      >
                        {routine.name}
                      </h3>
                      <p
                        className="text-sm mb-3 transition-colors duration-300"
                        style={{
                          color:
                            selectedRoutine === routine.id
                              ? COLORS.TEXT_SECONDARY
                              : COLORS.TEXT_SECONDARY,
                        }}
                      >
                        {routine.description || "No description"}
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs px-2 py-1 rounded transition-all duration-300"
                          style={{
                            backgroundColor:
                              selectedRoutine === routine.id
                                ? COLORS.BACKGROUND_DARK
                                : COLORS.GREEN_DARK,
                            color:
                              selectedRoutine === routine.id
                                ? COLORS.TEXT_PRIMARY
                                : COLORS.TEXT_PRIMARY,
                          }}
                        >
                          {routine.exercises.length} exercises
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Client Selection */}
              <div>
                <label
                  className="block text-sm font-medium mb-3"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Select Clients
                </label>
                <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                  {sortedClients.map(client => (
                    <div
                      key={client.id}
                      className="p-3 rounded-lg border cursor-pointer transition-all duration-300"
                      style={{
                        backgroundColor: selectedClients.includes(client.id)
                          ? COLORS.GREEN_DARK
                          : "#2A2F2F",
                        borderColor: selectedClients.includes(client.id)
                          ? COLORS.GREEN_DARK
                          : COLORS.BORDER_SUBTLE,
                      }}
                      onMouseEnter={e => {
                        if (!selectedClients.includes(client.id)) {
                          e.currentTarget.style.backgroundColor = "#353A3A";
                          e.currentTarget.style.borderColor = COLORS.GREEN_DARK;
                        }
                      }}
                      onMouseLeave={e => {
                        if (!selectedClients.includes(client.id)) {
                          e.currentTarget.style.backgroundColor = "#2A2F2F";
                          e.currentTarget.style.borderColor =
                            COLORS.BORDER_SUBTLE;
                        }
                      }}
                      onClick={() => toggleClientSelection(client.id)}
                    >
                      <div className="text-center">
                        <h4
                          className="font-medium text-sm mb-1 transition-colors duration-300"
                          style={{
                            color: COLORS.TEXT_PRIMARY,
                          }}
                        >
                          {client.name}
                        </h4>
                        <p
                          className="text-xs transition-colors duration-300"
                          style={{
                            color: COLORS.TEXT_SECONDARY,
                          }}
                        >
                          {client.email}
                        </p>
                        {selectedClients.includes(client.id) && (
                          <div className="mt-2 animate-pulse">
                            <span
                              className="font-semibold text-xs"
                              style={{ color: COLORS.TEXT_PRIMARY }}
                            >
                              ✓ Selected
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label
                  className="block text-sm font-medium mb-3"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Start Date
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    min="2020-01-01"
                    className="px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: "#2A2F2F",
                      borderColor: COLORS.BORDER_SUBTLE,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl transition-all duration-300 font-medium border"
                  style={{
                    backgroundColor: "transparent",
                    color: COLORS.TEXT_PRIMARY,
                    borderColor: COLORS.BORDER_SUBTLE,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = "#2A2F2F";
                    e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={
                    isAssigning ||
                    !selectedRoutine ||
                    selectedClients.length === 0
                  }
                  className="px-6 py-3 rounded-xl transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: COLORS.GREEN_DARK,
                    color: COLORS.TEXT_PRIMARY,
                  }}
                  onMouseEnter={e => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor =
                        COLORS.GREEN_PRIMARY;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = COLORS.GREEN_DARK;
                    }
                  }}
                >
                  {isAssigning ? "Assigning..." : "Assign Routine"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Routine Selection for Management */}
              <div>
                <label
                  className="block text-sm font-medium mb-3"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Select Routine to Manage
                </label>
                <select
                  value={selectedRoutine}
                  onChange={e => setSelectedRoutine(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: "#2A2F2F",
                    borderColor: COLORS.BORDER_SUBTLE,
                    color: COLORS.TEXT_PRIMARY,
                  }}
                >
                  <option value="">Select a routine...</option>
                  {routines.map(routine => (
                    <option key={routine.id} value={routine.id}>
                      {routine.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Assignments */}
              {selectedRoutine && (
                <div>
                  <h3
                    className="text-lg font-semibold mb-4"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    Current Assignments
                  </h3>
                  {routineAssignments.length === 0 ? (
                    <div className="text-center py-8">
                      <p style={{ color: COLORS.TEXT_SECONDARY }}>
                        No clients assigned to this routine yet.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {routineAssignments.map(assignment => (
                        <div
                          key={assignment.id}
                          className="p-4 rounded-lg border"
                          style={{
                            backgroundColor: "#2A2F2F",
                            borderColor: COLORS.BORDER_SUBTLE,
                          }}
                        >
                          <div className="text-center">
                            <h4
                              className="font-medium mb-1"
                              style={{ color: COLORS.TEXT_PRIMARY }}
                            >
                              {assignment.client.name}
                            </h4>
                            <p
                              className="text-sm mb-2"
                              style={{ color: COLORS.TEXT_SECONDARY }}
                            >
                              {assignment.client.email}
                            </p>
                            <p
                              className="text-xs mb-3"
                              style={{ color: COLORS.TEXT_SECONDARY }}
                            >
                              Assigned{" "}
                              {format(
                                new Date(assignment.assignedAt),
                                "MMM dd, yyyy"
                              )}
                            </p>
                            <button
                              onClick={() =>
                                handleUnassign([assignment.clientId])
                              }
                              className="px-3 py-1 rounded-lg transition-all duration-300 text-xs"
                              style={{
                                color: COLORS.RED_ALERT,
                                backgroundColor: "transparent",
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor =
                                  COLORS.RED_ALERT + "20";
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor =
                                  "transparent";
                              }}
                            >
                              Unassign
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
