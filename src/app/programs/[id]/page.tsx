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

  // Get utils for cache invalidation
  const utils = trpc.useUtils();

  // Mutations
  const updateProgramMutation = trpc.programs.update.useMutation({
    onSuccess: () => {
      console.log("=== SAVE SUCCESS - REFETCHING PROGRAM ===");
      setLocalIsSaving(false);
      setLocalLastSaved(new Date());
      isRefetchingAfterSaveRef.current = true;
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
            sun:
              week.days
                .find(d => d.dayNumber === 1)
                ?.drills?.map(drill => ({
                  id: drill.id,
                  title: drill.title,
                  type: drill.routineId
                    ? "routine"
                    : drill.supersetId
                    ? "superset"
                    : (drill.type as "exercise" | "drill" | "video") ||
                      undefined,
                  notes: drill.description || drill.notes || "",
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
            mon:
              week.days
                .find(d => d.dayNumber === 2)
                ?.drills?.map(drill => ({
                  id: drill.id,
                  title: drill.title,
                  type: drill.routineId
                    ? "routine"
                    : drill.supersetId
                    ? "superset"
                    : (drill.type as "exercise" | "drill" | "video") ||
                      undefined,
                  notes: drill.description || drill.notes || "",
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
                .find(d => d.dayNumber === 3)
                ?.drills?.map(drill => ({
                  id: drill.id,
                  title: drill.title,
                  type: drill.routineId
                    ? "routine"
                    : drill.supersetId
                    ? "superset"
                    : (drill.type as "exercise" | "drill" | "video") ||
                      undefined,
                  notes: drill.description || drill.notes || "",
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
                .find(d => d.dayNumber === 4)
                ?.drills?.map(drill => ({
                  id: drill.id,
                  title: drill.title,
                  type: drill.routineId
                    ? "routine"
                    : drill.supersetId
                    ? "superset"
                    : (drill.type as "exercise" | "drill" | "video") ||
                      undefined,
                  notes: drill.description || drill.notes || "",
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
                .find(d => d.dayNumber === 5)
                ?.drills?.map(drill => ({
                  id: drill.id,
                  title: drill.title,
                  type: drill.routineId
                    ? "routine"
                    : drill.supersetId
                    ? "superset"
                    : (drill.type as "exercise" | "drill" | "video") ||
                      undefined,
                  notes: drill.description || drill.notes || "",
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
                .find(d => d.dayNumber === 6)
                ?.drills?.map(drill => ({
                  id: drill.id,
                  title: drill.title,
                  type: drill.routineId
                    ? "routine"
                    : drill.supersetId
                    ? "superset"
                    : (drill.type as "exercise" | "drill" | "video") ||
                      undefined,
                  notes: drill.description || drill.notes || "",
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
                .find(d => d.dayNumber === 7)
                ?.drills?.map(drill => ({
                  id: drill.id,
                  title: drill.title,
                  type: drill.routineId
                    ? "routine"
                    : drill.supersetId
                    ? "superset"
                    : (drill.type as "exercise" | "drill" | "video") ||
                      undefined,
                  notes: drill.description || drill.notes || "",
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

    setLocalIsSaving(true);

    try {
      // Convert ProgramBuilder weeks back to database format
      console.log("=== CONVERTING PROGRAMBUILDER TO DATABASE ===");
      console.log("weeks to convert:", weeks);
      const convertedWeeks = weeks.map((builderWeek, weekIndex) => ({
        weekNumber: weekIndex + 1,
        title: builderWeek.name,
        description: "",
        days: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map(dayKey => {
          const items =
            builderWeek.days[dayKey as keyof typeof builderWeek.days];
          const dayNumber =
            dayKey === "sun"
              ? 1
              : dayKey === "mon"
              ? 2
              : dayKey === "tue"
              ? 3
              : dayKey === "wed"
              ? 4
              : dayKey === "thu"
              ? 5
              : dayKey === "fri"
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
            drills: items.map((item, itemIndex) => ({
              id: item.id,
              title: item.title,
              description: item.notes || "",
              duration: item.duration || "",
              videoUrl: item.videoUrl || "",
              notes: item.notes || "",
              type: item.type || "exercise",
              sets: item.sets,
              reps: item.reps,
              tempo: item.tempo || "",
              videoId: item.videoId,
              videoTitle: item.videoTitle,
              videoThumbnail: item.videoThumbnail,
              routineId: item.routineId,
              supersetId: item.supersetId,
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
            })),
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
    </>
  );
}

export default function ProgramEditorPage() {
  return <ProgramEditorPageContent />;
}
