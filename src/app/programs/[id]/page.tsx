"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import { ArrowLeft, Save, Plus } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ProgramBuilder from "@/components/ProgramBuilder";
import type {
  Week as ProgramBuilderWeek,
  ProgramItem as ProgramBuilderItem,
} from "@/components/types/ProgramBuilder";
import VideoLibraryDialog from "@/components/VideoLibraryDialog";
import { useToast } from "@/lib/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroupItem } from "@/components/ui/radio-group";

// Types for ProgramBuilder integration
type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

function ProgramEditorPageContent() {
  const params = useParams();
  const router = useRouter();
  const programId = params.id as string;
  const { toast } = useToast();

  // State
  const [localIsSaving, setLocalIsSaving] = useState(false);
  const [localLastSaved, setLocalLastSaved] = useState<Date | null>(null);
  const isRefetchingAfterSaveRef = useRef(false);
  const [programBuilderWeeks, setProgramBuilderWeeks] = useState<
    ProgramBuilderWeek[]
  >([]);
  const [updateScope, setUpdateScope] = useState<"all" | "future">("all");
  const [showUpdateScopeDialog, setShowUpdateScopeDialog] = useState(false);
  const [pendingSave, setPendingSave] = useState<(() => void) | null>(null);

  // Video Library Dialog state
  const [isVideoLibraryOpen, setIsVideoLibraryOpen] = useState(false);
  const [selectedVideoFromLibrary, setSelectedVideoFromLibrary] = useState<{
    id: string;
    title: string;
    description?: string;
    duration?: string;
    url?: string;
    thumbnail?: string;
  } | null>(null);

  // Fetch program data
  const { data: program, refetch: refetchProgram } =
    trpc.programs.getById.useQuery(
      { id: programId },
      {
        enabled: !!programId,
      }
    );

  // Check if program has active assignments
  const { data: programAssignments = [] } =
    trpc.programs.getProgramAssignments.useQuery(
      { programId: programId },
      { enabled: !!programId }
    );

  const hasActiveAssignments = programAssignments.some(
    (assignment: any) => !assignment.completedAt
  );

  // Get utils for cache invalidation
  const utils = trpc.useUtils();

  // Mutations
  const updateProgramMutation = trpc.programs.update.useMutation({
    onSuccess: data => {
      console.log("=== SAVE SUCCESS - REFETCHING PROGRAM ===");
      setLocalIsSaving(false);
      setLocalLastSaved(new Date());
      isRefetchingAfterSaveRef.current = true;

      // Check if a new program was created (when updateScope is "future" with existing assignments)
      if (data && data.id !== programId) {
        toast({
          title: "New program version created",
          description:
            "A new program version was created to preserve existing assignments. You are now editing the new version.",
        });

        // Redirect to the new program
        router.push(`/programs/${data.id}`);
        return;
      }

      toast({
        title: "Program saved",
        description: "Your program has been saved successfully.",
      });

      // Invalidate cache and refetch to ensure fresh data
      utils.programs.getById.invalidate({ id: programId }).then(() => {
        refetchProgram().then(() => {
          isRefetchingAfterSaveRef.current = false;
        });
      });
    },
    onError: error => {
      setLocalIsSaving(false);
      toast({
        title: "Error",
        description: `Error saving program: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Convert database program data to ProgramBuilder format
  useEffect(() => {
    if (program && program.weeks && !isRefetchingAfterSaveRef.current) {
      const convertedWeeks: ProgramBuilderWeek[] = program.weeks.map(
        (week, weekIndex) => ({
          id: `week-${week.weekNumber}`,
          name: week.title || `Week ${week.weekNumber}`,
          collapsed: false,
          days: {
            mon:
              week.days
                .find(d => d.dayNumber === 1)
                ?.drills?.map(drill => ({
                  id: drill.id,
                  title: drill.title,
                  // Preserve existing type - don't infer from routineId/supersetId
                  type:
                    (drill.type as "exercise" | "drill" | "video") || undefined,
                  notes: drill.notes ?? "",
                  description: drill.description ?? "",
                  sets: drill.sets || undefined,
                  reps: drill.reps || undefined,
                  tempo: drill.tempo || "",
                  duration: drill.duration || "",
                  videoUrl: drill.videoUrl || "",
                  videoId: drill.videoId || "",
                  videoTitle: drill.videoTitle || "",
                  videoThumbnail: drill.videoThumbnail || "",
                  routineId: drill.routineId || undefined,
                  supersetId: drill.supersetId || undefined,
                  supersetOrder: drill.supersetOrder || undefined,
                  supersetDescription: drill.supersetDescription || undefined,
                  supersetInstructions: drill.supersetInstructions || undefined,
                  supersetNotes: drill.supersetNotes || undefined,
                  // Coach Instructions - Map from database format to ProgramBuilder format
                  coachInstructions: (() => {
                    const hasInstructions =
                      drill.coachInstructionsWhatToDo ||
                      drill.coachInstructionsHowToDoIt ||
                      drill.coachInstructionsKeyPoints?.length > 0 ||
                      drill.coachInstructionsCommonMistakes?.length > 0 ||
                      drill.coachInstructionsEquipment;

                    return hasInstructions
                      ? {
                          whatToDo: drill.coachInstructionsWhatToDo || "",
                          howToDoIt: drill.coachInstructionsHowToDoIt || "",
                          keyPoints: drill.coachInstructionsKeyPoints || [],
                          commonMistakes:
                            drill.coachInstructionsCommonMistakes || [],
                          equipment: drill.coachInstructionsEquipment || "",
                        }
                      : undefined;
                  })(),
                })) || [],
            tue:
              week.days
                .find(d => d.dayNumber === 2)
                ?.drills?.map(drill => ({
                  id: drill.id,
                  title: drill.title,
                  // Preserve existing type - don't infer from routineId/supersetId
                  type:
                    (drill.type as "exercise" | "drill" | "video") || undefined,
                  notes: drill.notes ?? "",
                  description: drill.description ?? "",
                  sets: drill.sets || undefined,
                  reps: drill.reps || undefined,
                  tempo: drill.tempo || "",
                  duration: drill.duration || "",
                  videoUrl: drill.videoUrl || "",
                  videoId: drill.videoId || "",
                  videoTitle: drill.videoTitle || "",
                  videoThumbnail: drill.videoThumbnail || "",
                  routineId: drill.routineId || undefined,
                  supersetId: drill.supersetId || undefined,
                  supersetOrder: drill.supersetOrder || undefined,
                  supersetDescription: drill.supersetDescription || undefined,
                  supersetInstructions: drill.supersetInstructions || undefined,
                  supersetNotes: drill.supersetNotes || undefined,
                  // Coach Instructions - Map from database format to ProgramBuilder format
                  coachInstructions: (() => {
                    const hasInstructions =
                      drill.coachInstructionsWhatToDo ||
                      drill.coachInstructionsHowToDoIt ||
                      drill.coachInstructionsKeyPoints?.length > 0 ||
                      drill.coachInstructionsCommonMistakes?.length > 0 ||
                      drill.coachInstructionsEquipment;

                    return hasInstructions
                      ? {
                          whatToDo: drill.coachInstructionsWhatToDo || "",
                          howToDoIt: drill.coachInstructionsHowToDoIt || "",
                          keyPoints: drill.coachInstructionsKeyPoints || [],
                          commonMistakes:
                            drill.coachInstructionsCommonMistakes || [],
                          equipment: drill.coachInstructionsEquipment || "",
                        }
                      : undefined;
                  })(),
                })) || [],
            wed:
              week.days
                .find(d => d.dayNumber === 3)
                ?.drills?.map(drill => ({
                  id: drill.id,
                  title: drill.title,
                  // Preserve existing type - don't infer from routineId/supersetId
                  type:
                    (drill.type as "exercise" | "drill" | "video") || undefined,
                  notes: drill.notes ?? "",
                  description: drill.description ?? "",
                  sets: drill.sets || undefined,
                  reps: drill.reps || undefined,
                  tempo: drill.tempo || "",
                  duration: drill.duration || "",
                  videoUrl: drill.videoUrl || "",
                  videoId: drill.videoId || "",
                  videoTitle: drill.videoTitle || "",
                  videoThumbnail: drill.videoThumbnail || "",
                  routineId: drill.routineId || undefined,
                  supersetId: drill.supersetId || undefined,
                  supersetOrder: drill.supersetOrder || undefined,
                  supersetDescription: drill.supersetDescription || undefined,
                  supersetInstructions: drill.supersetInstructions || undefined,
                  supersetNotes: drill.supersetNotes || undefined,
                  // Coach Instructions - Map from database format to ProgramBuilder format
                  coachInstructions: (() => {
                    const hasInstructions =
                      drill.coachInstructionsWhatToDo ||
                      drill.coachInstructionsHowToDoIt ||
                      drill.coachInstructionsKeyPoints?.length > 0 ||
                      drill.coachInstructionsCommonMistakes?.length > 0 ||
                      drill.coachInstructionsEquipment;

                    return hasInstructions
                      ? {
                          whatToDo: drill.coachInstructionsWhatToDo || "",
                          howToDoIt: drill.coachInstructionsHowToDoIt || "",
                          keyPoints: drill.coachInstructionsKeyPoints || [],
                          commonMistakes:
                            drill.coachInstructionsCommonMistakes || [],
                          equipment: drill.coachInstructionsEquipment || "",
                        }
                      : undefined;
                  })(),
                })) || [],
            thu:
              week.days
                .find(d => d.dayNumber === 4)
                ?.drills?.map(drill => ({
                  id: drill.id,
                  title: drill.title,
                  // Preserve existing type - don't infer from routineId/supersetId
                  type:
                    (drill.type as "exercise" | "drill" | "video") || undefined,
                  notes: drill.notes ?? "",
                  description: drill.description ?? "",
                  sets: drill.sets || undefined,
                  reps: drill.reps || undefined,
                  tempo: drill.tempo || "",
                  duration: drill.duration || "",
                  videoUrl: drill.videoUrl || "",
                  videoId: drill.videoId || "",
                  videoTitle: drill.videoTitle || "",
                  videoThumbnail: drill.videoThumbnail || "",
                  routineId: drill.routineId || undefined,
                  supersetId: drill.supersetId || undefined,
                  supersetOrder: drill.supersetOrder || undefined,
                  supersetDescription: drill.supersetDescription || undefined,
                  supersetInstructions: drill.supersetInstructions || undefined,
                  supersetNotes: drill.supersetNotes || undefined,
                  // Coach Instructions - Map from database format to ProgramBuilder format
                  coachInstructions: (() => {
                    const hasInstructions =
                      drill.coachInstructionsWhatToDo ||
                      drill.coachInstructionsHowToDoIt ||
                      drill.coachInstructionsKeyPoints?.length > 0 ||
                      drill.coachInstructionsCommonMistakes?.length > 0 ||
                      drill.coachInstructionsEquipment;

                    return hasInstructions
                      ? {
                          whatToDo: drill.coachInstructionsWhatToDo || "",
                          howToDoIt: drill.coachInstructionsHowToDoIt || "",
                          keyPoints: drill.coachInstructionsKeyPoints || [],
                          commonMistakes:
                            drill.coachInstructionsCommonMistakes || [],
                          equipment: drill.coachInstructionsEquipment || "",
                        }
                      : undefined;
                  })(),
                })) || [],
            fri:
              week.days
                .find(d => d.dayNumber === 5)
                ?.drills?.map(drill => ({
                  id: drill.id,
                  title: drill.title,
                  // Preserve existing type - don't infer from routineId/supersetId
                  type:
                    (drill.type as "exercise" | "drill" | "video") || undefined,
                  notes: drill.notes ?? "",
                  description: drill.description ?? "",
                  sets: drill.sets || undefined,
                  reps: drill.reps || undefined,
                  tempo: drill.tempo || "",
                  duration: drill.duration || "",
                  videoUrl: drill.videoUrl || "",
                  videoId: drill.videoId || "",
                  videoTitle: drill.videoTitle || "",
                  videoThumbnail: drill.videoThumbnail || "",
                  routineId: drill.routineId || undefined,
                  supersetId: drill.supersetId || undefined,
                  supersetOrder: drill.supersetOrder || undefined,
                  supersetDescription: drill.supersetDescription || undefined,
                  supersetInstructions: drill.supersetInstructions || undefined,
                  supersetNotes: drill.supersetNotes || undefined,
                  // Coach Instructions - Map from database format to ProgramBuilder format
                  coachInstructions: (() => {
                    const hasInstructions =
                      drill.coachInstructionsWhatToDo ||
                      drill.coachInstructionsHowToDoIt ||
                      drill.coachInstructionsKeyPoints?.length > 0 ||
                      drill.coachInstructionsCommonMistakes?.length > 0 ||
                      drill.coachInstructionsEquipment;

                    return hasInstructions
                      ? {
                          whatToDo: drill.coachInstructionsWhatToDo || "",
                          howToDoIt: drill.coachInstructionsHowToDoIt || "",
                          keyPoints: drill.coachInstructionsKeyPoints || [],
                          commonMistakes:
                            drill.coachInstructionsCommonMistakes || [],
                          equipment: drill.coachInstructionsEquipment || "",
                        }
                      : undefined;
                  })(),
                })) || [],
            sat:
              week.days
                .find(d => d.dayNumber === 6)
                ?.drills?.map(drill => ({
                  id: drill.id,
                  title: drill.title,
                  // Preserve existing type - don't infer from routineId/supersetId
                  type:
                    (drill.type as "exercise" | "drill" | "video") || undefined,
                  notes: drill.notes ?? "",
                  description: drill.description ?? "",
                  sets: drill.sets || undefined,
                  reps: drill.reps || undefined,
                  tempo: drill.tempo || "",
                  duration: drill.duration || "",
                  videoUrl: drill.videoUrl || "",
                  videoId: drill.videoId || "",
                  videoTitle: drill.videoTitle || "",
                  videoThumbnail: drill.videoThumbnail || "",
                  routineId: drill.routineId || undefined,
                  supersetId: drill.supersetId || undefined,
                  supersetOrder: drill.supersetOrder || undefined,
                  supersetDescription: drill.supersetDescription || undefined,
                  supersetInstructions: drill.supersetInstructions || undefined,
                  supersetNotes: drill.supersetNotes || undefined,
                  // Coach Instructions - Map from database format to ProgramBuilder format
                  coachInstructions: (() => {
                    const hasInstructions =
                      drill.coachInstructionsWhatToDo ||
                      drill.coachInstructionsHowToDoIt ||
                      drill.coachInstructionsKeyPoints?.length > 0 ||
                      drill.coachInstructionsCommonMistakes?.length > 0 ||
                      drill.coachInstructionsEquipment;

                    return hasInstructions
                      ? {
                          whatToDo: drill.coachInstructionsWhatToDo || "",
                          howToDoIt: drill.coachInstructionsHowToDoIt || "",
                          keyPoints: drill.coachInstructionsKeyPoints || [],
                          commonMistakes:
                            drill.coachInstructionsCommonMistakes || [],
                          equipment: drill.coachInstructionsEquipment || "",
                        }
                      : undefined;
                  })(),
                })) || [],
            sun:
              week.days
                .find(d => d.dayNumber === 7)
                ?.drills?.map(drill => ({
                  id: drill.id,
                  title: drill.title,
                  // Preserve existing type - don't infer from routineId/supersetId
                  type:
                    (drill.type as "exercise" | "drill" | "video") || undefined,
                  notes: drill.notes ?? "",
                  description: drill.description ?? "",
                  sets: drill.sets || undefined,
                  reps: drill.reps || undefined,
                  tempo: drill.tempo || "",
                  duration: drill.duration || "",
                  videoUrl: drill.videoUrl || "",
                  videoId: drill.videoId || "",
                  videoTitle: drill.videoTitle || "",
                  videoThumbnail: drill.videoThumbnail || "",
                  routineId: drill.routineId || undefined,
                  supersetId: drill.supersetId || undefined,
                  supersetOrder: drill.supersetOrder || undefined,
                  supersetDescription: drill.supersetDescription || undefined,
                  supersetInstructions: drill.supersetInstructions || undefined,
                  supersetNotes: drill.supersetNotes || undefined,
                  // Coach Instructions - Map from database format to ProgramBuilder format
                  coachInstructions: (() => {
                    const hasInstructions =
                      drill.coachInstructionsWhatToDo ||
                      drill.coachInstructionsHowToDoIt ||
                      drill.coachInstructionsKeyPoints?.length > 0 ||
                      drill.coachInstructionsCommonMistakes?.length > 0 ||
                      drill.coachInstructionsEquipment;

                    return hasInstructions
                      ? {
                          whatToDo: drill.coachInstructionsWhatToDo || "",
                          howToDoIt: drill.coachInstructionsHowToDoIt || "",
                          keyPoints: drill.coachInstructionsKeyPoints || [],
                          commonMistakes:
                            drill.coachInstructionsCommonMistakes || [],
                          equipment: drill.coachInstructionsEquipment || "",
                        }
                      : undefined;
                  })(),
                })) || [],
          },
        })
      );

      setProgramBuilderWeeks(convertedWeeks);
    }
  }, [program]);

  // Handle ProgramBuilder save
  const handleProgramBuilderSave = (weeks: ProgramBuilderWeek[]) => {
    console.log("=== HANDLEPROGRAMBUILDERSAVE CALLED ===");
    console.log("New weeks:", weeks);
    console.log(
      "Current programBuilderWeeks before update:",
      programBuilderWeeks
    );
    setProgramBuilderWeeks(weeks);
    console.log("ProgramBuilder weeks updated:", weeks);
  };

  // Convert ProgramBuilder data back to database format and save
  const handleSave = async (weeksToSave?: ProgramBuilderWeek[]) => {
    console.log("=== SAVE FUNCTION CALLED ===");
    console.log("program:", program);
    console.log("weeksToSave:", weeksToSave);
    console.log("programBuilderWeeks:", programBuilderWeeks);

    const weeks = weeksToSave || programBuilderWeeks;
    if (!program || !weeks.length) {
      console.log("Early return: missing program or weeks");
      return;
    }

    // If program has active assignments, show update scope dialog
    if (hasActiveAssignments) {
      setPendingSave(() => () => performSave(weeks));
      setShowUpdateScopeDialog(true);
      return;
    }

    // No active assignments, proceed with save
    await performSave(weeks);
  };

  const performSave = async (weeks: ProgramBuilderWeek[]) => {
    setLocalIsSaving(true);
    setShowUpdateScopeDialog(false);

    if (!program) {
      toast({
        title: "Error",
        description: "Program not found",
        variant: "destructive",
      });
      setLocalIsSaving(false);
      return;
    }

    try {
      // Convert ProgramBuilder weeks back to database format
      console.log("=== CONVERTING PROGRAMBUILDER TO DATABASE ===");
      console.log("weeks to convert:", weeks);
      const convertedWeeks = weeks.map((builderWeek, weekIndex) => ({
        weekNumber: weekIndex + 1,
        title: builderWeek.name,
        description: "",
        days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map(dayKey => {
          const items =
            builderWeek.days[dayKey as keyof typeof builderWeek.days];
          const dayNumber =
            dayKey === "mon"
              ? 1
              : dayKey === "tue"
              ? 2
              : dayKey === "wed"
              ? 3
              : dayKey === "thu"
              ? 4
              : dayKey === "fri"
              ? 5
              : dayKey === "sat"
              ? 6
              : 7;

          // If the day has no items, make it a rest day
          if (items.length === 0) {
            return {
              dayNumber,
              title: "Rest Day",
              description: "Recovery and rest day",
              drills: [], // No drills for rest days
            };
          }

          // Convert items to drills format
          return {
            dayNumber,
            title: `Day ${dayNumber}`,
            description: "",
            drills: items.map((item, itemIndex) => {
              // Debug: Log description for superset exercises
              if (item.supersetId) {
                console.log("🔍 Converting superset drill to DB format:", {
                  id: item.id,
                  title: item.title,
                  supersetId: item.supersetId,
                  supersetOrder: item.supersetOrder,
                  description: item.description,
                  descriptionType: typeof item.description,
                  descriptionAfterCoalesce: item.description ?? "",
                });
              }
              return {
                id: item.id,
                title: item.title,
                description: item.description ?? "", // Use nullish coalescing to preserve empty strings
                notes: item.notes ?? "",
                duration: item.duration || "",
                videoUrl: item.videoUrl || "",
                type: item.type || "exercise",
                sets: item.sets,
                reps: item.reps,
                tempo: item.tempo || "",
                videoId: item.videoId,
                videoTitle: item.videoTitle,
                videoThumbnail: item.videoThumbnail,
                routineId: item.routineId,
                supersetId: item.supersetId,
                supersetOrder: item.supersetOrder,
                // Superset description fields
                supersetDescription: item.supersetDescription || undefined,
                supersetInstructions: item.supersetInstructions || undefined,
                supersetNotes: item.supersetNotes || undefined,
                // Coach Instructions - Map from ProgramBuilder format to database format
                coachInstructionsWhatToDo:
                  item.coachInstructions?.whatToDo || undefined,
                coachInstructionsHowToDoIt:
                  item.coachInstructions?.howToDoIt || undefined,
                coachInstructionsKeyPoints:
                  item.coachInstructions?.keyPoints || [],
                coachInstructionsCommonMistakes:
                  item.coachInstructions?.commonMistakes || [],
                coachInstructionsEquipment:
                  item.coachInstructions?.equipment || undefined,
              };
            }),
          };
        }),
      }));

      console.log("Converted back to database format:", convertedWeeks);

      // Debug: Check if any drills have coach instructions
      const drillsWithCoachInstructions = convertedWeeks.flatMap(week =>
        week.days.flatMap(day =>
          day.drills.filter(
            drill =>
              drill.coachInstructionsWhatToDo ||
              drill.coachInstructionsHowToDoIt ||
              drill.coachInstructionsEquipment
          )
        )
      );
      console.log(
        "🔍 Drills with coach instructions being saved:",
        drillsWithCoachInstructions.length
      );
      if (drillsWithCoachInstructions.length > 0) {
        console.log(
          "🔍 First drill with coach instructions:",
          drillsWithCoachInstructions[0]
        );
      }

      // Update the program with the new structure
      console.log("About to call updateProgramMutation with:", {
        id: programId,
        title: program.title || "",
        description: program.description || "",
        weeks: convertedWeeks,
      });

      await updateProgramMutation.mutateAsync({
        id: programId,
        title: program.title || "",
        description: program.description || "",
        weeks: convertedWeeks,
        updateScope: updateScope,
      });

      console.log("updateProgramMutation completed successfully");

      toast({
        title: "Program saved",
        description: "Your program has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving program:", error);
      toast({
        title: "Error",
        description: "Failed to save program. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLocalIsSaving(false);
    }
  };

  const handleConfirmSave = () => {
    if (pendingSave) {
      pendingSave();
      setPendingSave(null);
    }
  };

  if (!program) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Loading program...</p>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <>
      <Sidebar>
        <div className="min-h-screen bg-[#2A3133]">
          {/* Program Builder */}
          <ProgramBuilder
            onSave={handleProgramBuilderSave}
            initialWeeks={programBuilderWeeks as any}
            programDetails={{
              title: program.title || "Untitled Program",
              description: program.description || "",
              level: program.level || "Drive",
              duration:
                programBuilderWeeks.length || program.weeks?.length || 1,
              onBack: () => router.back(),
              onSave: handleSave,
              isSaving: localIsSaving,
              lastSaved: localLastSaved,
            }}
            onOpenVideoLibrary={() => setIsVideoLibraryOpen(true)}
            selectedVideoFromLibrary={selectedVideoFromLibrary}
            onVideoProcessed={() => setSelectedVideoFromLibrary(null)}
          />
        </div>
      </Sidebar>

      {/* Video Library Dialog - Rendered at root level */}
      <VideoLibraryDialog
        isOpen={isVideoLibraryOpen}
        onClose={() => setIsVideoLibraryOpen(false)}
        onSelectVideo={video => {
          console.log("Video selected in ProgramEditor:", video);
          setSelectedVideoFromLibrary(video);
          setIsVideoLibraryOpen(false);
        }}
        editingItem={null}
      />

      {/* Update Scope Dialog */}
      <Dialog
        open={showUpdateScopeDialog}
        onOpenChange={setShowUpdateScopeDialog}
      >
        <DialogContent className="bg-[#2A3133] border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-white">
              Update Program Scope
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              This program has active client assignments. Choose how to apply
              your changes:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-3">
              <div
                className="flex items-start space-x-3 p-4 rounded-lg border border-gray-600 hover:bg-gray-700/50 cursor-pointer"
                onClick={() => setUpdateScope("all")}
              >
                <RadioGroupItem
                  value="all"
                  id="all"
                  className="mt-1"
                  checked={updateScope === "all"}
                  onChange={() => setUpdateScope("all")}
                />
                <div className="flex-1">
                  <Label
                    htmlFor="all"
                    className="text-white font-medium cursor-pointer"
                  >
                    Update All Assignments
                  </Label>
                  <p className="text-sm text-gray-400 mt-1">
                    Apply changes to ALL assigned clients. This updates the
                    program for all existing assignments.
                  </p>
                </div>
              </div>
              <div
                className="flex items-start space-x-3 p-4 rounded-lg border border-gray-600 hover:bg-gray-700/50 cursor-pointer"
                onClick={() => setUpdateScope("future")}
              >
                <RadioGroupItem
                  value="future"
                  id="future"
                  className="mt-1"
                  checked={updateScope === "future"}
                  onChange={() => setUpdateScope("future")}
                />
                <div className="flex-1">
                  <Label
                    htmlFor="future"
                    className="text-white font-medium cursor-pointer"
                  >
                    Don't Change Existing Assignments
                  </Label>
                  <p className="text-sm text-gray-400 mt-1">
                    Create a new program version. All existing assignments keep
                    the original program unchanged. New assignments will use the
                    updated version.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowUpdateScopeDialog(false);
                setPendingSave(null);
              }}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Program
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function ProgramEditorPage() {
  return <ProgramEditorPageContent />;
}
