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
      <DialogContent className="max-w-[90vw] w-[90vw] max-h-[90vh] bg-[#2A3133] border-gray-600 [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    value={editedTitle}
                    onChange={e => setEditedTitle(e.target.value)}
                    className="text-white text-2xl font-bold bg-transparent border-gray-600 focus:border-blue-500"
                    placeholder="Program title"
                  />
                  <Textarea
                    value={editedDescription}
                    onChange={e => setEditedDescription(e.target.value)}
                    className="text-gray-400 bg-transparent border-gray-600 focus:border-blue-500 resize-none"
                    placeholder="Program description"
                    rows={2}
                  />
                </div>
              ) : (
                <>
                  <DialogTitle className="text-white text-2xl">
                    {program.title}
                  </DialogTitle>
                  <DialogDescription className="text-gray-400">
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
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    className="border-gray-600 text-gray-300 hover:bg-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-600"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onClose}
                    className="border-gray-600 text-gray-300 hover:bg-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-[#3A4245] border-gray-600">
              <TabsTrigger
                value="overview"
                className="text-white data-[state=active]:bg-[#4A5A70]"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="structure"
                className="text-white data-[state=active]:bg-[#4A5A70]"
              >
                Structure
              </TabsTrigger>
              <TabsTrigger
                value="assignments"
                className="text-white data-[state=active]:bg-[#4A5A70]"
              >
                Assignments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-[#3A4245] border-gray-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Duration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-white">
                      {program.duration || 0}
                    </p>
                    <p className="text-gray-400 text-sm">Weeks</p>
                  </CardContent>
                </Card>

                <Card className="bg-[#3A4245] border-gray-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Assignments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-white">
                      {program.activeClientCount}
                    </p>
                    <p className="text-gray-400 text-sm">Active Clients</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-[#3A4245] border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Program Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Level:</span>
                      <Badge
                        variant="outline"
                        className={getLevelColor(program.level)}
                      >
                        {program.level || "General"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Created:</span>
                      <span className="text-white">
                        {format(new Date(program.createdAt), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#3A4245] border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Program Structure
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Total Weeks:</span>
                      <span className="text-white font-medium">
                        {program.totalWeeks}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Active Clients:</span>
                      <span className="text-white font-medium">
                        {program.activeClientCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Last Updated:</span>
                      <span className="text-white font-medium">
                        {format(new Date(program.updatedAt), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="structure" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-6 w-6 text-blue-400" />
                    <h3 className="text-lg font-medium text-white">
                      Program Structure
                    </h3>
                    <Badge
                      variant="outline"
                      className="text-blue-400 border-blue-400/30"
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
                            className="bg-[#3A4245] border-gray-600 hover:border-gray-500 transition-colors"
                          >
                            <CardHeader
                              className="pb-3 cursor-pointer"
                              onClick={() => toggleWeekExpansion(weekId)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-gray-400" />
                                  )}
                                  <div>
                                    <CardTitle className="text-white text-base">
                                      Week {week.weekNumber || weekIndex + 1}:{" "}
                                      {week.title}
                                    </CardTitle>
                                    {week.description && (
                                      <CardDescription className="text-gray-400 text-sm">
                                        {week.description}
                                      </CardDescription>
                                    )}
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="text-gray-400 border-gray-400/30"
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
                                          className="bg-[#2A3133] rounded-lg border border-gray-700"
                                        >
                                          <div
                                            className="flex items-center justify-between p-3 cursor-pointer"
                                            onClick={() =>
                                              toggleDayExpansion(dayId)
                                            }
                                          >
                                            <div className="flex items-center gap-3">
                                              {isDayExpanded ? (
                                                <ChevronDown className="h-3 w-3 text-gray-400" />
                                              ) : (
                                                <ChevronRight className="h-3 w-3 text-gray-400" />
                                              )}
                                              <div>
                                                <p className="text-white font-medium text-sm">
                                                  {day.title}
                                                </p>
                                                {day.description && (
                                                  <p className="text-gray-400 text-xs">
                                                    {day.description}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              {day.isRestDay ? (
                                                <Badge
                                                  variant="outline"
                                                  className="text-orange-400 border-orange-400/30 text-xs"
                                                >
                                                  Rest Day
                                                </Badge>
                                              ) : (
                                                <Badge
                                                  variant="outline"
                                                  className="text-green-400 border-green-400/30 text-xs"
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
                                              <div className="px-3 pb-3 border-t border-gray-700 pt-2">
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
                                                            console.log(
                                                              "Delete exercise:",
                                                              drill.id
                                                            );
                                                          }}
                                                          onReorder={(
                                                            fromIndex,
                                                            toIndex
                                                          ) => {
                                                            // TODO: Implement reorder functionality
                                                            console.log(
                                                              "Reorder exercises:",
                                                              fromIndex,
                                                              toIndex
                                                            );
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
                                  <p className="text-gray-500 text-sm italic">
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
                    <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-500">
                      No weeks configured for this program yet.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="assignments" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <Users className="h-6 w-6 text-blue-400" />
                  <h3 className="text-lg font-medium text-white">
                    Active Client Assignments
                  </h3>
                  <Badge
                    variant="outline"
                    className="text-blue-400 border-blue-400/30"
                  >
                    {assignments.length} client
                    {assignments.length !== 1 ? "s" : ""}
                  </Badge>
                </div>

                {assignmentsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  </div>
                ) : assignments.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 mx-auto mb-4 text-gray-500" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      No Active Assignments
                    </h3>
                    <p className="text-gray-400 mb-6">
                      This program hasn't been assigned to any clients yet.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {assignments.map(assignment => (
                        <Card
                          key={assignment.id}
                          className="bg-[#3A4245] border-gray-600 hover:border-gray-500 transition-colors"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage
                                    src={assignment.client.avatar || ""}
                                  />
                                  <AvatarFallback className="bg-blue-500/20 text-blue-300">
                                    {assignment.client.name?.charAt(0) || "C"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-medium text-white">
                                    {assignment.client.name}
                                  </h4>
                                  <p className="text-sm text-gray-400">
                                    {assignment.client.email}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-2 mb-1">
                                  <Progress
                                    value={assignment.progress}
                                    className="w-20 h-2"
                                  />
                                  <span className="text-sm text-gray-400">
                                    {assignment.progress}%
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500">
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
