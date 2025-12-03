"use client";

import { useRef, useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  RotateCw,
  MessageSquare,
  User,
  Calendar,
  Clock,
  Pen,
  Highlighter,
  ArrowRight,
  Circle,
  Eraser,
  Undo,
  Redo,
  Save,
  Mic,
  Video,
  Settings,
  Trash2,
  Send,
  Users,
} from "lucide-react";
import VideoAnnotation from "./VideoAnnotation";
import AudioRecorder from "./AudioRecorder";
import ScreenRecording from "./ScreenRecording";
import ProfilePictureUploader from "./ProfilePictureUploader";
import { COLORS, getGoldenAccent, getRedAlert } from "@/lib/colors";

interface ClientVideoReviewProps {
  videoId: string;
}

export default function ClientVideoReview({ videoId }: ClientVideoReviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showScreenRecording, setShowScreenRecording] = useState(false);
  const [isScreenRecordingActive, setIsScreenRecordingActive] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  // Annotation state
  const [currentTool, setCurrentTool] = useState<
    "pen" | "highlight" | "arrow" | "circle" | "text" | "erase"
  >("pen");
  const [currentColor, setCurrentColor] = useState("#ff0000");
  const [currentWidth, setCurrentWidth] = useState(2);
  const [paths, setPaths] = useState<any[]>([]);
  const [undoStack, setUndoStack] = useState<any[][]>([]);
  const [redoStack, setRedoStack] = useState<any[][]>([]);

  // Get client video submission data
  const { data: submission, isLoading } =
    trpc.clientRouter.getClientVideoSubmissionById.useQuery({
      id: videoId,
    });

  // Get coach's clients for sending
  const { data: coachClients } = trpc.clients.list.useQuery();

  // Get saved annotations
  const { data: savedAnnotations = [], refetch: refetchAnnotations } =
    trpc.videos.getAnnotations.useQuery({
      videoId,
    });

  // Get saved screen recordings
  const { data: savedScreenRecordings = [], refetch: refetchScreenRecordings } =
    trpc.videos.getScreenRecordings.useQuery({
      videoId,
    });

  // Mutations
  const createAnnotationMutation = trpc.videos.createAnnotation.useMutation();
  const createAudioNoteMutation = trpc.videos.createAudioNote.useMutation();
  const deleteAnnotationMutation = trpc.videos.deleteAnnotation.useMutation();
  const deleteAudioNoteMutation = trpc.videos.deleteAudioNote.useMutation();
  const deleteScreenRecordingMutation =
    trpc.videos.deleteScreenRecording.useMutation();

  // Loading state for save button
  const isSaving = createAnnotationMutation.isPending;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !submission) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    // Add event listeners
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    // Set initial volume
    video.volume = volume;
    video.muted = isMuted;

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [submission, volume, isMuted]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, currentTime - 10);
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, currentTime + 10);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${Math.floor(seconds)}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const handleSaveAudio = async (audioData: any) => {
    try {
      await createAudioNoteMutation.mutateAsync({
        videoId,
        url: audioData.url,
        duration: audioData.duration,
        timestamp: audioData.timestamp,
        title: audioData.title,
      });
      // Refresh the page to show the new audio note
      window.location.reload();
    } catch (error) {
      console.error("Failed to save audio note:", error);
    }
  };

  const handleDeleteAnnotation = async (annotationId: string) => {
    if (!confirm("Are you sure you want to delete this annotation?")) return;

    try {
      await deleteAnnotationMutation.mutateAsync({ id: annotationId });
      await refetchAnnotations();
    } catch (error) {
      console.error("Failed to delete annotation:", error);
      alert("Failed to delete annotation. Please try again.");
    }
  };

  const handleDeleteScreenRecording = async (recordingId: string) => {
    if (!confirm("Are you sure you want to delete this screen recording?"))
      return;

    try {
      await deleteScreenRecordingMutation.mutateAsync({ id: recordingId });
      await refetchScreenRecordings();
    } catch (error) {
      console.error("Failed to delete screen recording:", error);
      alert("Failed to delete screen recording. Please try again.");
    }
  };

  const handleDeleteAudioNote = async (audioNoteId: string) => {
    if (!confirm("Are you sure you want to delete this audio note?")) return;

    try {
      await deleteAudioNoteMutation.mutateAsync({ id: audioNoteId });
      // Refresh the page to update the audio notes list
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete audio note:", error);
      alert("Failed to delete audio note. Please try again.");
    }
  };

  // Annotation handlers
  const handleUndo = () => {
    if (paths.length === 0) return;

    const newPaths = paths.slice(0, -1);
    setRedoStack(prev => [...prev, paths]);
    setPaths(newPaths);
    setUndoStack(prev => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const newPaths = redoStack[redoStack.length - 1];
    setPaths(newPaths);
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, paths]);
  };

  const handleSaveAnnotation = async () => {
    if (paths.length === 0) {
      alert("No annotations to save!");
      return;
    }

    try {
      console.log("Saving annotations:", paths);
      await createAnnotationMutation.mutateAsync({
        videoId,
        type: "PEN",
        data: paths,
        timestamp: videoRef.current?.currentTime || 0,
      });

      // Refetch annotations to show the newly saved one
      await refetchAnnotations();

      // Show success message and ask if user wants to clear
      const shouldClear = confirm(
        "Annotations saved successfully! Would you like to clear the canvas?"
      );

      if (shouldClear) {
        // Clear canvas after saving
        setPaths([]);
        setUndoStack([]);
        setRedoStack([]);
      }
    } catch (error) {
      console.error("Failed to save annotation:", error);
      alert("Failed to save annotations. Please try again.");
    }
  };

  const handleSendToClients = () => {
    setShowSendModal(true);
  };

  const handleSendVideo = async () => {
    if (selectedClients.length === 0) {
      alert("Please select at least one client to send the video to.");
      return;
    }

    // Here you would implement the logic to send the video with annotations
    // to the selected clients. This could involve:
    // 1. Creating a shared video record
    // 2. Sending notifications to clients
    // 3. Creating a shareable link

    alert(
      `Video will be sent to ${selectedClients.length} client(s). This feature will be implemented next.`
    );
    setShowSendModal(false);
    setSelectedClients([]);
  };

  const toggleClientSelection = (clientId: string) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: COLORS.GOLDEN_ACCENT }} />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-8" style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>
        <p style={{ color: COLORS.TEXT_SECONDARY }}>Client video submission not found</p>
        <p style={{ color: COLORS.TEXT_SECONDARY }}>Video ID: {videoId}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: COLORS.BACKGROUND_DARK }}>
      {/* Compact Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: COLORS.TEXT_PRIMARY }}>
          {submission.title}
        </h1>
        <div className="flex items-center gap-3 text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
          <span>Submitted by {submission.client.name}</span>
          <span>•</span>
          <span>{formatDate(submission.createdAt)}</span>
          {submission.drill && (
            <>
              <span>•</span>
              <span
                className="px-2 py-0.5 rounded-full border"
                style={{ 
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  color: COLORS.TEXT_PRIMARY,
                  borderColor: COLORS.BORDER_SUBTLE,
                }}
              >
                {submission.drill.title}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Main Video Section */}
          <div className="space-y-6">
            {/* Video Player */}
            <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
              <video
                ref={videoRef}
                src={submission.videoUrl}
                className="w-full h-auto"
                controls={false}
                preload="metadata"
                playsInline
              />

              {/* Video Controls Overlay */}
              <div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6"
                style={{ zIndex: 10 }}
              >
                {/* Progress Bar */}
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  onInput={handleSeek}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer slider mb-4"
                  style={{
                    background: `linear-gradient(to right, ${COLORS.GOLDEN_ACCENT} 0%, ${COLORS.GOLDEN_ACCENT} ${
                      (currentTime / (duration || 1)) * 100
                    }%, ${COLORS.BACKGROUND_CARD} ${
                      (currentTime / (duration || 1)) * 100
                    }%, ${COLORS.BACKGROUND_CARD} 100%)`,
                    zIndex: 20,
                  }}
                />

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={togglePlay}
                      className="p-3 rounded-full hover:bg-white/20 transition-all duration-200"
                      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    >
                      {isPlaying ? (
                        <Pause
                          className="w-6 h-6"
                          style={{ color: "#ffffff" }}
                        />
                      ) : (
                        <Play
                          className="w-6 h-6"
                          style={{ color: "#ffffff" }}
                        />
                      )}
                    </button>

                    <button
                      onClick={skipBackward}
                      className="p-2 rounded-full hover:bg-white/20 transition-all duration-200"
                    >
                      <RotateCcw
                        className="w-5 h-5"
                        style={{ color: "#ffffff" }}
                      />
                    </button>

                    <button
                      onClick={skipForward}
                      className="p-2 rounded-full hover:bg-white/20 transition-all duration-200"
                    >
                      <RotateCw
                        className="w-5 h-5"
                        style={{ color: "#ffffff" }}
                      />
                    </button>

                    <span
                      className="text-sm font-medium"
                      style={{ color: "#ffffff" }}
                    >
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleMute}
                        className="p-2 rounded-full hover:bg-white/20 transition-all duration-200"
                      >
                        {isMuted ? (
                          <VolumeX
                            className="w-5 h-5"
                            style={{ color: "#ffffff" }}
                          />
                        ) : (
                          <Volume2
                            className="w-5 h-5"
                            style={{ color: "#ffffff" }}
                          />
                        )}
                      </button>

                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={handleVolumeChange}
                        onInput={handleVolumeChange}
                        className="w-24 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer slider"
                      />
                    </div>

                    <button
                      onClick={toggleFullscreen}
                      className="p-2 rounded-full hover:bg-white/20 transition-all duration-200"
                    >
                      <Maximize
                        className="w-5 h-5"
                        style={{ color: "#ffffff" }}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Annotation Canvas */}
              {showAnnotations && (
                <div className="absolute inset-0">
                  <VideoAnnotation
                    videoRef={videoRef}
                    onSaveAnnotation={handleSaveAnnotation}
                    currentTool={currentTool}
                    currentColor={currentColor}
                    currentWidth={currentWidth}
                    paths={paths}
                    setPaths={setPaths}
                  />
                </div>
              )}

              {isScreenRecordingActive && (
                <div
                  className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-md z-50"
                  style={{
                    backgroundColor: "rgba(220, 38, 38, 0.9)",
                    border: "2px solid rgba(220, 38, 38, 0.8)",
                  }}
                >
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  <span className="text-sm font-bold text-white">
                    RECORDING
                  </span>
                </div>
              )}

              {/* Annotation Toolbar */}
              {showAnnotations && (
                <div
                  className="absolute top-0 left-0 right-0 flex items-center gap-3 p-4 backdrop-blur-md border-b"
                  style={{
                    backgroundColor: "rgba(21, 25, 26, 0.95)",
                    borderColor: COLORS.BORDER_SUBTLE,
                    zIndex: 40,
                  }}
                >
                  {/* Tool buttons */}
                  <button
                    onClick={() => setCurrentTool("pen")}
                    className={`p-3 rounded-xl transition-all duration-200 ${
                      currentTool === "pen"
                        ? "shadow-lg"
                        : "hover:bg-white/10"
                    }`}
                    style={{
                      backgroundColor: currentTool === "pen" ? getGoldenAccent(0.3) : "transparent",
                    }}
                    title="Pen"
                  >
                    <Pen className="w-5 h-5" style={{ color: COLORS.TEXT_PRIMARY }} />
                  </button>
                  <button
                    onClick={() => setCurrentTool("highlight")}
                    className={`p-3 rounded-xl transition-all duration-200 ${
                      currentTool === "highlight"
                        ? "shadow-lg"
                        : "hover:bg-white/10"
                    }`}
                    style={{
                      backgroundColor: currentTool === "highlight" ? getGoldenAccent(0.3) : "transparent",
                    }}
                    title="Highlight"
                  >
                    <Highlighter
                      className="w-5 h-5"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    />
                  </button>
                  <button
                    onClick={() => setCurrentTool("arrow")}
                    className={`p-3 rounded-xl transition-all duration-200 ${
                      currentTool === "arrow"
                        ? "shadow-lg"
                        : "hover:bg-white/10"
                    }`}
                    style={{
                      backgroundColor: currentTool === "arrow" ? getGoldenAccent(0.3) : "transparent",
                    }}
                    title="Arrow"
                  >
                    <ArrowRight
                      className="w-5 h-5"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    />
                  </button>
                  <button
                    onClick={() => setCurrentTool("circle")}
                    className={`p-3 rounded-xl transition-all duration-200 ${
                      currentTool === "circle"
                        ? "shadow-lg"
                        : "hover:bg-white/10"
                    }`}
                    style={{
                      backgroundColor: currentTool === "circle" ? getGoldenAccent(0.3) : "transparent",
                    }}
                    title="Circle"
                  >
                    <Circle className="w-5 h-5" style={{ color: COLORS.TEXT_PRIMARY }} />
                  </button>
                  <button
                    onClick={() => setCurrentTool("erase")}
                    className={`p-3 rounded-xl transition-all duration-200 ${
                      currentTool === "erase"
                        ? "shadow-lg"
                        : "hover:bg-white/10"
                    }`}
                    style={{
                      backgroundColor: currentTool === "erase" ? getRedAlert(0.3) : "transparent",
                    }}
                    title="Erase"
                  >
                    <Eraser className="w-5 h-5" style={{ color: COLORS.TEXT_PRIMARY }} />
                  </button>

                  <div
                    className="w-px h-8"
                    style={{ backgroundColor: COLORS.BORDER_SUBTLE }}
                  />

                  {/* Color picker */}
                  <div className="flex gap-2">
                    {[
                      "#ff0000",
                      "#00ff00",
                      "#0000ff",
                      "#ffff00",
                      "#ff00ff",
                      "#00ffff",
                      "#ffffff",
                    ].map(color => (
                      <button
                        key={color}
                        onClick={() => setCurrentColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                          currentColor === color
                            ? "shadow-lg"
                            : ""
                        }`}
                        style={{ 
                          backgroundColor: color,
                          borderColor: currentColor === color
                            ? COLORS.TEXT_PRIMARY
                            : COLORS.BORDER_SUBTLE,
                        }}
                      />
                    ))}
                  </div>

                  <div
                    className="w-px h-8"
                    style={{ backgroundColor: COLORS.BORDER_SUBTLE }}
                  />

                  {/* Width slider */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                      Width
                    </span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={currentWidth}
                      onChange={e => setCurrentWidth(Number(e.target.value))}
                      className="w-16 h-1 rounded-full appearance-none cursor-pointer slider"
                      style={{
                        backgroundColor: COLORS.BACKGROUND_CARD,
                      }}
                    />
                  </div>

                  <div
                    className="w-px h-8"
                    style={{ backgroundColor: COLORS.BORDER_SUBTLE }}
                  />

                  {/* Undo/Redo/Save */}
                  <button
                    onClick={handleUndo}
                    disabled={paths.length === 0}
                    className="p-3 rounded-xl transition-all duration-200 hover:bg-white/10 disabled:opacity-50"
                    title="Undo"
                  >
                    <Undo className="w-5 h-5" style={{ color: "#ffffff" }} />
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={redoStack.length === 0}
                    className="p-3 rounded-xl transition-all duration-200 hover:bg-white/10 disabled:opacity-50"
                    title="Redo"
                  >
                    <Redo className="w-5 h-5" style={{ color: "#ffffff" }} />
                  </button>
                  <button
                    onClick={handleSaveAnnotation}
                    disabled={paths.length === 0 || isSaving}
                    className="p-3 rounded-xl transition-all duration-200 disabled:opacity-50"
                    style={{
                      backgroundColor:
                        paths.length === 0 ? COLORS.BACKGROUND_CARD : COLORS.GREEN_PRIMARY,
                    }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled && paths.length > 0) {
                        e.currentTarget.style.backgroundColor = COLORS.GREEN_DARK;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!e.currentTarget.disabled && paths.length > 0) {
                        e.currentTarget.style.backgroundColor = COLORS.GREEN_PRIMARY;
                      }
                    }}
                    title={isSaving ? "Saving..." : "Save Annotation"}
                  >
                    {isSaving ? (
                      <div 
                        className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                        style={{ 
                          borderColor: `${COLORS.TEXT_PRIMARY}30`,
                          borderTopColor: COLORS.TEXT_PRIMARY,
                        }}
                      />
                    ) : (
                      <Save className="w-5 h-5" style={{ color: COLORS.TEXT_PRIMARY }} />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tools Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {/* Annotation Tools */}
          <div
            className="p-6 rounded-2xl border"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5" style={{ color: COLORS.GOLDEN_ACCENT }} />
                <h3
                  className="text-lg font-semibold"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Annotation Tools
                </h3>
              </div>
              <button
                onClick={() => setShowAnnotations(!showAnnotations)}
                className={`px-3 py-1 rounded-lg text-sm transition-all duration-200 border ${
                  showAnnotations
                    ? "text-white"
                    : "text-gray-300"
                }`}
                style={{
                  backgroundColor: showAnnotations 
                    ? getGoldenAccent(0.3)
                    : COLORS.BACKGROUND_CARD,
                  borderColor: showAnnotations
                    ? getGoldenAccent(0.5)
                    : COLORS.BORDER_SUBTLE,
                }}
                onMouseEnter={(e) => {
                  if (!showAnnotations) {
                    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showAnnotations) {
                    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                  }
                }}
              >
                {showAnnotations ? "Hide" : "Show"}
              </button>
            </div>
            {showAnnotations && (
              <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                Use the drawing tools to annotate directly on the video. Click
                and drag to draw.
              </p>
            )}
          </div>

          {/* Voice Notes */}
          <div
            className="p-6 rounded-2xl border"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5" style={{ color: COLORS.GREEN_PRIMARY }} />
                <h3
                  className="text-lg font-semibold"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Voice Notes
                </h3>
              </div>
              <button
                onClick={() => setShowAudioRecorder(!showAudioRecorder)}
                className={`px-3 py-1 rounded-lg text-sm transition-all duration-200 border ${
                  showAudioRecorder
                    ? "text-white"
                    : "text-gray-300"
                }`}
                style={{
                  backgroundColor: showAudioRecorder 
                    ? COLORS.GREEN_PRIMARY
                    : COLORS.BACKGROUND_CARD,
                  borderColor: showAudioRecorder
                    ? COLORS.BORDER_SUBTLE
                    : COLORS.BORDER_SUBTLE,
                }}
                onMouseEnter={(e) => {
                  if (!showAudioRecorder) {
                    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showAudioRecorder) {
                    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                  }
                }}
              >
                {showAudioRecorder ? "Hide" : "Show"}
              </button>
            </div>
            {showAudioRecorder && (
              <AudioRecorder
                onSaveAudio={handleSaveAudio}
                videoTimestamp={currentTime}
              />
            )}
          </div>

          {/* Screen Recording */}
          <div
            className="p-6 rounded-2xl border"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5" style={{ color: getGoldenAccent(0.8) }} />
                <h3
                  className="text-lg font-semibold"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Screen Recording
                </h3>
              </div>
              <button
                onClick={() => setShowScreenRecording(!showScreenRecording)}
                className={`px-3 py-1 rounded-lg text-sm transition-all duration-200 border ${
                  showScreenRecording
                    ? "text-white"
                    : "text-gray-300"
                }`}
                style={{
                  backgroundColor: showScreenRecording 
                    ? getGoldenAccent(0.3)
                    : COLORS.BACKGROUND_CARD,
                  borderColor: showScreenRecording
                    ? getGoldenAccent(0.5)
                    : COLORS.BORDER_SUBTLE,
                }}
                onMouseEnter={(e) => {
                  if (!showScreenRecording) {
                    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showScreenRecording) {
                    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                  }
                }}
              >
                {showScreenRecording ? "Hide" : "Show"}
              </button>
            </div>
            {showScreenRecording && (
              <ScreenRecording
                videoId={videoId}
                onRecordingComplete={async recording => {
                  await refetchScreenRecordings();
                  alert("Screen recording saved successfully!");
                }}
                onRecordingStateChange={isRecording => {
                  console.log("Recording state changed:", isRecording);
                  setIsScreenRecordingActive(isRecording);
                }}
              />
            )}
          </div>

          {/* Send to Clients */}
          <div
            className="p-6 rounded-2xl border"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Send className="w-5 h-5" style={{ color: getGoldenAccent(0.8) }} />
              <h3
                className="text-lg font-semibold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Send to Clients
              </h3>
            </div>
            <p className="text-sm mb-4" style={{ color: COLORS.TEXT_SECONDARY }}>
              Send this annotated video to your clients for review.
            </p>
            <button
              onClick={handleSendToClients}
              className="w-full px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 border"
              style={{ 
                backgroundColor: getGoldenAccent(0.2),
                color: COLORS.TEXT_PRIMARY,
                borderColor: getGoldenAccent(0.4),
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = getGoldenAccent(0.3);
                e.currentTarget.style.borderColor = getGoldenAccent(0.5);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = getGoldenAccent(0.2);
                e.currentTarget.style.borderColor = getGoldenAccent(0.4);
              }}
            >
              Send Video
            </button>
          </div>
        </div>

        {/* Saved Content Sections */}
        {savedScreenRecordings && savedScreenRecordings.length > 0 && (
          <div className="space-y-4 mt-8">
            <h3 className="text-xl font-semibold" style={{ color: COLORS.TEXT_PRIMARY }}>
              Screen Recordings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedScreenRecordings.map((recording: any) => (
                <div
                  key={recording.id}
                  className="p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] border"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    borderColor: COLORS.BORDER_SUBTLE,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = getGoldenAccent(0.3);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-sm font-medium"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      {recording.title}
                    </span>
                    <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                      {new Date(recording.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {recording.description && (
                    <p className="text-sm mb-3" style={{ color: COLORS.TEXT_SECONDARY }}>
                      {recording.description}
                    </p>
                  )}
                  <div
                    className="flex items-center gap-4 text-sm mb-3"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    <span>Coach: {recording.coach.name}</span>
                    <span>•</span>
                    <span>{formatDuration(recording.duration)}</span>
                    <span>•</span>
                    <span
                      className="px-2 py-1 rounded-full text-xs border"
                      style={{ 
                        backgroundColor: COLORS.BACKGROUND_CARD,
                        borderColor: COLORS.BORDER_SUBTLE,
                        color: COLORS.TEXT_PRIMARY,
                      }}
                    >
                      {recording.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(recording.videoUrl, "_blank")}
                      className="flex-1 px-3 py-2 text-xs rounded-lg transition-all duration-200 hover:scale-105 border"
                      style={{
                        backgroundColor: COLORS.BACKGROUND_CARD,
                        color: COLORS.TEXT_PRIMARY,
                        borderColor: COLORS.BORDER_SUBTLE,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                        e.currentTarget.style.borderColor = getGoldenAccent(0.3);
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                        e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                      }}
                    >
                      Watch Recording
                    </button>
                    <button
                      onClick={() => window.open(recording.audioUrl, "_blank")}
                      className="flex-1 px-3 py-2 text-xs rounded-lg transition-all duration-200 hover:scale-105 border"
                      style={{
                        backgroundColor: COLORS.BACKGROUND_CARD,
                        color: COLORS.TEXT_PRIMARY,
                        borderColor: COLORS.BORDER_SUBTLE,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                        e.currentTarget.style.borderColor = getGoldenAccent(0.3);
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                        e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                      }}
                    >
                      Audio Only
                    </button>
                    <button
                      onClick={() => handleDeleteScreenRecording(recording.id)}
                      className="px-3 py-2 text-xs rounded-lg transition-all duration-200 hover:scale-105 border"
                      style={{ 
                        backgroundColor: COLORS.RED_ALERT,
                        color: COLORS.TEXT_PRIMARY,
                        borderColor: COLORS.RED_BORDER,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.RED_DARK;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.RED_ALERT;
                      }}
                      title="Delete recording"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {savedAnnotations && savedAnnotations.length > 0 && (
          <div className="space-y-4 mt-8">
            <h3 className="text-xl font-semibold" style={{ color: COLORS.TEXT_PRIMARY }}>
              Saved Annotations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedAnnotations.map((annotation: any) => (
                <div
                  key={annotation.id}
                  className="p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] border"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    borderColor: COLORS.BORDER_SUBTLE,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = getGoldenAccent(0.3);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-sm font-medium"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      {annotation.coach.name}
                    </span>
                    <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                      {new Date(annotation.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-4 text-sm mb-3"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    <span
                      className="px-2 py-1 rounded-full text-xs border"
                      style={{ 
                        backgroundColor: COLORS.BACKGROUND_CARD,
                        borderColor: COLORS.BORDER_SUBTLE,
                        color: COLORS.TEXT_PRIMARY,
                      }}
                    >
                      {annotation.type}
                    </span>
                    <span>•</span>
                    <span>{Math.floor(annotation.timestamp)}s</span>
                    <span>•</span>
                    <span>
                      {Array.isArray(annotation.data)
                        ? annotation.data.length
                        : 0}{" "}
                      paths
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (annotation.data && Array.isArray(annotation.data)) {
                          setPaths(annotation.data);
                          alert(
                            "Annotation loaded! You can now edit or save it as a new version."
                          );
                        }
                      }}
                      className="flex-1 px-4 py-2 text-sm rounded-lg transition-all duration-200 hover:scale-105 border"
                      style={{ 
                        backgroundColor: COLORS.BACKGROUND_CARD,
                        color: COLORS.TEXT_PRIMARY,
                        borderColor: COLORS.BORDER_SUBTLE,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                        e.currentTarget.style.borderColor = getGoldenAccent(0.3);
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                        e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                      }}
                    >
                      Load Annotation
                    </button>
                    <button
                      onClick={() => handleDeleteAnnotation(annotation.id)}
                      className="px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:scale-105 border"
                      style={{ 
                        backgroundColor: COLORS.RED_ALERT,
                        color: COLORS.TEXT_PRIMARY,
                        borderColor: COLORS.RED_BORDER,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.RED_DARK;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.RED_ALERT;
                      }}
                      title="Delete annotation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Send to Clients Modal */}
        {showSendModal && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
            onClick={() => setShowSendModal(false)}
          >
            <div
              className="rounded-2xl p-6 max-w-md w-full mx-4 border"
              style={{
                backgroundColor: COLORS.BACKGROUND_DARK,
                borderColor: COLORS.BORDER_SUBTLE,
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5" style={{ color: getGoldenAccent(0.8) }} />
                <h3
                  className="text-lg font-semibold"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Send to Clients
                </h3>
              </div>
              <p className="text-sm mb-4" style={{ color: COLORS.TEXT_SECONDARY }}>
                Select which clients to send this annotated video to:
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                {coachClients?.map(client => (
                  <label
                    key={client.id}
                    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_CARD,
                      borderColor: COLORS.BORDER_SUBTLE,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                      e.currentTarget.style.borderColor = getGoldenAccent(0.3);
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                      e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedClients.includes(client.id)}
                      onChange={() => toggleClientSelection(client.id)}
                      className="w-4 h-4 rounded focus:ring-2"
                      style={{
                        accentColor: COLORS.GOLDEN_ACCENT,
                        backgroundColor: COLORS.BACKGROUND_CARD,
                        borderColor: COLORS.BORDER_SUBTLE,
                      }}
                    />
                    <ProfilePictureUploader
                      currentAvatarUrl={
                        client.user?.settings?.avatarUrl || client.avatar
                      }
                      userName={client.name}
                      onAvatarChange={() => {}}
                      size="sm"
                      readOnly={true}
                      className="flex-shrink-0"
                    />
                    <div>
                      <p className="font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                        {client.name}
                      </p>
                      <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                        {client.email}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSendModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg transition-all duration-200 border"
                  style={{ 
                    backgroundColor: COLORS.BACKGROUND_CARD,
                    color: COLORS.TEXT_PRIMARY,
                    borderColor: COLORS.BORDER_SUBTLE,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                    e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                    e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendVideo}
                  disabled={selectedClients.length === 0}
                  className="flex-1 px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 border"
                  style={{ 
                    backgroundColor: selectedClients.length === 0
                      ? COLORS.BACKGROUND_CARD
                      : getGoldenAccent(0.2),
                    color: COLORS.TEXT_PRIMARY,
                    borderColor: selectedClients.length === 0
                      ? COLORS.BORDER_SUBTLE
                      : getGoldenAccent(0.4),
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled && selectedClients.length > 0) {
                      e.currentTarget.style.backgroundColor = getGoldenAccent(0.3);
                      e.currentTarget.style.borderColor = getGoldenAccent(0.5);
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled && selectedClients.length > 0) {
                      e.currentTarget.style.backgroundColor = getGoldenAccent(0.2);
                      e.currentTarget.style.borderColor = getGoldenAccent(0.4);
                    }
                  }}
                >
                  Send ({selectedClients.length})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
