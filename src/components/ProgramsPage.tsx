"use client"

import { useState, useCallback } from "react"
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
  Edit,
  Copy,
  Archive,
  Trash2,
  Eye,
  MoreHorizontal,
  Target,
  Award,
  BookOpen,
  Play,
  AlertCircle,
  Sparkles,
} from "lucide-react"
import Sidebar from "./Sidebar"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card"
import { Separator } from "./ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Alert, AlertDescription } from "./ui/alert"
import { Skeleton } from "./ui/skeleton"
import { useToast } from "@/lib/hooks/use-toast"
import { cn } from "@/lib/utils"
import CreateProgramModal from "./CreateProgramModal"
import AssignProgramModal from "./AssignProgramModal"
import ProgramDetailsModal from "./ProgramDetailsModal"

interface ProgramListItem {
  id: string
  title: string
  description: string | null
  activeClientCount: number
  createdAt: string
  updatedAt: string
}

export default function ProgramsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedProgram, setSelectedProgram] =
    useState<ProgramListItem | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  const debouncedSearch = useDebounce(searchTerm, 300)
  const { toast } = useToast()

  const {
    data: programs = [],
    isLoading,
    error,
  } = trpc.programs.list.useQuery()

  const { data: clients = [] } = trpc.clients.list.useQuery()
  const utils = trpc.useUtils()

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

  const filteredPrograms = (programs || []).filter(
    (program: ProgramListItem) => {
      const matchesSearch =
        program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (program.description &&
          program.description.toLowerCase().includes(searchTerm.toLowerCase()))

      return matchesSearch
    }
  )

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
                {programs.length}
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

          {/* View Mode Toggle */}
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
      <div className='p-6'>
        {filteredPrograms.length === 0 ? (
          <div
            className='flex flex-col items-center justify-center h-96 rounded-2xl shadow-xl border relative overflow-hidden'
            style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
          >
            <div
              className='absolute inset-0 opacity-5'
              style={{
                background: "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
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
                {searchTerm
                  ? "Try adjusting your search terms"
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
            {filteredPrograms.map((program: ProgramListItem) => (
              <ProgramCard
                key={program.id}
                program={program}
                viewMode={viewMode}
                onViewDetails={() => {
                  setSelectedProgram(program)
                  setIsDetailsModalOpen(true)
                }}
                onEdit={() => {
                  // Handle edit - navigate to edit page
                  window.location.href = `/programs/${program.id}`
                }}
                onAssign={() => {
                  setSelectedProgram(program)
                  setIsAssignModalOpen(true)
                }}
                onDelete={() => handleDeleteProgram(program.id, program.title)}
                onDuplicate={() => {
                  // Handle duplicate
                  toast({
                    title: "Coming soon",
                    description:
                      "Duplicate functionality will be implemented soon.",
                  })
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateProgramModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProgram}
      />

      {/* AssignProgramModal is not compatible with this usage - would need to be refactored */}

      {/* ProgramDetailsModal expects different Program interface - would need to be refactored */}
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
  program: ProgramListItem
  viewMode: "grid" | "list"
  onViewDetails: () => void
  onEdit: () => void
  onAssign: () => void
  onDelete: () => void
  onDuplicate: () => void
}) {
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
                <Users
                  className='h-3 w-3'
                  style={{ color: "#ABA4AA" }}
                />
                <span
                  style={{ color: "#ABA4AA" }}
                  className='text-xs'
                >
                  {program.activeClientCount} assigned
                </span>
              </div>

              <div className='flex items-center gap-1'>
                <Calendar
                  className='h-3 w-3'
                  style={{ color: "#ABA4AA" }}
                />
                <span
                  style={{ color: "#ABA4AA" }}
                  className='text-xs'
                >
                  {new Date(program.createdAt).toLocaleDateString()}
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
                <Users
                  className='h-3 w-3'
                  style={{ color: "#ABA4AA" }}
                />
                <span
                  style={{ color: "#ABA4AA" }}
                  className='text-xs'
                >
                  {program.activeClientCount}
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
