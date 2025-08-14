"use client"

import { useState } from "react"
import { trpc } from "@/app/_trpc/client"
import { X, User, Mail, Phone, CheckCircle, Circle } from "lucide-react"

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  coachId: string | null
  userId?: string | null // Make optional
  createdAt: string
  updatedAt: string
  nextLessonDate: string | null
  lastCompletedWorkout: string | null
  avatar: string | null
  dueDate: string | null
  lastActivity: string | null
  updates: string | null
}

interface AddClientModalProps {
  isOpen: boolean
  onClose: () => void
  onAddClient: (client: Client) => void
}

export default function AddClientModal({
  isOpen,
  onClose,
  onAddClient,
}: AddClientModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailExists, setEmailExists] = useState<boolean | null>(null)

  const utils = trpc.useUtils()

  const addClient = trpc.clients.create.useMutation({
    onSuccess: (newClient) => {
      utils.clients.list.invalidate()
      onAddClient(newClient)
      setFormData({ name: "", email: "", phone: "", notes: "" })
      setEmailExists(null)
      setIsSubmitting(false)
      onClose()
    },
    onError: (error) => {
      console.error("Failed to add client:", error)
      setIsSubmitting(false)
    },
  })

  const checkEmail = async (email: string) => {
    if (!email || !email.includes("@")) {
      setEmailExists(null)
      return
    }

    try {
      const exists = await utils.user.checkEmailExists.fetch({ email })
      setEmailExists(exists)
    } catch (error) {
      setEmailExists(null)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsSubmitting(true)
    addClient.mutate({
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    })
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (name === "email") {
      checkEmail(value)
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
      <div
        className='w-full max-w-md rounded-lg shadow-lg border'
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Header */}
        <div
          className='flex items-center justify-between p-6 border-b'
          style={{ borderColor: "#606364" }}
        >
          <div className='flex items-center gap-3'>
            <div
              className='w-10 h-10 rounded-full flex items-center justify-center'
              style={{ backgroundColor: "#4A5A70" }}
            >
              <User
                className='h-5 w-5'
                style={{ color: "#C3BCC2" }}
              />
            </div>
            <div>
              <h2
                className='text-xl font-bold'
                style={{ color: "#C3BCC2" }}
              >
                Add New Client
              </h2>
              <p
                className='text-sm'
                style={{ color: "#ABA4AA" }}
              >
                Create a new client profile
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-2 rounded-lg transition-colors'
            style={{ color: "#ABA4AA" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#606364"
              e.currentTarget.style.color = "#C3BCC2"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent"
              e.currentTarget.style.color = "#ABA4AA"
            }}
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className='p-6'
        >
          <div className='space-y-4'>
            {/* Name Field */}
            <div>
              <label
                htmlFor='name'
                className='block text-sm font-medium mb-2'
                style={{ color: "#C3BCC2" }}
              >
                Full Name *
              </label>
              <div className='relative'>
                <User
                  className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4'
                  style={{ color: "#ABA4AA" }}
                />
                <input
                  type='text'
                  id='name'
                  name='name'
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className='w-full pl-10 pr-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2'
                  style={{
                    backgroundColor: "#2A3133",
                    borderColor: "#606364",
                    color: "#C3BCC2",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#4A5A70"
                    e.currentTarget.style.boxShadow =
                      "0 0 0 2px rgba(74, 90, 112, 0.2)"
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#606364"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                  placeholder='Enter client name'
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium mb-2'
                style={{ color: "#C3BCC2" }}
              >
                Email Address
              </label>
              <div className='relative'>
                <Mail
                  className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4'
                  style={{ color: "#ABA4AA" }}
                />
                <input
                  type='email'
                  id='email'
                  name='email'
                  value={formData.email}
                  onChange={handleInputChange}
                  className='w-full pl-10 pr-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2'
                  style={{
                    backgroundColor: "#2A3133",
                    borderColor: "#606364",
                    color: "#C3BCC2",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#4A5A70"
                    e.currentTarget.style.boxShadow =
                      "0 0 0 2px rgba(74, 90, 112, 0.2)"
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#606364"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                  placeholder='client@example.com'
                />
              </div>
              {formData.email && emailExists !== null && (
                <div className='flex items-center gap-2 mt-2'>
                  {emailExists ? (
                    <>
                      <CheckCircle className='h-4 w-4 text-green-400' />
                      <p
                        className='text-xs'
                        style={{ color: "#10B981" }}
                      >
                        Will automatically link when they sign up
                      </p>
                    </>
                  ) : (
                    <>
                      <Circle
                        className='h-4 w-4'
                        style={{ color: "#ABA4AA" }}
                      />
                      <p
                        className='text-xs'
                        style={{ color: "#ABA4AA" }}
                      >
                        New client - they can register later
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label
                htmlFor='phone'
                className='block text-sm font-medium mb-2'
                style={{ color: "#C3BCC2" }}
              >
                Phone Number
              </label>
              <div className='relative'>
                <Phone
                  className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4'
                  style={{ color: "#ABA4AA" }}
                />
                <input
                  type='tel'
                  id='phone'
                  name='phone'
                  value={formData.phone}
                  onChange={handleInputChange}
                  className='w-full pl-10 pr-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2'
                  style={{
                    backgroundColor: "#2A3133",
                    borderColor: "#606364",
                    color: "#C3BCC2",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#4A5A70"
                    e.currentTarget.style.boxShadow =
                      "0 0 0 2px rgba(74, 90, 112, 0.2)"
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#606364"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                  placeholder='(555) 123-4567'
                />
              </div>
            </div>

            {/* Notes Field */}
            <div>
              <label
                htmlFor='notes'
                className='block text-sm font-medium mb-2'
                style={{ color: "#C3BCC2" }}
              >
                Notes
              </label>
              <textarea
                id='notes'
                name='notes'
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className='w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 resize-none'
                style={{
                  backgroundColor: "#2A3133",
                  borderColor: "#606364",
                  color: "#C3BCC2",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#4A5A70"
                  e.currentTarget.style.boxShadow =
                    "0 0 0 2px rgba(74, 90, 112, 0.2)"
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#606364"
                  e.currentTarget.style.boxShadow = "none"
                }}
                placeholder='Additional notes about the client...'
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className='flex gap-3 mt-6'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 px-4 py-2 rounded-lg border transition-colors font-medium'
              style={{
                borderColor: "#606364",
                color: "#C3BCC2",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#606364"
                e.currentTarget.style.borderColor = "#ABA4AA"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent"
                e.currentTarget.style.borderColor = "#606364"
              }}
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isSubmitting || !formData.name.trim()}
              className='flex-1 px-4 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
              style={{
                backgroundColor: "#4A5A70",
                color: "#C3BCC2",
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = "#606364"
                  e.currentTarget.style.boxShadow =
                    "0 4px 15px rgba(0, 0, 0, 0.2)"
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = "#4A5A70"
                  e.currentTarget.style.boxShadow = "none"
                }
              }}
            >
              {isSubmitting ? (
                <div className='flex items-center gap-2'>
                  <div
                    className='animate-spin rounded-full h-4 w-4 border-b-2'
                    style={{ borderColor: "#C3BCC2" }}
                  ></div>
                  Adding...
                </div>
              ) : (
                "Add Client"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
