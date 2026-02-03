"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import { useUIStore } from "@/lib/stores/uiStore";
import {
  X,
  CheckCircle,
  Plus,
  Trash2,
  Search,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { COLORS } from "@/lib/colors";

interface SimpleAssignProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId?: string;
  clientName?: string;
  startDate?: string;
  programId?: string; // Pre-select a specific program
}

interface Client {
  id: string;
  name: string;
  email: string | null;
  avatar: string | null;
  programAssignments?: {
    id: string;
    programId: string;
    progress: number;
    program: {
      id: string;
      title: string;
    };
  }[];
}

export default function SimpleAssignProgramModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  startDate: propStartDate,
  programId: propProgramId,
}: SimpleAssignProgramModalProps) {
  const [viewMode, setViewMode] = useState<"assign" | "manage">("assign");
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [selectedClients, setSelectedClients] = useState<string[]>(
    clientId ? [clientId] : []
  );
  const [manageSelectedProgram, setManageSelectedProgram] =
    useState<string>("");
  const [startDate, setStartDate] = useState<string>(() => {
    if (propStartDate) return propStartDate;
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [isAssigning, setIsAssigning] = useState(false);
  const [programSearchTerm, setProgramSearchTerm] = useState("");
  const [clientSearchTerm, setClientSearchTerm] = useState("");

  const { addToast } = useUIStore();
  const utils = trpc.useUtils();

  // Update startDate when propStartDate changes
  useEffect(() => {
    if (propStartDate) {
      setStartDate(propStartDate);
    }
  }, [propStartDate]);

  // Update selectedProgram when propProgramId changes
  useEffect(() => {
    if (propProgramId) {
      setSelectedProgram(propProgramId);
    }
  }, [propProgramId]);

  // Get all programs
  const { data: programs = [] } = trpc.programs.list.useQuery();

  // Get all active clients (exclude archived)
  const { data: clientsRaw = [] } = trpc.clients.list.useQuery({
    archived: false,
  });

  // Sort clients alphabetically by name
  const clients = [...clientsRaw].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "")
  );

  // Get selected program details
  const { data: selectedProgramData } = trpc.programs.getById.useQuery(
    { id: selectedProgram },
    { enabled: !!selectedProgram }
  );

  // Get client's current program assignments (when client is selected)
  const { data: clientAssignments = [] } =
    trpc.clients.getAssignedPrograms.useQuery(
      { clientId: clientId || "" },
      { enabled: !!clientId && viewMode === "manage" }
    );

  // For now, we'll use a simpler approach - get all clients and their assignments
  const { data: allClients = [] } = trpc.clients.list.useQuery(
    { archived: false },
    { enabled: !clientId && viewMode === "manage" }
  );

  const assignProgramMutation = trpc.programs.assignToClients.useMutation({
    onSuccess: () => {
      setIsAssigning(false);
      addToast({
        type: "success",
        title: "Program Assigned!",
        message: `Program assigned to ${selectedClients.length} client(s) successfully.`,
      });
      onClose();
      resetForm();
      utils.clients.list.invalidate();
      utils.programs.list.invalidate();
      utils.clients.getById.invalidate();
      utils.scheduling.getCoachSchedule.invalidate();
      utils.scheduling.getCoachUpcomingLessons.invalidate();
    },
    onError: error => {
      setIsAssigning(false);
      addToast({
        type: "error",
        title: "Assignment Failed",
        message: error.message || "Failed to assign program.",
      });
    },
  });

  const unassignProgramMutation =
    trpc.programs.unassignSpecificProgram.useMutation({
      onSuccess: () => {
        addToast({
          type: "success",
          title: "Program Removed!",
          message: "Program has been removed from client.",
        });
        utils.clients.list.invalidate();
        utils.programs.list.invalidate();
        utils.clients.getById.invalidate();
        utils.scheduling.getCoachSchedule.invalidate();
        utils.scheduling.getCoachUpcomingLessons.invalidate();
      },
      onError: error => {
        addToast({
          type: "error",
          title: "Removal Failed",
          message: error.message || "Failed to remove program.",
        });
      },
    });

  const resetForm = () => {
    setSelectedProgram("");
    setSelectedClients(clientId ? [clientId] : []);
    setStartDate(() => {
      if (propStartDate) return propStartDate;
      const today = new Date();
      return today.toISOString().split("T")[0];
    });
  };

  // Direct assign function for when clientId is provided (simple mode)
  const handleDirectAssign = async (programIdToAssign: string) => {
    if (!clientId) {
      // Fall back to regular flow
      setSelectedProgram(programIdToAssign);
      return;
    }

    const targetStartDate = propStartDate || startDate || new Date().toISOString().split("T")[0];
    
    // Validate that start date is not in the past (allow today and future)
    const selectedDate = new Date(targetStartDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      addToast({
        type: "error",
        title: "Invalid Start Date",
        message:
          "Programs cannot start in the past. Please select today or a future date.",
      });
      return;
    }

    setIsAssigning(true);
    assignProgramMutation.mutate({
      programId: programIdToAssign,
      clientIds: [clientId],
      startDate: targetStartDate,
      repetitions: 1,
    });
  };

  const handleAssign = async () => {
    if (!selectedProgram) {
      addToast({
        type: "error",
        title: "Select a Program",
        message: "Please choose a program to assign.",
      });
      return;
    }

    if (selectedClients.length === 0) {
      addToast({
        type: "error",
        title: "Select Clients",
        message: "Please select at least one client.",
      });
      return;
    }

    if (!startDate) {
      addToast({
        type: "error",
        title: "Set Start Date",
        message: "Please choose when the program should start.",
      });
      return;
    }

    // Validate that start date is not in the past (allow today and future)
    const selectedDate = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      addToast({
        type: "error",
        title: "Invalid Start Date",
        message:
          "Programs cannot start in the past. Please select today or a future date.",
      });
      return;
    }

    setIsAssigning(true);
    assignProgramMutation.mutate({
      programId: selectedProgram,
      clientIds: selectedClients,
      startDate: startDate,
      repetitions: 1,
    });
  };

  const handleRemoveProgram = (assignment: any) => {
    if (
      confirm("Are you sure you want to remove this program from the client?")
    ) {
      unassignProgramMutation.mutate({
        assignmentId: assignment.id,
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

  const selectAllClients = () => {
    // Select all filtered clients (or all clients if no search)
    const clientsToSelect = filteredClients.map(client => client.id);
    setSelectedClients(prev => {
      // Add filtered clients to existing selection (avoid duplicates)
      const newSelection = new Set([...prev, ...clientsToSelect]);
      return Array.from(newSelection);
    });
  };

  const deselectAllClients = () => {
    setSelectedClients([]);
  };

  // Get assignments for the selected program in manage mode
  const programAssignments = manageSelectedProgram
    ? allClients.flatMap(client =>
        client.programAssignments
          .filter(assignment => assignment.programId === manageSelectedProgram)
          .map(assignment => ({
            ...assignment,
            client: {
              id: client.id,
              name: client.name,
              email: client.email,
            },
          }))
      )
    : [];

  // Filter assigned clients based on search term
  const filteredAssignedClients = programAssignments.filter(
    assignment =>
      assignment.client.name
        .toLowerCase()
        .includes(clientSearchTerm.toLowerCase()) ||
      (assignment.client.email &&
        assignment.client.email
          .toLowerCase()
          .includes(clientSearchTerm.toLowerCase()))
  );

  // Handle removing program assignment - extract data from assignment
  const handleRemoveProgramAssignment = (assignment: any) => {
    if (
      confirm("Are you sure you want to remove this program from the client?")
    ) {
      unassignProgramMutation.mutate({
        assignmentId: assignment.id,
      });
    }
  };

  // Filter programs based on search term and sort alphabetically
  const filteredPrograms = programs
    .filter(
      program =>
        program.title.toLowerCase().includes(programSearchTerm.toLowerCase()) ||
        program.level.toLowerCase().includes(programSearchTerm.toLowerCase()) ||
        (program.description &&
          program.description
            .toLowerCase()
            .includes(programSearchTerm.toLowerCase()))
    )
    .sort((a, b) => (a.title || "").localeCompare(b.title || ""));

  // Filter clients based on search term
  const filteredClients = clients.filter(
    client =>
      client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      (client.email &&
        client.email.toLowerCase().includes(clientSearchTerm.toLowerCase()))
  );

  // Display limits for performance (show all, but with reasonable heights)
  const MAX_VISIBLE_PROGRAMS = 24; // Show more programs in grid
  const MAX_VISIBLE_CLIENTS = 30; // Show more clients in grid

  // Reset search terms when modal closes
  useEffect(() => {
    if (!isOpen) {
      setProgramSearchTerm("");
      setClientSearchTerm("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-lg shadow-xl border w-full max-w-7xl max-h-[90vh] overflow-hidden"
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
              {viewMode === "assign" ? "Assign Program" : "Manage Programs"}
            </h2>
            <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
              {viewMode === "assign"
                ? "Choose a program and assign it to clients"
                : "View and manage client program assignments"}
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
            <div className="space-y-6">
              {/* Step 1: Select Program */}
              <div>
                <h3 className="text-sm font-bold mb-3" style={{ color: COLORS.TEXT_PRIMARY }}>
                  Step 1: Choose a Program
                </h3>

                {/* Program Search */}
                <div className="mb-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5" style={{ color: COLORS.TEXT_SECONDARY }} />
                    <input
                      type="text"
                      placeholder="Search programs by title, level, or description..."
                      value={programSearchTerm}
                      onChange={e => setProgramSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-md border text-sm"
                      style={{
                        backgroundColor: COLORS.BACKGROUND_CARD,
                        borderColor: COLORS.BORDER_SUBTLE,
                        color: COLORS.TEXT_PRIMARY,
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                      }}
                    />
                  </div>
                  {programSearchTerm && (
                    <p className="text-xs mt-1" style={{ color: COLORS.TEXT_SECONDARY }}>
                      {filteredPrograms.length} program
                      {filteredPrograms.length !== 1 ? "s" : ""} found
                    </p>
                  )}
                </div>

                {/* Programs List - Fixed Height with Scroll */}
                <div className="max-h-96 overflow-y-auto border rounded-md p-3" style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: COLORS.BACKGROUND_CARD }}>
                  {filteredPrograms.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm font-medium mb-1" style={{ color: COLORS.TEXT_PRIMARY }}>
                        No programs found
                      </p>
                      <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                        {programSearchTerm
                          ? `No programs match "${programSearchTerm}"`
                          : "No programs available"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredPrograms.map(program => (
                        <div
                          key={program.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                          style={{
                            backgroundColor: COLORS.BACKGROUND_DARK,
                            borderColor: COLORS.BORDER_SUBTLE,
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm mb-1" style={{ color: COLORS.TEXT_PRIMARY }}>
                              {program.title}
                            </div>
                            <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                              <span>{program.level}</span>
                              <span>•</span>
                              <span>{program.duration} weeks</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (clientId) {
                                // Direct assign mode - assign immediately
                                handleDirectAssign(program.id);
                              } else {
                                // Multi-step mode - select program first
                                setSelectedProgram(program.id);
                              }
                            }}
                            disabled={isAssigning}
                            className="px-4 py-2 rounded-md text-sm font-medium transition-colors ml-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              backgroundColor: COLORS.GOLDEN_ACCENT,
                              color: "#000000",
                            }}
                            onMouseEnter={e => {
                              if (!isAssigning) {
                                e.currentTarget.style.opacity = "0.9";
                              }
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.opacity = "1";
                            }}
                          >
                            {isAssigning ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin inline" />
                                Assigning...
                              </>
                            ) : selectedProgram === program.id && !clientId ? (
                              "Selected"
                            ) : (
                              "Click to Assign"
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Programs Summary */}
                  {filteredPrograms.length > 0 && (
                    <div className="mt-2 text-xs text-center" style={{ color: COLORS.TEXT_SECONDARY }}>
                      {filteredPrograms.length} program
                      {filteredPrograms.length !== 1 ? "s" : ""} available
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Select Clients */}
              {selectedProgram && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>
                      Step 2: Select Clients ({selectedClients.length} selected)
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllClients}
                        className="px-2 py-1 rounded-md text-xs font-medium border"
                        style={{
                          backgroundColor: "rgba(229, 178, 50, 0.1)",
                          borderColor: COLORS.BORDER_ACCENT,
                          color: COLORS.GOLDEN_ACCENT,
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = "rgba(229, 178, 50, 0.2)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = "rgba(229, 178, 50, 0.1)";
                        }}
                      >
                        Select All ({filteredClients.length})
                      </button>
                      <button
                        onClick={deselectAllClients}
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
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* Client Search */}
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
                          e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
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

                  {/* Clients Grid - Fixed Height with Scroll */}
                  <div className="max-h-72 overflow-y-auto border rounded-md p-3" style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: COLORS.BACKGROUND_CARD }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5">
                      {filteredClients.length === 0 ? (
                        <div className="col-span-full text-center py-6">
                          <p className="text-sm font-medium mb-1" style={{ color: COLORS.TEXT_PRIMARY }}>
                            No clients found
                          </p>
                          <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                            {clientSearchTerm
                              ? `No clients match "${clientSearchTerm}"`
                              : "No clients available"}
                          </p>
                        </div>
                      ) : (
                        filteredClients.map(client => {
                          const isSelected = selectedClients.includes(
                            client.id
                          );
                          const hasCurrentProgram =
                            client.programAssignments?.some(
                              assignment =>
                                assignment.programId === selectedProgram
                            );

                          return (
                            <button
                              key={client.id}
                              onClick={() => toggleClientSelection(client.id)}
                              className="p-2.5 rounded-md border text-left transition-colors"
                              style={{
                                borderColor: isSelected ? COLORS.GOLDEN_ACCENT : COLORS.BORDER_SUBTLE,
                                backgroundColor: isSelected ? "rgba(229, 178, 50, 0.1)" : COLORS.BACKGROUND_DARK,
                              }}
                              onMouseEnter={e => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = COLORS.BORDER_ACCENT;
                                  e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                                }
                              }}
                              onMouseLeave={e => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                                  e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_DARK;
                                }
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0" style={{ backgroundColor: COLORS.BACKGROUND_CARD, color: COLORS.TEXT_PRIMARY }}>
                                  {client.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <h4 className="text-xs font-medium truncate" style={{ color: COLORS.TEXT_PRIMARY }}>
                                      {client.name}
                                    </h4>
                                    {hasCurrentProgram && (
                                      <span className="px-1 py-0.5 rounded text-[10px]" style={{ backgroundColor: "rgba(242, 143, 59, 0.2)", color: "#F28F3B" }}>
                                        Has Program
                                      </span>
                                    )}
                                  </div>
                                  {client.email && (
                                    <p className="text-[10px] truncate mt-0.5" style={{ color: COLORS.TEXT_SECONDARY }}>
                                      {client.email}
                                    </p>
                                  )}
                                </div>
                                {isSelected && (
                                  <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 ml-1" style={{ color: COLORS.GOLDEN_ACCENT }} />
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Clients Summary */}
                  {filteredClients.length > 0 && (
                    <div className="mt-2 text-xs text-center" style={{ color: COLORS.TEXT_SECONDARY }}>
                      {filteredClients.length} client
                      {filteredClients.length !== 1 ? "s" : ""} available
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Set Start Date */}
              {selectedProgram && selectedClients.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold mb-3" style={{ color: COLORS.TEXT_PRIMARY }}>
                    Step 3: Set Start Date
                  </h3>
                  <div className="max-w-md">
                    <input
                      type="date"
                      value={startDate}
                      min={new Date().toISOString().split("T")[0]} // Allow today and future dates
                      onChange={e => {
                        const selectedDate = e.target.value;
                        setStartDate(selectedDate);
                      }}
                      className="w-full p-2.5 rounded-md border text-sm"
                      style={{
                        backgroundColor: COLORS.BACKGROUND_CARD,
                        borderColor: COLORS.BORDER_SUBTLE,
                        color: COLORS.TEXT_PRIMARY,
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                      }}
                    />
                    <p className="text-xs mt-1.5" style={{ color: COLORS.TEXT_SECONDARY }}>
                      When should this program start for the selected clients?
                      (Can be today or in the future)
                    </p>
                  </div>
                </div>
              )}

              {/* Assign Button */}
              {selectedProgram && selectedClients.length > 0 && startDate && (
                <div className="flex justify-center pt-3">
                  <button
                    onClick={handleAssign}
                    disabled={isAssigning}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-md font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: COLORS.GOLDEN_DARK,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                    onMouseEnter={e => {
                      if (!isAssigning) {
                        e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
                    }}
                  >
                    {isAssigning ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent" style={{ borderColor: COLORS.TEXT_PRIMARY }}></div>
                        Assigning...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Assign Program to {selectedClients.length} Client
                        {selectedClients.length > 1 ? "s" : ""}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Management Mode */
            <div className="space-y-4">
              {clientId ? (
                /* Client-specific management (existing functionality) */
                <>
                  <h3 className="text-sm font-bold mb-3" style={{ color: COLORS.TEXT_PRIMARY }}>
                    Current Program Assignments
                  </h3>

                  {clientAssignments.length === 0 ? (
                    <div className="text-center py-8">
                      <h4 className="text-sm font-semibold mb-1.5" style={{ color: COLORS.TEXT_PRIMARY }}>
                        No Programs Assigned
                      </h4>
                      <p className="text-xs mb-4" style={{ color: COLORS.TEXT_SECONDARY }}>
                        This client doesn't have any programs assigned yet.
                      </p>
                      <button
                        onClick={() => setViewMode("assign")}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium mx-auto"
                        style={{
                          backgroundColor: COLORS.GOLDEN_DARK,
                          color: COLORS.TEXT_PRIMARY,
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Assign First Program
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                      {clientAssignments.map(assignment => (
                        <div
                          key={assignment.id}
                          className="p-3 rounded-md border"
                          style={{
                            backgroundColor: COLORS.BACKGROUND_CARD,
                            borderColor: COLORS.BORDER_SUBTLE,
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div>
                                <h4 className="text-xs font-semibold" style={{ color: COLORS.TEXT_PRIMARY }}>
                                  {assignment.program.title}
                                </h4>
                                <div className="flex items-center gap-3 text-[10px] mt-1" style={{ color: COLORS.TEXT_SECONDARY }}>
                                  <span>
                                    Assigned{" "}
                                    {format(
                                      new Date(assignment.assignedAt),
                                      "MMM dd, yyyy"
                                    )}
                                  </span>
                                  <span>{assignment.progress}% Complete</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div className="text-base font-bold mb-0.5" style={{ color: COLORS.TEXT_PRIMARY }}>
                                  {assignment.progress}%
                                </div>
                                <div className="text-[10px]" style={{ color: COLORS.TEXT_MUTED }}>
                                  Progress
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveProgram(assignment)}
                                className="p-1.5 rounded-md"
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
                                title="Remove Program"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Program-based management (new functionality) */
                <>
                  {!manageSelectedProgram ? (
                    /* Show programs to select */
                    <>
                      <h3 className="text-sm font-bold mb-3" style={{ color: COLORS.TEXT_PRIMARY }}>
                        Select Program to Manage
                      </h3>

                      {/* Program Search */}
                      <div className="mb-3">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5" style={{ color: COLORS.TEXT_SECONDARY }} />
                          <input
                            type="text"
                            placeholder="Search programs by title, level, or description..."
                            value={programSearchTerm}
                            onChange={e => setProgramSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-md border text-sm"
                            style={{
                              backgroundColor: COLORS.BACKGROUND_CARD,
                              borderColor: COLORS.BORDER_SUBTLE,
                              color: COLORS.TEXT_PRIMARY,
                            }}
                            onFocus={e => {
                              e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                            }}
                            onBlur={e => {
                              e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                            }}
                          />
                        </div>
                        {programSearchTerm && (
                          <p className="text-xs mt-1" style={{ color: COLORS.TEXT_SECONDARY }}>
                            {filteredPrograms.length} program
                            {filteredPrograms.length !== 1 ? "s" : ""} found
                          </p>
                        )}
                      </div>

                      {/* Programs Grid */}
                      <div className="max-h-80 overflow-y-auto border rounded-md p-3" style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: COLORS.BACKGROUND_CARD }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                          {filteredPrograms.length === 0 ? (
                            <div className="col-span-full text-center py-6">
                              <p className="text-sm font-medium mb-1" style={{ color: COLORS.TEXT_PRIMARY }}>
                                No programs found
                              </p>
                              <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                                {programSearchTerm
                                  ? `No programs match "${programSearchTerm}"`
                                  : "No programs available"}
                              </p>
                            </div>
                          ) : (
                            filteredPrograms.map(program => (
                              <button
                                key={program.id}
                                onClick={() =>
                                  setManageSelectedProgram(program.id)
                                }
                                className="p-3 rounded-md border-2 text-left transition-colors"
                                style={{
                                  borderColor: manageSelectedProgram === program.id ? COLORS.GOLDEN_ACCENT : COLORS.BORDER_SUBTLE,
                                  backgroundColor: manageSelectedProgram === program.id ? "rgba(229, 178, 50, 0.1)" : COLORS.BACKGROUND_DARK,
                                }}
                                onMouseEnter={e => {
                                  if (manageSelectedProgram !== program.id) {
                                    e.currentTarget.style.borderColor = COLORS.BORDER_ACCENT;
                                    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                                  }
                                }}
                                onMouseLeave={e => {
                                  if (manageSelectedProgram !== program.id) {
                                    e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                                    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_DARK;
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <h4 className="text-xs font-semibold truncate" style={{ color: COLORS.TEXT_PRIMARY }}>
                                    {program.title}
                                  </h4>
                                  {manageSelectedProgram === program.id && (
                                    <CheckCircle className="h-4 w-4 flex-shrink-0 ml-1" style={{ color: COLORS.GOLDEN_ACCENT }} />
                                  )}
                                </div>
                                <p className="text-[10px] mt-1" style={{ color: COLORS.TEXT_MUTED }}>
                                  {program.activeClientCount} active clients
                                </p>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Show assigned clients for selected program */
                    <>
                      <div className="flex items-center gap-3 mb-3">
                        <button
                          onClick={() => setManageSelectedProgram("")}
                          className="px-2 py-1 rounded-md text-xs transition-colors"
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
                          Back
                        </button>
                        <h3 className="text-sm font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>
                          Assigned Clients
                        </h3>
                      </div>

                      {/* Client Search */}
                      <div className="mb-3">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5" style={{ color: COLORS.TEXT_SECONDARY }} />
                          <input
                            type="text"
                            placeholder="Search assigned clients by name or email..."
                            value={clientSearchTerm}
                            onChange={e => setClientSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-md border text-sm"
                            style={{
                              backgroundColor: COLORS.BACKGROUND_CARD,
                              borderColor: COLORS.BORDER_SUBTLE,
                              color: COLORS.TEXT_PRIMARY,
                            }}
                            onFocus={e => {
                              e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                            }}
                            onBlur={e => {
                              e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                            }}
                          />
                        </div>
                        {clientSearchTerm && (
                          <p className="text-xs mt-1" style={{ color: COLORS.TEXT_SECONDARY }}>
                            {filteredAssignedClients.length} client
                            {filteredAssignedClients.length !== 1
                              ? "s"
                              : ""}{" "}
                            found
                          </p>
                        )}
                      </div>

                      {filteredAssignedClients.length === 0 ? (
                        <div className="text-center py-8">
                          <h4 className="text-sm font-semibold mb-1.5" style={{ color: COLORS.TEXT_PRIMARY }}>
                            {programAssignments.length === 0
                              ? "No Clients Assigned"
                              : "No Clients Found"}
                          </h4>
                          <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                            {programAssignments.length === 0
                              ? "This program doesn't have any clients assigned yet."
                              : `No clients match "${clientSearchTerm}"`}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                          {filteredAssignedClients.map(assignment => (
                            <div
                              key={assignment.id}
                              className="p-3 rounded-md border"
                              style={{
                                backgroundColor: COLORS.BACKGROUND_CARD,
                                borderColor: COLORS.BORDER_SUBTLE,
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0" style={{ backgroundColor: COLORS.BACKGROUND_DARK, color: COLORS.TEXT_PRIMARY }}>
                                    {assignment.client.name
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-semibold" style={{ color: COLORS.TEXT_PRIMARY }}>
                                      {assignment.client.name}
                                    </h4>
                                    <div className="flex items-center gap-3 text-[10px] mt-1" style={{ color: COLORS.TEXT_SECONDARY }}>
                                      <span>
                                        {(() => {
                                          const assignmentDate = new Date(
                                            assignment.startDate ||
                                              assignment.assignedAt
                                          );
                                          const today = new Date();
                                          today.setHours(0, 0, 0, 0); // Reset time to start of day
                                          assignmentDate.setHours(0, 0, 0, 0);

                                          if (assignmentDate > today) {
                                            return `Starts ${format(
                                              assignmentDate,
                                              "MMM dd, yyyy"
                                            )}`;
                                          } else {
                                            return `Started ${format(
                                              assignmentDate,
                                              "MMM dd, yyyy"
                                            )}`;
                                          }
                                        })()}
                                      </span>
                                      <span>
                                        {assignment.progress}% Complete
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    handleRemoveProgramAssignment(assignment)
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
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
