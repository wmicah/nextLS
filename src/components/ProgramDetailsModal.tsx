"use client";

import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
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
      <DialogContent className="max-w-[90vw] w-[90vw] max-h-[90vh] bg-[#2A3133] border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">
            {program.title}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {program.description || "No description provided"}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-[#3A4245] border-gray-600">
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
              <TabsTrigger
                value="analytics"
                className="text-white data-[state=active]:bg-[#4A5A70]"
              >
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                <Card className="bg-[#3A4245] border-gray-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-white">
                      {program.activeClientCount > 0 ? "Active" : "Draft"}
                    </p>
                    <p className="text-gray-400 text-sm">Program Status</p>
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
                      <span className="text-gray-400">Status:</span>
                      <Badge
                        variant="outline"
                        className={getStatusColor(program.activeClientCount)}
                      >
                        {program.activeClientCount > 0 ? "Active" : "Draft"}
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
                <div className="flex items-center gap-3 mb-6">
                  <BookOpen className="h-6 w-6 text-blue-400" />
                  <h3 className="text-lg font-medium text-white">
                    Program Structure
                  </h3>
                </div>

                <p className="text-gray-400 mb-6">
                  This program has {program.totalWeeks} weeks of training
                  content.
                </p>

                {program.weeks && program.weeks.length > 0 ? (
                  <div className="space-y-4">
                    {program.weeks.map((week, weekIndex) => (
                      <Card
                        key={week.id || weekIndex}
                        className="bg-gray-800/50 border-gray-700"
                      >
                        <CardHeader className="pb-3">
                          <CardTitle className="text-white text-lg">
                            Week {week.weekNumber || weekIndex + 1}:{" "}
                            {week.title}
                          </CardTitle>
                          {week.description && (
                            <CardDescription className="text-gray-400">
                              {week.description}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          {week.days && week.days.length > 0 ? (
                            <div className="space-y-3">
                              {week.days.map((day, dayIndex) => (
                                <div
                                  key={day.id || dayIndex}
                                  className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                      <span className="text-blue-400 text-sm font-medium">
                                        {day.dayNumber}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="text-white font-medium">
                                        {day.title}
                                      </p>
                                      {day.description && (
                                        <p className="text-gray-400 text-sm">
                                          {day.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {day.isRestDay ? (
                                      <Badge
                                        variant="outline"
                                        className="text-orange-400 border-orange-400/30"
                                      >
                                        Rest Day
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="text-green-400 border-green-400/30"
                                      >
                                        {day.drills?.length || 0} drills
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm italic">
                              No days configured for this week.
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      No weeks configured for this program yet.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="assignments" className="space-y-6 mt-6">
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-500" />
                <h3 className="text-lg font-medium text-white mb-2">
                  Client Assignments
                </h3>
                <p className="text-gray-400 mb-6">
                  This program is assigned to {program.activeClientCount} active
                  client{program.activeClientCount !== 1 ? "s" : ""}.
                </p>
                <p className="text-gray-500 text-sm">
                  Detailed assignment information will be available when
                  assignment data is loaded.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6 mt-6">
              <Card className="bg-[#3A4245] border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white">
                    Program Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">
                          Active Assignments:
                        </span>
                        <p className="text-white font-medium">
                          {program.activeClientCount}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400">Total Weeks:</span>
                        <p className="text-white font-medium">
                          {program.totalWeeks}
                        </p>
                      </div>
                    </div>
                    <Separator className="bg-gray-600" />
                    <div className="text-center py-4">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                      <p className="text-gray-400 text-sm">
                        Detailed analytics will be available when program data
                        is loaded.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
