"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import { useUIStore } from "@/lib/stores/uiStore";
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Checkbox } from "@/components/ui/checkbox"
// import { ScrollArea } from "@/components/ui/scroll-area"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { Card, CardContent } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Target, X } from "lucide-react";
import { format } from "date-fns";

interface AssignProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  programId?: string;
  programTitle?: string;
  clientId?: string;
  clientName?: string;
  startDate?: string; // Pre-filled start date
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

// interface Program {
// 	id: string
// 	title: string
// 	description: string | null
// 	sport: string
// 	level: string
// 	duration: number
// 	status: string
// // 	assignments?: {
// 		id: string
// 		clientId: string
// 		progress: number
// 		client: {
// 			id: string
// 			name: string
// 			email: string | null
// 		}
// 	}[]
// }

export default function AssignProgramModal({
  isOpen,
  onClose,
  programId,
  clientId,
  startDate: propStartDate,
}: // programTitle,
// clientName,
AssignProgramModalProps) {
  const [selectedProgram, setSelectedProgram] = useState<string>(
    programId || ""
  );

  // Update selectedProgram when programId prop changes
  useEffect(() => {
    if (programId) {
      setSelectedProgram(programId);
    }
  }, [programId]);

  // Update startDate when propStartDate changes
  useEffect(() => {
    if (propStartDate) {
      setStartDate(propStartDate);
    }
  }, [propStartDate]);
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
  const [repetitions, setRepetitions] = useState<number>(1);
  const [isAssigning, setIsAssigning] = useState(false);
  const [viewMode, setViewMode] = useState<"assign" | "manage">("assign");

  const { addToast } = useUIStore();
  const utils = trpc.useUtils();

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

  // Get program assignments if in manage mode
  const { data: programAssignments = [] } =
    trpc.programs.getProgramAssignments.useQuery(
      { programId: selectedProgram },
      { enabled: !!selectedProgram && viewMode === "manage" }
    );

  const assignProgramMutation = trpc.programs.assignToClients.useMutation({
    onSuccess: () => {
      setIsAssigning(false);
      addToast({
        type: "success",
        title: "Program assigned",
        message: `Program has been assigned to ${
          selectedClients.length
        } client(s) with ${repetitions} repetition${
          repetitions > 1 ? "s" : ""
        } successfully.`,
      });
      onClose();
      setSelectedProgram("");
      setSelectedClients([]);
      setRepetitions(1);
      const today = new Date();
      setStartDate(today.toISOString().split("T")[0]);

      // Invalidate and refetch data
      utils.clients.list.invalidate();
      utils.programs.list.invalidate();
      if (selectedProgram) {
        utils.programs.getProgramAssignments.invalidate({
          programId: selectedProgram,
        });
      }
    },
    onError: error => {
      setIsAssigning(false);
      addToast({
        type: "error",
        title: "Assignment failed",
        message: error.message || "Failed to assign program to clients.",
      });
    },
  });

  const unassignProgramMutation =
    trpc.programs.unassignMultiplePrograms.useMutation({
      onSuccess: data => {
        addToast({
          type: "success",
          title: "Program unassigned",
          message: `Program has been unassigned from ${data.deletedCount} client(s).`,
        });

        // Invalidate and refetch data
        utils.clients.list.invalidate();
        utils.programs.list.invalidate();
        if (selectedProgram) {
          utils.programs.getProgramAssignments.invalidate({
            programId: selectedProgram,
          });
        }
      },
      onError: error => {
        addToast({
          type: "error",
          title: "Unassignment failed",
          message: error.message || "Failed to unassign program from clients.",
        });
      },
    });

  const handleAssign = async () => {
    if (!selectedProgram) {
      addToast({
        type: "error",
        title: "No program selected",
        message: "Please select a program to assign.",
      });
      return;
    }

    if (selectedClients.length === 0) {
      addToast({
        type: "error",
        title: "No clients selected",
        message: "Please select at least one client to assign the program to.",
      });
      return;
    }

    if (!startDate) {
      addToast({
        type: "error",
        title: "Start date required",
        message: "Please select a start date for the program.",
      });
      return;
    }

    const requestData = {
      programId: selectedProgram,
      clientIds: selectedClients,
      startDate: startDate,
      repetitions: repetitions,
    };

    console.log("Sending assignment request:", requestData);
    console.log("startDate type:", typeof requestData.startDate);
    console.log("startDate value:", requestData.startDate);

    setIsAssigning(true);
    assignProgramMutation.mutate(requestData);
  };

  const handleUnassign = (assignmentIds: string[]) => {
    console.log("=== UNASSIGN FRONTEND DEBUG ===");
    console.log("assignmentIds:", assignmentIds);

    if (
      confirm(
        `Are you sure you want to unassign this program from ${assignmentIds.length} client(s)?`
      )
    ) {
      console.log("Sending unassign request:", {
        assignmentIds,
      });

      unassignProgramMutation.mutate({
        assignmentIds,
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

  const toggleAllClients = () => {
    if (selectedClients.length === clients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(clients.map(client => client.id));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#2B3038] rounded-2xl border border-gray-700/50 shadow-2xl max-w-[90vw] w-[90vw] max-h-[90vh] overflow-hidden">
        {/* Header - Fixed */}
        <div className="sticky top-0 z-10 bg-[#2B3038] border-b border-gray-700/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {viewMode === "assign"
                  ? "Assign Program"
                  : "Manage Assignments"}
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                {viewMode === "assign"
                  ? "Select a program and clients to assign"
                  : "View and manage program assignments"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setViewMode(viewMode === "assign" ? "manage" : "assign")
                }
                className="px-4 py-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-white border border-gray-600/50 transition-all duration-200 hover:border-gray-500/50"
              >
                {viewMode === "assign" ? "Manage" : "Assign"}
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div
          className="p-6 overflow-y-auto bg-[#2B3038] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-700/30 [&::-webkit-scrollbar-thumb]:bg-gray-600/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-500/50"
          style={{ height: "calc(90vh - 120px)" }}
        >
          {/* Program Selection */}
          <div className="mb-6">
            <label className="text-white text-sm font-medium mb-3 block">
              Select Program
            </label>
            <select
              value={selectedProgram}
              onChange={e => setSelectedProgram(e.target.value)}
              className="w-full p-4 rounded-xl border border-gray-600/50 text-white bg-[#2B3038] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
            >
              <option value="">Choose a program...</option>
              {programs.map(program => (
                <option key={program.id} value={program.id}>
                  {program.title} ({program.activeClientCount} active clients)
                </option>
              ))}
            </select>
          </div>

          {/* Selected Program Details */}
          {selectedProgramData && (
            <div className="rounded-xl border border-gray-600/50 p-6 mb-6 bg-[#2B3038]">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-white mb-3">
                    {selectedProgramData.title}
                  </h4>
                  {selectedProgramData.description && (
                    <p className="text-gray-300 text-sm mb-4">
                      {selectedProgramData.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-medium">
                      {selectedProgramData.level}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium">
                      {selectedProgramData.duration} weeks
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === "assign" ? (
            /* Assignment Mode */
            <div className="space-y-6">
              {/* Start Date */}
              <div>
                <label className="text-white text-sm font-medium mb-3 block">
                  Start Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                  className="w-full p-4 rounded-xl border border-gray-600/50 text-white bg-[#2B3038] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                />
                <p className="text-gray-400 text-sm mt-2">
                  Choose when this program should start for the client
                </p>
              </div>

              {/* Repetitions */}
              <div>
                <label className="text-white text-sm font-medium mb-3 block">
                  Repetitions <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={repetitions}
                  onChange={e => setRepetitions(Number(e.target.value))}
                  className="w-full p-4 rounded-xl border border-gray-600/50 text-white bg-[#2B3038] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                  placeholder="Enter number of repetitions"
                />
                <p className="text-gray-400 text-sm mt-2">
                  {selectedProgramData && repetitions > 1 && (
                    <>
                      Total duration:{" "}
                      {selectedProgramData.duration * repetitions} weeks
                      <br />
                      Program will restart automatically after each{" "}
                      {selectedProgramData.duration}-week cycle
                    </>
                  )}
                  {(!selectedProgramData || repetitions === 1) &&
                    "How many times should this program be repeated in sequence?"}
                </p>
              </div>

              {/* Client Selection */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-white text-sm font-medium">
                    Select Clients ({selectedClients.length} selected)
                  </label>
                  <button
                    onClick={toggleAllClients}
                    className="px-4 py-2 rounded-lg bg-gray-600/50 hover:bg-gray-500/50 text-white border border-gray-500/50 transition-all duration-200 hover:border-gray-400/50 text-sm"
                  >
                    {selectedClients.length === clients.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>

                <div className="h-96 border border-gray-600/50 rounded-xl overflow-y-auto bg-[#2B3038] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-700/30 [&::-webkit-scrollbar-thumb]:bg-gray-600/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-500/50">
                  <div className="p-4 space-y-3">
                    {clients.map((client: Client) => {
                      const isSelected = selectedClients.includes(client.id);
                      const hasCurrentProgram = client.programAssignments?.some(
                        assignment => assignment.programId === selectedProgram
                      );

                      return (
                        <div
                          key={client.id}
                          className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? "border-blue-500/50 shadow-lg bg-blue-500/20"
                              : "border-gray-600/50 hover:border-gray-500/50 bg-[#2B3038]"
                          }`}
                          onClick={() => toggleClientSelection(client.id)}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleClientSelection(client.id)}
                            className="w-4 h-4 rounded border-gray-600 text-gray-300 bg-[#2B3038] focus:ring-gray-500/50 focus:ring-2"
                          />
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white font-semibold">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-white font-medium truncate">
                                {client.name}
                              </h4>
                              {hasCurrentProgram && (
                                <span className="px-2 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-medium">
                                  Already Assigned
                                </span>
                              )}
                            </div>
                            {client.email && (
                              <p className="text-gray-400 text-sm truncate">
                                {client.email}
                              </p>
                            )}
                          </div>
                          {client.programAssignments &&
                            client.programAssignments.length > 0 && (
                              <div className="text-right">
                                <div className="text-xs text-gray-400">
                                  {client.programAssignments.length} program(s)
                                </div>
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-600/50">
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl text-white border border-gray-600/50 bg-[#2B3038] transition-all duration-200 hover:border-gray-500/50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={
                    isAssigning ||
                    !selectedProgram ||
                    selectedClients.length === 0
                  }
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAssigning
                    ? "Assigning..."
                    : `Assign to ${selectedClients.length} Client(s)`}
                </button>
              </div>
            </div>
          ) : (
            /* Management Mode */
            <div className="space-y-6">
              {/* Assignment List */}
              <div>
                <label className="text-white text-sm font-medium mb-4 block">
                  Current Assignments ({programAssignments.length})
                </label>

                <div className="h-64 border border-gray-600/50 rounded-xl overflow-y-auto bg-[#2B3038] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-700/30 [&::-webkit-scrollbar-thumb]:bg-gray-600/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-500/50">
                  <div className="p-4 space-y-3">
                    {programAssignments.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-400">
                          No clients assigned to this program
                        </p>
                      </div>
                    ) : (
                      programAssignments.map(assignment => (
                        <div
                          key={assignment.id}
                          className="rounded-xl border border-gray-600/50 p-4 bg-[#2B3038]"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white font-semibold">
                                {assignment.client.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="text-white font-medium">
                                  {assignment.client.name}
                                </h4>
                                {assignment.client.email && (
                                  <p className="text-gray-400 text-sm">
                                    {assignment.client.email}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <Calendar className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs text-gray-400">
                                    Assigned{" "}
                                    {format(
                                      new Date(assignment.assignedAt),
                                      "MMM dd, yyyy"
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="flex items-center gap-2">
                                  <Target className="h-4 w-4 text-green-400" />
                                  <span className="text-white font-medium">
                                    {assignment.progress}%
                                  </span>
                                </div>
                                <div className="w-24 bg-gray-600/50 rounded-full h-2 mt-1">
                                  <div
                                    className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-300"
                                    style={{
                                      width: `${assignment.progress}%`,
                                    }}
                                  />
                                </div>
                              </div>
                              <button
                                onClick={() => handleUnassign([assignment.id])}
                                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all duration-200"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Bulk Actions */}
              {programAssignments.length > 0 && (
                <div className="flex items-center justify-between pt-6 border-t border-gray-600/50">
                  <button
                    onClick={() =>
                      handleUnassign(programAssignments.map(a => a.id))
                    }
                    className="px-6 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all duration-200"
                  >
                    Unassign All
                  </button>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 rounded-xl text-white bg-[#2B3038] transition-all duration-200"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
