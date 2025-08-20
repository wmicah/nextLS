"use client"

import { useState } from "react"
import { trpc } from "@/app/_trpc/client"
import {
  Plus,
  User,
  Calendar,
  Edit,
  Trash2,
  Clock,
  Search,
  Filter,
  Users,
  TrendingUp,
  Activity,
  Star,
  Sparkles,
  ArrowRight,
  Mail,
  Phone,
  Target,
  Award,
  Dumbbell,
  BookOpen,
  Eye,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { format } from "date-fns"
import AddClientModal from "./AddClientModal"
import Sidebar from "./Sidebar"
import ClientScheduler from "./ClientScheduler"

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  coachId: string | null
  createdAt: string
  updatedAt: string
  nextLessonDate: string | null
  lastCompletedWorkout: string | null
  avatar: string | null
  dueDate: string | null
  lastActivity: string | null
  updates: string | null
  userId?: string | null
}

export default function ClientsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedForSchedule, setSelectedForSchedule] = useState<{
    userId: string
    name: string
  } | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const { data: clients = [], isLoading, error } = trpc.clients.list.useQuery()
  const utils = trpc.useUtils()

  const deleteClient = trpc.clients.delete.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate()
      setDeletingClientId(null)
    },
    onError: (error) => {
      console.error("Failed to delete client:", error)
      setDeletingClientId(null)
    },
  })

  const handleDeleteClient = (clientId: string, clientName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${clientName}? This action cannot be undone.`
      )
    ) {
      setDeletingClientId(clientId)
      deleteClient.mutate({ id: clientId })
    }
  }

  // Filter and sort clients
  const filteredAndSortedClients = clients
    .filter(
      (client: Client) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.email &&
          client.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a: Client, b: Client) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case "createdAt":
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        case "nextLesson":
          aValue = a.nextLessonDate ? new Date(a.nextLessonDate) : new Date(0)
          bValue = b.nextLessonDate ? new Date(b.nextLessonDate) : new Date(0)
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  // Calculate stats
  const totalClients = clients.length
  const activeClients = clients.filter((c: Client) => c.nextLessonDate).length
  const recentClients = clients.filter((c: Client) => {
    const createdAt = new Date(c.createdAt)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return createdAt > thirtyDaysAgo
  }).length

  if (isLoading) {
    return (
      <Sidebar>
        <div className='flex items-center justify-center h-64'>
          <div
            className='animate-spin rounded-full h-8 w-8 border-b-2'
            style={{ borderColor: "#4A5A70" }}
          ></div>
        </div>
      </Sidebar>
    )
  }

  if (error) {
    return (
      <Sidebar>
        <div className='flex items-center justify-center h-64'>
          <p className='text-red-400'>Error loading clients: {error.message}</p>
        </div>
      </Sidebar>
    )
  }

  return (
    <Sidebar>
      {selectedForSchedule ? (
        <>
          <div className='mb-6'>
            <button
              onClick={() => setSelectedForSchedule(null)}
              className='px-4 py-2 rounded-lg border'
              style={{
                backgroundColor: "#353A3A",
                borderColor: "#606364",
                color: "#C3BCC2",
              }}
            >
              Back to Clients
            </button>
          </div>
          <ClientScheduler
            clientId={selectedForSchedule.userId}
            clientName={selectedForSchedule.name}
          />
        </>
      ) : (
        <div
          className='min-h-screen'
          style={{ backgroundColor: "#2A3133" }}
        >
          {/* Hero Header */}
          <div className='mb-8'>
            <div className='rounded-2xl border relative overflow-hidden group'>
              <div
                className='absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300'
                style={{
                  background:
                    "linear-gradient(135deg, #4A5A70 0%, #606364 50%, #353A3A 100%)",
                }}
              />
              <div className='relative p-8 bg-gradient-to-r from-transparent via-black/20 to-black/40'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-4'>
                    <div
                      className='w-12 h-12 rounded-xl flex items-center justify-center'
                      style={{ backgroundColor: "#4A5A70" }}
                    >
                      <Users
                        className='h-6 w-6'
                        style={{ color: "#C3BCC2" }}
                      />
                    </div>
                    <div>
                      <h1
                        className='text-4xl font-bold mb-2'
                        style={{ color: "#C3BCC2" }}
                      >
                        Your Athletes
                      </h1>
                      <p
                        className='flex items-center gap-2 text-lg'
                        style={{ color: "#ABA4AA" }}
                      >
                        <Sparkles className='h-5 w-5 text-yellow-400' />
                        {totalClients > 0
                          ? `Managing ${totalClients} ${
                              totalClients === 1 ? "athlete" : "athletes"
                            }`
                          : "Ready to build your coaching team"}
                      </p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div
                      className='text-2xl font-bold'
                      style={{ color: "#C3BCC2" }}
                    >
                      {new Date().toLocaleDateString()}
                    </div>
                    <div
                      className='text-sm'
                      style={{ color: "#ABA4AA" }}
                    >
                      {new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            <div
              className='rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group'
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#3A4040"
                e.currentTarget.style.borderColor = "#4A5A70"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#353A3A"
                e.currentTarget.style.borderColor = "#606364"
              }}
            >
              <div
                className='absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300'
                style={{
                  background:
                    "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
                }}
              />
              <div className='relative p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <div
                    className='w-12 h-12 rounded-xl flex items-center justify-center'
                    style={{ backgroundColor: "#4A5A70" }}
                  >
                    <Users
                      className='h-6 w-6'
                      style={{ color: "#C3BCC2" }}
                    />
                  </div>
                  <TrendingUp className='h-5 w-5 text-green-400' />
                </div>
                <div>
                  <p
                    className='text-sm font-medium mb-1'
                    style={{ color: "#ABA4AA" }}
                  >
                    Total Athletes
                  </p>
                  <p
                    className='text-3xl font-bold mb-1'
                    style={{ color: "#C3BCC2" }}
                  >
                    {totalClients}
                  </p>
                  <p
                    className='text-xs'
                    style={{ color: "#ABA4AA" }}
                  >
                    {totalClients > 0 ? "Your coaching team" : "Start building"}
                  </p>
                </div>
              </div>
            </div>

            <div
              className='rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group'
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#3A4040"
                e.currentTarget.style.borderColor = "#4A5A70"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#353A3A"
                e.currentTarget.style.borderColor = "#606364"
              }}
            >
              <div
                className='absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300'
                style={{
                  background:
                    "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)",
                }}
              />
              <div className='relative p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <div
                    className='w-12 h-12 rounded-xl flex items-center justify-center'
                    style={{ backgroundColor: "#DC2626" }}
                  >
                    <Calendar
                      className='h-6 w-6'
                      style={{ color: "#C3BCC2" }}
                    />
                  </div>
                  <Activity className='h-5 w-5 text-red-400' />
                </div>
                <div>
                  <p
                    className='text-sm font-medium mb-1'
                    style={{ color: "#ABA4AA" }}
                  >
                    Active Athletes
                  </p>
                  <p
                    className='text-3xl font-bold mb-1'
                    style={{ color: "#C3BCC2" }}
                  >
                    {activeClients}
                  </p>
                  <p
                    className='text-xs'
                    style={{ color: "#ABA4AA" }}
                  >
                    {activeClients > 0
                      ? "With scheduled lessons"
                      : "Schedule now"}
                  </p>
                </div>
              </div>
            </div>

            <div
              className='rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group'
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#3A4040"
                e.currentTarget.style.borderColor = "#4A5A70"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#353A3A"
                e.currentTarget.style.borderColor = "#606364"
              }}
            >
              <div
                className='absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300'
                style={{
                  background:
                    "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
                }}
              />
              <div className='relative p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <div
                    className='w-12 h-12 rounded-xl flex items-center justify-center'
                    style={{ backgroundColor: "#10B981" }}
                  >
                    <Star
                      className='h-6 w-6'
                      style={{ color: "#C3BCC2" }}
                    />
                  </div>
                  <TrendingUp className='h-5 w-5 text-green-400' />
                </div>
                <div>
                  <p
                    className='text-sm font-medium mb-1'
                    style={{ color: "#ABA4AA" }}
                  >
                    Recent Additions
                  </p>
                  <p
                    className='text-3xl font-bold mb-1'
                    style={{ color: "#C3BCC2" }}
                  >
                    {recentClients}
                  </p>
                  <p
                    className='text-xs'
                    style={{ color: "#ABA4AA" }}
                  >
                    {recentClients > 0 ? "Last 30 days" : "No recent additions"}
                  </p>
                </div>
              </div>
            </div>

            <div
              className='rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group'
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#3A4040"
                e.currentTarget.style.borderColor = "#4A5A70"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#353A3A"
                e.currentTarget.style.borderColor = "#606364"
              }}
            >
              <div
                className='absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300'
                style={{
                  background:
                    "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
                }}
              />
              <div className='relative p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <div
                    className='w-12 h-12 rounded-xl flex items-center justify-center'
                    style={{ backgroundColor: "#F59E0B" }}
                  >
                    <Award
                      className='h-6 w-6'
                      style={{ color: "#C3BCC2" }}
                    />
                  </div>
                  <Star className='h-5 w-5 text-yellow-400' />
                </div>
                <div>
                  <p
                    className='text-sm font-medium mb-1'
                    style={{ color: "#ABA4AA" }}
                  >
                    Avg. Rating
                  </p>
                  <p
                    className='text-3xl font-bold mb-1'
                    style={{ color: "#C3BCC2" }}
                  >
                    4.8
                  </p>
                  <p
                    className='text-xs'
                    style={{ color: "#ABA4AA" }}
                  >
                    Excellent feedback
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div
            className='rounded-2xl shadow-xl border mb-8 relative overflow-hidden group'
            style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
          >
            <div
              className='absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300'
              style={{
                background: "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
              }}
            />
            <div className='relative p-6'>
              <div className='flex flex-col lg:flex-row gap-4 items-center justify-between'>
                <div className='flex-1 max-w-md'>
                  <div className='relative'>
                    <Search
                      className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4'
                      style={{ color: "#ABA4AA" }}
                    />
                    <input
                      type='text'
                      placeholder='Search athletes...'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className='w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300'
                      style={{
                        backgroundColor: "#2A3133",
                        borderColor: "#606364",
                        color: "#C3BCC2",
                      }}
                    />
                  </div>
                </div>

                <div className='flex items-center gap-4'>
                  <div className='flex items-center gap-2'>
                    <Filter
                      className='h-4 w-4'
                      style={{ color: "#ABA4AA" }}
                    />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className='px-3 py-2 rounded-lg border appearance-none cursor-pointer'
                      style={{
                        backgroundColor: "#2A3133",
                        borderColor: "#606364",
                        color: "#C3BCC2",
                      }}
                    >
                      <option value='name'>Sort by Name</option>
                      <option value='createdAt'>Sort by Date Added</option>
                      <option value='nextLesson'>Sort by Next Lesson</option>
                    </select>
                    <button
                      onClick={() =>
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                      }
                      className='p-2 rounded-lg transition-all duration-300'
                      style={{ color: "#ABA4AA" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#C3BCC2"
                        e.currentTarget.style.backgroundColor = "#3A4040"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#ABA4AA"
                        e.currentTarget.style.backgroundColor = "transparent"
                      }}
                    >
                      {sortOrder === "asc" ? (
                        <ChevronUp className='h-4 w-4' />
                      ) : (
                        <ChevronDown className='h-4 w-4' />
                      )}
                    </button>
                  </div>

                  <div
                    className='flex items-center gap-2 border rounded-xl'
                    style={{ borderColor: "#606364" }}
                  >
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-l-xl transition-all duration-300 ${
                        viewMode === "grid" ? "bg-blue-600 text-white" : ""
                      }`}
                      style={{
                        color: viewMode === "grid" ? "#FFFFFF" : "#ABA4AA",
                        backgroundColor:
                          viewMode === "grid" ? "#2563EB" : "transparent",
                      }}
                    >
                      <div className='w-4 h-4 grid grid-cols-2 gap-0.5'>
                        <div
                          className='w-1.5 h-1.5 rounded-sm'
                          style={{ backgroundColor: "currentColor" }}
                        ></div>
                        <div
                          className='w-1.5 h-1.5 rounded-sm'
                          style={{ backgroundColor: "currentColor" }}
                        ></div>
                        <div
                          className='w-1.5 h-1.5 rounded-sm'
                          style={{ backgroundColor: "currentColor" }}
                        ></div>
                        <div
                          className='w-1.5 h-1.5 rounded-sm'
                          style={{ backgroundColor: "currentColor" }}
                        ></div>
                      </div>
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-r-xl transition-all duration-300 ${
                        viewMode === "list" ? "bg-blue-600 text-white" : ""
                      }`}
                      style={{
                        color: viewMode === "list" ? "#FFFFFF" : "#ABA4AA",
                        backgroundColor:
                          viewMode === "list" ? "#2563EB" : "transparent",
                      }}
                    >
                      <div className='w-4 h-4 flex flex-col gap-0.5'>
                        <div
                          className='w-full h-1 rounded-sm'
                          style={{ backgroundColor: "currentColor" }}
                        ></div>
                        <div
                          className='w-full h-1 rounded-sm'
                          style={{ backgroundColor: "currentColor" }}
                        ></div>
                        <div
                          className='w-full h-1 rounded-sm'
                          style={{ backgroundColor: "currentColor" }}
                        ></div>
                      </div>
                    </button>
                  </div>

                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className='flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-medium border'
                    style={{
                      backgroundColor: "#4A5A70",
                      color: "#C3BCC2",
                      borderColor: "#606364",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#606364"
                      e.currentTarget.style.borderColor = "#ABA4AA"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#4A5A70"
                      e.currentTarget.style.borderColor = "#606364"
                    }}
                  >
                    <Plus className='h-5 w-5' />
                    Add Athlete
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Header */}
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h2
                className='text-2xl font-bold flex items-center gap-3 mb-2'
                style={{ color: "#C3BCC2" }}
              >
                <div
                  className='w-8 h-8 rounded-lg flex items-center justify-center'
                  style={{ backgroundColor: "#4A5A70" }}
                >
                  <Users
                    className='h-4 w-4'
                    style={{ color: "#C3BCC2" }}
                  />
                </div>
                Athletes
              </h2>
              <p
                className='flex items-center gap-2'
                style={{ color: "#ABA4AA" }}
              >
                <Clock className='h-4 w-4' />
                {filteredAndSortedClients.length} of {totalClients}{" "}
                {totalClients === 1 ? "athlete" : "athletes"}
                {searchTerm && ` matching "${searchTerm}"`}
              </p>
            </div>
          </div>

          {/* Enhanced Athletes List/Grid */}
          {filteredAndSortedClients.length === 0 ? (
            <div
              className='rounded-2xl shadow-xl border text-center relative overflow-hidden group'
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div
                className='absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300'
                style={{
                  background:
                    "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
                }}
              />
              <div className='relative p-12'>
                <div
                  className='w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6'
                  style={{ backgroundColor: "#4A5A70" }}
                >
                  <Users
                    className='h-10 w-10'
                    style={{ color: "#C3BCC2" }}
                  />
                </div>
                <h3
                  className='text-2xl font-bold mb-3'
                  style={{ color: "#C3BCC2" }}
                >
                  {searchTerm
                    ? "No athletes found"
                    : "Ready to Start Coaching?"}
                </h3>
                <p
                  className='mb-8 max-w-md mx-auto text-lg'
                  style={{ color: "#ABA4AA" }}
                >
                  {searchTerm
                    ? `No athletes match "${searchTerm}". Try a different search term.`
                    : "Add your first athlete to begin building your coaching career and transforming lives."}
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className='flex items-center gap-2 px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-medium mx-auto border'
                  style={{
                    backgroundColor: "#4A5A70",
                    color: "#C3BCC2",
                    borderColor: "#606364",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#606364"
                    e.currentTarget.style.boxShadow =
                      "0 10px 25px rgba(0, 0, 0, 0.3)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#4A5A70"
                    e.currentTarget.style.boxShadow =
                      "0 4px 15px rgba(0, 0, 0, 0.2)"
                  }}
                >
                  <Plus className='h-5 w-5' />
                  {searchTerm ? "Add New Athlete" : "Add Your First Athlete"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Grid View Container */}
              <div
                className={`transition-all duration-500 ease-in-out ${
                  viewMode === "grid"
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-95 pointer-events-none"
                }`}
                style={{
                  transform:
                    viewMode === "grid" ? "translateY(0)" : "translateY(20px)",
                }}
              >
                {viewMode === "grid" && (
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {filteredAndSortedClients.map(
                      (client: Client, index: number) => (
                        <div
                          key={client.id}
                          className='rounded-2xl shadow-xl border transition-all duration-500 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group'
                          style={{
                            backgroundColor: "#353A3A",
                            borderColor: "#606364",
                            animationDelay: `${index * 100}ms`,
                            animation: "fadeInUp 0.6s ease-out forwards",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#3A4040"
                            e.currentTarget.style.borderColor = "#4A5A70"
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#353A3A"
                            e.currentTarget.style.borderColor = "#606364"
                          }}
                        >
                          <div
                            className='absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300'
                            style={{
                              background:
                                "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
                            }}
                          />
                          <div className='relative p-6'>
                            <div className='flex items-center justify-between mb-4'>
                              <div
                                className='w-12 h-12 rounded-xl flex items-center justify-center'
                                style={{ backgroundColor: "#4A5A70" }}
                              >
                                <User
                                  className='h-6 w-6'
                                  style={{ color: "#C3BCC2" }}
                                />
                              </div>
                              <div className='flex items-center gap-1'>
                                <button
                                  className='p-2 rounded-xl transition-all duration-300 transform hover:scale-110'
                                  style={{ color: "#ABA4AA" }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = "#C3BCC2"
                                    e.currentTarget.style.backgroundColor =
                                      "#3A4040"
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = "#ABA4AA"
                                    e.currentTarget.style.backgroundColor =
                                      "transparent"
                                  }}
                                >
                                  <Edit className='h-4 w-4' />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteClient(client.id, client.name)
                                  }}
                                  disabled={deletingClientId === client.id}
                                  className='p-2 rounded-xl transition-all duration-300 transform hover:scale-110 disabled:opacity-50'
                                  style={{ color: "#ABA4AA" }}
                                  onMouseEnter={(e) => {
                                    if (!e.currentTarget.disabled) {
                                      e.currentTarget.style.color = "#EF4444"
                                      e.currentTarget.style.backgroundColor =
                                        "#3A4040"
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!e.currentTarget.disabled) {
                                      e.currentTarget.style.color = "#ABA4AA"
                                      e.currentTarget.style.backgroundColor =
                                        "transparent"
                                    }
                                  }}
                                >
                                  {deletingClientId === client.id ? (
                                    <div
                                      className='animate-spin rounded-full h-4 w-4 border-b-2'
                                      style={{ borderColor: "#EF4444" }}
                                    ></div>
                                  ) : (
                                    <Trash2 className='h-4 w-4' />
                                  )}
                                </button>
                              </div>
                            </div>
                            <div>
                              <h3
                                className='text-lg font-bold mb-2'
                                style={{ color: "#C3BCC2" }}
                              >
                                {client.name}
                              </h3>
                              <p
                                className='text-sm mb-3'
                                style={{ color: "#ABA4AA" }}
                              >
                                Added{" "}
                                {format(
                                  new Date(client.createdAt),
                                  "MMM d, yyyy"
                                )}
                              </p>
                              <div className='grid grid-cols-2 gap-3 mb-4'>
                                <div
                                  className='rounded-lg p-3'
                                  style={{ backgroundColor: "#3A4040" }}
                                >
                                  <p
                                    className='text-xs font-medium mb-1'
                                    style={{ color: "#ABA4AA" }}
                                  >
                                    Next Lesson
                                  </p>
                                  <p
                                    className='text-sm font-semibold'
                                    style={{ color: "#C3BCC2" }}
                                  >
                                    {client.nextLessonDate
                                      ? format(
                                          new Date(client.nextLessonDate),
                                          "MMM d"
                                        )
                                      : "Not scheduled"}
                                  </p>
                                </div>
                                <div
                                  className='rounded-lg p-3'
                                  style={{ backgroundColor: "#3A4040" }}
                                >
                                  <p
                                    className='text-xs font-medium mb-1'
                                    style={{ color: "#ABA4AA" }}
                                  >
                                    Last Workout
                                  </p>
                                  <p
                                    className='text-sm font-semibold truncate'
                                    style={{ color: "#C3BCC2" }}
                                  >
                                    {client.lastCompletedWorkout || "None"}
                                  </p>
                                </div>
                              </div>
                              <div className='flex items-center justify-between'>
                                <span
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium`}
                                  style={{
                                    backgroundColor: client.nextLessonDate
                                      ? "#10B981"
                                      : "#3A4040",
                                    color: client.nextLessonDate
                                      ? "#DCFCE7"
                                      : "#C3BCC2",
                                    borderColor: client.nextLessonDate
                                      ? "#059669"
                                      : "#4A5A70",
                                  }}
                                >
                                  {client.nextLessonDate
                                    ? "🔥 Active"
                                    : "💤 Available"}
                                </span>
                                <div className='flex items-center gap-1'>
                                  {client.email && (
                                    <button
                                      className='p-2 rounded-lg transition-all duration-300 transform hover:scale-110'
                                      style={{ color: "#ABA4AA" }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.color = "#C3BCC2"
                                        e.currentTarget.style.backgroundColor =
                                          "#3A4040"
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.color = "#ABA4AA"
                                        e.currentTarget.style.backgroundColor =
                                          "transparent"
                                      }}
                                      title={client.email}
                                    >
                                      <Mail className='h-3 w-3' />
                                    </button>
                                  )}
                                  {client.phone && (
                                    <button
                                      className='p-2 rounded-lg transition-all duration-300 transform hover:scale-110'
                                      style={{ color: "#ABA4AA" }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.color = "#C3BCC2"
                                        e.currentTarget.style.backgroundColor =
                                          "#3A4040"
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.color = "#ABA4AA"
                                        e.currentTarget.style.backgroundColor =
                                          "transparent"
                                      }}
                                      title={client.phone}
                                    >
                                      <Phone className='h-3 w-3' />
                                    </button>
                                  )}
                                  {client.userId && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedForSchedule({
                                          userId: client.userId!,
                                          name: client.name,
                                        })
                                      }}
                                      className='p-2 rounded-lg transition-all duration-300 transform hover:scale-110'
                                      style={{ color: "#ABA4AA" }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.color = "#C3BCC2"
                                        e.currentTarget.style.backgroundColor =
                                          "#3A4040"
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.color = "#ABA4AA"
                                        e.currentTarget.style.backgroundColor =
                                          "transparent"
                                      }}
                                      title='Schedule'
                                    >
                                      <Calendar className='h-3 w-3' />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* List View Container */}
              <div
                className={`transition-all duration-500 ease-in-out ${
                  viewMode === "list"
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-95 pointer-events-none"
                }`}
                style={{
                  transform:
                    viewMode === "list" ? "translateY(0)" : "translateY(20px)",
                }}
              >
                {viewMode === "list" && (
                  <div className='space-y-4'>
                    {filteredAndSortedClients.map(
                      (client: Client, index: number) => (
                        <div
                          key={client.id}
                          className='rounded-2xl shadow-xl border transition-all duration-500 transform hover:-translate-y-1 cursor-pointer relative overflow-hidden group'
                          style={{
                            backgroundColor: "#353A3A",
                            borderColor: "#606364",
                            animationDelay: `${index * 50}ms`,
                            animation: "fadeInUp 0.6s ease-out forwards",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#3A4040"
                            e.currentTarget.style.borderColor = "#4A5A70"
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#353A3A"
                            e.currentTarget.style.borderColor = "#606364"
                          }}
                        >
                          <div
                            className='absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300'
                            style={{
                              background:
                                "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
                            }}
                          />
                          <div className='relative p-6'>
                            <div className='flex items-center justify-between'>
                              <div className='flex items-center gap-4'>
                                <div
                                  className='w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg'
                                  style={{ backgroundColor: "#4A5A70" }}
                                >
                                  <span
                                    className='font-bold text-xl'
                                    style={{ color: "#C3BCC2" }}
                                  >
                                    {client.name
                                      .split(" ")
                                      .map((n: string) => n[0])
                                      .join("")
                                      .toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <h3
                                    className='text-xl font-bold mb-2'
                                    style={{ color: "#C3BCC2" }}
                                  >
                                    {client.name}
                                  </h3>
                                  <p
                                    className='text-sm mb-1'
                                    style={{ color: "#ABA4AA" }}
                                  >
                                    Added{" "}
                                    {format(
                                      new Date(client.createdAt),
                                      "MMM d, yyyy"
                                    )}
                                  </p>
                                  {client.email && (
                                    <p
                                      className='text-sm flex items-center gap-1'
                                      style={{ color: "#ABA4AA" }}
                                    >
                                      <Mail className='h-3 w-3' />
                                      {client.email}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className='flex items-center gap-2'>
                                <div className='text-right mr-4'>
                                  <p
                                    className='text-sm font-medium mb-1'
                                    style={{ color: "#ABA4AA" }}
                                  >
                                    Next Lesson
                                  </p>
                                  <p
                                    className='text-sm font-semibold'
                                    style={{ color: "#C3BCC2" }}
                                  >
                                    {client.nextLessonDate
                                      ? format(
                                          new Date(client.nextLessonDate),
                                          "MMM d, yyyy"
                                        )
                                      : "Not scheduled"}
                                  </p>
                                </div>
                                <div className='flex items-center gap-1'>
                                  {client.userId && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedForSchedule({
                                          userId: client.userId!,
                                          name: client.name,
                                        })
                                      }}
                                      className='p-2 rounded-xl transition-all duration-300 transform hover:scale-110'
                                      style={{ color: "#ABA4AA" }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.color = "#C3BCC2"
                                        e.currentTarget.style.backgroundColor =
                                          "#3A4040"
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.color = "#ABA4AA"
                                        e.currentTarget.style.backgroundColor =
                                          "transparent"
                                      }}
                                      title='Schedule'
                                    >
                                      <Calendar className='h-4 w-4' />
                                    </button>
                                  )}
                                  <button
                                    className='p-2 rounded-xl transition-all duration-300 transform hover:scale-110'
                                    style={{ color: "#ABA4AA" }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.color = "#C3BCC2"
                                      e.currentTarget.style.backgroundColor =
                                        "#3A4040"
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.color = "#ABA4AA"
                                      e.currentTarget.style.backgroundColor =
                                        "transparent"
                                    }}
                                  >
                                    <Edit className='h-4 w-4' />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteClient(client.id, client.name)
                                    }}
                                    disabled={deletingClientId === client.id}
                                    className='p-2 rounded-xl transition-all duration-300 transform hover:scale-110 disabled:opacity-50'
                                    style={{ color: "#ABA4AA" }}
                                    onMouseEnter={(e) => {
                                      if (!e.currentTarget.disabled) {
                                        e.currentTarget.style.color = "#EF4444"
                                        e.currentTarget.style.backgroundColor =
                                          "#3A4040"
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!e.currentTarget.disabled) {
                                        e.currentTarget.style.color = "#ABA4AA"
                                        e.currentTarget.style.backgroundColor =
                                          "transparent"
                                      }
                                    }}
                                  >
                                    {deletingClientId === client.id ? (
                                      <div
                                        className='animate-spin rounded-full h-4 w-4 border-b-2'
                                        style={{ borderColor: "#EF4444" }}
                                      ></div>
                                    ) : (
                                      <Trash2 className='h-4 w-4' />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddClient={() => {
          console.log("Client added successfully!")
        }}
      />
    </Sidebar>
  )
}
