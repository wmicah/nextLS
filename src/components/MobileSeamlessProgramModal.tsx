"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card, CardContent } from "./ui/card";
import { Plus, Trash2, ArrowRight, X, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import MobileProgramBuilder from "./MobileProgramBuilder";
import VideoLibraryDialog from "./VideoLibraryDialog";
import { useToast } from "@/lib/hooks/use-toast";
import { trpc } from "@/app/_trpc/client";
import { COLORS } from "@/lib/colors";

// Default program categories
const DEFAULT_PROGRAM_CATEGORIES = [
  "Drive",
  "Whip",
  "Separation",
  "Stability",
  "Extension",
];

const programSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(60, "Title must be 60 characters or less"),
  description: z.string().optional(),
  level: z.string().min(1, "Focus area is required"),
  duration: z.number().min(1, "Duration must be at least 1 week"),
  weeks: z.array(
    z.object({
      weekNumber: z.number(),
      title: z.string().min(1, "Week title is required"),
      description: z.string().optional(),
      days: z.array(
        z.object({
          dayNumber: z.number(),
          title: z.string().min(1, "Day title is required"),
          description: z.string().optional(),
          drills: z.array(
            z.object({
              order: z.number(),
              id: z.string().optional(),
              title: z.string().min(1, "Drill title is required"),
              description: z.string().optional(),
              duration: z.string().optional(),
              videoUrl: z.string().url().optional().or(z.literal("")),
              notes: z.string().optional(),
              type: z.string().optional(),
              sets: z.number().optional(),
              reps: z.number().optional(),
              tempo: z.string().optional(),
              routineId: z.string().optional(),
              supersetId: z.string().optional(),
              supersetOrder: z.number().optional(),
              videoId: z.string().optional(),
              videoTitle: z.string().optional(),
              videoThumbnail: z.string().optional(),
              supersetDescription: z.string().optional(),
              supersetInstructions: z.string().optional(),
              supersetNotes: z.string().optional(),
              // Coach Instructions
              coachInstructionsWhatToDo: z.string().optional(),
              coachInstructionsHowToDoIt: z.string().optional(),
              coachInstructionsKeyPoints: z.array(z.string()).optional(),
              coachInstructionsCommonMistakes: z.array(z.string()).optional(),
              coachInstructionsEasier: z.string().optional(),
              coachInstructionsHarder: z.string().optional(),
              coachInstructionsEquipment: z.string().optional(),
              coachInstructionsSetup: z.string().optional(),
            })
          ),
        })
      ),
    })
  ),
});

type ProgramFormData = z.infer<typeof programSchema>;

// Types for the ProgramBuilder integration
type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

interface ProgramBuilderItem {
  id: string;
  title: string;
  type?: "exercise" | "drill" | "video" | "routine" | "superset" | "rest";
  notes?: string;
  sets?: number;
  reps?: number;
  tempo?: string;
  duration?: string;
  videoUrl?: string;
  videoId?: string;
  videoTitle?: string;
  videoThumbnail?: string;
  routineId?: string;
  supersetId?: string;
  supersetOrder?: number;
  supersetDescription?: string;
  supersetInstructions?: string;
  supersetNotes?: string;
  description?: string;
}

interface ProgramBuilderWeek {
  id: string;
  name: string;
  days: Record<DayKey, ProgramBuilderItem[]>;
  collapsed?: boolean;
}

interface MobileSeamlessProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProgramFormData) => void;
  program?: {
    id: string;
    title: string;
    description?: string | null;
    level: string;
    duration: number;
  } | null;
  onOpenVideoLibrary?: () => void;
  selectedVideoFromLibrary?: {
    id: string;
    title: string;
    description?: string;
    duration?: string;
    url?: string;
    thumbnail?: string;
  } | null;
  onVideoProcessed?: () => void;
  onSuccess?: () => void;
}

