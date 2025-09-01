"use client"

import { useState } from "react"
import { trpc } from "@/app/_trpc/client"
import { Calendar, Users, ArrowLeft } from "lucide-react"

interface ClientScheduleManagerProps {
  clientId: string
  clientName: string
  onBack: () => void
}

export default function ClientScheduleManager({
  clientId,
  clientName,
  onBack,
}: ClientScheduleManagerProps) {
  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <button
          onClick={onBack}
          className='p-2 rounded-lg transition-colors hover:bg-opacity-80'
          style={{
            backgroundColor: "#353A3A",
            color: "#C3BCC2",
          }}
        >
          <ArrowLeft className='w-5 h-5' />
        </button>
        <div className='flex items-center gap-3'>
          <div
            className='p-2 rounded-lg'
            style={{ backgroundColor: "#4A5A70" }}
          >
            <Calendar
              className='w-5 h-5'
              style={{ color: "#FFFFFF" }}
            />
          </div>
          <div>
            <h1
              className='text-2xl font-bold'
              style={{ color: "#C3BCC2" }}
            >
              Schedule Management
            </h1>
            <p
              className='text-sm'
              style={{ color: "#ABA4AA" }}
            >
              Managing schedule for {clientName}
            </p>
          </div>
        </div>
      </div>

      {/* Scheduler Component - Coming Soon */}
      <div className="text-center py-16">
        <div className="text-gray-400 mb-4">Schedule management coming soon</div>
        <p className="text-sm text-gray-500">This feature is under development</p>
      </div>
    </div>
  )
}
