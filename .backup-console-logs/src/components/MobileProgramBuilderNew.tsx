"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  Calendar,
  Target,
  Play,
  Save,
  ArrowLeft,
  ArrowRight,
  Edit,
  X,
  Check,
  Clock,
  Users,
  Activity,
  Dumbbell,
  Video,
  BookOpen,
} from "lucide-react";
import { trpc } from "@/app/_trpc/client";
import { Week, ProgramItem, ProgramBuilderProps } from "./types/ProgramBuilder";

interface Routine {
  id: string;
  name: string;
  description: string;
  exercises: ProgramItem[];
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

export default function MobileProgramBuilderNew({
  onSave,
  initialWeeks = [],
  programDetails,
  onOpenVideoLibrary,
  selectedVideoFromLibrary,
  onVideoProcessed,
}: ProgramBuilderProps) {
  const [weeks, setWeeks] = useState<Week[]>(initialWeeks);
  const [currentStep, setCurrentStep] = useState<"overview" | "week" | "day">(
    "overview"
  );
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [isCreatingRoutine, setIsCreatingRoutine] = useState(false);
  const [newExercise, setNewExercise] = useState({
    title: "",
    type: "exercise" as const,
    sets: 1,
    reps: 10,
    duration: "",
    notes: "",
  });

  // Sync with initial weeks
  useEffect(() => {
    if (initialWeeks && initialWeeks.length > 0) {
      setWeeks(initialWeeks);
    }
  }, [initialWeeks]);

  // Get routines
  const { data: routinesData = [] } = trpc.routines.list.useQuery();
  const routines: Routine[] = routinesData.map(routine => ({
    id: routine.id,
    name: routine.name,
    description: routine.description || "",
    exercises: routine.exercises.map(exercise => ({
      id: exercise.id,
      title: exercise.title,
      type: exercise.type as any,
      description: exercise.description || undefined,
      notes: exercise.notes || undefined,
      sets: exercise.sets || undefined,
      reps: exercise.reps || undefined,
      tempo: exercise.tempo || undefined,
      duration: exercise.duration || undefined,
      videoUrl: exercise.videoUrl || undefined,
      videoId: exercise.videoId || undefined,
      videoTitle: exercise.videoTitle || undefined,
      videoThumbnail: exercise.videoThumbnail || undefined,
      routineId: exercise.routineId,
    })),
  }));

  const handleSave = useCallback(() => {
    onSave?.(weeks);
    programDetails?.onSave?.(weeks);
  }, [weeks, onSave, programDetails]);

  const addWeek = useCallback(() => {
    const newWeekNumber = weeks.length + 1;
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
    const updatedWeeks = [...weeks, newWeek];
    setWeeks(updatedWeeks);
    onSave?.(updatedWeeks);
  }, [weeks, onSave]);

  const deleteWeek = useCallback(
    (weekId: string) => {
      if (weeks.length === 1) return;
      const updatedWeeks = weeks.filter(week => week.id !== weekId);
      setWeeks(updatedWeeks);
      onSave?.(updatedWeeks);
    },
    [weeks, onSave]
  );

  const duplicateWeek = useCallback(
    (weekId: string) => {
      const weekToDuplicate = weeks.find(w => w.id === weekId);
      if (!weekToDuplicate) return;

      const newWeekNumber = weeks.length + 1;
      const newWeek: Week = {
        id: `week-${newWeekNumber}`,
        name: `Week ${newWeekNumber}`,
        collapsed: false,
        days: JSON.parse(JSON.stringify(weekToDuplicate.days)),
      };
      const updatedWeeks = [...weeks, newWeek];
      setWeeks(updatedWeeks);
      onSave?.(updatedWeeks);
    },
    [weeks, onSave]
  );

  const toggleWeekCollapse = useCallback(
    (weekId: string) => {
      const updatedWeeks = weeks.map(week =>
        week.id === weekId ? { ...week, collapsed: !week.collapsed } : week
      );
      setWeeks(updatedWeeks);
    },
    [weeks]
  );

  const openWeek = useCallback((week: Week) => {
    setSelectedWeek(week);
    setCurrentStep("week");
  }, []);

  const openDay = useCallback((week: Week, dayKey: string) => {
    setSelectedWeek(week);
    setSelectedDay(dayKey);
    setCurrentStep("day");
  }, []);

  const addExerciseToDay = useCallback(
    (weekId: string, dayKey: string, exercise: ProgramItem) => {
      const updatedWeeks = weeks.map(week => {
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
      });
      setWeeks(updatedWeeks);
      onSave?.(updatedWeeks);
    },
    [weeks, onSave]
  );

  const removeExerciseFromDay = useCallback(
    (weekId: string, dayKey: string, exerciseId: string) => {
      const updatedWeeks = weeks.map(week => {
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
      });
      setWeeks(updatedWeeks);
      onSave?.(updatedWeeks);
    },
    [weeks, onSave]
  );

  const handleAddExercise = useCallback(() => {
    if (!selectedWeek || !selectedDay) return;

    const exercise: ProgramItem = {
      id: `exercise-${Date.now()}`,
      title: newExercise.title,
      type: newExercise.type,
      sets: newExercise.sets,
      reps: newExercise.reps,
      duration: newExercise.duration,
      notes: newExercise.notes,
    };

    addExerciseToDay(selectedWeek.id, selectedDay, exercise);
    setIsAddingExercise(false);
    setNewExercise({
      title: "",
      type: "exercise",
      sets: 1,
      reps: 10,
      duration: "",
      notes: "",
    });
  }, [selectedWeek, selectedDay, newExercise, addExerciseToDay]);

  const handleAddRoutine = useCallback(
    (routine: Routine) => {
      if (!selectedWeek || !selectedDay) return;

      routine.exercises.forEach((exercise, index) => {
        const exerciseWithId = {
          ...exercise,
          id: `routine-${routine.id}-${index}-${Date.now()}`,
        };
        addExerciseToDay(selectedWeek.id, selectedDay, exerciseWithId);
      });
    },
    [selectedWeek, selectedDay, addExerciseToDay]
  );

  const getTotalExercises = useCallback(() => {
    return weeks.reduce((total, week) => {
      return total + Object.values(week.days).flat().length;
    }, 0);
  }, [weeks]);

  // Overview Step
  if (currentStep === "overview") {
    return (
      <div className="min-h-screen bg-[#2A3133] p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {programDetails?.onBack && (
              <Button
                variant="ghost"
                onClick={programDetails.onBack}
                className="p-2 text-[#C3BCC2] hover:text-white hover:bg-[#353A3A] rounded-lg"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="w-10 h-10 rounded-lg bg-[#4A5A70] flex items-center justify-center">
              <Calendar className="h-5 w-5 text-[#C3BCC2]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#C3BCC2]">
                {programDetails?.title || "Program Builder"}
              </h1>
              <p className="text-sm text-[#ABA4AA]">
                {weeks.length} week{weeks.length !== 1 ? "s" : ""} •{" "}
                {getTotalExercises()} exercises
              </p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={programDetails?.isSaving}
            className="p-3 rounded-lg bg-green-600 hover:bg-green-700 text-white"
          >
            <Save className="h-5 w-5" />
          </Button>
        </div>

        {/* Program Stats */}
        <Card className="bg-[#353A3A] border-[#606364] mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-[#C3BCC2]">
                  {weeks.length}
                </div>
                <div className="text-xs text-[#ABA4AA]">Weeks</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#C3BCC2]">
                  {getTotalExercises()}
                </div>
                <div className="text-xs text-[#ABA4AA]">Exercises</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#C3BCC2]">
                  {routines.length}
                </div>
                <div className="text-xs text-[#ABA4AA]">Routines</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          <Button
            onClick={addWeek}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-14 rounded-lg font-medium"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Week
          </Button>
          <Button
            onClick={() => setIsCreatingRoutine(true)}
            variant="outline"
            className="w-full border-green-500/50 text-green-400 hover:bg-green-500/10 h-12 rounded-lg font-medium"
          >
            <Target className="h-5 w-5 mr-2" />
            Create Routine
          </Button>
        </div>

        {/* Weeks List */}
        <div className="space-y-3">
          {weeks.map((week, index) => (
            <Card
              key={week.id}
              className="bg-[#353A3A] border-[#606364] rounded-lg"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => toggleWeekCollapse(week.id)}
                      className="p-2 h-10 w-10 text-[#ABA4AA] hover:text-[#C3BCC2] hover:bg-[#2A3133] rounded-lg"
                    >
                      {week.collapsed ? (
                        <ChevronRight className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </Button>
                    <div>
                      <CardTitle className="text-lg font-bold text-[#C3BCC2]">
                        {week.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
                          Week {index + 1}
                        </Badge>
                        <span className="text-xs text-[#ABA4AA]">
                          {Object.values(week.days).flat().length} exercises
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => duplicateWeek(week.id)}
                      className="border-[#606364] text-[#ABA4AA] hover:bg-[#2A3133] hover:text-[#C3BCC2] h-9 px-3 rounded-lg"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteWeek(week.id)}
                      className="border-red-500 text-red-400 hover:bg-red-500/10 h-9 px-3 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {!week.collapsed && (
                <CardContent className="px-4 pb-4">
                  <div className="space-y-3">
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
                          <Button
                            onClick={() => openDay(week, dayKey)}
                            variant="outline"
                            className="w-full border-[#606364]/50 text-[#ABA4AA] hover:bg-[#2A3133] hover:text-[#C3BCC2] h-10 rounded-lg"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            {dayItems.length === 0
                              ? "Add Exercises"
                              : "Manage Exercises"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Week Step
  if (currentStep === "week" && selectedWeek) {
    return (
      <div className="min-h-screen bg-[#2A3133] p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep("overview")}
              className="p-2 text-[#C3BCC2] hover:text-white hover:bg-[#353A3A] rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="w-10 h-10 rounded-lg bg-[#4A5A70] flex items-center justify-center">
              <Calendar className="h-5 w-5 text-[#C3BCC2]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#C3BCC2]">
                {selectedWeek.name}
              </h1>
              <p className="text-sm text-[#ABA4AA]">
                {Object.values(selectedWeek.days).flat().length} exercises
              </p>
            </div>
          </div>
        </div>

        {/* Days List */}
        <div className="space-y-3">
          {DAY_KEYS.map(dayKey => {
            const dayItems =
              selectedWeek.days[dayKey as keyof typeof selectedWeek.days];
            return (
              <Card
                key={dayKey}
                className="bg-[#353A3A] border-[#606364] rounded-lg"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-[#C3BCC2]">
                        {DAY_LABELS[dayKey]}
                      </h3>
                      <p className="text-sm text-[#ABA4AA]">
                        {dayItems.length} exercise
                        {dayItems.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Button
                      onClick={() => openDay(selectedWeek, dayKey)}
                      variant="outline"
                      className="border-[#606364]/50 text-[#ABA4AA] hover:bg-[#2A3133] hover:text-[#C3BCC2] h-10 px-4 rounded-lg"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>

                  {dayItems.length === 0 ? (
                    <div className="text-center py-4 text-[#ABA4AA]">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No exercises added</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dayItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-[#2A3133] rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-[#4A5A70] flex items-center justify-center text-xs font-bold text-white">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#C3BCC2]">
                                {item.title}
                              </p>
                              <p className="text-xs text-[#ABA4AA]">
                                {item.sets && item.reps
                                  ? `${item.sets} sets × ${item.reps} reps`
                                  : item.duration || "Exercise"}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              removeExerciseFromDay(
                                selectedWeek.id,
                                dayKey,
                                item.id
                              )
                            }
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Day Step
  if (currentStep === "day" && selectedWeek && selectedDay) {
    const dayItems =
      selectedWeek.days[selectedDay as keyof typeof selectedWeek.days];

    return (
      <div className="min-h-screen bg-[#2A3133] p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep("week")}
              className="p-2 text-[#C3BCC2] hover:text-white hover:bg-[#353A3A] rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="w-10 h-10 rounded-lg bg-[#4A5A70] flex items-center justify-center">
              <Activity className="h-5 w-5 text-[#C3BCC2]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#C3BCC2]">
                {DAY_LABELS[selectedDay]}
              </h1>
              <p className="text-sm text-[#ABA4AA]">
                {dayItems.length} exercise{dayItems.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Exercises List */}
        <div className="space-y-3 mb-6">
          {dayItems.map((item, index) => (
            <Card
              key={item.id}
              className="bg-[#353A3A] border-[#606364] rounded-lg"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#4A5A70] flex items-center justify-center text-sm font-bold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#C3BCC2]">
                        {item.title}
                      </h3>
                      <p className="text-sm text-[#ABA4AA]">
                        {item.sets && item.reps
                          ? `${item.sets} sets × ${item.reps} reps`
                          : item.duration || "Exercise"}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-[#ABA4AA] mt-1">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      removeExerciseFromDay(
                        selectedWeek.id,
                        selectedDay,
                        item.id
                      )
                    }
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add Exercise Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => setIsAddingExercise(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-lg font-medium"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Exercise
          </Button>
          <Button
            onClick={() => {
              /* TODO: Add routine selection */
            }}
            variant="outline"
            className="w-full border-green-500/50 text-green-400 hover:bg-green-500/10 h-12 rounded-lg font-medium"
          >
            <Target className="h-5 w-5 mr-2" />
            Add Routine
          </Button>
        </div>
      </div>
    );
  }

  // Add Exercise Dialog
  if (isAddingExercise) {
    return (
      <Dialog open={isAddingExercise} onOpenChange={setIsAddingExercise}>
        <DialogContent className="bg-[#2A3133] border-[#606364] max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-[#C3BCC2]">Add Exercise</DialogTitle>
            <DialogDescription className="text-[#ABA4AA]">
              Add a new exercise to {selectedDay && DAY_LABELS[selectedDay]}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-[#C3BCC2]">
                Exercise Name
              </Label>
              <Input
                id="title"
                value={newExercise.title}
                onChange={e =>
                  setNewExercise(prev => ({ ...prev, title: e.target.value }))
                }
                className="bg-[#353A3A] border-[#606364] text-[#C3BCC2]"
                placeholder="e.g., Push-ups"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sets" className="text-[#C3BCC2]">
                  Sets
                </Label>
                <Input
                  id="sets"
                  type="number"
                  value={newExercise.sets}
                  onChange={e => {
                    const value = parseInt(e.target.value);
                    if (value >= 0) {
                      setNewExercise(prev => ({
                        ...prev,
                        sets: value || 0,
                      }));
                    }
                  }}
                  className="bg-[#353A3A] border-[#606364] text-[#C3BCC2]"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="reps" className="text-[#C3BCC2]">
                  Reps
                </Label>
                <Input
                  id="reps"
                  type="number"
                  value={newExercise.reps}
                  onChange={e => {
                    const value = parseInt(e.target.value);
                    if (value >= 0) {
                      setNewExercise(prev => ({
                        ...prev,
                        reps: value || 0,
                      }));
                    }
                  }}
                  className="bg-[#353A3A] border-[#606364] text-[#C3BCC2]"
                  min="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes" className="text-[#C3BCC2]">
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                value={newExercise.notes}
                onChange={e =>
                  setNewExercise(prev => ({ ...prev, notes: e.target.value }))
                }
                className="bg-[#353A3A] border-[#606364] text-[#C3BCC2]"
                placeholder="Additional instructions..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddingExercise(false)}
              className="border-[#606364] text-[#ABA4AA] hover:bg-[#2A3133]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddExercise}
              disabled={!newExercise.title.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add Exercise
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
