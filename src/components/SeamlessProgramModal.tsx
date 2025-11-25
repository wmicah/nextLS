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
import { Badge } from "./ui/badge";
import { Plus, Trash2, ArrowRight, X, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import ProgramBuilder from "./ProgramBuilder";
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
  description?: string;
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
  coachInstructionsWhatToDo?: string;
  coachInstructionsHowToDoIt?: string;
  coachInstructionsKeyPoints?: string[];
  coachInstructionsCommonMistakes?: string[];
  coachInstructionsEasier?: string;
  coachInstructionsHarder?: string;
  coachInstructionsEquipment?: string;
  coachInstructionsSetup?: string;
}

interface ProgramBuilderWeek {
  id: string;
  name: string;
  days: Record<DayKey, ProgramBuilderItem[]>;
  collapsed?: boolean;
}

interface SeamlessProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProgramFormData) => void;
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
}

export default function SeamlessProgramModal({
  isOpen,
  onClose,
  onSubmit,
  onOpenVideoLibrary,
  selectedVideoFromLibrary,
  onVideoProcessed,
}: SeamlessProgramModalProps) {
  const [currentStep, setCurrentStep] = useState<
    "details" | "structure" | "review"
  >("details");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initializedRef = useRef(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

  // ProgramBuilder state
  const [programBuilderWeeks, setProgramBuilderWeeks] = useState<
    ProgramBuilderWeek[]
  >([]);

  const { toast } = useToast();

  // Fetch program categories (for custom ones)
  const { data: programCategoriesData = [] } =
    trpc.programs.getCategories.useQuery();

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
    if (!initializedRef.current && programBuilderWeeks.length === 0) {
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
  }, [programBuilderWeeks.length, watchedValues.duration]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen, reset]);

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
      console.log("Weeks received:", weeks);
      console.log("First week Thursday items:", weeks[0]?.days?.thu);
      console.log("Thursday item type:", weeks[0]?.days?.thu?.[0]?.type);
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
    console.log("Form data:", data);
    console.log("ProgramBuilder weeks:", programBuilderWeeks);
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
              coachInstructionsWhatToDo: item.coachInstructionsWhatToDo || "",
              coachInstructionsHowToDoIt: item.coachInstructionsHowToDoIt || "",
              coachInstructionsKeyPoints: item.coachInstructionsKeyPoints || [],
              coachInstructionsCommonMistakes:
                item.coachInstructionsCommonMistakes || [],
              coachInstructionsEasier: item.coachInstructionsEasier || "",
              coachInstructionsHarder: item.coachInstructionsHarder || "",
              coachInstructionsEquipment: item.coachInstructionsEquipment || "",
              coachInstructionsSetup: item.coachInstructionsSetup || "",
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
              coachInstructionsWhatToDo: item.coachInstructionsWhatToDo || "",
              coachInstructionsHowToDoIt: item.coachInstructionsHowToDoIt || "",
              coachInstructionsKeyPoints: item.coachInstructionsKeyPoints || [],
              coachInstructionsCommonMistakes:
                item.coachInstructionsCommonMistakes || [],
              coachInstructionsEasier: item.coachInstructionsEasier || "",
              coachInstructionsHarder: item.coachInstructionsHarder || "",
              coachInstructionsEquipment: item.coachInstructionsEquipment || "",
              coachInstructionsSetup: item.coachInstructionsSetup || "",
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
              coachInstructionsWhatToDo: item.coachInstructionsWhatToDo || "",
              coachInstructionsHowToDoIt: item.coachInstructionsHowToDoIt || "",
              coachInstructionsKeyPoints: item.coachInstructionsKeyPoints || [],
              coachInstructionsCommonMistakes:
                item.coachInstructionsCommonMistakes || [],
              coachInstructionsEasier: item.coachInstructionsEasier || "",
              coachInstructionsHarder: item.coachInstructionsHarder || "",
              coachInstructionsEquipment: item.coachInstructionsEquipment || "",
              coachInstructionsSetup: item.coachInstructionsSetup || "",
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
              coachInstructionsWhatToDo: item.coachInstructionsWhatToDo || "",
              coachInstructionsHowToDoIt: item.coachInstructionsHowToDoIt || "",
              coachInstructionsKeyPoints: item.coachInstructionsKeyPoints || [],
              coachInstructionsCommonMistakes:
                item.coachInstructionsCommonMistakes || [],
              coachInstructionsEasier: item.coachInstructionsEasier || "",
              coachInstructionsHarder: item.coachInstructionsHarder || "",
              coachInstructionsEquipment: item.coachInstructionsEquipment || "",
              coachInstructionsSetup: item.coachInstructionsSetup || "",
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
              coachInstructionsWhatToDo: item.coachInstructionsWhatToDo || "",
              coachInstructionsHowToDoIt: item.coachInstructionsHowToDoIt || "",
              coachInstructionsKeyPoints: item.coachInstructionsKeyPoints || [],
              coachInstructionsCommonMistakes:
                item.coachInstructionsCommonMistakes || [],
              coachInstructionsEasier: item.coachInstructionsEasier || "",
              coachInstructionsHarder: item.coachInstructionsHarder || "",
              coachInstructionsEquipment: item.coachInstructionsEquipment || "",
              coachInstructionsSetup: item.coachInstructionsSetup || "",
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
              coachInstructionsWhatToDo: item.coachInstructionsWhatToDo || "",
              coachInstructionsHowToDoIt: item.coachInstructionsHowToDoIt || "",
              coachInstructionsKeyPoints: item.coachInstructionsKeyPoints || [],
              coachInstructionsCommonMistakes:
                item.coachInstructionsCommonMistakes || [],
              coachInstructionsEasier: item.coachInstructionsEasier || "",
              coachInstructionsHarder: item.coachInstructionsHarder || "",
              coachInstructionsEquipment: item.coachInstructionsEquipment || "",
              coachInstructionsSetup: item.coachInstructionsSetup || "",
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
              coachInstructionsWhatToDo: item.coachInstructionsWhatToDo || "",
              coachInstructionsHowToDoIt: item.coachInstructionsHowToDoIt || "",
              coachInstructionsKeyPoints: item.coachInstructionsKeyPoints || [],
              coachInstructionsCommonMistakes:
                item.coachInstructionsCommonMistakes || [],
              coachInstructionsEasier: item.coachInstructionsEasier || "",
              coachInstructionsHarder: item.coachInstructionsHarder || "",
              coachInstructionsEquipment: item.coachInstructionsEquipment || "",
              coachInstructionsSetup: item.coachInstructionsSetup || "",
            })),
          },
        ],
      }));

      // Transform coach instruction fields to nested object format expected by tRPC
      const transformedWeeks = convertedWeeks.map(week => ({
        ...week,
        days: week.days.map(day => ({
          ...day,
          drills: day.drills.map(drill => {
            // Extract coach instruction fields and create nested object
            const coachInstructions =
              drill.coachInstructionsWhatToDo ||
              drill.coachInstructionsHowToDoIt ||
              drill.coachInstructionsKeyPoints?.length ||
              drill.coachInstructionsCommonMistakes?.length ||
              drill.coachInstructionsEquipment
                ? {
                    whatToDo: drill.coachInstructionsWhatToDo || "",
                    howToDoIt: drill.coachInstructionsHowToDoIt || "",
                    keyPoints: drill.coachInstructionsKeyPoints || [],
                    commonMistakes: drill.coachInstructionsCommonMistakes || [],
                    equipment: drill.coachInstructionsEquipment || "",
                  }
                : undefined;

            // Remove flat coach instruction fields and add nested object
            const {
              coachInstructionsWhatToDo,
              coachInstructionsHowToDoIt,
              coachInstructionsKeyPoints,
              coachInstructionsCommonMistakes,
              coachInstructionsEasier,
              coachInstructionsHarder,
              coachInstructionsEquipment,
              coachInstructionsSetup,
              ...rest
            } = drill;

            return {
              ...rest,
              coachInstructions,
            };
          }),
        })),
      }));

      const programData = {
        ...data,
        weeks: transformedWeeks,
      };

      console.log("Program data being submitted:", programData);

      await onSubmit(programData);
      toast({
        title: "Program created! 🎉",
        description: "Your new program has been saved successfully.",
      });
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
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={open => {
          if (!open) {
            onClose();
          }
        }}
      >
        <DialogContent
          className={`max-h-[90vh] overflow-hidden flex flex-col p-0 [&>button]:hidden ${
            currentStep === "structure" ? "max-w-[95vw] w-[95vw]" : "max-w-4xl"
          }`}
          style={{ 
            pointerEvents: "auto",
            backgroundColor: COLORS.BACKGROUND_DARK,
            borderColor: COLORS.BORDER_SUBTLE,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div>
              <DialogTitle className="text-lg font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>
                Create New Program
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5" style={{ color: COLORS.TEXT_SECONDARY }}>
                Build a comprehensive training program with weeks, days, and
                exercises
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1"
              style={{ color: COLORS.TEXT_SECONDARY }}
              onMouseEnter={e => {
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="px-4 py-3 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div className="flex items-center justify-center space-x-6">
              {[
                { key: "details", label: "Details" },
                { key: "structure", label: "Structure" },
                { key: "review", label: "Review" },
              ].map((step, index) => {
                const isActive = currentStep === step.key;
                const isCompleted =
                  (step.key === "details" && currentStep !== "details") ||
                  (step.key === "structure" && currentStep === "review") ||
                  (step.key === "review" && false); // Review is never "completed" until form is submitted

                return (
                  <div key={step.key} className="flex items-center">
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 text-xs font-bold"
                      style={{
                        backgroundColor: isActive ? COLORS.GOLDEN_DARK : isCompleted ? COLORS.GREEN_PRIMARY : "transparent",
                        borderColor: isActive ? COLORS.GOLDEN_ACCENT : isCompleted ? COLORS.GREEN_PRIMARY : COLORS.BORDER_SUBTLE,
                        color: isActive || isCompleted ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
                      }}
                    >
                      {isCompleted && !isActive ? "✓" : index + 1}
                    </div>
                    <span
                      className="ml-2 text-xs font-medium"
                      style={{ color: isActive ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY }}
                    >
                      {step.label}
                    </span>
                    {index < 2 && (
                      <ArrowRight className="h-3.5 w-3.5 mx-3" style={{ color: COLORS.BORDER_SUBTLE }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {currentStep === "details" && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-sm font-semibold mb-1" style={{ color: COLORS.TEXT_PRIMARY }}>
                    Program Details
                  </h3>
                  <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                    Set up the basic information for your training program
                  </p>
                </div>

                <div className="max-w-2xl mx-auto space-y-4">
                  <div>
                    <Label
                      htmlFor="program-title"
                      className="text-xs font-medium"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      Program Title *
                    </Label>
                    <Input
                      id="program-title"
                      {...register("title")}
                      placeholder="e.g., Advanced Hitting Program, Beginner Pitching Development"
                      className="mt-1.5 h-9 text-sm"
                      style={{
                        backgroundColor: COLORS.BACKGROUND_CARD,
                        borderColor: COLORS.BORDER_SUBTLE,
                        color: COLORS.TEXT_PRIMARY,
                      }}
                      maxLength={60}
                    />
                    <div className="flex justify-between items-center mt-1">
                      {errors.title && (
                        <p className="text-xs" style={{ color: COLORS.RED_ALERT }}>
                          {errors.title.message}
                        </p>
                      )}
                      <p className="text-xs ml-auto" style={{ color: COLORS.TEXT_SECONDARY }}>
                        {watch("title")?.length || 0}/60 characters
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="program-description"
                      className="text-xs font-medium"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      Description
                    </Label>
                    <Textarea
                      id="program-description"
                      {...register("description")}
                      placeholder="Describe what this program covers and who it's designed for..."
                      className="mt-1.5 min-h-[80px] resize-none text-sm"
                      style={{
                        backgroundColor: COLORS.BACKGROUND_CARD,
                        borderColor: COLORS.BORDER_SUBTLE,
                        color: COLORS.TEXT_PRIMARY,
                      }}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="program-level"
                        className="text-xs font-medium"
                        style={{ color: COLORS.TEXT_PRIMARY }}
                      >
                        Focus Area *
                      </Label>

                      {!showCustomCategory ? (
                        <div className="space-y-2 mt-1.5">
                          <select
                            value={watchedValues.level}
                            onChange={e => setValue("level", e.target.value)}
                            className="w-full px-2.5 py-2 rounded-md border text-sm focus:outline-none h-9"
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
                          >
                            <option value="" style={{ backgroundColor: COLORS.BACKGROUND_DARK, color: COLORS.TEXT_PRIMARY }}>Select focus area...</option>

                            <optgroup
                              label="Standard Categories"
                              style={{
                                backgroundColor: COLORS.BACKGROUND_DARK,
                                color: COLORS.TEXT_PRIMARY,
                              }}
                            >
                              {DEFAULT_PROGRAM_CATEGORIES.map(cat => (
                                <option
                                  key={cat}
                                  value={cat}
                                  style={{
                                    backgroundColor: COLORS.BACKGROUND_DARK,
                                    color: COLORS.TEXT_PRIMARY,
                                  }}
                                >
                                  {cat}
                                </option>
                              ))}
                            </optgroup>

                            {programCategoriesData.filter(
                              (cat: any) =>
                                !DEFAULT_PROGRAM_CATEGORIES.includes(cat.name)
                            ).length > 0 && (
                              <optgroup
                                label="Your Categories"
                                style={{
                                  backgroundColor: COLORS.BACKGROUND_DARK,
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
                                        backgroundColor: COLORS.BACKGROUND_DARK,
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
                            className="w-full p-2 rounded-md border-2 border-dashed transition-all duration-200 flex items-center justify-center gap-1.5 text-xs font-medium"
                            style={{
                              borderColor: COLORS.BORDER_SUBTLE,
                              color: COLORS.TEXT_SECONDARY,
                              backgroundColor: "transparent",
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                              e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                              e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                            }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Or create a new category
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 mt-1.5">
                          <input
                            type="text"
                            value={customCategory}
                            onChange={e => {
                              setCustomCategory(e.target.value);
                              setValue("level", e.target.value);
                            }}
                            placeholder="Enter new category name (e.g., Velocity)"
                            maxLength={50}
                            className="w-full px-2.5 py-2 rounded-md border-2 focus:outline-none transition-all duration-200 h-9 text-sm"
                            style={{
                              backgroundColor: COLORS.BACKGROUND_DARK,
                              borderColor: COLORS.BORDER_SUBTLE,
                              color: COLORS.TEXT_PRIMARY,
                            }}
                            onFocus={e => {
                              e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                            }}
                            onBlur={e => {
                              e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
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
                            className="text-xs px-3 py-1.5 rounded-md transition-all duration-200 flex items-center gap-1.5"
                            style={{
                              color: COLORS.TEXT_SECONDARY,
                              backgroundColor: COLORS.BACKGROUND_DARK,
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                            }}
                            onMouseLeave={e => {
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
                        className="text-xs font-medium"
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
                        className="mt-1.5 h-9 text-sm cursor-not-allowed opacity-75"
                        style={{
                          backgroundColor: COLORS.BACKGROUND_CARD,
                          borderColor: COLORS.BORDER_SUBTLE,
                          color: COLORS.TEXT_SECONDARY,
                        }}
                        readOnly
                      />
                      <p className="text-xs mt-1" style={{ color: COLORS.TEXT_SECONDARY }}>
                        Duration automatically updates based on number of weeks
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === "structure" && (
              <div className="space-y-3">
                <div className="text-center mb-4">
                  <h3 className="text-sm font-semibold mb-1" style={{ color: COLORS.TEXT_PRIMARY }}>
                    Program Structure
                  </h3>
                  <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                    Build your program with weeks, days, and exercises
                  </p>
                </div>

                <div className="max-w-full mx-auto">
                  <div className="flex items-center gap-3 mb-3">
                    <h4 className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                      Program Weeks
                    </h4>
                    <Badge
                      variant="outline"
                      className="text-xs px-2 py-0.5"
                      style={{
                        color: COLORS.TEXT_SECONDARY,
                        borderColor: COLORS.BORDER_SUBTLE,
                        backgroundColor: COLORS.BACKGROUND_CARD,
                      }}
                    >
                      {programBuilderWeeks.length} weeks
                    </Badge>
                  </div>

                  {programBuilderWeeks.length === 0 ? (
                    <Card className="border" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
                      <CardContent className="p-8 text-center">
                        <h4 className="text-sm font-medium mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
                          No weeks added yet
                        </h4>
                        <p className="text-xs mb-4" style={{ color: COLORS.TEXT_SECONDARY }}>
                          Start building your program by adding weeks and
                          organizing your training schedule
                        </p>
                        <Button
                          onClick={() => setCurrentStep("structure")}
                          className="text-xs h-8 px-3"
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
                          Start Building
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      <ProgramBuilder
                        onSave={handleProgramBuilderSave}
                        initialWeeks={programBuilderWeeks}
                        onOpenVideoLibrary={onOpenVideoLibrary}
                        selectedVideoFromLibrary={selectedVideoFromLibrary}
                        onVideoProcessed={onVideoProcessed}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === "review" && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-sm font-semibold mb-1" style={{ color: COLORS.TEXT_PRIMARY }}>
                    Review Your Program
                  </h3>
                  <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                    Double-check everything looks good before saving
                  </p>
                </div>

                <div className="max-w-4xl mx-auto space-y-4">
                  <Card className="border" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
                    <CardContent className="p-4">
                      <h4 className="text-sm font-semibold mb-1.5" style={{ color: COLORS.TEXT_PRIMARY }}>
                        {watchedValues.title}
                      </h4>
                      <p className="text-xs mb-3" style={{ color: COLORS.TEXT_SECONDARY }}>
                        {watchedValues.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                        <Badge
                          variant="outline"
                          className={getLevelColor(watchedValues.level)}
                        >
                          <span className="capitalize">
                            {watchedValues.level}
                          </span>
                        </Badge>
                        <span>{watchedValues.duration} weeks</span>
                        <span>
                          {programBuilderWeeks.length} weeks configured
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-2">
                    <h5 className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                      Program Structure:
                    </h5>
                    {programBuilderWeeks.map((week, index) => (
                      <div
                        key={week.id}
                        className="flex items-center gap-2.5 p-2.5 rounded-md border"
                        style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}
                      >
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium"
                          style={{ backgroundColor: COLORS.GOLDEN_DARK, color: COLORS.TEXT_PRIMARY }}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <span className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                            {week.name}
                          </span>
                          <div className="text-[10px] mt-0.5" style={{ color: COLORS.TEXT_SECONDARY }}>
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
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div className="flex gap-2">
              {currentStep !== "details" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentStep === "structure") setCurrentStep("details");
                    if (currentStep === "review") setCurrentStep("structure");
                  }}
                  className="text-xs h-8 px-3"
                  style={{
                    borderColor: COLORS.BORDER_SUBTLE,
                    color: COLORS.TEXT_SECONDARY,
                    backgroundColor: COLORS.BACKGROUND_CARD,
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
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="text-xs h-8 px-3"
                style={{
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_SECONDARY,
                  backgroundColor: COLORS.BACKGROUND_CARD,
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
                Cancel
              </Button>

              {currentStep === "details" && (
                <Button
                  onClick={() => setCurrentStep("structure")}
                  disabled={!canProceedToStructure}
                  className="text-xs h-8 px-3"
                  style={{
                    backgroundColor: COLORS.GOLDEN_DARK,
                    color: COLORS.TEXT_PRIMARY,
                  }}
                  onMouseEnter={e => {
                    if (!canProceedToStructure) return;
                    e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
                  }}
                >
                  Next: Build Structure
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              )}

              {currentStep === "structure" && (
                <Button
                  onClick={() => setCurrentStep("review")}
                  disabled={!canProceedToReview}
                  className="text-xs h-8 px-3"
                  style={{
                    backgroundColor: COLORS.GOLDEN_DARK,
                    color: COLORS.TEXT_PRIMARY,
                  }}
                  onMouseEnter={e => {
                    if (!canProceedToReview) return;
                    e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
                  }}
                >
                  Next: Review
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              )}

              {currentStep === "review" && (
                <Button
                  onClick={handleSubmit(handleSubmitForm)}
                  disabled={isSubmitting}
                  className="text-xs h-8 px-3"
                  style={{
                    backgroundColor: COLORS.GREEN_PRIMARY,
                    color: COLORS.TEXT_PRIMARY,
                  }}
                  onMouseEnter={e => {
                    if (isSubmitting) return;
                    e.currentTarget.style.backgroundColor = COLORS.GREEN_DARK;
                    e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = COLORS.GREEN_PRIMARY;
                    e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
                      Creating...
                    </>
                  ) : (
                    "Create Program"
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Library Dialog */}
      <VideoLibraryDialog
        isOpen={false} // This will be controlled by parent
        onClose={() => {}}
        onSelectVideo={() => {}}
        editingItem={null}
      />
    </>
  );
}
