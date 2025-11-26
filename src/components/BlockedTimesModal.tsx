"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import {
  X,
  Plus,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Edit,
  Trash2,
  Save,
} from "lucide-react";
import { format, addDays, addHours } from "date-fns";
import { COLORS, getRedAlert, getGreenPrimary } from "@/lib/colors";

interface BlockedTimesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  month: number;
  year: number;
}

export default function BlockedTimesModal({
  isOpen,
  onClose,
  selectedDate,
  month,
  year,
}: BlockedTimesModalProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBlockedTime, setEditingBlockedTime] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    isAllDay: false,
  });

  // Fetch all blocked times (not just current month)
  const { data: blockedTimes = [], refetch: refetchBlockedTimes } =
    trpc.blockedTimes.getAllBlockedTimes.useQuery();

  // Create blocked time mutation
  const createBlockedTimeMutation =
    trpc.blockedTimes.createBlockedTime.useMutation({
      onSuccess: () => {
        refetchBlockedTimes();
        setShowAddForm(false);
        resetForm();
      },
    });

  // Update blocked time mutation
  const updateBlockedTimeMutation =
    trpc.blockedTimes.updateBlockedTime.useMutation({
      onSuccess: () => {
        refetchBlockedTimes();
        setEditingBlockedTime(null);
        resetForm();
      },
    });

  // Delete blocked time mutation
  const deleteBlockedTimeMutation =
    trpc.blockedTimes.deleteBlockedTime.useMutation({
      onSuccess: () => {
        refetchBlockedTimes();
      },
    });

  // Initialize form with selected date if provided
  useEffect(() => {
    if (selectedDate && isOpen) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      setFormData(prev => ({
        ...prev,
        startDate: dateStr,
        endDate: dateStr,
        startTime: "09:00",
        endTime: "17:00",
      }));
    }
  }, [selectedDate, isOpen]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      isAllDay: false,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert("Title is required");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      alert("Start and end dates are required");
      return;
    }

    if (!formData.isAllDay && (!formData.startTime || !formData.endTime)) {
      alert("Start and end times are required");
      return;
    }

    // Create datetime strings
    const startDateTime = formData.isAllDay
      ? `${formData.startDate}T00:00:00`
      : `${formData.startDate}T${formData.startTime}:00`;

    const endDateTime = formData.isAllDay
      ? `${formData.endDate}T23:59:59`
      : `${formData.endDate}T${formData.endTime}:00`;

    if (editingBlockedTime) {
      updateBlockedTimeMutation.mutate({
        id: editingBlockedTime.id,
        title: formData.title,
        description: formData.description,
        startTime: startDateTime,
        endTime: endDateTime,
        isAllDay: formData.isAllDay,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    } else {
      createBlockedTimeMutation.mutate({
        title: formData.title,
        description: formData.description,
        startTime: startDateTime,
        endTime: endDateTime,
        isAllDay: formData.isAllDay,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    }
  };

  const handleEdit = (blockedTime: any) => {
    setEditingBlockedTime(blockedTime);
    setFormData({
      title: blockedTime.title,
      description: blockedTime.description || "",
      startDate: format(new Date(blockedTime.startTime), "yyyy-MM-dd"),
      startTime: format(new Date(blockedTime.startTime), "HH:mm"),
      endDate: format(new Date(blockedTime.endTime), "yyyy-MM-dd"),
      endTime: format(new Date(blockedTime.endTime), "HH:mm"),
      isAllDay: blockedTime.isAllDay,
    });
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this blocked time?")) {
      deleteBlockedTimeMutation.mutate({ id });
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingBlockedTime(null);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md"
      style={{ backgroundColor: "rgba(21, 25, 26, 0.75)" }}
    >
      <div
        className="rounded-2xl shadow-xl border p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: COLORS.BACKGROUND_CARD,
          borderColor: COLORS.BORDER_SUBTLE,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>All Blocked Times</h2>
            <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
              Manage your unavailable periods across all months (vacations,
              appointments, etc.)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
              style={{
                backgroundColor: COLORS.GREEN_PRIMARY,
                color: COLORS.BACKGROUND_DARK,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = COLORS.GREEN_DARK;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = COLORS.GREEN_PRIMARY;
              }}
            >
              <Plus className="h-4 w-4" />
              Add Blocked Time
            </button>
            <button
              onClick={onClose}
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
        </div>

        {/* Content */}
        <div>
          {showAddForm ? (
            /* Add/Edit Form */
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5" style={{ color: COLORS.GREEN_PRIMARY }} />
                <h3 className="text-lg font-semibold" style={{ color: COLORS.TEXT_PRIMARY }}>
                  {editingBlockedTime
                    ? "Edit Blocked Time"
                    : "Add Blocked Time"}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: COLORS.TEXT_SECONDARY }}>
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full p-2 rounded-lg border"
                      style={{
                        backgroundColor: COLORS.BACKGROUND_DARK,
                        borderColor: COLORS.BORDER_SUBTLE,
                        color: COLORS.TEXT_PRIMARY,
                      }}
                      placeholder="e.g., Vacation, Doctor Appointment"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: COLORS.TEXT_SECONDARY }}>
                      All Day Event
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isAllDay}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            isAllDay: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 rounded"
                        style={{
                          accentColor: COLORS.GREEN_PRIMARY,
                        }}
                      />
                      <span className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                        Block entire day(s)
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: COLORS.TEXT_SECONDARY }}>
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
                    className="w-full p-2 rounded-lg border"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_DARK,
                      borderColor: COLORS.BORDER_SUBTLE,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                    rows={3}
                    placeholder="Optional description..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: COLORS.TEXT_SECONDARY }}>
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
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
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          endDate: e.target.value,
                        }))
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

                {!formData.isAllDay && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: COLORS.TEXT_SECONDARY }}>
                        Start Time *
                      </label>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            startTime: e.target.value,
                          }))
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
                        End Time *
                      </label>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            endTime: e.target.value,
                          }))
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
                )}

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={
                      createBlockedTimeMutation.isPending ||
                      updateBlockedTimeMutation.isPending
                    }
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
                    {editingBlockedTime ? "Update" : "Create"} Blocked Time
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
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
          ) : (
            /* Blocked Times List */
            <div className="space-y-4">
              {blockedTimes.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-4" style={{ color: COLORS.TEXT_MUTED }} />
                  <h3 className="text-lg font-semibold mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
                    No Blocked Times
                  </h3>
                  <p className="mb-4" style={{ color: COLORS.TEXT_SECONDARY }}>
                    You haven't blocked any time periods yet. Block times to
                    prevent clients from scheduling during vacations,
                    appointments, or other unavailable periods.
                  </p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 mx-auto"
                    style={{
                      backgroundColor: COLORS.GREEN_PRIMARY,
                      color: COLORS.BACKGROUND_DARK,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = COLORS.GREEN_DARK;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = COLORS.GREEN_PRIMARY;
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add Your First Blocked Time
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    // Group blocked times by month/year
                    const groupedTimes = blockedTimes.reduce(
                      (groups: any, blockedTime: any) => {
                        const date = new Date(blockedTime.startTime);
                        const monthYear = format(date, "MMMM yyyy");

                        if (!groups[monthYear]) {
                          groups[monthYear] = [];
                        }
                        groups[monthYear].push(blockedTime);
                        return groups;
                      },
                      {}
                    );

                    return Object.entries(groupedTimes).map(
                      ([monthYear, times]: [string, any]) => (
                        <div key={monthYear}>
                          <h3
                            className="text-lg font-semibold mb-3 border-b pb-2"
                            style={{ 
                              color: COLORS.TEXT_PRIMARY,
                              borderColor: COLORS.BORDER_SUBTLE,
                            }}
                          >
                            {monthYear}
                          </h3>
                          <div className="space-y-3">
                            {times.map((blockedTime: any) => (
                              <div
                                key={blockedTime.id}
                                className="p-4 rounded-lg border"
                                style={{
                                  backgroundColor: COLORS.BACKGROUND_DARK,
                                  borderColor: COLORS.BORDER_SUBTLE,
                                }}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="font-semibold" style={{ color: COLORS.TEXT_PRIMARY }}>
                                        {blockedTime.title}
                                      </h4>
                                      {blockedTime.isAllDay && (
                                        <span
                                          className="px-2 py-1 text-xs rounded-full"
                                          style={{
                                            backgroundColor: getRedAlert(0.2),
                                            color: COLORS.RED_ALERT,
                                            border: `1px solid ${COLORS.RED_ALERT}`,
                                          }}
                                        >
                                          All Day
                                        </span>
                                      )}
                                    </div>

                                    {blockedTime.description && (
                                      <p className="text-sm mb-2" style={{ color: COLORS.TEXT_SECONDARY }}>
                                        {blockedTime.description}
                                      </p>
                                    )}

                                    <div
                                      className="flex items-center gap-4 text-sm"
                                      style={{ color: COLORS.TEXT_SECONDARY }}
                                    >
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>
                                          {format(
                                            new Date(blockedTime.startTime),
                                            "MMM d, yyyy"
                                          )}
                                          {!blockedTime.isAllDay && (
                                            <span>
                                              {" "}
                                              at{" "}
                                              {format(
                                                new Date(blockedTime.startTime),
                                                "h:mm a"
                                              )}
                                            </span>
                                          )}
                                        </span>
                                      </div>

                                      {!blockedTime.isAllDay && (
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-4 w-4" />
                                          <span>
                                            {format(
                                              new Date(blockedTime.startTime),
                                              "h:mm a"
                                            )}{" "}
                                            -{" "}
                                            {format(
                                              new Date(blockedTime.endTime),
                                              "h:mm a"
                                            )}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleEdit(blockedTime)}
                                      className="p-2 rounded-lg transition-colors"
                                      style={{
                                        color: COLORS.TEXT_SECONDARY,
                                        backgroundColor: "transparent",
                                      }}
                                      onMouseEnter={e => {
                                        e.currentTarget.style.backgroundColor =
                                          COLORS.BACKGROUND_CARD_HOVER;
                                        e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                                      }}
                                      onMouseLeave={e => {
                                        e.currentTarget.style.backgroundColor =
                                          "transparent";
                                        e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDelete(blockedTime.id)
                                      }
                                      className="p-2 rounded-lg transition-colors"
                                      style={{
                                        color: COLORS.RED_ALERT,
                                        backgroundColor: "transparent",
                                      }}
                                      onMouseEnter={e => {
                                        e.currentTarget.style.backgroundColor =
                                          getRedAlert(0.2);
                                      }}
                                      onMouseLeave={e => {
                                        e.currentTarget.style.backgroundColor =
                                          "transparent";
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
