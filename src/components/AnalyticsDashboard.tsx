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
  const [showGoals, setShowGoals] = useState(false);
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
              <div className="flex gap-2">
                <button
                  onClick={() => setShowGoals(!showGoals)}
                  className="p-2 rounded-lg text-xs font-medium transition-all duration-200"
                  style={{
                    backgroundColor: showGoals ? "#10B981" : "#4A5A70",
                    color: "#FFFFFF",
                  }}
                >
                  <Goal className="h-3 w-3" />
                </button>
                <div className="text-right">
                  <div className="text-xs font-bold text-white">
                    {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:block mb-8">
            <div className="rounded-2xl border relative overflow-hidden group">
              <div
                className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(135deg, #4A5A70 0%, #606364 50%, #353A3A 100%)",
                }}
              />
              <div className="relative p-8 bg-gradient-to-r from-transparent via-black/20 to-black/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: "#4A5A70" }}
                    >
                      <BarChart3
                        className="h-6 w-6"
                        style={{ color: "#C3BCC2" }}
                      />
                    </div>
                    <div>
                      <h1
                        className="text-4xl font-bold mb-2"
                        style={{ color: "#C3BCC2" }}
                      >
                        Analytics Dashboard
                      </h1>
                      <p
                        className="flex items-center gap-2 text-lg"
                        style={{ color: "#ABA4AA" }}
                      >
                        <Zap className="h-5 w-5 text-yellow-400" />
                        Data-driven insights to optimize your coaching
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setShowGoals(!showGoals)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                      style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = "#606364";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = "#4A5A70";
                      }}
                    >
                      <Goal className="h-4 w-4" />
                      {showGoals ? "Hide Goals" : "Show Goals"}
                    </button>
                    <div className="text-right">
                      <div
                        className="text-2xl font-bold"
                        style={{ color: "#C3BCC2" }}
                      >
                        {new Date().toLocaleDateString()}
                      </div>
                      <div className="text-sm" style={{ color: "#ABA4AA" }}>
                        {new Date().toLocaleDateString("en-US", {
                          weekday: "long",
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Goals Section */}
          {showGoals && (
            <div className="mb-8">
              <div
                className="rounded-2xl shadow-xl border p-6"
                style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="text-xl font-bold flex items-center gap-2"
                    style={{ color: "#C3BCC2" }}
                  >
                    <Target className="h-5 w-5" style={{ color: "#4A5A70" }} />
                    Performance Goals
                  </h3>
                  {!isEditingGoals ? (
                    <button
                      onClick={handleStartEditingGoals}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                      style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = "#606364";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = "#4A5A70";
                      }}
                    >
                      <Edit className="h-4 w-4" />
                      Edit Goals
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveGoals}
                        disabled={updateGoalsMutation.isLoading}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                        style={{ backgroundColor: "#10B981", color: "#FFFFFF" }}
                        onMouseEnter={e => {
                          if (!updateGoalsMutation.isLoading) {
                            e.currentTarget.style.backgroundColor = "#059669";
                          }
                        }}
                        onMouseLeave={e => {
                          if (!updateGoalsMutation.isLoading) {
                            e.currentTarget.style.backgroundColor = "#10B981";
                          }
                        }}
                      >
                        <Save className="h-4 w-4" />
                        {updateGoalsMutation.isLoading ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={handleCancelEditingGoals}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                        style={{ backgroundColor: "#EF4444", color: "#FFFFFF" }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = "#DC2626";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = "#EF4444";
                        }}
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      title: "Active Clients",
                      current: activeClients,
                      goal: isEditingGoals
                        ? editingGoals.activeClients
                        : goals.activeClients,
                      icon: <Users className="h-5 w-5" />,
                      key: "activeClients",
                    },
                    {
                      title: "Workout Completion",
                      current: workoutCompletionRate,
                      goal: isEditingGoals
                        ? editingGoals.workoutCompletion
                        : goals.workoutCompletion,
                      icon: <CheckCircle className="h-5 w-5" />,
                      key: "workoutCompletion",
                    },
                    {
                      title: "Program Progress",
                      current: averageProgress,
                      goal: isEditingGoals
                        ? editingGoals.programProgress
                        : goals.programProgress,
                      icon: <TrendingUp className="h-5 w-5" />,
                      key: "programProgress",
                    },
                    {
                      title: "Client Retention",
                      current: retentionRate,
                      goal: isEditingGoals
                        ? editingGoals.clientRetention
                        : goals.clientRetention,
                      icon: <Star className="h-5 w-5" />,
                      key: "clientRetention",
                    },
                  ].map((metric, index) => {
                    const status = getGoalStatus(metric.current, metric.goal);
                    return (
                      <div
                        key={index}
                        className="p-4 rounded-lg"
                        style={{ backgroundColor: "#2A2F2F" }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div style={{ color: "#4A5A70" }}>
                              {metric.icon}
                            </div>
                            <span
                              className="text-sm font-medium"
                              style={{ color: "#ABA4AA" }}
                            >
                              {metric.title}
                            </span>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${status.color}`}
                          >
                            {status.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span
                            className="text-lg font-bold"
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
                              className="w-16 px-2 py-1 text-sm rounded border"
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
                              className="text-sm"
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
                          className="w-full bg-gray-700 rounded-full h-2 mt-2"
                          style={{ backgroundColor: "#606364" }}
                        >
                          <div
                            className="h-2 rounded-full transition-all duration-300"
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
          )}

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
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: "#4A5A70" }}
                >
                  <BarChart3 className="h-8 w-8" style={{ color: "#C3BCC2" }} />
                </div>
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ color: "#C3BCC2" }}
                >
                  No Analytics Data Available
                </h3>
                <p className="text-lg mb-4" style={{ color: "#ABA4AA" }}>
                  To see meaningful analytics, you need to:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ backgroundColor: "#10B981" }}
                    >
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: "#C3BCC2" }}>
                        Assign clients to programs
                      </p>
                      <p className="text-sm" style={{ color: "#ABA4AA" }}>
                        Create programs and assign them to your clients
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ backgroundColor: "#F59E0B" }}
                    >
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: "#C3BCC2" }}>
                        Assign workouts to clients
                      </p>
                      <p className="text-sm" style={{ color: "#ABA4AA" }}>
                        Create and assign workout templates to your clients
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ backgroundColor: "#8B5CF6" }}
                    >
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: "#C3BCC2" }}>
                        Track client progress
                      </p>
                      <p className="text-sm" style={{ color: "#ABA4AA" }}>
                        Have clients complete workouts and update their progress
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Metrics - Horizontal Scroll */}
          <div className="md:hidden mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              <div
                className="flex-shrink-0 w-24 rounded-lg border p-2"
                style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
              >
                <div className="text-center">
                  <div
                    className="text-lg font-bold"
                    style={{ color: "#C3BCC2" }}
                  >
                    {activeClients}
                  </div>
                  <div className="text-xs" style={{ color: "#ABA4AA" }}>
                    Clients
                  </div>
                </div>
              </div>
              <div
                className="flex-shrink-0 w-24 rounded-lg border p-2"
                style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
              >
                <div className="text-center">
                  <div
                    className="text-lg font-bold"
                    style={{ color: "#C3BCC2" }}
                  >
                    {formatPercentage(averageProgress)}
                  </div>
                  <div className="text-xs" style={{ color: "#ABA4AA" }}>
                    Progress
                  </div>
                </div>
              </div>
              <div
                className="flex-shrink-0 w-24 rounded-lg border p-2"
                style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
              >
                <div className="text-center">
                  <div
                    className="text-lg font-bold"
                    style={{ color: "#C3BCC2" }}
                  >
                    {formatPercentage(workoutCompletionRate)}
                  </div>
                  <div className="text-xs" style={{ color: "#ABA4AA" }}>
                    Completion
                  </div>
                </div>
              </div>
              <div
                className="flex-shrink-0 w-24 rounded-lg border p-2"
                style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
              >
                <div className="text-center">
                  <div
                    className="text-lg font-bold"
                    style={{ color: "#C3BCC2" }}
                  >
                    {formatPercentage(retentionRate)}
                  </div>
                  <div className="text-xs" style={{ color: "#ABA4AA" }}>
                    Retention
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Key Metrics Cards */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Active Clients */}
            <div
              className="rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div
                className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(135deg, #4A5A70 0%, #606364 100%)",
                }}
              />
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "#4A5A70" }}
                  >
                    <Users className="h-6 w-6" style={{ color: "#C3BCC2" }} />
                  </div>
                  {getTrendIcon(0)}
                </div>
                <div>
                  <p
                    className="text-sm font-medium mb-1"
                    style={{ color: "#ABA4AA" }}
                  >
                    Active Clients
                  </p>
                  <p
                    className="text-3xl font-bold mb-1"
                    style={{ color: "#C3BCC2" }}
                  >
                    {activeClients}
                  </p>
                  <p
                    className={`text-xs flex items-center gap-1 ${getTrendColor(
                      0
                    )}`}
                  >
                    Total: {activeClients} clients
                  </p>
                </div>
              </div>
            </div>

            {/* Average Progress */}
            <div
              className="rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div
                className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
                }}
              />
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "#10B981" }}
                  >
                    <TrendingUp
                      className="h-6 w-6"
                      style={{ color: "#C3BCC2" }}
                    />
                  </div>
                  {getTrendIcon(0)}
                </div>
                <div>
                  <p
                    className="text-sm font-medium mb-1"
                    style={{ color: "#ABA4AA" }}
                  >
                    Average Progress
                  </p>
                  <p
                    className="text-3xl font-bold mb-1"
                    style={{ color: "#C3BCC2" }}
                  >
                    {formatPercentage(averageProgress)}
                  </p>
                  <p
                    className={`text-xs flex items-center gap-1 ${getTrendColor(
                      0
                    )}`}
                  >
                    Client engagement rate
                  </p>
                </div>
              </div>
            </div>

            {/* Workout Completion Rate */}
            <div
              className="rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div
                className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
                }}
              />
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "#F59E0B" }}
                  >
                    <CheckCircle
                      className="h-6 w-6"
                      style={{ color: "#C3BCC2" }}
                    />
                  </div>
                  {getTrendIcon(0)}
                </div>
                <div>
                  <p
                    className="text-sm font-medium mb-1"
                    style={{ color: "#ABA4AA" }}
                  >
                    Workout Completion
                  </p>
                  <p
                    className="text-3xl font-bold mb-1"
                    style={{ color: "#C3BCC2" }}
                  >
                    {formatPercentage(workoutCompletionRate)}
                  </p>
                  <p
                    className={`text-xs flex items-center gap-1 ${getTrendColor(
                      0
                    )}`}
                  >
                    Overall completion rate
                  </p>
                </div>
              </div>
            </div>

            {/* Client Retention */}
            <div
              className="rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden group"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <div
                className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)",
                }}
              />
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "#8B5CF6" }}
                  >
                    <Star className="h-6 w-6" style={{ color: "#C3BCC2" }} />
                  </div>
                  {getTrendIcon(0)}
                </div>
                <div>
                  <p
                    className="text-sm font-medium mb-1"
                    style={{ color: "#ABA4AA" }}
                  >
                    Client Retention
                  </p>
                  <p
                    className="text-3xl font-bold mb-1"
                    style={{ color: "#C3BCC2" }}
                  >
                    {formatPercentage(retentionRate)}
                  </p>
                  <p
                    className={`text-xs flex items-center gap-1 ${getTrendColor(
                      0
                    )}`}
                  >
                    Active vs total clients
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Analytics Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Client Progress Chart */}
            <div
              className="rounded-2xl shadow-xl border p-6"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <h3
                className="text-xl font-bold mb-4 flex items-center gap-2"
                style={{ color: "#C3BCC2" }}
              >
                <CheckCircle className="h-5 w-5" style={{ color: "#4A5A70" }} />
                Client Progress Overview ({clientAnalytics.length} clients)
              </h3>
              {/* Summary Stats */}
              <div
                className="grid grid-cols-3 gap-4 mb-4 p-3 rounded-lg"
                style={{ backgroundColor: "#2A2F2F" }}
              >
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: "#C3BCC2" }}>
                    {
                      clientAnalytics.filter(
                        (c: any) => c.totalDrillsCompleted > 0
                      ).length
                    }
                  </p>
                  <p className="text-xs" style={{ color: "#ABA4AA" }}>
                    Clients with Activity
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: "#C3BCC2" }}>
                    {clientAnalytics.reduce(
                      (sum: number, c: any) => sum + c.totalDrillsCompleted,
                      0
                    )}
                  </p>
                  <p className="text-xs" style={{ color: "#ABA4AA" }}>
                    Total Drills Completed
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: "#C3BCC2" }}>
                    {clientAnalytics.length > 0
                      ? formatPercentage(
                          clientAnalytics.reduce(
                            (sum: number, c: any) =>
                              sum + c.averageCompletionRate,
                            0
                          ) / clientAnalytics.length
                        )
                      : "0%"}
                  </p>
                  <p className="text-xs" style={{ color: "#ABA4AA" }}>
                    Avg Completion Rate
                  </p>
                </div>
              </div>
              <div
                className="max-h-96 overflow-y-auto space-y-4 pr-2"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#606364 #2A2F2F",
                }}
              >
                {clientAnalytics.map((client: any) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: "#2A2F2F" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                        style={{ backgroundColor: "#4A5A70", color: "#C3BCC2" }}
                      >
                        {client.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: "#C3BCC2" }}>
                          {client.name || "Unknown Client"}
                        </p>
                        <p className="text-sm" style={{ color: "#ABA4AA" }}>
                          {client.totalDrillsCompleted} drills completed
                          {client.totalWorkoutsCompleted > 0 && (
                            <span className="ml-2">
                              • {client.totalWorkoutsCompleted} workouts
                            </span>
                          )}
                          {client.lastActivityDate && (
                            <span className="ml-2">
                              • Last active:{" "}
                              {new Date(
                                client.lastActivityDate
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className="font-bold text-lg"
                        style={{ color: "#C3BCC2" }}
                      >
                        {formatPercentage(client.averageCompletionRate)}
                      </p>
                      <p
                        className={`text-xs flex items-center gap-1 ${getTrendColor(
                          0
                        )}`}
                      >
                        {client.streakDays} day streak
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div
              className="rounded-2xl shadow-xl border p-6"
              style={{ backgroundColor: "#353A3A", borderColor: "#606364" }}
            >
              <h3
                className="text-xl font-bold mb-4 flex items-center gap-2"
                style={{ color: "#C3BCC2" }}
              >
                <Activity className="h-5 w-5" style={{ color: "#4A5A70" }} />
                Recent Activity (Last 30 Days)
              </h3>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.slice(0, 10).map((activity: any) => (
                    <div
                      key={activity.id}
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: "#2A2F2F" }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium" style={{ color: "#C3BCC2" }}>
                          {activity.clientName || "Unknown Client"}
                        </p>
                        <p className="text-sm" style={{ color: "#ABA4AA" }}>
                          {new Date(activity.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span style={{ color: "#ABA4AA" }}>
                          Completed: {activity.drill.title}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Activity
                      className="h-12 w-12 mx-auto mb-4"
                      style={{ color: "#606364" }}
                    />
                    <p style={{ color: "#ABA4AA" }}>No recent activity</p>
                    <p className="text-sm" style={{ color: "#606364" }}>
                      Client completions will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Sidebar>
    </ErrorBoundary>
  );
}
