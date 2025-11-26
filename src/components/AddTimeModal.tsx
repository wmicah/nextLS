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
import { COLORS, getGreenPrimary } from "@/lib/colors";

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
    date: "",
    time: "",
    duration: 60, // Default 60 minutes
  });

  const utils = trpc.useUtils();

  // Schedule lesson with freedom mutation
  const scheduleLessonMutation =
    trpc.scheduling.scheduleLessonWithFreedom.useMutation({
      onSuccess: () => {
        // Invalidate schedule queries to refresh the schedule page
        utils.scheduling.getCoachSchedule.invalidate();
        utils.scheduling.getCoachUpcomingLessons.invalidate();
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
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md"
      style={{ backgroundColor: "rgba(21, 25, 26, 0.75)" }}
    >
      <div
        className="rounded-2xl shadow-xl border p-6 w-full max-w-2xl mx-4"
        style={{
          backgroundColor: COLORS.BACKGROUND_CARD,
          borderColor: COLORS.BORDER_SUBTLE,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>Add Lesson</h2>
            <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
              Schedule a lesson at any time, regardless of working hours
            </p>
          </div>
          <button
            onClick={handleClose}
            className="transition-colors"
            style={{ color: COLORS.TEXT_SECONDARY }}
            onMouseEnter={e => {
              e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
            }}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: COLORS.TEXT_SECONDARY }}>
                Client *
              </label>
              <select
                value={formData.clientId}
                onChange={e =>
                  setFormData(prev => ({ ...prev, clientId: e.target.value }))
                }
                className="w-full p-2 rounded-lg border"
                style={{
                  backgroundColor: COLORS.BACKGROUND_DARK,
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
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
                <label className="block text-sm font-medium mb-2" style={{ color: COLORS.TEXT_SECONDARY }}>
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, date: e.target.value }))
                  }
                  className="w-full p-2 rounded-lg border"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_DARK,
                    borderColor: COLORS.BORDER_SUBTLE,
                    color: COLORS.TEXT_PRIMARY,
                  }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: COLORS.TEXT_SECONDARY }}>
                  Time *
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, time: e.target.value }))
                  }
                  className="w-full p-2 rounded-lg border"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_DARK,
                    borderColor: COLORS.BORDER_SUBTLE,
                    color: COLORS.TEXT_PRIMARY,
                  }}
                  required
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: COLORS.TEXT_SECONDARY }}>
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
                className="w-full p-2 rounded-lg border"
                style={{
                  backgroundColor: COLORS.BACKGROUND_DARK,
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
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

            {/* Info Box */}
            <div
              className="p-4 rounded-lg border"
              style={{ 
                backgroundColor: COLORS.BACKGROUND_DARK,
                borderColor: COLORS.BORDER_SUBTLE,
              }}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 mt-0.5" style={{ color: COLORS.GOLDEN_ACCENT }} />
                <div>
                  <h4 className="font-medium mb-1" style={{ color: COLORS.TEXT_PRIMARY }}>
                    Complete Time Freedom
                  </h4>
                  <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
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
                  backgroundColor: COLORS.GREEN_PRIMARY,
                  color: COLORS.BACKGROUND_DARK,
                }}
                onMouseEnter={e => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = COLORS.GREEN_DARK;
                  }
                }}
                onMouseLeave={e => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = COLORS.GREEN_PRIMARY;
                  }
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
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_SECONDARY,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                  e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
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
