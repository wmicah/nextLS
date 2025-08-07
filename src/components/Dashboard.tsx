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

const navLinks = [
  { name: "Dashboard", icon: <FiUsers />, href: "/dashboard" }, // Add this line
  { name: "Clients", icon: <FiUsers />, href: "/clients" },
  { name: "Library", icon: <FiBookOpen />, href: "/library" },
  { name: "Programs", icon: <FiClipboard />, href: "/programs" },
  { name: "Schedule", icon: <FiCalendar />, href: "/schedule" },
]

const bottomLinks = [
  { name: "Settings", icon: <FiSettings />, href: "/settings" },
  { name: "Notifications", icon: <FiBell />, href: "/notifications" },
  { name: "Messages", icon: <FiMessageSquare />, href: "/messages" },
  { name: "Search", icon: <FiSearch />, href: "/search" },
]

function Sidebar({ user }: { user?: { name?: string; email?: string } }) {
  const { data: authData } = trpc.authCallback.useQuery()
  const userInitials =
    user?.name || authData?.user?.name
      ? ((user?.name ?? authData?.user?.name) || "")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : (user?.email || authData?.user?.email)?.[0]?.toUpperCase() || "U"

  return (
    <aside
      className='flex flex-col justify-between w-20 md:w-64 h-screen fixed left-0 top-0 z-20 transition-all duration-300 border-r'
      style={{
        backgroundColor: "#141718",
        color: "#ABA4AA",
        borderColor: "#606364",
      }}
    >
      <div>
        <div className='flex items-center justify-center md:justify-start h-20 px-4 font-bold text-2xl'>
          <span
            className='hidden md:inline'
            style={{ color: "#C3BCC2" }}
          >
            Next Level Softball
          </span>
        </div>
        <nav className='mt-8 flex flex-col gap-2'>
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded transition ${
                link.name === "Clients" ? "text-white" : "hover:text-white"
              }`}
              style={{
                backgroundColor:
                  link.name === "Clients" ? "#353A3A" : "transparent",
                color: link.name === "Clients" ? "#C3BCC2" : "#606364",
              }}
              onMouseEnter={(e) => {
                if (link.name !== "Clients") {
                  e.currentTarget.style.backgroundColor = "#353A3A"
                  e.currentTarget.style.color = "#C3BCC2"
                }
              }}
              onMouseLeave={(e) => {
                if (link.name !== "Clients") {
                  e.currentTarget.style.backgroundColor = "transparent"
                  e.currentTarget.style.color = "#606364"
                }
              }}
            >
              <span className='text-xl'>{link.icon}</span>
              <span className='hidden md:inline'>{link.name}</span>
            </Link>
          ))}
        </nav>
      </div>
      <div className='flex flex-col gap-4 mb-6 px-4'>
        <div className='flex gap-4 justify-between'>
          {bottomLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className='text-xl transition'
              style={{ color: "#606364" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#4A5A70"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#606364"
              }}
            >
              {link.icon}
            </Link>
          ))}
        </div>
        <div className='flex items-center gap-2 mt-4'>
          <div
            className='rounded-full w-10 h-10 flex items-center justify-center font-bold text-white'
            style={{ backgroundColor: "#4A5A70" }}
          >
            {userInitials}
          </div>
          <span
            className='hidden md:inline'
            style={{ color: "#ABA4AA" }}
          >
            {user?.name ||
              authData?.user?.name ||
              user?.email ||
              authData?.user?.email}
          </span>
        </div>
      </div>
    </aside>
  )
}

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
      <div
        className='flex min-h-screen'
        style={{ backgroundColor: "#2A3133" }}
      >
        <Sidebar />
        <div className='flex-1 md:ml-64 p-8'>
          <div className='flex items-center justify-center h-64'>
            <div
              className='animate-spin rounded-full h-8 w-8 border-b-2'
              style={{ borderColor: "#4A5A70" }}
            ></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className='flex min-h-screen'
        style={{ backgroundColor: "#2A3133" }}
      >
        <Sidebar />
        <div className='flex-1 md:ml-64 p-8'>
          <div className='flex items-center justify-center h-64'>
            <p className='text-red-400'>
              Error loading clients: {error.message}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const upcomingLessons = clients.filter((c: any) => c.nextLessonDate).length
  const activeWorkouts = clients.filter(
    (c: any) => c.lastCompletedWorkout
  ).length

  return (
    <div
      className='flex min-h-screen'
      style={{ backgroundColor: "#1F2324" }}
    >
      <Sidebar />
      <div className='flex-1 md:ml-64 p-8'>
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
                style={{ color: "#4A5A70" }}
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
              <Calendar className='h-12 w-12 text-green-500' />
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
                style={{ color: "#606364" }}
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
                style={{ color: "#4A5A70" }}
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

        {/* Enhanced Clients List */}
        {clients.length === 0 ? (
          <div
            className='flex flex-col items-center justify-center h-80 rounded-lg shadow-lg border'
            style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
          >
            <div
              className='rounded-full p-6 mb-6'
              style={{ backgroundColor: "#4A5A70" }}
            >
              <User
                className='h-16 w-16'
                style={{ color: "#C3BCC2" }}
              />
            </div>
            <h3
              className='text-2xl font-bold mb-3'
              style={{ color: "#C3BCC2" }}
            >
              Ready to Start Coaching?
            </h3>
            <p
              className='mb-6 text-center max-w-md'
              style={{ color: "#ABA4AA" }}
            >
              Add your first athlete to begin building your coaching career.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className='flex items-center gap-2 px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg font-medium text-lg'
              style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#606364"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#4A5A70"
              }}
            >
              <Plus className='h-5 w-5' />
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
                        Added{" "}
                        {format(new Date(client.createdAt), "MMM d, yyyy")}
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
      </div>
    </div>
  )
}
