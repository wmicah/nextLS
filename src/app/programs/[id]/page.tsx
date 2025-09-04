"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import { ArrowLeft, Save, Plus } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ProgramBuilder from "@/components/ProgramBuilder";
import { useToast } from "@/lib/hooks/use-toast";
import { Button } from "@/components/ui/button";

// Types for ProgramBuilder integration
type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

interface ProgramBuilderItem {
  id: string;
  title: string;
  type?: "exercise" | "drill" | "video";
  notes?: string;
  sets?: number;
  reps?: number;
  tempo?: string;
  duration?: string;
  videoUrl?: string;
  videoId?: string;
  videoTitle?: string;
  videoThumbnail?: string;
}

interface ProgramBuilderWeek {
  id: string;
  name: string;
  days: Record<DayKey, ProgramBuilderItem[]>;
  collapsed?: boolean;
}

export default function ProgramEditorPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.id as string;
  const { toast } = useToast();

  // State
  const [localIsSaving, setLocalIsSaving] = useState(false);
  const [localLastSaved, setLocalLastSaved] = useState<Date | null>(null);
  const [programBuilderWeeks, setProgramBuilderWeeks] = useState<
    ProgramBuilderWeek[]
  >([]);

  // Fetch program data
  const { data: program, refetch: refetchProgram } =
    trpc.programs.getById.useQuery(
      { id: programId },
      {
        enabled: !!programId,
      }
    );

  // Mutations
  const updateProgramMutation = trpc.programs.update.useMutation({
    onSuccess: () => {
      setLocalIsSaving(false);
      setLocalLastSaved(new Date());
      toast({
        title: "Program saved",
        description: "Your program has been saved successfully.",
      });
      refetchProgram();
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
    if (program && program.weeks) {
      const convertedWeeks: ProgramBuilderWeek[] = program.weeks.map(
        (week, weekIndex) => ({
          id: `week-${week.weekNumber}`,
          name: week.title || `Week ${week.weekNumber}`,
          collapsed: false,
          days: {
            sun:
              week.days
                .find(d => d.dayNumber === 7)
                ?.drills?.map(drill => ({
                  id: drill.id,
                  title: drill.title,
                  type:
                    (drill.type as "exercise" | "drill" | "video") || undefined,
                  notes: drill.description || drill.notes || "",
                  sets: drill.sets || undefined,
                  reps: drill.reps || undefined,
                  tempo: drill.tempo || "",
                  duration: drill.duration || "",
                  videoUrl: drill.videoUrl || "",
                  videoId: drill.videoId || "",
                  videoTitle: drill.videoTitle || "",
                  videoThumbnail: drill.videoThumbnail || "",
                })) || [],
            mon:
              week.days
                .find(d => d.dayNumber === 1)
                ?.drills?.map(drill => ({
                  id: drill.id,
                  title: drill.title,
                  type:
                    (drill.type as "exercise" | "drill" | "video") || undefined,
                  notes: drill.description || drill.notes || "",
                  sets: drill.sets || undefined,
                  reps: drill.reps || undefined,
                  tempo: drill.tempo || "",
                  duration: drill.duration || "",
                  videoUrl: drill.videoUrl || "",
                  videoId: drill.videoId || "",
                  videoTitle: drill.videoTitle || "",
                  videoThumbnail: drill.videoThumbnail || "",
                })) || [],
            tue:
              week.days
                .find(d => d.dayNumber === 2)
                ?.drills?.map(drill => ({
                  id: drill.id,
                  title: drill.title,
                  type:
                    (drill.type as "exercise" | "drill" | "video") || undefined,
                  notes: drill.description || drill.notes || "",
                  sets: drill.sets || undefined,
                  reps: drill.reps || undefined,
                  tempo: drill.tempo || "",
                  duration: drill.duration || "",
                  videoUrl: drill.videoUrl || "",
                  videoId: drill.videoId || "",
                  videoTitle: drill.videoTitle || "",
                  videoThumbnail: drill.videoThumbnail || "",
                })) || [],
            wed:
              week.days
                .find(d => d.dayNumber === 3)
                ?.drills?.map(drill => ({
                  id: drill.id,
                  title: drill.title,
                  type:
                    (drill.type as "exercise" | "drill" | "video") || undefined,
                  notes: drill.description || drill.notes || "",
                  sets: drill.sets || undefined,
                  reps: drill.reps || undefined,
                  tempo: drill.tempo || "",
                  duration: drill.duration || "",
                  videoUrl: drill.videoUrl || "",
                  videoId: drill.videoId || "",
                  videoTitle: drill.videoTitle || "",
                  videoThumbnail: drill.videoThumbnail || "",
                })) || [],
            thu:
              week.days
                .find(d => d.dayNumber === 4)
                ?.drills?.map(drill => ({
                  id: drill.id,
                  title: drill.title,
                  type:
                    (drill.type as "exercise" | "drill" | "video") || undefined,
                  notes: drill.description || drill.notes || "",
                  sets: drill.sets || undefined,
                  reps: drill.reps || undefined,
                  tempo: drill.tempo || "",
                  duration: drill.duration || "",
                  videoUrl: drill.videoUrl || "",
                  videoId: drill.videoId || "",
                  videoTitle: drill.videoTitle || "",
                  videoThumbnail: drill.videoThumbnail || "",
                })) || [],
            fri:
              week.days
                .find(d => d.dayNumber === 5)
                ?.drills?.map(drill => ({
                  id: drill.id,
                  title: drill.title,
                  type:
                    (drill.type as "exercise" | "drill" | "video") || undefined,
                  notes: drill.description || drill.notes || "",
                  sets: drill.sets || undefined,
                  reps: drill.reps || undefined,
                  tempo: drill.tempo || "",
                  duration: drill.duration || "",
                  videoUrl: drill.videoUrl || "",
                  videoId: drill.videoId || "",
                  videoTitle: drill.videoTitle || "",
                  videoThumbnail: drill.videoThumbnail || "",
                })) || [],
            sat:
              week.days
                .find(d => d.dayNumber === 6)
                ?.drills?.map(drill => ({
                  id: drill.id,
                  title: drill.title,
                  type:
                    (drill.type as "exercise" | "drill" | "video") || undefined,
                  notes: drill.description || drill.notes || "",
                  sets: drill.sets || undefined,
                  reps: drill.reps || undefined,
                  tempo: drill.tempo || "",
                  duration: drill.duration || "",
                  videoUrl: drill.videoUrl || "",
                  videoId: drill.videoId || "",
                  videoTitle: drill.videoTitle || "",
                  videoThumbnail: drill.videoThumbnail || "",
                })) || [],
          },
        })
      );

      setProgramBuilderWeeks(convertedWeeks);
    }
  }, [program]);

  // Handle ProgramBuilder save
  const handleProgramBuilderSave = (weeks: ProgramBuilderWeek[]) => {
    setProgramBuilderWeeks(weeks);
    console.log("ProgramBuilder weeks updated:", weeks);
  };

  // Convert ProgramBuilder data back to database format and save
  const handleSave = async () => {
    if (!program || !programBuilderWeeks.length) return;

    setLocalIsSaving(true);

    try {
      // Convert ProgramBuilder weeks back to database format
      const convertedWeeks = programBuilderWeeks.map(
        (builderWeek, weekIndex) => ({
          weekNumber: weekIndex + 1,
          title: builderWeek.name,
          description: "",
          days: Object.entries(builderWeek.days).map(
            ([dayKey, items], dayIndex) => {
              const dayNumber =
                dayKey === "sun"
                  ? 7
                  : dayKey === "mon"
                  ? 1
                  : dayKey === "tue"
                  ? 2
                  : dayKey === "wed"
                  ? 3
                  : dayKey === "thu"
                  ? 4
                  : dayKey === "fri"
                  ? 5
                  : 6;

              // If the day has no items, make it a rest day
              if (items.length === 0) {
                return {
                  dayNumber,
                  title: "Rest Day",
                  description: "Recovery and rest day",
                  drills: [
                    {
                      id: `rest-day-${dayNumber}`,
                      title: "Rest Day",
                      description:
                        "Take this day to recover and rest. No specific exercises required.",
                      duration: "",
                      videoUrl: "",
                      notes: "This is an automatically generated rest day.",
                      type: "exercise",
                      sets: undefined,
                      reps: undefined,
                      tempo: "",
                    },
                  ],
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
                })),
              };
            }
          ),
        })
      );

      // Update the program with the new structure
      await updateProgramMutation.mutateAsync({
        id: programId,
        title: program.title || "",
        description: program.description || "",
        weeks: convertedWeeks,
      });

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
    <Sidebar>
      <div className="min-h-screen bg-[#2A3133]">
        {/* Header */}
        <div className="bg-[#353A3A] border-b border-gray-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {program.title || "Untitled Program"}
                </h1>
                {program.description && (
                  <p className="text-gray-400 mt-1">{program.description}</p>
                )}
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={localIsSaving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {localIsSaving ? "Saving..." : "Save Program"}
            </Button>
          </div>
          {localLastSaved && (
            <p className="text-sm text-gray-500 mt-2">
              Last saved: {localLastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Program Builder */}
        <ProgramBuilder
          onSave={handleProgramBuilderSave}
          initialWeeks={programBuilderWeeks}
          programDetails={{
            title: program.title || "Untitled Program",
            description: program.description || "",
            level: program.level || "Drive",
            duration: program.weeks?.length || 1,
          }}
        />
      </div>
    </Sidebar>
  );
}
