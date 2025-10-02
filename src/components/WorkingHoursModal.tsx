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
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
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
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
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
        className="rounded-2xl shadow-xl border w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Working Hours
              </h2>
              <p className="text-sm text-gray-400">
                Configure your availability for scheduling lessons
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 -m-2"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Time Settings */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Time Range
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Time Slot Settings
                </h3>
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
                  <p className="text-xs text-gray-400 mt-2">
                    Choose how often you want time slots to be available for
                    booking
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Working Days */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Working Days
              </h3>
              <div className="space-y-3">
                {[
                  "Sunday",
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                ].map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWorkingDay(day)}
                    className={`w-full p-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between ${
                      workingHours.workingDays.includes(day)
                        ? "text-white shadow-lg"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
                    }`}
                    style={{
                      backgroundColor: workingHours.workingDays.includes(day)
                        ? "#4A5A70"
                        : undefined,
                    }}
                  >
                    <span className="font-medium">{day}</span>
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        workingHours.workingDays.includes(day)
                          ? "bg-white border-white"
                          : "border-gray-400"
                      }`}
                    >
                      {workingHours.workingDays.includes(day) && (
                        <div
                          className="w-full h-full rounded-full"
                          style={{ backgroundColor: "#10B981" }}
                        />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Select the days you're available for lessons. Clients can only
                book during your working hours.
              </p>
            </div>
          </div>

          {/* Preview Section */}
          <div
            className="mt-8 p-4 rounded-lg border"
            style={{ backgroundColor: "#2A2F2F", borderColor: "#606364" }}
          >
            <h3 className="text-lg font-semibold text-white mb-3">Preview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Working Hours:</span>
                <span className="text-white ml-2">
                  {workingHours.startTime} - {workingHours.endTime}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Time Slots:</span>
                <span className="text-white ml-2">
                  Every {workingHours.timeSlotInterval} minutes
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-gray-400">Available Days:</span>
                <span className="text-white ml-2">
                  {workingHours.workingDays.length > 0
                    ? workingHours.workingDays
                        .sort((a, b) => {
                          const dayOrder = [
                            "Sunday",
                            "Monday",
                            "Tuesday",
                            "Wednesday",
                            "Thursday",
                            "Friday",
                            "Saturday",
                          ];
                          return dayOrder.indexOf(a) - dayOrder.indexOf(b);
                        })
                        .join(", ")
                    : "No days selected"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 border"
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
              className="flex-1 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                backgroundColor: "#10B981",
                color: "#FFFFFF",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = "#059669";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "#10B981";
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
                  Save Working Hours
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
