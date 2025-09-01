"use client"

import { format } from "date-fns"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card"
import { Progress } from "./ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { ScrollArea } from "./ui/scroll-area"
import { Separator } from "./ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import {
  Calendar,
  Users,
  TrendingUp,
  Clock,
  Play,
  CheckCircle,
  X,
} from "lucide-react"

interface Program {
  id: string
  title: string
  description: string | null
  sport: string
  level: string
  status: "DRAFT" | "ACTIVE" | "ARCHIVED"
  duration: number
  coachId: string
  completionRate: number
  totalAssignments: number
  createdAt: string
  updatedAt: string
  weeks: ProgramWeek[]
  assignments: ProgramAssignment[]
}

interface ProgramWeek {
  id: string
  weekNumber: number
  title: string
  description: string | null
  days: ProgramDay[]
}

interface ProgramDay {
  id: string
  dayNumber: number
  title: string
  description: string | null
  drills: ProgramDrill[]
}

interface ProgramDrill {
  id: string
  order: number
  title: string
  description: string | null
  duration: string | null
  videoUrl: string | null
  notes: string | null
}

interface ProgramAssignment {
  id: string
  programId: string
  clientId: string
  assignedAt: string
  startDate: string | null
  completedAt: string | null
  progress: number
  client: {
    id: string
    name: string
    email: string | null
    avatar: string | null
  }
}

interface ProgramDetailsDrawerProps {
  isOpen: boolean
  onClose: () => void
  program: Program | null
}

