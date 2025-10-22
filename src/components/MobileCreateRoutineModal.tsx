"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ArrowRight,
  Video,
  Play,
  X,
  Plus,
  Trash2,
  Target,
} from "lucide-react";
import { trpc } from "@/app/_trpc/client";

interface RoutineExercise {
  id: string;
  title: string;
  type: "video" | "exercise" | "routine" | "rest";
  notes?: string;
  sets?: number;
  reps?: number;
  duration?: string;
  videoUrl?: string;
  videoId?: string;
  videoTitle?: string;
  videoThumbnail?: string;
}

interface RoutineFormData {
  name: string;
  description: string;
}

interface MobileCreateRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function MobileCreateRoutineModal({
  isOpen,
  onClose,
  onSuccess,
}: MobileCreateRoutineModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<RoutineFormData>({
    name: "",
    description: "",
  });
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingFromLibrary, setIsAddingFromLibrary] = useState(false);
  const [libraryTab, setLibraryTab] = useState<"master" | "local">("master");
  const [mounted, setMounted] = useState(false);

  // Get master library videos
  const { data: masterLibraryData } = trpc.admin.getMasterLibrary.useQuery({
    search: undefined,
    category: undefined,
  });

  const masterLibraryVideos = masterLibraryData?.items || [];
  // Get local library videos
  const { data: localLibraryVideos = [] } =
    trpc.libraryResources.getAll.useQuery();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Create routine mutation
  const createRoutine = trpc.routines.create.useMutation({
    onSuccess: () => {
      setIsSubmitting(false);
      onSuccess?.();
      handleClose();
    },
    onError: error => {
      console.error("Error creating routine:", error);
      setIsSubmitting(false);
    },
  });

  const handleClose = () => {
    setFormData({ name: "", description: "" });
    setExercises([]);
    setCurrentStep(1);
    setIsAddingFromLibrary(false);
    onClose();
  };

  const handleAddFromLibrary = (video: any) => {
    console.log("Adding video to routine:", video.title);
    console.log("Current exercises before adding:", exercises);
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
    setExercises(prev => {
      const updated = [...prev, newExercise];
      console.log("Updated exercises:", updated);
      return updated;
    });
    setIsAddingFromLibrary(false);
    console.log("Video added successfully");
  };

  const removeExercise = (id: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== id));
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return formData.name.trim() !== "";
    }
    if (currentStep === 2) {
      return exercises.length > 0;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;

    setIsSubmitting(true);

    try {
      await createRoutine.mutateAsync({
        name: formData.name,
        description: formData.description,
        exercises: exercises.map(ex => ({
          title: ex.title,
          type: ex.type,
          notes: ex.notes,
          sets: ex.sets,
          reps: ex.reps,
          duration: ex.duration,
          videoUrl: ex.videoUrl,
          videoId: ex.videoId,
          videoTitle: ex.videoTitle,
          videoThumbnail: ex.videoThumbnail,
        })),
      });
    } catch (error) {
      console.error("Error creating routine:", error);
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (canProceed() && currentStep < 3) {
      setCurrentStep(prev => (prev + 1) as 1 | 2 | 3);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => (prev - 1) as 1 | 2 | 3);
    }
  };

  return (
    <>
      {/* Add from Library Dialog */}
      {isAddingFromLibrary &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[99999] bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-[#2A3133] w-full max-w-sm rounded-xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-[#606364]">
                <h3 className="text-lg font-bold text-white">
                  Add from Library
                </h3>
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
                    onClick={() => {
                      console.log("Master Library tab clicked!");
                      setLibraryTab("master");
                    }}
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
                      console.log("My Library tab clicked!");
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
          </div>,
          document.body
        )}

      <Dialog
        open={isOpen}
        onOpenChange={open => {
          if (!open) {
            handleClose();
          }
        }}
      >
        <DialogContent className="max-w-sm max-h-[90vh] bg-[#2A3133] border-[#606364] text-[#C3BCC2] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#C3BCC2]">
              Create Routine
            </DialogTitle>
            <DialogDescription className="text-[#ABA4AA]">
              Build a custom routine with exercises and videos
            </DialogDescription>
          </DialogHeader>

          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-2 py-4">
            {[1, 2, 3].map(step => (
              <div
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step
                    ? "bg-[#4A5A70] text-white"
                    : "bg-[#353A3A] text-[#ABA4AA]"
                }`}
              >
                {step}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#C3BCC2] mb-2">
                  Routine Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter routine name"
                  className="bg-[#353A3A] border-[#606364] text-[#C3BCC2] placeholder-[#ABA4AA] focus:ring-[#4A5A70]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#C3BCC2] mb-2">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={e =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe this routine..."
                  rows={3}
                  className="bg-[#353A3A] border-[#606364] text-[#C3BCC2] placeholder-[#ABA4AA] focus:ring-[#4A5A70]"
                />
              </div>
            </div>
          )}

          {/* Step 2: Add Exercises */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#C3BCC2]">
                  Exercises ({exercises.length})
                </h3>
                <Button
                  type="button"
                  onClick={() => {
                    console.log("Opening library dialog");
                    console.log("isAddingFromLibrary will be set to:", true);
                    console.log("mounted state:", mounted);
                    setIsAddingFromLibrary(true);
                  }}
                  size="sm"
                  className="bg-[#4A5A70] hover:bg-[#606364] text-white h-8 px-3"
                >
                  <Video className="h-4 w-4 mr-1" />
                  Add from Library
                </Button>
              </div>

              {exercises.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto mb-4 text-[#ABA4AA] opacity-50" />
                  <p className="text-[#ABA4AA] mb-2">No exercises added yet</p>
                  <p className="text-sm text-[#606364]">
                    Add exercises to build your routine
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {exercises.map((exercise, index) => (
                    <Card
                      key={exercise.id}
                      className="bg-[#353A3A] border-[#606364]"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#4A5A70] rounded-lg flex items-center justify-center">
                              {exercise.type === "video" ? (
                                <Play className="h-5 w-5 text-white" />
                              ) : (
                                <Target className="h-5 w-5 text-white" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-[#C3BCC2]">
                                {exercise.title}
                              </h4>
                              {exercise.notes && (
                                <p className="text-sm text-[#ABA4AA] mt-1">
                                  {exercise.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            onClick={() => removeExercise(exercise.id)}
                            variant="ghost"
                            size="sm"
                            className="text-[#ABA4AA] hover:text-red-400 hover:bg-red-400/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

              <div className="bg-[#353A3A] rounded-lg p-4 space-y-3">
                <div>
                  <h4 className="font-medium text-[#C3BCC2]">
                    {formData.name}
                  </h4>
                  {formData.description && (
                    <p className="text-sm text-[#ABA4AA] mt-1">
                      {formData.description}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-[#ABA4AA]">
                    {exercises.length} exercise
                    {exercises.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex gap-2 pt-4 border-t border-[#606364]">
            {currentStep > 1 && (
              <Button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 rounded-lg border border-[#606364] text-[#ABA4AA] hover:bg-[#4A5A70] transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
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
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Routine
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
