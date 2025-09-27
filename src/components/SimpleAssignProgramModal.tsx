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
} from "lucide-react";
import { format } from "date-fns";

interface SimpleAssignProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId?: string;
  clientName?: string;
  startDate?: string;
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
}: SimpleAssignProgramModalProps) {
  const [viewMode, setViewMode] = useState<"assign" | "manage">("assign");
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [selectedClients, setSelectedClients] = useState<string[]>(
    clientId ? [clientId] : []
  );
  const [startDate, setStartDate] = useState<string>(() => {
    if (propStartDate) return propStartDate;
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [isAssigning, setIsAssigning] = useState(false);

  const { addToast } = useUIStore();
  const utils = trpc.useUtils();

  // Update startDate when propStartDate changes
  useEffect(() => {
    if (propStartDate) {
      setStartDate(propStartDate);
    }
  }, [propStartDate]);

  // Get all programs
  const { data: programs = [] } = trpc.programs.list.useQuery();

  // Get all active clients (exclude archived)
  const { data: clients = [] } = trpc.clients.list.useQuery({
    archived: false,
  });

  // Get selected program details
  const { data: selectedProgramData } = trpc.programs.getById.useQuery(
    { id: selectedProgram },
    { enabled: !!selectedProgram }
  );

  // Get client's current program assignments
  const { data: clientAssignments = [] } =
    trpc.clients.getAssignedPrograms.useQuery(
      { clientId: clientId || "" },
      { enabled: !!clientId && viewMode === "manage" }
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

  const unassignProgramMutation = trpc.programs.unassignFromClients.useMutation(
    {
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
    }
  );

  const resetForm = () => {
    setSelectedProgram("");
    setSelectedClients(clientId ? [clientId] : []);
    setStartDate(() => {
      if (propStartDate) return propStartDate;
      const today = new Date();
      return today.toISOString().split("T")[0];
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

    setIsAssigning(true);
    assignProgramMutation.mutate({
      programId: selectedProgram,
      clientIds: selectedClients,
      startDate: startDate,
      repetitions: 1,
    });
  };

  const handleRemoveProgram = (assignmentId: string) => {
    if (
      confirm("Are you sure you want to remove this program from the client?")
    ) {
      unassignProgramMutation.mutate({
        programId: selectedProgram,
        clientIds: [clientId || ""],
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
    setSelectedClients(clients.map(client => client.id));
  };

  const deselectAllClients = () => {
    setSelectedClients([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-2xl shadow-xl border w-full max-w-7xl max-h-[90vh] overflow-hidden"
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
              {viewMode === "assign" ? "Assign Program" : "Manage Programs"}
            </h2>
            <p className="text-gray-400 text-sm">
              {viewMode === "assign"
                ? "Choose a program and assign it to clients"
                : "View and manage client program assignments"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                setViewMode(viewMode === "assign" ? "manage" : "assign")
              }
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor:
                  viewMode === "assign" ? "#4A5A70" : "transparent",
                color: viewMode === "assign" ? "#FFFFFF" : "#ABA4AA",
                border: "1px solid #606364",
              }}
            >
              {viewMode === "assign" ? "Manage" : "Assign"}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-700/50 transition-all duration-200"
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
              {/* Step 1: Select Program */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-400" />
                  Step 1: Choose a Program
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {programs.map(program => (
                    <button
                      key={program.id}
                      onClick={() => setSelectedProgram(program.id)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        selectedProgram === program.id
                          ? "border-blue-400 bg-blue-500/20"
                          : "border-gray-600 hover:border-gray-500 bg-gray-800/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white">
                          {program.title}
                        </h4>
                        {selectedProgram === program.id && (
                          <CheckCircle className="h-5 w-5 text-blue-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="px-2 py-1 rounded bg-green-500/20 text-green-300">
                          {program.level}
                        </span>
                        <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300">
                          {program.duration} weeks
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {program.activeClientCount} active clients
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Select Clients */}
              {selectedProgram && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-400" />
                      Step 2: Select Clients ({selectedClients.length} selected)
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllClients}
                        className="px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 bg-green-500/10 hover:bg-green-500/20 text-green-300 border border-green-500/20"
                      >
                        Select All
                      </button>
                      <button
                        onClick={deselectAllClients}
                        className="px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 bg-gray-500/10 hover:bg-gray-500/20 text-gray-300 border border-gray-500/20"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 max-h-80 overflow-y-auto">
                    {clients.map(client => {
                      const isSelected = selectedClients.includes(client.id);
                      const hasCurrentProgram = client.programAssignments?.some(
                        assignment => assignment.programId === selectedProgram
                      );

                      return (
                        <button
                          key={client.id}
                          onClick={() => toggleClientSelection(client.id)}
                          className={`p-3 rounded-lg border transition-all duration-200 text-left ${
                            isSelected
                              ? "border-green-400 bg-green-500/20"
                              : "border-gray-600 hover:border-gray-500 bg-gray-800/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white font-semibold text-sm">
                              {client.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-white font-medium truncate text-sm">
                                  {client.name}
                                </h4>
                                {hasCurrentProgram && (
                                  <span className="px-1.5 py-0.5 rounded text-xs bg-orange-500/20 text-orange-300">
                                    Has Program
                                  </span>
                                )}
                              </div>
                              {client.email && (
                                <p className="text-gray-400 text-xs truncate">
                                  {client.email}
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Set Start Date */}
              {selectedProgram && selectedClients.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-yellow-400" />
                    Step 3: Set Start Date
                  </h3>
                  <div className="max-w-md">
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full p-3 rounded-lg border text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                      style={{
                        backgroundColor: "#2A3133",
                        borderColor: "#606364",
                      }}
                    />
                    <p className="text-gray-400 text-sm mt-2">
                      When should this program start for the selected clients?
                    </p>
                  </div>
                </div>
              )}

              {/* Assign Button */}
              {selectedProgram && selectedClients.length > 0 && startDate && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={handleAssign}
                    disabled={isAssigning}
                    className="flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-white transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "#10B981" }}
                  >
                    {isAssigning ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Assigning...
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5" />
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
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-400" />
                Current Program Assignments
              </h3>

              {clientAssignments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 rounded-full bg-gray-700/50 w-fit mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    No Programs Assigned
                  </h4>
                  <p className="text-gray-400 mb-6">
                    This client doesn't have any programs assigned yet.
                  </p>
                  <button
                    onClick={() => setViewMode("assign")}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 mx-auto"
                    style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}
                  >
                    <Plus className="h-4 w-4" />
                    Assign First Program
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {clientAssignments.map(assignment => (
                    <div
                      key={assignment.id}
                      className="p-4 rounded-xl border transition-all duration-200 hover:shadow-lg"
                      style={{
                        backgroundColor: "#2A3133",
                        borderColor: "#606364",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-lg bg-blue-500/10">
                            <BookOpen className="h-6 w-6 text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">
                              {assignment.program.title}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  Assigned{" "}
                                  {format(
                                    new Date(assignment.assignedAt),
                                    "MMM dd, yyyy"
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                <span>{assignment.progress}% Complete</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-white mb-1">
                              {assignment.progress}%
                            </div>
                            <div className="text-xs text-gray-400">
                              Progress
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveProgram(assignment.id)}
                            className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
                            style={{
                              backgroundColor: "#EF4444",
                              color: "#FFFFFF",
                            }}
                            title="Remove Program"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
