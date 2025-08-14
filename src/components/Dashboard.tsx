"use client"

import { useState } from "react"
import Link from "next/link"
import { trpc } from "@/app/_trpc/client"
import {
  Calendar,
  Dumbbell,
  User,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  Clock,
  Award,
  Target,
} from "lucide-react"
import {
  FiSettings,
  FiBell,
  FiMessageSquare,
  FiSearch,
  FiUsers,
  FiBookOpen,
  FiClipboard,
  FiCalendar,
} from "react-icons/fi"
import { format } from "date-fns"
import AddClientModal from "./AddClientModal"
import Sidebar from "./Sidebar"

export default function ClientsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null)

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

  const upcomingLessons = clients.filter((c: any) => c.nextLessonDate).length
  const activeWorkouts = clients.filter(
    (c: any) => c.lastCompletedWorkout
  ).length

  return (
    <Sidebar>
      {/* Dynamic Header with Greeting */}
      <div className='mb-8'>
        <div className='flex items-center justify-between'>
          <div>
            <h1
              className='text-4xl font-bold mb-2'
              style={{ color: "#C3BCC2" }}
            >
              Coach Dashboard
            </h1>
            <p
              className='flex items-center gap-2'
              style={{ color: "#ABA4AA" }}
            >
              <TrendingUp className='h-4 w-4 text-green-400' />
              {clients.length > 0
                ? `Growing strong with ${clients.length} ${
                    clients.length === 1 ? "athlete" : "athletes"
                  }`
                : "Ready to build your coaching empire"}
            </p>
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
              {new Date().toLocaleDateString("en-US", { weekday: "long" })}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards with Custom Colors */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
        <div
          className='rounded-lg p-6 transform hover:scale-105 transition-all duration-300 shadow-lg border'
          style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p
                className='text-sm font-medium'
                style={{ color: "#ABA4AA" }}
              >
                Total Athletes
              </p>
              <p
                className='text-3xl font-bold'
                style={{ color: "#C3BCC2" }}
              >
                {clients.length}
              </p>
              <p
                className='text-xs mt-1'
                style={{ color: "#ABA4AA" }}
              >
                {clients.length > 0 ? "+2 this month" : "Start your journey"}
              </p>
            </div>
            <User
              className='h-12 w-12'
              style={{ color: "#FFFFFF" }}
            />
          </div>
        </div>

        <div
          className='rounded-lg p-6 transform hover:scale-105 transition-all duration-300 shadow-lg border'
          style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p
                className='text-sm font-medium'
                style={{ color: "#ABA4AA" }}
              >
                Upcoming Lessons
              </p>
              <p
                className='text-3xl font-bold'
                style={{ color: "#C3BCC2" }}
              >
                {upcomingLessons}
              </p>
              <p
                className='text-xs mt-1'
                style={{ color: "#ABA4AA" }}
              >
                {upcomingLessons > 0 ? "This week" : "Schedule now"}
              </p>
            </div>
            <Calendar className='h-12 w-12 text-white' />
          </div>
        </div>

        <div
          className='rounded-lg p-6 transform hover:scale-105 transition-all duration-300 shadow-lg border'
          style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p
                className='text-sm font-medium'
                style={{ color: "#ABA4AA" }}
              >
                Active Programs
              </p>
              <p
                className='text-3xl font-bold'
                style={{ color: "#C3BCC2" }}
              >
                {activeWorkouts}
              </p>
              <p
                className='text-xs mt-1'
                style={{ color: "#ABA4AA" }}
              >
                {activeWorkouts > 0 ? "In progress" : "Create first"}
              </p>
            </div>
            <Dumbbell
              className='h-12 w-12'
              style={{ color: "#FFFFFF" }}
            />
          </div>
        </div>

        <div
          className='rounded-lg p-6 transform hover:scale-105 transition-all duration-300 shadow-lg border'
          style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
        >
          <div className='flex items-center justify-between'>
            <div>
              <p
                className='text-sm font-medium'
                style={{ color: "#ABA4AA" }}
              >
                Success Rate
              </p>
              <p
                className='text-3xl font-bold'
                style={{ color: "#C3BCC2" }}
              >
                98%
              </p>
              <p
                className='text-xs mt-1'
                style={{ color: "#ABA4AA" }}
              >
                Client satisfaction
              </p>
            </div>
            <Award
              className='h-12 w-12'
              style={{ color: "#FFFFFF" }}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div
        className='rounded-lg p-6 mb-8 shadow-lg border'
        style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
      >
        <h3
          className='text-xl font-bold mb-4 flex items-center gap-2'
          style={{ color: "#C3BCC2" }}
        >
          <Target
            className='h-5 w-5'
            style={{ color: "#4A5A70" }}
          />
          Quick Actions
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className='flex items-center gap-3 p-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg'
            style={{ backgroundColor: "#4A5A70" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#606364"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#4A5A70"
            }}
          >
            <Plus
              className='h-5 w-5'
              style={{ color: "#C3BCC2" }}
            />
            <span
              className='font-medium'
              style={{ color: "#C3BCC2" }}
            >
              Add Client
            </span>
          </button>

          <Link
            href='/schedule'
            className='flex items-center gap-3 p-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border'
            style={{ backgroundColor: "#606364", borderColor: "#ABA4AA" }}
          >
            <Calendar
              className='h-5 w-5'
              style={{ color: "#C3BCC2" }}
            />
            <span
              className='font-medium'
              style={{ color: "#C3BCC2" }}
            >
              Schedule Lesson
            </span>
          </Link>

          <Link
            href='/programs'
            className='flex items-center gap-3 p-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border'
            style={{ backgroundColor: "#606364", borderColor: "#ABA4AA" }}
          >
            <Dumbbell
              className='h-5 w-5'
              style={{ color: "#C3BCC2" }}
            />
            <span
              className='font-medium'
              style={{ color: "#C3BCC2" }}
            >
              Create Program
            </span>
          </Link>

          <Link
            href='/library'
            className='flex items-center gap-3 p-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border'
            style={{ backgroundColor: "#606364", borderColor: "#ABA4AA" }}
          >
            <FiBookOpen
              className='h-5 w-5'
              style={{ color: "#C3BCC2" }}
            />
            <span
              className='font-medium'
              style={{ color: "#C3BCC2" }}
            >
              Browse Library
            </span>
          </Link>
        </div>
      </div>

      {/* Header with Enhanced Add Client button */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h2
            className='text-2xl font-bold flex items-center gap-2'
            style={{ color: "#C3BCC2" }}
          >
            <FiUsers
              className='h-6 w-6'
              style={{ color: "#4A5A70" }}
            />
            Your Athletes
          </h2>
          <p
            className='flex items-center gap-2 mt-1'
            style={{ color: "#ABA4AA" }}
          >
            <Clock className='h-4 w-4' />
            {clients.length} {clients.length === 1 ? "athlete" : "athletes"}{" "}
            waiting for you
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className='flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg font-medium'
          style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#606364"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#4A5A70"
          }}
        >
          <Plus className='h-5 w-5' />
          Add New Athlete
        </button>
      </div>

      {/* Enhanced Clients List - FIXED EMPTY STATE */}
      {clients.length === 0 ? (
        <div
          className='flex flex-col items-center justify-center py-16 rounded-lg shadow-lg border'
          style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
        >
          <div
            className='rounded-full p-4 mb-4'
            style={{ backgroundColor: "#4A5A70" }}
          >
            <User
              className='h-8 w-8'
              style={{ color: "#C3BCC2" }}
            />
          </div>
          <h3
            className='text-xl font-bold mb-2'
            style={{ color: "#C3BCC2" }}
          >
            Ready to Start Coaching?
          </h3>
          <p
            className='mb-6 text-center max-w-md text-sm'
            style={{ color: "#ABA4AA" }}
          >
            Add your first athlete to begin building your coaching career.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className='flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg font-medium'
            style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#606364"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#4A5A70"
            }}
          >
            <Plus className='h-4 w-4' />
            Add Your First Athlete
          </button>
        </div>
      ) : (
        <div className='space-y-4'>
          {clients.map((client: any, index: number) => (
            <div
              key={client.id}
              className='rounded-lg shadow-lg p-6 transition-all duration-300 transform hover:-translate-y-1 border'
              style={{
                backgroundColor: "#353A3A",
                borderColor: "#606364",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#606364"
                e.currentTarget.style.borderColor = "#ABA4AA"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#353A3A"
                e.currentTarget.style.borderColor = "#606364"
              }}
            >
              <div className='flex items-center justify-between'>
                {/* Left side - Enhanced Client info */}
                <div className='flex items-center gap-4'>
                  <div className='relative'>
                    <div
                      className='w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg'
                      style={{ backgroundColor: "#4A5A70" }}
                    >
                      <span
                        className='font-bold text-lg'
                        style={{ color: "#C3BCC2" }}
                      >
                        {client.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()}
                      </span>
                    </div>
                    <div
                      className='absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 flex items-center justify-center'
                      style={{ borderColor: "#353A3A" }}
                    >
                      <div className='w-2 h-2 bg-white rounded-full'></div>
                    </div>
                  </div>

                  <div>
                    <h3
                      className='text-2xl font-bold mb-1'
                      style={{ color: "#C3BCC2" }}
                    >
                      {client.name}
                    </h3>
                    <p
                      className='flex items-center gap-2'
                      style={{ color: "#ABA4AA" }}
                    >
                      <Calendar className='h-4 w-4' />
                      Added {format(new Date(client.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>

                {/* Center - Enhanced info cards */}
                <div className='flex items-center gap-6'>
                  <div
                    className='text-center rounded-lg p-3 min-w-[100px] border'
                    style={{
                      backgroundColor: "#606364",
                      borderColor: "#ABA4AA",
                    }}
                  >
                    <p
                      className='text-xs font-medium uppercase tracking-wider mb-1'
                      style={{ color: "#ABA4AA" }}
                    >
                      Next Lesson
                    </p>
                    <p
                      className='text-sm font-bold'
                      style={{ color: "#C3BCC2" }}
                    >
                      {client.nextLessonDate
                        ? format(new Date(client.nextLessonDate), "MMM d")
                        : "Not scheduled"}
                    </p>
                  </div>

                  <div
                    className='text-center rounded-lg p-3 min-w-[120px] border'
                    style={{
                      backgroundColor: "#606364",
                      borderColor: "#ABA4AA",
                    }}
                  >
                    <p
                      className='text-xs font-medium uppercase tracking-wider mb-1'
                      style={{ color: "#ABA4AA" }}
                    >
                      Last Workout
                    </p>
                    <p
                      className='text-sm font-bold truncate'
                      style={{ color: "#C3BCC2" }}
                    >
                      {client.lastCompletedWorkout || "None"}
                    </p>
                  </div>

                  <div className='text-center'>
                    <span
                      className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-lg border`}
                      style={{
                        backgroundColor: client.nextLessonDate
                          ? "#10B981"
                          : "#606364",
                        color: client.nextLessonDate ? "#DCFCE7" : "#C3BCC2",
                        borderColor: client.nextLessonDate
                          ? "#059669"
                          : "#ABA4AA",
                      }}
                    >
                      {client.nextLessonDate ? "🔥 Active" : "💤 Available"}
                    </span>
                  </div>
                </div>

                {/* Right side - Enhanced Actions */}
                <div className='flex items-center gap-2'>
                  <button
                    className='p-3 rounded-lg transition-all duration-300 transform hover:scale-110'
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
                    <Edit className='h-5 w-5' />
                  </button>
                  <button
                    onClick={() => handleDeleteClient(client.id, client.name)}
                    disabled={deletingClientId === client.id}
                    className='p-3 rounded-lg transition-all duration-300 transform hover:scale-110 disabled:opacity-50'
                    style={{ color: "#ABA4AA" }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.color = "#EF4444"
                        e.currentTarget.style.backgroundColor = "#606364"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.color = "#ABA4AA"
                        e.currentTarget.style.backgroundColor = "transparent"
                      }
                    }}
                  >
                    {deletingClientId === client.id ? (
                      <div
                        className='animate-spin rounded-full h-5 w-5 border-b-2'
                        style={{ borderColor: "#EF4444" }}
                      ></div>
                    ) : (
                      <Trash2 className='h-5 w-5' />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddClient={(newClient) => {
          console.log("Client added successfully!")
        }}
      />
    </Sidebar>
  )
}
