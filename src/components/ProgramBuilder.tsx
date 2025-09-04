"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  Moon,
  MoreHorizontal,
  Edit,
  Play,
  Target,
  Save,
  Expand,
  Minimize,
  Video,
  Search,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/app/_trpc/client";

// Types
type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

interface ProgramItem {
  id: string;
  title: string;
  type?: "exercise" | "drill" | "video";
  notes?: string;
  sets?: number;
  reps?: number;
  tempo?: string;
  duration?: string;
  videoUrl?: string;
  videoId?: string;
  videoTitle?: string;
  videoThumbnail?: string;
}

interface Week {
  id: string;
  name: string; // "Week 1", "Week 2", etc.
  days: Record<DayKey, ProgramItem[]>;
  collapsed?: boolean;
}

interface ProgramBuilderProps {
  onSave?: (weeks: Week[]) => void;
  initialWeeks?: Week[];
  programDetails?: {
    title: string;
    description?: string;
    level: string;
    duration: number;
  };
}

const DAY_LABELS: Record<DayKey, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

const DAY_KEYS: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export default function ProgramBuilder({
  onSave,
  initialWeeks,
  programDetails,
}: ProgramBuilderProps) {
  const [weeks, setWeeks] = useState<Week[]>(() => {
    if (initialWeeks && initialWeeks.length > 0) {
      return initialWeeks;
    }

    // Initialize with one week, all days = Rest Day
    return [
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
  });

  const [isVideoLibraryOpen, setIsVideoLibraryOpen] = useState(false);
  const [isVideoDetailsDialogOpen, setIsVideoDetailsDialogOpen] =
    useState(false);
  const [selectedWeekId, setSelectedWeekId] = useState<string>("");
  const [selectedDayKey, setSelectedDayKey] = useState<DayKey>("sun");
  const [editingItem, setEditingItem] = useState<ProgramItem | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{
    id: string;
    title: string;
    description?: string;
    duration?: string;
    url?: string;
    thumbnail?: string;
  } | null>(null);

  // Handlers
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
    setWeeks(prev => [...prev, newWeek]);
  }, [weeks.length]);

  const deleteWeek = useCallback(
    (weekId: string) => {
      if (weeks.length === 1) return; // Don't delete the last week
      setWeeks(prev => prev.filter(week => week.id !== weekId));
    },
    [weeks.length]
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
        days: JSON.parse(JSON.stringify(weekToDuplicate.days)), // Deep copy
      };
      setWeeks(prev => [...prev, newWeek]);
    },
    [weeks]
  );

  const toggleCollapse = useCallback((weekId: string) => {
    setWeeks(prev =>
      prev.map(week =>
        week.id === weekId ? { ...week, collapsed: !week.collapsed } : week
      )
    );
  }, []);

  const toggleCollapseAll = useCallback(() => {
    const allCollapsed = weeks.every(week => week.collapsed);
    setWeeks(prev => prev.map(week => ({ ...week, collapsed: !allCollapsed })));
  }, [weeks]);

  const addItem = useCallback(
    (weekId: string, dayKey: DayKey, item: Omit<ProgramItem, "id">) => {
      const newItem: ProgramItem = {
        ...item,
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };

      setWeeks(prev =>
        prev.map(week => {
          if (week.id === weekId) {
            return {
              ...week,
              days: {
                ...week.days,
                [dayKey]: [...week.days[dayKey], newItem],
              },
            };
          }
          return week;
        })
      );
    },
    []
  );

  const editItem = useCallback(
    (
      weekId: string,
      dayKey: DayKey,
      itemId: string,
      partial: Partial<ProgramItem>
    ) => {
      setWeeks(prev =>
        prev.map(week => {
          if (week.id === weekId) {
            return {
              ...week,
              days: {
                ...week.days,
                [dayKey]: week.days[dayKey].map(item =>
                  item.id === itemId ? { ...item, ...partial } : item
                ),
              },
            };
          }
          return week;
        })
      );
    },
    []
  );

  const deleteItem = useCallback(
    (weekId: string, dayKey: DayKey, itemId: string) => {
      setWeeks(prev =>
        prev.map(week => {
          if (week.id === weekId) {
            return {
              ...week,
              days: {
                ...week.days,
                [dayKey]: week.days[dayKey].filter(item => item.id !== itemId),
              },
            };
          }
          return week;
        })
      );
    },
    []
  );

  const handleSave = useCallback(() => {
    console.log("Saving program:", weeks);
    // TODO: API call to save program
    onSave?.(weeks);
  }, [weeks, onSave]);

  const openEditItemDialog = useCallback(
    (weekId: string, dayKey: DayKey, item: ProgramItem) => {
      setSelectedWeekId(weekId);
      setSelectedDayKey(dayKey);
      setEditingItem(item);

      if (item.type === "video") {
        setIsVideoLibraryOpen(true);
      }
    },
    []
  );

  const openAddFromLibrary = useCallback((weekId: string, dayKey: DayKey) => {
    setSelectedWeekId(weekId);
    setSelectedDayKey(dayKey);
    setEditingItem(null);
    setIsVideoLibraryOpen(true);
  }, []);

  const handleVideoSelect = useCallback(
    (video: {
      id: string;
      title: string;
      description?: string;
      duration?: string;
      url?: string;
      thumbnail?: string;
    }) => {
      setSelectedVideo(video);
      setIsVideoLibraryOpen(false);
      setIsVideoDetailsDialogOpen(true);
    },
    []
  );

  const handleVideoDetailsSubmit = useCallback(
    (details: {
      notes?: string;
      sets?: number;
      reps?: number;
      tempo?: string;
    }) => {
      if (!selectedVideo) return;

      const videoItem: Omit<ProgramItem, "id"> = {
        title: selectedVideo.title,
        type: "video",
        notes: details.notes || "",
        duration: selectedVideo.duration || "",
        videoUrl: selectedVideo.url || "",
        videoId: selectedVideo.id,
        videoTitle: selectedVideo.title,
        videoThumbnail: selectedVideo.thumbnail || "",
        sets: details.sets,
        reps: details.reps,
        tempo: details.tempo || "",
      };

      if (editingItem) {
        editItem(selectedWeekId, selectedDayKey, editingItem.id, videoItem);
      } else {
        addItem(selectedWeekId, selectedDayKey, videoItem);
      }

      setIsVideoDetailsDialogOpen(false);
      setSelectedVideo(null);
      setEditingItem(null);
    },
    [
      selectedVideo,
      editingItem,
      selectedWeekId,
      selectedDayKey,
      editItem,
      addItem,
    ]
  );

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: "#2A3133" }}>
      {/* Program Details Header */}
      {programDetails && (
        <div className="mb-8 p-6 bg-[#353A3A] rounded-2xl border border-gray-600">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {programDetails.title || "Untitled Program"}
              </h2>
              <p className="text-gray-400">
                {programDetails.description || "No description provided"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge
                variant="outline"
                className="bg-green-500/10 text-green-400 border-green-500/20"
              >
                {programDetails.level}
              </Badge>
              <Badge
                variant="outline"
                className="bg-purple-500/10 text-purple-400 border-purple-500/20"
              >
                {programDetails.duration} weeks
              </Badge>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Program
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Top Toolbar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={addWeek}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Week
            </Button>
            <Button
              onClick={toggleCollapseAll}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
            >
              {weeks.every(week => week.collapsed) ? (
                <>
                  <Expand className="h-4 w-4 mr-2" />
                  Expand All
                </>
              ) : (
                <>
                  <Minimize className="h-4 w-4 mr-2" />
                  Collapse All
                </>
              )}
            </Button>
          </div>
          {!programDetails && (
            <Button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Program
            </Button>
          )}
        </div>
      </div>

      {/* Weeks */}
      <div className="space-y-6">
        {weeks.map((week, weekIndex) => (
          <WeekCard
            key={week.id}
            week={week}
            weekIndex={weekIndex}
            onToggleCollapse={() => toggleCollapse(week.id)}
            onDelete={() => deleteWeek(week.id)}
            onDuplicate={() => duplicateWeek(week.id)}
            onAddItem={openAddFromLibrary}
            onEditItem={openEditItemDialog}
            onDeleteItem={deleteItem}
          />
        ))}
      </div>

      {/* Video Library Dialog */}
      <VideoLibraryDialog
        isOpen={isVideoLibraryOpen}
        onClose={() => {
          setIsVideoLibraryOpen(false);
          setEditingItem(null);
        }}
        onSelectVideo={handleVideoSelect}
        editingItem={editingItem}
      />

      {/* Video Details Dialog */}
      <VideoDetailsDialog
        isOpen={isVideoDetailsDialogOpen}
        onClose={() => {
          setIsVideoDetailsDialogOpen(false);
          setSelectedVideo(null);
        }}
        onSubmit={handleVideoDetailsSubmit}
        video={selectedVideo}
      />
    </div>
  );
}

// Week Card Component
interface WeekCardProps {
  week: Week;
  weekIndex: number;
  onToggleCollapse: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddItem: (weekId: string, dayKey: DayKey) => void;
  onEditItem: (weekId: string, dayKey: DayKey, item: ProgramItem) => void;
  onDeleteItem: (weekId: string, dayKey: DayKey, itemId: string) => void;
}

function WeekCard({
  week,
  weekIndex,
  onToggleCollapse,
  onDelete,
  onDuplicate,
  onAddItem,
  onEditItem,
  onDeleteItem,
}: WeekCardProps) {
  return (
    <Card className="bg-[#353A3A] border-gray-600 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="p-1 h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-600"
            >
              {week.collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <CardTitle className="text-xl font-bold text-white">
              {week.name}
            </CardTitle>
            <Badge
              variant="outline"
              className="bg-blue-500/10 text-blue-400 border-blue-500/20"
            >
              {weekIndex + 1}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onDuplicate}
              className="border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
            >
              <Copy className="h-4 w-4 mr-1" />
              Duplicate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="border-red-500 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardHeader>

      {!week.collapsed && (
        <CardContent>
          <div className="grid grid-cols-7 gap-4">
            {DAY_KEYS.map(dayKey => (
              <DayCard
                key={dayKey}
                dayKey={dayKey}
                dayLabel={DAY_LABELS[dayKey]}
                items={week.days[dayKey]}
                onAddItem={() => onAddItem(week.id, dayKey)}
                onEditItem={item => onEditItem(week.id, dayKey, item)}
                onDeleteItem={itemId => onDeleteItem(week.id, dayKey, itemId)}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Day Card Component
interface DayCardProps {
  dayKey: DayKey;
  dayLabel: string;
  items: ProgramItem[];
  onAddItem: () => void;
  onEditItem: (item: ProgramItem) => void;
  onDeleteItem: (itemId: string) => void;
}

function DayCard({
  dayKey,
  dayLabel,
  items,
  onAddItem,
  onEditItem,
  onDeleteItem,
}: DayCardProps) {
  const isRestDay = items.length === 0;

  return (
    <div className="space-y-3">
      {/* Day Header */}
      <div className="text-center">
        <h3 className="text-sm font-medium text-gray-300 mb-1">{dayLabel}</h3>
        <div className="text-xs text-gray-500 uppercase tracking-wide">
          {dayKey}
        </div>
      </div>

      {/* Day Content */}
      <Card
        className={cn(
          "min-h-[120px]",
          isRestDay
            ? "bg-gray-700/30 border-gray-500/30"
            : "bg-gray-700/50 border-gray-500/50"
        )}
      >
        <CardContent className="p-3">
          {isRestDay ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
              <Moon className="h-6 w-6 mb-2 opacity-50" />
              <span className="text-xs font-medium">Rest Day</span>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map(item => (
                <ProgramItemCard
                  key={item.id}
                  item={item}
                  onEdit={() => onEditItem(item)}
                  onDelete={() => onDeleteItem(item.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add from Library Button */}
      <div className="space-y-2">
        <Button
          onClick={() => onAddItem()}
          variant="outline"
          size="sm"
          className="w-full border-gray-500/50 text-gray-400 hover:bg-gray-600 hover:text-white hover:border-gray-400"
        >
          <Video className="h-3 w-3 mr-1" />
          Add from Library
        </Button>
      </div>
    </div>
  );
}

// Program Item Card Component
interface ProgramItemCardProps {
  item: ProgramItem;
  onEdit: () => void;
  onDelete: () => void;
}

function ProgramItemCard({ item, onEdit, onDelete }: ProgramItemCardProps) {
  const getItemIcon = () => {
    switch (item.type) {
      case "exercise":
        return <Target className="h-3 w-3" />;
      case "drill":
        return <Play className="h-3 w-3" />;
      case "video":
        return <Video className="h-3 w-3" />;
      default:
        return <Target className="h-3 w-3" />;
    }
  };

  const getItemColor = () => {
    switch (item.type) {
      case "exercise":
        return "bg-green-400";
      case "drill":
        return "bg-blue-400";
      case "video":
        return "bg-purple-400";
      default:
        return "bg-green-400";
    }
  };

  return (
    <Card className="bg-gray-600/50 border-gray-500/50">
      <CardContent className="p-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className={cn("w-2 h-2 rounded-full", getItemColor())} />
              <span className="text-xs font-medium text-white truncate">
                {item.title}
              </span>
            </div>

            {item.sets && item.reps && (
              <div className="text-xs text-gray-300 mb-1">
                {item.sets} × {item.reps}
                {item.tempo && ` @ ${item.tempo}`}
              </div>
            )}

            {item.duration && (
              <div className="text-xs text-gray-300 mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {item.duration}
              </div>
            )}

            {item.notes && (
              <p className="text-xs text-gray-400 line-clamp-2">{item.notes}</p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-500"
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-700 border-gray-600">
              <DropdownMenuItem
                onClick={onEdit}
                className="text-white hover:bg-gray-600"
              >
                <Edit className="h-3 w-3 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-600" />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-red-400 hover:bg-red-400/10"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

// Video Library Dialog Component
interface VideoLibraryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVideo: (video: {
    id: string;
    title: string;
    description?: string;
    duration?: string;
    url?: string;
    thumbnail?: string;
  }) => void;
  editingItem: ProgramItem | null;
}

function VideoLibraryDialog({
  isOpen,
  onClose,
  onSelectVideo,
  editingItem,
}: VideoLibraryDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLibrary, setSelectedLibrary] = useState<"master" | "local">(
    "master"
  );

  const { data: libraryItems = [], isLoading } = trpc.library.list.useQuery({
    search: searchTerm || undefined,
    category: selectedCategory !== "All" ? selectedCategory : undefined,
  });

  const categories = [
    "All",
    "Drive",
    "Whip",
    "Separation",
    "Stability",
    "Extension",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-600 text-white">
        <DialogHeader>
          <DialogTitle>Select Video from Library</DialogTitle>
          <DialogDescription className="text-gray-400">
            Choose a video to add to this day
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search videos..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <Select
              value={selectedLibrary}
              onValueChange={value =>
                setSelectedLibrary(value as "master" | "local")
              }
            >
              <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem
                  value="master"
                  className="text-white hover:bg-gray-600"
                >
                  Master Library
                </SelectItem>
                <SelectItem
                  value="local"
                  className="text-white hover:bg-gray-600"
                >
                  Local Library
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-48 bg-gray-700 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {categories.map(category => (
                  <SelectItem
                    key={category}
                    value={category}
                    className="text-white hover:bg-gray-600"
                  >
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Video Grid */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-gray-400">Loading videos...</p>
            </div>
          ) : libraryItems.length === 0 ? (
            <div className="text-center py-8">
              <Video className="h-12 w-12 mx-auto mb-2 text-gray-500" />
              <p className="text-gray-400">No videos found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {libraryItems.map(item => (
                <Card
                  key={item.id}
                  className="bg-gray-700 border-gray-600 hover:bg-gray-600 cursor-pointer"
                  onClick={() =>
                    onSelectVideo({
                      id: item.id,
                      title: item.title,
                      description: item.description || undefined,
                      duration: item.duration || undefined,
                      url: item.url || undefined,
                      thumbnail: item.thumbnail || undefined,
                    })
                  }
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="aspect-video bg-gray-600 rounded-lg flex items-center justify-center">
                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Video className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-white text-sm line-clamp-2">
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="text-gray-400 text-xs line-clamp-2 mt-1">
                            {item.description}
                          </p>
                        )}
                        {item.duration && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {item.duration}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Video Details Dialog Component
interface VideoDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: {
    notes?: string;
    sets?: number;
    reps?: number;
    tempo?: string;
  }) => void;
  video: {
    id: string;
    title: string;
    description?: string;
    duration?: string;
    url?: string;
    thumbnail?: string;
  } | null;
}

function VideoDetailsDialog({
  isOpen,
  onClose,
  onSubmit,
  video,
}: VideoDetailsDialogProps) {
  const [formData, setFormData] = useState({
    notes: "",
    sets: undefined as number | undefined,
    reps: undefined as number | undefined,
    tempo: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      notes: "",
      sets: undefined,
      reps: undefined,
      tempo: "",
    });
  };

  if (!video) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-600 text-white">
        <DialogHeader>
          <DialogTitle>Add Video Details</DialogTitle>
          <DialogDescription className="text-gray-400">
            Add optional details for {video.title}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="notes" className="text-white">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={e =>
                setFormData(prev => ({ ...prev, notes: e.target.value }))
              }
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="Additional instructions or notes..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="sets" className="text-white">
                Sets (Optional)
              </Label>
              <Input
                id="sets"
                type="number"
                value={formData.sets || ""}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    sets: e.target.value ? parseInt(e.target.value) : undefined,
                  }))
                }
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="3"
                min="1"
              />
            </div>

            <div>
              <Label htmlFor="reps" className="text-white">
                Reps (Optional)
              </Label>
              <Input
                id="reps"
                type="number"
                value={formData.reps || ""}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    reps: e.target.value ? parseInt(e.target.value) : undefined,
                  }))
                }
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="10"
                min="1"
              />
            </div>

            <div>
              <Label htmlFor="tempo" className="text-white">
                Tempo (Optional)
              </Label>
              <Input
                id="tempo"
                value={formData.tempo}
                onChange={e =>
                  setFormData(prev => ({ ...prev, tempo: e.target.value }))
                }
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="2-0-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add Video
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
