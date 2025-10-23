"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import { useUIStore } from "@/lib/stores/uiStore";
import { Calendar, Users, Target, X, Search } from "lucide-react";
import { format } from "date-fns";

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
  const { data: clients = [] } = trpc.clients.list.useQuery({
    archived: false,
  });

  // Sort clients alphabetically by name
  const sortedClients = [...clients].sort((a, b) =>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="bg-[#2A3133] rounded-2xl shadow-2xl border max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
        style={{ borderColor: "#606364" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: "#606364" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "#10B981" }}
            >
              <Target className="h-6 w-6" style={{ color: "#f0fdf4" }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "#C3BCC2" }}>
                Assign Routine
              </h2>
              <p className="text-sm" style={{ color: "#ABA4AA" }}>
                Assign standalone routines to clients for extra training
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all duration-300 hover:bg-gray-600"
            style={{ color: "#ABA4AA" }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Mode Toggle */}
          <div
            className="flex rounded-xl border overflow-hidden mb-6"
            style={{ borderColor: "#606364" }}
          >
            <button
              onClick={() => setViewMode("assign")}
              className={`px-6 py-3 transition-all duration-300 flex items-center justify-center gap-2 ${
                viewMode === "assign" ? "font-medium" : ""
              }`}
              style={{
                backgroundColor: viewMode === "assign" ? "#10B981" : "#353A3A",
                color: viewMode === "assign" ? "#f0fdf4" : "#C3BCC2",
              }}
            >
              <Target className="h-4 w-4" />
              Assign Routine
            </button>
            <button
              onClick={() => setViewMode("manage")}
              className={`px-6 py-3 transition-all duration-300 flex items-center justify-center gap-2 ${
                viewMode === "manage" ? "font-medium" : ""
              }`}
              style={{
                backgroundColor: viewMode === "manage" ? "#10B981" : "#353A3A",
                color: viewMode === "manage" ? "#f0fdf4" : "#C3BCC2",
              }}
            >
              <Users className="h-4 w-4" />
              Manage Assignments
            </button>
          </div>

          {viewMode === "assign" ? (
            <div className="space-y-6">
              {/* Routine Selection */}
              <div>
                <label
                  className="block text-sm font-medium mb-3"
                  style={{ color: "#C3BCC2" }}
                >
                  Select Routine
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {routines.map(routine => (
                    <div
                      key={routine.id}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                        selectedRoutine === routine.id
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-gray-600 hover:border-gray-500"
                      }`}
                      style={{
                        backgroundColor:
                          selectedRoutine === routine.id
                            ? "#10B981"
                            : "#353A3A",
                        borderColor:
                          selectedRoutine === routine.id
                            ? "#10B981"
                            : "#606364",
                      }}
                      onClick={() => setSelectedRoutine(routine.id)}
                    >
                      <h3
                        className="font-semibold mb-2 transition-colors duration-300"
                        style={{
                          color:
                            selectedRoutine === routine.id
                              ? "#000000"
                              : "#C3BCC2",
                        }}
                      >
                        {routine.name}
                      </h3>
                      <p
                        className="text-sm mb-3 transition-colors duration-300"
                        style={{
                          color:
                            selectedRoutine === routine.id
                              ? "#1f2937"
                              : "#ABA4AA",
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
                                ? "#000000"
                                : "#10B981",
                            color:
                              selectedRoutine === routine.id
                                ? "#ffffff"
                                : "#f0fdf4",
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
                  style={{ color: "#C3BCC2" }}
                >
                  Select Clients
                </label>
                <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                  {sortedClients.map(client => (
                    <div
                      key={client.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all duration-300 ${
                        selectedClients.includes(client.id)
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-gray-600 hover:border-gray-500"
                      }`}
                      style={{
                        backgroundColor: selectedClients.includes(client.id)
                          ? "#10B981"
                          : "#353A3A",
                        borderColor: selectedClients.includes(client.id)
                          ? "#10B981"
                          : "#606364",
                      }}
                      onClick={() => toggleClientSelection(client.id)}
                    >
                      <div className="text-center">
                        <h4
                          className="font-medium text-sm mb-1 transition-colors duration-300"
                          style={{
                            color: selectedClients.includes(client.id)
                              ? "#000000"
                              : "#C3BCC2",
                          }}
                        >
                          {client.name}
                        </h4>
                        <p
                          className="text-xs transition-colors duration-300"
                          style={{
                            color: selectedClients.includes(client.id)
                              ? "#1f2937"
                              : "#ABA4AA",
                          }}
                        >
                          {client.email}
                        </p>
                        {selectedClients.includes(client.id) && (
                          <div className="mt-2 animate-pulse">
                            <span className="text-black font-semibold text-xs">
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
                  style={{ color: "#C3BCC2" }}
                >
                  Start Date
                </label>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5" style={{ color: "#ABA4AA" }} />
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    min="2020-01-01"
                    className="px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500"
                    style={{
                      backgroundColor: "#353A3A",
                      borderColor: "#606364",
                      color: "#C3BCC2",
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl transition-all duration-300 font-medium"
                  style={{
                    backgroundColor: "#353A3A",
                    color: "#C3BCC2",
                    borderColor: "#606364",
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
                    backgroundColor: "#10B981",
                    color: "#f0fdf4",
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
                  style={{ color: "#C3BCC2" }}
                >
                  Select Routine to Manage
                </label>
                <select
                  value={selectedRoutine}
                  onChange={e => setSelectedRoutine(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{
                    backgroundColor: "#353A3A",
                    borderColor: "#606364",
                    color: "#C3BCC2",
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
                    style={{ color: "#C3BCC2" }}
                  >
                    Current Assignments
                  </h3>
                  {routineAssignments.length === 0 ? (
                    <div className="text-center py-8">
                      <Users
                        className="h-12 w-12 mx-auto mb-4"
                        style={{ color: "#ABA4AA" }}
                      />
                      <p style={{ color: "#ABA4AA" }}>
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
                            backgroundColor: "#353A3A",
                            borderColor: "#606364",
                          }}
                        >
                          <div className="text-center">
                            <h4
                              className="font-medium mb-1"
                              style={{ color: "#C3BCC2" }}
                            >
                              {assignment.client.name}
                            </h4>
                            <p
                              className="text-sm mb-2"
                              style={{ color: "#ABA4AA" }}
                            >
                              {assignment.client.email}
                            </p>
                            <p
                              className="text-xs mb-3"
                              style={{ color: "#ABA4AA" }}
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
                              className="px-3 py-1 rounded-lg transition-all duration-300 hover:bg-red-500/10 text-xs hover:scale-105"
                              style={{ color: "#EF4444" }}
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
