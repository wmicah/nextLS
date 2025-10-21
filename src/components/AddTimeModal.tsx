"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import {
  X,
  Clock,
  Calendar,
  User,
  Save,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { format, addDays, addHours } from "date-fns";

interface AddTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  clients: Array<{
    id: string;
    name: string;
    email: string | null;
  }>;
}

export default function AddTimeModal({
  isOpen,
  onClose,
  selectedDate,
  clients,
}: AddTimeModalProps) {
  const [formData, setFormData] = useState({
    clientId: "",
    title: "",
    description: "",
    date: "",
    time: "",
    duration: 60, // Default 60 minutes
  });

  // Schedule lesson with freedom mutation
  const scheduleLessonMutation =
    trpc.scheduling.scheduleLessonWithFreedom.useMutation({
      onSuccess: () => {
        onClose();
        resetForm();
      },
    });

  // Initialize form with selected date if provided
  useEffect(() => {
    if (selectedDate && isOpen) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const timeStr = format(selectedDate, "HH:mm");
      setFormData(prev => ({
        ...prev,
        date: dateStr,
        time: timeStr,
      }));
    }
  }, [selectedDate, isOpen]);

  const resetForm = () => {
    setFormData({
      clientId: "",
      title: "",
      description: "",
      date: "",
      time: "",
      duration: 60,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientId) {
      alert("Please select a client");
      return;
    }

    if (!formData.date || !formData.time) {
      alert("Date and time are required");
      return;
    }

    // Create datetime string
    const dateTime = `${formData.date}T${formData.time}:00`;

    scheduleLessonMutation.mutate({
      clientId: formData.clientId,
      lessonDate: dateTime,
      duration: formData.duration,
      title: formData.title || undefined,
      description: formData.description || undefined,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="rounded-2xl shadow-xl border p-6 w-full max-w-2xl mx-4"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Add Lesson</h2>
            <p className="text-gray-400 text-sm">
              Schedule a lesson at any time, regardless of working hours
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Client *
              </label>
              <select
                value={formData.clientId}
                onChange={e =>
                  setFormData(prev => ({ ...prev, clientId: e.target.value }))
                }
                className="w-full p-2 rounded-lg border text-white"
                style={{
                  backgroundColor: "#2A2F2F",
                  borderColor: "#606364",
                }}
                required
              >
                <option value="">Select a client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.email && `(${client.email})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, date: e.target.value }))
                  }
                  className="w-full p-2 rounded-lg border text-white"
                  style={{
                    backgroundColor: "#2A2F2F",
                    borderColor: "#606364",
                  }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Time *
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, time: e.target.value }))
                  }
                  className="w-full p-2 rounded-lg border text-white"
                  style={{
                    backgroundColor: "#2A2F2F",
                    borderColor: "#606364",
                  }}
                  required
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duration (minutes) *
              </label>
              <select
                value={formData.duration}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    duration: parseInt(e.target.value),
                  }))
                }
                className="w-full p-2 rounded-lg border text-white"
                style={{
                  backgroundColor: "#2A2F2F",
                  borderColor: "#606364",
                }}
                required
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
                <option value={240}>4 hours</option>
                <option value={300}>5 hours</option>
                <option value={360}>6 hours</option>
                <option value={420}>7 hours</option>
                <option value={480}>8 hours</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Lesson Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e =>
                  setFormData(prev => ({ ...prev, title: e.target.value }))
                }
                className="w-full p-2 rounded-lg border text-white"
                style={{
                  backgroundColor: "#2A2F2F",
                  borderColor: "#606364",
                }}
                placeholder="e.g., Private Lesson, Technique Session"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full p-2 rounded-lg border text-white"
                style={{
                  backgroundColor: "#2A2F2F",
                  borderColor: "#606364",
                }}
                rows={3}
                placeholder="Optional lesson description..."
              />
            </div>

            {/* Info Box */}
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-white mb-1">
                    Complete Time Freedom
                  </h4>
                  <p className="text-sm text-gray-300">
                    This lesson can be scheduled at any time, even outside your
                    normal working hours. Clients will not be able to book
                    during this time, but you have full control.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={scheduleLessonMutation.isPending}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{
                  backgroundColor: "#10B981",
                  color: "#FFFFFF",
                }}
              >
                <Save className="h-4 w-4" />
                {scheduleLessonMutation.isPending
                  ? "Scheduling..."
                  : "Schedule Lesson"}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border"
                style={{
                  backgroundColor: "transparent",
                  borderColor: "#606364",
                  color: "#FFFFFF",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
