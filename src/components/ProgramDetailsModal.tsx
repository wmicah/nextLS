"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { trpc } from "@/app/_trpc/client";
import { useToast } from "@/lib/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import ExerciseRow from "./programs/ExerciseRow";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { COLORS } from "@/lib/colors";
import {
  Calendar,
  Users,
  TrendingUp,
  Clock,
  Play,
  CheckCircle,
  BookOpen,
  Target,
  Award,
  Edit3,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  Dumbbell,
} from "lucide-react";

interface Program {
  id: string;
  title: string;
  description: string | null;
  level?: string;
  duration?: number;
  status?: string;
  activeClientCount: number;
  totalWeeks: number;
  createdAt: string;
  updatedAt: string;
  weeks?: ProgramWeek[];
  assignments?: ProgramAssignment[];
}

interface ProgramWeek {
  id: string;
  weekNumber: number;
  title: string;
  description: string | null;
  days: ProgramDay[];
}

interface ProgramDay {
  id: string;
  dayNumber: number;
  title: string;
  description: string | null;
  isRestDay: boolean;
  drills: ProgramDrill[];
}

interface ProgramDrill {
  id: string;
  order: number;
  title: string;
  description: string | null;
  duration: string | null;
  videoUrl: string | null;
  notes: string | null;
  supersetId?: string | null;
  supersetOrder?: number | null;
}

interface ProgramAssignment {
  id: string;
  programId: string;
  clientId: string;
  assignedAt: string;
  startDate: string | null;
  completedAt: string | null;
  progress: number;
  client: {
    id: string;
    name: string;
    email: string | null;
    avatar: string | null;
  };
}

interface ProgramDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: Program | null;
}

