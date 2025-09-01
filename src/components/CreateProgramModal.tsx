"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card"
import { Badge } from "./ui/badge"
import { Plus, Trash2, GripVertical, Play, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import DrillSelectionModal from "./DrillSelectionModal"

const programSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
<<<<<<< HEAD
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
=======
  sport: z.string().min(1, "Sport is required"),
  level: z.enum(["Drive", "Whip", "Separation", "Stability", "Extension"]),
  duration: z.number().min(1, "Duration must be at least 1 week"),
>>>>>>> d7c42b1 (Re-initialize repository)
  weeks: z.array(
    z.object({
      weekNumber: z.number(),
      title: z.string().min(1, "Week title is required"),
      description: z.string().optional(),
      days: z.array(
        z.object({
          dayNumber: z.number(),
          title: z.string().min(1, "Day title is required"),
          description: z.string().optional(),
          drills: z.array(
            z.object({
              order: z.number(),
              title: z.string().min(1, "Drill title is required"),
              description: z.string().optional(),
              duration: z.string().optional(),
              videoUrl: z.string().url().optional().or(z.literal("")),
              notes: z.string().optional(),
            })
          ),
        })
      ),
    })
  ),
})

type ProgramFormData = z.infer<typeof programSchema>

interface CreateProgramModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ProgramFormData) => void
}

export default function CreateProgramModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateProgramModalProps) {
  console.log("CreateProgramModal render - isOpen:", isOpen)
  const [activeTab, setActiveTab] = useState("details")
  const initializedRef = useRef(false)
  const [isDrillSelectionOpen, setIsDrillSelectionOpen] = useState(false)
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number | null>(
    null
  )
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null)
  const [weeks, setWeeks] = useState<
    Array<{
      weekNumber: number
      title: string
      description?: string
      days: Array<{
        dayNumber: number
        title: string
        description?: string
        drills: Array<{
          order: number
          title: string
          description?: string
          duration?: string
          videoUrl?: string
          notes?: string
        }>
      }>
    }>
  >([])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm<ProgramFormData>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      title: "",
      description: "",
<<<<<<< HEAD
      level: "Beginner",
=======
      sport: "",
      level: "Drive",
      duration: 1,
