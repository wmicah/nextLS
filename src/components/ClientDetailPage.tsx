"use client";

import React from "react";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import { useUIStore } from "@/lib/stores/uiStore";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  BookOpen,
  Target,
  Video,
  ArrowLeft,
  Loader2,
  CalendarDays,
  CalendarCheck,
  CalendarX,
  CalendarClock,
  User,
  Mail,
  Phone,
  MapPin,
  Zap,
  Edit,
  MessageCircle,
  Archive,
  MoreVertical,
  Filter,
  Search,
  Download,
  Upload,
  Eye,
  EyeOff,
  Copy,
  Clipboard,
  ChevronDown,
  Send,
  File as FileIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  addDays,
  isToday,
  isPast,
  isFuture,
  parseISO,
  differenceInDays,
} from "date-fns";
import {
  formatTimeInUserTimezone,
  getUserTimezone,
} from "@/lib/timezone-utils";
import { toZonedTime } from "date-fns-tz";
import Sidebar from "@/components/Sidebar";
import ProfilePictureUploader from "@/components/ProfilePictureUploader";
import {
  COLORS,
  getGoldenAccent,
  getGreenPrimary,
  getRedAlert,
} from "@/lib/colors";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import QuickAssignProgramModal from "@/components/QuickAssignProgramModal";
import QuickAssignRoutineModal from "@/components/QuickAssignRoutineModal";
import QuickAssignRoutineFromDayModal from "@/components/QuickAssignRoutineFromDayModal";
import AssignRoutineModal from "@/components/AssignRoutineModal";
import AssignVideoModal from "@/components/AssignVideoModal";
import StreamlinedScheduleLessonModal from "@/components/StreamlinedScheduleLessonModal";
import DayDetailsModal from "@/components/DayDetailsModal";
import { withMobileDetection } from "@/lib/mobile-detection";
import MobileClientDetailPage from "@/components/MobileClientDetailPage";
import ConflictResolutionModal from "@/components/ConflictResolutionModal";
import ConvertWeekToProgramModal from "@/components/ConvertWeekToProgramModal";
import NotesDisplay from "@/components/NotesDisplay";
import FormattedMessage from "@/components/FormattedMessage";
import Link from "next/link";
import DrillItemComponent from "@/components/ClientDetailDrillItem";
import QuickMessagePopup from "@/components/ClientDetailQuickMessage";
import ClientDetailCalendarDayCell from "@/components/ClientDetailCalendarDayCell";
import ClientDetailDock from "@/components/ClientDetailDock";
import {
  ClipboardData,
  ClipboardRoutineAssignment,
  ClipboardProgramAssignment,
  ClipboardVideoAssignment,
  ConflictResolution,
  CopyPasteMode,
} from "@/types/clipboard";
import { getStatusIcon, getStatusColor } from "@/lib/clientDetailUtils";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

// Component to display a drill item that can expand to show routine exercises
interface ClientDetailPageProps {
  clientId: string;
  backPath?: string; // Optional custom back path (e.g., for organization view)
  noSidebar?: boolean; // Skip sidebar wrapper (e.g., when already in a layout with sidebar)
}

