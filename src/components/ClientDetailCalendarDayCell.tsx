"use client";

import React, { useMemo } from "react";
import { format } from "date-fns";
import { isSameDay, isSameMonth, isPast, startOfWeek } from "date-fns";
import { COLORS, getGoldenAccent, getGreenPrimary, getRedAlert } from "@/lib/colors";
import { formatTimeInUserTimezone } from "@/lib/timezone-utils";
import { getStatusColor } from "@/lib/clientDetailUtils";
import { CheckCircle, Copy, Clipboard, GripVertical } from "lucide-react";
import { ClipboardData } from "@/types/clipboard";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ClientDetailCalendarDayCellProps {
  day: Date;
  viewMode: "month" | "week";
  currentMonth: Date;
  isSelected: boolean;
  isInSelectedWeek: boolean;
  multiSelectMode: boolean;
  weekSelectMode: boolean;
  lessonsForDay: any[];
  programsForDay: any[];
  videosForDay: any[];
  routineAssignmentsForDay: any[];
  clipboardData: ClipboardData | null;
  onDateClick: (day: Date) => void;
  onCopyDay: (day: Date) => void;
  onPasteDay: (day: Date) => void;
  onToggleDaySelection: (day: Date) => void;
  onWeekSelection: (day: Date) => void;
  setSelectedEventDetails: (details: {
    type: "program" | "routine";
    name: string;
    items: Array<{
      id?: string;
      title: string;
      sets?: number;
      reps?: number;
      routineId?: string;
    }>;
  }) => void;
  onReorderItems?: (date: Date, newOrder: string[]) => void;
  itemOrder?: string[];
  isDesktop?: boolean;
}

interface DayItem {
  id: string;
  type: "lesson" | "program" | "video" | "routine";
  data: any;
  originalIndex: number;
}

