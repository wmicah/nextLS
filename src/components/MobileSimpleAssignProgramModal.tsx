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
  ArrowLeft,
  Search,
} from "lucide-react";
import { format } from "date-fns";

interface MobileSimpleAssignProgramModalProps {
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

export default function MobileSimpleAssignProgramModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  startDate: propStartDate,
  programId: propProgramId,
}: MobileSimpleAssignProgramModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
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

  // Filter programs based on search
  const filteredPrograms = programs.filter((program: any) =>
    program.title.toLowerCase().includes(programSearchTerm.toLowerCase())
  );

  // Filter clients based on search
  const filteredClients = clients.filter((client: Client) =>
    client.name.toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  // Assignment mutation
  const assignProgram = trpc.programs.assignToClients.useMutation({
    onSuccess: () => {
      utils.programs.list.invalidate();
      utils.clients.list.invalidate();
      addToast({
        title: "Success",
        message: "Program assigned successfully",
        type: "success",
      });
      setIsAssigning(false);
      onClose();
    },
    onError: (error: any) => {
      addToast({
        title: "Error",
        message: "Assignment failed",
        type: "error",
      });
      setIsAssigning(false);
    },
  });

  const handleAssign = async () => {
    if (!selectedProgram || selectedClients.length === 0) {
      addToast({
        title: "Missing information",
        message: "Please select a program and at least one client.",
        type: "error",
      });
      return;
    }

    setIsAssigning(true);
    try {
      await assignProgram.mutateAsync({
        programId: selectedProgram,
        clientIds: selectedClients,
        startDate: startDate,
      });
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const toggleClientSelection = (clientId: string) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as 1 | 2 | 3);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as 1 | 2 | 3);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-[#2A3133] w-full max-w-sm rounded-xl max-h-[85vh] overflow-hidden relative z-[10000]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#606364]">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">Assign Program</h2>
            <div className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  currentStep >= 1 ? "bg-[#4A5A70]" : "bg-[#606364]"
                }`}
              />
              <div
                className={`w-2 h-2 rounded-full ${
                  currentStep >= 2 ? "bg-[#4A5A70]" : "bg-[#606364]"
                }`}
              />
              <div
                className={`w-2 h-2 rounded-full ${
                  currentStep >= 3 ? "bg-[#4A5A70]" : "bg-[#606364]"
                }`}
              />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#4A5A70] text-[#ABA4AA]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[calc(85vh-120px)] overflow-y-auto">
          {/* Step 1: Choose Program */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-base font-semibold text-[#C3BCC2] mb-2">
                  Choose Program
                </h3>
                <p className="text-sm text-[#ABA4AA]">
                  Select a program to assign
                </p>
              </div>

              {/* Program Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search programs..."
                  value={programSearchTerm}
                  onChange={e => setProgramSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border bg-[#606364] border-[#ABA4AA] text-[#C3BCC2] text-sm"
                />
              </div>

              {/* Program Grid - 2 Columns */}
              <div className="grid grid-cols-2 gap-2">
                {filteredPrograms.map((program: any) => (
                  <button
                    key={program.id}
                    onClick={() => setSelectedProgram(program.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedProgram === program.id
                        ? "border-[#4A5A70] bg-[#4A5A70]/20"
                        : "border-[#606364] bg-[#353A3A] hover:bg-[#3A4040]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-[#C3BCC2] truncate flex-1">
                        {program.title}
                      </h4>
                      {selectedProgram === program.id && (
                        <CheckCircle className="h-4 w-4 text-[#4A5A70] ml-1 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Choose Clients */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-base font-semibold text-[#C3BCC2] mb-2">
                  Choose Clients
                </h3>
                <p className="text-sm text-[#ABA4AA]">
                  Select clients to assign the program to
                </p>
              </div>

              {/* Client Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={clientSearchTerm}
                  onChange={e => setClientSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border bg-[#606364] border-[#ABA4AA] text-[#C3BCC2] text-sm"
                />
              </div>

              {/* Client List */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filteredClients.map((client: Client) => (
                  <button
                    key={client.id}
                    onClick={() => toggleClientSelection(client.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${
                      selectedClients.includes(client.id)
                        ? "border-[#4A5A70] bg-[#4A5A70]/20"
                        : "border-[#606364] bg-[#353A3A] hover:bg-[#3A4040]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#4A5A70] flex items-center justify-center">
                          <User className="h-3 w-3 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-[#C3BCC2] truncate">
                            {client.name}
                          </h4>
                          {client.email && (
                            <p className="text-xs text-[#ABA4AA] truncate">
                              {client.email}
                            </p>
                          )}
                        </div>
                      </div>
                      {selectedClients.includes(client.id) && (
                        <CheckCircle className="h-4 w-4 text-[#4A5A70] ml-2 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Set Start Date */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-base font-semibold text-[#C3BCC2] mb-2">
                  Set Start Date
                </h3>
                <p className="text-sm text-[#ABA4AA]">
                  When should the program begin?
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#C3BCC2] mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-[#606364] border-[#ABA4AA] text-[#C3BCC2]"
                  />
                </div>

                {/* Summary */}
                <div className="bg-[#353A3A] border border-[#606364] rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-[#C3BCC2] mb-2">
                    Assignment Summary
                  </h4>
                  <div className="space-y-1 text-xs text-[#ABA4AA]">
                    <p>
                      <strong>Program:</strong>{" "}
                      {selectedProgramData?.title || "Selected program"}
                    </p>
                    <p>
                      <strong>Clients:</strong> {selectedClients.length}{" "}
                      selected
                    </p>
                    <p>
                      <strong>Start Date:</strong>{" "}
                      {format(new Date(startDate), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#606364] bg-[#353A3A]">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="px-4 py-2 rounded-lg border border-[#606364] text-[#ABA4AA] hover:bg-[#4A5A70] transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}

            {currentStep < 3 ? (
              <button
                onClick={nextStep}
                disabled={
                  (currentStep === 1 && !selectedProgram) ||
                  (currentStep === 2 && selectedClients.length === 0)
                }
                className="flex-1 px-4 py-2 rounded-lg bg-[#4A5A70] text-white hover:bg-[#606364] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleAssign}
                disabled={isAssigning}
                className="flex-1 px-4 py-2 rounded-lg bg-[#4A5A70] text-white hover:bg-[#606364] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isAssigning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Assign Program
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
