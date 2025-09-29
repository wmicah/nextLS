"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import { useUIStore } from "@/lib/stores/uiStore";
import {
  Calendar,
  Users,
  Target,
  X,
  BookOpen,
  CheckCircle,
  Plus,
  Trash2,
  User,
  Mail,
  Clock,
  ArrowRight,
  Search,
} from "lucide-react";
import { format } from "date-fns";

interface SimpleAssignRoutineModalProps {
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
  routineAssignments: {
    id: string;
    routineId: string;
    assignedAt: string;
    progress: number;
    routine: {
      id: string;
      name: string;
    };
  }[];
}

export default function SimpleAssignRoutineModal({
  isOpen,
  onClose,
  routineId,
  clientId,
  startDate: propStartDate,
}: SimpleAssignRoutineModalProps) {
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

  // Update selectedClients when clientId prop changes
  useEffect(() => {
    if (clientId) {
      setSelectedClients([clientId]);
    }
  }, [clientId]);
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
      setStartDate(propStartDate);
    }
  }, [propStartDate]);

  const [isAssigning, setIsAssigning] = useState(false);
  const [viewMode, setViewMode] = useState<"assign" | "manage">("assign");
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [routineSearchTerm, setRoutineSearchTerm] = useState("");

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

  // Filter routines based on search term
  const filteredRoutines = routines.filter(
    routine =>
      routine.name.toLowerCase().includes(routineSearchTerm.toLowerCase()) ||
      (routine.description &&
        routine.description
          .toLowerCase()
          .includes(routineSearchTerm.toLowerCase()))
  );

  // Filter clients based on search term
  const filteredClients = sortedClients.filter(
    client =>
      client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      (client.email &&
        client.email.toLowerCase().includes(clientSearchTerm.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-2xl shadow-xl border w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: "#606364" }}
        >
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {viewMode === "assign" ? "Assign Routine" : "Manage Routine"}
            </h2>
            <p className="text-gray-400 text-sm">
              {viewMode === "assign"
                ? "Choose a routine and assign it to clients"
                : "View and manage routine assignments"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                setViewMode(viewMode === "assign" ? "manage" : "assign")
              }
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: "#4A5A70",
                color: "#FFFFFF",
                border: "1px solid #606364",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = "#606364";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "#4A5A70";
              }}
            >
              {viewMode === "assign" ? "Manage" : "Assign"}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-700/50"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {viewMode === "assign" ? (
            /* Assignment Mode */
            <div className="space-y-6">
              {/* Step 1: Select Routine */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-400" />
                  Step 1: Choose a Routine
                </h3>

                {/* Routine Search */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search routines by title or description..."
                      value={routineSearchTerm}
                      onChange={e => setRoutineSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Routines Grid */}
                <div
                  className="border border-gray-600/30 rounded-lg p-4 bg-gray-800/20 max-h-96 overflow-y-auto"
                  style={{ borderColor: "#606364" }}
                >
                  {filteredRoutines.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-lg font-semibold text-white mb-2">
                        {routines.length === 0
                          ? "No Routines Available"
                          : "No Routines Found"}
                      </div>
                      <p className="text-gray-400">
                        {routines.length === 0
                          ? "There are no routines available to assign."
                          : "Try adjusting your search terms."}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredRoutines.map(routine => (
                        <div
                          key={routine.id}
                          onClick={() => setSelectedRoutine(routine.id)}
                          className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                            selectedRoutine === routine.id
                              ? "border-green-400 bg-green-500/20"
                              : "border-gray-600/30 hover:border-green-400/50"
                          }`}
                          style={{
                            backgroundColor:
                              selectedRoutine === routine.id
                                ? "#10B98120"
                                : "#2A3133",
                            borderColor:
                              selectedRoutine === routine.id
                                ? "#10B981"
                                : "#606364",
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-white text-sm">
                              {routine.name}
                            </h4>
                            {selectedRoutine === routine.id && (
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            )}
                          </div>
                          <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                            {routine.description}
                          </p>
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3 text-green-400" />
                            <span className="text-xs text-gray-400">
                              {routine.exercises?.length || 0} exercises
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Select Clients */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-400" />
                  {clientId
                    ? "Step 2: Client Selected"
                    : "Step 2: Choose Clients"}
                </h3>

                {/* Client Search - Only show if no specific client is pre-selected */}
                {!clientId && (
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search clients by name or email..."
                        value={clientSearchTerm}
                        onChange={e => setClientSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                        style={{
                          backgroundColor: "#2A3133",
                          borderColor: "#606364",
                        }}
                      />
                    </div>
                    {clientSearchTerm && (
                      <p className="text-gray-400 text-sm mt-2">
                        {filteredClients.length} client
                        {filteredClients.length !== 1 ? "s" : ""} found
                      </p>
                    )}
                  </div>
                )}

                {/* Clients List */}
                <div
                  className="border border-gray-600/30 rounded-lg p-4 bg-gray-800/20 max-h-80 overflow-y-auto"
                  style={{ borderColor: "#606364" }}
                >
                  {clientId ? (
                    /* Show pre-selected client */
                    <div className="space-y-3">
                      {(() => {
                        const preSelectedClient = clients.find(
                          c => c.id === clientId
                        );
                        return preSelectedClient ? (
                          <div
                            className="p-3 rounded-lg border border-green-400 bg-green-500/20"
                            style={{
                              backgroundColor: "#10B98120",
                              borderColor: "#10B981",
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                  <User className="h-4 w-4 text-green-400" />
                                </div>
                                <div>
                                  <div className="font-medium text-white">
                                    {preSelectedClient.name}
                                  </div>
                                  <div className="text-sm text-gray-400">
                                    {preSelectedClient.email}
                                  </div>
                                </div>
                              </div>
                              <CheckCircle className="h-5 w-5 text-green-400" />
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  ) : filteredClients.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-lg font-semibold text-white mb-2">
                        {clientSearchTerm
                          ? "No Clients Found"
                          : "No Clients Available"}
                      </div>
                      <p className="text-gray-400">
                        {clientSearchTerm
                          ? `No clients match "${clientSearchTerm}"`
                          : "There are no clients available to assign."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredClients.map(client => (
                        <div
                          key={client.id}
                          onClick={() => toggleClientSelection(client.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                            selectedClients.includes(client.id)
                              ? "border-green-400 bg-green-500/20"
                              : "border-gray-600/30 hover:border-green-400/50"
                          }`}
                          style={{
                            backgroundColor: selectedClients.includes(client.id)
                              ? "#10B98120"
                              : "#2A3133",
                            borderColor: selectedClients.includes(client.id)
                              ? "#10B981"
                              : "#606364",
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                <User className="h-4 w-4 text-green-400" />
                              </div>
                              <div>
                                <div className="font-medium text-white">
                                  {client.name}
                                </div>
                                <div className="text-sm text-gray-400">
                                  {client.email}
                                </div>
                              </div>
                            </div>
                            {selectedClients.includes(client.id) && (
                              <CheckCircle className="h-5 w-5 text-green-400" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Client Selection Controls - Only show if no specific client is pre-selected */}
                {!clientId && filteredClients.length > 0 && (
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={() =>
                        setSelectedClients(filteredClients.map(c => c.id))
                      }
                      className="px-3 py-1 rounded-lg text-sm font-medium border border-green-400 text-green-400 hover:bg-green-500/10"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setSelectedClients([])}
                      className="px-3 py-1 rounded-lg text-sm font-medium border border-gray-600 text-gray-400 hover:bg-gray-700/50"
                    >
                      Deselect All
                    </button>
                    <span className="text-sm text-gray-400">
                      {selectedClients.length} of {filteredClients.length}{" "}
                      selected
                    </span>
                  </div>
                )}
              </div>

              {/* Step 3: Set Start Date */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-400" />
                  Step 3: Set Start Date
                </h3>
                <div className="max-w-md">
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => {
                      const selectedDate = e.target.value;
                      const today = new Date().toISOString().split("T")[0];
                      if (selectedDate > today) {
                        setStartDate(today);
                      } else {
                        setStartDate(selectedDate);
                      }
                    }}
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 rounded-lg border text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    style={{
                      backgroundColor: "#2A3133",
                      borderColor: "#606364",
                    }}
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    Routine will be assigned for the selected date
                  </p>
                </div>
              </div>

              {/* Assignment Summary */}
              {selectedRoutine && selectedClients.length > 0 && (
                <div
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: "#10B98110",
                    borderColor: "#10B981",
                  }}
                >
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Assignment Summary
                  </h4>
                  <div className="text-sm text-gray-300">
                    <p>
                      <strong>Routine:</strong> {selectedRoutineData?.name}
                    </p>
                    <p>
                      <strong>Clients:</strong> {selectedClients.length} client
                      {selectedClients.length !== 1 ? "s" : ""} selected
                    </p>
                    <p>
                      <strong>Start Date:</strong>{" "}
                      {format(new Date(startDate), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
              )}

              {/* Assign Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleAssign}
                  disabled={
                    !selectedRoutine ||
                    selectedClients.length === 0 ||
                    isAssigning
                  }
                  className="px-6 py-3 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: "#10B981",
                    color: "#FFFFFF",
                  }}
                >
                  {isAssigning ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Assign Routine
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Management Mode */
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-green-400" />
                Routine Assignments
              </h3>

              {!selectedRoutine ? (
                <div className="text-center py-8">
                  <div className="text-lg font-semibold text-white mb-2">
                    No Routine Selected
                  </div>
                  <p className="text-gray-400">
                    Please select a routine in the assignment mode to manage its
                    assignments.
                  </p>
                </div>
              ) : (
                <>
                  {/* Routine Info */}
                  <div
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: "#10B98110",
                      borderColor: "#10B981",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <Target className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {selectedRoutineData?.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          {selectedRoutineData?.exercises?.length || 0}{" "}
                          exercises
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Clients */}
                  {routineAssignments.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-lg font-semibold text-white mb-2">
                        No Clients Assigned
                      </div>
                      <p className="text-gray-400">
                        This routine hasn't been assigned to any clients yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {routineAssignments.map(assignment => (
                        <div
                          key={assignment.id}
                          className="p-4 rounded-lg border"
                          style={{
                            backgroundColor: "#2A3133",
                            borderColor: "#606364",
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                <User className="h-4 w-4 text-green-400" />
                              </div>
                              <div>
                                <div className="font-medium text-white">
                                  {assignment.client.name}
                                </div>
                                <div className="text-sm text-gray-400">
                                  {assignment.client.email}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Assigned{" "}
                                  {format(
                                    new Date(assignment.assignedAt),
                                    "MMM dd, yyyy"
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                handleUnassign([assignment.clientId])
                              }
                              className="px-3 py-1 rounded-lg text-sm font-medium"
                              style={{
                                backgroundColor: "#EF4444",
                                color: "#FFFFFF",
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
