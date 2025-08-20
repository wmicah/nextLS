"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { Button } from "./ui/button"
import { Checkbox } from "./ui/checkbox"
import { Label } from "./ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { ScrollArea } from "./ui/scroll-area"

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
}

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

interface AssignProgramModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { programId: string; clientIds: string[] }) => void
  program: Program | null
  clients: Client[]
}

export default function AssignProgramModal({
  isOpen,
  onClose,
  onSubmit,
  program,
  clients,
}: AssignProgramModalProps) {
  const [selectedClients, setSelectedClients] = useState<string[]>([])

  const handleClientToggle = (clientId: string) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    )
  }

  const handleSelectAll = () => {
    if (selectedClients.length === clients.length) {
      setSelectedClients([])
    } else {
      setSelectedClients(clients.map(client => client.id))
    }
  }

  const handleSubmit = () => {
    if (program && selectedClients.length > 0) {
      onSubmit({
        programId: program.id,
        clientIds: selectedClients,
      })
    }
  }

  const handleClose = () => {
    setSelectedClients([])
    onClose()
  }

  if (!program) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-[#2A3133] border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-white">Assign Program</DialogTitle>
          <DialogDescription className="text-gray-400">
            Select clients to assign "{program.title}" to
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectedClients.length === clients.length && clients.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="select-all" className="text-white">
              Select All ({clients.length} clients)
            </Label>
          </div>

          <ScrollArea className="h-64">
            <div className="space-y-2">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center space-x-3 p-3 bg-[#3A4245] rounded-lg"
                >
                  <Checkbox
                    id={client.id}
                    checked={selectedClients.includes(client.id)}
                    onCheckedChange={() => handleClientToggle(client.id)}
                  />
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={client.avatar || undefined} />
                    <AvatarFallback className="bg-blue-600 text-white text-xs">
                      {client.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor={client.id}
                      className="text-white font-medium cursor-pointer"
                    >
                      {client.name}
                    </Label>
                    {client.email && (
                      <p className="text-gray-400 text-sm truncate">
                        {client.email}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedClients.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Assign to {selectedClients.length} client{selectedClients.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