export default function ProgramDetailsDrawer({
  isOpen,
  onClose,
  program,
}: ProgramDetailsDrawerProps) {
  if (!program) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500/10 text-green-600 border-green-500/20"
      case "DRAFT":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
      case "ARCHIVED":
        return "bg-gray-500/10 text-gray-600 border-gray-500/20"
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20"
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case "Intermediate":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20"
      case "Advanced":
        return "bg-red-500/10 text-red-600 border-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20"
    }
  }

  if (!isOpen) return null

  return (
    <Drawer>
      <DrawerContent className='bg-[#2A3133] border-gray-600'>
        <div className='mx-auto w-full max-w-2xl'>
          <DrawerHeader>
            <div className='flex items-center justify-between'>
              <DrawerTitle className='text-white'>{program.title}</DrawerTitle>
              <button
                onClick={onClose}
                className='p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200'
              >
                <X className='h-5 w-5' />
              </button>
            </div>
            <DrawerDescription className='text-gray-400'>
              {program.description}
            </DrawerDescription>
            <div className='flex items-center space-x-2 mt-4'>
              <Badge
                variant='outline'
                className={getStatusColor(program.status)}
              >
                {program.status}
              </Badge>
              <Badge
                variant='outline'
                className={getLevelColor(program.level)}
              >
                {program.level}
              </Badge>
              <Badge
                variant='outline'
                className='bg-purple-500/10 text-purple-600 border-purple-500/20'
              >
                {program.sport}
              </Badge>
            </div>
          </DrawerHeader>

          <div className='p-6'>
            <Tabs
              defaultValue='overview'
              className='w-full'
            >
              <TabsList className='grid w-full grid-cols-4 bg-[#3A4245]'>
                <TabsTrigger
                  value='overview'
                  className='text-gray-300'
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value='structure'
                  className='text-gray-300'
                >
                  Structure
                </TabsTrigger>
                <TabsTrigger
                  value='assignments'
                  className='text-gray-300'
                >
                  Assignments
                </TabsTrigger>
                <TabsTrigger
                  value='analytics'
                  className='text-gray-300'
                >
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value='overview'
                className='space-y-6 mt-6'
              >
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <Card className='bg-[#3A4245] border-gray-600'>
                    <CardContent className='p-4'>
                      <div className='flex items-center space-x-2'>
                        <Calendar className='h-5 w-5 text-blue-400' />
                        <div>
                          <p className='text-sm text-gray-400'>Duration</p>
                          <p className='text-xl font-semibold text-white'>
                            {program.duration} weeks
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className='bg-[#3A4245] border-gray-600'>
                    <CardContent className='p-4'>
                      <div className='flex items-center space-x-2'>
                        <Users className='h-5 w-5 text-green-400' />
                        <div>
                          <p className='text-sm text-gray-400'>Assigned</p>
                          <p className='text-xl font-semibold text-white'>
                            {program.totalAssignments} clients
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className='bg-[#3A4245] border-gray-600'>
                    <CardContent className='p-4'>
                      <div className='flex items-center space-x-2'>
                        <TrendingUp className='h-5 w-5 text-orange-400' />
                        <div>
                          <p className='text-sm text-gray-400'>Completion</p>
                          <p className='text-xl font-semibold text-white'>
                            {program.completionRate}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className='bg-[#3A4245] border-gray-600'>
                  <CardHeader>
                    <CardTitle className='text-white'>
                      Program Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='grid grid-cols-2 gap-4 text-sm'>
                      <div>
                        <span className='text-gray-400'>Created:</span>
                        <p className='text-white'>
                          {format(new Date(program.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div>
                        <span className='text-gray-400'>Last Updated:</span>
                        <p className='text-white'>
                          {format(new Date(program.updatedAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent
                value='structure'
                className='space-y-6 mt-6'
              >
                <ScrollArea className='h-96'>
                  <div className='space-y-4'>
                    {program.weeks?.map((week) => (
                      <Card
                        key={week.id}
                        className='bg-[#3A4245] border-gray-600'
                      >
                        <CardHeader>
                          <CardTitle className='text-white text-lg'>
                            {week.title}
                          </CardTitle>
                          {week.description && (
                            <CardDescription className='text-gray-400'>
                              {week.description}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className='space-y-3'>
                            {week.days.map((day) => (
                              <div
                                key={day.id}
                                className='border border-gray-600 rounded-lg p-3'
                              >
                                <h4 className='text-white font-medium mb-2'>
                                  Day {day.dayNumber}
                                </h4>
                                <div className='space-y-2'>
                                  {day.drills.map((drill) => (
                                    <div
                                      key={drill.id}
                                      className='flex items-center space-x-2 text-sm'
                                    >
                                      <Play className='h-3 w-3 text-gray-400' />
                                      <span className='text-gray-300'>
                                        {drill.title}
                                      </span>
                                      {drill.duration && (
                                        <>
                                          <Clock className='h-3 w-3 text-gray-400' />
                                          <span className='text-gray-400'>
                                            {drill.duration}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent
                value='assignments'
                className='space-y-6 mt-6'
              >
                <ScrollArea className='h-96'>
                  <div className='space-y-4'>
                    {program.assignments?.map((assignment) => (
                      <Card
                        key={assignment.id}
                        className='bg-[#3A4245] border-gray-600'
                      >
                        <CardContent className='p-4'>
                          <div className='flex items-center space-x-3'>
                            <Avatar className='h-10 w-10'>
                              <AvatarImage
                                src={assignment.client.avatar || undefined}
                              />
                              <AvatarFallback className='bg-blue-600 text-white'>
                                {assignment.client.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className='flex-1'>
                              <h4 className='text-white font-medium'>
                                {assignment.client.name}
                              </h4>
                              {assignment.client.email && (
                                <p className='text-gray-400 text-sm'>
                                  {assignment.client.email}
                                </p>
                              )}
                            </div>
                            <div className='text-right'>
                              <div className='flex items-center space-x-2'>
                                <CheckCircle className='h-4 w-4 text-green-400' />
                                <span className='text-white font-medium'>
                                  {assignment.progress}%
                                </span>
                              </div>
                              <Progress
                                value={assignment.progress}
                                className='w-20 h-2 mt-1'
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent
                value='analytics'
                className='space-y-6 mt-6'
              >
                <Card className='bg-[#3A4245] border-gray-600'>
                  <CardHeader>
                    <CardTitle className='text-white'>
                      Completion Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      <div>
                        <div className='flex items-center justify-between text-sm mb-2'>
                          <span className='text-gray-400'>
                            Overall Progress
                          </span>
                          <span className='text-white'>
                            {program.completionRate}%
                          </span>
                        </div>
                        <Progress
                          value={program.completionRate}
                          className='h-3'
                        />
                      </div>
                      <Separator className='bg-gray-600' />
                      <div className='grid grid-cols-2 gap-4 text-sm'>
                        <div>
                          <span className='text-gray-400'>
                            Active Assignments:
                          </span>
                          <p className='text-white font-medium'>
                            {program.totalAssignments}
                          </p>
                        </div>
                        <div>
                          <span className='text-gray-400'>Total Weeks:</span>
                          <p className='text-white font-medium'>
                            {program.duration}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
