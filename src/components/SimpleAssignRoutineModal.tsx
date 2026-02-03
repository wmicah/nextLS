"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import { useUIStore } from "@/lib/stores/uiStore";
import {
  X,
  CheckCircle,
  Plus,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import { COLORS } from "@/lib/colors";

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
        className="rounded-lg shadow-xl border w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden"
        style={{
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div>
            <h2 className="text-lg font-bold mb-0.5" style={{ color: COLORS.TEXT_PRIMARY }}>
              {viewMode === "assign" ? "Assign Routine" : "Manage Routine"}
            </h2>
            <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
              {viewMode === "assign"
                ? "Choose a routine and assign it to clients"
                : "View and manage routine assignments"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setViewMode(viewMode === "assign" ? "manage" : "assign")
              }
              className="px-3 py-1.5 rounded-md text-xs font-medium"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                color: COLORS.TEXT_SECONDARY,
                borderColor: COLORS.BORDER_SUBTLE,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              }}
            >
              {viewMode === "assign" ? "Manage" : "Assign"}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: COLORS.TEXT_SECONDARY }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-100px)]">
          {viewMode === "assign" ? (
            /* Assignment Mode */
            <div className="space-y-4">
              {/* Step 1: Select Routine */}
              <div>
                <h3 className="text-sm font-bold mb-3" style={{ color: COLORS.TEXT_PRIMARY }}>
                  Step 1: Choose a Routine
                </h3>

                {/* Routine Search */}
                <div className="mb-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5" style={{ color: COLORS.TEXT_SECONDARY }} />
                    <input
                      type="text"
                      placeholder="Search routines by title or description..."
                      value={routineSearchTerm}
                      onChange={e => setRoutineSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-md border text-sm"
                      style={{
                        backgroundColor: COLORS.BACKGROUND_CARD,
                        borderColor: COLORS.BORDER_SUBTLE,
                        color: COLORS.TEXT_PRIMARY,
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = "#F28F3B";
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                      }}
                    />
                  </div>
                </div>

                {/* Routines Grid */}
                <div
                  className="border rounded-md p-3 max-h-80 overflow-y-auto"
                  style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: COLORS.BACKGROUND_CARD }}
                >
                  {filteredRoutines.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="text-sm font-semibold mb-1.5" style={{ color: COLORS.TEXT_PRIMARY }}>
                        {routines.length === 0
                          ? "No Routines Available"
                          : "No Routines Found"}
                      </div>
                      <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                        {routines.length === 0
                          ? "There are no routines available to assign."
                          : "Try adjusting your search terms."}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredRoutines.map(routine => (
                        <div
                          key={routine.id}
                          onClick={() => setSelectedRoutine(routine.id)}
                          className="p-3 rounded-md border cursor-pointer transition-colors"
                          style={{
                            backgroundColor:
                              selectedRoutine === routine.id
                                ? "rgba(242, 143, 59, 0.1)"
                                : COLORS.BACKGROUND_DARK,
                            borderColor:
                              selectedRoutine === routine.id
                                ? "#F28F3B"
                                : COLORS.BORDER_SUBTLE,
                          }}
                          onMouseEnter={e => {
                            if (selectedRoutine !== routine.id) {
                              e.currentTarget.style.borderColor = "rgba(242, 143, 59, 0.5)";
                              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                            }
                          }}
                          onMouseLeave={e => {
                            if (selectedRoutine !== routine.id) {
                              e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_DARK;
                            }
                          }}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <h4 className="text-xs font-semibold truncate" style={{ color: COLORS.TEXT_PRIMARY }}>
                              {routine.name}
                            </h4>
                            {selectedRoutine === routine.id && (
                              <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 ml-1" style={{ color: "#F28F3B" }} />
                            )}
                          </div>
                          <p className="text-[10px] mb-1.5 line-clamp-2" style={{ color: COLORS.TEXT_SECONDARY }}>
                            {routine.description}
                          </p>
                          <span className="text-[10px]" style={{ color: COLORS.TEXT_MUTED }}>
                            {routine.exercises?.length || 0} exercises
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Select Clients */}
              <div>
                <h3 className="text-sm font-bold mb-3" style={{ color: COLORS.TEXT_PRIMARY }}>
                  {clientId
                    ? "Step 2: Client Selected"
                    : "Step 2: Choose Clients"}
                </h3>

                {/* Client Search - Only show if no specific client is pre-selected */}
                {!clientId && (
                  <div className="mb-3">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5" style={{ color: COLORS.TEXT_SECONDARY }} />
                      <input
                        type="text"
                        placeholder="Search clients by name or email..."
                        value={clientSearchTerm}
                        onChange={e => setClientSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-md border text-sm"
                        style={{
                          backgroundColor: COLORS.BACKGROUND_CARD,
                          borderColor: COLORS.BORDER_SUBTLE,
                          color: COLORS.TEXT_PRIMARY,
                        }}
                        onFocus={e => {
                          e.currentTarget.style.borderColor = "#F28F3B";
                        }}
                        onBlur={e => {
                          e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                        }}
                      />
                    </div>
                    {clientSearchTerm && (
                      <p className="text-xs mt-1" style={{ color: COLORS.TEXT_SECONDARY }}>
                        {filteredClients.length} client
                        {filteredClients.length !== 1 ? "s" : ""} found
                      </p>
                    )}
                  </div>
                )}

                {/* Clients List */}
                <div
                  className="border rounded-md p-3 max-h-72 overflow-y-auto"
                  style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: COLORS.BACKGROUND_CARD }}
                >
                  {clientId ? (
                    /* Show pre-selected client */
                    <div className="space-y-2.5">
                      {(() => {
                        const preSelectedClient = clients.find(
                          c => c.id === clientId
                        );
                        return preSelectedClient ? (
                          <div
                            className="p-2.5 rounded-md border"
                            style={{
                              backgroundColor: "rgba(242, 143, 59, 0.1)",
                              borderColor: "#F28F3B",
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0" style={{ backgroundColor: COLORS.BACKGROUND_CARD, color: COLORS.TEXT_PRIMARY }}>
                                  {preSelectedClient.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                                    {preSelectedClient.name}
                                  </div>
                                  <div className="text-[10px]" style={{ color: COLORS.TEXT_SECONDARY }}>
                                    {preSelectedClient.email}
                                  </div>
                                </div>
                              </div>
                              <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 ml-1" style={{ color: "#F28F3B" }} />
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  ) : filteredClients.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="text-sm font-semibold mb-1.5" style={{ color: COLORS.TEXT_PRIMARY }}>
                        {clientSearchTerm
                          ? "No Clients Found"
                          : "No Clients Available"}
                      </div>
                      <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                        {clientSearchTerm
                          ? `No clients match "${clientSearchTerm}"`
                          : "There are no clients available to assign."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {filteredClients.map(client => (
                        <div
                          key={client.id}
                          onClick={() => toggleClientSelection(client.id)}
                          className="p-2.5 rounded-md border cursor-pointer transition-colors"
                          style={{
                            backgroundColor: selectedClients.includes(client.id)
                              ? "rgba(242, 143, 59, 0.1)"
                              : COLORS.BACKGROUND_DARK,
                            borderColor: selectedClients.includes(client.id)
                              ? "#F28F3B"
                              : COLORS.BORDER_SUBTLE,
                          }}
                          onMouseEnter={e => {
                            if (!selectedClients.includes(client.id)) {
                              e.currentTarget.style.borderColor = "rgba(242, 143, 59, 0.5)";
                              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                            }
                          }}
                          onMouseLeave={e => {
                            if (!selectedClients.includes(client.id)) {
                              e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                              e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_DARK;
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0" style={{ backgroundColor: COLORS.BACKGROUND_CARD, color: COLORS.TEXT_PRIMARY }}>
                                {client.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                                  {client.name}
                                </div>
                                <div className="text-[10px]" style={{ color: COLORS.TEXT_SECONDARY }}>
                                  {client.email}
                                </div>
                              </div>
                            </div>
                            {selectedClients.includes(client.id) && (
                              <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 ml-1" style={{ color: "#F28F3B" }} />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Client Selection Controls - Only show if no specific client is pre-selected */}
                {!clientId && filteredClients.length > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() =>
                        setSelectedClients(filteredClients.map(c => c.id))
                      }
                      className="px-2 py-1 rounded-md text-xs font-medium border"
                      style={{
                        backgroundColor: "rgba(242, 143, 59, 0.1)",
                        borderColor: "rgba(242, 143, 59, 0.3)",
                        color: "#F28F3B",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = "rgba(242, 143, 59, 0.2)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = "rgba(242, 143, 59, 0.1)";
                      }}
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setSelectedClients([])}
                      className="px-2 py-1 rounded-md text-xs font-medium border"
                      style={{
                        backgroundColor: COLORS.BACKGROUND_CARD,
                        borderColor: COLORS.BORDER_SUBTLE,
                        color: COLORS.TEXT_SECONDARY,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                        e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                        e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                      }}
                    >
                      Deselect All
                    </button>
                    <span className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                      {selectedClients.length} of {filteredClients.length}{" "}
                      selected
                    </span>
                  </div>
                )}
              </div>

              {/* Step 3: Set Start Date */}
              <div>
                  <h3 className="text-sm font-bold mb-3" style={{ color: COLORS.TEXT_PRIMARY }}>
                    Step 3: Set Start Date
                  </h3>
                <div className="max-w-md">
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    min="2020-01-01"
                    className="w-full px-3 py-2 rounded-md border text-sm"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_CARD,
                      borderColor: COLORS.BORDER_SUBTLE,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = "#F28F3B";
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                    }}
                  />
                  <p className="text-xs mt-1.5" style={{ color: COLORS.TEXT_SECONDARY }}>
                    Routine will be assigned for the selected date
                  </p>
                </div>
              </div>

              {/* Assignment Summary */}
              {selectedRoutine && selectedClients.length > 0 && (
                <div
                  className="p-3 rounded-md border"
                  style={{
                    backgroundColor: "rgba(242, 143, 59, 0.1)",
                    borderColor: "#F28F3B",
                  }}
                >
                  <h4 className="text-xs font-semibold mb-1.5" style={{ color: COLORS.TEXT_PRIMARY }}>
                    Assignment Summary
                  </h4>
                  <div className="text-xs space-y-0.5" style={{ color: COLORS.TEXT_SECONDARY }}>
                    <p>
                      <strong style={{ color: COLORS.TEXT_PRIMARY }}>Routine:</strong> {selectedRoutineData?.name}
                    </p>
                    <p>
                      <strong style={{ color: COLORS.TEXT_PRIMARY }}>Clients:</strong> {selectedClients.length} client
                      {selectedClients.length !== 1 ? "s" : ""} selected
                    </p>
                    <p>
                      <strong style={{ color: COLORS.TEXT_PRIMARY }}>Start Date:</strong>{" "}
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
                  className="px-5 py-2 rounded-md font-medium text-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: "#F28F3B",
                    color: COLORS.TEXT_PRIMARY,
                  }}
                  onMouseEnter={e => {
                    if (!isAssigning) {
                      e.currentTarget.style.backgroundColor = "#D67A2F";
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "#F28F3B";
                  }}
                >
                  {isAssigning ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-t-transparent" style={{ borderColor: COLORS.TEXT_PRIMARY }}></div>
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      Assign Routine
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Management Mode */
            <div className="space-y-4">
              <h3 className="text-sm font-bold mb-3" style={{ color: COLORS.TEXT_PRIMARY }}>
                Routine Assignments
              </h3>

              {!selectedRoutine ? (
                <div className="text-center py-8">
                  <div className="text-sm font-semibold mb-1.5" style={{ color: COLORS.TEXT_PRIMARY }}>
                    No Routine Selected
                  </div>
                  <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                    Please select a routine in the assignment mode to manage its
                    assignments.
                  </p>
                </div>
              ) : (
                <>
                  {/* Routine Info */}
                  <div
                    className="p-3 rounded-md border"
                    style={{
                      backgroundColor: "rgba(242, 143, 59, 0.1)",
                      borderColor: "#F28F3B",
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div>
                        <div className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                          {selectedRoutineData?.name}
                        </div>
                        <div className="text-[10px]" style={{ color: COLORS.TEXT_SECONDARY }}>
                          {selectedRoutineData?.exercises?.length || 0}{" "}
                          exercises
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Clients */}
                  {routineAssignments.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-sm font-semibold mb-1.5" style={{ color: COLORS.TEXT_PRIMARY }}>
                        No Clients Assigned
                      </div>
                      <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                        This routine hasn't been assigned to any clients yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {routineAssignments.map(assignment => (
                        <div
                          key={assignment.id}
                          className="p-3 rounded-md border"
                          style={{
                            backgroundColor: COLORS.BACKGROUND_CARD,
                            borderColor: COLORS.BORDER_SUBTLE,
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0" style={{ backgroundColor: COLORS.BACKGROUND_DARK, color: COLORS.TEXT_PRIMARY }}>
                                {assignment.client.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                                  {assignment.client.name}
                                </div>
                                <div className="text-[10px]" style={{ color: COLORS.TEXT_SECONDARY }}>
                                  {assignment.client.email}
                                </div>
                                <div className="text-[10px] mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
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
                              className="px-2.5 py-1 rounded-md text-xs font-medium"
                              style={{
                                backgroundColor: COLORS.RED_ALERT,
                                color: COLORS.TEXT_PRIMARY,
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor = COLORS.RED_DARK;
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor = COLORS.RED_ALERT;
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
