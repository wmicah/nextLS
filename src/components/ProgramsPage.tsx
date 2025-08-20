"use client"

import { useState, useCallback, useOptimistic } from "react"
import { trpc } from "@/app/_trpc/client"
import { useDebounce } from "@/lib/hooks/use-debounce"
import {
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  Star,
  Edit,
  Copy,
  Archive,
  Trash2,
  Eye,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Target,
  Award,
  Zap,
  BookOpen,
  Play,
  CheckCircle,
  Circle,
  AlertCircle,
  Sparkles,
} from "lucide-react"
import { format } from "date-fns"
import Sidebar from "./Sidebar"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet"
import { ScrollArea } from "./ui/scroll-area"
import { Progress } from "./ui/progress"
import { Separator } from "./ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Switch } from "./ui/switch"
import { Slider } from "./ui/slider"
import { Checkbox } from "./ui/checkbox"
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"
import { Alert, AlertDescription } from "./ui/alert"
import { Skeleton } from "./ui/skeleton"
import { useToast } from "@/lib/hooks/use-toast"
import { cn } from "@/lib/utils"
import CreateProgramModal from "./CreateProgramModal"
import AssignProgramModal from "./AssignProgramModal"
import ProgramDetailsDrawer from "./ProgramDetailsDrawer"

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

