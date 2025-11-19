"use client";

import { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import {
  BarChart3,
  TrendingUp,
  Users,
  Trophy,
  Target,
  Star,
  Activity,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
  PlayCircle,
  CheckCircle,
  Goal,
  Edit,
  Save,
  X,
} from "lucide-react";
import Sidebar from "./Sidebar";
import ErrorBoundary from "./ErrorBoundary";

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<"4" | "6" | "8" | "all">("4");
  // const [selectedMetric, setSelectedMetric] = useState<string>("overview")
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [editingGoals, setEditingGoals] = useState({
    activeClients: 5,
    workoutCompletion: 75,
    programProgress: 70,
    clientRetention: 85,
  });

  // Fetch real analytics data with error handling
  const {
    data: analyticsData,
    isLoading,
    error,
  } = trpc.analytics.getDashboardData.useQuery(
    {
      timeRange: timeRange === "all" ? "1y" : `${timeRange}w`,
    },
    {
      retry: 1,
      retryDelay: 1000,
    }
  );

  // Extract data from the response
  const analytics = analyticsData || ({} as any);

  // Extract metrics from the response
  const activeClients = analytics.activeClients || 0;
  const workoutCompletionRate = analytics.workoutCompletionRate || 0;
  const averageProgress = analytics.averageProgress || 0;
  const retentionRate = analytics.retentionRate || 0;

  // For now, use placeholder data for client analytics and recent activity
  const clientAnalytics: any[] = [];
  const recentActivity: any[] = [];

  // Use default goals for now (simplified)
  const goals = {
    activeClients: Math.max(activeClients, 5),
    workoutCompletion: Math.max(workoutCompletionRate, 70),
    programProgress: Math.max(averageProgress, 60),
    clientRetention: Math.max(retentionRate, 80),
  };

  // Simplified goals handling (no mutation for now)
  const updateGoalsMutation = {
    isLoading: false,
    mutate: (data: any) => {
      // Goals update handled silently
    },
  };

  if (isLoading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-64">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: "#4A5A70" }}
          />
        </div>
      </Sidebar>
    );
  }

  if (error) {
    return (
      <Sidebar>
        <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: "#EF4444" }}
              >
                <BarChart3 className="h-8 w-8" style={{ color: "#FFFFFF" }} />
              </div>
              <h3
                className="text-xl font-bold mb-2"
                style={{ color: "#C3BCC2" }}
              >
                Analytics Unavailable
              </h3>
              <p className="text-lg mb-4" style={{ color: "#ABA4AA" }}>
                Unable to load analytics data at this time.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </Sidebar>
    );
  }

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  // const formatNumber = (value: number) => value.toLocaleString()
  // const formatCurrency = (value: number) => `$${value.toLocaleString()}`

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowUp className="h-4 w-4 text-green-400" />;
    if (trend < 0) return <ArrowDown className="h-4 w-4 text-red-400" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return "text-green-400";
    if (trend < 0) return "text-red-400";
    return "text-gray-400";
  };

  const getGoalStatus = (current: number, goal: number) => {
    const percentage = (current / goal) * 100;
    if (percentage >= 100)
      return { status: "achieved", color: "text-green-400" };
    if (percentage >= 80)
      return { status: "on-track", color: "text-yellow-400" };
    return { status: "needs-attention", color: "text-red-400" };
  };

  const handleStartEditingGoals = () => {
    setEditingGoals({
      activeClients: goals.activeClients,
      workoutCompletion: goals.workoutCompletion,
      programProgress: goals.programProgress,
      clientRetention: goals.clientRetention,
    });
    setIsEditingGoals(true);
  };

  const handleSaveGoals = () => {
    updateGoalsMutation.mutate(editingGoals);
  };

  const handleCancelEditingGoals = () => {
    setIsEditingGoals(false);
    setEditingGoals({
      activeClients: goals.activeClients,
      workoutCompletion: goals.workoutCompletion,
      programProgress: goals.programProgress,
      clientRetention: goals.clientRetention,
    });
  };

  return (
    <ErrorBoundary>
      <Sidebar>
        <div className="min-h-screen" style={{ backgroundColor: "#2A3133" }}>
          {/* Mobile Header */}
          <div className="md:hidden mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: "#4A5A70" }}
                >
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">Analytics</h1>
                  <p className="text-xs text-gray-400">Performance insights</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-white">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:block mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "#4A5A70" }}
                >
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Analytics</h1>
                  <p className="text-sm text-gray-400">
                    Performance insights & trends
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-white">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Goals Section - Always Visible */}
          <div className="mb-6">
            <div
              className="rounded-2xl border p-4"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3
                  className="text-lg font-bold flex items-center gap-2"
                  style={{ color: "#C3BCC2" }}
                >
                  <Target className="h-4 w-4" style={{ color: "#4A5A70" }} />
                  Performance Goals
                </h3>
                {!isEditingGoals ? (
                  <button
                    onClick={handleStartEditingGoals}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all duration-200 hover:scale-105"
                    style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleSaveGoals}
                      disabled={updateGoalsMutation.isLoading}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all duration-200 hover:scale-105"
                      style={{ backgroundColor: "#10B981", color: "#FFFFFF" }}
                    >
                      <Save className="h-3 w-3" />
                      {updateGoalsMutation.isLoading ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={handleCancelEditingGoals}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all duration-200 hover:scale-105"
                      style={{ backgroundColor: "#EF4444", color: "#FFFFFF" }}
                    >
                      <X className="h-3 w-3" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    title: "Active Clients",
                    current: activeClients,
                    goal: isEditingGoals
                      ? editingGoals.activeClients
                      : goals.activeClients,
                    icon: <Users className="h-4 w-4" />,
                    key: "activeClients",
                  },
                  {
                    title: "Workout Completion",
                    current: workoutCompletionRate,
                    goal: isEditingGoals
                      ? editingGoals.workoutCompletion
                      : goals.workoutCompletion,
                    icon: <CheckCircle className="h-4 w-4" />,
                    key: "workoutCompletion",
                  },
                  {
                    title: "Program Progress",
                    current: averageProgress,
                    goal: isEditingGoals
                      ? editingGoals.programProgress
                      : goals.programProgress,
                    icon: <TrendingUp className="h-4 w-4" />,
                    key: "programProgress",
                  },
                  {
                    title: "Client Retention",
                    current: retentionRate,
                    goal: isEditingGoals
                      ? editingGoals.clientRetention
                      : goals.clientRetention,
                    icon: <Star className="h-4 w-4" />,
                    key: "clientRetention",
                  },
                ].map((metric, index) => {
                  const status = getGoalStatus(metric.current, metric.goal);
                  return (
                    <div
                      key={index}
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: "#2A2F2F" }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <div style={{ color: "#4A5A70" }}>{metric.icon}</div>
                          <span
                            className="text-xs font-medium"
                            style={{ color: "#ABA4AA" }}
                          >
                            {metric.title}
                          </span>
                        </div>
                        <span
                          className={`text-xs px-1 py-0.5 rounded ${status.color}`}
                        >
                          {status.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-sm font-bold"
                          style={{ color: "#C3BCC2" }}
                        >
                          {metric.title.includes("Rate") ||
                          metric.title.includes("Progress")
                            ? formatPercentage(metric.current)
                            : metric.current}
                        </span>
                        {isEditingGoals ? (
                          <input
                            type="number"
                            value={metric.goal}
                            onChange={e => {
                              const value = parseFloat(e.target.value) || 0;
                              setEditingGoals(prev => ({
                                ...prev,
                                [metric.key]: value,
                              }));
                            }}
                            className="w-12 px-1 py-0.5 text-xs rounded border"
                            style={{
                              backgroundColor: "#2A2F2F",
                              borderColor: "#606364",
                              color: "#C3BCC2",
                            }}
                            min={0}
                            max={metric.key === "activeClients" ? 1000 : 100}
                            step={metric.key === "activeClients" ? 1 : 0.1}
                          />
                        ) : (
                          <span
                            className="text-xs"
                            style={{ color: "#ABA4AA" }}
                          >
                            /{" "}
                            {metric.title.includes("Rate") ||
                            metric.title.includes("Progress")
                              ? formatPercentage(metric.goal)
                              : metric.goal}
                          </span>
                        )}
                      </div>
                      <div
                        className="w-full rounded-full h-1.5"
                        style={{ backgroundColor: "#606364" }}
                      >
                        <div
                          className="h-1.5 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              (metric.current / metric.goal) * 100,
                              100
                            )}%`,
                            background:
                              status.status === "achieved"
                                ? "linear-gradient(to right, #10B981, #34D399)"
                                : status.status === "on-track"
                                ? "linear-gradient(to right, #F59E0B, #FBBF24)"
                                : "linear-gradient(to right, #EF4444, #F87171)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mobile Time Range Selector */}
          <div className="md:hidden mb-4">
            <div
              className="flex space-x-1 p-1 rounded-lg border w-full"
              style={{ backgroundColor: "#1F2426", borderColor: "#4A5A70" }}
            >
              {[
                { value: "4", label: "4W" },
                { value: "6", label: "6W" },
                { value: "8", label: "8W" },
                { value: "all", label: "ALL" },
              ].map(range => (
                <button
                  key={range.value}
                  onClick={() =>
                    setTimeRange(range.value as "4" | "6" | "8" | "all")
                  }
                  className={`flex-1 px-2 py-2 rounded-md text-xs font-medium transition-all duration-300 ${
                    timeRange === range.value ? "shadow-lg" : ""
                  }`}
                  style={{
                    backgroundColor:
                      timeRange === range.value ? "#4A5A70" : "transparent",
                    color: timeRange === range.value ? "#FFFFFF" : "#ABA4AA",
                  }}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Time Range Selector */}
          <div className="hidden md:block mb-6">
            <div
              className="flex space-x-1 p-1 rounded-xl border w-fit"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              {[
                { value: "4", label: "4 Weeks" },
                { value: "6", label: "6 Weeks" },
                { value: "8", label: "8 Weeks" },
                { value: "all", label: "All Time" },
              ].map(range => (
                <button
                  key={range.value}
                  onClick={() =>
                    setTimeRange(range.value as "4" | "6" | "8" | "all")
                  }
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    timeRange === range.value ? "shadow-lg" : ""
                  }`}
                  style={{
                    backgroundColor:
                      timeRange === range.value ? "#4A5A70" : "transparent",
                    color: timeRange === range.value ? "#FFFFFF" : "#ABA4AA",
                  }}
                  onMouseEnter={e => {
                    if (timeRange !== range.value) {
                      e.currentTarget.style.backgroundColor = "#3A4040";
                      e.currentTarget.style.color = "#C3BCC2";
                    }
                  }}
                  onMouseLeave={e => {
                    if (timeRange !== range.value) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#ABA4AA";
                    }
                  }}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* No Data Notice */}
          {(!activeClients || activeClients === 0) && (
            <div className="mb-6">
              <div
                className="rounded-2xl border p-6 text-center"
                style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: "#4A5A70" }}
                >
                  <BarChart3 className="h-6 w-6" style={{ color: "#C3BCC2" }} />
                </div>
                <h3
                  className="text-lg font-bold mb-2"
                  style={{ color: "#C3BCC2" }}
                >
                  No Analytics Data Yet
                </h3>
                <p className="text-sm mb-4" style={{ color: "#ABA4AA" }}>
                  Start by adding clients and assigning programs to see your
                  analytics
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => (window.location.href = "/clients")}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                    style={{ backgroundColor: "#10B981", color: "#FFFFFF" }}
                  >
                    Add Clients
                  </button>
                  <button
                    onClick={() => (window.location.href = "/programs")}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                    style={{ backgroundColor: "#4A5A70", color: "#FFFFFF" }}
                  >
                    Create Programs
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Metrics - Enhanced Grid Layout */}
          <div className="md:hidden mb-4">
            <div className="grid grid-cols-2 gap-3">
              <div
                className="rounded-lg border p-3 relative overflow-hidden"
                style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
              >
                <div className="absolute top-0 right-0 w-12 h-12 opacity-10">
                  <div
                    className="w-full h-full rounded-full"
                    style={{ backgroundColor: "#4A5A70" }}
                  />
                </div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center"
                        style={{ backgroundColor: "#4A5A70" }}
                      >
                        <Users
                          className="h-3 w-3"
                          style={{ color: "#C3BCC2" }}
                        />
                      </div>
                      <span
                        className="text-xs font-medium"
                        style={{ color: "#ABA4AA" }}
                      >
                        Active Clients
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowUp className="h-2 w-2 text-green-400" />
                      <span className="text-xs text-green-400 font-medium">
                        +2
                      </span>
                    </div>
                  </div>
                  <div
                    className="text-lg font-bold mb-1"
                    style={{ color: "#C3BCC2" }}
                  >
                    {activeClients}
                  </div>
                  <div
                    className="w-full h-1 rounded-full"
                    style={{ backgroundColor: "#606364" }}
                  >
                    <div
                      className="h-1 rounded-full bg-gradient-to-r from-green-400 to-green-500"
                      style={{ width: "75%" }}
                    />
                  </div>
                </div>
              </div>
              <div
                className="rounded-lg border p-3 relative overflow-hidden"
                style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
              >
                <div className="absolute top-0 right-0 w-12 h-12 opacity-10">
                  <div
                    className="w-full h-full rounded-full"
                    style={{ backgroundColor: "#10B981" }}
                  />
                </div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center"
                        style={{ backgroundColor: "#10B981" }}
                      >
                        <TrendingUp
                          className="h-3 w-3"
                          style={{ color: "#C3BCC2" }}
                        />
                      </div>
                      <span
                        className="text-xs font-medium"
                        style={{ color: "#ABA4AA" }}
                      >
                        Progress
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowDown className="h-2 w-2 text-red-400" />
                      <span className="text-xs text-red-400 font-medium">
                        -5%
                      </span>
                    </div>
                  </div>
                  <div
                    className="text-lg font-bold mb-1"
                    style={{ color: "#C3BCC2" }}
                  >
                    {formatPercentage(averageProgress)}
                  </div>
                  <div
                    className="w-full h-1 rounded-full"
                    style={{ backgroundColor: "#606364" }}
                  >
                    <div
                      className="h-1 rounded-full bg-gradient-to-r from-red-400 to-red-500"
                      style={{ width: `${Math.min(averageProgress, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              <div
                className="rounded-lg border p-3 relative overflow-hidden"
                style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
              >
                <div className="absolute top-0 right-0 w-12 h-12 opacity-10">
                  <div
                    className="w-full h-full rounded-full"
                    style={{ backgroundColor: "#F59E0B" }}
                  />
                </div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center"
                        style={{ backgroundColor: "#F59E0B" }}
                      >
                        <CheckCircle
                          className="h-3 w-3"
                          style={{ color: "#C3BCC2" }}
                        />
                      </div>
                      <span
                        className="text-xs font-medium"
                        style={{ color: "#ABA4AA" }}
                      >
                        Completion
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowUp className="h-2 w-2 text-green-400" />
                      <span className="text-xs text-green-400 font-medium">
                        +12%
                      </span>
                    </div>
                  </div>
                  <div
                    className="text-lg font-bold mb-1"
                    style={{ color: "#C3BCC2" }}
                  >
                    {formatPercentage(workoutCompletionRate)}
                  </div>
                  <div
                    className="w-full h-1 rounded-full"
                    style={{ backgroundColor: "#606364" }}
                  >
                    <div
                      className="h-1 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500"
                      style={{
                        width: `${Math.min(workoutCompletionRate, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              <div
                className="rounded-lg border p-3 relative overflow-hidden"
                style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
              >
                <div className="absolute top-0 right-0 w-12 h-12 opacity-10">
                  <div
                    className="w-full h-full rounded-full"
                    style={{ backgroundColor: "#8B5CF6" }}
                  />
                </div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center"
                        style={{ backgroundColor: "#8B5CF6" }}
                      >
                        <Star
                          className="h-3 w-3"
                          style={{ color: "#C3BCC2" }}
                        />
                      </div>
                      <span
                        className="text-xs font-medium"
                        style={{ color: "#ABA4AA" }}
                      >
                        Retention
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Minus className="h-2 w-2 text-gray-400" />
                      <span className="text-xs text-gray-400 font-medium">
                        0%
                      </span>
                    </div>
                  </div>
                  <div
                    className="text-lg font-bold mb-1"
                    style={{ color: "#C3BCC2" }}
                  >
                    {formatPercentage(retentionRate)}
                  </div>
                  <div
                    className="w-full h-1 rounded-full"
                    style={{ backgroundColor: "#606364" }}
                  >
                    <div
                      className="h-1 rounded-full bg-gradient-to-r from-purple-400 to-purple-500"
                      style={{ width: `${Math.min(retentionRate, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Main KPIs Above the Fold */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Active Clients */}
            <div
              className="rounded-lg border p-4 cursor-pointer hover:scale-105 transition-all duration-200"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" style={{ color: "#4A5A70" }} />
                  <span
                    className="text-sm font-medium"
                    style={{ color: "#ABA4AA" }}
                  >
                    Active Clients
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <ArrowUp className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400 font-medium">▲2</span>
                </div>
              </div>
              <div
                className="text-2xl font-bold mb-1"
                style={{ color: "#C3BCC2" }}
              >
                {activeClients}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "#ABA4AA" }}>
                  target 15
                </span>
                <div
                  className="w-16 h-1 rounded-full"
                  style={{ backgroundColor: "#606364" }}
                >
                  <div
                    className="h-1 rounded-full bg-green-400"
                    style={{
                      width: `${Math.min((activeClients / 15) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Workout Completion (Last 28d) */}
            <div
              className="rounded-lg border p-4 cursor-pointer hover:scale-105 transition-all duration-200"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className="h-4 w-4"
                    style={{ color: "#F59E0B" }}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: "#ABA4AA" }}
                  >
                    Workout Completion
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <ArrowUp className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400 font-medium">
                    ▲12%
                  </span>
                </div>
              </div>
              <div
                className="text-2xl font-bold mb-1"
                style={{ color: "#C3BCC2" }}
              >
                {formatPercentage(workoutCompletionRate)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "#ABA4AA" }}>
                  last 28d • target 80%
                </span>
                <div
                  className="w-16 h-1 rounded-full"
                  style={{ backgroundColor: "#606364" }}
                >
                  <div
                    className="h-1 rounded-full bg-yellow-400"
                    style={{
                      width: `${Math.min(workoutCompletionRate, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Avg Program Progress */}
            <div
              className="rounded-lg border p-4 cursor-pointer hover:scale-105 transition-all duration-200"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp
                    className="h-4 w-4"
                    style={{ color: "#10B981" }}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: "#ABA4AA" }}
                  >
                    Avg Program Progress
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <ArrowDown className="h-3 w-3 text-red-400" />
                  <span className="text-xs text-red-400 font-medium">▼5%</span>
                </div>
              </div>
              <div
                className="text-2xl font-bold mb-1"
                style={{ color: "#C3BCC2" }}
              >
                {formatPercentage(averageProgress)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "#ABA4AA" }}>
                  target 70%
                </span>
                <div
                  className="w-16 h-1 rounded-full"
                  style={{ backgroundColor: "#606364" }}
                >
                  <div
                    className="h-1 rounded-full bg-red-400"
                    style={{ width: `${Math.min(averageProgress, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Retention (Rolling 30d) */}
            <div
              className="rounded-lg border p-4 cursor-pointer hover:scale-105 transition-all duration-200"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" style={{ color: "#8B5CF6" }} />
                  <span
                    className="text-sm font-medium"
                    style={{ color: "#ABA4AA" }}
                  >
                    Retention
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Minus className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-400 font-medium">0%</span>
                </div>
              </div>
              <div
                className="text-2xl font-bold mb-1"
                style={{ color: "#C3BCC2" }}
              >
                {formatPercentage(retentionRate)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "#ABA4AA" }}>
                  rolling 30d • target 85%
                </span>
                <div
                  className="w-16 h-1 rounded-full"
                  style={{ backgroundColor: "#606364" }}
                >
                  <div
                    className="h-1 rounded-full bg-purple-400"
                    style={{ width: `${Math.min(retentionRate, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Sidebar>
    </ErrorBoundary>
  );
}