export default function ProgramDetailsModal({
  isOpen,
  onClose,
  program,
}: ProgramDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Fetch program assignments when modal opens and program is available
  const { data: assignments = [], isLoading: assignmentsLoading } =
    trpc.programs.getProgramAssignments.useQuery(
      { programId: program?.id || "" },
      { enabled: !!program?.id && isOpen }
    );

  // Update mutation for program details
  const updateProgram = trpc.programs.update.useMutation({
    onSuccess: () => {
      utils.programs.list.invalidate();
      toast({
        title: "Program updated",
        description: "Program details have been updated successfully.",
      });
      setIsEditing(false);
    },
    onError: (error: unknown) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update program",
        variant: "destructive",
      });
    },
  });

  // Initialize editing state when program changes
  useEffect(() => {
    if (program) {
      setEditedTitle(program.title);
      setEditedDescription(program.description || "");
    }
  }, [program]);

  // Toggle week expansion
  const toggleWeekExpansion = (weekId: string) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekId)) {
      newExpanded.delete(weekId);
    } else {
      newExpanded.add(weekId);
    }
    setExpandedWeeks(newExpanded);
  };

  // Toggle day expansion
  const toggleDayExpansion = (dayId: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayId)) {
      newExpanded.delete(dayId);
    } else {
      newExpanded.add(dayId);
    }
    setExpandedDays(newExpanded);
  };

  // Handle save
  const handleSave = () => {
    if (!program) return;

    updateProgram.mutate({
      id: program.id,
      title: editedTitle,
      description: editedDescription,
    });
  };

  // Handle cancel editing
  const handleCancel = () => {
    if (program) {
      setEditedTitle(program.title);
      setEditedDescription(program.description || "");
    }
    setIsEditing(false);
  };

  if (!program) return null;

  const getStatusColor = (activeClientCount: number) => {
    if (activeClientCount > 0) {
      return "bg-green-500/10 text-green-600 border-green-500/20";
    } else {
      return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const getLevelColor = (level?: string) => {
    switch (level) {
      case "Drive":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "Whip":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      case "Separation":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "Stability":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "Extension":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-[90vw] w-[90vw] max-h-[90vh] [&>button]:hidden"
        style={{
          backgroundColor: COLORS.BACKGROUND_DARK,
          borderColor: COLORS.BORDER_SUBTLE,
        }}
      >
        <DialogHeader>
          <div className="flex items-start justify-between p-4">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editedTitle}
                    onChange={e => setEditedTitle(e.target.value)}
                    className="text-lg font-bold text-sm"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_CARD,
                      borderColor: COLORS.BORDER_SUBTLE,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                    }}
                    placeholder="Program title"
                  />
                  <Textarea
                    value={editedDescription}
                    onChange={e => setEditedDescription(e.target.value)}
                    className="text-sm resize-none"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_CARD,
                      borderColor: COLORS.BORDER_SUBTLE,
                      color: COLORS.TEXT_SECONDARY,
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                    }}
                    placeholder="Program description"
                    rows={2}
                  />
                </div>
              ) : (
                <>
                  <DialogTitle className="text-lg font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>
                    {program.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-0.5" style={{ color: COLORS.TEXT_SECONDARY }}>
                    {program.description || "No description provided"}
                  </DialogDescription>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateProgram.isPending}
                    className="h-8 w-8 p-0"
                    style={{
                      backgroundColor: COLORS.GREEN_PRIMARY,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                    onMouseEnter={e => {
                      if (!updateProgram.isPending) {
                        e.currentTarget.style.backgroundColor = COLORS.GREEN_DARK;
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = COLORS.GREEN_PRIMARY;
                    }}
                  >
                    <Save className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    className="h-8 w-8 p-0"
                    style={{
                      borderColor: COLORS.BORDER_SUBTLE,
                      color: COLORS.TEXT_SECONDARY,
                      backgroundColor: COLORS.BACKGROUND_CARD,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                      e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                      e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="h-8 w-8 p-0"
                    style={{
                      borderColor: COLORS.BORDER_SUBTLE,
                      color: COLORS.TEXT_SECONDARY,
                      backgroundColor: COLORS.BACKGROUND_CARD,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                      e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                      e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                    }}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onClose}
                    className="h-8 w-8 p-0"
                    style={{
                      borderColor: COLORS.BORDER_SUBTLE,
                      color: COLORS.TEXT_SECONDARY,
                      backgroundColor: COLORS.BACKGROUND_CARD,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                      e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                      e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 px-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3"
              style={{
                backgroundColor: COLORS.BACKGROUND_CARD,
                borderColor: COLORS.BORDER_SUBTLE,
              }}
            >
              <TabsTrigger
                value="overview"
                className="text-xs data-[state=active]:bg-[#B1872E] data-[state=active]:text-[#F5F5F5]"
                style={{
                  color: COLORS.TEXT_SECONDARY,
                }}
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="structure"
                className="text-xs data-[state=active]:bg-[#B1872E] data-[state=active]:text-[#F5F5F5]"
                style={{
                  color: COLORS.TEXT_SECONDARY,
                }}
              >
                Structure
              </TabsTrigger>
              <TabsTrigger
                value="assignments"
                className="text-xs data-[state=active]:bg-[#B1872E] data-[state=active]:text-[#F5F5F5]"
                style={{
                  color: COLORS.TEXT_SECONDARY,
                }}
              >
                Assignments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2" style={{ color: COLORS.TEXT_PRIMARY }}>
                      <Calendar className="h-4 w-4" />
                      Duration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>
                      {program.duration || 0}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: COLORS.TEXT_SECONDARY }}>Weeks</p>
                  </CardContent>
                </Card>

                <Card className="border" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2" style={{ color: COLORS.TEXT_PRIMARY }}>
                      <Users className="h-4 w-4" />
                      Assignments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>
                      {program.activeClientCount}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: COLORS.TEXT_SECONDARY }}>Active Clients</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                      Program Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>Level:</span>
                      <Badge
                        variant="outline"
                        className={getLevelColor(program.level)}
                      >
                        {program.level || "General"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>Created:</span>
                      <span className="text-xs" style={{ color: COLORS.TEXT_PRIMARY }}>
                        {format(new Date(program.createdAt), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border" style={{ backgroundColor: COLORS.BACKGROUND_CARD, borderColor: COLORS.BORDER_SUBTLE }}>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                      Program Structure
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>Total Weeks:</span>
                      <span className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                        {program.totalWeeks}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>Active Clients:</span>
                      <span className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                        {program.activeClientCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>Last Updated:</span>
                      <span className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                        {format(new Date(program.updatedAt), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="structure" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="h-4 w-4" style={{ color: COLORS.GOLDEN_ACCENT }} />
                    <h3 className="text-sm font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                      Program Structure
                    </h3>
                    <Badge
                      variant="outline"
                      className="text-xs px-2 py-0.5"
                      style={{
                        color: COLORS.GOLDEN_ACCENT,
                        borderColor: COLORS.BORDER_ACCENT,
                        backgroundColor: COLORS.BACKGROUND_CARD,
                      }}
                    >
                      {program.totalWeeks} weeks
                    </Badge>
                  </div>
                </div>

                {program.weeks && program.weeks.length > 0 ? (
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-3">
                      {program.weeks.map((week, weekIndex) => {
                        const weekId = week.id || `week-${weekIndex}`;
                        const isExpanded = expandedWeeks.has(weekId);

                        return (
                          <Card
                            key={weekId}
                            className="border transition-colors"
                            style={{
                              backgroundColor: COLORS.BACKGROUND_CARD,
                              borderColor: COLORS.BORDER_SUBTLE,
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                            }}
                          >
                            <CardHeader
                              className="pb-2 cursor-pointer"
                              onClick={() => toggleWeekExpansion(weekId)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  {isExpanded ? (
                                    <ChevronDown className="h-3.5 w-3.5" style={{ color: COLORS.TEXT_SECONDARY }} />
                                  ) : (
                                    <ChevronRight className="h-3.5 w-3.5" style={{ color: COLORS.TEXT_SECONDARY }} />
                                  )}
                                  <div>
                                    <CardTitle className="text-sm font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                                      Week {week.weekNumber || weekIndex + 1}:{" "}
                                      {week.title}
                                    </CardTitle>
                                    {week.description && (
                                      <CardDescription className="text-xs mt-0.5" style={{ color: COLORS.TEXT_SECONDARY }}>
                                        {week.description}
                                      </CardDescription>
                                    )}
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="text-xs px-2 py-0.5"
                                  style={{
                                    color: COLORS.TEXT_SECONDARY,
                                    borderColor: COLORS.BORDER_SUBTLE,
                                    backgroundColor: COLORS.BACKGROUND_CARD,
                                  }}
                                >
                                  {week.days?.length || 0} days
                                </Badge>
                              </div>
                            </CardHeader>

                            {isExpanded && (
                              <CardContent className="pt-0">
                                {week.days && week.days.length > 0 ? (
                                  <div className="space-y-2">
                                    {week.days.map((day, dayIndex) => {
                                      const dayId =
                                        day.id ||
                                        `day-${weekIndex}-${dayIndex}`;
                                      const isDayExpanded =
                                        expandedDays.has(dayId);

                                      return (
                                        <div
                                          key={dayId}
                                          className="rounded-md border"
                                          style={{
                                            backgroundColor: COLORS.BACKGROUND_DARK,
                                            borderColor: COLORS.BORDER_SUBTLE,
                                          }}
                                        >
                                          <div
                                            className="flex items-center justify-between p-2.5 cursor-pointer"
                                            onClick={() =>
                                              toggleDayExpansion(dayId)
                                            }
                                          >
                                            <div className="flex items-center gap-2.5">
                                              {isDayExpanded ? (
                                                <ChevronDown className="h-3 w-3" style={{ color: COLORS.TEXT_SECONDARY }} />
                                              ) : (
                                                <ChevronRight className="h-3 w-3" style={{ color: COLORS.TEXT_SECONDARY }} />
                                              )}
                                              <div>
                                                <p className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                                                  {day.title}
                                                </p>
                                                {day.description && (
                                                  <p className="text-[10px] mt-0.5" style={{ color: COLORS.TEXT_SECONDARY }}>
                                                    {day.description}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              {day.isRestDay ? (
                                                <Badge
                                                  variant="outline"
                                                  className="text-[10px] px-1.5 py-0.5"
                                                  style={{
                                                    color: "#F28F3B",
                                                    borderColor: "rgba(242, 143, 59, 0.3)",
                                                    backgroundColor: COLORS.BACKGROUND_CARD,
                                                  }}
                                                >
                                                  Rest Day
                                                </Badge>
                                              ) : (
                                                <Badge
                                                  variant="outline"
                                                  className="text-[10px] px-1.5 py-0.5"
                                                  style={{
                                                    color: COLORS.GREEN_PRIMARY,
                                                    borderColor: "rgba(112, 207, 112, 0.3)",
                                                    backgroundColor: COLORS.BACKGROUND_CARD,
                                                  }}
                                                >
                                                  {day.drills?.length || 0}{" "}
                                                  drills
                                                </Badge>
                                              )}
                                            </div>
                                          </div>

                                            {isDayExpanded &&
                                            day.drills &&
                                            day.drills.length > 0 && (
                                              <div className="px-2.5 pb-2.5 border-t pt-2" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                                                <div className="space-y-2">
                                                  {day.drills.map(
                                                    (drill, drillIndex) => {
                                                      // Find other exercises in the same superset
                                                      const supersetExercises =
                                                        day.drills.filter(
                                                          (otherDrill: any) =>
                                                            otherDrill.id !==
                                                              drill.id &&
                                                            otherDrill.supersetId ===
                                                              drill.supersetId
                                                        );

                                                      return (
                                                        <ExerciseRow
                                                          key={
                                                            drill.id ||
                                                            drillIndex
                                                          }
                                                          exercise={drill}
                                                          index={drillIndex}
                                                          programId={program.id}
                                                          supersetExercises={
                                                            supersetExercises
                                                          }
                                                          onDelete={() => {
                                                            // TODO: Implement delete functionality
                                                          }}
                                                          onReorder={(
                                                            fromIndex,
                                                            toIndex
                                                          ) => {
                                                            // TODO: Implement reorder functionality
                                                          }}
                                                        />
                                                      );
                                                    }
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-xs italic" style={{ color: COLORS.TEXT_SECONDARY }}>
                                    No days configured for this week.
                                  </p>
                                )}
                              </CardContent>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 mx-auto mb-3" style={{ color: COLORS.TEXT_SECONDARY }} />
                    <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                      No weeks configured for this program yet.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="assignments" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 mb-4">
                  <Users className="h-4 w-4" style={{ color: COLORS.GOLDEN_ACCENT }} />
                  <h3 className="text-sm font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                    Active Client Assignments
                  </h3>
                  <Badge
                    variant="outline"
                    className="text-xs px-2 py-0.5"
                    style={{
                      color: COLORS.GOLDEN_ACCENT,
                      borderColor: COLORS.BORDER_ACCENT,
                      backgroundColor: COLORS.BACKGROUND_CARD,
                    }}
                  >
                    {assignments.length} client
                    {assignments.length !== 1 ? "s" : ""}
                  </Badge>
                </div>

                {assignmentsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: COLORS.GOLDEN_ACCENT }} />
                  </div>
                ) : assignments.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto mb-3" style={{ color: COLORS.TEXT_SECONDARY }} />
                    <h3 className="text-sm font-medium mb-1.5" style={{ color: COLORS.TEXT_PRIMARY }}>
                      No Active Assignments
                    </h3>
                    <p className="text-xs mb-4" style={{ color: COLORS.TEXT_SECONDARY }}>
                      This program hasn't been assigned to any clients yet.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-2.5">
                      {assignments.map(assignment => (
                        <Card
                          key={assignment.id}
                          className="border transition-colors"
                          style={{
                            backgroundColor: COLORS.BACKGROUND_CARD,
                            borderColor: COLORS.BORDER_SUBTLE,
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                          }}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={assignment.client.avatar || ""}
                                  />
                                  <AvatarFallback className="text-xs"
                                    style={{
                                      backgroundColor: COLORS.BACKGROUND_CARD_HOVER,
                                      color: COLORS.GOLDEN_ACCENT,
                                    }}
                                  >
                                    {assignment.client.name?.charAt(0) || "C"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                                    {assignment.client.name}
                                  </h4>
                                  <p className="text-[10px] mt-0.5" style={{ color: COLORS.TEXT_SECONDARY }}>
                                    {assignment.client.email}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Progress
                                    value={assignment.progress}
                                    className="w-16 h-1.5"
                                  />
                                  <span className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                                    {assignment.progress}%
                                  </span>
                                </div>
                                <p className="text-[10px]" style={{ color: COLORS.TEXT_MUTED }}>
                                  Assigned{" "}
                                  {format(
                                    new Date(assignment.assignedAt),
                                    "MMM dd, yyyy"
                                  )}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