export default function MobileSeamlessProgramModal({
  isOpen,
  onClose,
  onSubmit,
  program,
  onOpenVideoLibrary,
  selectedVideoFromLibrary: selectedVideoFromLibraryProp,
  onVideoProcessed,
  onSuccess,
}: MobileSeamlessProgramModalProps) {
  const [currentStep, setCurrentStep] = useState<
    "details" | "structure" | "review"
  >("details");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initializedRef = useRef(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [isVideoLibraryOpen, setIsVideoLibraryOpen] = useState(false);
  const [internalSelectedVideo, setInternalSelectedVideo] = useState<{
    id: string;
    title: string;
    description?: string;
    duration?: string;
    url?: string;
    thumbnail?: string;
  } | null>(null);

  // Use prop if provided, otherwise use internal state
  const selectedVideoFromLibrary =
    selectedVideoFromLibraryProp !== undefined
      ? selectedVideoFromLibraryProp
      : internalSelectedVideo;

  // ProgramBuilder state
  const [programBuilderWeeks, setProgramBuilderWeeks] = useState<
    ProgramBuilderWeek[]
  >([]);

  const { toast } = useToast();

  // Fetch program categories (for custom ones) - only when modal is open
  const { data: programCategoriesData = [] } =
    trpc.programs.getCategories.useQuery(undefined, {
      enabled: isOpen,
    });

  // Fetch full program data when editing
  const { data: fullProgramData, isLoading: isLoadingProgram } =
    trpc.programs.getById.useQuery(
      { id: program?.id || "" },
      { enabled: isOpen && !!program?.id }
    );

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<ProgramFormData>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      title: "",
      description: "",
      level: "Drive",
      duration: 1,
      weeks: [],
    },
  });

  const watchedValues = watch();

  // Initialize weeks based on duration
  useEffect(() => {
    if (!initializedRef.current && programBuilderWeeks.length === 0 && isOpen) {
      const duration = watchedValues.duration || 1;
      const initialWeeks = Array.from({ length: duration }, (_, index) => ({
        id: `week-${Date.now()}-${index}`,
        name: `Week ${index + 1}`,
        days: {
          sun: [],
          mon: [],
          tue: [],
          wed: [],
          thu: [],
          fri: [],
          sat: [],
        },
        collapsed: false,
      }));
      setProgramBuilderWeeks(initialWeeks);
      initializedRef.current = true;
    }
  }, [programBuilderWeeks.length, watchedValues.duration, isOpen]);

  // Load program data when editing
  useEffect(() => {
    if (isOpen && program && fullProgramData && !initializedRef.current) {
      // Load program data into form
      reset({
        title: fullProgramData.title,
        description: fullProgramData.description || "",
        level: fullProgramData.level,
        duration: fullProgramData.duration,
        weeks: [],
      });

      // Convert program weeks to ProgramBuilder format
      const convertedWeeks: ProgramBuilderWeek[] = fullProgramData.weeks
        .sort((a, b) => a.weekNumber - b.weekNumber)
        .map(week => {
          const days: Record<DayKey, ProgramBuilderItem[]> = {
            sun: [],
            mon: [],
            tue: [],
            wed: [],
            thu: [],
            fri: [],
            sat: [],
          };

          // Convert days
          week.days
            .sort((a, b) => a.dayNumber - b.dayNumber)
            .forEach(day => {
              const dayKeyMap: Record<number, DayKey> = {
                1: "mon",
                2: "tue",
                3: "wed",
                4: "thu",
                5: "fri",
                6: "sat",
                7: "sun",
              };
              const dayKey = dayKeyMap[day.dayNumber] || "mon";

              // Convert drills to ProgramBuilder items
              const items: ProgramBuilderItem[] = day.drills
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map(
                  drill =>
                    ({
                      id: drill.id,
                      title: drill.title,
                      type: (drill.type || "exercise") as
                        | "exercise"
                        | "drill"
                        | "video"
                        | "routine"
                        | "superset"
                        | "rest",
                      notes: drill.notes || drill.description || "",
                      sets: drill.sets || undefined,
                      reps: drill.reps || undefined,
                      tempo: drill.tempo || undefined,
                      duration: drill.duration || undefined,
                      videoUrl: drill.videoUrl || undefined,
                      videoId: (drill as any).videoId || undefined,
                      videoTitle: (drill as any).videoTitle || undefined,
                      videoThumbnail:
                        (drill as any).videoThumbnail || undefined,
                      routineId: drill.routineId || undefined,
                      supersetId: drill.supersetId || undefined,
                      supersetOrder: drill.supersetOrder || undefined,
                      supersetDescription: (drill as any).supersetDescription,
                      supersetInstructions: (drill as any).supersetInstructions,
                      supersetNotes: (drill as any).supersetNotes,
                      description: drill.description || drill.notes || "",
                      // Store coach instructions in the item (even though not in interface)
                      coachInstructionsWhatToDo: (drill as any)
                        .coachInstructionsWhatToDo,
                      coachInstructionsHowToDoIt: (drill as any)
                        .coachInstructionsHowToDoIt,
                      coachInstructionsKeyPoints: (drill as any)
                        .coachInstructionsKeyPoints,
                      coachInstructionsCommonMistakes: (drill as any)
                        .coachInstructionsCommonMistakes,
                      coachInstructionsEasier: (drill as any)
                        .coachInstructionsEasier,
                      coachInstructionsHarder: (drill as any)
                        .coachInstructionsHarder,
                      coachInstructionsEquipment: (drill as any)
                        .coachInstructionsEquipment,
                      coachInstructionsSetup: (drill as any)
                        .coachInstructionsSetup,
                    } as ProgramBuilderItem & {
                      coachInstructionsWhatToDo?: string;
                      coachInstructionsHowToDoIt?: string;
                      coachInstructionsKeyPoints?: string[];
                      coachInstructionsCommonMistakes?: string[];
                      coachInstructionsEasier?: string;
                      coachInstructionsHarder?: string;
                      coachInstructionsEquipment?: string;
                      coachInstructionsSetup?: string;
                    })
                );

              days[dayKey] = items;
            });

          return {
            id: week.id,
            name: week.title,
            days,
            collapsed: false,
          };
        });

      setProgramBuilderWeeks(convertedWeeks);
      initializedRef.current = true;
    } else if (isOpen && !program && !initializedRef.current) {
      // Reset form for new program
      reset({
        title: "",
        description: "",
        level: "Drive",
        duration: 1,
        weeks: [],
      });
      setCurrentStep("details");
      initializedRef.current = false;
      setProgramBuilderWeeks([]);
      setInternalSelectedVideo(null);
      
      // Initialize weeks immediately for new program
      const initialWeeks = Array.from({ length: 1 }, (_, index) => ({
        id: `week-${Date.now()}-${index}`,
        name: `Week ${index + 1}`,
        days: {
          sun: [],
          mon: [],
          tue: [],
          wed: [],
          thu: [],
          fri: [],
          sat: [],
        },
        collapsed: false,
      }));
      setProgramBuilderWeeks(initialWeeks);
      initializedRef.current = true;
    } else if (!isOpen) {
      // Reset when modal closes
      initializedRef.current = false;
      setProgramBuilderWeeks([]);
      setInternalSelectedVideo(null);
    }
  }, [isOpen, program, fullProgramData, reset]);

  // Regenerate weeks when duration changes
  useEffect(() => {
    if (
      initializedRef.current &&
      watchedValues.duration &&
      watchedValues.duration > 0
    ) {
      const currentDuration = watchedValues.duration;
      const currentWeeks = programBuilderWeeks.length;

      if (currentDuration !== currentWeeks) {
        if (currentDuration > currentWeeks) {
          // Add more weeks
          const newWeeks = Array.from(
            { length: currentDuration - currentWeeks },
            (_, index) => ({
              id: `week-${Date.now()}-${currentWeeks + index}`,
              name: `Week ${currentWeeks + index + 1}`,
              days: {
                sun: [],
                mon: [],
                tue: [],
                wed: [],
                thu: [],
                fri: [],
                sat: [],
              },
              collapsed: false,
            })
          );
          setProgramBuilderWeeks(prev => [...prev, ...newWeeks]);
        } else if (currentDuration < currentWeeks) {
          // Remove excess weeks
          setProgramBuilderWeeks(prev => prev.slice(0, currentDuration));
        }
      }
    }
  }, [watchedValues.duration]);

  const handleProgramBuilderSave = useCallback(
    (weeks: ProgramBuilderWeek[]) => {
      setProgramBuilderWeeks(weeks);
      // Auto-update duration based on number of weeks
      setValue("duration", weeks.length);
    },
    [setValue]
  );

  const canProceedToStructure =
    watchedValues.title?.trim() &&
    watchedValues.level &&
    watchedValues.duration;
  const canProceedToReview = programBuilderWeeks.length > 0;

  const handleSubmitForm = async (data: ProgramFormData) => {
    setIsSubmitting(true);

    try {
      // Convert ProgramBuilder weeks to the format expected by the schema
      const convertedWeeks = programBuilderWeeks.map((week, weekIndex) => ({
        weekNumber: weekIndex + 1,
        title: week.name,
        description: "",
        days: [
          {
            dayNumber: 1,
            title: "Monday",
            description: "",
            drills: week.days.mon.map((item, index) => ({
              order: index + 1,
              id: item.id || `temp-${Date.now()}-${index}`,
              title: item.title,
              description: item.notes || item.description || "",
              notes: item.notes || "",
              type: item.type || "exercise",
              sets: item.sets,
              reps: item.reps,
              tempo: item.tempo || "",
              duration: item.duration || "",
              videoUrl: item.videoUrl || "",
              videoId: item.videoId || "",
              videoTitle: item.videoTitle || "",
              videoThumbnail: item.videoThumbnail || "",
              routineId: item.routineId || "",
              supersetId: item.supersetId || "",
              supersetOrder: item.supersetOrder,
              supersetDescription: item.supersetDescription || "",
              supersetInstructions: item.supersetInstructions || "",
              supersetNotes: item.supersetNotes || "",
              coachInstructionsWhatToDo:
                (item as any).coachInstructionsWhatToDo || "",
              coachInstructionsHowToDoIt:
                (item as any).coachInstructionsHowToDoIt || "",
              coachInstructionsKeyPoints:
                (item as any).coachInstructionsKeyPoints || [],
              coachInstructionsCommonMistakes:
                (item as any).coachInstructionsCommonMistakes || [],
              coachInstructionsEasier:
                (item as any).coachInstructionsEasier || "",
              coachInstructionsHarder:
                (item as any).coachInstructionsHarder || "",
              coachInstructionsEquipment:
                (item as any).coachInstructionsEquipment || "",
              coachInstructionsSetup:
                (item as any).coachInstructionsSetup || "",
            })),
          },
          {
            dayNumber: 2,
            title: "Tuesday",
            description: "",
            drills: week.days.tue.map((item, index) => ({
              order: index + 1,
              id: item.id || `temp-${Date.now()}-${index}`,
              title: item.title,
              description: item.notes || item.description || "",
              notes: item.notes || "",
              type: item.type || "exercise",
              sets: item.sets,
              reps: item.reps,
              tempo: item.tempo || "",
              duration: item.duration || "",
              videoUrl: item.videoUrl || "",
              videoId: item.videoId || "",
              videoTitle: item.videoTitle || "",
              videoThumbnail: item.videoThumbnail || "",
              routineId: item.routineId || "",
              supersetId: item.supersetId || "",
              supersetOrder: item.supersetOrder,
              supersetDescription: item.supersetDescription || "",
              supersetInstructions: item.supersetInstructions || "",
              supersetNotes: item.supersetNotes || "",
              coachInstructionsWhatToDo:
                (item as any).coachInstructionsWhatToDo || "",
              coachInstructionsHowToDoIt:
                (item as any).coachInstructionsHowToDoIt || "",
              coachInstructionsKeyPoints:
                (item as any).coachInstructionsKeyPoints || [],
              coachInstructionsCommonMistakes:
                (item as any).coachInstructionsCommonMistakes || [],
              coachInstructionsEasier:
                (item as any).coachInstructionsEasier || "",
              coachInstructionsHarder:
                (item as any).coachInstructionsHarder || "",
              coachInstructionsEquipment:
                (item as any).coachInstructionsEquipment || "",
              coachInstructionsSetup:
                (item as any).coachInstructionsSetup || "",
            })),
          },
          {
            dayNumber: 3,
            title: "Wednesday",
            description: "",
            drills: week.days.wed.map((item, index) => ({
              order: index + 1,
              id: item.id || `temp-${Date.now()}-${index}`,
              title: item.title,
              description: item.notes || item.description || "",
              notes: item.notes || "",
              type: item.type || "exercise",
              sets: item.sets,
              reps: item.reps,
              tempo: item.tempo || "",
              duration: item.duration || "",
              videoUrl: item.videoUrl || "",
              videoId: item.videoId || "",
              videoTitle: item.videoTitle || "",
              videoThumbnail: item.videoThumbnail || "",
              routineId: item.routineId || "",
              supersetId: item.supersetId || "",
              supersetOrder: item.supersetOrder,
              supersetDescription: item.supersetDescription || "",
              supersetInstructions: item.supersetInstructions || "",
              supersetNotes: item.supersetNotes || "",
              coachInstructionsWhatToDo:
                (item as any).coachInstructionsWhatToDo || "",
              coachInstructionsHowToDoIt:
                (item as any).coachInstructionsHowToDoIt || "",
              coachInstructionsKeyPoints:
                (item as any).coachInstructionsKeyPoints || [],
              coachInstructionsCommonMistakes:
                (item as any).coachInstructionsCommonMistakes || [],
              coachInstructionsEasier:
                (item as any).coachInstructionsEasier || "",
              coachInstructionsHarder:
                (item as any).coachInstructionsHarder || "",
              coachInstructionsEquipment:
                (item as any).coachInstructionsEquipment || "",
              coachInstructionsSetup:
                (item as any).coachInstructionsSetup || "",
            })),
          },
          {
            dayNumber: 4,
            title: "Thursday",
            description: "",
            drills: week.days.thu.map((item, index) => ({
              order: index + 1,
              id: item.id || `temp-${Date.now()}-${index}`,
              title: item.title,
              description: item.notes || item.description || "",
              notes: item.notes || "",
              type: item.type || "exercise",
              sets: item.sets,
              reps: item.reps,
              tempo: item.tempo || "",
              duration: item.duration || "",
              videoUrl: item.videoUrl || "",
              videoId: item.videoId || "",
              videoTitle: item.videoTitle || "",
              videoThumbnail: item.videoThumbnail || "",
              routineId: item.routineId || "",
              supersetId: item.supersetId || "",
              supersetOrder: item.supersetOrder,
              supersetDescription: item.supersetDescription || "",
              supersetInstructions: item.supersetInstructions || "",
              supersetNotes: item.supersetNotes || "",
              coachInstructionsWhatToDo:
                (item as any).coachInstructionsWhatToDo || "",
              coachInstructionsHowToDoIt:
                (item as any).coachInstructionsHowToDoIt || "",
              coachInstructionsKeyPoints:
                (item as any).coachInstructionsKeyPoints || [],
              coachInstructionsCommonMistakes:
                (item as any).coachInstructionsCommonMistakes || [],
              coachInstructionsEasier:
                (item as any).coachInstructionsEasier || "",
              coachInstructionsHarder:
                (item as any).coachInstructionsHarder || "",
              coachInstructionsEquipment:
                (item as any).coachInstructionsEquipment || "",
              coachInstructionsSetup:
                (item as any).coachInstructionsSetup || "",
            })),
          },
          {
            dayNumber: 5,
            title: "Friday",
            description: "",
            drills: week.days.fri.map((item, index) => ({
              order: index + 1,
              id: item.id || `temp-${Date.now()}-${index}`,
              title: item.title,
              description: item.notes || item.description || "",
              notes: item.notes || "",
              type: item.type || "exercise",
              sets: item.sets,
              reps: item.reps,
              tempo: item.tempo || "",
              duration: item.duration || "",
              videoUrl: item.videoUrl || "",
              videoId: item.videoId || "",
              videoTitle: item.videoTitle || "",
              videoThumbnail: item.videoThumbnail || "",
              routineId: item.routineId || "",
              supersetId: item.supersetId || "",
              supersetOrder: item.supersetOrder,
              supersetDescription: item.supersetDescription || "",
              supersetInstructions: item.supersetInstructions || "",
              supersetNotes: item.supersetNotes || "",
              coachInstructionsWhatToDo:
                (item as any).coachInstructionsWhatToDo || "",
              coachInstructionsHowToDoIt:
                (item as any).coachInstructionsHowToDoIt || "",
              coachInstructionsKeyPoints:
                (item as any).coachInstructionsKeyPoints || [],
              coachInstructionsCommonMistakes:
                (item as any).coachInstructionsCommonMistakes || [],
              coachInstructionsEasier:
                (item as any).coachInstructionsEasier || "",
              coachInstructionsHarder:
                (item as any).coachInstructionsHarder || "",
              coachInstructionsEquipment:
                (item as any).coachInstructionsEquipment || "",
              coachInstructionsSetup:
                (item as any).coachInstructionsSetup || "",
            })),
          },
          {
            dayNumber: 6,
            title: "Saturday",
            description: "",
            drills: week.days.sat.map((item, index) => ({
              order: index + 1,
              id: item.id || `temp-${Date.now()}-${index}`,
              title: item.title,
              description: item.notes || item.description || "",
              notes: item.notes || "",
              type: item.type || "exercise",
              sets: item.sets,
              reps: item.reps,
              tempo: item.tempo || "",
              duration: item.duration || "",
              videoUrl: item.videoUrl || "",
              videoId: item.videoId || "",
              videoTitle: item.videoTitle || "",
              videoThumbnail: item.videoThumbnail || "",
              routineId: item.routineId || "",
              supersetId: item.supersetId || "",
              supersetOrder: item.supersetOrder,
              supersetDescription: item.supersetDescription || "",
              supersetInstructions: item.supersetInstructions || "",
              supersetNotes: item.supersetNotes || "",
              coachInstructionsWhatToDo:
                (item as any).coachInstructionsWhatToDo || "",
              coachInstructionsHowToDoIt:
                (item as any).coachInstructionsHowToDoIt || "",
              coachInstructionsKeyPoints:
                (item as any).coachInstructionsKeyPoints || [],
              coachInstructionsCommonMistakes:
                (item as any).coachInstructionsCommonMistakes || [],
              coachInstructionsEasier:
                (item as any).coachInstructionsEasier || "",
              coachInstructionsHarder:
                (item as any).coachInstructionsHarder || "",
              coachInstructionsEquipment:
                (item as any).coachInstructionsEquipment || "",
              coachInstructionsSetup:
                (item as any).coachInstructionsSetup || "",
            })),
          },
          {
            dayNumber: 7,
            title: "Sunday",
            description: "",
            drills: week.days.sun.map((item, index) => ({
              order: index + 1,
              id: item.id || `temp-${Date.now()}-${index}`,
              title: item.title,
              description: item.notes || item.description || "",
              notes: item.notes || "",
              type: item.type || "exercise",
              sets: item.sets,
              reps: item.reps,
              tempo: item.tempo || "",
              duration: item.duration || "",
              videoUrl: item.videoUrl || "",
              videoId: item.videoId || "",
              videoTitle: item.videoTitle || "",
              videoThumbnail: item.videoThumbnail || "",
              routineId: item.routineId || "",
              supersetId: item.supersetId || "",
              supersetOrder: item.supersetOrder,
              supersetDescription: item.supersetDescription || "",
              supersetInstructions: item.supersetInstructions || "",
              supersetNotes: item.supersetNotes || "",
              coachInstructionsWhatToDo:
                (item as any).coachInstructionsWhatToDo || "",
              coachInstructionsHowToDoIt:
                (item as any).coachInstructionsHowToDoIt || "",
              coachInstructionsKeyPoints:
                (item as any).coachInstructionsKeyPoints || [],
              coachInstructionsCommonMistakes:
                (item as any).coachInstructionsCommonMistakes || [],
              coachInstructionsEasier:
                (item as any).coachInstructionsEasier || "",
              coachInstructionsHarder:
                (item as any).coachInstructionsHarder || "",
              coachInstructionsEquipment:
                (item as any).coachInstructionsEquipment || "",
              coachInstructionsSetup:
                (item as any).coachInstructionsSetup || "",
            })),
          },
        ],
      }));

      const programData = {
        ...data,
        weeks: convertedWeeks,
      };

      await onSubmit(programData);
      if (program) {
        toast({
          title: "Program updated! ✨",
          description: "Your program has been updated successfully.",
        });
      } else {
        toast({
          title: "Program created! 🎉",
          description: "Your new program has been saved successfully.",
        });
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating program:", error);
      toast({
        title: "Error",
        description: "Failed to create program. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Drive":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "Whip":
        return "bg-orange-500/20 text-orange-300 border-orange-500/30";
      case "Separation":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "Stability":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "Extension":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      default:
        return "";
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent
          style={{ backgroundColor: COLORS.BACKGROUND_DARK, borderColor: COLORS.BORDER_SUBTLE }}
          className={`max-h-[90dvh] h-[90dvh] overflow-hidden flex flex-col p-0 [&>button]:hidden max-w-[100vw] w-[100vw] sm:max-w-[95vw] sm:w-[95vw]`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div>
              <DialogTitle className="text-lg font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>
                {program ? "Edit Program" : "Create New Program"}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                {program
                  ? "Update your training program"
                  : "Build a comprehensive training program"}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="transition-colors"
              style={{ color: COLORS.TEXT_SECONDARY }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                e.currentTarget.style.backgroundColor = "#1C2021";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="px-4 py-3 border-b flex-shrink-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div className="flex items-center justify-center space-x-4">
              {[
                { key: "details", label: "Details" },
                { key: "structure", label: "Structure" },
                { key: "review", label: "Review" },
              ].map((step, index) => {
                const isActive = currentStep === step.key;
                const isCompleted =
                  (step.key === "details" && currentStep !== "details") ||
                  (step.key === "structure" && currentStep === "review") ||
                  (step.key === "review" && false);

                return (
                  <div key={step.key} className="flex items-center">
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300"
                      style={{
                        backgroundColor: isActive
                          ? COLORS.GOLDEN_ACCENT
                          : isCompleted
                          ? COLORS.GREEN_DARK
                          : "transparent",
                        borderColor: isActive
                          ? COLORS.GOLDEN_ACCENT
                          : isCompleted
                          ? COLORS.GREEN_DARK
                          : COLORS.BORDER_SUBTLE,
                        color: isActive || isCompleted ? "#FFFFFF" : COLORS.TEXT_MUTED,
                      }}
                    >
                      <span className="text-xs font-bold">
                        {isCompleted && !isActive ? "✓" : index + 1}
                      </span>
                    </div>
                    <span
                      className="ml-2 text-xs font-medium"
                      style={{ color: isActive ? COLORS.TEXT_PRIMARY : COLORS.TEXT_MUTED }}
                    >
                      {step.label}
                    </span>
                    {index < 2 && (
                      <ArrowRight className="h-3 w-3 mx-2" style={{ color: COLORS.BORDER_SUBTLE }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0 overflow-x-hidden">
            {isLoadingProgram && program ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div
                    className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
                    style={{ borderColor: COLORS.GOLDEN_ACCENT }}
                  />
                  <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>Loading program...</p>
                </div>
              </div>
            ) : (
              <>
                {currentStep === "details" && (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold mb-1" style={{ color: COLORS.TEXT_PRIMARY }}>
                        Program Details
                      </h3>
                      <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                        Set up the basic information for your training program
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label
                          htmlFor="program-title"
                          className="text-sm font-medium"
                          style={{ color: COLORS.TEXT_PRIMARY }}
                        >
                          Program Title *
                        </Label>
                        <Input
                          id="program-title"
                          {...register("title")}
                          placeholder="e.g., Advanced Hitting Program"
                          style={{ backgroundColor: "#2A2F2F", borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_PRIMARY }}
                          className="mt-2 h-11 text-base"
                          maxLength={60}
                        />
                        <div className="flex justify-between items-center mt-1">
                          {errors.title && (
                            <p className="text-xs" style={{ color: COLORS.RED_ALERT }}>
                              {errors.title.message}
                            </p>
                          )}
                          <p className="text-xs ml-auto" style={{ color: COLORS.TEXT_MUTED }}>
                            {watch("title")?.length || 0}/60 characters
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label
                          htmlFor="program-description"
                          className="text-sm font-medium"
                          style={{ color: COLORS.TEXT_PRIMARY }}
                        >
                          Description
                        </Label>
                        <Textarea
                          id="program-description"
                          {...register("description")}
                          placeholder="Describe what this program covers..."
                          style={{ backgroundColor: "#2A2F2F", borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_PRIMARY }}
                          className="mt-2 min-h-[80px] resize-none"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label
                            htmlFor="program-level"
                            className="text-sm font-medium"
                            style={{ color: COLORS.TEXT_PRIMARY }}
                          >
                            Focus Area *
                          </Label>

                          {!showCustomCategory ? (
                            <div className="space-y-2 mt-2">
                              <select
                                value={watchedValues.level}
                                onChange={e =>
                                  setValue("level", e.target.value)
                                }
                                style={{ backgroundColor: "#2A2F2F", borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_PRIMARY }}
                                className="w-full px-3 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 h-11 text-sm"
                              >
                                <option value="">Select focus area...</option>

                                <optgroup
                                  label="Standard Categories"
                                  style={{
                                    backgroundColor: "#1C2021",
                                    color: COLORS.TEXT_PRIMARY,
                                  }}
                                >
                                  {DEFAULT_PROGRAM_CATEGORIES.map(cat => (
                                    <option
                                      key={cat}
                                      value={cat}
                                      style={{
                                        backgroundColor: "#2A2F2F",
                                        color: COLORS.TEXT_PRIMARY,
                                      }}
                                    >
                                      {cat}
                                    </option>
                                  ))}
                                </optgroup>

                                {programCategoriesData.filter(
                                  (cat: any) =>
                                    !DEFAULT_PROGRAM_CATEGORIES.includes(
                                      cat.name
                                    )
                                ).length > 0 && (
                                  <optgroup
                                    label="Your Categories"
                                    style={{
                                      backgroundColor: "#1C2021",
                                      color: COLORS.TEXT_PRIMARY,
                                    }}
                                  >
                                    {programCategoriesData
                                      .filter(
                                        (cat: any) =>
                                          !DEFAULT_PROGRAM_CATEGORIES.includes(
                                            cat.name
                                          )
                                      )
                                      .map((cat: any) => (
                                        <option
                                          key={cat.name}
                                          value={cat.name}
                                          style={{
                                            backgroundColor: "#2A2F2F",
                                            color: COLORS.TEXT_PRIMARY,
                                          }}
                                        >
                                          {cat.name} ({cat.count})
                                        </option>
                                      ))}
                                  </optgroup>
                                )}
                              </select>

                              <button
                                type="button"
                                onClick={() => setShowCustomCategory(true)}
                                className="w-full p-2.5 rounded-lg border-2 border-dashed transition-all duration-200 flex items-center justify-center gap-2 font-medium text-xs"
                                style={{
                                  borderColor: COLORS.BORDER_SUBTLE,
                                  color: COLORS.TEXT_SECONDARY,
                                  backgroundColor: "transparent",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                                  e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                                  e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                                }}
                              >
                                <Plus className="h-3 w-3" />
                                Or create a new category
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2 mt-2">
                              <input
                                type="text"
                                value={customCategory}
                                onChange={e => {
                                  setCustomCategory(e.target.value);
                                  setValue("level", e.target.value);
                                }}
                                placeholder="Enter new category name"
                                maxLength={50}
                                className="w-full p-2.5 rounded-lg border-2 focus:outline-none transition-all duration-200 h-11 text-sm"
                                style={{
                                  backgroundColor: "#2A2F2F",
                                  borderColor: COLORS.BORDER_SUBTLE,
                                  color: COLORS.TEXT_PRIMARY,
                                }}
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setShowCustomCategory(false);
                                  setCustomCategory("");
                                  if (
                                    !DEFAULT_PROGRAM_CATEGORIES.includes(
                                      watchedValues.level
                                    )
                                  ) {
                                    setValue("level", "");
                                  }
                                }}
                                className="text-xs px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1"
                                style={{
                                  color: COLORS.TEXT_SECONDARY,
                                  backgroundColor: "#1C2021",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = "#2A2F2F";
                                  e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = "#1C2021";
                                  e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                                }}
                              >
                                <ChevronLeft className="h-3 w-3" />
                                Back to categories
                              </button>
                            </div>
                          )}

                          {errors.level && (
                            <p className="text-xs mt-1" style={{ color: COLORS.RED_ALERT }}>
                              {errors.level.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label
                            htmlFor="program-duration"
                            className="text-sm font-medium"
                            style={{ color: COLORS.TEXT_PRIMARY }}
                          >
                            Duration (Weeks) - Auto-calculated *
                          </Label>
                          <Input
                            id="program-duration"
                            type="number"
                            min="1"
                            {...register("duration", { valueAsNumber: true })}
                            placeholder="Auto-calculated from weeks"
                            style={{ backgroundColor: "#2A2F2F", borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_PRIMARY }}
                            className="mt-2 h-11 cursor-not-allowed opacity-75"
                            readOnly
                          />
                          <p className="text-xs mt-1" style={{ color: COLORS.TEXT_MUTED }}>
                            Duration automatically updates based on number of
                            weeks
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === "structure" && (
                  <div className="space-y-4 w-full -mx-4 px-0">
                    <div className="text-center mb-3 px-4">
                      <h3 className="text-base font-medium mb-1" style={{ color: COLORS.TEXT_PRIMARY }}>
                        Program Structure
                      </h3>
                      <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                        Build your program with weeks, days, and exercises
                      </p>
                    </div>

                    <div className="w-full max-w-full">
                      {programBuilderWeeks.length === 0 ? (
                        <Card className="rounded-lg border mx-4" style={{ backgroundColor: "#1C2021", borderColor: COLORS.BORDER_SUBTLE }}>
                          <CardContent className="p-8 text-center">
                            <h4 className="text-base font-medium mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
                              No weeks added yet
                            </h4>
                            <p className="text-sm mb-4" style={{ color: COLORS.TEXT_SECONDARY }}>
                              Start building your program by adding weeks and
                              organizing your training schedule
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="w-full overflow-hidden">
                          <MobileProgramBuilder
                            onSave={handleProgramBuilderSave}
                            initialWeeks={programBuilderWeeks}
                            hideHeader={true}
                            onOpenVideoLibrary={() => {
                              if (onOpenVideoLibrary) {
                                onOpenVideoLibrary();
                              } else {
                                setIsVideoLibraryOpen(true);
                              }
                            }}
                            selectedVideoFromLibrary={selectedVideoFromLibrary}
                            onVideoProcessed={() => {
                              if (onVideoProcessed) {
                                onVideoProcessed();
                              } else {
                                setInternalSelectedVideo(null);
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {currentStep === "review" && (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold mb-1" style={{ color: COLORS.TEXT_PRIMARY }}>
                        Review Your Program
                      </h3>
                      <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                        Double-check everything looks good before saving
                      </p>
                    </div>

                    <div className="space-y-4">
                      <Card className="rounded-lg border" style={{ backgroundColor: "#1C2021", borderColor: COLORS.BORDER_SUBTLE }}>
                        <CardContent className="p-4">
                          <h4 className="text-base font-semibold mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
                            {watchedValues.title}
                          </h4>
                          <p className="text-sm mb-3" style={{ color: COLORS.TEXT_SECONDARY }}>
                            {watchedValues.description}
                          </p>
                          <div className="flex items-center gap-3 text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                            <span>{watchedValues.duration} weeks</span>
                            <span>
                              {programBuilderWeeks.length} weeks configured
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="space-y-2">
                        <h5 className="font-medium text-sm" style={{ color: COLORS.TEXT_PRIMARY }}>
                          Program Structure:
                        </h5>
                        {programBuilderWeeks.map((week, index) => (
                          <div
                            key={week.id}
                            className="flex items-center gap-3 p-3 rounded-lg border"
                            style={{ backgroundColor: "#1C2021", borderColor: COLORS.BORDER_SUBTLE }}
                          >
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium" style={{ backgroundColor: COLORS.GOLDEN_ACCENT, color: "#FFFFFF" }}>
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <span className="font-medium text-sm" style={{ color: COLORS.TEXT_PRIMARY }}>
                                {week.name}
                              </span>
                              <div className="text-xs mt-1" style={{ color: COLORS.TEXT_MUTED }}>
                                {Object.values(week.days).flat().length} total
                                exercises across 7 days
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer - Mobile optimized */}
          <div className="flex flex-col gap-2 p-3 border-t flex-shrink-0" style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: COLORS.BACKGROUND_DARK }}>
            {/* Primary action buttons */}
            <div className="flex gap-2 w-full">
              {currentStep !== "details" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentStep === "structure") setCurrentStep("details");
                    if (currentStep === "review") setCurrentStep("structure");
                  }}
                  className="flex-1 text-sm h-11 min-h-[44px] transition-colors"
                  style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_SECONDARY }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#1C2021";
                    e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                    e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                    e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                  }}
                >
                  Back
                </Button>
              )}

              {currentStep === "details" && (
                <Button
                  onClick={() => {
                    // Ensure weeks are initialized before going to structure step
                    if (programBuilderWeeks.length === 0 && !initializedRef.current) {
                      const duration = watchedValues.duration || 1;
                      const initialWeeks = Array.from({ length: duration }, (_, index) => ({
                        id: `week-${Date.now()}-${index}`,
                        name: `Week ${index + 1}`,
                        days: {
                          sun: [],
                          mon: [],
                          tue: [],
                          wed: [],
                          thu: [],
                          fri: [],
                          sat: [],
                        },
                        collapsed: false,
                      }));
                      setProgramBuilderWeeks(initialWeeks);
                      initializedRef.current = true;
                    }
                    setCurrentStep("structure");
                  }}
                  disabled={!canProceedToStructure}
                  className="flex-1 text-white text-sm h-11 min-h-[44px] transition-colors"
                  style={{ backgroundColor: COLORS.GOLDEN_DARK }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
                    }
                  }}
                >
                  Next: Structure
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              )}

              {currentStep === "structure" && (
                <Button
                  onClick={() => setCurrentStep("review")}
                  disabled={!canProceedToReview}
                  className="flex-1 text-white text-sm h-11 min-h-[44px] transition-colors"
                  style={{ backgroundColor: COLORS.GOLDEN_DARK }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
                    }
                  }}
                >
                  Next: Review
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              )}

              {currentStep === "review" && (
                <Button
                  onClick={handleSubmit(handleSubmitForm)}
                  disabled={isSubmitting}
                  className="flex-1 text-white text-sm h-11 min-h-[44px] transition-colors"
                  style={{ backgroundColor: COLORS.GREEN_DARK }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = COLORS.GREEN_PRIMARY;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = COLORS.GREEN_DARK;
                    }
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {program ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      {program ? "Update Program" : "Create Program"}
                      <ArrowRight className="h-4 w-4 ml-1.5" />
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Cancel button */}
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full text-sm h-10 min-h-[40px] transition-colors"
              style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_SECONDARY }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#1C2021";
                e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              }}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Library Dialog - Only show if not using parent's video library */}
      {!onOpenVideoLibrary && (
        <VideoLibraryDialog
          isOpen={isVideoLibraryOpen}
          onClose={() => setIsVideoLibraryOpen(false)}
          onSelectVideo={video => {
            setInternalSelectedVideo(video);
            setIsVideoLibraryOpen(false);
          }}
          editingItem={null}
        />
      )}
    </>
  );
}
