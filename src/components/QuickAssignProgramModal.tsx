"use client";

import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { trpc } from "@/app/_trpc/client";
import { useToast } from "@/lib/hooks/use-toast";
import { COLORS } from "@/lib/colors";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { format } from "date-fns";

interface QuickAssignProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  startDate: string;
}

export default function QuickAssignProgramModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  startDate,
}: QuickAssignProgramModalProps) {
  const [activeTab, setActiveTab] = useState<"programs" | "master">("programs");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Get user profile to check subscription tier
  const { data: userProfile } = trpc.user.getProfile.useQuery();
  const hasPremadeProgramsAccess =
    userProfile?.subscriptionTier === "PREMADE_ROUTINES";

  // Get all programs
  const { data: programs = [] } = trpc.programs.list.useQuery();

  // Get master library programs (only if user has access)
  const { data: masterPrograms = [] } =
    trpc.programs.listMasterLibrary.useQuery(
      {},
      {
        enabled: hasPremadeProgramsAccess,
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
      }
    );

  // Assignment mutation
  const assignProgramMutation = trpc.programs.assignToClients.useMutation({
    onSuccess: async () => {
      toast({
        title: "Program Assigned!",
        description: `Program has been assigned to ${clientName}.`,
      });
      // Fast refresh - invalidate and refetch immediately
      await Promise.all([
        utils.clients.list.invalidate(),
        utils.clients.getById.invalidate({ id: clientId }),
        utils.clients.getAssignedPrograms.invalidate({ clientId }),
        utils.library.getClientAssignments.invalidate({ clientId }),
        utils.scheduling.getCoachSchedule.invalidate(),
        utils.scheduling.getCoachUpcomingLessons.invalidate(),
        utils.events.getUpcoming.invalidate(),
        utils.programs.list.invalidate(),
        hasPremadeProgramsAccess
          ? utils.programs.listMasterLibrary.invalidate()
          : Promise.resolve(),
      ]);

      // Refetch the current programs list immediately
      if (activeTab === "master" && hasPremadeProgramsAccess) {
        await utils.programs.listMasterLibrary.refetch();
      } else {
        await utils.programs.list.refetch();
      }

      setIsAssigning(false);
      // Keep modal open for quick multiple assignments
    },
    onError: error => {
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign program.",
        variant: "destructive",
      });
      setIsAssigning(false);
    },
  });

  // Get current programs list based on active tab
  const currentPrograms = activeTab === "master" ? masterPrograms : programs;

  // Filter programs based on search term
  const filteredPrograms = currentPrograms.filter(
    program =>
      program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.level?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (program.description &&
        program.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle program selection and immediate assignment
  const handleProgramSelect = (program: any) => {
    if (isAssigning) return;

    setIsAssigning(true);
    assignProgramMutation.mutate({
      programId: program.id,
      clientIds: [clientId],
      startDate: startDate,
      repetitions: 1,
    });
  };

  // Reset search when modal closes or tab changes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setIsAssigning(false);
      setActiveTab("programs");
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto p-0"
        style={{
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE,
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle
            className="text-xl font-bold"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Quick Assign Program
          </DialogTitle>
          <DialogDescription
            className="text-sm mt-1"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            Assign a program to {clientName} for{" "}
            {format(new Date(startDate), "M/d/yyyy")}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          {/* Tabs */}
          {hasPremadeProgramsAccess && (
            <div
              className="flex gap-2 mb-4 border-b"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}
            >
              <button
                onClick={() => setActiveTab("programs")}
                className="px-4 py-2 text-sm font-medium transition-colors relative"
                style={{
                  color:
                    activeTab === "programs"
                      ? COLORS.TEXT_PRIMARY
                      : COLORS.TEXT_SECONDARY,
                }}
              >
                Programs
                {activeTab === "programs" && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: COLORS.GOLDEN_ACCENT }}
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab("master")}
                className="px-4 py-2 text-sm font-medium transition-colors relative"
                style={{
                  color:
                    activeTab === "master"
                      ? COLORS.TEXT_PRIMARY
                      : COLORS.TEXT_SECONDARY,
                }}
              >
                Master
                {activeTab === "master" && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: COLORS.GOLDEN_ACCENT }}
                  />
                )}
              </button>
            </div>
          )}

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                style={{ color: COLORS.TEXT_SECONDARY }}
              />
              <Input
                type="text"
                placeholder="Search programs by name, level, or description..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
                }}
              />
            </div>
          </div>

          {/* Programs List */}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {filteredPrograms.length === 0 ? (
              <div className="text-center py-8">
                <p
                  className="text-sm font-medium mb-1"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  {searchTerm ? "No Programs Found" : "No Programs Available"}
                </p>
                <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                  {searchTerm
                    ? `No programs match "${searchTerm}"`
                    : "There are no programs available to assign."}
                </p>
              </div>
            ) : (
              filteredPrograms.map(program => (
                <div
                  key={program.id}
                  className="flex items-center justify-between p-3 rounded-lg border transition-all"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    borderColor: COLORS.BORDER_SUBTLE,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-medium text-sm truncate"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      {program.title}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleProgramSelect(program)}
                    disabled={isAssigning}
                    size="sm"
                    className="ml-3 flex-shrink-0"
                    style={{
                      backgroundColor: COLORS.GOLDEN_ACCENT,
                      color: "#000000",
                    }}
                  >
                    {isAssigning ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      "Click to Assign"
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