export default function ClientDetailCalendarDayCell({
  day,
  viewMode,
  currentMonth,
  isSelected,
  isInSelectedWeek,
  multiSelectMode,
  weekSelectMode,
  lessonsForDay,
  programsForDay,
  videosForDay,
  routineAssignmentsForDay,
  clipboardData,
  onDateClick,
  onCopyDay,
  onPasteDay,
  onToggleDaySelection,
  onWeekSelection,
  setSelectedEventDetails,
  onReorderItems,
  itemOrder,
  isDesktop = false,
}: ClientDetailCalendarDayCellProps) {
  const isToday = isSameDay(day, new Date());
  const isCurrentMonth = isSameMonth(day, currentMonth);
  const isPastDay = isPast(day);
  
  // Day ID for drag-and-drop
  const dayId = `day-${day.toISOString().split("T")[0]}`;

  // Combine all items into a single sortable array
  const allItems = useMemo(() => {
    const items: DayItem[] = [];
    
    lessonsForDay.forEach((lesson, index) => {
      items.push({
        id: `${dayId}-lesson-${lesson.id || index}`,
        type: "lesson",
        data: lesson,
        originalIndex: index,
      });
    });
    
    programsForDay.forEach((program, index) => {
      items.push({
        id: `${dayId}-program-${program.id || program.programDay?.id || index}`,
        type: "program",
        data: program,
        originalIndex: index,
      });
    });
    
    videosForDay.forEach((video, index) => {
      items.push({
        id: `${dayId}-video-${video.id || index}`,
        type: "video",
        data: video,
        originalIndex: index,
      });
    });
    
    routineAssignmentsForDay.forEach((assignment, index) => {
      items.push({
        id: `${dayId}-routine-${assignment.id || index}`,
        type: "routine",
        data: assignment,
        originalIndex: index,
      });
    });
    
    return items;
  }, [dayId, lessonsForDay, programsForDay, videosForDay, routineAssignmentsForDay]);

  // Apply stored order if available, and initialize order for new items
  const orderedItems = useMemo(() => {
    // If no order exists, initialize with current items
    if (!itemOrder || itemOrder.length === 0) {
      if (allItems.length > 0 && onReorderItems) {
        const defaultOrder = allItems.map(item => item.id);
        // Initialize order asynchronously to avoid render loop
        setTimeout(() => {
          onReorderItems(day, defaultOrder);
        }, 0);
      }
      return allItems;
    }
    
    // Apply stored order
    const orderMap = new Map(itemOrder.map((id, index) => [id, index]));
    const ordered = [...allItems].sort((a, b) => {
      const orderA = orderMap.get(a.id) ?? Infinity;
      const orderB = orderMap.get(b.id) ?? Infinity;
      return orderA - orderB;
    });
    
    // Add any new items that weren't in the stored order
    const existingIds = new Set(itemOrder);
    const newItems = allItems.filter(item => !existingIds.has(item.id));
    const result = [...ordered, ...newItems];
    
    // If we have new items, update the order
    if (newItems.length > 0 && onReorderItems) {
      const updatedOrder = [...itemOrder, ...newItems.map(item => item.id)];
      setTimeout(() => {
        onReorderItems(day, updatedOrder);
      }, 0);
    }
    
    return result;
  }, [allItems, itemOrder, day, onReorderItems]);

  const itemIds = orderedItems.map(item => item.id);

  // Make this day a drop target (only for future dates)
  const { setNodeRef, isOver } = useDroppable({
    id: dayId,
    disabled: isPastDay || multiSelectMode || weekSelectMode,
    data: {
      type: "day",
      date: day,
    },
  });

  // Determine background color - highlight when dragging over
  const getBackgroundColor = () => {
    if (isOver && !isPastDay) {
      return getGoldenAccent(0.2); // Highlight when dragging over
    }
    if (isSelected) {
      return getRedAlert(0.15);
    }
    if (isInSelectedWeek) {
      return getGoldenAccent(0.15);
    }
    if (isToday) {
      return getGoldenAccent(0.1);
    }
    if (isPastDay) {
      return COLORS.BACKGROUND_CARD;
    }
    if (isCurrentMonth) {
      return COLORS.BACKGROUND_CARD;
    }
    return COLORS.BACKGROUND_DARK;
  };

  const getBorderColor = () => {
    if (isOver && !isPastDay) {
      return COLORS.GOLDEN_ACCENT; // Highlight border when dragging over
    }
    if (isSelected) {
      return COLORS.RED_ALERT;
    }
    if (isInSelectedWeek) {
      return COLORS.GOLDEN_ACCENT;
    }
    if (isToday) {
      return COLORS.GOLDEN_ACCENT;
    }
    return COLORS.BORDER_SUBTLE;
  };

  return (
    <div
      ref={setNodeRef}
      className={`${
        viewMode === "week" ? "min-h-[200px]" : "min-h-[120px]"
      } p-2 rounded-lg transition-all duration-200 border-2 relative group cursor-pointer`}
      style={{
        backgroundColor: getBackgroundColor(),
        color: isSelected
          ? COLORS.TEXT_PRIMARY
          : isInSelectedWeek
          ? COLORS.TEXT_PRIMARY
          : isToday
          ? COLORS.TEXT_PRIMARY
          : isPastDay
          ? COLORS.TEXT_MUTED
          : isCurrentMonth
          ? COLORS.TEXT_PRIMARY
          : COLORS.TEXT_MUTED,
        borderColor: getBorderColor(),
        borderWidth: isOver && !isPastDay ? "3px" : "2px",
        boxShadow: isSelected
          ? `0 0 0 2px ${COLORS.RED_ALERT}`
          : isInSelectedWeek
          ? `0 0 0 2px ${COLORS.GOLDEN_ACCENT}`
          : isOver && !isPastDay
          ? `0 0 0 3px ${COLORS.GOLDEN_ACCENT}`
          : "none",
      }}
      onMouseEnter={e => {
        if (!isSelected && !isInSelectedWeek && !isToday) {
          e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
          e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
        }
      }}
      onMouseLeave={e => {
        if (!isSelected && !isInSelectedWeek && !isToday) {
          e.currentTarget.style.backgroundColor = isPastDay
            ? COLORS.BACKGROUND_CARD
            : isCurrentMonth
            ? COLORS.BACKGROUND_CARD
            : COLORS.BACKGROUND_DARK;
          e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
        }
      }}
      onClick={
        weekSelectMode
          ? e => {
              e.stopPropagation();
              onWeekSelection(day);
            }
          : multiSelectMode
          ? e => {
              e.stopPropagation();
              onToggleDaySelection(day);
            }
          : undefined
      }
    >
      {/* Selection Checkbox */}
      {multiSelectMode && (
        <div className="absolute top-2 left-2 z-20">
          <div
            className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200"
            style={{
              backgroundColor: isSelected ? COLORS.RED_ALERT : COLORS.BACKGROUND_CARD,
              borderColor: isSelected ? COLORS.RED_DARK : COLORS.BORDER_SUBTLE,
            }}
          >
            {isSelected && (
              <CheckCircle className="h-3 w-3" style={{ color: "#FFFFFF" }} />
            )}
          </div>
        </div>
      )}

      {/* Day Content - clickable area */}
      <div
        onClick={
          !multiSelectMode && !weekSelectMode
            ? e => {
                e.stopPropagation();
                onDateClick(day);
              }
            : weekSelectMode
            ? undefined
            : multiSelectMode
            ? e => {
                e.stopPropagation();
              }
            : undefined
        }
        className={
          !multiSelectMode && !weekSelectMode ? "cursor-pointer h-full" : "h-full"
        }
        style={multiSelectMode ? { paddingLeft: "1.75rem" } : {}}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <div
              className="font-bold text-sm"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              {format(day, "d")}
            </div>
            {/* Copy/Paste Buttons */}
            <div className="flex items-center gap-0.5 relative z-10">
              {/* Copy Button */}
              {(lessonsForDay.length > 0 ||
                programsForDay.length > 0 ||
                routineAssignmentsForDay.length > 0 ||
                videosForDay.length > 0) && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onCopyDay(day);
                  }}
                  className="p-0.5 rounded transition-all duration-200"
                  style={{
                    backgroundColor: "transparent",
                    zIndex: 10,
                    position: "relative",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = getGoldenAccent(0.15);
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  title={
                    isPastDay
                      ? "Copy day assignments (past days can be copied but not pasted to)"
                      : "Copy day assignments"
                  }
                >
                  <Copy
                    className="h-2.5 w-2.5"
                    style={{
                      color: COLORS.GOLDEN_ACCENT,
                      opacity: isPastDay ? 0.9 : 1,
                    }}
                  />
                </button>
              )}

              {/* Paste Button */}
              {clipboardData && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onPasteDay(day);
                  }}
                  className="p-0.5 rounded transition-all duration-200"
                  style={{
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = getGreenPrimary(0.15);
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  title="Paste assignments"
                >
                  <Clipboard
                    className="h-2.5 w-2.5"
                    style={{ color: COLORS.GREEN_PRIMARY }}
                  />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sortable Items */}
        {isDesktop && !isPastDay && !multiSelectMode && !weekSelectMode && orderedItems.length > 0 ? (
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            {orderedItems.map((item) => (
              <SortableDayItem
                key={item.id}
                item={item}
                setSelectedEventDetails={setSelectedEventDetails}
                formatTimeInUserTimezone={formatTimeInUserTimezone}
                getStatusColor={getStatusColor}
              />
            ))}
          </SortableContext>
        ) : (
          // Fallback to non-sortable rendering for mobile, past days, or when in selection mode
          orderedItems.map((item) => (
            <DayItemContent
              key={item.id}
              item={item}
              setSelectedEventDetails={setSelectedEventDetails}
              formatTimeInUserTimezone={formatTimeInUserTimezone}
              getStatusColor={getStatusColor}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Sortable item component
function SortableDayItem({
  item,
  setSelectedEventDetails,
  formatTimeInUserTimezone,
  getStatusColor,
}: {
  item: DayItem;
  setSelectedEventDetails: (details: {
    type: "program" | "routine";
    name: string;
    items: Array<{
      id?: string;
      title: string;
      sets?: number;
      reps?: number;
      routineId?: string;
    }>;
  }) => void;
  formatTimeInUserTimezone: (date: Date) => string;
  getStatusColor: (status: string) => any;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="mb-0.5"
    >
      <DayItemContent
        item={item}
        setSelectedEventDetails={setSelectedEventDetails}
        formatTimeInUserTimezone={formatTimeInUserTimezone}
        getStatusColor={getStatusColor}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  );
}

// Item content component (shared between sortable and non-sortable)
function DayItemContent({
  item,
  setSelectedEventDetails,
  formatTimeInUserTimezone,
  getStatusColor,
  dragHandleProps,
  isDragging = false,
}: {
  item: DayItem;
  setSelectedEventDetails: (details: {
    type: "program" | "routine";
    name: string;
    items: Array<{
      id?: string;
      title: string;
      sets?: number;
      reps?: number;
      routineId?: string;
    }>;
  }) => void;
  formatTimeInUserTimezone: (date: Date) => string;
  getStatusColor: (status: string) => any;
  dragHandleProps?: any;
  isDragging?: boolean;
}) {
  if (item.type === "lesson") {
    const lesson = item.data;
    return (
      <div
        {...(dragHandleProps || {})}
        className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${
          dragHandleProps ? "cursor-grab active:cursor-grabbing" : ""
        } transition-all duration-150 ${
          isDragging ? "shadow-lg scale-105" : "hover:opacity-90"
        }`}
        style={{
          ...getStatusColor(lesson.status),
          ...(isDragging ? { boxShadow: `0 4px 12px rgba(0, 0, 0, 0.15)` } : {}),
        }}
      >
        {dragHandleProps && (
          <div
            className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: COLORS.TEXT_SECONDARY }}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-2.5 w-2.5" />
          </div>
        )}
        <div
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{
            backgroundColor:
              lesson.status === "DECLINED" ? COLORS.RED_ALERT : "#F59E0B",
          }}
        />
        <span className="truncate">{formatTimeInUserTimezone(lesson.date)}</span>
      </div>
    );
  }

  if (item.type === "program") {
    const program = item.data;
    const handleDetailsClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      const drills = program.programDay?.drills || [];
      const drillItems = drills.map((drill: any) => ({
        id: drill.id,
        title: drill.title,
        sets: drill.sets,
        reps: drill.reps,
        routineId: drill.routineId,
      }));

      setSelectedEventDetails({
        type: "program",
        name: program.title,
        items: drillItems,
      });
    };

    return (
      <div
        {...(dragHandleProps || {})}
        className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center justify-between gap-1 ${
          dragHandleProps ? "cursor-grab active:cursor-grabbing" : ""
        } transition-all duration-150 ${
          isDragging ? "shadow-lg scale-105" : "hover:opacity-90"
        }`}
        style={{
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          color: COLORS.TEXT_PRIMARY,
          borderColor: "#3B82F6",
          ...(isDragging ? { boxShadow: `0 4px 12px rgba(0, 0, 0, 0.15)` } : {}),
        }}
      >
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {dragHandleProps && (
            <div
              className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: COLORS.TEXT_SECONDARY }}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-2.5 w-2.5" />
            </div>
          )}
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              backgroundColor: "#3B82F6",
            }}
          />
          <span className="truncate">{program.title}</span>
        </div>
        <button
          onClick={handleDetailsClick}
          className="text-[8px] px-1 py-0.5 rounded flex-shrink-0 hover:opacity-80 transition-opacity"
          style={{
            backgroundColor: COLORS.BACKGROUND_CARD,
            color: COLORS.TEXT_SECONDARY,
          }}
        >
          details
        </button>
      </div>
    );
  }

  if (item.type === "video") {
    const video = item.data;
    return (
      <div
        {...(dragHandleProps || {})}
        className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${
          dragHandleProps ? "cursor-grab active:cursor-grabbing" : ""
        } transition-all duration-150 ${
          isDragging ? "shadow-lg scale-105" : "hover:opacity-90"
        }`}
        style={{
          backgroundColor: "rgba(139, 92, 246, 0.2)",
          color: COLORS.TEXT_PRIMARY,
          borderColor: "#8B5CF6",
          ...(isDragging ? { boxShadow: `0 4px 12px rgba(0, 0, 0, 0.15)` } : {}),
        }}
      >
        {dragHandleProps && (
          <div
            className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: COLORS.TEXT_SECONDARY }}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-2.5 w-2.5" />
          </div>
        )}
        <div
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{
            backgroundColor: "#8B5CF6",
          }}
        />
        <span className="truncate">{video.title}</span>
      </div>
    );
  }

  if (item.type === "routine") {
    const assignment = item.data;
    const handleDetailsClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      const exercises = assignment.routine?.exercises || [];
      const exerciseItems = exercises.map((exercise: any) => ({
        title: exercise.title,
        sets: exercise.sets,
        reps: exercise.reps,
      }));

      setSelectedEventDetails({
        type: "routine",
        name: assignment.routine.name,
        items: exerciseItems,
      });
    };

    return (
      <div
        {...(dragHandleProps || {})}
        className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center justify-between gap-1 ${
          dragHandleProps ? "cursor-grab active:cursor-grabbing" : ""
        } transition-all duration-150 ${
          isDragging ? "shadow-lg scale-105" : "hover:opacity-90"
        }`}
        style={{
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          color: COLORS.TEXT_PRIMARY,
          borderColor: "#10B981",
          ...(isDragging ? { boxShadow: `0 4px 12px rgba(0, 0, 0, 0.15)` } : {}),
        }}
      >
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {dragHandleProps && (
            <div
              className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: COLORS.TEXT_SECONDARY }}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-2.5 w-2.5" />
            </div>
          )}
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              backgroundColor: "#10B981",
            }}
          />
          <span className="truncate">{assignment.routine.name}</span>
        </div>
        <button
          onClick={handleDetailsClick}
          className="text-[8px] px-1 py-0.5 rounded flex-shrink-0 hover:opacity-80 transition-opacity"
          style={{
            backgroundColor: COLORS.BACKGROUND_CARD,
            color: COLORS.TEXT_SECONDARY,
            borderColor: COLORS.BORDER_SUBTLE,
            border: "1px solid",
          }}
        >
          details
        </button>
      </div>
    );
  }

  return null;
}

