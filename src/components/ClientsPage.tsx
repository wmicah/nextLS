"use client"

import { useState } from "react"
import { trpc } from "@/app/_trpc/client"
import { Plus, User, Calendar, Edit, Trash2, Clock } from "lucide-react"
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
        <>
          {/* Header */}
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h1
                className='text-3xl font-bold'
                style={{ color: "#C3BCC2" }}
              >
                Your Clients
              </h1>
              <p
                className='flex items-center gap-2 mt-1'
                style={{ color: "#ABA4AA" }}
              >
                <Clock className='h-4 w-4' />
                {clients.length} {clients.length === 1 ? "client" : "clients"}{" "}
                total
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
              Add New Client
            </button>
          </div>

          {/* Clients List */}
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
                No clients yet
              </h3>
              <p
                className='mb-6 text-center max-w-md text-sm'
                style={{ color: "#ABA4AA" }}
              >
                Add your first client to start building your coaching practice.
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
                Add Your First Client
              </button>
            </div>
          ) : (
            <div className='space-y-4'>
              {clients.map((client: Client) => (
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
                    <div className='flex items-center gap-4'>
                      <div
                        className='w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0'
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

                      <div>
                        <h3
                          className='text-xl font-bold mb-1'
                          style={{ color: "#C3BCC2" }}
                        >
                          {client.name}
                        </h3>
                        <p
                          className='flex items-center gap-2 text-sm'
                          style={{ color: "#ABA4AA" }}
                        >
                          <Calendar className='h-4 w-4' />
                          Added{" "}
                          {format(new Date(client.createdAt), "MMM d, yyyy")}
                        </p>
                        {client.email && (
                          <p
                            className='text-sm'
                            style={{ color: "#ABA4AA" }}
                          >
                            {client.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className='flex items-center gap-2'>
                      {client.userId && (
                        <button
                          onClick={() =>
                            setSelectedForSchedule({
                              userId: client.userId!,
                              name: client.name,
                            })
                          }
                          className='p-2 rounded-lg transition-all duration-300'
                          style={{ color: "#ABA4AA" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "#C3BCC2"
                            e.currentTarget.style.backgroundColor = "#4A5A70"
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "#ABA4AA"
                            e.currentTarget.style.backgroundColor =
                              "transparent"
                          }}
                          title='Schedule'
                        >
                          <Calendar className='h-5 w-5' />
                        </button>
                      )}
                      <button
                        className='p-2 rounded-lg transition-all duration-300'
                        style={{ color: "#ABA4AA" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#C3BCC2"
                          e.currentTarget.style.backgroundColor = "#4A5A70"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "#ABA4AA"
                          e.currentTarget.style.backgroundColor = "transparent"
                        }}
                      >
                        <Edit className='h-5 w-5' />
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteClient(client.id, client.name)
                        }
                        disabled={deletingClientId === client.id}
                        className='p-2 rounded-lg transition-all duration-300 disabled:opacity-50'
                        style={{ color: "#ABA4AA" }}
                        onMouseEnter={(e) => {
                          if (!e.currentTarget.disabled) {
                            e.currentTarget.style.color = "#EF4444"
                            e.currentTarget.style.backgroundColor = "#4A5A70"
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
        </>
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
