"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Target,
  Users,
  Clock,
  Check,
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  Activity,
  Video,
  Play,
} from "lucide-react";
import { Week, ProgramItem } from "./types/ProgramBuilder";
import { trpc } from "@/app/_trpc/client";

interface MobileCreateProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProgramFormData) => void;
}

interface ProgramFormData {
  title: string;
  description?: string;
  level: string;
  duration: number;
  weeks: Week[];
}

const DAY_LABELS: Record<string, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export default function MobileCreateProgramModal({
  isOpen,
  onClose,
  onSubmit,
}: MobileCreateProgramModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [formData, setFormData] = useState<ProgramFormData>({
    title: "",
    description: "",
    level: "",
    duration: 1,
    weeks: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [isAddingFromLibrary, setIsAddingFromLibrary] = useState(false);
  const [libraryTab, setLibraryTab] = useState<"master" | "local">("master");

  // Get master library videos
  const { data: masterLibraryVideos = [] } =
    trpc.admin.getMasterLibrary.useQuery();

  // Get local library videos
  const { data: localLibraryVideos = [] } =
    trpc.libraryResources.getAll.useQuery();

  // Debug local library videos
  console.log("Local library videos:", localLibraryVideos);

  // Initialize weeks based on duration
  const initializeWeeks = useCallback(() => {
    if (formData.weeks.length === 0 && formData.duration > 0) {
      const weeks: Week[] = [];
      for (let i = 1; i <= formData.duration; i++) {
        weeks.push({
          id: `week-${i}`,
          name: `Week ${i}`,
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
        });
      }
      setFormData(prev => ({ ...prev, weeks }));
    }
  }, [formData.duration, formData.weeks.length]);

  // Initialize weeks when duration changes
  useEffect(() => {
    initializeWeeks();
  }, [initializeWeeks]);

  const addWeek = useCallback(() => {
    const newWeekNumber = formData.weeks.length + 1;
    const newWeek: Week = {
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
    setFormData(prev => ({ ...prev, weeks: [...prev.weeks, newWeek] }));
  }, [formData.weeks.length]);

  const deleteWeek = useCallback(
    (weekId: string) => {
      if (formData.weeks.length === 1) return;
      setFormData(prev => ({
        ...prev,
        weeks: prev.weeks.filter(week => week.id !== weekId),
      }));
    },
    [formData.weeks.length]
  );

  const addExerciseToDay = useCallback(
    (weekId: string, dayKey: string, exercise: ProgramItem) => {
      setFormData(prev => ({
        ...prev,
        weeks: prev.weeks.map(week => {
          if (week.id === weekId) {
            return {
              ...week,
              days: {
                ...week.days,
                [dayKey]: [
                  ...week.days[dayKey as keyof typeof week.days],
                  exercise,
                ],
              },
            };
          }
          return week;
        }),
      }));
    },
    []
  );

  const removeExerciseFromDay = useCallback(
    (weekId: string, dayKey: string, exerciseId: string) => {
      setFormData(prev => ({
        ...prev,
        weeks: prev.weeks.map(week => {
          if (week.id === weekId) {
            return {
              ...week,
              days: {
                ...week.days,
                [dayKey]: week.days[dayKey as keyof typeof week.days].filter(
                  item => item.id !== exerciseId
                ),
              },
            };
          }
          return week;
        }),
      }));
    },
    []
  );

  const handleAddFromLibrary = useCallback(
    (video: any) => {
      console.log("handleAddFromLibrary called with:", video);
      console.log("selectedWeek:", selectedWeek);
      console.log("selectedDay:", selectedDay);

      if (!selectedWeek || !selectedDay) {
        console.log("Missing selectedWeek or selectedDay");
        return;
      }

      const exercise: ProgramItem = {
        id: `video-${Date.now()}`,
        title: video.title,
        type: "video",
        description: video.description,
        videoUrl: video.url,
        videoId: video.id,
        videoTitle: video.title,
        videoThumbnail: video.thumbnail,
      };

      console.log("Adding video exercise:", exercise);
      addExerciseToDay(selectedWeek.id, selectedDay, exercise);
      setIsAddingFromLibrary(false);
    },
    [selectedWeek, selectedDay, addExerciseToDay]
  );

  const getTotalExercises = useCallback(() => {
    return formData.weeks.reduce((total, week) => {
      return total + Object.values(week.days).flat().length;
    }, 0);
  }, [formData.weeks]);

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.level || formData.duration < 1) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Error creating program:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as 1 | 2 | 3 | 4);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as 1 | 2 | 3 | 4);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.title.trim();
      case 2:
        return formData.level && formData.duration >= 1;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-[#2A3133] w-full max-w-sm rounded-xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#606364]">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">Create Program</h2>
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
              <div
                className={`w-2 h-2 rounded-full ${
                  currentStep >= 4 ? "bg-[#4A5A70]" : "bg-[#606364]"
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
        <div className="p-4 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-base font-semibold text-[#C3BCC2] mb-2">
                  Program Details
                </h3>
                <p className="text-sm text-[#ABA4AA]">
                  Set up the basic information for your program
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-[#C3BCC2]">
                    Program Title *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, title: e.target.value }))
                    }
                    className="bg-[#353A3A] border-[#606364] text-[#C3BCC2] mt-1"
                    placeholder="e.g., Advanced Hitting Program"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-[#C3BCC2]">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="bg-[#353A3A] border-[#606364] text-[#C3BCC2] mt-1"
                    placeholder="Describe what this program covers..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Program Settings */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-base font-semibold text-[#C3BCC2] mb-2">
                  Program Settings
                </h3>
                <p className="text-sm text-[#ABA4AA]">
                  Configure the program level and duration
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="level" className="text-[#C3BCC2]">
                    Focus Area *
                  </Label>
                  <Select
                    value={formData.level}
                    onValueChange={value =>
                      setFormData(prev => ({ ...prev, level: value }))
                    }
                  >
                    <SelectTrigger className="bg-[#353A3A] border-[#606364] text-[#C3BCC2] mt-1">
                      <SelectValue placeholder="Select focus area" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#353A3A] border-[#606364]">
                      <SelectItem
                        value="Drive"
                        className="text-[#C3BCC2] hover:bg-[#2A3133]"
                      >
                        Drive
                      </SelectItem>
                      <SelectItem
                        value="Stability"
                        className="text-[#C3BCC2] hover:bg-[#2A3133]"
                      >
                        Stability
                      </SelectItem>
                      <SelectItem
                        value="Extension"
                        className="text-[#C3BCC2] hover:bg-[#2A3133]"
                      >
                        Extension
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duration" className="text-[#C3BCC2]">
                    Duration (Weeks) *
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        duration: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="bg-[#353A3A] border-[#606364] text-[#C3BCC2] mt-1"
                    min="1"
                    max="52"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Build Program */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-base font-semibold text-[#C3BCC2] mb-2">
                  Build Program Structure
                </h3>
                <p className="text-sm text-[#ABA4AA]">
                  Add exercises to your program weeks and days
                </p>
              </div>

              {/* Program Stats */}
              <Card className="bg-[#353A3A] border-[#606364]">
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-[#C3BCC2]">
                        {formData.weeks.length}
                      </div>
                      <div className="text-xs text-[#ABA4AA]">Weeks</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#C3BCC2]">
                        {getTotalExercises()}
                      </div>
                      <div className="text-xs text-[#ABA4AA]">Exercises</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Add Week Button */}
              <Button
                onClick={addWeek}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-lg font-medium"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Week
              </Button>

              {/* Weeks List */}
              <div className="space-y-3">
                {formData.weeks.map((week, index) => (
                  <Card
                    key={week.id}
                    className="bg-[#353A3A] border-[#606364] rounded-lg"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#4A5A70] flex items-center justify-center text-sm font-bold text-white">
                            {index + 1}
                          </div>
                          <div>
                            <CardTitle className="text-base font-bold text-[#C3BCC2]">
                              {week.name}
                            </CardTitle>
                            <p className="text-sm text-[#ABA4AA]">
                              {Object.values(week.days).flat().length} exercises
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteWeek(week.id)}
                            className="border-red-500 text-red-400 hover:bg-red-500/10 h-8 w-8 p-0 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="px-4 pb-4">
                      <div className="space-y-2">
                        {DAY_KEYS.map(dayKey => {
                          const dayItems =
                            week.days[dayKey as keyof typeof week.days];
                          return (
                            <div key={dayKey} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-[#C3BCC2]">
                                  {DAY_LABELS[dayKey]}
                                </h4>
                                <span className="text-xs text-[#ABA4AA]">
                                  {dayItems.length} exercise
                                  {dayItems.length !== 1 ? "s" : ""}
                                </span>
                              </div>
                              {/* Show added exercises */}
                              {dayItems.length > 0 && (
                                <div className="space-y-2 mb-3">
                                  {dayItems.map((exercise, index) => (
                                    <div
                                      key={exercise.id || index}
                                      className="bg-[#2A3133] border border-[#606364]/30 rounded-lg p-3"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          {exercise.type === "video" ? (
                                            <Video className="h-4 w-4 text-blue-400" />
                                          ) : (
                                            <Target className="h-4 w-4 text-green-400" />
                                          )}
                                          <div>
                                            <h5 className="text-sm font-medium text-[#C3BCC2]">
                                              {exercise.title}
                                            </h5>
                                            {exercise.description && (
                                              <p className="text-xs text-[#ABA4AA] mt-1">
                                                {exercise.description}
                                              </p>
                                            )}
                                            {(exercise.sets ||
                                              exercise.reps ||
                                              exercise.duration) && (
                                              <div className="flex items-center gap-2 mt-1">
                                                {exercise.sets && (
                                                  <span className="text-xs px-2 py-1 bg-[#4A5A70] rounded text-[#ABA4AA]">
                                                    {exercise.sets} sets
                                                  </span>
                                                )}
                                                {exercise.reps && (
                                                  <span className="text-xs px-2 py-1 bg-[#4A5A70] rounded text-[#ABA4AA]">
                                                    {exercise.reps} reps
                                                  </span>
                                                )}
                                                {exercise.duration && (
                                                  <span className="text-xs px-2 py-1 bg-[#4A5A70] rounded text-[#ABA4AA]">
                                                    {exercise.duration}
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <Button
                                          onClick={() =>
                                            removeExerciseFromDay(
                                              week.id,
                                              dayKey,
                                              exercise.id
                                            )
                                          }
                                          variant="ghost"
                                          size="sm"
                                          className="text-[#ABA4AA] hover:text-red-400 hover:bg-red-500/10 p-1 h-8 w-8"
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="space-y-2">
                                <Button
                                  onClick={() => {
                                    setSelectedWeek(week);
                                    setSelectedDay(dayKey);
                                    setIsAddingFromLibrary(true);
                                  }}
                                  variant="outline"
                                  className="w-full border-[#606364]/50 text-[#ABA4AA] hover:bg-[#2A3133] hover:text-[#C3BCC2] h-10 rounded-lg"
                                >
                                  <Video className="h-4 w-4 mr-2" />
                                  Add from Library
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-base font-semibold text-[#C3BCC2] mb-2">
                  Review Program
                </h3>
                <p className="text-sm text-[#ABA4AA]">
                  Review your program details before creating
                </p>
              </div>

              <Card className="bg-[#353A3A] border-[#606364]">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-[#C3BCC2]">
                        Program Title
                      </h4>
                      <p className="text-sm text-[#ABA4AA]">{formData.title}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[#C3BCC2]">
                        Description
                      </h4>
                      <p className="text-sm text-[#ABA4AA]">
                        {formData.description}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[#C3BCC2]">
                        Focus Area
                      </h4>
                      <p className="text-sm text-[#ABA4AA]">{formData.level}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[#C3BCC2]">
                        Duration
                      </h4>
                      <p className="text-sm text-[#ABA4AA]">
                        {formData.duration} week
                        {formData.duration !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#606364] bg-[#353A3A]">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button
                onClick={prevStep}
                className="px-4 py-2 rounded-lg border border-[#606364] text-[#ABA4AA] hover:bg-[#4A5A70] transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}

            {currentStep < 4 ? (
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
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Create Program
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Add from Library Dialog */}
      {isAddingFromLibrary && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-[#2A3133] w-full max-w-sm rounded-xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#606364]">
              <h3 className="text-lg font-bold text-white">Add from Library</h3>
              <button
                onClick={() => setIsAddingFromLibrary(false)}
                className="p-1 rounded-lg hover:bg-[#4A5A70] text-[#ABA4AA]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Library Tabs */}
            <div className="p-4 border-b border-[#606364]">
              <div className="flex bg-[#2A3133] rounded-lg p-1">
                <button
                  onClick={() => setLibraryTab("master")}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    libraryTab === "master"
                      ? "bg-[#4A5A70] text-white"
                      : "text-[#ABA4AA] hover:text-[#C3BCC2]"
                  }`}
                >
                  Master Library
                </button>
                <button
                  onClick={() => {
                    console.log("Switching to local library tab");
                    setLibraryTab("local");
                  }}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    libraryTab === "local"
                      ? "bg-[#4A5A70] text-white"
                      : "text-[#ABA4AA] hover:text-[#C3BCC2]"
                  }`}
                >
                  My Library
                </button>
              </div>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-3">
                {libraryTab === "master" ? (
                  <>
                    {masterLibraryVideos.map(video => (
                      <Card
                        key={video.id}
                        className="bg-[#353A3A] border-[#606364] cursor-pointer hover:bg-[#2A3133] transition-colors"
                        onClick={() => {
                          console.log("Adding video:", video.title);
                          handleAddFromLibrary(video);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-[#4A5A70] rounded-lg flex items-center justify-center">
                                {video.isYoutube ? (
                                  <div className="w-full h-full bg-red-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">
                                      YT
                                    </span>
                                  </div>
                                ) : (
                                  <Play className="h-6 w-6 text-[#C3BCC2]" />
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-[#C3BCC2]">
                                  {video.title}
                                </h4>
                                <p className="text-xs text-[#ABA4AA] mt-1">
                                  {video.description}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs px-2 py-1 bg-[#4A5A70] rounded text-[#ABA4AA]">
                                    {video.category}
                                  </span>
                                  {video.duration && (
                                    <span className="text-xs text-[#606364]">
                                      {video.duration}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Video className="h-5 w-5 text-blue-400" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {masterLibraryVideos.length === 0 && (
                      <div className="text-center py-8">
                        <Video className="h-12 w-12 mx-auto mb-4 text-[#ABA4AA] opacity-50" />
                        <p className="text-[#ABA4AA] mb-2">
                          No master videos available
                        </p>
                        <p className="text-sm text-[#606364]">
                          Check back later for new content
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {localLibraryVideos.map(video => (
                      <Card
                        key={video.id}
                        className="bg-[#353A3A] border-[#606364] cursor-pointer hover:bg-[#2A3133] transition-colors"
                        onClick={() => {
                          console.log("Adding local video:", video);
                          console.log("Local video structure:", video);
                          handleAddFromLibrary(video);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-[#4A5A70] rounded-lg flex items-center justify-center">
                                {video.isYoutube ? (
                                  <div className="w-full h-full bg-red-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">
                                      YT
                                    </span>
                                  </div>
                                ) : (
                                  <Play className="h-6 w-6 text-[#C3BCC2]" />
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-[#C3BCC2]">
                                  {video.title}
                                </h4>
                                <p className="text-xs text-[#ABA4AA] mt-1">
                                  {video.description}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs px-2 py-1 bg-[#4A5A70] rounded text-[#ABA4AA]">
                                    {video.category}
                                  </span>
                                  {video.duration && (
                                    <span className="text-xs text-[#606364]">
                                      {video.duration}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Video className="h-5 w-5 text-blue-400" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {localLibraryVideos.length === 0 && (
                      <div className="text-center py-8">
                        <Video className="h-12 w-12 mx-auto mb-4 text-[#ABA4AA] opacity-50" />
                        <p className="text-[#ABA4AA] mb-2">
                          No local videos available
                        </p>
                        <p className="text-sm text-[#606364]">
                          Upload videos to your library first
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-[#606364] bg-[#353A3A]">
              <Button
                onClick={() => setIsAddingFromLibrary(false)}
                className="w-full bg-[#4A5A70] hover:bg-[#606364] text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
