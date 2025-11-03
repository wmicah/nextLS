"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  ArrowRight,
  X,
  GripVertical,
  Target,
  Play,
  Dumbbell,
  Activity,
  Video,
} from "lucide-react";
import { trpc } from "@/app/_trpc/client";
import { useToast } from "@/lib/hooks/use-toast";

interface RoutineExercise {
  id: string;
  title: string;
  type: "exercise" | "drill" | "video" | "routine";
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
}

interface Routine {
  id?: string;
  name: string;
  description: string;
  exercises: RoutineExercise[];
}

interface MobileSeamlessRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  routine?: Routine | null;
  onSuccess?: () => void;
}

export default function MobileSeamlessRoutineModal({
  isOpen,
  onClose,
  routine,
  onSuccess,
}: MobileSeamlessRoutineModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const { toast } = useToast();

  // Create routine mutation
  const createRoutine = trpc.routines.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Routine created",
        description: "Your routine has been created successfully.",
      });
      onSuccess?.();
      onClose();
    },
    onError: error => {
      toast({
        title: "Error",
        description: error.message || "Failed to create routine.",
        variant: "destructive",
      });
    },
  });

  // Update routine mutation
  const updateRoutine = trpc.routines.update.useMutation({
    onSuccess: () => {
      // Invalidate all routine queries to ensure fresh data
      const utils = trpc.useUtils();
      utils.routines.list.invalidate();
      if (routine?.id) {
        utils.routines.get.invalidate({ id: routine.id });
      }
      utils.routines.getRoutineAssignments.invalidate();
      utils.routines.getClientRoutineAssignments.invalidate();
      utils.routines.getRoutineAssignmentsForCalendar.invalidate();
      toast({
        title: "Routine updated",
        description: "Your routine has been updated successfully.",
      });
      onSuccess?.();
      onClose();
    },
    onError: error => {
      toast({
        title: "Error",
        description: error.message || "Failed to update routine.",
        variant: "destructive",
      });
    },
  });

  // Initialize form data
  useEffect(() => {
    if (routine) {
      setFormData({
        name: routine.name,
        description: routine.description,
      });
      setExercises(routine.exercises);
    } else {
      setFormData({
        name: "",
        description: "",
      });
      setExercises([]);
    }
    setCurrentStep(1);
  }, [routine, isOpen]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Routine name is required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const routineData = {
        name: formData.name,
        description: formData.description,
        exercises: exercises,
      };

      if (routine?.id) {
        await updateRoutine.mutateAsync({
          id: routine.id,
          ...routineData,
        });
      } else {
        await createRoutine.mutateAsync(routineData);
      }
    } catch (error) {
      console.error("Error saving routine:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isAddingFromLibrary, setIsAddingFromLibrary] = useState(false);
  const [libraryTab, setLibraryTab] = useState<"master" | "local">("master");

  // Get master library videos
  const { data: masterLibraryData } = trpc.admin.getMasterLibrary.useQuery({
    search: undefined,
    category: undefined,
  });

  const masterLibraryVideos = masterLibraryData?.items || [];

  // Get local library videos
  const { data: localLibraryVideos } = trpc.libraryResources.getAll.useQuery();

  // Debug local library videos
  console.log("Routine Modal - Local library videos:", localLibraryVideos);

  const handleAddFromLibrary = (video: any) => {
    const newExercise: RoutineExercise = {
      id: `video-${Date.now()}`,
      title: video.title,
      type: "video",
      notes: video.description || "",
      videoUrl: video.url,
      videoId: video.id,
      videoTitle: video.title,
      videoThumbnail: video.thumbnail,
    };
    setExercises(prev => [...(prev || []), newExercise]);
    setIsAddingFromLibrary(false);
    console.log("Added exercise:", newExercise);
    console.log("Updated exercises:", [...(exercises || []), newExercise]);
  };

  const updateExercise = (id: string, updates: Partial<RoutineExercise>) => {
    setExercises(
      (exercises || []).map(ex => (ex.id === id ? { ...ex, ...updates } : ex))
    );
  };

  const removeExercise = (id: string) => {
    setExercises((exercises || []).filter(ex => ex.id !== id));
  };

  const getExerciseIcon = (type: string) => {
    switch (type) {
      case "exercise":
        return <Dumbbell className="h-4 w-4" />;
      case "drill":
        return <Target className="h-4 w-4" />;
      case "video":
        return <Play className="h-4 w-4" />;
      case "routine":
        return <Activity className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getExerciseColor = (type: string) => {
    switch (type) {
      case "exercise":
        return "text-blue-400";
      case "drill":
        return "text-green-400";
      case "video":
        return "text-purple-400";
      case "routine":
        return "text-orange-400";
      default:
        return "text-gray-400";
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as 1 | 2 | 3);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as 1 | 2 | 3);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return (
        formData &&
        formData.name &&
        typeof formData.name === "string" &&
        formData.name.trim() !== ""
      );
    }
    return true;
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={open => {
          if (!open) {
            console.log("Dialog closing");
            onClose();
          }
        }}
      >
        <DialogContent className="max-w-sm max-h-[90vh] bg-[#2A3133] border-[#606364] text-[#C3BCC2] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#C3BCC2]">
              {routine ? "Edit Routine" : "Create Routine"}
            </DialogTitle>
            <DialogDescription className="text-[#ABA4AA]">
              {routine
                ? "Update your routine details"
                : "Build a new routine for your athletes"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium text-[#C3BCC2]"
                  >
                    Routine Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={e =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter routine name"
                    className="mt-1 bg-[#353A3A] border-[#606364] text-[#C3BCC2] placeholder-[#ABA4AA] focus:ring-[#4A5A70]"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="description"
                    className="text-sm font-medium text-[#C3BCC2]"
                  >
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={e =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe this routine..."
                    rows={3}
                    className="mt-1 bg-[#353A3A] border-[#606364] text-[#C3BCC2] placeholder-[#ABA4AA] focus:ring-[#4A5A70]"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Add Exercises */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-[#C3BCC2]">
                    Exercises ({exercises?.length || 0})
                  </h3>
                  <Button
                    type="button"
                    onClick={() => setIsAddingFromLibrary(true)}
                    size="sm"
                    className="bg-[#4A5A70] hover:bg-[#606364] text-white h-8 px-3"
                  >
                    <Video className="h-4 w-4 mr-1" />
                    Add from Library
                  </Button>
                </div>

                {(exercises?.length || 0) === 0 ? (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 mx-auto mb-4 text-[#ABA4AA] opacity-50" />
                    <p className="text-[#ABA4AA] mb-4">No exercises yet</p>
                    <p className="text-sm text-[#606364]">
                      Add exercises to build your routine
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(exercises || []).map((exercise, index) => (
                      <Card
                        key={exercise.id}
                        className="bg-[#353A3A] border-[#606364]"
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    "flex items-center gap-1",
                                    getExerciseColor(exercise.type)
                                  )}
                                >
                                  {getExerciseIcon(exercise.type)}
                                  <span className="text-sm font-medium">
                                    Exercise {index + 1}
                                  </span>
                                </div>
                              </div>
                              <Button
                                onClick={() => removeExercise(exercise.id)}
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 h-6 w-6"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>

                            <div className="space-y-2">
                              <div>
                                <Label className="text-xs text-[#ABA4AA]">
                                  Title
                                </Label>
                                <Input
                                  value={exercise.title}
                                  onChange={e =>
                                    updateExercise(exercise.id, {
                                      title: e.target.value,
                                    })
                                  }
                                  placeholder="Exercise name"
                                  className="bg-[#2A3133] border-[#606364] text-[#C3BCC2] placeholder-[#ABA4AA] text-sm"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs text-[#ABA4AA]">
                                    Sets
                                  </Label>
                                  <Input
                                    type="number"
                                    value={exercise.sets || ""}
                                    onChange={e =>
                                      updateExercise(exercise.id, {
                                        sets:
                                          parseInt(e.target.value) || undefined,
                                      })
                                    }
                                    placeholder="Sets"
                                    className="bg-[#2A3133] border-[#606364] text-[#C3BCC2] placeholder-[#ABA4AA] text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-[#ABA4AA]">
                                    Reps
                                  </Label>
                                  <Input
                                    type="number"
                                    value={exercise.reps || ""}
                                    onChange={e =>
                                      updateExercise(exercise.id, {
                                        reps:
                                          parseInt(e.target.value) || undefined,
                                      })
                                    }
                                    placeholder="Reps"
                                    className="bg-[#2A3133] border-[#606364] text-[#C3BCC2] placeholder-[#ABA4AA] text-sm"
                                  />
                                </div>
                              </div>

                              <div>
                                <Label className="text-xs text-[#ABA4AA]">
                                  Notes
                                </Label>
                                <Textarea
                                  value={exercise.notes || ""}
                                  onChange={e =>
                                    updateExercise(exercise.id, {
                                      notes: e.target.value,
                                    })
                                  }
                                  placeholder="Additional notes..."
                                  rows={2}
                                  className="bg-[#2A3133] border-[#606364] text-[#C3BCC2] placeholder-[#ABA4AA] text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-[#C3BCC2]">
                  Review Routine
                </h3>

                <Card className="bg-[#353A3A] border-[#606364]">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-[#C3BCC2]">
                          Name
                        </h4>
                        <p className="text-sm text-[#ABA4AA]">
                          {formData.name}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-[#C3BCC2]">
                          Description
                        </h4>
                        <p className="text-sm text-[#ABA4AA]">
                          {formData.description || "No description"}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-[#C3BCC2]">
                          Exercises
                        </h4>
                        <p className="text-sm text-[#ABA4AA]">
                          {exercises.length} exercise
                          {exercises.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-2 pt-4 border-t border-[#606364]">
            {currentStep > 1 && (
              <Button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 rounded-lg border border-[#606364] text-[#ABA4AA] hover:bg-[#4A5A70] transition-colors flex items-center gap-2"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                Back
              </Button>
            )}

            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex-1 px-4 py-2 rounded-lg bg-[#4A5A70] text-white hover:bg-[#606364] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {routine ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4" />
                    {routine ? "Update Routine" : "Create Routine"}
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add from Library Dialog - Outside main dialog */}
      {isAddingFromLibrary && (
        <div className="fixed inset-0 z-[100] bg-black bg-opacity-50 flex items-center justify-center p-4">
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
              <p className="text-[#ABA4AA] text-sm mb-4">
                Select videos from your library to add to this routine
              </p>

              <div className="space-y-3">
                {libraryTab === "master" ? (
                  <>
                    {(masterLibraryVideos || []).map(video => (
                      <Card
                        key={video.id}
                        className="bg-[#353A3A] border-[#606364] cursor-pointer hover:bg-[#2A3133] transition-colors"
                        onClick={() => {
                          console.log("Adding video:", video.title);
                          console.log(
                            "Current exercises before adding:",
                            exercises
                          );
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

                    {(masterLibraryVideos || []).length === 0 && (
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
                    {(localLibraryVideos || []).map(video => (
                      <Card
                        key={video.id}
                        className="bg-[#353A3A] border-[#606364] cursor-pointer hover:bg-[#2A3133] transition-colors"
                        onClick={() => {
                          console.log("Adding local video:", video);
                          console.log("Local video structure:", video);
                          console.log(
                            "Current exercises before adding:",
                            exercises
                          );
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

                    {(localLibraryVideos || []).length === 0 && (
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
                type="button"
                onClick={() => setIsAddingFromLibrary(false)}
                className="w-full bg-[#4A5A70] hover:bg-[#606364] text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