>>>>>>> d7c42b1 (Re-initialize repository)
      weeks: [],
    },
  })

  // Initialize with one week by default
  useEffect(() => {
    if (!initializedRef.current && weeks.length === 0) {
      const initialWeeks = [
        {
          weekNumber: 1,
          title: "Week 1",
          description: "",
          days: Array.from({ length: 7 }, (_, dayIndex) => ({
            dayNumber: dayIndex + 1,
            title: `Day ${dayIndex + 1}`,
            description: "",
            drills: [],
          })),
        },
      ]
      setWeeks(initialWeeks)
      initializedRef.current = true
    }
  }, [weeks.length])

  const addWeek = () => {
    const newWeekNumber = weeks.length + 1
    const newWeek = {
      weekNumber: newWeekNumber,
      title: `Week ${newWeekNumber}`,
      description: "",
      days: Array.from({ length: 7 }, (_, i) => ({
        dayNumber: i + 1,
        title: `Day ${i + 1}`,
        description: "",
        drills: [],
      })),
    }
    setWeeks([...weeks, newWeek])
  }

  const removeWeek = (weekIndex: number) => {
    const newWeeks = weeks.filter((_, index) => index !== weekIndex)
    setWeeks(newWeeks)
  }

  const updateWeek = (weekIndex: number, field: string, value: any) => {
    const updatedWeeks = [...weeks]

    // Check if the week exists
    if (!updatedWeeks[weekIndex]) {
      // Silently return if week doesn't exist - this can happen when
      // the UI shows more weeks than actually exist in the array
      return
    }

    updatedWeeks[weekIndex] = { ...updatedWeeks[weekIndex], [field]: value }
    setWeeks(updatedWeeks)
  }

  const addDrill = (weekIndex: number, dayIndex: number) => {
    setSelectedWeekIndex(weekIndex)
    setSelectedDayIndex(dayIndex)
    setIsDrillSelectionOpen(true)
  }

  const handleSelectDrill = (drill: {
    title: string
    description?: string
    duration?: string
    videoUrl?: string
    notes?: string
  }) => {
    if (selectedWeekIndex === null || selectedDayIndex === null) return

    const updatedWeeks = [...weeks]

    // Check if the week exists
    if (!updatedWeeks[selectedWeekIndex]) {
      console.error(`Week at index ${selectedWeekIndex} does not exist`)
      return
    }

    // Check if the week has days property
    if (!updatedWeeks[selectedWeekIndex].days) {
      console.error(
        `Week at index ${selectedWeekIndex} does not have days property`
      )
      return
    }

    // Check if the day exists
    if (!updatedWeeks[selectedWeekIndex].days[selectedDayIndex]) {
      console.error(
        `Day at index ${selectedDayIndex} does not exist in week ${selectedWeekIndex}`
      )
      return
    }

    const day = updatedWeeks[selectedWeekIndex].days[selectedDayIndex]
    const newDrill = {
      order: day.drills.length + 1,
      title: drill.title,
      description: drill.description || "",
      duration: drill.duration || "",
      videoUrl: drill.videoUrl || "",
      notes: drill.notes || "",
    }
    day.drills.push(newDrill)
    setWeeks(updatedWeeks)
  }

  const removeDrill = (
    weekIndex: number,
    dayIndex: number,
    drillIndex: number
  ) => {
    const updatedWeeks = [...weeks]

    // Check if the week exists
    if (!updatedWeeks[weekIndex]) {
      console.error(`Week at index ${weekIndex} does not exist`)
      return
    }

    // Check if the week has days property
    if (!updatedWeeks[weekIndex].days) {
      console.error(`Week at index ${weekIndex} does not have days property`)
      return
    }

    // Check if the day exists
    if (!updatedWeeks[weekIndex].days[dayIndex]) {
      console.error(
        `Day at index ${dayIndex} does not exist in week ${weekIndex}`
      )
      return
    }

    updatedWeeks[weekIndex].days[dayIndex].drills.splice(drillIndex, 1)
    setWeeks(updatedWeeks)
  }

  const updateDrill = (
    weekIndex: number,
    dayIndex: number,
    drillIndex: number,
    field: string,
    value: any
  ) => {
    const updatedWeeks = [...weeks]

    // Check if the week exists
    if (!updatedWeeks[weekIndex]) {
      console.error(`Week at index ${weekIndex} does not exist`)
      return
    }

    // Check if the week has days property
    if (!updatedWeeks[weekIndex].days) {
      console.error(`Week at index ${weekIndex} does not have days property`)
      return
    }

    // Check if the day exists
    if (!updatedWeeks[weekIndex].days[dayIndex]) {
      console.error(
        `Day at index ${dayIndex} does not exist in week ${weekIndex}`
      )
      return
    }

    // Check if the drill exists
    if (!updatedWeeks[weekIndex].days[dayIndex].drills[drillIndex]) {
      console.error(
        `Drill at index ${drillIndex} does not exist in day ${dayIndex} of week ${weekIndex}`
      )
      return
    }

    updatedWeeks[weekIndex].days[dayIndex].drills[drillIndex] = {
      ...updatedWeeks[weekIndex].days[dayIndex].drills[drillIndex],
      [field]: value,
    }
    setWeeks(updatedWeeks)
  }

  const handleFormSubmit = (data: ProgramFormData) => {
    // Ensure weeks are properly initialized and fill empty days with rest days
    const validWeeks = weeks.map((week, weekIndex) => ({
      ...week,
      weekNumber: weekIndex + 1,
      days: week.days.map((day, dayIndex) => {
        // If the day has no drills, make it a rest day
        if (day.drills.length === 0) {
          return {
            ...day,
            dayNumber: dayIndex + 1,
            title: "Rest Day",
            description: "Recovery and rest day",
            drills: [
              {
                order: 1,
                title: "Rest Day",
                description:
                  "Take this day to recover and rest. No specific exercises required.",
                duration: "",
                videoUrl: "",
                notes: "This is an automatically generated rest day.",
              },
            ],
          }
        }

        // If the day has drills, keep them as is
        return {
          ...day,
          dayNumber: dayIndex + 1,
          drills: day.drills.map((drill, drillIndex) => ({
            ...drill,
            order: drillIndex + 1,
            title: drill.title || "Untitled Drill",
            videoUrl: drill.videoUrl || "",
          })),
        }
      }),
    }))

    const formData = {
      ...data,
      weeks: validWeeks,
    }
    console.log("Submitting program data:", formData)
    onSubmit(formData)
  }

  const handleClose = () => {
    reset()
    setWeeks([])
    setActiveTab("details")
    initializedRef.current = false
    onClose()
  }

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={handleClose}
      >
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto bg-[#2A3133] border-gray-600 animate-in fade-in duration-200'>
          <DialogHeader>
            <DialogTitle className='text-white'>Create New Program</DialogTitle>
            <DialogDescription className='text-gray-400'>
              Design a comprehensive training program for your clients
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className='w-full'
          >
            <TabsList className='grid w-full grid-cols-3 bg-[#3A4245] border border-gray-600'>
              <TabsTrigger
                value='details'
                className='text-gray-300 data-[state=active]:bg-[#2A3133] data-[state=active]:text-white data-[state=active]:border-gray-600'
              >
                Program Details
              </TabsTrigger>
              <TabsTrigger
                value='structure'
                className='text-gray-300 data-[state=active]:bg-[#2A3133] data-[state=active]:text-white data-[state=active]:border-gray-600'
              >
                Program Structure
              </TabsTrigger>
              <TabsTrigger
                value='preview'
                className='text-gray-300 data-[state=active]:bg-[#2A3133] data-[state=active]:text-white data-[state=active]:border-gray-600'
              >
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value='details'
              className='space-y-6'
            >
              <div className='space-y-4'>
                <div>
                  <Label
                    htmlFor='title'
                    className='text-white'
                  >
                    Program Title
                  </Label>
                  <Input
                    id='title'
                    {...register("title")}
                    className='bg-[#3A4245] border-gray-600 text-white'
                    placeholder='e.g., Advanced Training Program'
                  />
                  {errors.title && (
                    <p className='text-red-400 text-sm mt-1'>
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor='description'
                    className='text-white'
                  >
                    Description
                  </Label>
                  <Textarea
                    id='description'
                    {...register("description")}
                    className='bg-[#3A4245] border-gray-600 text-white'
                    placeholder='Describe what this program covers...'
                    rows={3}
                  />
                </div>

                <div>
                  <Label
<<<<<<< HEAD
                    htmlFor='level'
                    className='text-white'
                  >
                    Level
                  </Label>
                  <Select
                    onValueChange={(value) => setValue("level", value as any)}
                    defaultValue='Beginner'
=======
                    htmlFor='sport'
                    className='text-white'
                  >
                    Sport
                  </Label>
                  <Input
                    id='sport'
                    {...register("sport")}
                    className='bg-[#3A4245] border-gray-600 text-white'
                    placeholder='e.g., Softball, Baseball, General'
                  />
                  {errors.sport && (
                    <p className='text-red-400 text-sm mt-1'>
                      {errors.sport.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor='level'
                    className='text-white'
                  >
                    Focus Area
                  </Label>
                  <Select
                    onValueChange={(value) => setValue("level", value as any)}
                    defaultValue='Drive'
>>>>>>> d7c42b1 (Re-initialize repository)
                  >
                    <SelectTrigger className='bg-[#3A4245] border-gray-600'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className='bg-[#3A4245] border-gray-600'>
                      <SelectItem
<<<<<<< HEAD
                        value='Beginner'
                        className='text-white hover:bg-[#2A3133]'
                      >
                        Beginner
                      </SelectItem>
                      <SelectItem
                        value='Intermediate'
                        className='text-white hover:bg-[#2A3133]'
                      >
                        Intermediate
                      </SelectItem>
                      <SelectItem
                        value='Advanced'
                        className='text-white hover:bg-[#2A3133]'
                      >
                        Advanced
                      </SelectItem>
                    </SelectContent>
                  </Select>
=======
                        value='Drive'
                        className='text-white hover:bg-[#2A3133]'
                      >
                        Drive
                      </SelectItem>
                      <SelectItem
                        value='Whip'
                        className='text-white hover:bg-[#2A3133]'
                      >
                        Whip
                      </SelectItem>
                      <SelectItem
                        value='Separation'
                        className='text-white hover:bg-[#2A3133]'
                      >
                        Separation
                      </SelectItem>
                      <SelectItem
                        value='Stability'
                        className='text-white hover:bg-[#2A3133]'
                      >
                        Stability
                      </SelectItem>
                      <SelectItem
                        value='Extension'
                        className='text-white hover:bg-[#2A3133]'
                      >
                        Extension
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.level && (
                    <p className='text-red-400 text-sm mt-1'>
                      {errors.level.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor='duration'
                    className='text-white'
                  >
                    Duration (weeks)
                  </Label>
                  <Input
                    id='duration'
                    type='number'
                    {...register("duration", { valueAsNumber: true })}
                    className='bg-[#3A4245] border-gray-600 text-white'
                    placeholder='e.g., 8'
                    min={1}
                  />
                  {errors.duration && (
                    <p className='text-red-400 text-sm mt-1'>
                      {errors.duration.message}
                    </p>
                  )}
>>>>>>> d7c42b1 (Re-initialize repository)
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value='structure'
              className='space-y-6'
            >
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-semibold text-white'>
                  Program Structure
                </h3>
                <Button
                  onClick={addWeek}
                  className='bg-blue-600 hover:bg-blue-700'
                >
                  <Plus className='h-4 w-4 mr-2' />
                  Add Week
                </Button>
              </div>

              <div className='p-4 rounded-lg bg-blue-500/10 border border-blue-500/20'>
                <p className='text-sm text-blue-300'>
                  💡 <strong>Auto Rest Days:</strong> Any day without drills
                  will automatically be converted to a "Rest Day" when you save
                  the program. This ensures every day has content for your
                  clients.
                </p>
              </div>

              <div className='space-y-4'>
                {weeks.map((week, weekIndex) => {
                  return (
                    <Card
                      key={weekIndex}
                      className='bg-[#3A4245] border-gray-600'
                    >
                      <CardHeader>
                        <div className='flex items-center justify-between'>
                          <div className='flex-1'>
                            <Input
                              value={week.title}
                              onChange={(e) =>
                                updateWeek(weekIndex, "title", e.target.value)
                              }
                              className='bg-[#3A4245] border-gray-600 text-white font-semibold'
                              placeholder='Week title'
                            />
                          </div>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => removeWeek(weekIndex)}
                            className='text-red-400 border-red-400 hover:bg-red-400/10'
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className='space-y-4'>
                          {week.days.map((day, dayIndex) => (
                            <div
                              key={dayIndex}
                              className='border border-gray-600 rounded-lg p-4'
                            >
                              <div className='flex items-center justify-between mb-3'>
                                <div className='flex items-center gap-2'>
                                  <h4 className='text-white font-medium'>
                                    Day {day.dayNumber}
                                  </h4>
                                  {day.drills.length === 0 && (
                                    <Badge
                                      variant='outline'
                                      className='bg-orange-500/10 text-orange-600 border-orange-500/20 text-xs'
                                    >
                                      Will be Rest Day
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  size='sm'
                                  onClick={() => addDrill(weekIndex, dayIndex)}
                                  className='bg-blue-600 hover:bg-blue-700'
                                >
                                  <Plus className='h-4 w-4 mr-1' />
                                  Add Drill
                                </Button>
                              </div>
                              <div className='space-y-3'>
                                {day.drills.map((drill, drillIndex) => (
                                  <div
                                    key={drillIndex}
                                    className='flex items-center space-x-2 p-3 bg-[#2A3133] rounded-lg'
                                  >
                                    <GripVertical className='h-4 w-4 text-gray-400' />
                                    <div className='flex-1 space-y-2'>
                                      <div className='text-white font-medium'>
                                        {drill.title}
                                      </div>
                                      <div className='grid grid-cols-2 gap-2'>
                                        <Input
                                          value={drill.duration || ""}
                                          onChange={(e) =>
                                            updateDrill(
                                              weekIndex,
                                              dayIndex,
                                              drillIndex,
                                              "duration",
                                              e.target.value
                                            )
                                          }
                                          className='bg-[#3A4245] border-gray-600 text-white'
                                          placeholder='Duration'
                                        />
                                        <Input
                                          value={drill.videoUrl || ""}
                                          onChange={(e) =>
                                            updateDrill(
                                              weekIndex,
                                              dayIndex,
                                              drillIndex,
                                              "videoUrl",
                                              e.target.value
                                            )
                                          }
                                          className='bg-[#3A4245] border-gray-600 text-white'
                                          placeholder='Video URL (optional)'
                                        />
                                      </div>
                                    </div>
                                    <Button
                                      size='sm'
                                      variant='outline'
                                      onClick={() =>
                                        removeDrill(
                                          weekIndex,
                                          dayIndex,
                                          drillIndex
                                        )
                                      }
                                      className='text-red-400 border-red-400 hover:bg-red-400/10'
                                    >
                                      <Trash2 className='h-4 w-4' />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent
              value='preview'
              className='space-y-6'
            >
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-white'>
                  Program Preview
                </h3>
                <Card className='bg-[#3A4245] border-gray-600'>
                  <CardHeader>
                    <CardTitle className='text-white'>
                      {watch("title") || "Untitled Program"}
                    </CardTitle>
                    <CardDescription className='text-gray-400'>
                      {watch("description") || "No description provided"}
                    </CardDescription>
                    <div className='flex items-center space-x-2'>
                      <Badge
                        variant='outline'
                        className='bg-green-500/10 text-green-600 border-green-500/20'
                      >
                        {watch("level")}
                      </Badge>
                      <Badge
                        variant='outline'
                        className='bg-purple-500/10 text-purple-600 border-purple-500/20'
                      >
                        {weeks.length} weeks
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      {weeks.map((week, weekIndex) => (
                        <div
                          key={weekIndex}
                          className='border border-gray-600 rounded-lg p-4'
                        >
                          <h4 className='text-white font-medium mb-3'>
                            {week.title}
                          </h4>
                          <div className='space-y-2'>
                            {week.days.map((day, dayIndex) => (
                              <div
                                key={dayIndex}
                                className='ml-4'
                              >
                                <h5 className='text-gray-300 text-sm mb-2'>
                                  Day {day.dayNumber}
                                </h5>
                                <div className='space-y-1'>
                                  {day.drills.map((drill, drillIndex) => (
                                    <div
                                      key={drillIndex}
                                      className='flex items-center space-x-2 text-sm text-gray-400'
                                    >
                                      <Play className='h-3 w-3' />
                                      <span>
                                        {drill.title || "Untitled drill"}
                                      </span>
                                      {drill.duration && (
                                        <>
                                          <Clock className='h-3 w-3' />
                                          <span>{drill.duration}</span>
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
<<<<<<< HEAD
=======

                {/* Create Program Button - Only shown in preview tab */}
                <div className="flex justify-center pt-6">
                  <Button
                    onClick={handleSubmit(handleFormSubmit)}
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium"
                    size="lg"
                  >
                    {isSubmitting ? "Creating..." : "Create Program"}
                  </Button>
                </div>
>>>>>>> d7c42b1 (Re-initialize repository)
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={handleClose}
              className='border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white'
            >
              Cancel
            </Button>
<<<<<<< HEAD
            <Button
              onClick={handleSubmit(handleFormSubmit)}
              disabled={isSubmitting}
              className='bg-blue-600 hover:bg-blue-700'
            >
              {isSubmitting ? "Creating..." : "Create Program"}
            </Button>
=======
>>>>>>> d7c42b1 (Re-initialize repository)
            {Object.keys(errors).length > 0 && (
              <div className='text-red-400 text-sm mt-2'>
                Form errors: {JSON.stringify(errors)}
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DrillSelectionModal
        isOpen={isDrillSelectionOpen}
        onClose={() => setIsDrillSelectionOpen(false)}
        onSelectDrill={handleSelectDrill}
      />
    </>
  )
}
