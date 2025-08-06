"use client"

import { trpc } from "@/app/_trpc/client"
import { Calendar, Dumbbell, User } from "lucide-react"
import { format } from "date-fns"

export default function ClientsOverview() {
  const { data: clients = [], isLoading, error } = trpc.clients.list.useQuery()

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500'></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex items-center justify-center h-64'>
        <p className='text-red-400'>Error loading clients: {error.message}</p>
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center h-64 text-gray-500'>
        <User className='h-12 w-12 mb-4' />
        <h3 className='text-lg font-medium mb-2 text-gray-400'>
          No clients yet
        </h3>
        <p className='text-sm'>Start adding clients to see them here</p>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-4'>
      {clients.map((client: any) => (
        <div
          key={client.id}
          className='bg-neutral-700 border border-gray-700 rounded-lg shadow-lg p-6 hover:bg-stone-900 hover:border-gray-600 transition-all duration-200 w-full'
        >
          <div className='flex items-center justify-between'>
            {/* Left side - Client info */}
            <div className='flex items-center gap-4'>
              {/* Avatar */}
              <div className='w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0'>
                <span className='text-white font-bold text-sm'>
                  {client.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()}
                </span>
              </div>

              {/* Client name */}
              <div>
                <h3 className='text-xl font-bold text-white'>{client.name}</h3>
              </div>
            </div>

            {/* Right side - Lesson and workout info */}
            <div className='flex items-center gap-12'>
              {/* Next Lesson */}
              <div className='flex items-center gap-3'>
                <Calendar className='h-5 w-5 text-gray-400' />
                <div>
                  <p className='text-xs font-medium text-gray-400 uppercase tracking-wider mb-1'>
                    Next Lesson
                  </p>
                  <p className='text-sm font-semibold text-white'>
                    {client.nextLessonDate
                      ? format(new Date(client.nextLessonDate), "MMM d, yyyy")
                      : "Not scheduled"}
                  </p>
                </div>
              </div>

              {/* Last Workout */}
              <div className='flex items-center gap-3'>
                <Dumbbell className='h-5 w-5 text-gray-400' />
                <div>
                  <p className='text-xs font-medium text-gray-400 uppercase tracking-wider mb-1'>
                    Last Workout
                  </p>
                  <p className='text-sm font-semibold text-white truncate max-w-32'>
                    {client.lastCompletedWorkout || "None completed"}
                  </p>
                </div>
              </div>

              {/* Status indicator */}
              <div className='flex-shrink-0'>
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider ${
                    client.nextLessonDate
                      ? "bg-green-800 text-green-300 border border-green-600"
                      : "bg-zinc-800 text-gray-300 border border-gray-600"
                  }`}
                >
                  {client.nextLessonDate ? "Scheduled" : "Available"}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
