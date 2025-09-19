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
import { Plus, Trash2, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import ProgramBuilder from "./ProgramBuilder";
import VideoLibraryDialog from "./VideoLibraryDialog";
import { useToast } from "@/lib/hooks/use-toast";

const programSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  level: z.enum(["Drive", "Whip", "Separation", "Stability", "Extension"]),
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
              title: z.string().min(1, "Drill title is required"),
              description: z.string().optional(),
              duration: z.string().optional(),
              videoUrl: z.string().url().optional().or(z.literal("")),
              notes: z.string().optional(),
              type: z.string().optional(),
              sets: z.number().optional(),
              reps: z.number().optional(),
              tempo: z.string().optional(),
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

  // ProgramBuilder state
  const [programBuilderWeeks, setProgramBuilderWeeks] = useState<
    ProgramBuilderWeek[]
  >([]);

  const { toast } = useToast();

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

  // Initialize with one week by default
  useEffect(() => {
    if (!initializedRef.current && programBuilderWeeks.length === 0) {
      const initialWeeks = [
        {
          id: `week-${Date.now()}`,
          name: "Week 1",
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
        },
      ];
      setProgramBuilderWeeks(initialWeeks);
      initializedRef.current = true;
    }
  }, [programBuilderWeeks.length]);

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
    }
  }, [isOpen, reset]);

  const handleProgramBuilderSave = useCallback(
    (weeks: ProgramBuilderWeek[]) => {
      setProgramBuilderWeeks(weeks);
    },
    []
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
            title: "Sunday",
            description: "",
            drills: week.days.sun.map((item, index) => ({
              ...item,
              order: index + 1,
            })),
          },
          {
            dayNumber: 2,
            title: "Monday",
            description: "",
            drills: week.days.mon.map((item, index) => ({
              ...item,
              order: index + 1,
            })),
          },
          {
            dayNumber: 3,
            title: "Tuesday",
            description: "",
            drills: week.days.tue.map((item, index) => ({
              ...item,
              order: index + 1,
            })),
          },
          {
            dayNumber: 4,
            title: "Wednesday",
            description: "",
            drills: week.days.wed.map((item, index) => ({
              ...item,
              order: index + 1,
            })),
          },
          {
            dayNumber: 5,
            title: "Thursday",
            description: "",
            drills: week.days.thu.map((item, index) => ({
              ...item,
              order: index + 1,
            })),
          },
          {
            dayNumber: 6,
            title: "Friday",
            description: "",
            drills: week.days.fri.map((item, index) => ({
              ...item,
              order: index + 1,
            })),
          },
          {
            dayNumber: 7,
            title: "Saturday",
            description: "",
            drills: week.days.sat.map((item, index) => ({
              ...item,
              order: index + 1,
            })),
          },
        ],
      }));

      const programData = {
        ...data,
        weeks: convertedWeeks,
      };

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

  const addWeek = () => {
    const newWeek: ProgramBuilderWeek = {
      id: `week-${Date.now()}`,
      name: `Week ${programBuilderWeeks.length + 1}`,
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
    };
    setProgramBuilderWeeks(prev => [...prev, newWeek]);
  };

  const removeWeek = (weekId: string) => {
    setProgramBuilderWeeks(prev => prev.filter(week => week.id !== weekId));
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
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent
          className={`bg-[#2A3133] border-gray-600 max-h-[90vh] z-[100] overflow-hidden flex flex-col p-0 [&>button]:hidden ${
            currentStep === "structure" ? "max-w-[95vw] w-[95vw]" : "max-w-4xl"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-600">
            <div>
              <DialogTitle className="text-white text-2xl font-bold">
                Create New Program
              </DialogTitle>
              <DialogDescription className="text-gray-400 mt-1">
                Build a comprehensive training program with weeks, days, and
                exercises
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-600"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-4 border-b border-gray-600">
            <div className="flex items-center justify-center space-x-8">
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
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                        isActive
                          ? "bg-[#4A5A70] border-[#4A5A70] text-white"
                          : isCompleted
                          ? "bg-green-500 border-green-500 text-white"
                          : "bg-transparent border-gray-600 text-gray-400"
                      }`}
                    >
                      <span className="text-sm font-bold">
                        {isCompleted && !isActive ? "✓" : index + 1}
                      </span>
                    </div>
                    <span
                      className={`ml-3 text-sm font-medium ${
                        isActive ? "text-white" : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </span>
                    {index < 2 && (
                      <ArrowRight className="h-4 w-4 text-gray-600 mx-4" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {currentStep === "details" && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Program Details
                  </h3>
                  <p className="text-gray-400">
                    Set up the basic information for your training program
                  </p>
                </div>

                <div className="max-w-2xl mx-auto space-y-6">
                  <div>
                    <Label
                      htmlFor="program-title"
                      className="text-white text-sm font-medium"
                    >
                      Program Title *
                    </Label>
                    <Input
                      id="program-title"
                      {...register("title")}
                      placeholder="e.g., Advanced Hitting Program, Beginner Pitching Development"
                      className="bg-[#353A3A] border-gray-600 text-white mt-2 h-12 text-lg"
                    />
                    {errors.title && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="program-description"
                      className="text-white text-sm font-medium"
                    >
                      Description
                    </Label>
                    <Textarea
                      id="program-description"
                      {...register("description")}
                      placeholder="Describe what this program covers and who it's designed for..."
                      className="bg-[#353A3A] border-gray-600 text-white mt-2 min-h-[100px] resize-none"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="program-level"
                        className="text-white text-sm font-medium"
                      >
                        Focus Area *
                      </Label>
                      <Select
                        value={watchedValues.level}
                        onValueChange={value => setValue("level", value as any)}
                      >
                        <SelectTrigger className="bg-[#353A3A] border-gray-600 text-white mt-2 h-12">
                          <SelectValue placeholder="Select focus area" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#353A3A] border-gray-600">
                          <SelectItem value="Drive">Drive</SelectItem>
                          <SelectItem value="Whip">Whip</SelectItem>
                          <SelectItem value="Separation">Separation</SelectItem>
                          <SelectItem value="Stability">Stability</SelectItem>
                          <SelectItem value="Extension">Extension</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.level && (
                        <p className="text-red-400 text-sm mt-1">
                          {errors.level.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="program-duration"
                        className="text-white text-sm font-medium"
                      >
                        Duration (Weeks) *
                      </Label>
                      <Input
                        id="program-duration"
                        type="number"
                        min="1"
                        {...register("duration", { valueAsNumber: true })}
                        placeholder="4"
                        className="bg-[#353A3A] border-gray-600 text-white mt-2 h-12"
                      />
                      {errors.duration && (
                        <p className="text-red-400 text-sm mt-1">
                          {errors.duration.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === "structure" && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-medium text-white mb-1">
                    Program Structure
                  </h3>
                  <p className="text-sm text-gray-400">
                    Build your program with weeks, days, and exercises
                  </p>
                </div>

                <div className="max-w-full mx-auto">
                  <div className="flex items-center gap-4 mb-4">
                    <h4 className="text-base font-medium text-white">
                      Program Weeks
                    </h4>
                    <Badge
                      variant="outline"
                      className="text-gray-400 border-gray-600"
                    >
                      {programBuilderWeeks.length} weeks
                    </Badge>
                  </div>

                  {programBuilderWeeks.length === 0 ? (
                    <Card className="bg-[#353A3A] border-gray-600">
                      <CardContent className="p-12 text-center">
                        <h4 className="text-lg font-medium text-white mb-2">
                          No weeks added yet
                        </h4>
                        <p className="text-gray-400 mb-6">
                          Start building your program by adding weeks and
                          organizing your training schedule
                        </p>
                        <Button
                          onClick={addWeek}
                          className="bg-[#4A5A70] hover:bg-[#606364]"
                        >
                          Add First Week
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {programBuilderWeeks.map((week, index) => (
                        <Card
                          key={week.id}
                          className="bg-[#353A3A] border-gray-600"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-[#4A5A70] rounded-full flex items-center justify-center text-white text-sm font-medium">
                                  {index + 1}
                                </div>
                                <h5 className="text-lg font-medium text-white">
                                  {week.name}
                                </h5>
                              </div>
                              {programBuilderWeeks.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeWeek(week.id)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <ProgramBuilder
                              onSave={handleProgramBuilderSave}
                              initialWeeks={[week]}
                              onOpenVideoLibrary={onOpenVideoLibrary}
                              selectedVideoFromLibrary={
                                selectedVideoFromLibrary
                              }
                              onVideoProcessed={onVideoProcessed}
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === "review" && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Review Your Program
                  </h3>
                  <p className="text-gray-400">
                    Double-check everything looks good before saving
                  </p>
                </div>

                <div className="max-w-4xl mx-auto space-y-6">
                  <Card className="bg-[#353A3A] border-gray-600">
                    <CardContent className="p-6">
                      <h4 className="text-lg font-semibold text-white mb-2">
                        {watchedValues.title}
                      </h4>
                      <p className="text-gray-400 mb-4">
                        {watchedValues.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
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

                  <div className="space-y-3">
                    <h5 className="text-white font-medium">
                      Program Structure:
                    </h5>
                    {programBuilderWeeks.map((week, index) => (
                      <div
                        key={week.id}
                        className="flex items-center gap-3 p-3 bg-[#353A3A] rounded-lg border border-gray-600"
                      >
                        <div className="w-6 h-6 bg-[#4A5A70] rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <span className="text-white font-medium">
                            {week.name}
                          </span>
                          <div className="text-sm text-gray-400 mt-1">
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
          <div className="flex items-center justify-between p-6 border-t border-gray-600">
            <div className="flex gap-3">
              {currentStep !== "details" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentStep === "structure") setCurrentStep("details");
                    if (currentStep === "review") setCurrentStep("structure");
                  }}
                  className="border-gray-600 text-gray-300 hover:bg-gray-600"
                >
                  Back
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-gray-600 text-gray-300 hover:bg-gray-600"
              >
                Cancel
              </Button>

              {currentStep === "details" && (
                <Button
                  onClick={() => setCurrentStep("structure")}
                  disabled={!canProceedToStructure}
                  className="bg-[#4A5A70] hover:bg-[#606364] text-white"
                >
                  Next: Build Structure
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}

              {currentStep === "structure" && (
                <Button
                  onClick={() => setCurrentStep("review")}
                  disabled={!canProceedToReview}
                  className="bg-[#4A5A70] hover:bg-[#606364] text-white"
                >
                  Next: Review
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}

              {currentStep === "review" && (
                <Button
                  onClick={handleSubmit(handleSubmitForm)}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
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
