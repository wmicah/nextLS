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
      customWorkingHours?: Record<
        string,
        { enabled?: boolean; startTime?: string; endTime?: string }
      > | null;
    };
    customWorkingHours?: Record<
      string,
      { enabled?: boolean; startTime?: string; endTime?: string }
    > | null;
  } | null;
}

export default function WorkingHoursModal({
  isOpen,
  onClose,
  coachProfile,
}: WorkingHoursModalProps) {
  const dayOrder = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  type CustomDayConfig = {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };

  const defaultStartTime = "9:00 AM";
  const defaultEndTime = "8:00 PM";

  const createCustomHoursState = (
    baseStart: string,
    baseEnd: string,
    enabledDays?: string[],
    existing?: Record<string, any>
  ): Record<string, CustomDayConfig> => {
    const enabledSet = new Set(enabledDays || dayOrder);
    return dayOrder.reduce((acc, day) => {
      const existingConfig = existing?.[day];
      if (existingConfig && typeof existingConfig === "object") {
        const enabled =
          (existingConfig as any).enabled !== undefined
            ? Boolean((existingConfig as any).enabled)
            : enabledSet.has(day);
        acc[day] = {
          enabled,
          startTime: (existingConfig as any).startTime || baseStart,
          endTime: (existingConfig as any).endTime || baseEnd,
        };
      } else {
        acc[day] = {
          enabled: enabledSet.has(day),
          startTime: baseStart,
          endTime: baseEnd,
        };
      }
      return acc;
    }, {} as Record<string, CustomDayConfig>);
  };

  const arraysEqual = (a: string[], b: string[]) =>
    a.length === b.length && a.every((value, index) => value === b[index]);

  const convertTimeToMinutes = (time: string) => {
    const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return null;
    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;
    return hour * 60 + minute;
  };

  const isTimeRangeValid = (start: string, end: string) => {
    const startMinutes = convertTimeToMinutes(start);
    const endMinutes = convertTimeToMinutes(end);
    if (startMinutes === null || endMinutes === null) return false;
    return endMinutes > startMinutes;
  };

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

  const [useCustomHours, setUseCustomHours] = useState(false);
  const [customWorkingHours, setCustomWorkingHours] = useState<
    Record<string, CustomDayConfig>
  >(() =>
    createCustomHoursState(defaultStartTime, defaultEndTime, [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ])
  );

  const syncWorkingDaysWithCustom = (
    custom: Record<string, CustomDayConfig>
  ) => {
    const enabledDays = dayOrder.filter(day => custom[day]?.enabled);
    setWorkingHours(prev =>
      arraysEqual(prev.workingDays, enabledDays)
        ? prev
        : {
            ...prev,
            workingDays: enabledDays,
          }
    );
  };

  const updateCustomWorkingHours = (
    day: string,
    updater: (current: CustomDayConfig) => CustomDayConfig
  ) => {
    setCustomWorkingHours(prev => {
      const current = prev[day] || {
        enabled: false,
        startTime: workingHours.startTime,
        endTime: workingHours.endTime,
      };
      const updated = updater(current);
      const next = {
        ...prev,
        [day]: {
          ...current,
          ...updated,
        },
      };
      if (useCustomHours) {
        syncWorkingDaysWithCustom(next);
      }
      return next;
    });
  };

  const handleCustomHoursToggle = (checked: boolean) => {
    setUseCustomHours(checked);
    if (checked) {
      syncWorkingDaysWithCustom(customWorkingHours);
    } else {
      setCustomWorkingHours(prev =>
        createCustomHoursState(
          workingHours.startTime,
          workingHours.endTime,
          workingHours.workingDays,
          prev
        )
      );
    }
  };

  // Update working hours state when coach profile loads
  useEffect(() => {
    if (coachProfile?.workingHours) {
      const {
        startTime = defaultStartTime,
        endTime = defaultEndTime,
        workingDays = dayOrder,
        timeSlotInterval = 60,
        customWorkingHours: workingHoursCustom,
      } = coachProfile.workingHours as any;

      const existingCustom =
        workingHoursCustom || (coachProfile as any)?.customWorkingHours || null;

      const normalizedCustom = existingCustom
        ? createCustomHoursState(
            startTime,
            endTime,
            workingDays,
            existingCustom
          )
        : createCustomHoursState(startTime, endTime, workingDays);

      const derivedWorkingDays = existingCustom
        ? dayOrder.filter(day => normalizedCustom[day]?.enabled)
        : workingDays;

      setWorkingHours({
        startTime,
        endTime,
        workingDays: derivedWorkingDays,
        timeSlotInterval,
      });
      setCustomWorkingHours(normalizedCustom);
      setUseCustomHours(!!existingCustom);
    }
  }, [coachProfile]);

  const utils = trpc.useUtils();
  const updateWorkingHoursMutation = trpc.user.updateWorkingHours.useMutation({
    onSuccess: () => {
      utils.user.getProfile.invalidate();
      onClose();
    },
    onError: (error: { message: string }) => {
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

    if (useCustomHours) {
      for (const day of dayOrder) {
        const config = customWorkingHours[day];
        if (config?.enabled) {
          if (!config.startTime || !config.endTime) {
            alert(
              `Please select start and end times for ${day} when custom hours are enabled.`
            );
            return;
          }
          if (!isTimeRangeValid(config.startTime, config.endTime)) {
            alert(
              `End time must be after start time for ${day} when custom hours are enabled.`
            );
            return;
          }
        }
      }
    }

    const workingDaysPayload = useCustomHours
      ? dayOrder.filter(day => customWorkingHours[day]?.enabled)
      : workingHours.workingDays;

    const customWorkingHoursPayload = useCustomHours
      ? dayOrder.reduce((acc, day) => {
          const config = customWorkingHours[day];
          if (!config) return acc;
          acc[day] = {
            enabled: config.enabled,
            ...(config.enabled
              ? { startTime: config.startTime, endTime: config.endTime }
              : {}),
          };
          return acc;
        }, {} as Record<string, { enabled: boolean; startTime?: string; endTime?: string }>)
      : undefined;

    updateWorkingHoursMutation.mutate({
      startTime: workingHours.startTime,
      endTime: workingHours.endTime,
      workingDays: workingDaysPayload,
      timeSlotInterval: workingHours.timeSlotInterval,
      customWorkingHours: customWorkingHoursPayload,
    });
  };

  const toggleWorkingDay = (day: string) => {
    if (useCustomHours) {
      updateCustomWorkingHours(day, current => ({
        ...current,
        enabled: !current.enabled,
      }));
      return;
    }

    setWorkingHours(prev => {
      const isActive = prev.workingDays.includes(day);
      const updatedDays = isActive
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day];
      const orderedDays = dayOrder.filter(d => updatedDays.includes(d));

      setCustomWorkingHours(prevCustom =>
        createCustomHoursState(
          prev.startTime,
          prev.endTime,
          orderedDays,
          prevCustom
        )
      );

      return {
        ...prev,
        workingDays: orderedDays,
      };
    });
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
                      onChange={value => {
                        setWorkingHours(prev => ({
                          ...prev,
                          startTime: value,
                        }));
                        if (!useCustomHours) {
                          setCustomWorkingHours(prev =>
                            createCustomHoursState(
                              value,
                              workingHours.endTime,
                              workingHours.workingDays,
                              prev
                            )
                          );
                        }
                      }}
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
                      onChange={value => {
                        setWorkingHours(prev => ({
                          ...prev,
                          endTime: value,
                        }));
                        if (!useCustomHours) {
                          setCustomWorkingHours(prev =>
                            createCustomHoursState(
                              workingHours.startTime,
                              value,
                              workingHours.workingDays,
                              prev
                            )
                          );
                        }
                      }}
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
              <div
                className="flex items-center justify-between rounded-lg border px-4 py-3"
                style={{ borderColor: "#4A5A70", backgroundColor: "#1F2426" }}
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    Customize hours per day
                  </p>
                  <p className="text-xs text-gray-400">
                    Enable to set unique start/end times for each day.
                  </p>
                </div>
                <label className="flex items-center gap-2">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: useCustomHours ? "#34D399" : "#9CA3AF" }}
                  >
                    {useCustomHours ? "On" : "Off"}
                  </span>
                  <input
                    type="checkbox"
                    checked={useCustomHours}
                    onChange={event =>
                      handleCustomHoursToggle(event.target.checked)
                    }
                    className="h-5 w-5 rounded border border-gray-600 bg-transparent text-sky-500 focus:ring-0"
                  />
                </label>
              </div>

              {useCustomHours ? (
                <div className="space-y-4 mt-4">
                  {dayOrder.map(day => {
                    const config = customWorkingHours[day];
                    const enabled = config?.enabled ?? false;
                    return (
                      <div
                        key={day}
                        className="rounded-lg border p-4 transition-colors"
                        style={{
                          borderColor: enabled ? "#10B98180" : "#4A5A70",
                          backgroundColor: enabled ? "#10B98114" : "#1F2426",
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-white">
                            {day}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateCustomWorkingHours(day, current => ({
                                ...current,
                                enabled: !current.enabled,
                              }))
                            }
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                              enabled
                                ? "bg-emerald-500 text-white"
                                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            }`}
                          >
                            {enabled ? "Enabled" : "Disabled"}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1">
                              Start Time
                            </label>
                            <CustomSelect
                              value={
                                config?.startTime || workingHours.startTime
                              }
                              onChange={value =>
                                updateCustomWorkingHours(day, current => ({
                                  ...current,
                                  startTime: value,
                                }))
                              }
                              options={timeOptions}
                              placeholder="Select start time"
                              disabled={!enabled}
                              style={{
                                backgroundColor: "#2A2F2F",
                                borderColor: "#606364",
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1">
                              End Time
                            </label>
                            <CustomSelect
                              value={config?.endTime || workingHours.endTime}
                              onChange={value =>
                                updateCustomWorkingHours(day, current => ({
                                  ...current,
                                  endTime: value,
                                }))
                              }
                              options={timeOptions}
                              placeholder="Select end time"
                              disabled={!enabled}
                              style={{
                                backgroundColor: "#2A2F2F",
                                borderColor: "#606364",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  {dayOrder.map(day => (
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
              )}
              <p className="text-xs text-gray-400 mt-3">
                Select the days you're available for lessons. When custom hours
                are enabled, clients can only book during the specific times set
                for each day.
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
                        .sort(
                          (a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b)
                        )
                        .join(", ")
                    : "No days selected"}
                </span>
              </div>
              {useCustomHours && (
                <div className="sm:col-span-2">
                  <span className="text-gray-400">Daily Schedule:</span>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {dayOrder.map(day => {
                      const config = customWorkingHours[day];
                      const enabled = config?.enabled ?? false;
                      return (
                        <div
                          key={day}
                          className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                            enabled
                              ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-100"
                              : "border-gray-700 bg-gray-800/60 text-gray-400"
                          }`}
                        >
                          <span className="font-semibold">{day}</span>
                          <span className="font-medium">
                            {enabled && config?.startTime && config?.endTime
                              ? `${config.startTime} - ${config.endTime}`
                              : "Unavailable"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
