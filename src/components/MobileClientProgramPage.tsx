"use client";

import { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  Play,
  MessageSquare,
  Upload,
  Calendar as CalendarIcon,
  CalendarDays,
  Target,
  User,
  Send,
  X,
  Video,
  TrendingUp,
  BarChart3,
  Loader2,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Dumbbell,
  Zap,
  Star,
  CheckCircle2,
  Award,
  CalendarCheck,
  CalendarX,
  CalendarClock,
  Link,
  Plus,
  Filter,
  Search,
} from "lucide-react";
import ClientVideoSubmissionModal from "./ClientVideoSubmissionModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import ClientSidebar from "./ClientSidebar";

export default function MobileClientProgramPage() {
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Fetch program data
  const { data: program, isLoading: programLoading } =
    trpc.clientRouter.getClientProgram.useQuery();

  // Fetch video assignments
  const { data: videoAssignments = [], isLoading: videosLoading } =
    trpc.clientRouter.getVideoAssignments.useQuery();

  // Fetch workout completion status
  const { data: workoutStatus = {}, refetch: refetchWorkoutStatus } =
    trpc.clientRouter.getWorkoutCompletionStatus.useQuery();

  // Mutations
  const markWorkoutCompleteMutation =
    trpc.clientRouter.markWorkoutComplete.useMutation({
      onSuccess: () => {
        refetchWorkoutStatus();
      },
    });

  const submitNotesMutation = trpc.clientRouter.submitWorkoutNotes.useMutation({
    onSuccess: () => {
      setShowNotesModal(false);
      setNotes("");
    },
  });

  const submitVideoMutation =
    trpc.clientRouter.submitVideoForReview.useMutation({
      onSuccess: () => {
        setShowVideoModal(false);
        setSelectedVideo(null);
      },
    });

  if (programLoading) {
    return (
      <ClientSidebar>
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "#2A3133" }}
        >
          <div
            className="flex items-center space-x-3"
            style={{ color: "#C3BCC2" }}
          >
            <Loader2
              className="h-8 w-8 animate-spin"
              style={{ color: "#4A5A70" }}
            />
            <span className="text-lg">Loading your program...</span>
          </div>
        </div>
      </ClientSidebar>
    );
  }

  if (!program) {
    return (
      <ClientSidebar>
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "#2A3133" }}
        >
          <div className="text-center">
            <BookOpen
              className="w-16 h-16 mx-auto mb-4"
              style={{ color: "#606364" }}
            />
            <h2
              className="text-xl font-semibold mb-3"
              style={{ color: "#C3BCC2" }}
            >
              No Program Assigned
            </h2>
            <p className="text-lg" style={{ color: "#ABA4AA" }}>
              Your coach hasn't assigned a training program yet.
            </p>
          </div>
        </div>
      </ClientSidebar>
    );
  }

  const currentWeek = program.weeks[selectedWeek];
  const currentDay = currentWeek?.days[selectedDay];

  const filteredVideos = videoAssignments.filter((video: any) => {
    const matchesSearch = video.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "completed" && video.isCompleted) ||
      (filterStatus === "pending" && !video.isCompleted);
    return matchesSearch && matchesFilter;
  });

  const handleMarkComplete = (workoutId: string) => {
    markWorkoutCompleteMutation.mutate({ workoutId });
  };

  const handleSubmitNotes = () => {
    if (currentDay && notes.trim()) {
      submitNotesMutation.mutate({
        dayId: currentDay.id,
        notes: notes.trim(),
      });
    }
  };

  const handleVideoSelect = (video: any) => {
    setSelectedVideo(video);
    setShowVideoModal(true);
  };

  return (
    <ClientSidebar>
      <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
        {/* Mobile Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  Training Program
                </h1>
                <p className="text-xs text-gray-400">{program.title}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="p-2 rounded-lg"
                style={{ backgroundColor: "#4A5A70" }}
                onClick={() => setShowVideoModal(true)}
              >
                <Upload className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Program Overview Stats */}
        <div className="mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <div
              className="flex-shrink-0 w-24 rounded-lg border p-2"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {program.weeks.length}
                </div>
                <div className="text-xs text-gray-400">Weeks</div>
              </div>
            </div>
            <div
              className="flex-shrink-0 w-24 rounded-lg border p-2"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {program.weeks.reduce(
                    (acc, week) => acc + week.days.length,
                    0
                  )}
                </div>
                <div className="text-xs text-gray-400">Days</div>
              </div>
            </div>
            <div
              className="flex-shrink-0 w-24 rounded-lg border p-2"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {Object.values(workoutStatus).filter(Boolean).length}
                </div>
                <div className="text-xs text-gray-400">Completed</div>
              </div>
            </div>
            <div
              className="flex-shrink-0 w-24 rounded-lg border p-2"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {videoAssignments.length}
                </div>
                <div className="text-xs text-gray-400">Videos</div>
              </div>
            </div>
          </div>
        </div>

        {/* Week Navigation */}
        <div
          className="rounded-xl p-4 mb-4 shadow-lg border"
          style={{ backgroundColor: "#2B3038", borderColor: "#606364" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold" style={{ color: "#C3BCC2" }}>
              Week {selectedWeek + 1}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedWeek(Math.max(0, selectedWeek - 1))}
                disabled={selectedWeek === 0}
                className="p-1 rounded disabled:opacity-50"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() =>
                  setSelectedWeek(
                    Math.min(program.weeks.length - 1, selectedWeek + 1)
                  )
                }
                disabled={selectedWeek === program.weeks.length - 1}
                className="p-1 rounded disabled:opacity-50"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          <div className="text-sm mb-3" style={{ color: "#ABA4AA" }}>
            {currentWeek?.title || `Week ${selectedWeek + 1}`}
          </div>

          {/* Day Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {currentWeek?.days.map((day, index) => (
              <button
                key={day.id}
                onClick={() => setSelectedDay(index)}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedDay === index
                    ? "bg-blue-500 text-white"
                    : "bg-gray-600 text-gray-300"
                }`}
              >
                Day {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Current Day Workouts */}
        {currentDay && (
          <div
            className="rounded-xl p-4 mb-4 shadow-lg border"
            style={{ backgroundColor: "#2B3038", borderColor: "#606364" }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold" style={{ color: "#C3BCC2" }}>
                Day {selectedDay + 1} Workouts
              </h2>
              <button
                onClick={() => setShowNotesModal(true)}
                className="p-1 rounded"
                style={{ backgroundColor: "#4A5A70" }}
              >
                <MessageSquare className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="text-sm mb-3" style={{ color: "#ABA4AA" }}>
              {currentDay.title || `Day ${selectedDay + 1}`}
            </div>

            <div className="space-y-3">
              {currentDay.drills.map((drill, index) => (
                <div
                  key={drill.id}
                  className="p-3 rounded-lg border"
                  style={{
                    backgroundColor: "#353A3A",
                    borderColor: "#606364",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "#4A5A70" }}
                      >
                        <span
                          className="text-xs font-bold"
                          style={{ color: "#C3BCC2" }}
                        >
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <h4
                          className="font-medium text-sm"
                          style={{ color: "#C3BCC2" }}
                        >
                          {drill.title}
                        </h4>
                        <p className="text-xs" style={{ color: "#ABA4AA" }}>
                          {drill.description}
                        </p>
                        {drill.duration && (
                          <div className="flex items-center gap-1 mt-1">
                            <Clock
                              className="h-3 w-3"
                              style={{ color: "#ABA4AA" }}
                            />
                            <span
                              className="text-xs"
                              style={{ color: "#ABA4AA" }}
                            >
                              {drill.duration}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleMarkComplete(drill.id)}
                      disabled={workoutStatus[drill.id]}
                      className={`p-2 rounded-lg transition-all ${
                        workoutStatus[drill.id]
                          ? "bg-green-500 text-white"
                          : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      }`}
                    >
                      {workoutStatus[drill.id] ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Assignments */}
        <div
          className="rounded-xl p-4 mb-4 shadow-lg border"
          style={{ backgroundColor: "#2B3038", borderColor: "#606364" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold" style={{ color: "#C3BCC2" }}>
              Video Assignments
            </h2>
            <button
              onClick={() => setShowVideoModal(true)}
              className="p-1 rounded"
              style={{ backgroundColor: "#4A5A70" }}
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4"
                style={{ color: "#ABA4AA" }}
              />
              <input
                type="text"
                placeholder="Search videos..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: "#353A3A",
                  color: "#C3BCC2",
                  borderColor: "#606364",
                }}
              />
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: "#353A3A",
                color: "#C3BCC2",
                borderColor: "#606364",
              }}
            >
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {videosLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2
                className="h-6 w-6 animate-spin"
                style={{ color: "#4A5A70" }}
              />
            </div>
          ) : filteredVideos.length > 0 ? (
            <div className="space-y-3">
              {filteredVideos.map((video: any) => (
                <div
                  key={video.id}
                  className="rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 shadow-lg border"
                  style={{
                    backgroundColor: "#2B3038",
                    borderColor: "#606364",
                    borderWidth: "1px",
                  }}
                >
                  <div
                    className="aspect-video relative"
                    style={{ backgroundColor: "#606364" }}
                  >
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play
                          className="w-8 h-8"
                          style={{ color: "#ABA4AA" }}
                        />
                      </div>
                    )}
                    <button
                      onClick={() => handleVideoSelect(video)}
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <Play className="w-12 h-12 text-white" />
                    </button>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3
                        className="text-sm font-semibold"
                        style={{ color: "#C3BCC2" }}
                      >
                        {video.title}
                      </h3>
                      {video.isCompleted && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <p className="text-xs mb-3" style={{ color: "#ABA4AA" }}>
                      {video.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: video.isCompleted
                            ? "#10b981"
                            : "#4A5A70",
                          color: "#ffffff",
                        }}
                      >
                        {video.isCompleted ? "Completed" : "Assigned"}
                      </div>
                      <button
                        onClick={() => handleVideoSelect(video)}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                        style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
                      >
                        <Play className="w-3 h-3" />
                        Watch
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Video
                className="w-8 h-8 mx-auto mb-3"
                style={{ color: "#606364" }}
              />
              <h3
                className="text-base font-semibold mb-2"
                style={{ color: "#C3BCC2" }}
              >
                No video assignments
              </h3>
              <p className="text-sm" style={{ color: "#ABA4AA" }}>
                Your coach will assign training videos soon
              </p>
            </div>
          )}
        </div>

        {/* Notes Modal */}
        {showNotesModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div
              className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div className="p-4 border-b" style={{ borderColor: "#606364" }}>
                <div className="flex items-center justify-between">
                  <h3
                    className="text-lg font-semibold"
                    style={{ color: "#C3BCC2" }}
                  >
                    Add Notes
                  </h3>
                  <button
                    onClick={() => setShowNotesModal(false)}
                    className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                    style={{ color: "#ABA4AA" }}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add your notes about today's workout..."
                  rows={4}
                  className="w-full mb-4"
                  style={{
                    backgroundColor: "#2A3133",
                    color: "#C3BCC2",
                    borderColor: "#606364",
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowNotesModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{
                      backgroundColor: "#606364",
                      color: "#C3BCC2",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitNotes}
                    disabled={!notes.trim() || submitNotesMutation.isPending}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
                    style={{
                      backgroundColor: "#4A5A70",
                      color: "#C3BCC2",
                    }}
                  >
                    {submitNotesMutation.isPending ? "Saving..." : "Save Notes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Submission Modal */}
        {showVideoModal && (
          <ClientVideoSubmissionModal
            isOpen={showVideoModal}
            onClose={() => {
              setShowVideoModal(false);
              setSelectedVideo(null);
            }}
            selectedVideo={selectedVideo}
            onSubmit={data => {
              submitVideoMutation.mutate(data);
            }}
            isSubmitting={submitVideoMutation.isPending}
          />
        )}
      </div>
    </ClientSidebar>
  );
}
