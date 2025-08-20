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
  ArrowRight,
  Users,
  BookOpen,
  BarChart3,
  Activity,
  Star,
  Sparkles,
  Zap,
  Crown,
  Trophy,
  Target as TargetIcon,
  TrendingUp as TrendingUpIcon,
} from "lucide-react"
import { format } from "date-fns"
import AddClientModal from "./AddClientModal"
import Sidebar from "./Sidebar"

export default function Dashboard() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null)

  const { data: clients = [], isLoading, error } = trpc.clients.list.useQuery()
  const { data: stats } = trpc.library.getStats.useQuery()
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
                  <div>
                    <h1
                      className='text-4xl font-bold mb-2'
                      style={{ color: "#C3BCC2" }}
                    >
                      Welcome back, Coach
                    </h1>
                    <p
                      className='flex items-center gap-2 text-lg'
                      style={{ color: "#ABA4AA" }}
                    >
                      <TrendingUpIcon className='h-5 w-5 text-yellow-400' />
                      {clients.length > 0
                        ? `Growing strong with ${clients.length} ${
                            clients.length === 1 ? "athlete" : "athletes"
                          }`
                        : "Ready to build your coaching empire"}
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
                background: "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
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
                <TrendingUpIcon className='h-5 w-5 text-green-400' />
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
                  {clients.length}
                </p>
                <p
                  className='text-xs'
                  style={{ color: "#ABA4AA" }}
                >
                  {clients.length > 0 ? "+2 this month" : "Start your journey"}
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
                background: "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)",
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
                <Clock className='h-5 w-5 text-red-400' />
              </div>
              <div>
                <p
                  className='text-sm font-medium mb-1'
                  style={{ color: "#ABA4AA" }}
                >
                  Upcoming Lessons
                </p>
                <p
                  className='text-3xl font-bold mb-1'
                  style={{ color: "#C3BCC2" }}
                >
                  {upcomingLessons}
                </p>
                <p
                  className='text-xs'
                  style={{ color: "#ABA4AA" }}
                >
                  {upcomingLessons > 0 ? "This week" : "Schedule now"}
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
                background: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
              }}
            />
            <div className='relative p-6'>
              <div className='flex items-center justify-between mb-4'>
                <div
                  className='w-12 h-12 rounded-xl flex items-center justify-center'
                  style={{ backgroundColor: "#10B981" }}
                >
                  <Dumbbell
                    className='h-6 w-6'
                    style={{ color: "#C3BCC2" }}
                  />
                </div>
                <Activity className='h-5 w-5 text-green-400' />
              </div>
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
                  {activeWorkouts}
                </p>
                <p
                  className='text-xs'
                  style={{ color: "#ABA4AA" }}
                >
                  {activeWorkouts > 0 ? "In progress" : "Create first"}
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
                background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
              }}
            />
            <div className='relative p-6'>
              <div className='flex items-center justify-between mb-4'>
                <div
                  className='w-12 h-12 rounded-xl flex items-center justify-center'
                  style={{ backgroundColor: "#F59E0B" }}
                >
                  <BookOpen
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
                  Library
                </p>
                <p
                  className='text-3xl font-bold mb-1'
                  style={{ color: "#C3BCC2" }}
                >
                  {stats?.total || 0}
                </p>
                <p
                  className='text-xs'
                  style={{ color: "#ABA4AA" }}
                >
                  Browse Library
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Actions */}
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
            <h3
              className='text-xl font-bold mb-6 flex items-center gap-3'
              style={{ color: "#C3BCC2" }}
            >
              <div
                className='w-8 h-8 rounded-lg flex items-center justify-center'
                style={{ backgroundColor: "#4A5A70" }}
              >
                <TargetIcon
                  className='h-4 w-4'
                  style={{ color: "#C3BCC2" }}
                />
              </div>
              Quick Actions
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className='flex items-center gap-3 p-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg border group/action'
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
                  className='w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover/action:scale-110'
                  style={{ backgroundColor: "#4A5A70" }}
                >
                  <Plus
                    className='h-5 w-5'
                    style={{ color: "#C3BCC2" }}
                  />
                </div>
                <span
                  className='font-medium'
                  style={{ color: "#C3BCC2" }}
                >
                  Add Client
                </span>
              </button>

              <Link
                href='/schedule'
                className='flex items-center gap-3 p-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg border group/action'
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
                  className='w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover/action:scale-110'
                  style={{ backgroundColor: "#DC2626" }}
                >
                  <Calendar
                    className='h-5 w-5'
                    style={{ color: "#C3BCC2" }}
                  />
                </div>
                <span
                  className='font-medium'
                  style={{ color: "#C3BCC2" }}
                >
                  Schedule Lesson
                </span>
              </Link>

              <Link
                href='/programs'
                className='flex items-center gap-3 p-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg border group/action'
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
                  className='w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover/action:scale-110'
                  style={{ backgroundColor: "#10B981" }}
                >
                  <Dumbbell
                    className='h-5 w-5'
                    style={{ color: "#C3BCC2" }}
                  />
                </div>
                <span
                  className='font-medium'
                  style={{ color: "#C3BCC2" }}
                >
                  Create Program
                </span>
              </Link>

              <Link
                href='/library'
                className='flex items-center gap-3 p-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg border group/action'
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
                  className='w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover/action:scale-110'
                  style={{ backgroundColor: "#F59E0B" }}
                >
                  <BookOpen
                    className='h-5 w-5'
                    style={{ color: "#C3BCC2" }}
                  />
                </div>
                <span
                  className='font-medium'
                  style={{ color: "#C3BCC2" }}
                >
                  Browse Library
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Enhanced Athletes Section */}
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
              Your Athletes
            </h2>
            <p
              className='flex items-center gap-2'
              style={{ color: "#ABA4AA" }}
            >
              <Clock className='h-4 w-4' />
              {clients.length} {clients.length === 1 ? "athlete" : "athletes"}{" "}
              waiting for you
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className='flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-medium border'
            style={{
              backgroundColor: "#353A3A",
              color: "#C3BCC2",
              borderColor: "#606364",
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
            <Plus className='h-5 w-5' />
            Add New Athlete
          </button>
        </div>

        {/* Enhanced Athletes List */}
        {clients.length === 0 ? (
          <div
            className='rounded-2xl shadow-xl border text-center relative overflow-hidden group'
            style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
          >
            <div
              className='absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300'
              style={{
                background: "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
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
                Ready to Start Coaching?
              </h3>
              <p
                className='mb-8 max-w-md mx-auto text-lg'
                style={{ color: "#ABA4AA" }}
              >
                Add your first athlete to begin building your coaching career
                and transforming lives.
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
                Add Your First Athlete
              </button>
            </div>
          </div>
        ) : (
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {clients.map((client: any, index: number) => (
              <div
                key={client.id}
                className='rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group'
                style={{
                  backgroundColor: "#353A3A",
                  borderColor: "#606364",
                  animationDelay: `${index * 100}ms`,
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
                    <div className='flex items-center gap-2'>
                      <button
                        className='p-2 rounded-xl transition-all duration-300 transform hover:scale-110'
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
                            e.currentTarget.style.backgroundColor = "#3A4040"
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
                      Added {format(new Date(client.createdAt), "MMM d, yyyy")}
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
                            ? format(new Date(client.nextLessonDate), "MMM d")
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
                          color: client.nextLessonDate ? "#DCFCE7" : "#C3BCC2",
                          borderColor: client.nextLessonDate
                            ? "#059669"
                            : "#4A5A70",
                        }}
                      >
                        {client.nextLessonDate ? "🔥 Active" : "💤 Available"}
                      </span>
                      <Link
                        href={`/clients/${client.id}`}
                        className='flex items-center gap-1 text-xs font-medium group'
                        style={{ color: "#4A5A70" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Details
                        <ArrowRight className='h-3 w-3 group-hover:translate-x-1 transition-transform duration-200' />
                      </Link>
                    </div>
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
    </Sidebar>
  )
}
