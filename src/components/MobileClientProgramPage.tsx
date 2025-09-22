"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { trpc } from "@/app/_trpc/client";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  Play,
  MessageSquare,
  Upload,
  CalendarDays,
  Video,
  CheckCircle2,
  Search,
  X,
  Loader2,
  BookOpen,
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from "date-fns";
import { cn } from "@/lib/utils";
import ClientVideoSubmissionModal from "./ClientVideoSubmissionModal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ClientSidebar from "./ClientSidebar";

/* -------- Types (adjust to your server shapes if needed) -------- */
type Drill = {
  id: string;
  title: string;
  description?: string;
  duration?: string;
  completed?: boolean;
  isYoutube?: boolean;
  youtubeId?: string;
  videoUrl?: string;
};

type DayEntry = {
  id: string;
  date: string; // "yyyy-MM-dd"
  isRestDay: boolean;
  drills: Drill[];
};

type CalendarData = Record<string, DayEntry>;

type Program = {
  title: string;
  weeks: Array<{ days: Array<unknown> }>;
};

type VideoAssignment = {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  isCompleted?: boolean;
};

type ViewMode = "week" | "month";

export default function MobileClientProgramPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDay, setSelectedDay] = useState<DayEntry | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "completed" | "pending"
  >("all");

  const utils = trpc.useUtils();

  // Fetch program data
  const { data: program, isLoading: programLoading } =
    trpc.clientRouter.getAssignedProgram.useQuery();

  // Fetch video assignments
  const { data: videoAssignments = [], isLoading: videosLoading } =
    trpc.clientRouter.getVideoAssignments.useQuery();

  // Fetch calendar data
  const {
    data: calendarData,
    error: calendarError,
    isLoading: calendarLoading,
  } = trpc.clientRouter.getProgramCalendar.useQuery<CalendarData>({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1,
    viewMode,
  });

  // Drill completion mutation (invalidate instead of full reload)
  const markDrillCompleteMutation =
    trpc.clientRouter.markDrillComplete.useMutation({
      onSuccess: async () => {
        await utils.clientRouter.getProgramCalendar.invalidate();
        // keep selection after update
        if (selectedDay?.date) {
          const updated = await utils.clientRouter.getProgramCalendar.fetch({
            year: currentDate.getFullYear(),
            month: currentDate.getMonth() + 1,
            viewMode,
          });
          if (updated && selectedDay.date in updated) {
            setSelectedDay(updated[selectedDay.date]);
          }
        }
      },
    });

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(prev =>
      direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const filteredVideos = useMemo(() => {
    return (videoAssignments as any[]).filter(v => {
      const matchesSearch = v.video?.title
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesFilter =
        filterStatus === "all" ||
        (filterStatus === "completed" && v.completed) ||
        (filterStatus === "pending" && !v.completed);
      return matchesSearch && matchesFilter;
    });
  }, [videoAssignments, searchTerm, filterStatus]);

  const visibleDays = useMemo(() => {
    if (!currentDate) return [];
    if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate, viewMode]);

  const handleMarkDrillComplete = async (
    drillId: string,
    completed: boolean
  ) => {
    try {
      await markDrillCompleteMutation.mutateAsync({ drillId, completed });
    } catch (error) {
      console.error("❌ Failed to update drill completion:", error);
    }
  };

  const handleOpenVideo = (drill: Drill) => {
    setVideoError(null);
    if (drill.isYoutube && drill.youtubeId) {
      setSelectedVideo({
        id: `youtube-${drill.youtubeId}`,
        isYoutube: true,
        youtubeId: drill.youtubeId,
        title: drill.title || "Training Video",
        url: `https://www.youtube.com/watch?v=${drill.youtubeId}`,
        type: "video",
      });
      setIsVideoPlayerOpen(true);
      return;
    }
    if (drill.videoUrl) {
      setSelectedVideo({
        id: `video-${drill.id}`,
        url: drill.videoUrl,
        type: "video",
        title: drill.title || "Training Video",
        isYoutube: false,
      });
      setIsVideoPlayerOpen(true);
      return;
    }
    setVideoError("No video available for this drill");
  };

  const handleCloseVideo = () => {
    setIsVideoPlayerOpen(false);
    setSelectedVideo(null);
    setVideoError(null);
  };

  if (programLoading) {
    return (
      <ClientSidebar>
        <div className="min-h-screen flex items-center justify-center bg-[#2A3133]">
          <div className="flex items-center space-x-3 text-[#C3BCC2]">
            <Loader2 className="h-8 w-8 animate-spin text-[#4A5A70]" />
            <span className="text-lg">Loading your program...</span>
          </div>
        </div>
      </ClientSidebar>
    );
  }

  if (!program) {
    return (
      <ClientSidebar>
        <div className="min-h-screen flex items-center justify-center bg-[#2A3133]">
          <div className="text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-[#606364]" />
            <h2 className="text-xl font-semibold mb-3 text-[#C3BCC2]">
              No Program Assigned
            </h2>
            <p className="text-lg text-[#ABA4AA]">
              Your coach hasn't assigned a training program yet.
            </p>
          </div>
        </div>
      </ClientSidebar>
    );
  }

  const totalWeeks = program.weeks?.length ?? 0;
  const totalDays =
    program.weeks?.reduce((acc, w) => acc + (w.days?.length ?? 0), 0) ?? 0;

  return (
    <ClientSidebar>
      <div className="min-h-screen bg-[#2A3133]">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#4A5A70]">
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
                aria-label="Open video submission"
                className="p-2 rounded-lg bg-[#4A5A70]"
                onClick={() => setShowVideoModal(true)}
              >
                <Upload className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <div className="flex-shrink-0 w-24 rounded-lg border p-2 bg-[#353A3A] border-[#606364]">
              <div className="text-center">
                <div className="text-lg font-bold text-white">{totalWeeks}</div>
                <div className="text-xs text-gray-400">Weeks</div>
              </div>
            </div>
            <div className="flex-shrink-0 w-24 rounded-lg border p-2 bg-[#353A3A] border-[#606364]">
              <div className="text-center">
                <div className="text-lg font-bold text-white">{totalDays}</div>
                <div className="text-xs text-gray-400">Days</div>
              </div>
            </div>
            <div className="flex-shrink-0 w-24 rounded-lg border p-2 bg-[#353A3A] border-[#606364]">
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {/* Placeholder: if you return an aggregate completion from API, swap here */}
                  —
                </div>
                <div className="text-xs text-gray-400">Completed</div>
              </div>
            </div>
            <div className="flex-shrink-0 w-24 rounded-lg border p-2 bg-[#353A3A] border-[#606364]">
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {videoAssignments.length}
                </div>
                <div className="text-xs text-gray-400">Videos</div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigateMonth("prev")}
              variant="ghost"
              size="sm"
              className="p-2 rounded-xl hover:bg-white/10 transition-all"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4 text-white" />
            </Button>
            <h2 className="text-lg font-bold text-white text-center">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <Button
              onClick={() => navigateMonth("next")}
              variant="ghost"
              size="sm"
              className="p-2 rounded-xl hover:bg-white/10 transition-all"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4 text-white" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setViewMode("week")}
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              className={cn(
                "px-3 py-2 rounded-xl font-medium text-xs",
                viewMode === "week"
                  ? "bg-blue-500 text-white"
                  : "text-[#ABA4AA]"
              )}
            >
              <CalendarDays className="h-3 w-3 mr-1" />
              Week
            </Button>
            <Button
              onClick={() => setViewMode("month")}
              variant={viewMode === "month" ? "default" : "ghost"}
              size="sm"
              className={cn(
                "px-3 py-2 rounded-xl font-medium text-xs",
                viewMode === "month"
                  ? "bg-blue-500 text-white"
                  : "text-[#ABA4AA]"
              )}
            >
              <CalendarIcon className="h-3 w-3 mr-1" />
              Month
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div
          className={cn(
            "grid gap-1 mb-4",
            viewMode === "week" ? "grid-cols-7" : "grid-cols-7"
          )}
        >
          {/* Day headers */}
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
            <div
              key={day}
              className="p-2 text-center text-xs font-bold text-[#ABA4AA]"
            >
              {day}
            </div>
          ))}

          {/* Days */}
          {calendarLoading && (
            <div className="col-span-7 flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-[#4A5A70]" />
            </div>
          )}

          {!calendarLoading && calendarError && (
            <div className="col-span-7 text-center text-sm text-red-300">
              Couldn’t load calendar. Please try again.
            </div>
          )}

          {!calendarLoading &&
            calendarData &&
            visibleDays.map(date => {
              const key = format(date, "yyyy-MM-dd");
              const dayData = (calendarData as CalendarData)[key];
              const inMonth = isSameMonth(date, currentDate);
              const today = isToday(date);

              return (
                <div
                  key={key}
                  className={cn(
                    "min-h-[60px] p-1 rounded-lg transition-all border cursor-pointer hover:scale-[1.02]",
                    inMonth
                      ? "bg-white/5 backdrop-blur-sm border-white/10 hover:border-white/20 hover:bg-white/10"
                      : "bg-white/5 border-white/5 opacity-60",
                    today &&
                      "ring-2 ring-blue-500/30 border-blue-400/50 bg-blue-500/10"
                  )}
                  onClick={() => {
                    if (
                      dayData &&
                      (dayData.drills.length > 0 || dayData.isRestDay)
                    ) {
                      setSelectedDay(dayData);
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        inMonth ? "text-white" : "text-gray-400",
                        today && "font-bold text-blue-400"
                      )}
                    >
                      {format(date, "d")}
                    </span>
                  </div>

                  {/* Drills preview */}
                  {dayData && dayData.drills.length > 0 && (
                    <div className="space-y-1">
                      {dayData.drills.slice(0, 2).map((drill, idx) => (
                        <div
                          key={drill.id ?? idx}
                          className={cn(
                            "text-xs p-1 rounded border",
                            drill.completed
                              ? "bg-green-600/10 border-green-500/40"
                              : "bg-slate-700/40 border-slate-600"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-white text-[11px] truncate">
                              {drill.title}
                            </span>
                            {drill.completed && (
                              <Check className="h-3 w-3 text-green-400" />
                            )}
                          </div>
                        </div>
                      ))}
                      {dayData.drills.length > 2 && (
                        <div className="text-[11px] text-gray-400 text-center">
                          +{dayData.drills.length - 2} more
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rest day */}
                  {dayData && dayData.isRestDay && (
                    <div className="text-xs text-gray-400 text-center">
                      Rest
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Selected Day Details */}
        {selectedDay && (
          <div className="rounded-xl p-4 mb-4 shadow-lg border bg-[#2B3038] border-[#606364]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-[#C3BCC2]">
                {selectedDay.isRestDay ? "Rest Day" : "Today's Workouts"}
              </h2>
              <button
                onClick={() => setShowNotesModal(true)}
                className="p-1 rounded bg-[#4A5A70]"
                aria-label="Add notes"
              >
                <MessageSquare className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="text-sm mb-3 text-[#ABA4AA]">
              {selectedDay.isRestDay
                ? "Take a break and recover"
                : `${selectedDay.drills.length} workout${
                    selectedDay.drills.length !== 1 ? "s" : ""
                  } scheduled`}
            </div>

            {!selectedDay.isRestDay && (
              <div className="space-y-3">
                {selectedDay.drills.map((drill, index) => (
                  <div
                    key={drill.id}
                    className="p-3 rounded-lg border bg-[#353A3A] border-[#606364]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#4A5A70]">
                          <span className="text-xs font-bold text-[#C3BCC2]">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-[#C3BCC2]">
                            {drill.title}
                          </h4>
                          {drill.description && (
                            <p className="text-xs text-[#ABA4AA]">
                              {drill.description}
                            </p>
                          )}
                          {drill.duration && (
                            <div className="flex items-center gap-1 mt-1 text-[#ABA4AA]">
                              <Clock className="h-3 w-3" />
                              <span className="text-xs">{drill.duration}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleMarkDrillComplete(drill.id, !drill.completed)
                          }
                          className={cn(
                            "p-2 rounded-lg transition-all hover:scale-110",
                            drill.completed
                              ? "bg-green-500 text-white shadow-lg shadow-green-500/25"
                              : "bg-gray-600 text-gray-100 hover:bg-gray-500"
                          )}
                          aria-label={
                            drill.completed
                              ? "Mark incomplete"
                              : "Mark complete"
                          }
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenVideo(drill)}
                          className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all hover:scale-110"
                          aria-label="Open video"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#ABA4AA]" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-lg text-sm bg-[#353A3A] text-[#C3BCC2] border border-[#606364] outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e =>
              setFilterStatus(e.target.value as typeof filterStatus)
            }
            className="px-3 py-2 rounded-lg text-sm bg-[#353A3A] text-[#C3BCC2] border border-[#606364] outline-none"
          >
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Video Assignments */}
        {videosLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-[#4A5A70]" />
          </div>
        ) : filteredVideos.length > 0 ? (
          <div className="space-y-3">
            {filteredVideos.map(video => (
              <div
                key={video.id}
                className="rounded-lg overflow-hidden transition-all hover:scale-[1.02] shadow-lg border bg-[#2B3038] border-[#606364]"
              >
                <div className="aspect-video relative bg-[#606364]">
                  {video.video?.url ? (
                    <Image
                      src={video.video.url}
                      alt={`Video thumbnail: ${video.video.title}`}
                      width={1024}
                      height={576}
                      className="w-full h-full object-cover"
                      priority={false}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="w-8 h-8 text-[#ABA4AA]" />
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setSelectedVideo({
                        id: video.id,
                        title: video.video?.title,
                        type: "video",
                        url: video.video?.url,
                      });
                      setShowVideoModal(true);
                    }}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                    aria-label="Open video"
                  >
                    <Play className="w-12 h-12 text-white" />
                  </button>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-[#C3BCC2]">
                      {video.video?.title}
                    </h3>
                    {video.completed && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  {video.video?.description && (
                    <p className="text-xs mb-3 text-[#ABA4AA]">
                      {video.video.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        "px-2 py-1 rounded text-xs font-medium text-white",
                        video.completed ? "bg-emerald-500" : "bg-[#4A5A70]"
                      )}
                    >
                      {video.completed ? "Completed" : "Assigned"}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedVideo({
                          id: video.id,
                          title: video.video?.title,
                          type: "video",
                          url: video.video?.url,
                        });
                        setShowVideoModal(true);
                      }}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-[#4A5A70] text-[#C3BCC2]"
                      aria-label="Watch video"
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
            <Video className="w-8 h-8 mx-auto mb-3 text-[#606364]" />
            <h3 className="text-base font-semibold mb-2 text-[#C3BCC2]">
              No video assignments
            </h3>
            <p className="text-sm text-[#ABA4AA]">
              Your coach will assign training videos soon
            </p>
          </div>
        )}

        {/* Notes Modal */}
        {showNotesModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-[#353A3A] border border-[#606364]">
              <div className="p-4 border-b border-[#606364]">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#C3BCC2]">
                    Add Notes
                  </h3>
                  <button
                    onClick={() => setShowNotesModal(false)}
                    className="p-2 rounded-lg text-[#ABA4AA] hover:bg-gray-700 transition-colors"
                    aria-label="Close notes"
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
                  className="w-full mb-4 bg-[#2A3133] text-[#C3BCC2] border border-[#606364]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowNotesModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[#606364] text-[#C3BCC2]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // TODO: wire to submit notes API
                      setShowNotesModal(false);
                      setNotes("");
                    }}
                    disabled={!notes.trim()}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[#4A5A70] text-[#C3BCC2] disabled:opacity-50"
                  >
                    Save Notes
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
            drillId={selectedVideo?.id}
            drillTitle={selectedVideo?.title}
          />
        )}

        {/* Video Player Modal */}
        {isVideoPlayerOpen && selectedVideo && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-600 w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  {selectedVideo.title}
                </h3>
                <button
                  onClick={handleCloseVideo}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                  aria-label="Close player"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4">
                {videoError && (
                  <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-300 text-sm">{videoError}</p>
                  </div>
                )}

                <div className="aspect-video bg-black rounded-xl overflow-hidden">
                  {selectedVideo.isYoutube && selectedVideo.youtubeId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=0&rel=0&modestbranding=1&showinfo=0`}
                      title={selectedVideo.title || "Training Video"}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="w-full h-full"
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  ) : selectedVideo.url ? (
                    <video
                      controls
                      controlsList="nodownload"
                      disablePictureInPicture
                      className="w-full h-full object-contain bg-black"
                      onContextMenu={e => e.preventDefault()}
                    >
                      <source src={selectedVideo.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <Play className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No video available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientSidebar>
  );
}
