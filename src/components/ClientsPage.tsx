"use client"

import { useState } from "react"
import Link from "next/link"
import { trpc } from "@/app/_trpc/client"
import { Calendar, Dumbbell, User, Plus, Edit, Trash2 } from "lucide-react"
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
    <aside className='flex flex-col justify-between bg-black text-white w-20 md:w-64 h-screen fixed left-0 top-0 z-20 transition-all duration-300 border-r border-gray-800'>
      <div>
        <div className='flex items-center justify-center md:justify-start h-20 px-4 font-bold text-2xl'>
          <span className='hidden md:inline text-white'>
            Next Level Softball
          </span>
        </div>
        <nav className='mt-8 flex flex-col gap-2'>
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 rounded transition ${
                link.name === "Clients"
                  ? "bg-zinc-800 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
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
              className='text-xl hover:text-orange-400 transition text-gray-500'
            >
              {link.icon}
            </Link>
          ))}
        </div>
        <div className='flex items-center gap-2 mt-4'>
          <div className='bg-orange-500 rounded-full w-10 h-10 flex items-center justify-center font-bold text-white'>
            {userInitials}
          </div>
          <span className='hidden md:inline text-gray-300'>
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
  // ALL STATES GO HERE - INSIDE THE COMPONENT!
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null)

  const { data: clients = [], isLoading, error } = trpc.clients.list.useQuery()
  const utils = trpc.useUtils()

  // Add delete mutation (you'll need to add this to your tRPC router first)
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
      <div className='flex min-h-screen bg-gray-900'>
        <Sidebar />
        <div className='flex-1 md:ml-64 p-8'>
          <div className='flex items-center justify-center h-64'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500'></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex min-h-screen bg-gray-900'>
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

  return (
    <div className='flex min-h-screen bg-gray-900'>
      <Sidebar />
      <div className='flex-1 md:ml-64 p-8'>
        {/* Page Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-white mb-2'>
            Client Management
          </h1>
          <p className='text-gray-400'>
            Manage your clients, schedule lessons, and track progress
          </p>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
          <div className='bg-gray-800 border border-gray-700 rounded-lg p-6'>
            <div className='flex items-center'>
              <User className='h-8 w-8 text-orange-500 mr-3' />
              <div>
                <p className='text-sm text-gray-400'>Total Clients</p>
                <p className='text-2xl font-bold text-white'>
                  {clients.length}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-gray-800 border border-gray-700 rounded-lg p-6'>
            <div className='flex items-center'>
              <Calendar className='h-8 w-8 text-green-500 mr-3' />
              <div>
                <p className='text-sm text-gray-400'>Scheduled Lessons</p>
                <p className='text-2xl font-bold text-white'>
                  {clients.filter((c: any) => c.nextLessonDate).length}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-gray-800 border border-gray-700 rounded-lg p-6'>
            <div className='flex items-center'>
              <Dumbbell className='h-8 w-8 text-gray-500 mr-3' />
              <div>
                <p className='text-sm text-gray-400'>Active Workouts</p>
                <p className='text-2xl font-bold text-white'>
                  {clients.filter((c: any) => c.lastCompletedWorkout).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Header with Add Client button */}
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h2 className='text-xl font-semibold text-white'>All Clients</h2>
            <p className='text-sm text-gray-400'>
              {clients.length} {clients.length === 1 ? "client" : "clients"}{" "}
              total
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className='flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition font-medium'
          >
            <Plus className='h-4 w-4' />
            Add New Client
          </button>
        </div>

        {/* Clients List */}
        {clients.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-64 bg-gray-800 border border-gray-700 rounded-lg'>
            <User className='h-12 w-12 mb-4 text-gray-500' />
            <h3 className='text-lg font-medium mb-2 text-gray-400'>
              No clients yet
            </h3>
            <p className='text-sm mb-4 text-gray-500'>
              Get started by adding your first client
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className='flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition'
            >
              <Plus className='h-4 w-4' />
              Add Your First Client
            </button>
          </div>
        ) : (
          <div className='space-y-4'>
            {clients.map((client: any) => (
              <div
                key={client.id}
                className='bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-6 hover:bg-gray-700 hover:border-gray-600 transition-all duration-200'
              >
                <div className='flex items-center justify-between'>
                  {/* Left side - Client info */}
                  <div className='flex items-center gap-4'>
                    <div className='w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0'>
                      <span className='text-white font-bold text-sm'>
                        {client.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <h3 className='text-xl font-bold text-white mb-1'>
                        {client.name}
                      </h3>
                      <p className='text-sm text-gray-400'>
                        Added{" "}
                        {format(new Date(client.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>

                  {/* Center - Lesson and workout info */}
                  <div className='flex items-center gap-8'>
                    <div className='text-center'>
                      <p className='text-xs font-medium text-gray-400 uppercase tracking-wider mb-1'>
                        Next Lesson
                      </p>
                      <p className='text-sm font-semibold text-white'>
                        {client.nextLessonDate
                          ? format(new Date(client.nextLessonDate), "MMM d")
                          : "Not scheduled"}
                      </p>
                    </div>

                    <div className='text-center'>
                      <p className='text-xs font-medium text-gray-400 uppercase tracking-wider mb-1'>
                        Last Workout
                      </p>
                      <p className='text-sm font-semibold text-white truncate max-w-32'>
                        {client.lastCompletedWorkout || "None"}
                      </p>
                    </div>

                    <div className='text-center'>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          client.nextLessonDate
                            ? "bg-green-900 text-green-300"
                            : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {client.nextLessonDate ? "Scheduled" : "Available"}
                      </span>
                    </div>
                  </div>

                  {/* Right side - Actions */}
                  <div className='flex items-center gap-2'>
                    <button className='p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition'>
                      <Edit className='h-4 w-4' />
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client.id, client.name)}
                      disabled={deletingClientId === client.id}
                      className='p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition disabled:opacity-50'
                    >
                      {deletingClientId === client.id ? (
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-red-400'></div>
                      ) : (
                        <Trash2 className='h-4 w-4' />
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