export default function ProgramsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [levelFilter, setLevelFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false)
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true)

  const debouncedSearch = useDebounce(searchTerm, 300)
  const { toast } = useToast()

  const {
    data: programs = [],
    isLoading,
    error,
  } = trpc.programs.list.useQuery({
    search: debouncedSearch,
    level: levelFilter === "All" ? undefined : levelFilter,
    status: statusFilter === "All" ? undefined : (statusFilter as any),
  })

  const { data: clients = [] } = trpc.clients.list.useQuery()
  const { data: stats } = trpc.programs.getStats.useQuery()
  const utils = trpc.useUtils()

  // Removed optimistic update due to type mismatch

  const createProgram = trpc.programs.create.useMutation({
    onSuccess: () => {
      utils.programs.list.invalidate()
      setIsCreateModalOpen(false)
      toast({
        title: "Program created",
        description: "Your new program has been created successfully.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const assignProgram = trpc.programs.assignToClients.useMutation({
    onSuccess: () => {
      utils.programs.list.invalidate()
      setIsAssignModalOpen(false)
      toast({
        title: "Program assigned",
        description: "The program has been assigned to selected clients.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const deleteProgram = trpc.programs.delete.useMutation({
    onSuccess: () => {
      utils.programs.list.invalidate()
      toast({
        title: "Program deleted",
        description: "The program has been deleted successfully.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleCreateProgram = useCallback(
    (data: any) => {
      createProgram.mutate(data)
    },
    [createProgram]
  )

  const handleAssignProgram = useCallback(
    (data: any) => {
      assignProgram.mutate(data)
    },
    [assignProgram]
  )

  const handleDeleteProgram = useCallback(
    (programId: string, programName: string) => {
      if (
        window.confirm(
          `Are you sure you want to delete "${programName}"? This action cannot be undone.`
        )
      ) {
        deleteProgram.mutate({ id: programId })
      }
    },
    [deleteProgram]
  )

  const filteredPrograms = (programs || []).filter((program: any) => {
    const matchesSearch =
      program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (program.description &&
        program.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesLevel = levelFilter === "All" || program.level === levelFilter
    const matchesStatus =
      statusFilter === "All" || program.status === statusFilter

    return matchesSearch && matchesLevel && matchesStatus
  })

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

  if (isLoading) {
    return (
      <Sidebar>
        <div className='min-h-screen bg-[#2A3133] p-6'>
          <div className='space-y-6'>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-8 w-48' />
              <Skeleton className='h-10 w-32' />
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className='h-64 w-full'
                />
              ))}
            </div>
          </div>
        </div>
      </Sidebar>
    )
  }

  if (error) {
    return (
      <Sidebar>
        <div className='min-h-screen bg-[#2A3133] p-6'>
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              Error loading programs: {error.message}
            </AlertDescription>
          </Alert>
        </div>
      </Sidebar>
    )
  }

  return (
    <Sidebar>
      {/* Hero Header */}
      <div className='relative mb-12'>
        <div className='absolute inset-0 rounded-2xl overflow-hidden'>
          <div
            className='absolute inset-0 opacity-20'
            style={{
              background:
                "linear-gradient(135deg, #4A5A70 0%, #606364 50%, #353A3A 100%)",
            }}
          />
          <div className='absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-black/40' />
        </div>

        <div
          className='relative p-8 rounded-2xl border'
          style={{ borderColor: "#606364" }}
        >
          <div className='flex items-center justify-between'>
            <div className='flex-1'>
              <div className='flex items-center gap-3 mb-4'>
                <div
                  className='w-12 h-12 rounded-xl flex items-center justify-center'
                  style={{ backgroundColor: "#4A5A70" }}
                >
                  <Target
                    className='h-6 w-6'
                    style={{ color: "#C3BCC2" }}
                  />
                </div>
                <div>
                  <h1
                    className='text-4xl font-bold mb-2'
                    style={{ color: "#C3BCC2" }}
                  >
                    Training Programs
                  </h1>
                  <p
                    className='flex items-center gap-2'
                    style={{ color: "#ABA4AA" }}
                  >
                    <Sparkles className='h-4 w-4' />
                    Create and manage comprehensive training programs for your
                    clients.
                  </p>
                </div>
              </div>
            </div>

            <div className='text-right'>
              <div
                className='text-4xl font-bold mb-1'
                style={{ color: "#C3BCC2" }}
              >
                {stats?.totalPrograms || 0}
              </div>
              <div
                className='text-sm'
                style={{ color: "#ABA4AA" }}
              >
                Programs Created
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      {stats && (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-12'>
          <div
            className='rounded-xl p-6 transform hover:scale-105 transition-all duration-300 shadow-xl border relative overflow-hidden group'
            style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
          >
            <div
              className='absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300'
              style={{
                background: "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
              }}
            />
            <div className='relative flex items-center justify-between'>
              <div>
                <p
                  className='text-sm font-medium mb-1'
                  style={{ color: "#ABA4AA" }}
                >
                  Total Programs
                </p>
                <p
                  className='text-3xl font-bold mb-1'
                  style={{ color: "#C3BCC2" }}
                >
                  {stats.totalPrograms}
                </p>
                <p
                  className='text-xs'
                  style={{ color: "#ABA4AA" }}
                >
                  Created Programs
                </p>
              </div>
              <div
                className='w-12 h-12 rounded-xl flex items-center justify-center'
                style={{ backgroundColor: "#4A5A70" }}
              >
                <BookOpen
                  className='h-6 w-6'
                  style={{ color: "#C3BCC2" }}
                />
              </div>
            </div>
          </div>

          <div
            className='rounded-xl p-6 transform hover:scale-105 transition-all duration-300 shadow-xl border relative overflow-hidden group'
            style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
          >
            <div
              className='absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300'
              style={{
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
              }}
            />
            <div className='relative flex items-center justify-between'>
              <div>
                <p
                  className='text-sm font-medium mb-1'
                  style={{ color: "#ABA4AA" }}
                >
                  Total Assignments
                </p>
                <p
                  className='text-3xl font-bold mb-1'
                  style={{ color: "#C3BCC2" }}
                >
                  {stats.totalAssignments}
                </p>
                <p
                  className='text-xs'
                  style={{ color: "#ABA4AA" }}
                >
                  Client Assignments
                </p>
              </div>
              <div
                className='w-12 h-12 rounded-xl flex items-center justify-center'
                style={{ backgroundColor: "#10B981" }}
              >
                <Users
                  className='h-6 w-6'
                  style={{ color: "#C3BCC2" }}
                />
              </div>
            </div>
          </div>

          <div
            className='rounded-xl p-6 transform hover:scale-105 transition-all duration-300 shadow-xl border relative overflow-hidden group'
            style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
          >
            <div
              className='absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300'
              style={{
                background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
              }}
            />
            <div className='relative flex items-center justify-between'>
              <div>
                <p
                  className='text-sm font-medium mb-1'
                  style={{ color: "#ABA4AA" }}
                >
                  Completion Rate
                </p>
                <p
                  className='text-3xl font-bold mb-1'
                  style={{ color: "#C3BCC2" }}
                >
                  {stats.completionRate}%
                </p>
                <p
                  className='text-xs'
                  style={{ color: "#ABA4AA" }}
                >
                  Average Completion
                </p>
              </div>
              <div
                className='w-12 h-12 rounded-xl flex items-center justify-center'
                style={{ backgroundColor: "#F59E0B" }}
              >
                <TrendingUp
                  className='h-6 w-6'
                  style={{ color: "#C3BCC2" }}
                />
              </div>
            </div>
          </div>

          <div
            className='rounded-xl p-6 transform hover:scale-105 transition-all duration-300 shadow-xl border relative overflow-hidden group'
            style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
          >
            <div
              className='absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300'
              style={{
                background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
              }}
            />
            <div className='relative flex items-center justify-between'>
              <div>
                <p
                  className='text-sm font-medium mb-1'
                  style={{ color: "#ABA4AA" }}
                >
                  Active Programs
                </p>
                <p
                  className='text-3xl font-bold mb-1'
                  style={{ color: "#C3BCC2" }}
                >
                  {stats.activePrograms}
                </p>
                <p
                  className='text-xs'
                  style={{ color: "#ABA4AA" }}
                >
                  Currently Active
                </p>
              </div>
              <div
                className='w-12 h-12 rounded-xl flex items-center justify-center'
                style={{ backgroundColor: "#DC2626" }}
              >
                <Clock
                  className='h-6 w-6'
                  style={{ color: "#C3BCC2" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Search and Filters */}
      <div
        className='rounded-xl p-6 mb-8 shadow-xl border relative overflow-hidden'
        style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
      >
        <div
          className='absolute inset-0 opacity-5'
          style={{
            background: "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
          }}
        />
        <div className='relative flex flex-col md:flex-row gap-6 items-center justify-between'>
          {/* Search */}
          <div className='relative flex-1 max-w-md'>
            <Search
              className='absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5'
              style={{ color: "#606364" }}
            />
            <input
              type='text'
              placeholder='Search programs...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-300'
              style={{
                backgroundColor: "#606364",
                borderColor: "#ABA4AA",
                color: "#C3BCC2",
              }}
            />
          </div>

          {/* Filters */}
          <div className='flex gap-4 items-center'>
            <div className='relative'>
              <Award
                className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4'
                style={{ color: "#606364" }}
              />
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className='pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-300 appearance-none text-center'
                style={{
                  backgroundColor: "#606364",
                  borderColor: "#ABA4AA",
                  color: "#C3BCC2",
                }}
              >
                <option value='All'>All Levels</option>
                <option value='Beginner'>Beginner</option>
                <option value='Intermediate'>Intermediate</option>
                <option value='Advanced'>Advanced</option>
              </select>
            </div>

            <div className='relative'>
              <Filter
                className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4'
                style={{ color: "#606364" }}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className='pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-300 appearance-none text-center'
                style={{
                  backgroundColor: "#606364",
                  borderColor: "#ABA4AA",
                  color: "#C3BCC2",
                }}
              >
                <option value='All'>All Status</option>
                <option value='DRAFT'>Draft</option>
                <option value='ACTIVE'>Active</option>
                <option value='ARCHIVED'>Archived</option>
              </select>
            </div>

            <div
              className='flex rounded-xl border overflow-hidden'
              style={{ borderColor: "#606364" }}
            >
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-3 transition-all duration-300 flex items-center justify-center gap-2 ${
                  viewMode === "grid" ? "font-medium" : ""
                }`}
                style={{
                  backgroundColor:
                    viewMode === "grid" ? "#4A5A70" : "transparent",
                  color: "#C3BCC2",
                }}
              >
                <Grid3X3 className='h-4 w-4' />
                Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-3 transition-all duration-300 flex items-center justify-center gap-2 ${
                  viewMode === "list" ? "font-medium" : ""
                }`}
                style={{
                  backgroundColor:
                    viewMode === "list" ? "#4A5A70" : "transparent",
                  color: "#C3BCC2",
                }}
              >
                <List className='h-4 w-4' />
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h2
            className='text-2xl font-bold mb-2'
            style={{ color: "#C3BCC2" }}
          >
            Training Programs
          </h2>
          <p style={{ color: "#ABA4AA" }}>
            {filteredPrograms.length}{" "}
            {filteredPrograms.length === 1 ? "program" : "programs"} found
          </p>
        </div>

        <div className='flex gap-3'>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className='flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-medium'
            style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#606364"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#4A5A70"
            }}
          >
            <Plus className='h-5 w-5' />
            Create Program
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className='flex'>
        {/* Programs Grid/List */}
        <div className='flex-1 p-6'>
          {filteredPrograms.length === 0 ? (
            <div
              className='flex flex-col items-center justify-center h-96 rounded-2xl shadow-xl border relative overflow-hidden'
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div
                className='absolute inset-0 opacity-5'
                style={{
                  background:
                    "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
                }}
              />
              <div className='relative text-center'>
                <div
                  className='w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6'
                  style={{ backgroundColor: "#4A5A70" }}
                >
                  <BookOpen
                    className='h-10 w-10'
                    style={{ color: "#C3BCC2" }}
                  />
                </div>
                <h3
                  className='text-2xl font-bold mb-3'
                  style={{ color: "#C3BCC2" }}
                >
                  No programs found
                </h3>
                <p
                  className='text-center mb-8 max-w-md'
                  style={{ color: "#ABA4AA" }}
                >
                  {searchTerm || levelFilter !== "All" || statusFilter !== "All"
                    ? "Try adjusting your search terms or filters"
                    : "Start building your programs by creating your first training program"}
                </p>
                <div className='flex justify-center'>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className='px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-medium'
                    style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#606364"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#4A5A70"
                    }}
                  >
                    Create First Program
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "gap-6",
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  : "space-y-4"
              )}
            >
              {filteredPrograms.map((program: any) => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  viewMode={viewMode}
                  onViewDetails={() => {
                    setSelectedProgram(program)
                    setIsDetailsDrawerOpen(true)
                  }}
                  onEdit={() => {
                    // Handle edit - navigate to edit page or open edit modal
                  }}
                  onAssign={() => {
                    setSelectedProgram(program)
                    setIsAssignModalOpen(true)
                  }}
                  onDelete={() =>
                    handleDeleteProgram(program.id, program.title)
                  }
                  onDuplicate={() => {
                    // Handle duplicate
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        {isRightSidebarOpen && (
          <div className='w-80 border-l border-gray-700 bg-[#2A3133] p-6'>
            <div className='space-y-6'>
              {/* Recently Assigned */}
              <div>
                <h3 className='text-lg font-semibold text-white mb-4'>
                  Recently Assigned
                </h3>
                <div className='space-y-3'>
                  {(programs || [])
                    .filter((p) => (p.assignments?.length || 0) > 0)
                    .slice(0, 5)
                    .map((program) => (
                      <div
                        key={program?.id || Math.random()}
                        className='flex items-center space-x-3 p-3 bg-[#3A4245] rounded-lg'
                      >
                        <div className='flex-1 min-w-0'>
                          <p className='text-sm font-medium text-white truncate'>
                            {program?.title || "Untitled Program"}
                          </p>
                          <p className='text-xs text-gray-400'>
                            {program?.assignments?.length || 0} client
                            {(program?.assignments?.length || 0) !== 1
                              ? "s"
                              : ""}
                          </p>
                        </div>
                        <Badge
                          variant='outline'
                          className={getStatusColor(program?.status || "DRAFT")}
                        >
                          {program?.status || "DRAFT"}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>

              <Separator className='bg-gray-600' />

              {/* Drafts */}
              <div>
                <h3 className='text-lg font-semibold text-white mb-4'>
                  Drafts
                </h3>
                <div className='space-y-3'>
                  {(programs || [])
                    .filter((p) => p?.status === "DRAFT")
                    .slice(0, 3)
                    .map((program) => (
                      <div
                        key={program?.id || Math.random()}
                        className='flex items-center space-x-3 p-3 bg-[#3A4245] rounded-lg'
                      >
                        <div className='flex-1 min-w-0'>
                          <p className='text-sm font-medium text-white truncate'>
                            {program?.title || "Untitled Program"}
                          </p>
                          <p className='text-xs text-gray-400'>
                            {program?.weeks?.length || 0} week
                            {(program?.weeks?.length || 0) !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <Button
                          size='sm'
                          variant='outline'
                          className='text-xs'
                        >
                          Continue
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals and Drawers */}
      <CreateProgramModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProgram}
      />

      <AssignProgramModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSubmit={handleAssignProgram}
        program={selectedProgram}
        clients={clients}
      />

      <ProgramDetailsDrawer
        isOpen={isDetailsDrawerOpen}
        onClose={() => setIsDetailsDrawerOpen(false)}
        program={selectedProgram}
      />
    </Sidebar>
  )
}

// Program Card Component
function ProgramCard({
  program,
  viewMode,
  onViewDetails,
  onEdit,
  onAssign,
  onDelete,
  onDuplicate,
}: {
  program: Program
  viewMode: "grid" | "list"
  onViewDetails: () => void
  onEdit: () => void
  onAssign: () => void
  onDelete: () => void
  onDuplicate: () => void
}) {
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

  if (viewMode === "list") {
    return (
      <div
        className='rounded-xl shadow-lg p-4 border transition-all duration-300 transform hover:-translate-y-1 cursor-pointer relative overflow-hidden group'
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#606364"
          e.currentTarget.style.borderColor = "#ABA4AA"
          e.currentTarget.style.boxShadow = "0 6px 15px rgba(0, 0, 0, 0.2)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#353A3A"
          e.currentTarget.style.borderColor = "#606364"
          e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)"
        }}
      >
        <div
          className='absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300'
          style={{
            background: "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
          }}
        />

        <div className='relative flex items-center gap-4'>
          <div
            className='w-16 h-16 rounded-xl flex items-center justify-center text-xl flex-shrink-0 overflow-hidden relative'
            style={{ backgroundColor: "#606364" }}
          >
            <Target
              className='h-8 w-8'
              style={{ color: "#C3BCC2" }}
            />
          </div>

          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 mb-2'>
              <span
                className='px-2 py-0.5 text-xs font-medium rounded-full'
                style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
              >
                {program.sport}
              </span>
              <span
                className='px-2 py-0.5 text-xs rounded-full border'
                style={{
                  backgroundColor: "transparent",
                  borderColor: "#606364",
                  color: "#ABA4AA",
                }}
              >
                {program.level}
              </span>
              <span
                className='px-2 py-0.5 text-xs rounded-full'
                style={{
                  backgroundColor:
                    program.status === "ACTIVE"
                      ? "#10B981"
                      : program.status === "DRAFT"
                      ? "#F59E0B"
                      : "#6B7280",
                  color: "#C3BCC2",
                }}
              >
                {program.status}
              </span>
            </div>

            <h3
              className='text-base font-bold mb-1 line-clamp-1'
              style={{ color: "#C3BCC2" }}
            >
              {program.title}
            </h3>

            <p
              className='text-sm mb-2 line-clamp-1'
              style={{ color: "#ABA4AA" }}
            >
              {program.description}
            </p>

            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-1'>
                <Calendar
                  className='h-3 w-3'
                  style={{ color: "#ABA4AA" }}
                />
                <span
                  style={{ color: "#ABA4AA" }}
                  className='text-xs'
                >
                  {program.duration} weeks
                </span>
              </div>

              <div className='flex items-center gap-1'>
                <Users
                  className='h-3 w-3'
                  style={{ color: "#ABA4AA" }}
                />
                <span
                  style={{ color: "#ABA4AA" }}
                  className='text-xs'
                >
                  {program.totalAssignments} assigned
                </span>
              </div>

              <div className='flex items-center gap-1'>
                <TrendingUp
                  className='h-3 w-3'
                  style={{ color: "#ABA4AA" }}
                />
                <span
                  style={{ color: "#ABA4AA" }}
                  className='text-xs'
                >
                  {program.completionRate}% completion
                </span>
              </div>
            </div>
          </div>

          <div className='flex gap-2'>
            <button
              onClick={onViewDetails}
              className='p-2 rounded-lg transition-all duration-300 transform hover:scale-110'
              style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#606364"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#4A5A70"
              }}
            >
              <Eye className='h-4 w-4' />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className='p-2 rounded-lg transition-all duration-300 transform hover:scale-110'
                  style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#606364"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#4A5A70"
                  }}
                >
                  <MoreHorizontal className='h-4 w-4' />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='bg-[#353A3A] border-gray-600'
                style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
              >
                <DropdownMenuItem
                  onClick={onEdit}
                  className='text-white hover:bg-[#606364]'
                >
                  <Edit className='h-4 w-4 mr-2' />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onAssign}
                  className='text-white hover:bg-[#606364]'
                >
                  <Users className='h-4 w-4 mr-2' />
                  Assign
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDuplicate}
                  className='text-white hover:bg-[#606364]'
                >
                  <Copy className='h-4 w-4 mr-2' />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator className='bg-gray-600' />
                <DropdownMenuItem
                  onClick={onDelete}
                  className='text-red-400 hover:bg-red-400/10'
                >
                  <Trash2 className='h-4 w-4 mr-2' />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className='rounded-xl shadow-lg border transition-all duration-300 transform hover:-translate-y-1 cursor-pointer relative overflow-hidden group'
      style={{
        backgroundColor: "#353A3A",
        borderColor: "#606364",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#606364"
        e.currentTarget.style.borderColor = "#ABA4AA"
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.25)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#353A3A"
        e.currentTarget.style.borderColor = "#606364"
        e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)"
      }}
    >
      <div
        className='absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300'
        style={{
          background: "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
        }}
      />

      <div className='relative'>
        <div
          className='h-32 rounded-t-xl flex items-center justify-center overflow-hidden relative'
          style={{ backgroundColor: "#606364" }}
        >
          <Target
            className='h-12 w-12'
            style={{ color: "#C3BCC2" }}
          />

          {/* Play overlay */}
          <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center'>
            <div
              className='w-10 h-10 rounded-full flex items-center justify-center'
              style={{ backgroundColor: "#4A5A70" }}
            >
              <Eye
                className='h-5 w-5'
                style={{ color: "#C3BCC2" }}
              />
            </div>
          </div>
        </div>

        <div className='p-4'>
          <div className='flex items-center justify-between mb-2'>
            <span
              className='px-2 py-0.5 text-xs font-medium rounded-full'
              style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
            >
              {program.sport}
            </span>
            <div className='flex items-center gap-1'>
              <span
                className='px-2 py-0.5 text-xs rounded-full'
                style={{
                  backgroundColor:
                    program.status === "ACTIVE"
                      ? "#10B981"
                      : program.status === "DRAFT"
                      ? "#F59E0B"
                      : "#6B7280",
                  color: "#C3BCC2",
                }}
              >
                {program.status}
              </span>
            </div>
          </div>

          <h3
            className='text-sm font-bold mb-2 line-clamp-1'
            style={{ color: "#C3BCC2" }}
          >
            {program.title}
          </h3>

          <p
            className='text-xs mb-3 line-clamp-2'
            style={{ color: "#ABA4AA" }}
          >
            {program.description}
          </p>

          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-1'>
                <Calendar
                  className='h-3 w-3'
                  style={{ color: "#ABA4AA" }}
                />
                <span
                  style={{ color: "#ABA4AA" }}
                  className='text-xs'
                >
                  {program.duration}w
                </span>
              </div>
              <div className='flex items-center gap-1'>
                <Users
                  className='h-3 w-3'
                  style={{ color: "#ABA4AA" }}
                />
                <span
                  style={{ color: "#ABA4AA" }}
                  className='text-xs'
                >
                  {program.totalAssignments}
                </span>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className='p-1.5 rounded-lg transition-all duration-300 transform hover:scale-110'
                  style={{ color: "#ABA4AA" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#C3BCC2"
                    e.currentTarget.style.backgroundColor = "#606364"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#ABA4AA"
                    e.currentTarget.style.backgroundColor = "transparent"
                  }}
                >
                  <MoreHorizontal className='h-3 w-3' />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='bg-[#353A3A] border-gray-600'
                style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
              >
                <DropdownMenuItem
                  onClick={onViewDetails}
                  className='text-white hover:bg-[#606364]'
                >
                  <Eye className='h-4 w-4 mr-2' />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onEdit}
                  className='text-white hover:bg-[#606364]'
                >
                  <Edit className='h-4 w-4 mr-2' />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onAssign}
                  className='text-white hover:bg-[#606364]'
                >
                  <Users className='h-4 w-4 mr-2' />
                  Assign
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDuplicate}
                  className='text-white hover:bg-[#606364]'
                >
                  <Copy className='h-4 w-4 mr-2' />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator className='bg-gray-600' />
                <DropdownMenuItem
                  onClick={onDelete}
                  className='text-red-400 hover:bg-red-400/10'
                >
                  <Trash2 className='h-4 w-4 mr-2' />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}
