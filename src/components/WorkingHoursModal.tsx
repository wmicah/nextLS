"use client";

import React, { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import { Save, X } from "lucide-react";
import CustomSelect from "./ui/CustomSelect";

interface WorkingHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  coachProfile?: {
    workingHours?: {
      startTime: string;
      endTime: string;
      workingDays: string[];
      timeSlotInterval: number;
    };
  } | null;
}

export default function WorkingHoursModal({
  isOpen,
  onClose,
  coachProfile,
}: WorkingHoursModalProps) {
  const [workingHours, setWorkingHours] = useState({
    startTime: "9:00 AM",
    endTime: "8:00 PM",
    workingDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    timeSlotInterval: 60,
  });

  // Update working hours state when coach profile loads
  useEffect(() => {
    if (coachProfile?.workingHours) {
      setWorkingHours({
        startTime: coachProfile.workingHours.startTime,
        endTime: coachProfile.workingHours.endTime,
        workingDays: coachProfile.workingHours.workingDays || [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        timeSlotInterval: coachProfile.workingHours.timeSlotInterval || 60,
      });
    }
  }, [coachProfile]);

  const utils = trpc.useUtils();
  const updateWorkingHoursMutation = trpc.user.updateWorkingHours.useMutation({
    onSuccess: () => {
      utils.user.getProfile.invalidate();
      onClose();
    },
    onError: error => {
      alert(`Error updating working hours: ${error.message}`);
    },
  });

  const handleSaveWorkingHours = () => {
    // Validate that end time is after start time
    const startTime = workingHours.startTime;
    const endTime = workingHours.endTime;

    // Parse times to compare
    const startMatch = startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    const endMatch = endTime.match(/(\d+):(\d+)\s*(AM|PM)/i);

    if (startMatch && endMatch) {
      const [, startHour, startMinute, startPeriod] = startMatch;
      const [, endHour, endMinute, endPeriod] = endMatch;

      // Convert to 24-hour format for comparison
      let startTotalMinutes = parseInt(startHour) * 60 + parseInt(startMinute);
      if (startPeriod.toUpperCase() === "PM" && parseInt(startHour) !== 12)
        startTotalMinutes += 12 * 60;
      if (startPeriod.toUpperCase() === "AM" && parseInt(startHour) === 12)
        startTotalMinutes = parseInt(startMinute);

      let endTotalMinutes = parseInt(endHour) * 60 + parseInt(endMinute);
      if (endPeriod.toUpperCase() === "PM" && parseInt(endHour) !== 12)
        endTotalMinutes += 12 * 60;
      if (endPeriod.toUpperCase() === "AM" && parseInt(endHour) === 12)
        endTotalMinutes = parseInt(endMinute);

      if (endTotalMinutes <= startTotalMinutes) {
        alert("End time must be after start time");
        return;
      }
    }

    updateWorkingHoursMutation.mutate({
      startTime: workingHours.startTime,
      endTime: workingHours.endTime,
      workingDays: workingHours.workingDays,
      timeSlotInterval: workingHours.timeSlotInterval,
    });
  };

  const toggleWorkingDay = (day: string) => {
    setWorkingHours(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day],
    }));
  };

  // Generate time options with 15-minute intervals
  const generateTimeOptions = () => {
    const options = [];

    // Generate AM times (12:00 AM to 11:45 AM)
    for (let hour = 0; hour <= 11; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const displayHour = hour === 0 ? 12 : hour;
        const minuteStr = minute.toString().padStart(2, "0");
        const timeValue = `${displayHour}:${minuteStr} AM`;
        options.push({
          value: timeValue,
          label: timeValue,
        });
      }
    }

    // Generate PM times (12:00 PM to 11:45 PM)
    for (let hour = 0; hour <= 11; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const displayHour = hour === 0 ? 12 : hour;
        const minuteStr = minute.toString().padStart(2, "0");
        const timeValue = `${displayHour}:${minuteStr} PM`;
        options.push({
          value: timeValue,
          label: timeValue,
        });
      }
    }

    return options;
  };

  const timeOptions = generateTimeOptions();
  const intervalOptions = [
    { value: "15", label: "15 minutes" },
    { value: "30", label: "30 minutes" },
    { value: "45", label: "45 minutes" },
    { value: "60", label: "60 minutes (1 hour)" },
    { value: "90", label: "90 minutes (1.5 hours)" },
    { value: "120", label: "120 minutes (2 hours)" },
  ];

  // Check if the current time configuration is valid
  const isTimeConfigurationValid = () => {
    const startTime = workingHours.startTime;
    const endTime = workingHours.endTime;

    const startMatch = startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    const endMatch = endTime.match(/(\d+):(\d+)\s*(AM|PM)/i);

    if (!startMatch || !endMatch) return true; // Don't show error if times aren't parsed yet

    const [, startHour, startMinute, startPeriod] = startMatch;
    const [, endHour, endMinute, endPeriod] = endMatch;

    // Convert to 24-hour format for comparison
    let startTotalMinutes = parseInt(startHour) * 60 + parseInt(startMinute);
    if (startPeriod.toUpperCase() === "PM" && parseInt(startHour) !== 12)
      startTotalMinutes += 12 * 60;
    if (startPeriod.toUpperCase() === "AM" && parseInt(startHour) === 12)
      startTotalMinutes = parseInt(startMinute);

    let endTotalMinutes = parseInt(endHour) * 60 + parseInt(endMinute);
    if (endPeriod.toUpperCase() === "PM" && parseInt(endHour) !== 12)
      endTotalMinutes += 12 * 60;
    if (endPeriod.toUpperCase() === "AM" && parseInt(endHour) === 12)
      endTotalMinutes = parseInt(endMinute);

    return endTotalMinutes > startTotalMinutes;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-2xl shadow-xl border w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Set Working Hours</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 -m-2"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Start Time
              </label>
              <CustomSelect
                value={workingHours.startTime}
                onChange={value =>
                  setWorkingHours({
                    ...workingHours,
                    startTime: value,
                  })
                }
                options={timeOptions}
                placeholder="Select start time"
                style={{
                  backgroundColor: "#2A2F2F",
                  borderColor: "#606364",
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                End Time
              </label>
              <CustomSelect
                value={workingHours.endTime}
                onChange={value =>
                  setWorkingHours({
                    ...workingHours,
                    endTime: value,
                  })
                }
                options={timeOptions}
                placeholder="Select end time"
                style={{
                  backgroundColor: "#2A2F2F",
                  borderColor: isTimeConfigurationValid()
                    ? "#606364"
                    : "#EF4444",
                }}
              />
              {!isTimeConfigurationValid() && (
                <p className="text-xs text-red-400 mt-1">
                  End time must be after start time
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Working Days
              </label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {[
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ].map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWorkingDay(day)}
                    className={`p-3 sm:p-2 rounded-lg text-sm font-medium transition-all duration-200 min-h-[48px] ${
                      workingHours.workingDays.includes(day)
                        ? "bg-blue-500 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Select the days you're available for lessons
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Time Slot Interval
              </label>
              <CustomSelect
                value={workingHours.timeSlotInterval.toString()}
                onChange={value =>
                  setWorkingHours({
                    ...workingHours,
                    timeSlotInterval: parseInt(value),
                  })
                }
                options={intervalOptions}
                placeholder="Select interval"
                style={{
                  backgroundColor: "#2A2F2F",
                  borderColor: "#606364",
                }}
              />
              <p className="text-xs text-gray-400 mt-1">
                Choose how often you want time slots to be available
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 border min-h-[48px]"
              style={{
                backgroundColor: "transparent",
                borderColor: "#606364",
                color: "#FFFFFF",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveWorkingHours}
              disabled={
                updateWorkingHoursMutation.isPending ||
                !isTimeConfigurationValid()
              }
              className="flex-1 px-4 py-3 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
              style={{
                backgroundColor: "#4A5A70",
                color: "#FFFFFF",
              }}
            >
              {updateWorkingHoursMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Hours
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
