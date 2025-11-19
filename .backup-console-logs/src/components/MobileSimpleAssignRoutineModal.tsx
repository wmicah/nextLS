"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import {
  CalendarIcon,
  Users,
  Target,
  Clock,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/app/_trpc/client";
import { useToast } from "@/lib/hooks/use-toast";

interface Client {
  id: string;
  name: string;
  email: string;
}

interface Routine {
  id: string;
  name: string;
  description: string;
  exercises: any[];
}

interface MobileSimpleAssignRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  routine: Routine;
  clients: Client[];
  onSuccess?: () => void;
}

export default function MobileSimpleAssignRoutineModal({
  isOpen,
  onClose,
  routine,
  clients,
  onSuccess,
}: MobileSimpleAssignRoutineModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  // Assign routine mutation
  const assignRoutine = trpc.routines.assign.useMutation({
    onSuccess: () => {
      toast({
        title: "Routine assigned",
        description: `Routine assigned to ${selectedClients.length} client${
          selectedClients.length !== 1 ? "s" : ""
        }.`,
      });
      onSuccess?.();
      onClose();
    },
    onError: error => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign routine.",
        variant: "destructive",
      });
    },
  });

  const handleClientToggle = useCallback((clientId: string) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedClients.length === clients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(clients.map(client => client.id));
    }
  }, [selectedClients.length, clients]);

  const handleSubmit = async () => {
    if (selectedClients.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one client.",
        variant: "destructive",
      });
      return;
    }

    if (!startDate) {
      toast({
        title: "Error",
        description: "Please select a start date.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await assignRoutine.mutateAsync({
        routineId: routine.id,
        clientIds: selectedClients,
        startDate: startDate.toISOString(),
      });
    } catch (error) {
      console.error("Error assigning routine:", error);
    } finally {
      setIsSubmitting(false);
    }
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

  const canProceed = () => {
    if (currentStep === 1) {
      return selectedClients.length > 0;
    }
    if (currentStep === 2) {
      return startDate !== undefined;
    }
    return true;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[90vh] bg-[#2A3133] border-[#606364] text-[#C3BCC2] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-[#C3BCC2]">
            Assign Routine
          </DialogTitle>
          <DialogDescription className="text-[#ABA4AA]">
            Assign "{routine.name}" to your clients
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Select Clients */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#C3BCC2]">
                  Select Clients
                </h3>
                <Button
                  onClick={handleSelectAll}
                  variant="outline"
                  size="sm"
                  className="border-[#606364] text-[#ABA4AA] hover:bg-[#2A3133] h-8 px-3"
                >
                  {selectedClients.length === clients.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              </div>

              {clients.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-[#ABA4AA] opacity-50" />
                  <p className="text-[#ABA4AA] mb-2">No clients available</p>
                  <p className="text-sm text-[#606364]">
                    Add clients to assign routines
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  {clients.map(client => (
                    <Card
                      key={client.id}
                      className={cn(
                        "bg-[#353A3A] border-[#606364] cursor-pointer transition-colors",
                        selectedClients.includes(client.id) &&
                          "border-[#4A5A70] bg-[#2A3133]"
                      )}
                      onClick={() => handleClientToggle(client.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedClients.includes(client.id)}
                            onChange={() => handleClientToggle(client.id)}
                            className="border-[#606364] data-[state=checked]:bg-[#4A5A70] data-[state=checked]:border-[#4A5A70]"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-[#C3BCC2] truncate">
                              {client.name}
                            </h4>
                            <p className="text-xs text-[#ABA4AA] truncate">
                              {client.email}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {selectedClients.length > 0 && (
                <div className="text-center">
                  <Badge
                    variant="secondary"
                    className="bg-[#4A5A70] text-[#ABA4AA] px-3 py-1"
                  >
                    {selectedClients.length} client
                    {selectedClients.length !== 1 ? "s" : ""} selected
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Set Start Date */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-[#C3BCC2]">
                Set Start Date
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-[#C3BCC2] mb-2 block">
                    When should this routine start?
                  </label>
                  <input
                    type="date"
                    value={
                      startDate ? startDate.toISOString().split("T")[0] : ""
                    }
                    onChange={e =>
                      setStartDate(
                        e.target.value ? new Date(e.target.value) : undefined
                      )
                    }
                    min="2020-01-01"
                    className="w-full px-3 py-2 rounded-lg border bg-[#353A3A] border-[#606364] text-[#C3BCC2] focus:outline-none focus:ring-2 focus:ring-[#4A5A70]"
                  />
                </div>

                {startDate && (
                  <div className="text-center">
                    <Badge
                      variant="secondary"
                      className="bg-[#4A5A70] text-[#ABA4AA] px-3 py-1"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      Starting {format(startDate, "MMM d, yyyy")}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-[#C3BCC2]">
                Review Assignment
              </h3>

              <Card className="bg-[#353A3A] border-[#606364]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-[#C3BCC2]">
                    Routine Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-[#C3BCC2]">
                      Routine
                    </h4>
                    <p className="text-sm text-[#ABA4AA]">{routine.name}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-[#C3BCC2]">
                      Clients
                    </h4>
                    <p className="text-sm text-[#ABA4AA]">
                      {selectedClients.length} client
                      {selectedClients.length !== 1 ? "s" : ""} selected
                    </p>
                    <div className="mt-2 space-y-1">
                      {clients
                        .filter(client => selectedClients.includes(client.id))
                        .map(client => (
                          <div
                            key={client.id}
                            className="text-xs text-[#606364]"
                          >
                            • {client.name}
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-[#C3BCC2]">
                      Start Date
                    </h4>
                    <p className="text-sm text-[#ABA4AA]">
                      {startDate
                        ? format(startDate, "MMM d, yyyy")
                        : "Not selected"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 pt-4 border-t border-[#606364]">
          {currentStep > 1 && (
            <Button
              onClick={prevStep}
              className="px-4 py-2 rounded-lg border border-[#606364] text-[#ABA4AA] hover:bg-[#4A5A70] transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}

          {currentStep < 3 ? (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex-1 px-4 py-2 rounded-lg bg-[#4A5A70] text-white hover:bg-[#606364] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Target className="h-4 w-4" />
                  Assign Routine
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
