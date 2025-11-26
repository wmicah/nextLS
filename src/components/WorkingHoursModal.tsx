"use client";

import React, { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import { Save, X } from "lucide-react";
import CustomSelect from "./ui/CustomSelect";
import { COLORS, getGreenPrimary, getRedAlert } from "@/lib/colors";

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
          startTime:
            (existingConfig as any).startTime || baseStart,
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
    createCustomHoursState(
      defaultStartTime,
      defaultEndTime,
      [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ]
    )
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
        workingHoursCustom ||
        (coachProfile as any)?.customWorkingHours ||
        null;

      const normalizedCustom = existingCustom
        ? createCustomHoursState(startTime, endTime, workingDays, existingCustom)
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
      ? dayOrder.reduce(
          (acc, day) => {
            const config = customWorkingHours[day];
            if (!config) return acc;
            acc[day] = {
              enabled: config.enabled,
              ...(config.enabled
                ? { startTime: config.startTime, endTime: config.endTime }
                : {}),
            };
            return acc;
          },
          {} as Record<
            string,
            { enabled: boolean; startTime?: string; endTime?: string }
          >
        )
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
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-md"
      style={{ backgroundColor: "rgba(21, 25, 26, 0.75)" }}
    >
      <div
        className="rounded-2xl shadow-xl border w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: COLORS.BACKGROUND_CARD,
          borderColor: COLORS.BORDER_SUBTLE,
        }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1" style={{ color: COLORS.TEXT_PRIMARY }}>
                Working Hours
              </h2>
              <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                Configure your availability for scheduling lessons
              </p>
            </div>
            <button
              onClick={onClose}
              className="transition-colors p-2 -m-2"
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Time Settings */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.TEXT_PRIMARY }}>
                  Time Range
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
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
                        backgroundColor: COLORS.BACKGROUND_DARK,
                        borderColor: COLORS.BORDER_SUBTLE,
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
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
                        backgroundColor: COLORS.BACKGROUND_DARK,
                        borderColor: isTimeConfigurationValid()
                          ? COLORS.BORDER_SUBTLE
                          : COLORS.RED_ALERT,
                      }}
                    />
                    {!isTimeConfigurationValid() && (
                      <p className="text-xs mt-1" style={{ color: COLORS.RED_ALERT }}>
                        End time must be after start time
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.TEXT_PRIMARY }}>
                  Time Slot Settings
                </h3>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
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
                      backgroundColor: COLORS.BACKGROUND_DARK,
                      borderColor: COLORS.BORDER_SUBTLE,
                    }}
                  />
                  <p className="text-xs mt-2" style={{ color: COLORS.TEXT_MUTED }}>
                    Choose how often you want time slots to be available for
                    booking
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Working Days */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.TEXT_PRIMARY }}>
                Working Days
              </h3>
              <div
                className="flex items-center justify-between rounded-lg border px-4 py-3"
                style={{ 
                  borderColor: COLORS.BORDER_SUBTLE, 
                  backgroundColor: COLORS.BACKGROUND_DARK,
                }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                    Customize hours per day
                  </p>
                  <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                    Enable to set unique start/end times for each day.
                  </p>
                </div>
                <label className="flex items-center gap-2">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: useCustomHours ? COLORS.GREEN_PRIMARY : COLORS.TEXT_MUTED }}
                  >
                    {useCustomHours ? "On" : "Off"}
                  </span>
                  <input
                    type="checkbox"
                    checked={useCustomHours}
                    onChange={event =>
                      handleCustomHoursToggle(event.target.checked)
                    }
                    className="h-5 w-5 rounded border bg-transparent focus:ring-0"
                    style={{
                      borderColor: COLORS.BORDER_SUBTLE,
                      accentColor: COLORS.GREEN_PRIMARY,
                    }}
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
                          borderColor: enabled ? COLORS.GREEN_PRIMARY : COLORS.BORDER_SUBTLE,
                          backgroundColor: enabled
                            ? getGreenPrimary(0.1)
                            : COLORS.BACKGROUND_DARK,
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold" style={{ color: COLORS.TEXT_PRIMARY }}>
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
                            className="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
                            style={{
                              backgroundColor: enabled ? COLORS.GREEN_PRIMARY : COLORS.BACKGROUND_CARD,
                              color: enabled ? COLORS.BACKGROUND_DARK : COLORS.TEXT_SECONDARY,
                              border: enabled ? "none" : `1px solid ${COLORS.BORDER_SUBTLE}`,
                            }}
                            onMouseEnter={e => {
                              if (!enabled) {
                                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                              }
                            }}
                            onMouseLeave={e => {
                              if (!enabled) {
                                e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
                                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                              }
                            }}
                          >
                            {enabled ? "Enabled" : "Disabled"}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: COLORS.TEXT_SECONDARY }}>
                              Start Time
                            </label>
                            <CustomSelect
                              value={config?.startTime || workingHours.startTime}
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
                                backgroundColor: COLORS.BACKGROUND_DARK,
                                borderColor: COLORS.BORDER_SUBTLE,
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: COLORS.TEXT_SECONDARY }}>
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
                                backgroundColor: COLORS.BACKGROUND_DARK,
                                borderColor: COLORS.BORDER_SUBTLE,
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
                  {dayOrder.map(day => {
                    const isEnabled = workingHours.workingDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWorkingDay(day)}
                        className="w-full p-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between border"
                        style={{
                          backgroundColor: isEnabled
                            ? COLORS.BACKGROUND_CARD
                            : COLORS.BACKGROUND_DARK,
                          borderColor: isEnabled
                            ? COLORS.GREEN_PRIMARY
                            : COLORS.BORDER_SUBTLE,
                          color: isEnabled
                            ? COLORS.TEXT_PRIMARY
                            : COLORS.TEXT_SECONDARY,
                        }}
                        onMouseEnter={e => {
                          if (!isEnabled) {
                            e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                            e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isEnabled) {
                            e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_DARK;
                            e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                          }
                        }}
                      >
                        <span className="font-medium">{day}</span>
                        <div
                          className="w-4 h-4 rounded-full border-2"
                          style={{
                            borderColor: isEnabled
                              ? COLORS.GREEN_PRIMARY
                              : COLORS.BORDER_SUBTLE,
                            backgroundColor: isEnabled
                              ? COLORS.GREEN_PRIMARY
                              : "transparent",
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="text-xs mt-3" style={{ color: COLORS.TEXT_MUTED }}>
                Select the days you're available for lessons. When custom hours
                are enabled, clients can only book during the specific times set
                for each day.
              </p>
            </div>
          </div>

          {/* Preview Section */}
          <div
            className="mt-8 p-4 rounded-lg border"
            style={{ backgroundColor: COLORS.BACKGROUND_DARK, borderColor: COLORS.BORDER_SUBTLE }}
          >
            <h3 className="text-lg font-semibold mb-3" style={{ color: COLORS.TEXT_PRIMARY }}>Preview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span style={{ color: COLORS.TEXT_SECONDARY }}>Working Hours:</span>
                <span className="ml-2" style={{ color: COLORS.TEXT_PRIMARY }}>
                  {workingHours.startTime} - {workingHours.endTime}
                </span>
              </div>
              <div>
                <span style={{ color: COLORS.TEXT_SECONDARY }}>Time Slots:</span>
                <span className="ml-2" style={{ color: COLORS.TEXT_PRIMARY }}>
                  Every {workingHours.timeSlotInterval} minutes
                </span>
              </div>
              <div className="sm:col-span-2">
                <span style={{ color: COLORS.TEXT_SECONDARY }}>Available Days:</span>
                <span className="ml-2" style={{ color: COLORS.TEXT_PRIMARY }}>
                  {workingHours.workingDays.length > 0
                    ? workingHours.workingDays
                        .sort(
                          (a, b) =>
                            dayOrder.indexOf(a) - dayOrder.indexOf(b)
                        )
                        .join(", ")
                    : "No days selected"}
                </span>
              </div>
              {useCustomHours && (
                <div className="sm:col-span-2">
                  <span style={{ color: COLORS.TEXT_SECONDARY }}>Daily Schedule:</span>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {dayOrder.map(day => {
                      const config = customWorkingHours[day];
                      const enabled = config?.enabled ?? false;
                      return (
                        <div
                          key={day}
                          className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs"
                          style={{
                            borderColor: enabled
                              ? COLORS.GREEN_PRIMARY
                              : COLORS.BORDER_SUBTLE,
                            backgroundColor: enabled
                              ? getGreenPrimary(0.1)
                              : COLORS.BACKGROUND_DARK,
                            color: enabled
                              ? COLORS.TEXT_PRIMARY
                              : COLORS.TEXT_MUTED,
                          }}
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
            <button
              onClick={handleSaveWorkingHours}
              disabled={
                updateWorkingHoursMutation.isPending ||
                !isTimeConfigurationValid()
              }
              className="flex-1 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              {updateWorkingHoursMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: COLORS.BACKGROUND_DARK }} />
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
