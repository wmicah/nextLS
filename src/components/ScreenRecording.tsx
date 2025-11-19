"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { trpc } from "@/app/_trpc/client";
import { UploadButton } from "@uploadthing/react";
import {
  CircleDot,
  Square,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Save,
  X,
  AlertCircle,
  Clock,
  Play,
  Pause,
} from "lucide-react";

interface ScreenRecordingProps {
  videoId: string;
  onRecordingComplete?: (recording: any) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
}

export default function ScreenRecording({
  videoId,
  onRecordingComplete,
  onRecordingStateChange,
}: ScreenRecordingProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [finalDuration, setFinalDuration] = useState(0);
  const [videoRecorder, setVideoRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [audioRecorder, setAudioRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recording limits
  const MAX_DURATION = 300; // 5 minutes in seconds
  const WARNING_DURATION = 240; // 4 minutes warning

  // tRPC mutations
  const createScreenRecordingMutation =
    trpc.videos.createScreenRecording.useMutation();

  const startTimeRef = useRef<number>(0);
  const recordingTimeRef = useRef<number>(0);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);

      // Request screen capture
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      // Request audio capture
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      setVideoStream(screenStream);
      setAudioStream(audioStream);

      // Create MediaRecorder for screen
      const recorder = new MediaRecorder(screenStream, {
        mimeType: "video/webm;codecs=vp9",
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = event => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        setRecordedChunks(chunks);
      };

      // Create MediaRecorder for audio
      const audioRecorder = new MediaRecorder(audioStream, {
        mimeType: "audio/webm;codecs=opus",
      });

      const audioChunks: Blob[] = [];
      audioRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      audioRecorder.onstop = () => {
        setAudioChunks(audioChunks);
      };

      // Start recording
      recorder.start(1000); // Collect data every second
      audioRecorder.start(1000);

      // Store both recorders
      setVideoRecorder(recorder);
      setAudioRecorder(audioRecorder);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      recordingTimeRef.current = 0;
      startTimeRef.current = Date.now();

      console.log("Starting timer, startTime:", startTimeRef.current);

      // Notify parent component
      if (onRecordingStateChange) {
        onRecordingStateChange(true);
      }

    } catch (err) {
      console.error("Failed to start recording:", err);
      setError("Failed to start recording. Please check your permissions.");
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {

    if (videoRecorder && videoRecorder.state !== "inactive") {
      videoRecorder.stop();
    }

    if (audioRecorder && audioRecorder.state !== "inactive") {
      audioRecorder.stop();
    }

    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
    }

    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
    }

    // Timer is now handled by useEffect

    // Store the final duration before resetting
    setFinalDuration(recordingTimeRef.current);

    setIsRecording(false);
    setIsPaused(false);
    setVideoRecorder(null);
    setAudioRecorder(null);
    setAudioStream(null);
    setVideoStream(null);
    setShowSaveModal(true);

    // Notify parent component
    if (onRecordingStateChange) {
      onRecordingStateChange(false);
    }

  }, [videoRecorder, audioRecorder, audioStream, videoStream]);

  // Pause/Resume recording
  const togglePause = useCallback(() => {
    if (videoRecorder && audioRecorder) {
      if (videoRecorder.state === "recording") {
        console.log("Pausing recording");
        videoRecorder.pause();
        audioRecorder.pause();
        setIsPaused(true);
        // Timer is now handled by useEffect
      } else if (videoRecorder.state === "paused") {
        videoRecorder.resume();
        audioRecorder.resume();
        setIsPaused(false);
        startTimeRef.current = Date.now() - recordingTimeRef.current * 1000; // Adjust for paused time
      }
    }
  }, [videoRecorder, audioRecorder, stopRecording]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Save recording
  const handleSaveRecording = async () => {
    console.log("Title:", title);
    console.log("Recorded chunks:", recordedChunks.length);
    console.log("Audio chunks:", audioChunks.length);
    console.log("Final duration:", finalDuration);

    if (!title.trim()) {
      setError("Please enter a title for your recording");
      return;
    }

    if (recordedChunks.length === 0 || audioChunks.length === 0) {
      setError("No recording data available");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Create video blob
      const videoBlob = new Blob(recordedChunks, { type: "video/webm" });
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });


      // Upload video and audio files
      // Note: In a real implementation, you'd upload these to your storage service
      // For now, we'll simulate the upload process

      const videoUrl = URL.createObjectURL(videoBlob);
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log("Created URLs - Video:", videoUrl, "Audio:", audioUrl);

      // Save to database with the actual recorded duration
      const result = await createScreenRecordingMutation.mutateAsync({
        videoId,
        title: title.trim(),
        description: description.trim() || undefined,
        videoUrl,
        audioUrl,
        duration: finalDuration, // Use the final recorded duration
        maxDuration: MAX_DURATION,
      });

      console.log("Saved to database:", result);

      // Clean up
      setShowSaveModal(false);
      setTitle("");
      setDescription("");
      setRecordedChunks([]);
      setAudioChunks([]);
      setRecordingTime(0);
      setFinalDuration(0);

      // Notify parent component
      if (onRecordingComplete) {
        onRecordingComplete({
          title: title.trim(),
          duration: finalDuration,
          videoUrl,
          audioUrl,
        });
      }
    } catch (err) {
      console.error("Failed to save recording:", err);
      setError("Failed to save recording. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Timer effect - handles the recording timer
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    if (isRecording && !isPaused) {
      console.log("Starting timer effect");
      intervalId = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        console.log("Timer update:", elapsed, "seconds");
        setRecordingTime(elapsed);
        recordingTimeRef.current = elapsed;

        // Auto-stop at max duration
        if (elapsed >= MAX_DURATION) {
          stopRecording();
        }
      }, 1000);
    }

    return () => {
      if (intervalId) {
        console.log("Clearing timer effect");
        clearInterval(intervalId);
      }
    };
  }, [isRecording, isPaused, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [audioStream, videoStream]);

  // Debug effect to monitor recording state
  useEffect(() => {
  }, [isRecording, isPaused, recordingTime]);

  return (
    <div className="space-y-4">
      {/* Main Recording Controls */}
      <div className="space-y-4">
        {/* Recording Controls */}
        <div className="flex items-center gap-3">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 font-medium"
            >
              <CircleDot className="w-5 h-5" />
              Start Recording
            </button>
          ) : (
            <>
              <button
                onClick={togglePause}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-all duration-200"
              >
                {isPaused ? (
                  <Play className="w-4 h-4" />
                ) : (
                  <Pause className="w-4 h-4" />
                )}
                {isPaused ? "Resume" : "Pause"}
              </button>
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-200"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
              {/* Debug button */}
              <button
                onClick={() => {
                  setRecordingTime(prev => prev + 1);
                }}
                className="flex items-center gap-2 px-2 py-1 bg-blue-600 text-white rounded text-xs"
              >
                Test +1s
              </button>
            </>
          )}
        </div>

        {/* Recording Status - Below the buttons */}
        {isRecording && (
          <div className="flex items-center justify-between p-4 rounded-lg bg-red-900/20 border border-red-500/30">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full ${
                    recordingTime >= WARNING_DURATION
                      ? "bg-red-500"
                      : "bg-green-500"
                  } animate-pulse`}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: "#ffffff" }}
                >
                  {isPaused ? "PAUSED" : "RECORDING"}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div
                className="text-xl font-mono font-bold"
                style={{ color: "#ffffff" }}
              >
                {formatTime(recordingTime)}
              </div>
              <div className="text-xs" style={{ color: "#9ca3af" }}>
                {formatTime(MAX_DURATION)} max
              </div>
            </div>
          </div>
        )}

        {/* Duration Limit Warning */}
        {recordingTime >= WARNING_DURATION && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-900/20 border border-yellow-500/30">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-yellow-400 font-medium">
              {formatTime(MAX_DURATION - recordingTime)} remaining
            </span>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 rounded-xl" style={{ backgroundColor: "#2a2a2a" }}>
        <h3 className="text-lg font-semibold mb-3" style={{ color: "#ffffff" }}>
          Screen Recording Instructions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
              <span className="text-sm" style={{ color: "#9ca3af" }}>
                Click "Start Recording" to begin capturing your screen and audio
              </span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
              <span className="text-sm" style={{ color: "#9ca3af" }}>
                Select the screen/window you want to record when prompted
              </span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
              <span className="text-sm" style={{ color: "#9ca3af" }}>
                Allow microphone access for audio recording
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
              <span className="text-sm" style={{ color: "#9ca3af" }}>
                Use annotation tools while recording to explain feedback
              </span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
              <span className="text-sm" style={{ color: "#9ca3af" }}>
                Maximum recording duration: {formatTime(MAX_DURATION)}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
              <span className="text-sm" style={{ color: "#9ca3af" }}>
                You can pause and resume the recording as needed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/30">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3
              className="text-xl font-semibold mb-4"
              style={{ color: "#ffffff" }}
            >
              Save Screen Recording
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#9ca3af" }}
                >
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Enter recording title..."
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: "#374151",
                    borderColor: "#606364",
                    color: "#ffffff",
                    border: "1px solid",
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#9ca3af" }}
                >
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                  style={{
                    backgroundColor: "#374151",
                    borderColor: "#606364",
                    color: "#ffffff",
                    border: "1px solid",
                  }}
                />
              </div>

              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: "#9ca3af" }}
              >
                <Clock className="w-4 h-4" />
                <span>Duration: {formatTime(finalDuration)}</span>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg transition-colors"
                  style={{ backgroundColor: "#374151", color: "#ffffff" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRecording}
                  disabled={isSaving || !title.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Recording
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