function ClientDetailPage({
  clientId,
  backPath = "/clients",
  noSidebar = false,
}: ClientDetailPageProps) {
  const router = useRouter();
  const { addToast } = useUIStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAssignProgramModal, setShowAssignProgramModal] = useState(false);
  const [showQuickAssignRoutineModal, setShowQuickAssignRoutineModal] =
    useState(false);
  const [
    showQuickAssignRoutineFromDayModal,
    setShowQuickAssignRoutineFromDayModal,
  ] = useState(false);
  const [showAssignRoutineModal, setShowAssignRoutineModal] = useState(false);
  const [showAssignVideoModal, setShowAssignVideoModal] = useState(false);
  const [showScheduleLessonModal, setShowScheduleLessonModal] = useState(false);
  const [showDayDetailsModal, setShowDayDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "calendar" | "programs" | "routines" | "videos" | "notes"
  >("overview");
  const [compliancePeriod, setCompliancePeriod] = useState<
    "4" | "6" | "8" | "all"
  >("4");
  const [replacementData, setReplacementData] = useState<{
    assignmentId: string;
    programId: string;
    programTitle: string;
    dayDate: string;
  } | null>(null);

  // Clipboard state
  const [clipboardData, setClipboardData] = useState<ClipboardData | null>(
    null
  );
  const [copyPasteMode, setCopyPasteMode] = useState<CopyPasteMode>(null);
  const [showConflictResolutionModal, setShowConflictResolutionModal] =
    useState(false);
  const [conflictData, setConflictData] = useState<ConflictResolution | null>(
    null
  );
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [isDeletingMultipleDays, setIsDeletingMultipleDays] = useState(false);
  const [weekSelectMode, setWeekSelectMode] = useState(false);
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date | null>(null);
  const [showConvertWeekModal, setShowConvertWeekModal] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [isQuickMessageOpen, setIsQuickMessageOpen] = useState(false);
  const quickMessageButtonRef = useRef<HTMLButtonElement | null>(null);
  
  // Detect if mobile/tablet - only enable drag-drop on desktop
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const checkDesktop = () => {
      const isMobileDevice = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 1024;
      setIsDesktop(!isMobileDevice);
      if (isMobileDevice) {
        setDockOpen(false); // Close dock on mobile
      }
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);
  
  // Dock state for drag-and-drop
  const [dockOpen, setDockOpen] = useState(() => {
    try {
      const saved = localStorage.getItem("nls_dock_open");
      return saved !== null ? saved === "1" : true; // Default to open
    } catch {
      return true;
    }
  });
  const [dockActiveTab, setDockActiveTab] = useState<"programs" | "routines">(() => {
    try {
      const saved = localStorage.getItem("nls_dock_tab");
      return (saved === "routines" ? "routines" : "programs") as "programs" | "routines";
    } catch {
      return "programs";
    }
  });
  const [dockSearchTerm, setDockSearchTerm] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{
    type: "program" | "routine";
    id: string;
    title: string;
  } | null>(null);
  
  // Store item order for each day (keyed by date string)
  const [dayItemOrders, setDayItemOrders] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem("nls_day_item_orders");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  
  // Persist dock state
  useEffect(() => {
    try {
      localStorage.setItem("nls_dock_open", dockOpen ? "1" : "0");
    } catch {}
  }, [dockOpen]);
  
  useEffect(() => {
    try {
      localStorage.setItem("nls_dock_tab", dockActiveTab);
    } catch {}
  }, [dockActiveTab]);
  
  // Auto-close sidebar when dock opens
  useEffect(() => {
    if (dockOpen && isDesktop) {
      // Close sidebar by setting localStorage and dispatching event
      try {
        const currentSidebarState = localStorage.getItem("nls_sidebar_open");
        if (currentSidebarState === "1") {
          localStorage.setItem("nls_sidebar_open", "0");
          window.dispatchEvent(new CustomEvent("sidebarToggle"));
        }
      } catch {}
    }
  }, [dockOpen, isDesktop]);
  
  // Setup drag sensors
  const dragSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    })
  );
  
  // Handle drag start
  const handleDragStart = (item: { type: "program" | "routine"; id: string; title: string }) => {
    setDraggedItem(item);
    setIsDragging(true);
  };
  
  // Handle reordering items within a day
  const handleReorderItems = (date: Date, newOrder: string[]) => {
    const dateKey = format(date, "yyyy-MM-dd");
    setDayItemOrders(prev => {
      const updated = { ...prev, [dateKey]: newOrder };
      try {
        localStorage.setItem("nls_day_item_orders", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };
  
  // Handle drag end - assign to calendar day OR reorder within day
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const currentDraggedItem = draggedItem;
    setIsDragging(false);
    setDraggedItem(null);
    
    if (!over) return;
    
    // Check if this is a reorder within a day (active.id starts with day-)
    const activeId = active.id as string;
    const overId = over.id as string;
    
    if (activeId.startsWith("day-") && overId.startsWith("day-") && activeId !== overId) {
      // Extract date from the IDs (format: day-YYYY-MM-DD-type-id)
      const activeMatch = activeId.match(/^day-(\d{4}-\d{2}-\d{2})-/);
      const overMatch = overId.match(/^day-(\d{4}-\d{2}-\d{2})-/);
      
      if (activeMatch && overMatch && activeMatch[1] === overMatch[1]) {
        // Same day - this is a reorder
        const dateStr = activeMatch[1];
        const date = new Date(dateStr + "T00:00:00");
        const dateKey = format(date, "yyyy-MM-dd");
        
        // Get current order for this day, or build it from the items if empty
        let currentOrder = dayItemOrders[dateKey];
        
        // If no order exists, we need to wait for the component to initialize it
        // For now, just return and let the component handle initialization
        if (!currentOrder || currentOrder.length === 0) {
          return;
        }
        
        // Find the indices
        const oldIndex = currentOrder.indexOf(activeId);
        const newIndex = currentOrder.indexOf(overId);
        
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          // Use arrayMove to reorder
          const newOrder = arrayMove(currentOrder, oldIndex, newIndex);
          handleReorderItems(date, newOrder);
        }
      }
      return;
    }
    
    // Otherwise, check if dropped on a calendar day (assigning from dock)
    if (!currentDraggedItem) return;
    
    const overData = over.data.current;
    if (overData?.type === "day" && overData.date) {
      const targetDate = new Date(overData.date as Date);
      const targetDateStr = format(targetDate, "yyyy-MM-dd");
      
      // Validate date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);
      
      if (targetDate < today) {
        addToast({
          type: "error",
          title: "Invalid Date",
          message: "Cannot assign to past dates. Please select today or a future date.",
        });
        return;
      }
      
      // Set loading state
      setIsAssigning(true);
      
      // Assign program or routine
      if (currentDraggedItem.type === "program") {
        assignProgramDragMutation.mutate(
          {
            programId: currentDraggedItem.id,
            clientIds: [clientId],
            startDate: targetDateStr,
            repetitions: 1,
          },
          {
            onSuccess: async () => {
              addToast({
                type: "success",
                title: "Program Assigned!",
                message: `${currentDraggedItem.title} has been assigned to ${format(targetDate, "MMM d, yyyy")}.`,
              });
              // Small delay to show refresh
              await new Promise(resolve => setTimeout(resolve, 300));
              refreshAllData();
              setIsAssigning(false);
            },
            onError: (error) => {
              setIsAssigning(false);
              addToast({
                type: "error",
                title: "Assignment Failed",
                message: error.message || "Failed to assign program.",
              });
            },
          }
        );
      } else if (currentDraggedItem.type === "routine") {
        assignRoutineMutation.mutate(
          {
            routineId: currentDraggedItem.id,
            clientIds: [clientId],
            startDate: targetDateStr,
          },
          {
            onSuccess: async () => {
              addToast({
                type: "success",
                title: "Routine Assigned!",
                message: `${currentDraggedItem.title} has been assigned to ${format(targetDate, "MMM d, yyyy")}.`,
              });
              // Small delay to show refresh
              await new Promise(resolve => setTimeout(resolve, 300));
              refreshAllData();
              setIsAssigning(false);
            },
            onError: (error) => {
              setIsAssigning(false);
              addToast({
                type: "error",
                title: "Assignment Failed",
                message: error.message || "Failed to assign routine.",
              });
            },
          }
        );
      }
    }
  };

  // Hover tooltip state
  // Modal state for showing program/routine details
  const [selectedEventDetails, setSelectedEventDetails] = useState<{
    type: "program" | "routine";
    name: string;
    items: Array<{
      title: string;
      sets?: number;
      reps?: number;
      routineId?: string; // Add routineId for drills that are routines
      id?: string; // Add drill id
    }>;
  } | null>(null);
  const [expandedDrills, setExpandedDrills] = useState<Set<string>>(new Set());
  const [routineCache, setRoutineCache] = useState<Map<string, any>>(new Map());

  // Fetch client data - optimized caching
  const {
    data: client,
    isLoading: clientLoading,
    error: clientError,
  } = trpc.clients.getById.useQuery(
    { id: clientId },
    {
      enabled: !!clientId,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      refetchOnWindowFocus: false, // Reduce unnecessary refetches
      refetchOnMount: false, // Use cached data on mount
      refetchOnReconnect: true, // Only refetch on reconnect
    }
  );

  // Redirect to clients page if client is archived or not found
  useEffect(() => {
    const shouldRedirect =
      clientError || (!clientLoading && !client) || client?.archived;
    if (shouldRedirect) {
      router.push(backPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientError, clientLoading, client?.archived, router, backPath]);

  // Fetch coach's schedule for the current month (includes all client lessons) - optimized
  const { data: coachSchedule = [] } =
    trpc.scheduling.getCoachSchedule.useQuery(
      {
        month: currentMonth.getMonth(),
        year: currentMonth.getFullYear(),
      },
      {
        staleTime: 2 * 60 * 1000, // Cache for 2 minutes
        gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      }
    );

  // Filter lessons for this specific client - memoized
  const clientLessons = useMemo(
    () => coachSchedule.filter((lesson: any) => lesson.clientId === clientId),
    [coachSchedule, clientId]
  );

  // Fetch upcoming lessons for the coach (we'll filter for this client) - optimized
  const { data: coachUpcomingLessons = [] } =
    trpc.scheduling.getCoachUpcomingLessons.useQuery(undefined, {
      staleTime: 2 * 60 * 1000, // Cache for 2 minutes
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    });

  // Filter upcoming lessons for this specific client - memoized
  const upcomingLessons = useMemo(
    () =>
      coachUpcomingLessons.filter((lesson: any) => lesson.clientId === clientId),
    [coachUpcomingLessons, clientId]
  );

  // Fetch client's assigned programs - optimized
  const { data: assignedPrograms = [] } =
    trpc.clients.getAssignedPrograms.useQuery(
      { clientId },
      {
        staleTime: 3 * 60 * 1000, // Cache for 3 minutes
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      }
    );

  // Fetch client's routine assignments - optimized
  const { data: assignedRoutines = [], isLoading: isLoadingRoutines } =
    trpc.routines.getClientRoutineAssignments.useQuery(
      { clientId },
      {
        staleTime: 3 * 60 * 1000, // Cache for 3 minutes
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      }
    );

  // Routine assignments loaded and ready

  // Fetch client's video assignments - optimized
  const { data: assignmentsData, error: assignmentsError } =
    trpc.library.getClientAssignments.useQuery(
      { clientId },
      {
        staleTime: 3 * 60 * 1000, // Cache for 3 minutes
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      }
    );

  const videoAssignments = assignmentsData?.videoAssignments || [];

  // Fetch coach's working hours for time slot generation - optimized
  const { data: coachProfile } = trpc.user.getProfile.useQuery(undefined, {
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes (rarely changes)
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch client compliance data - optimized
  const { data: complianceData, isLoading: complianceLoading } =
    trpc.clients.getComplianceData.useQuery(
      {
        clientId,
        period: compliancePeriod,
      },
      {
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        gcTime: 15 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      }
    );

  // Fetch temporary program day replacements for this client - optimized
  const { data: temporaryReplacements = [] } =
    trpc.programs.getTemporaryReplacements.useQuery(
      { clientId },
      {
        staleTime: 2 * 60 * 1000, // Cache for 2 minutes
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      }
    );

  // Fetch client's last activity - optimized
  const { data: lastActivity } = trpc.clients.getLastActivity.useQuery(
    { clientId },
    {
      staleTime: 1 * 60 * 1000, // Cache for 1 minute (changes frequently)
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  );

  const utils = trpc.useUtils();

  // Remove program mutation - using specific assignment ID
  const removeProgramMutation =
    trpc.programs.unassignSpecificProgram.useMutation({
      onSuccess: () => {
        addToast({
          type: "success",
          title: "Program Removed!",
          message: "Program has been removed from the client.",
        });
        refreshAllData();
      },
      onError: error => {
        addToast({
          type: "error",
          title: "Removal Failed",
          message: error.message || "Failed to remove program.",
        });
      },
    });

  // Delete program day mutation
  const deleteProgramDayMutation = trpc.programs.deleteProgramDay.useMutation({
    onSuccess: data => {
      addToast({
        type: "success",
        title: "Program Day Deleted!",
        message: data.message,
      });
      // Force aggressive data refresh
      refreshAllData();
      // Also invalidate all queries to force fresh data
      utils.invalidate();
      // Close the day details modal to force a refresh
      setShowDayDetailsModal(false);
    },
    onError: error => {
      addToast({
        type: "error",
        title: "Error",
        message: error.message || "Failed to delete program day.",
      });
    },
  });

  // Remove routine mutation - using specific assignment ID
  const unassignRoutineMutation =
    trpc.routines.unassignSpecificRoutine.useMutation({
      onSuccess: () => {
        addToast({
          type: "success",
          title: "Routine Removed!",
          message: "Routine has been removed from the client.",
        });
        refreshAllData();
      },
      onError: error => {
        addToast({
          type: "error",
          title: "Removal Failed",
          message: error.message || "Failed to remove routine.",
        });
      },
    });

  // Assign routine mutation for pasting
  const assignRoutineMutation = trpc.routines.assign.useMutation({
    onSuccess: () => {
      // Success will be handled in the pasteAssignments function
    },
    onError: error => {
      console.error("Error assigning routine:", error);
    },
  });

  // Assign video mutation for pasting
  const assignVideoMutation = trpc.library.assignVideoToClient.useMutation({
    onSuccess: () => {
      // Success will be handled in the pasteAssignments function
    },
    onError: error => {
      console.error("Error assigning video:", error);
    },
  });
  
  // Assign program mutation for drag-and-drop
  const assignProgramDragMutation = trpc.programs.assignToClients.useMutation();

  // Create temporary program day mutation for pasting program days
  const createTemporaryProgramDayMutation =
    trpc.programs.createTemporaryProgramDay.useMutation({
      onSuccess: () => {
        // Success will be handled in the pasteAssignments function
      },
      onError: error => {
        console.error("Error creating temporary program day:", error);
      },
    });

  // Remove temporary program day mutation
  const removeTemporaryProgramDayMutation =
    trpc.programs.removeTemporaryProgramDay.useMutation({
      onSuccess: () => {
        addToast({
          type: "success",
          title: "Temporary Program Day Removed!",
          message: "Temporary program day has been removed from the client.",
        });
        refreshAllData();
      },
      onError: error => {
        addToast({
          type: "error",
          title: "Removal Failed",
          message: error.message || "Failed to remove temporary program day.",
        });
      },
    });

  // Delete lesson mutation
  const deleteLessonMutation = trpc.scheduling.deleteLesson.useMutation({
    onSuccess: () => {
      addToast({
        type: "success",
        title: "Lesson Removed!",
        message: "Lesson has been successfully removed.",
      });
      refreshAllData();
    },
    onError: error => {
      addToast({
        type: "error",
        title: "Failed to Remove Lesson",
        message:
          error.message || "An error occurred while removing the lesson.",
      });
    },
  });

  // Remove video assignment mutation
  const removeVideoAssignmentMutation =
    trpc.library.removeVideoAssignment.useMutation({
      onSuccess: () => {
        addToast({
          type: "success",
          title: "Video Assignment Removed!",
          message: "Video assignment has been successfully removed.",
        });
        refreshAllData();
      },
      onError: error => {
        addToast({
          type: "error",
          title: "Failed to Remove Video Assignment",
          message:
            error.message ||
            "An error occurred while removing the video assignment.",
        });
      },
    });

  // Function to refresh all data after any action
  const refreshAllData = () => {
    utils.clients.getById.invalidate({ id: clientId });
    utils.scheduling.getCoachSchedule.invalidate({
      month: currentMonth.getMonth(),
      year: currentMonth.getFullYear(),
    });
    utils.scheduling.getCoachUpcomingLessons.invalidate();
    utils.clients.getAssignedPrograms.invalidate({ clientId });
    utils.routines.getClientRoutineAssignments.invalidate({ clientId });
    utils.library.getClientAssignments.invalidate({ clientId });
    utils.clients.getComplianceData.invalidate({
      clientId,
      period: compliancePeriod,
    });
    utils.programs.getTemporaryReplacements.invalidate({ clientId });
    // Force refresh of all program-related queries
    utils.programs.getProgramAssignments.invalidate();
  };

  // Generate calendar days based on view mode
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  let calendarStart: Date;
  let calendarEnd: Date;

  if (viewMode === "week") {
    // For week view, show the week containing the current date
    calendarStart = startOfWeek(currentMonth, { weekStartsOn: 0 });
    calendarEnd = endOfWeek(currentMonth, { weekStartsOn: 0 });
  } else {
    // For month view, show the full month with surrounding days
    calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  }

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const navigateMonth = (direction: "prev" | "next") => {
    let newDate: Date;
    if (viewMode === "week") {
      // For week view, navigate by weeks
      newDate =
        direction === "prev"
          ? subWeeks(currentMonth, 1)
          : addWeeks(currentMonth, 1);
    } else {
      // For month view, navigate by months
      newDate =
        direction === "prev"
          ? subMonths(currentMonth, 1)
          : addMonths(currentMonth, 1);
    }

    setCurrentMonth(newDate);

    // Refresh schedule data for the new month
    utils.scheduling.getCoachSchedule.invalidate({
      month: newDate.getMonth(),
      year: newDate.getFullYear(),
    });
  };

  const getLessonsForDate = (date: Date) => {
    const timeZone = getUserTimezone();
    return clientLessons.filter((lesson: any) => {
      // Convert UTC lesson date to user's timezone for proper date comparison
      const lessonDateInUserTz = toZonedTime(lesson.date, timeZone);

      // Compare only the date part, not the time
      const lessonDateOnly = new Date(
        lessonDateInUserTz.getFullYear(),
        lessonDateInUserTz.getMonth(),
        lessonDateInUserTz.getDate()
      );
      const targetDateOnly = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      return lessonDateOnly.getTime() === targetDateOnly.getTime();
    });
  };

  const getProgramsForDate = (date: Date) => {
    const programsForDate: any[] = [];
    const targetDateStr = date.toISOString().split("T")[0];

    // First, check for temporary program day replacements
    const hasTemporaryReplacement = temporaryReplacements.some(
      (replacement: any) => {
        const replacementDate = new Date(replacement.replacedDate);
        const replacementDateStr = replacementDate.toISOString().split("T")[0];
        return (
          replacementDateStr === targetDateStr &&
          replacement.data.type === "temporary_program_day"
        );
      }
    );

    // Add temporary replacements if they exist
    temporaryReplacements.forEach((replacement: any) => {
      const replacementDate = new Date(replacement.replacedDate);
      const replacementDateStr = replacementDate.toISOString().split("T")[0];

      if (
        replacementDateStr === targetDateStr &&
        replacement.data.type === "temporary_program_day"
      ) {
        programsForDate.push({
          id: `temp-${replacement.id}`,
          title: replacement.data.programTitle,
          description: `${replacement.data.drills.length} drills`,
          type: "temporary_program",
          isTemporary: true,
          replacementId: replacement.id, // This is now the assignment ID
          programDay: {
            title: replacement.data.dayTitle,
            description: replacement.data.dayDescription,
            drills: replacement.data.drills,
          },
          drillCount: replacement.data.drills.length,
          isRestDay: false,
        });
      }
    });

    // Only show regular program assignments if there's no temporary replacement for this date
    if (!hasTemporaryReplacement) {
      assignedPrograms.forEach((assignment: any) => {
        // Check if this specific date has been replaced with a lesson or deleted
        const hasReplacement = assignment.replacements?.some(
          (replacement: any) => {
            const replacementDate = new Date(replacement.replacedDate);

            // Normalize both dates to the same timezone for comparison
            // Convert both to date strings (YYYY-MM-DD) to avoid timezone issues
            const replacementDateStr = replacementDate
              .toISOString()
              .split("T")[0];
            const isSame = replacementDateStr === targetDateStr;

            return isSame;
          }
        );

        // Skip this assignment if the date has been replaced or deleted
        if (hasReplacement) {
          return;
        }
        const program = assignment.program;
        const startDate = new Date(
          assignment.startDate || assignment.assignedAt
        );

        // Calculate which week and day this date falls on
        const daysSinceStart = Math.floor(
          (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Use actual number of weeks from the data, not the duration field (which may be incorrect)
        const actualWeeks = program.weeks?.length || program.duration;
        const programDurationInDays = actualWeeks * 7;

        // Only show if the date is within the program duration
        if (daysSinceStart >= 0 && daysSinceStart < programDurationInDays) {
          const weekNumber = Math.floor(daysSinceStart / 7) + 1;
          const dayNumber = (daysSinceStart % 7) + 1;

          // Find the corresponding program day
          const week = program.weeks?.find(
            (w: any) => w.weekNumber === weekNumber
          );
          if (week) {
            const programDay = week.days?.find(
              (d: any) => d.dayNumber === dayNumber
            );

            if (programDay) {
              // Only show workout days, skip rest days
              if (!programDay.isRestDay && programDay.drills?.length > 0) {
                // Show workout day with just program title
                programsForDate.push({
                  id: `${assignment.id}-${weekNumber}-${dayNumber}`,
                  title: program.title,
                  description: `${programDay.drills.length} drills`,
                  type: "program",
                  assignment,
                  program,
                  programDay, // Include the full program day data
                  weekNumber,
                  dayNumber,
                  drillCount: programDay.drills.length,
                  isRestDay: false,
                });
              }
            }
          }
        }
      });
    }

    return programsForDate;
  };

  const getVideosForDate = (date: Date) => {
    try {
      console.log("getVideosForDate called with:", { date, videoAssignments });

      if (!videoAssignments || !Array.isArray(videoAssignments)) {
        console.log(
          "getVideosForDate - videoAssignments is not an array:",
          videoAssignments
        );
        return [];
      }

      const filteredAssignments = videoAssignments.filter((assignment: any) => {
        try {
          if (!assignment || !assignment.dueDate) {
            console.log("Skipping assignment - missing data:", assignment);
            return false;
          }
          // Parse the due date and compare dates in a timezone-agnostic way
          const dueDate = new Date(assignment.dueDate);
          const dueDateString = dueDate.toISOString().split("T")[0];
          const targetDateString = date.toISOString().split("T")[0];
          const isMatch = dueDateString === targetDateString;
          console.log("Assignment date check:", {
            assignmentId: assignment.id,
            dueDate: assignment.dueDate,
            parsedDueDate: dueDate,
            dueDateString,
            targetDate: date,
            targetDateString,
            isMatch,
          });
          return isMatch;
        } catch (error) {
          console.error("Error filtering assignment:", error, assignment);
          return false;
        }
      });

      console.log("Filtered video assignments:", filteredAssignments);

      return filteredAssignments.map((assignment: any) => {
        try {
          return {
            id: assignment.id,
            title: assignment.video?.title || "Video Assignment",
            description: assignment.notes || "Video to complete",
            type: "video",
            assignment,
          };
        } catch (error) {
          console.error("Error mapping assignment:", error, assignment);
          return {
            id: assignment.id || "unknown",
            title: "Video Assignment",
            description: "Video to complete",
            type: "video",
            assignment,
          };
        }
      });
    } catch (error) {
      console.error("Error in getVideosForDate:", error);
      return [];
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowDayDetailsModal(true);
  };

  const handleRemoveProgram = (
    programData: any,
    action: "entire" | "day" = "entire"
  ) => {
    // Check if this is a temporary program day
    if (programData.isTemporary && programData.replacementId) {
      if (
        confirm(
          `Are you sure you want to remove the temporary program day "${programData.title}"?`
        )
      ) {
        removeTemporaryProgramDayMutation.mutate({
          replacementId: programData.replacementId,
        });
      }
      return;
    }

    // Handle regular program removal with direct confirmation
    if (action === "entire") {
      if (
        confirm(
          `Are you sure you want to remove the entire program "${programData.programTitle}" from this client?`
        )
      ) {
        removeProgramMutation.mutate({
          assignmentId: programData.assignmentId,
        });
      }
    } else if (action === "day") {
      if (
        confirm(
          `Are you sure you want to remove just this program day "${programData.programTitle}"?`
        )
      ) {
        // Remove just this specific program day using the deleteProgramDay mutation
        deleteProgramDayMutation.mutate({
          assignmentId: programData.assignmentId,
          dayDate: programData.dayDate,
          reason: "Program day deleted by coach",
        });
      }
    }
  };

  const handleRemoveRoutine = (routineData: any) => {
    if (
      confirm(
        `Are you sure you want to remove "${routineData.routineName}" from this client?`
      )
    ) {
      unassignRoutineMutation.mutate({
        assignmentId: routineData.assignmentId,
      });
    }
  };

  const handleRemoveLesson = (lessonData: any) => {
    if (
      confirm(
        `Are you sure you want to remove the lesson "${lessonData.lessonTitle}"?`
      )
    ) {
      deleteLessonMutation.mutate({
        lessonId: lessonData.lessonId,
      });
    }
  };

  const handleRemoveVideo = (videoData: any) => {
    if (
      confirm(
        `Are you sure you want to remove "${videoData.videoTitle}" from this day?`
      )
    ) {
      removeVideoAssignmentMutation.mutate({
        assignmentId: videoData.assignmentId,
        clientId: clientId,
      });
    }
  };

  // Multi-select handlers
  const toggleDaySelection = (day: Date) => {
    const dayKey = day.toISOString().split("T")[0];
    setSelectedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dayKey)) {
        newSet.delete(dayKey);
      } else {
        newSet.add(dayKey);
      }
      return newSet;
    });
  };

  // Week selection handler
  const handleWeekSelection = (day: Date) => {
    const weekStart = startOfWeek(day, { weekStartsOn: 0 });
    setSelectedWeekStart(weekStart);
  };

  const handleDeleteMultipleDays = async () => {
    if (selectedDays.size === 0) return;

    const daysArray = Array.from(selectedDays);
    const confirmationMessage = `Are you sure you want to delete all assignments from ${
      selectedDays.size
    } day${
      selectedDays.size !== 1 ? "s" : ""
    }?\n\nThis will remove all lessons, programs, routines, and videos from the selected days.`;

    if (!confirm(confirmationMessage)) {
      return;
    }

    setIsDeletingMultipleDays(true);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    try {
      // Process each selected day sequentially
      for (let i = 0; i < daysArray.length; i++) {
        const dayKey = daysArray[i];
        // Create date properly - parse the YYYY-MM-DD string and set to local midnight
        const [year, month, dayNum] = dayKey.split("-").map(Number);
        const day = new Date(year, month - 1, dayNum);
        day.setHours(0, 0, 0, 0);

        console.log(`🗓️ Processing day ${i + 1}/${daysArray.length}:`, {
          dayKey,
          day: day.toISOString(),
          dayLocal: day.toLocaleDateString(),
          isToday: isSameDay(day, new Date()),
        });

        // Refresh data before getting assignments for this day to ensure fresh data
        if (i > 0) {
          await utils.scheduling.getCoachSchedule.invalidate({
            month: day.getMonth(),
            year: day.getFullYear(),
          });
          await utils.clients.getAssignedPrograms.invalidate({ clientId });
          await utils.routines.getClientRoutineAssignments.invalidate({
            clientId,
          });
          await utils.library.getClientAssignments.invalidate({ clientId });
          // Small delay to let cache refresh
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Get all assignments for this day with fresh data
        const lessons = getLessonsForDate(day);
        const programs = getProgramsForDate(day);
        const routines = getRoutineAssignmentsForDate(day);
        const videos = getVideosForDate(day);

        console.log(`📋 Found assignments for ${dayKey}:`, {
          lessons: lessons.length,
          programs: programs.length,
          routines: routines.length,
          videos: videos.length,
          total:
            lessons.length + programs.length + routines.length + videos.length,
        });

        const totalAssignments =
          lessons.length + programs.length + routines.length + videos.length;

        if (totalAssignments === 0) {
          console.warn(`⚠️ No assignments found for ${dayKey} - skipping`);
          continue;
        }

        let daySuccess = true;

        // Delete all lessons
        for (const lesson of lessons) {
          try {
            const result = await deleteLessonMutation.mutateAsync({
              lessonId: lesson.id,
            });
            console.log(`✅ Deleted lesson ${lesson.id}:`, result);
          } catch (error: any) {
            console.error(`❌ Error deleting lesson ${lesson.id}:`, error);
            errors.push(`Lesson: ${error.message || "Unknown error"}`);
            daySuccess = false;
          }
        }

        // Delete all program days
        for (const program of programs) {
          try {
            let result;
            if (program.isTemporary && program.replacementId) {
              result = await removeTemporaryProgramDayMutation.mutateAsync({
                replacementId: program.replacementId,
              });
            } else if (program.assignment) {
              result = await deleteProgramDayMutation.mutateAsync({
                assignmentId: program.assignment.id,
                dayDate: dayKey,
                reason: "Bulk deleted by coach",
              });
            }
            console.log(`✅ Deleted program day from ${dayKey}:`, result);
          } catch (error: any) {
            console.error(
              `❌ Error deleting program day from ${dayKey}:`,
              error
            );
            errors.push(`Program day: ${error.message || "Unknown error"}`);
            daySuccess = false;
          }
        }

        // Delete all routines
        for (const routine of routines) {
          try {
            const result = await unassignRoutineMutation.mutateAsync({
              assignmentId: routine.id,
            });
            console.log(`✅ Deleted routine ${routine.id}:`, result);
          } catch (error: any) {
            console.error(`❌ Error deleting routine ${routine.id}:`, error);
            errors.push(`Routine: ${error.message || "Unknown error"}`);
            daySuccess = false;
          }
        }

        // Delete all videos
        for (const video of videos) {
          try {
            const result = await removeVideoAssignmentMutation.mutateAsync({
              assignmentId: video.assignment.id,
              clientId: clientId,
            });
            console.log(`✅ Deleted video ${video.assignment.id}:`, result);
          } catch (error: any) {
            console.error(
              `❌ Error deleting video ${video.assignment.id}:`,
              error
            );
            errors.push(`Video: ${error.message || "Unknown error"}`);
            daySuccess = false;
          }
        }

        if (daySuccess) {
          successCount++;
        } else {
          errorCount++;
        }

        // Wait a bit for backend to process
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Show results
      if (errorCount === 0) {
        addToast({
          type: "success",
          title: "Days Deleted!",
          message: `Successfully deleted all assignments from ${successCount} day${
            successCount !== 1 ? "s" : ""
          }.`,
        });
      } else {
        addToast({
          type: "warning",
          title: "Partial Success",
          message: `Deleted from ${successCount} day${
            successCount !== 1 ? "s" : ""
          }, but encountered errors on ${errorCount} day${
            errorCount !== 1 ? "s" : ""
          }.`,
        });
        console.error("Deletion errors:", errors);
      }

      // Clear selection and exit multi-select mode
      setSelectedDays(new Set());
      setMultiSelectMode(false);

      // Final refresh - actually refetch the data
      await Promise.all([
        utils.scheduling.getCoachSchedule.refetch({
          month: currentMonth.getMonth(),
          year: currentMonth.getFullYear(),
        }),
        utils.clients.getAssignedPrograms.refetch({ clientId }),
        utils.routines.getClientRoutineAssignments.refetch({ clientId }),
        utils.library.getClientAssignments.refetch({ clientId }),
        utils.programs.getTemporaryReplacements.refetch({ clientId }),
      ]);

      // Also invalidate other queries
      refreshAllData();
    } catch (error: any) {
      console.error("Bulk deletion error:", error);
      addToast({
        type: "error",
        title: "Deletion Error",
        message:
          error.message ||
          "Some assignments could not be deleted. Please try again.",
      });
    } finally {
      setIsDeletingMultipleDays(false);
    }
  };

  // Clipboard functions
  const handleCopyDay = (date: Date) => {
    // If in multi-select mode and days are selected, copy all selected days (including blank days)
    if (multiSelectMode && selectedDays.size > 0) {
      const daysArray = Array.from(selectedDays)
        .map(dayKey => {
          const [year, month, day] = dayKey.split("-").map(Number);
          return new Date(year, month - 1, day);
        })
        .sort((a, b) => a.getTime() - b.getTime()); // Sort days in chronological order

      const sourceDates = daysArray.map(day => day.toISOString().split("T")[0]);
      const firstDay = daysArray[0];

      // Check if all days are in the same week (for smart paste mode)
      const firstDayOfWeek = new Date(daysArray[0]);
      firstDayOfWeek.setDate(firstDayOfWeek.getDate() - firstDayOfWeek.getDay()); // Start of week (Sunday)
      
      const lastDayOfWeek = new Date(firstDayOfWeek);
      lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6); // End of week (Saturday)
      
      const allInSameWeek = daysArray.every(day => {
        return day >= firstDayOfWeek && day <= lastDayOfWeek;
      });

      // Collect assignments for each day separately (including blank days)
      const multiDayAssignments = daysArray.map((day, index) => {
        const routinesForDate = getRoutineAssignmentsForDate(day);
        const programsForDate = getProgramsForDate(day);
        const videosForDate = getVideosForDate(day);

        // Calculate actual day offset from the first day (not just array index)
        const actualDayOffset = differenceInDays(day, firstDay);

        return {
          dayOffset: actualDayOffset, // Actual number of days from first day
          dayOfWeek: day.getDay(), // Store day of week (0 = Sunday, 1 = Monday, etc.)
          assignments: {
            routines: routinesForDate.map((routine: any) => ({
              id: routine.id,
              routineId: routine.routine.id,
              routineName: routine.routine.name,
              startDate: routine.startDate || routine.assignedAt,
            })),
            programs: programsForDate.map((program: any) => ({
              id: `${program.assignment.id}-${program.weekNumber}-${program.dayNumber}`,
              programId: program.program.id,
              programTitle: program.program.title,
              weekNumber: program.weekNumber,
              dayNumber: program.dayNumber,
              isRestDay: program.isRestDay,
              drillCount: program.drillCount,
              assignmentId: program.assignment.id,
              dayTitle: program.programDay.title,
              dayDescription: program.programDay.description,
              drills:
                program.programDay.drills?.map((drill: any) => ({
                  id: drill.id,
                  title: drill.title,
                  description: drill.description,
                  duration: drill.duration,
                  videoUrl: drill.videoUrl,
                  notes: drill.notes,
                  sets: drill.sets || undefined,
                  reps: drill.reps || undefined,
                  tempo: drill.tempo,
                  order: drill.order,
                  routineId: drill.routineId,
                  // Superset fields
                  supersetId: drill.supersetId || undefined,
                  supersetOrder: drill.supersetOrder || undefined,
                  supersetDescription: drill.supersetDescription || undefined,
                  supersetInstructions: drill.supersetInstructions || undefined,
                  supersetNotes: drill.supersetNotes || undefined,
                  // Coach Instructions fields
                  coachInstructionsWhatToDo:
                    drill.coachInstructionsWhatToDo || undefined,
                  coachInstructionsHowToDoIt:
                    drill.coachInstructionsHowToDoIt || undefined,
                  coachInstructionsKeyPoints:
                    drill.coachInstructionsKeyPoints || undefined,
                  coachInstructionsCommonMistakes:
                    drill.coachInstructionsCommonMistakes || undefined,
                  coachInstructionsEasier:
                    drill.coachInstructionsEasier || undefined,
                  coachInstructionsHarder:
                    drill.coachInstructionsHarder || undefined,
                  coachInstructionsEquipment:
                    drill.coachInstructionsEquipment || undefined,
                  coachInstructionsSetup:
                    drill.coachInstructionsSetup || undefined,
                  // Video fields
                  videoId: drill.videoId || undefined,
                  videoThumbnail: drill.videoThumbnail || undefined,
                  videoTitle: drill.videoTitle || undefined,
                  // Type field
                  type: drill.type || undefined,
                })) || [],
            })),
            videos: videosForDate.map((video: any) => ({
              id: video.assignment.id,
              videoId: video.assignment.video?.id || "",
              videoTitle: video.assignment.video?.title || "Video Assignment",
              dueDate: video.assignment.dueDate,
              notes: video.assignment.notes || undefined,
            })),
          },
        };
      });

      // Calculate total items across all days (blank days will have 0 items)
      const totalItems = multiDayAssignments.reduce(
        (sum, day) =>
          sum +
          day.assignments.routines.length +
          day.assignments.programs.length +
          day.assignments.videos.length,
        0
      );

      // Allow copying even if all days are blank (for week structure preservation)
      const daysWithAssignments = multiDayAssignments.filter(
        day =>
          day.assignments.routines.length > 0 ||
          day.assignments.programs.length > 0 ||
          day.assignments.videos.length > 0
      ).length;

      // Convert to clipboard format with multi-day support
      const clipboardData: ClipboardData = {
        type: "assignments",
        sourceDate: firstDay.toISOString().split("T")[0],
        sourceDates: sourceDates,
        isMultiDay: true,
        allInSameWeek: allInSameWeek, // Flag to indicate if days are in same week
        sourceClientId: clientId,
        assignments: {
          routines: [],
          programs: [],
          videos: [],
        },
        multiDayAssignments: multiDayAssignments,
        copiedAt: new Date(),
      };

      setClipboardData(clipboardData);
      setCopyPasteMode("copy");

      addToast({
        type: "success",
        title: "Days Copied!",
        message: `Copied ${selectedDays.size} day${
          selectedDays.size !== 1 ? "s" : ""
        }${
          totalItems > 0
            ? ` with ${totalItems} assignment${totalItems !== 1 ? "s" : ""}`
            : " (including blank days)"
        }`,
      });

      // Exit multi-select mode after copying
      setMultiSelectMode(false);
      setSelectedDays(new Set());
      return;
    }

    // Single day copy (original behavior)
    const dateStr = date.toISOString().split("T")[0];

    const routinesForDate = getRoutineAssignmentsForDate(date);
    const programsForDate = getProgramsForDate(date);
    const videosForDate = getVideosForDate(date);

    // Check if there are any assignments to copy
    const totalItems =
      routinesForDate.length + programsForDate.length + videosForDate.length;

    if (totalItems === 0) {
      addToast({
        type: "warning",
        title: "No Assignments",
        message: "This day has no assignments to copy.",
      });
      return;
    }

    // Convert to clipboard format
    const clipboardData: ClipboardData = {
      type: "assignments",
      sourceDate: dateStr,
      sourceClientId: clientId,
      assignments: {
        routines: routinesForDate.map((routine: any) => ({
          id: routine.id,
          routineId: routine.routine.id,
          routineName: routine.routine.name,
          startDate: routine.startDate || routine.assignedAt,
        })),
        programs: programsForDate.map((program: any) => ({
          id: `${program.assignment.id}-${program.weekNumber}-${program.dayNumber}`,
          programId: program.program.id,
          programTitle: program.program.title,
          weekNumber: program.weekNumber,
          dayNumber: program.dayNumber,
          isRestDay: program.isRestDay,
          drillCount: program.drillCount,
          assignmentId: program.assignment.id,
          dayTitle: program.programDay.title,
          dayDescription: program.programDay.description,
          drills:
            program.programDay.drills?.map((drill: any) => ({
              id: drill.id,
              title: drill.title,
              description: drill.description,
              duration: drill.duration,
              videoUrl: drill.videoUrl,
              notes: drill.notes,
              sets: drill.sets || undefined,
              reps: drill.reps || undefined,
              tempo: drill.tempo,
              order: drill.order,
              routineId: drill.routineId,
              // Superset fields
              supersetId: drill.supersetId || undefined,
              supersetOrder: drill.supersetOrder || undefined,
              supersetDescription: drill.supersetDescription || undefined,
              supersetInstructions: drill.supersetInstructions || undefined,
              supersetNotes: drill.supersetNotes || undefined,
              // Coach Instructions fields
              coachInstructionsWhatToDo:
                drill.coachInstructionsWhatToDo || undefined,
              coachInstructionsHowToDoIt:
                drill.coachInstructionsHowToDoIt || undefined,
              coachInstructionsKeyPoints:
                drill.coachInstructionsKeyPoints || undefined,
              coachInstructionsCommonMistakes:
                drill.coachInstructionsCommonMistakes || undefined,
              coachInstructionsEasier:
                drill.coachInstructionsEasier || undefined,
              coachInstructionsHarder:
                drill.coachInstructionsHarder || undefined,
              coachInstructionsEquipment:
                drill.coachInstructionsEquipment || undefined,
              coachInstructionsSetup: drill.coachInstructionsSetup || undefined,
              // Video fields
              videoId: drill.videoId || undefined,
              videoThumbnail: drill.videoThumbnail || undefined,
              videoTitle: drill.videoTitle || undefined,
              // Type field
              type: drill.type || undefined,
            })) || [],
        })),
        videos: videosForDate.map((video: any) => ({
          id: video.assignment.id,
          videoId: video.assignment.video?.id || "",
          videoTitle: video.assignment.video?.title || "Video Assignment",
          dueDate: video.assignment.dueDate,
          notes: video.assignment.notes || undefined,
        })),
      },
      copiedAt: new Date(),
    };

    setClipboardData(clipboardData);
    setCopyPasteMode("copy");

    addToast({
      type: "success",
      title: "Day Copied!",
      message: `Copied ${totalItems} assignment${
        totalItems !== 1 ? "s" : ""
      } from ${format(date, "MMM d, yyyy")}`,
    });
  };

  const handlePasteDay = async (targetDate: Date) => {
    if (!clipboardData) return;

    const targetDateStr = targetDate.toISOString().split("T")[0];

    // Validate target date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (targetDate < today) {
      addToast({
        type: "error",
        title: "Invalid Date",
        message: "Cannot paste assignments to past dates.",
      });
      return;
    }

    // For multi-day paste, skip conflict checking and paste sequentially
    if (clipboardData.isMultiDay && clipboardData.multiDayAssignments) {
      await pasteAssignments(targetDate, "merge");
      return;
    }

    // Single day paste - check for conflicts
    const existingRoutines = getRoutineAssignmentsForDate(targetDate);
    const existingPrograms = getProgramsForDate(targetDate);
    const existingVideos = getVideosForDate(targetDate);

    const hasConflicts =
      existingRoutines.length > 0 ||
      existingPrograms.length > 0 ||
      existingVideos.length > 0;

    if (hasConflicts) {
      // Show conflict resolution modal
      setConflictData({
        type: "replace", // Default to replace
        targetDate: targetDateStr,
        existingAssignments: {
          routines: existingRoutines.length,
          programs: existingPrograms.length,
          videos: existingVideos.length,
        },
        clipboardAssignments: {
          routines: clipboardData.assignments.routines.length,
          programs: clipboardData.assignments.programs.length,
          videos: clipboardData.assignments.videos.length,
        },
      });
      setShowConflictResolutionModal(true);
      return;
    }

    // No conflicts, proceed with paste
    await pasteAssignments(targetDate, "merge");
  };

  const pasteAssignments = async (
    targetDate: Date,
    conflictResolution: "replace" | "merge" | "skip" = "merge"
  ) => {
    if (!clipboardData) return;

    try {
      // If multi-day copy, paste each day sequentially starting from target date
      if (clipboardData.isMultiDay && clipboardData.multiDayAssignments) {
        let totalSuccessCount = 0;
        let totalErrorCount = 0;

        for (let i = 0; i < clipboardData.multiDayAssignments.length; i++) {
          const dayData = clipboardData.multiDayAssignments[i];
          
          // Sequential paste: paste in order starting from target date
          // Example: Copy Mon, Wed, Fri → Paste on Mon → Mon→Mon, Tue→Tue, Wed→Wed
          // Example: Copy Mon, Wed, Fri → Paste on Wed → Wed→Wed, Thu→Thu, Fri→Fri
          // Always paste sequentially from the selected day, ignoring original day-of-week
          const pasteDate = addDays(targetDate, i);
          
          const pasteDateStr = pasteDate.toISOString().split("T")[0];

          // Validate paste date
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (pasteDate < today) {
            addToast({
              type: "warning",
              title: "Skipped Past Date",
              message: `Skipped day ${i + 1} (${format(
                pasteDate,
                "MMM d, yyyy"
              )}) - cannot paste to past dates.`,
            });
            continue;
          }

          // Check if this day has any assignments (blank days will have empty arrays)
          const hasAssignments =
            dayData.assignments.routines.length > 0 ||
            dayData.assignments.programs.length > 0 ||
            dayData.assignments.videos.length > 0;

          // Paste this day's assignments (even if blank, it preserves the day structure)
          if (hasAssignments) {
            const { successCount, errorCount } =
              await pasteSingleDayAssignments(
                pasteDate,
                dayData.assignments,
                conflictResolution
              );

            totalSuccessCount += successCount;
            totalErrorCount += errorCount;
          }
          // If blank day, we still count it as processed (day structure preserved)
        }

        // Show final summary
        addToast({
          type: totalErrorCount === 0 ? "success" : "warning",
          title:
            totalErrorCount === 0
              ? "Days Pasted!"
              : "Paste Completed with Errors",
          message: `Successfully pasted ${totalSuccessCount} assignment${
            totalSuccessCount !== 1 ? "s" : ""
          } across ${clipboardData.multiDayAssignments.length} day${
            clipboardData.multiDayAssignments.length !== 1 ? "s" : ""
          }${totalErrorCount > 0 ? ` (${totalErrorCount} failed)` : ""}`,
        });

        refreshAllData();
        return;
      }

      // Single day paste (original behavior)
      const { successCount, errorCount } = await pasteSingleDayAssignments(
        targetDate,
        clipboardData.assignments,
        conflictResolution
      );

      addToast({
        type: successCount > 0 ? "success" : "error",
        title: successCount > 0 ? "Assignments Pasted!" : "Paste Failed",
        message:
          successCount > 0
            ? `Successfully pasted ${successCount} assignment${
                successCount !== 1 ? "s" : ""
              }`
            : "No assignments could be pasted",
      });

      refreshAllData();
    } catch (error) {
      console.error("Error in pasteAssignments:", error);
      addToast({
        type: "error",
        title: "Paste Failed",
        message: "An error occurred while pasting assignments.",
      });
    }
  };

  const pasteSingleDayAssignments = async (
    targetDate: Date,
    assignments: {
      routines: ClipboardRoutineAssignment[];
      programs: ClipboardProgramAssignment[];
      videos: ClipboardVideoAssignment[];
    },
    conflictResolution: "replace" | "merge" | "skip" = "merge"
  ) => {
    const targetDateStr = targetDate.toISOString().split("T")[0];
    let successCount = 0;
    let errorCount = 0;

    try {
      // Handle conflict resolution
      if (conflictResolution === "replace") {
        // Remove existing assignments first
        const existingRoutines = getRoutineAssignmentsForDate(targetDate);
        const existingPrograms = getProgramsForDate(targetDate);
        const existingVideos = getVideosForDate(targetDate);

        // Remove existing routines
        for (const routine of existingRoutines) {
          try {
            await unassignRoutineMutation.mutateAsync({
              assignmentId: routine.id,
            });
          } catch (error) {
            console.error("Error removing existing routine:", error);
          }
        }

        // Remove existing programs (by deleting the program day)
        for (const program of existingPrograms) {
          try {
            await deleteProgramDayMutation.mutateAsync({
              assignmentId: program.assignment.id,
              dayDate: targetDateStr,
              reason: "Replaced by copy/paste operation",
            });
          } catch (error) {
            console.error("Error removing existing program:", error);
          }
        }

        // Remove existing videos
        for (const video of existingVideos) {
          try {
            await removeVideoAssignmentMutation.mutateAsync({
              assignmentId: video.assignment.id,
              clientId: clientId,
            });
          } catch (error) {
            console.error("Error removing existing video:", error);
          }
        }
      }

      // Paste routines
      for (const routine of assignments.routines) {
        try {
          // Check if routine already exists (for merge/skip modes)
          if (conflictResolution === "skip") {
            const existingRoutines = getRoutineAssignmentsForDate(targetDate);
            const alreadyExists = existingRoutines.some(
              (existing: any) => existing.routine.id === routine.routineId
            );
            if (alreadyExists) continue;
          }

          await assignRoutineMutation.mutateAsync({
            routineId: routine.routineId,
            clientIds: [clientId],
            startDate: targetDateStr,
          });
          successCount++;
        } catch (error) {
          console.error("Error pasting routine:", error);
          errorCount++;
        }
      }

      // Paste videos
      for (const video of assignments.videos) {
        try {
          // Check if video already exists (for merge/skip modes)
          if (conflictResolution === "skip") {
            const existingVideos = getVideosForDate(targetDate);
            const alreadyExists = existingVideos.some(
              (existing: any) => existing.assignment.video?.id === video.videoId
            );
            if (alreadyExists) continue;
          }

          await assignVideoMutation.mutateAsync({
            videoId: video.videoId,
            clientId: clientId,
            dueDate: targetDateStr,
            notes: video.notes || undefined,
          });
          successCount++;
        } catch (error) {
          console.error("Error pasting video:", error);
          errorCount++;
        }
      }

      // Paste programs (create temporary program day replacement instead of permanent program)
      for (const program of assignments.programs) {
        try {
          if (conflictResolution === "skip") {
            const existingPrograms = getProgramsForDate(targetDate);
            const alreadyExists = existingPrograms.some(
              (existing: any) => existing.title === program.programTitle
            );
            if (alreadyExists) continue;
          }

          // Create a temporary program day replacement instead of a permanent program
          await createTemporaryProgramDayMutation.mutateAsync({
            clientId: clientId,
            dayDate: targetDateStr,
            programTitle: program.programTitle,
            dayTitle: program.dayTitle,
            dayDescription: program.dayDescription,
            drills: program.drills.map((drill: any, index: number) => ({
              order: drill.order !== undefined ? drill.order : index + 1,
              title: drill.title,
              description: drill.description,
              duration:
                typeof drill.duration === "string"
                  ? parseInt(drill.duration) || undefined
                  : drill.duration,
              videoUrl: drill.videoUrl,
              notes: drill.notes,
              sets: drill.sets || undefined,
              reps: drill.reps || undefined,
              tempo: drill.tempo || "",
              routineId: drill.routineId || "",
              // Superset fields
              supersetId: drill.supersetId || undefined,
              supersetOrder: drill.supersetOrder || undefined,
              supersetDescription: drill.supersetDescription || undefined,
              supersetInstructions: drill.supersetInstructions || undefined,
              supersetNotes: drill.supersetNotes || undefined,
              // Coach Instructions fields
              coachInstructionsWhatToDo:
                drill.coachInstructionsWhatToDo || undefined,
              coachInstructionsHowToDoIt:
                drill.coachInstructionsHowToDoIt || undefined,
              coachInstructionsKeyPoints:
                drill.coachInstructionsKeyPoints || undefined,
              coachInstructionsCommonMistakes:
                drill.coachInstructionsCommonMistakes || undefined,
              coachInstructionsEasier:
                drill.coachInstructionsEasier || undefined,
              coachInstructionsHarder:
                drill.coachInstructionsHarder || undefined,
              coachInstructionsEquipment:
                drill.coachInstructionsEquipment || undefined,
              coachInstructionsSetup: drill.coachInstructionsSetup || undefined,
              // Video fields
              videoId: drill.videoId || undefined,
              videoThumbnail: drill.videoThumbnail || undefined,
              videoTitle: drill.videoTitle || undefined,
              // Type field
              type: drill.type || undefined,
            })),
            reason: `Copied from ${program.programTitle} Week ${program.weekNumber} Day ${program.dayNumber}`,
          });

          successCount++;
        } catch (error) {
          console.error("Error pasting program:", error);
          errorCount++;
        }
      }

      return { successCount, errorCount };
    } catch (error) {
      console.error("Error in pasteSingleDayAssignments:", error);
      return { successCount: 0, errorCount: 1 };
    }
  };

  const handleConflictResolution = (
    resolution: "replace" | "merge" | "skip"
  ) => {
    if (!conflictData) return;

    const targetDate = new Date(conflictData.targetDate);
    pasteAssignments(targetDate, resolution);

    setShowConflictResolutionModal(false);
    setConflictData(null);
  };


  const getRoutineAssignmentsForDate = (date: Date) => {
    return assignedRoutines
      .filter((assignment: any) => {
        const assignmentDate = new Date(
          assignment.startDate || assignment.assignedAt
        );
        const isMatch = isSameDay(assignmentDate, date);
        if (isMatch) {
          console.log("Calendar: Found routine assignment for date:", {
            targetDate: date.toISOString().split("T")[0],
            assignmentDate: assignmentDate.toISOString().split("T")[0],
            startDate: assignment.startDate,
            assignedAt: assignment.assignedAt,
            targetDateLocal: date.toLocaleDateString(),
            assignmentDateLocal: assignmentDate.toLocaleDateString(),
          });
        }
        return isMatch;
      })
      .sort((a: any, b: any) => {
        // Sort by assignedAt date - oldest first (most recent at bottom)
        const dateA = new Date(a.assignedAt).getTime();
        const dateB = new Date(b.assignedAt).getTime();
        return dateA - dateB; // Ascending order (oldest to newest)
      });
  };

  // Memoize day data for the modal to prevent unnecessary recalculations
  const dayModalData = useMemo(() => {
    if (!selectedDate) {
      return {
        lessons: [],
        programs: [],
        routineAssignments: [],
        videoAssignments: [],
      };
    }
    return {
      lessons: getLessonsForDate(selectedDate),
      programs: getProgramsForDate(selectedDate),
      routineAssignments: getRoutineAssignmentsForDate(selectedDate),
      videoAssignments: getVideosForDate(selectedDate),
    };
  }, [
    selectedDate,
    clientLessons,
    assignedPrograms,
    assignedRoutines,
    videoAssignments,
    temporaryReplacements,
  ]);

  // Create a stable Sidebar component reference outside of render
  const StableSidebar = React.useMemo(() => React.memo(Sidebar), []);

  // Wrapper component that conditionally includes Sidebar
  // Memoized to prevent re-rendering when hover state changes
  const SidebarWrapperComponent = React.memo(
    ({
      children,
      noSidebar,
    }: {
      children: React.ReactNode;
      noSidebar: boolean;
    }) => {
      if (noSidebar) {
        return <>{children}</>;
      }
      return <StableSidebar user={undefined}>{children}</StableSidebar>;
    },
    (prevProps, nextProps) => {
      // Only re-render if noSidebar changes, ignore children changes
      return prevProps.noSidebar === nextProps.noSidebar;
    }
  );

  SidebarWrapperComponent.displayName = "SidebarWrapper";

  if (clientLoading) {
    return (
      <SidebarWrapperComponent noSidebar={noSidebar}>
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
        >
          <div
            className="flex items-center space-x-3"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            <Loader2
              className="h-8 w-8 animate-spin"
              style={{ color: COLORS.GOLDEN_ACCENT }}
            />
            <span className="text-lg" style={{ color: COLORS.TEXT_SECONDARY }}>
              Loading client details...
            </span>
          </div>
        </div>
      </SidebarWrapperComponent>
    );
  }

  if (!client) {
    return (
      <SidebarWrapperComponent noSidebar={noSidebar}>
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
        >
          <div className="text-center">
            <h2
              className="text-2xl font-semibold mb-3"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Client Not Found
            </h2>
            <p className="text-lg" style={{ color: COLORS.TEXT_SECONDARY }}>
              The requested client could not be found.
            </p>
            <button
              onClick={() => router.push(backPath)}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor: COLORS.GOLDEN_DARK,
                color: "#FFFFFF",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
              }}
            >
              Back to Clients
            </button>
          </div>
        </div>
      </SidebarWrapperComponent>
    );
  }

  return (
    <DndContext
      sensors={dragSensors}
      collisionDetection={closestCenter}
      onDragStart={(event) => {
        const data = event.active.data.current;
        if (data) {
          handleDragStart({
            type: data.type as "program" | "routine",
            id: data.id as string,
            title: data.title as string,
          });
        }
      }}
      onDragEnd={handleDragEnd}
    >
    <SidebarWrapperComponent noSidebar={noSidebar}>
      <div
        className="min-h-screen"
        style={{ backgroundColor: COLORS.BACKGROUND_DARK }}
      >
        <div className="max-w-7xl mx-auto p-4">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            {/* Client Info */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(backPath)}
                className="p-1.5 rounded-lg transition-colors"
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
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <ProfilePictureUploader
                currentAvatarUrl={
                  client.user?.settings?.avatarUrl || client.avatar
                }
                userName={client.name}
                onAvatarChange={() => {}}
                readOnly={true}
                size="md"
              />

              <div className="flex items-center gap-2">
                <div>
                  <h1
                    className="text-xl font-semibold mb-1"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    {client.name}
                  </h1>
                  <div
                    className="flex items-center gap-3 text-xs"
                    style={{ color: "#9CA3B0" }}
                  >
                    {client.user?.email && <span>{client.user.email}</span>}
                    {client.phone && <span>{client.phone}</span>}
                  </div>
                </div>
                {client.userId && (
                  <button
                    ref={quickMessageButtonRef}
                    onClick={e => {
                      setIsQuickMessageOpen(true);
                    }}
                    className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110 flex-shrink-0"
                    style={{
                      color: COLORS.TEXT_SECONDARY,
                      backgroundColor: "transparent",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                      e.currentTarget.style.backgroundColor =
                        COLORS.BACKGROUND_CARD_HOVER;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    title="Send message"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Notes Button */}
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border"
                style={{
                  backgroundColor: showNotes
                    ? getGoldenAccent(0.1)
                    : COLORS.BACKGROUND_CARD,
                  color: showNotes ? COLORS.GOLDEN_ACCENT : COLORS.TEXT_PRIMARY,
                  borderColor: showNotes
                    ? COLORS.GOLDEN_ACCENT
                    : COLORS.BORDER_SUBTLE,
                }}
                onMouseEnter={e => {
                  if (!showNotes) {
                    e.currentTarget.style.backgroundColor =
                      COLORS.BACKGROUND_CARD_HOVER;
                    e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                  }
                }}
                onMouseLeave={e => {
                  if (!showNotes) {
                    e.currentTarget.style.backgroundColor =
                      COLORS.BACKGROUND_CARD;
                    e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                  }
                }}
              >
                Notes
              </button>

              {/* Primary action - Schedule Lesson (most common) */}
              <button
                onClick={() => setShowScheduleLessonModal(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                style={{
                  backgroundColor: COLORS.GOLDEN_DARK,
                  color: "#FFFFFF",
                  borderColor: COLORS.GOLDEN_BORDER,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = COLORS.GOLDEN_DARK;
                }}
              >
                Schedule Lesson
              </button>

              {/* Dropdown for other assignments */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border"
                    style={{
                      backgroundColor: COLORS.BACKGROUND_CARD,
                      color: COLORS.TEXT_PRIMARY,
                      borderColor: COLORS.BORDER_SUBTLE,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor =
                        COLORS.BACKGROUND_CARD_HOVER;
                      e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor =
                        COLORS.BACKGROUND_CARD;
                      e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
                    }}
                  >
                    Assign
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="min-w-[200px] rounded-lg border shadow-xl"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_DARK,
                    borderColor: COLORS.BORDER_SUBTLE,
                  }}
                >
                  <DropdownMenuItem
                    onClick={() => setShowAssignProgramModal(true)}
                    className="cursor-pointer rounded-md px-2 py-1.5 text-xs transition-colors"
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
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                    }}
                  >
                    Assign Program
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowQuickAssignRoutineModal(true)}
                    className="cursor-pointer rounded-md px-2 py-1.5 text-xs transition-colors"
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
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                    }}
                  >
                    Assign Routine
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowAssignVideoModal(true)}
                    className="cursor-pointer rounded-md px-2 py-1.5 text-xs transition-colors"
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
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                    }}
                  >
                    Assign Video
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Athlete Overview Bar */}
          <div
            className="rounded-lg border p-4 mb-6"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Compliance Rate */}
              <div
                className="md:col-span-2 border-r pr-4"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              >
                <p
                  className="text-[10px] font-medium mb-1"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  Compliance Rate
                </p>
                <p
                  className="text-xl font-bold mb-2"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  {complianceLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    `${Math.min(
                      100,
                      Math.max(0, complianceData?.completionRate || 0)
                    )}%`
                  )}
                </p>
                <div className="flex gap-0.5 mb-1.5">
                  {["4", "6", "8", "all"].map(period => (
                    <button
                      key={period}
                      onClick={() => {
                        setCompliancePeriod(period as "4" | "6" | "8" | "all");
                        utils.clients.getComplianceData.invalidate({
                          clientId,
                          period: period as "4" | "6" | "8" | "all",
                        });
                      }}
                      className="px-1 py-0.5 rounded text-[9px] font-medium transition-all duration-200"
                      style={{
                        backgroundColor:
                          compliancePeriod === period
                            ? getGoldenAccent(0.1)
                            : "transparent",
                        color:
                          compliancePeriod === period
                            ? COLORS.TEXT_PRIMARY
                            : COLORS.TEXT_SECONDARY,
                      }}
                      onMouseEnter={e => {
                        if (compliancePeriod !== period) {
                          e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                        }
                      }}
                      onMouseLeave={e => {
                        if (compliancePeriod !== period) {
                          e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                        }
                      }}
                    >
                      {period === "all" ? "All" : `${period}w`}
                    </button>
                  ))}
                </div>
                <div
                  className="w-full rounded-full h-1.5"
                  style={{ backgroundColor: COLORS.BACKGROUND_CARD_HOVER }}
                >
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        complianceData?.completionRate || 0
                      )}%`,
                      backgroundColor:
                        Math.min(100, complianceData?.completionRate || 0) >= 80
                          ? COLORS.GREEN_PRIMARY
                          : Math.min(
                              100,
                              complianceData?.completionRate || 0
                            ) >= 60
                          ? COLORS.GOLDEN_ACCENT
                          : COLORS.RED_ALERT,
                    }}
                  />
                </div>
                {complianceData && (
                  <div
                    className="flex justify-between text-[9px] mt-1"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    <span>
                      {Math.min(
                        complianceData.completed || 0,
                        complianceData.total || 0
                      )}{" "}
                      completed
                    </span>
                    <span>{complianceData.total || 0} total</span>
                  </div>
                )}
              </div>

              {/* Next Lesson */}
              <div
                className="border-r pr-4"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              >
                <p
                  className="text-[10px] font-medium mb-1"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  Next Lesson
                </p>
                {upcomingLessons.length > 0 ? (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: COLORS.GREEN_PRIMARY }}
                      />
                      <p
                        className="text-sm font-semibold"
                        style={{ color: COLORS.TEXT_PRIMARY }}
                      >
                        {format(
                          new Date(upcomingLessons[0].date),
                          "MMM d, yyyy"
                        )}
                      </p>
                    </div>
                    <p
                      className="text-xs"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
                      {format(new Date(upcomingLessons[0].date), "h:mm a")}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p
                      className="text-sm mb-1"
                      style={{ color: COLORS.TEXT_MUTED }}
                    >
                      No lesson scheduled
                    </p>
                    <button
                      onClick={() => setShowScheduleLessonModal(true)}
                      className="text-xs font-medium transition-colors"
                      style={{ color: COLORS.GOLDEN_ACCENT }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = COLORS.GOLDEN_HOVER;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = COLORS.GOLDEN_ACCENT;
                      }}
                    >
                      Schedule
                    </button>
                  </div>
                )}
              </div>

              {/* Current Program */}
              <div
                className="border-r pr-4"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              >
                <p
                  className="text-[10px] font-medium mb-1"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  Current Program
                </p>
                {assignedPrograms.length > 0 ? (
                  <p
                    className="text-sm font-semibold"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    {assignedPrograms[0].program.title}
                  </p>
                ) : (
                  <div>
                    <p
                      className="text-sm mb-1"
                      style={{ color: COLORS.TEXT_MUTED }}
                    >
                      No program assigned
                    </p>
                    <button
                      onClick={() => setShowAssignProgramModal(true)}
                      className="text-xs font-medium transition-colors"
                      style={{ color: COLORS.GOLDEN_ACCENT }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = COLORS.GOLDEN_HOVER;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = COLORS.GOLDEN_ACCENT;
                      }}
                    >
                      Assign program
                    </button>
                  </div>
                )}
              </div>

              {/* Last Activity */}
              <div>
                <p
                  className="text-[10px] font-medium mb-1"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  Last Activity
                </p>
                {lastActivity ? (
                  <>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      {(() => {
                        const activityDate = parseISO(lastActivity.timestamp);
                        const now = new Date();
                        const diffMs = now.getTime() - activityDate.getTime();
                        const diffMins = Math.floor(diffMs / 60000);
                        const diffHours = Math.floor(diffMs / 3600000);
                        const diffDays = Math.floor(diffMs / 86400000);

                        if (diffMins < 1) return "Just now";
                        if (diffMins < 60) return `${diffMins}m ago`;
                        if (diffHours < 24) return `${diffHours}h ago`;
                        if (diffDays === 1) return "1 day ago";
                        if (diffDays < 7) return `${diffDays} days ago`;
                        if (diffDays < 30) {
                          const weeks = Math.floor(diffDays / 7);
                          return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
                        }
                        return format(activityDate, "MMM d, yyyy");
                      })()}
                    </p>
                    <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                      {lastActivity.type === "program_drill"
                        ? lastActivity.programTitle
                          ? `${lastActivity.description} - ${lastActivity.programTitle}`
                          : lastActivity.description
                        : lastActivity.type === "routine_exercise"
                        ? `Completed ${lastActivity.description}`
                        : `Completed ${lastActivity.description}`}
                    </p>
                  </>
                ) : (
                  <>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
                      No activity yet
                    </p>
                    <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                      Waiting for first completion
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Calendar Section */}
          <div
            className="rounded-lg border p-4 relative overflow-visible"
            style={{
              backgroundColor: COLORS.BACKGROUND_CARD,
              borderColor: COLORS.BORDER_SUBTLE,
            }}
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2
                  className="text-lg font-semibold"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Calendar View
                </h2>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewMode("month")}
                    className="px-2 py-1 rounded text-xs font-medium transition-all duration-200"
                    style={{
                      backgroundColor:
                        viewMode === "month"
                          ? getGoldenAccent(0.1)
                          : "transparent",
                      color:
                        viewMode === "month"
                          ? COLORS.TEXT_PRIMARY
                          : COLORS.TEXT_SECONDARY,
                    }}
                    onMouseEnter={e => {
                      if (viewMode !== "month") {
                        e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                      }
                    }}
                    onMouseLeave={e => {
                      if (viewMode !== "month") {
                        e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                      }
                    }}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setViewMode("week")}
                    className="px-2 py-1 rounded text-xs font-medium transition-all duration-200"
                    style={{
                      backgroundColor:
                        viewMode === "week"
                          ? getGoldenAccent(0.1)
                          : "transparent",
                      color:
                        viewMode === "week"
                          ? COLORS.TEXT_PRIMARY
                          : COLORS.TEXT_SECONDARY,
                    }}
                    onMouseEnter={e => {
                      if (viewMode !== "week") {
                        e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                      }
                    }}
                    onMouseLeave={e => {
                      if (viewMode !== "week") {
                        e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                      }
                    }}
                  >
                    Week
                  </button>
                </div>

                {/* Multi-Select Mode Toggle */}
                <button
                  onClick={() => {
                    setMultiSelectMode(!multiSelectMode);
                    setWeekSelectMode(false); // Disable week select when enabling day select
                    if (multiSelectMode) {
                      setSelectedDays(new Set());
                    }
                  }}
                  className="px-2 py-1 rounded text-xs font-medium transition-all duration-200 border"
                  style={{
                    backgroundColor: multiSelectMode
                      ? COLORS.BACKGROUND_CARD
                      : COLORS.BACKGROUND_CARD,
                    color: multiSelectMode
                      ? COLORS.TEXT_SECONDARY
                      : COLORS.TEXT_SECONDARY,
                    borderColor: multiSelectMode
                      ? COLORS.BORDER_SUBTLE
                      : COLORS.BORDER_SUBTLE,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor =
                      COLORS.BACKGROUND_CARD_HOVER;
                    e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor =
                      COLORS.BACKGROUND_CARD;
                    e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                  }}
                >
                  {multiSelectMode ? "Cancel" : "Select Days"}
                </button>

                {/* Week Select Mode Toggle */}
                <button
                  onClick={() => {
                    setWeekSelectMode(!weekSelectMode);
                    setMultiSelectMode(false); // Disable day select when enabling week select
                    if (weekSelectMode) {
                      setSelectedWeekStart(null);
                    }
                  }}
                  className="px-2 py-1 rounded text-xs font-medium transition-all duration-200 border"
                  style={{
                    backgroundColor: weekSelectMode
                      ? COLORS.BACKGROUND_CARD
                      : COLORS.BACKGROUND_CARD,
                    color: weekSelectMode
                      ? COLORS.TEXT_SECONDARY
                      : COLORS.TEXT_SECONDARY,
                    borderColor: weekSelectMode
                      ? COLORS.BORDER_SUBTLE
                      : COLORS.BORDER_SUBTLE,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor =
                      COLORS.BACKGROUND_CARD_HOVER;
                    e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor =
                      COLORS.BACKGROUND_CARD;
                    e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                  }}
                >
                  {weekSelectMode ? "Cancel" : "Select Week"}
                </button>

                {/* Copy and Delete Selected Buttons */}
                {multiSelectMode && selectedDays.size > 0 && (
                  <>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        // Copy all selected days
                        if (selectedDays.size > 0) {
                          const daysArray = Array.from(selectedDays).map(
                            dayKey => {
                              const [year, month, day] = dayKey
                                .split("-")
                                .map(Number);
                              return new Date(year, month - 1, day);
                            }
                          );
                          // Use the first selected day to trigger copy (will handle multiple days)
                          handleCopyDay(daysArray[0]);
                        }
                      }}
                      className="px-2 py-1 rounded text-xs font-medium transition-all duration-200 border"
                      style={{
                        backgroundColor: getGoldenAccent(0.1),
                        color: COLORS.GOLDEN_ACCENT,
                        borderColor: COLORS.GOLDEN_BORDER,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor =
                          getGoldenAccent(0.15);
                        e.currentTarget.style.borderColor =
                          COLORS.GOLDEN_ACCENT;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor =
                          getGoldenAccent(0.1);
                        e.currentTarget.style.borderColor =
                          COLORS.GOLDEN_BORDER;
                      }}
                    >
                      Copy {selectedDays.size} Day
                      {selectedDays.size !== 1 ? "s" : ""}
                    </button>
                    <button
                      onClick={handleDeleteMultipleDays}
                      disabled={isDeletingMultipleDays}
                      className="px-2 py-1 rounded text-xs font-medium transition-all duration-200 border disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: getRedAlert(0.1),
                        color: COLORS.RED_ALERT,
                        borderColor: COLORS.RED_BORDER,
                      }}
                      onMouseEnter={e => {
                        if (!e.currentTarget.disabled) {
                          e.currentTarget.style.backgroundColor =
                            getRedAlert(0.15);
                          e.currentTarget.style.borderColor = COLORS.RED_ALERT;
                        }
                      }}
                      onMouseLeave={e => {
                        if (!e.currentTarget.disabled) {
                          e.currentTarget.style.backgroundColor =
                            getRedAlert(0.1);
                          e.currentTarget.style.borderColor = COLORS.RED_BORDER;
                        }
                      }}
                    >
                      {isDeletingMultipleDays ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Deleting...
                        </span>
                      ) : (
                        `Delete ${selectedDays.size}`
                      )}
                    </button>
                  </>
                )}

                {/* Convert Week Button */}
                {weekSelectMode && selectedWeekStart && (
                  <button
                    onClick={() => setShowConvertWeekModal(true)}
                    className="px-2 py-1 rounded text-xs font-medium transition-all duration-200 border"
                    style={{
                      backgroundColor: getGoldenAccent(0.1),
                      color: COLORS.GOLDEN_ACCENT,
                      borderColor: COLORS.GOLDEN_BORDER,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor =
                        getGoldenAccent(0.15);
                      e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor =
                        getGoldenAccent(0.1);
                      e.currentTarget.style.borderColor = COLORS.GOLDEN_BORDER;
                    }}
                  >
                    Convert to Program
                  </button>
                )}

                {/* Clipboard Indicator */}
                {clipboardData && (
                  <div
                    className="flex items-center gap-1.5 px-2 py-1 rounded border"
                    style={{
                      backgroundColor: getGoldenAccent(0.1),
                      borderColor: COLORS.GOLDEN_BORDER,
                    }}
                  >
                    <span
                      className="text-xs"
                      style={{ color: COLORS.GOLDEN_HOVER }}
                    >
                      {clipboardData.assignments.routines.length +
                        clipboardData.assignments.programs.length +
                        clipboardData.assignments.videos.length}{" "}
                      copied
                    </span>
                    <button
                      onClick={() => setClipboardData(null)}
                      className="transition-colors"
                      style={{ color: COLORS.GOLDEN_ACCENT }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = COLORS.GOLDEN_HOVER;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = COLORS.GOLDEN_ACCENT;
                      }}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigateMonth("prev")}
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
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                    }}
                    title="Previous"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <h3
                    className="text-xl font-semibold min-w-[200px] text-center"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    {viewMode === "week"
                      ? `${format(calendarStart, "MMM d")} - ${format(
                          calendarEnd,
                          "MMM d, yyyy"
                        )}`
                      : format(currentMonth, "MMMM yyyy")}
                  </h3>
                  <button
                    onClick={() => navigateMonth("next")}
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
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                    }}
                    title="Next"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Calendar Legend */}
            <div className="flex items-center gap-4 mb-4 text-xs flex-wrap">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded border-2"
                  style={{
                    backgroundColor: "rgba(245, 158, 11, 0.2)",
                    borderColor: "#F59E0B",
                  }}
                />
                <span
                  className="font-medium"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Lessons
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded border-2"
                  style={{
                    backgroundColor: "rgba(59, 130, 246, 0.2)",
                    borderColor: "#3B82F6",
                  }}
                />
                <span
                  className="font-medium"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Programs
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded border-2"
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.2)",
                    borderColor: "#10B981",
                  }}
                />
                <span
                  className="font-medium"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Routines
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded border-2"
                  style={{
                    backgroundColor: "rgba(139, 92, 246, 0.2)",
                    borderColor: "#8B5CF6",
                  }}
                />
                <span
                  className="font-medium"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Videos
                </span>
              </div>
            </div>

            {/* Calendar Grid */}
            <div 
              className="grid grid-cols-7 gap-1 transition-all duration-300"
              style={{
                marginRight: dockOpen && isDesktop ? "320px" : "0",
              }}
            >
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold py-2 border-b"
                  style={{
                    color: COLORS.TEXT_SECONDARY,
                    borderColor: COLORS.BORDER_SUBTLE,
                  }}
                >
                  {day}
                </div>
              ))}
              {calendarDays.map(day => {
                const lessonsForDay = getLessonsForDate(day);
                const programsForDay = getProgramsForDate(day);
                const videosForDay = getVideosForDate(day);
                const routineAssignmentsForDay =
                  getRoutineAssignmentsForDate(day);
                const dayKey = format(day, "yyyy-MM-dd");
                const isSelected = selectedDays.has(dayKey);

                // Check if this day is part of the selected week
                const dayWeekStart = startOfWeek(day, { weekStartsOn: 0 });
                const isInSelectedWeek =
                  weekSelectMode &&
                  selectedWeekStart &&
                  dayWeekStart.getTime() === selectedWeekStart.getTime();

                const itemOrder = dayItemOrders[dayKey];

                return (
                  <ClientDetailCalendarDayCell
                    key={day.toISOString()}
                    day={day}
                    viewMode={viewMode}
                    currentMonth={currentMonth}
                    isSelected={isSelected}
                    isInSelectedWeek={isInSelectedWeek}
                    multiSelectMode={multiSelectMode}
                    weekSelectMode={weekSelectMode}
                    lessonsForDay={lessonsForDay}
                    programsForDay={programsForDay}
                    videosForDay={videosForDay}
                    routineAssignmentsForDay={routineAssignmentsForDay}
                    clipboardData={clipboardData}
                    onDateClick={handleDateClick}
                    onCopyDay={handleCopyDay}
                    onPasteDay={handlePasteDay}
                    onToggleDaySelection={toggleDaySelection}
                    onWeekSelection={handleWeekSelection}
                    setSelectedEventDetails={setSelectedEventDetails}
                    onReorderItems={handleReorderItems}
                    itemOrder={itemOrder}
                    isDesktop={isDesktop}
                  />
                        );
                      })}
                        </div>
            
            {/* Drag-and-Drop Dock - Attached to Calendar */}
            {isDesktop && (
              <ClientDetailDock
                isOpen={dockOpen}
                activeTab={dockActiveTab}
                searchTerm={dockSearchTerm}
                onToggle={() => setDockOpen(!dockOpen)}
                onTabChange={setDockActiveTab}
                onSearchChange={setDockSearchTerm}
                onDragStart={handleDragStart}
                onDragEnd={(item) => {
                  setIsDragging(false);
                  setDraggedItem(null);
                }}
              />
            )}
          </div>

          {/* Notes Modal */}
          {showNotes && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={() => setShowNotes(false)}
              />
              <div
                className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg border shadow-xl"
                style={{
                  backgroundColor: COLORS.BACKGROUND_DARK,
                  borderColor: COLORS.BORDER_SUBTLE,
                }}
                onClick={e => e.stopPropagation()}
              >
                <div
                  className="sticky top-0 flex items-center justify-between p-4 border-b z-10"
                  style={{
                    backgroundColor: COLORS.BACKGROUND_DARK,
                    borderColor: COLORS.BORDER_SUBTLE,
                  }}
                >
                  <h2
                    className="text-xl font-semibold"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    Notes for {client.name}
                  </h2>
                  <button
                    onClick={() => setShowNotes(false)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor =
                        COLORS.BACKGROUND_CARD_HOVER;
                      e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                    }}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-6">
                  <NotesDisplay clientId={clientId} showComposer={true} />
                </div>
              </div>
            </div>
          )}

          {/* Modals */}
          {showAssignProgramModal && (
            <QuickAssignProgramModal
              isOpen={showAssignProgramModal}
              onClose={() => {
                setShowAssignProgramModal(false);
                refreshAllData();
              }}
              clientId={clientId}
              clientName={client.name}
              startDate={
                selectedDate
                  ? selectedDate.toISOString().split("T")[0]
                  : new Date().toISOString().split("T")[0]
              }
            />
          )}


          {showQuickAssignRoutineModal && (
            <QuickAssignRoutineModal
              isOpen={showQuickAssignRoutineModal}
              onClose={() => {
                setShowQuickAssignRoutineModal(false);
                refreshAllData();
              }}
              clientId={clientId}
              clientName={client.name}
              startDate={new Date().toISOString().split("T")[0]}
            />
          )}

          {showQuickAssignRoutineFromDayModal && (
            <QuickAssignRoutineFromDayModal
              isOpen={showQuickAssignRoutineFromDayModal}
              onClose={() => {
                setShowQuickAssignRoutineFromDayModal(false);
                refreshAllData();
              }}
              clientId={clientId}
              clientName={client.name}
              startDate={
                selectedDate
                  ? selectedDate.toISOString().split("T")[0]
                  : new Date().toISOString().split("T")[0]
              }
            />
          )}

          {showAssignRoutineModal && (
            <AssignRoutineModal
              isOpen={showAssignRoutineModal}
              onClose={() => {
                setShowAssignRoutineModal(false);
                refreshAllData();
              }}
              clientId={clientId}
              clientName={client.name}
              startDate={
                selectedDate
                  ? selectedDate.toISOString().split("T")[0]
                  : undefined
              }
            />
          )}

          {showAssignVideoModal && client && (
            <AssignVideoModal
              isOpen={showAssignVideoModal}
              onClose={() => {
                setShowAssignVideoModal(false);
                refreshAllData();
              }}
              clientId={clientId}
              clientName={client.name || "Client"}
              startDate={
                selectedDate
                  ? selectedDate.toISOString().split("T")[0]
                  : undefined
              }
            />
          )}

          {showScheduleLessonModal && (
            <StreamlinedScheduleLessonModal
              isOpen={showScheduleLessonModal}
              onClose={() => {
                setShowScheduleLessonModal(false);
                setReplacementData(null);
                refreshAllData();
              }}
              clientId={clientId}
              clientName={client.name}
              clientEmail={client.user?.email}
              selectedDate={selectedDate}
              overrideWorkingDays={noSidebar} // Override working days in organization context
              replacementData={replacementData} // Pass replacement data to override restrictions
            />
          )}

          {/* Day Details Modal */}
          <DayDetailsModal
            isOpen={showDayDetailsModal}
            onClose={() => setShowDayDetailsModal(false)}
            selectedDate={selectedDate}
            lessons={dayModalData.lessons}
            programs={dayModalData.programs}
            routineAssignments={dayModalData.routineAssignments}
            videoAssignments={dayModalData.videoAssignments}
            onScheduleLesson={() => {
              setShowScheduleLessonModal(true);
              setShowDayDetailsModal(false);
            }}
            onAssignProgram={() => {
              setShowAssignProgramModal(true);
              setShowDayDetailsModal(false);
            }}
            onAssignRoutine={() => {
              setShowQuickAssignRoutineFromDayModal(true);
              setShowDayDetailsModal(false);
            }}
            onAssignVideo={() => {
              setShowAssignVideoModal(true);
              setShowDayDetailsModal(false);
            }}
            onReplaceWithLesson={replacementData => {
              setReplacementData(replacementData);
              setShowScheduleLessonModal(true);
              setShowDayDetailsModal(false);
            }}
            onRemoveProgram={handleRemoveProgram}
            onRemoveRoutine={handleRemoveRoutine}
            onRemoveLesson={handleRemoveLesson}
            onRemoveVideo={handleRemoveVideo}
            getStatusIcon={getStatusIcon}
            getStatusColor={getStatusColor}
          />

          {/* Conflict Resolution Modal */}
          <ConflictResolutionModal
            isOpen={showConflictResolutionModal}
            onClose={() => {
              setShowConflictResolutionModal(false);
              setConflictData(null);
            }}
            onResolve={handleConflictResolution}
            conflictData={conflictData}
          />

          {/* Convert Week to Program Modal */}
          {selectedWeekStart && (
            <ConvertWeekToProgramModal
              isOpen={showConvertWeekModal}
              onClose={() => {
                setShowConvertWeekModal(false);
                setSelectedWeekStart(null);
                setWeekSelectMode(false);
              }}
              weekStart={selectedWeekStart}
              clientId={clientId}
              onSuccess={() => {
                refreshAllData();
              }}
              getLessonsForDate={getLessonsForDate}
              getProgramsForDate={getProgramsForDate}
              getRoutineAssignmentsForDate={getRoutineAssignmentsForDate}
              getVideosForDate={getVideosForDate}
            />
          )}

          {/* Event Details Modal */}
          <Dialog
            open={!!selectedEventDetails}
            onOpenChange={(open: boolean) => {
              if (!open) setSelectedEventDetails(null);
            }}
          >
            <DialogContent
              className="max-w-md"
              style={{
                backgroundColor: COLORS.BACKGROUND_DARK,
                borderColor: COLORS.BORDER_SUBTLE,
              }}
            >
              <DialogHeader>
                <DialogTitle
                  style={{
                    color: COLORS.TEXT_PRIMARY,
                    fontSize: "1rem",
                    fontWeight: 600,
                  }}
                >
                  {selectedEventDetails?.name}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Details for{" "}
                  {selectedEventDetails?.type === "program"
                    ? "program"
                    : "routine"}
                  : {selectedEventDetails?.name}
                </DialogDescription>
              </DialogHeader>
              {selectedEventDetails && (
                <div>
                  {selectedEventDetails.items &&
                    selectedEventDetails.items.length > 0 && (
                      <div className="mb-3">
                        <div
                          className="text-xs mb-2"
                          style={{ color: COLORS.TEXT_SECONDARY }}
                        >
                          {selectedEventDetails.items.length}{" "}
                          {selectedEventDetails.type === "program"
                            ? "drill"
                            : "exercise"}
                          {selectedEventDetails.items.length !== 1 ? "s" : ""}
                        </div>
                        <div
                          className="max-h-[400px] overflow-y-auto space-y-1.5"
                          style={{
                            borderColor: COLORS.BORDER_SUBTLE,
                          }}
                        >
                          {selectedEventDetails.items.map((item, index) => {
                            const itemId = item.id || `item-${index}`;
                            const isExpanded = expandedDrills.has(itemId);
                            const hasRoutine = item.routineId;

                            return (
                              <DrillItemComponent
                                key={itemId}
                                item={item}
                                itemId={itemId}
                                isExpanded={isExpanded}
                                onToggle={() => {
                                  const newExpanded = new Set(expandedDrills);
                                  if (newExpanded.has(itemId)) {
                                    newExpanded.delete(itemId);
                                  } else {
                                    newExpanded.add(itemId);
                                  }
                                  setExpandedDrills(newExpanded);
                                }}
                                type={selectedEventDetails.type}
                                routineCache={routineCache}
                                setRoutineCache={setRoutineCache}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {(!selectedEventDetails.items ||
                    selectedEventDetails.items.length === 0) && (
                    <div
                      className="py-4 text-sm text-center"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
                      No items
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Quick Message Popup */}
          {client && client.userId && (
            <QuickMessagePopup
              isOpen={isQuickMessageOpen}
              onClose={() => setIsQuickMessageOpen(false)}
              client={{
                id: client.id,
                name: client.name,
                userId: client.userId,
              }}
              buttonRef={quickMessageButtonRef}
            />
          )}
          
          {/* Loading indicator during assignment */}
          {isDesktop && isAssigning && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
            >
              <div
                className="px-6 py-4 rounded-lg shadow-lg flex items-center gap-3"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.GOLDEN_ACCENT,
                  border: "2px solid",
                }}
              >
                <Loader2
                  className="h-5 w-5 animate-spin"
                  style={{ color: COLORS.GOLDEN_ACCENT }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Assigning...
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarWrapperComponent>
    </DndContext>
  );
}

export default withMobileDetection(MobileClientDetailPage, ClientDetailPage);
