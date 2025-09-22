"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Plus, Trash2, GripVertical, Play, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import DrillSelectionModal from "./DrillSelectionModal";
import ProgramBuilder from "./ProgramBuilder";
import VideoLibraryDialog from "./VideoLibraryDialog";

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

// New types for the ProgramBuilder integration
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

interface CreateProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProgramFormData) => void;
}

function CreateProgramModalContent({
  isOpen,
  onClose,
  onSubmit,
}: CreateProgramModalProps) {
  console.log("CreateProgramModal render - isOpen:", isOpen);
  const [activeTab, setActiveTab] = useState("details");
  const initializedRef = useRef(false);
  const [isDrillSelectionOpen, setIsDrillSelectionOpen] = useState(false);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number | null>(
    null
  );
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [isVideoLibraryOpen, setIsVideoLibraryOpen] = useState(false);
  const [selectedVideoFromLibrary, setSelectedVideoFromLibrary] = useState<{
    id: string;
    title: string;
    description?: string;
    duration?: string;
    url?: string;
    thumbnail?: string;
  } | null>(null);

  const [weeks, setWeeks] = useState<
    Array<{
      weekNumber: number;
      title: string;
      description?: string;
      days: Array<{
        dayNumber: number;
        title: string;
        description?: string;
        drills: Array<{
          order: number;
          title: string;
          description?: string;
          duration?: string;
          videoUrl?: string;
          notes?: string;
          type?: string;
          sets?: number;
          reps?: number;
          tempo?: string;
        }>;
      }>;
    }>
  >([]);

  // New state for ProgramBuilder
  const [programBuilderWeeks, setProgramBuilderWeeks] = useState<
    ProgramBuilderWeek[]
  >([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
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

  // Initialize with one week by default
  useEffect(() => {
    if (!initializedRef.current && weeks.length === 0) {
      const initialWeeks = [
        {
          weekNumber: 1,
          title: "Week 1",
          description: "",
          days: Array.from({ length: 7 }, (_, dayIndex) => ({
            dayNumber: dayIndex + 1,
            title: `Day ${dayIndex + 1}`,
            description: "",
            drills: [],
          })),
        },
      ];
      setWeeks(initialWeeks);

      // Initialize ProgramBuilder weeks
      const initialBuilderWeeks: ProgramBuilderWeek[] = [
        {
          id: "week-1",
          name: "Week 1",
          collapsed: false,
          days: {
            sun: [],
            mon: [],
            tue: [],
            wed: [],
            thu: [],
            fri: [],
            sat: [],
          },
        },
      ];
      setProgramBuilderWeeks(initialBuilderWeeks);

      initializedRef.current = true;
    }
  }, [weeks.length]);

  const addWeek = () => {
    const newWeekNumber = weeks.length + 1;
    const newWeek = {
      weekNumber: newWeekNumber,
      title: `Week ${newWeekNumber}`,
      description: "",
      days: Array.from({ length: 7 }, (_, i) => ({
        dayNumber: i + 1,
        title: `Day ${i + 1}`,
        description: "",
        drills: [],
      })),
    };
    setWeeks([...weeks, newWeek]);

    // Add to ProgramBuilder weeks
    const newBuilderWeek: ProgramBuilderWeek = {
      id: `week-${newWeekNumber}`,
      name: `Week ${newWeekNumber}`,
      collapsed: false,
      days: {
        sun: [],
        mon: [],
        tue: [],
        wed: [],
        thu: [],
        fri: [],
        sat: [],
      },
    };
    setProgramBuilderWeeks(prev => [...prev, newBuilderWeek]);
  };

  const removeWeek = (weekIndex: number) => {
    const newWeeks = weeks.filter((_, index) => index !== weekIndex);
    setWeeks(newWeeks);

    // Remove from ProgramBuilder weeks
    setProgramBuilderWeeks(prev =>
      prev.filter((_, index) => index !== weekIndex)
    );
  };

  const updateWeek = (weekIndex: number, field: string, value: any) => {
    const updatedWeeks = [...weeks];

    // Check if the week exists
    if (!updatedWeeks[weekIndex]) {
      // Silently return if week doesn't exist - this can happen when
      // the UI shows more weeks than actually exist in the array
      return;
    }

    updatedWeeks[weekIndex] = { ...updatedWeeks[weekIndex], [field]: value };
    setWeeks(updatedWeeks);

    // Update ProgramBuilder weeks
    setProgramBuilderWeeks(prev => {
      const updated = [...prev];
      if (updated[weekIndex]) {
        updated[weekIndex] = { ...updated[weekIndex], [field]: value };
      }
      return updated;
    });
  };

  const addDrill = (weekIndex: number, dayIndex: number) => {
    setSelectedWeekIndex(weekIndex);
    setSelectedDayIndex(dayIndex);
    setIsDrillSelectionOpen(true);
  };

  const handleSelectDrill = (drill: {
    title: string;
    description?: string;
    duration?: string;
    videoUrl?: string;
    notes?: string;
    isYoutube?: boolean;
    youtubeId?: string | null;
    videoId?: string | null;
    videoTitle?: string | null;
    videoThumbnail?: string | null;
  }) => {
    if (selectedWeekIndex === null || selectedDayIndex === null) return;

    const updatedWeeks = [...weeks];

    // Check if the week exists
    if (!updatedWeeks[selectedWeekIndex]) {
      console.error(`Week at index ${selectedWeekIndex} does not exist`);
      return;
    }

    // Check if the week has days property
    if (!updatedWeeks[selectedWeekIndex].days) {
      console.error(
        `Week at index ${selectedWeekIndex} does not have days property`
      );
      return;
    }

    // Check if the day exists
    if (!updatedWeeks[selectedWeekIndex].days[selectedDayIndex]) {
      console.error(
        `Day at index ${selectedDayIndex} does not exist in week ${selectedWeekIndex}`
      );
      return;
    }

    const day = updatedWeeks[selectedWeekIndex].days[selectedDayIndex];
    const newDrill = {
      order: day.drills.length + 1,
      title: drill.title,
      description: drill.description || "",
      duration: drill.duration || "",
      videoUrl: drill.videoUrl || "",
      notes: drill.notes || "",
      // Add YouTube-specific information
      isYoutube: drill.isYoutube || false,
      youtubeId: drill.youtubeId || null,
      videoId: drill.videoId || null,
      videoTitle: drill.videoTitle || null,
      videoThumbnail: drill.videoThumbnail || null,
    };
    day.drills.push(newDrill);
    setWeeks(updatedWeeks);
  };

  const removeDrill = (
    weekIndex: number,
    dayIndex: number,
    drillIndex: number
  ) => {
    const updatedWeeks = [...weeks];

    // Check if the week exists
    if (!updatedWeeks[weekIndex]) {
      console.error(`Week at index ${weekIndex} does not exist`);
      return;
    }

    // Check if the week has days property
    if (!updatedWeeks[weekIndex].days) {
      console.error(`Week at index ${weekIndex} does not have days property`);
      return;
    }

    // Check if the day exists
    if (!updatedWeeks[weekIndex].days[dayIndex]) {
      console.error(
        `Day at index ${dayIndex} does not exist in week ${weekIndex}`
      );
      return;
    }

    updatedWeeks[weekIndex].days[dayIndex].drills.splice(drillIndex, 1);
    setWeeks(updatedWeeks);
  };

  const updateDrill = (
    weekIndex: number,
    dayIndex: number,
    drillIndex: number,
    field: string,
    value: any
  ) => {
    const updatedWeeks = [...weeks];

    // Check if the week exists
    if (!updatedWeeks[weekIndex]) {
      console.error(`Week at index ${weekIndex} does not exist`);
      return;
    }

    // Check if the week has days property
    if (!updatedWeeks[weekIndex].days) {
      console.error(`Week at index ${weekIndex} does not have days property`);
      return;
    }

    // Check if the day exists
    if (!updatedWeeks[weekIndex].days[dayIndex]) {
      console.error(
        `Day at index ${dayIndex} does not exist in week ${weekIndex}`
      );
      return;
    }

    // Check if the drill exists
    if (!updatedWeeks[weekIndex].days[dayIndex].drills[drillIndex]) {
      console.error(
        `Drill at index ${drillIndex} does not exist in day ${dayIndex} of week ${weekIndex}`
      );
      return;
    }

    updatedWeeks[weekIndex].days[dayIndex].drills[drillIndex] = {
      ...updatedWeeks[weekIndex].days[dayIndex].drills[drillIndex],
      [field]: value,
    };
    setWeeks(updatedWeeks);
  };

  // Handle ProgramBuilder save
  const handleProgramBuilderSave = (builderWeeks: ProgramBuilderWeek[]) => {
    console.log("ProgramBuilder save called with weeks:", builderWeeks);
    setProgramBuilderWeeks(builderWeeks);
    console.log("ProgramBuilder weeks state updated");
  };

  const handleFormSubmit = (data: ProgramFormData) => {
    console.log(
      "Form submitted with programBuilderWeeks:",
      programBuilderWeeks
    );
    // Convert ProgramBuilder weeks to the old format for backward compatibility
    const convertedWeeks = programBuilderWeeks.map(
      (builderWeek, weekIndex) => ({
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
              order: itemIndex + 1,
              title: item.title,
              description: item.notes || "",
              duration: item.duration || "",
              videoUrl: item.videoUrl || "",
              notes: item.notes || "",
              type: item.type || "exercise",
              sets: item.sets,
              reps: item.reps,
              tempo: item.tempo || "",
              routineId: item.routineId,
              supersetId: item.supersetId,
            })),
          };
        }),
      })
    );

    console.log("Converted weeks:", convertedWeeks);

    // Ensure weeks are properly initialized and fill empty days with rest days
    const validWeeks = convertedWeeks.map((week, weekIndex) => ({
      ...week,
      weekNumber: weekIndex + 1,
      days: week.days.map((day, dayIndex) => {
        // If the day has no drills, make it a rest day
        if (day.drills.length === 0) {
          return {
            ...day,
            dayNumber: dayIndex + 1,
            title: "Rest Day",
            description: "Recovery and rest day",
            drills: [
              {
                order: 1,
                title: "Rest Day",
                description:
                  "Take this day to recover and rest. No specific exercises required.",
                duration: "",
                videoUrl: "",
                notes: "",
                type: "exercise",
                sets: undefined,
                reps: undefined,
                tempo: "",
              },
            ],
          };
        }

        // If the day has drills, keep them as is
        return {
          ...day,
          dayNumber: dayIndex + 1,
          drills: day.drills.map((drill, drillIndex) => ({
            ...drill,
            order: drillIndex + 1,
            title: drill.title || "Untitled Drill",
            videoUrl: drill.videoUrl || "",
            type: drill.type || "exercise",
            sets: drill.sets,
            reps: drill.reps,
            tempo: drill.tempo || "",
          })),
        };
      }),
    }));

    const formData = {
      ...data,
      weeks: validWeeks,
    };
    console.log("Submitting program data:", formData);
    onSubmit(formData);
  };

  const handleClose = () => {
    console.log("CreateProgramModal handleClose called");
    console.log("CreateProgramModal handleClose - isOpen was:", isOpen);
    reset();
    setWeeks([]);
    setProgramBuilderWeeks([]);
    setActiveTab("details");
    initializedRef.current = false;
    onClose();
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={() => {
          // Don't auto-close on any open change - only close explicitly
        }}
      >
        <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] overflow-y-auto bg-[#2A3133] border-gray-600 [&>button]:hidden fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-white">
                  Create New Program
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Design a comprehensive training program for your clients
                </DialogDescription>
              </div>
              <button
                onClick={handleClose}
                className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="flex w-full justify-between bg-[#3A4245] border border-gray-600 p-1 gap-1">
              <TabsTrigger
                value="details"
                className="text-gray-300 data-[state=active]:bg-[#2A3133] data-[state=active]:text-white data-[state=active]:border-gray-600 flex-1 px-3 py-2 text-sm font-medium"
              >
                Program Details
              </TabsTrigger>
              <TabsTrigger
                value="structure"
                className="text-gray-300 data-[state=active]:bg-[#2A3133] data-[state=active]:text-white data-[state=active]:border-gray-600 flex-1 px-3 py-2 text-sm font-medium"
              >
                Program Structure
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="text-gray-300 data-[state=active]:bg-[#2A3133] data-[state=active]:text-white data-[state=active]:border-gray-600 flex-1 px-3 py-2 text-sm font-medium"
              >
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="title" className="text-white">
                    Program Title
                  </Label>
                  <Input
                    id="title"
                    {...register("title")}
                    className="bg-[#3A4245] border-gray-600 text-white w-full"
                    placeholder="e.g., Advanced Training Program"
                  />
                  {errors.title && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="level" className="text-white">
                    Focus Area
                  </Label>
                  <Select
                    onValueChange={value => setValue("level", value as any)}
                    defaultValue="Drive"
                  >
                    <SelectTrigger className="bg-[#3A4245] border-gray-600 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#3A4245] border-gray-600">
                      <SelectItem
                        value="Drive"
                        className="text-white hover:bg-[#2A3133]"
                      >
                        Drive
                      </SelectItem>
                      <SelectItem
                        value="Whip"
                        className="text-white hover:bg-[#2A3133]"
                      >
                        Whip
                      </SelectItem>
                      <SelectItem
                        value="Separation"
                        className="text-white hover:bg-[#2A3133]"
                      >
                        Separation
                      </SelectItem>
                      <SelectItem
                        value="Stability"
                        className="text-white hover:bg-[#2A3133]"
                      >
                        Stability
                      </SelectItem>
                      <SelectItem
                        value="Extension"
                        className="text-white hover:bg-[#2A3133]"
                      >
                        Extension
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.level && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.level.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="duration" className="text-white">
                    Duration (weeks)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    {...register("duration", { valueAsNumber: true })}
                    className="bg-[#3A4245] border-gray-600 text-white w-full"
                    placeholder="e.g., 8"
                    min={1}
                  />
                  {errors.duration && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.duration.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-white">
                  Description
                </Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  className="bg-[#3A4245] border-gray-600 text-white w-full"
                  placeholder="Describe what this program covers..."
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="structure" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Program Structure
                </h3>
                <Button
                  onClick={addWeek}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Week
                </Button>
              </div>

              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm text-blue-300">
                  💡 <strong>New Calendar View:</strong> Use the interactive
                  calendar below to build your program. Add items with optional
                  exercise/drill labels, sets, reps, tempo, and notes. Empty
                  days automatically become "Rest Days".
                </p>
              </div>

              {/* ProgramBuilder Integration */}
              <div className="border border-gray-600 rounded-lg overflow-hidden">
                <ProgramBuilder
                  onSave={handleProgramBuilderSave}
                  initialWeeks={programBuilderWeeks as any}
                  programDetails={undefined}
                  onOpenVideoLibrary={() => setIsVideoLibraryOpen(true)}
                  selectedVideoFromLibrary={selectedVideoFromLibrary}
                  onVideoProcessed={() => setSelectedVideoFromLibrary(null)}
                />
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">
                  Program Preview
                </h3>
                <Card className="bg-[#3A4245] border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white">
                      {watch("title") || "Untitled Program"}
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      {watch("description") || "No description provided"}
                    </CardDescription>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="outline"
                        className="bg-green-500/10 text-green-600 border-green-500/20"
                      >
                        {watch("level")}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-purple-500/10 text-purple-600 border-purple-500/20"
                      >
                        {programBuilderWeeks.length} weeks
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {programBuilderWeeks.map((week, weekIndex) => (
                        <div
                          key={weekIndex}
                          className="border border-gray-600 rounded-lg p-4"
                        >
                          <h4 className="text-white font-medium mb-3">
                            {week.name}
                          </h4>
                          <div className="space-y-2">
                            {Object.entries(week.days).map(
                              ([dayKey, items], dayIndex) => (
                                <div key={dayIndex} className="ml-4">
                                  <h5 className="text-gray-300 text-sm mb-2">
                                    {dayKey.charAt(0).toUpperCase() +
                                      dayKey.slice(1)}
                                  </h5>
                                  <div className="space-y-1">
                                    {items.length === 0 ? (
                                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                                        <span>🌙 Rest Day</span>
                                      </div>
                                    ) : (
                                      items.map((item, itemIndex) => (
                                        <div
                                          key={itemIndex}
                                          className="flex items-center space-x-2 text-sm text-gray-400"
                                        >
                                          <Play className="h-3 w-3" />
                                          <span>
                                            {item.title || "Untitled item"}
                                          </span>
                                          {item.duration && (
                                            <>
                                              <Clock className="h-3 w-3" />
                                              <span>{item.duration}</span>
                                            </>
                                          )}
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Create Program Button - Only shown in preview tab */}
                <div className="flex justify-center pt-6">
                  <Button
                    onClick={handleSubmit(handleFormSubmit)}
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium"
                    size="lg"
                  >
                    {isSubmitting ? "Creating..." : "Create Program"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
            >
              Cancel
            </Button>
            {Object.keys(errors).length > 0 && (
              <div className="text-red-400 text-sm mt-2">
                Form errors: {JSON.stringify(errors)}
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DrillSelectionModal
        isOpen={isDrillSelectionOpen}
        onClose={() => setIsDrillSelectionOpen(false)}
        onSelectDrill={handleSelectDrill}
      />

      {/* Video Library Dialog - Rendered at root level */}
      <VideoLibraryDialog
        isOpen={isVideoLibraryOpen}
        onClose={() => setIsVideoLibraryOpen(false)}
        onSelectVideo={video => {
          console.log("Video selected in CreateProgramModal:", video);
          console.log(
            "CreateProgramModal isOpen before video selection:",
            isOpen
          );
          setSelectedVideoFromLibrary(video);
          setIsVideoLibraryOpen(false);
          console.log(
            "CreateProgramModal isOpen after video selection:",
            isOpen
          );
        }}
        editingItem={null}
      />
    </>
  );
}

export default function CreateProgramModal(props: CreateProgramModalProps) {
  return <CreateProgramModalContent {...props} />;
}
