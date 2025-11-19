"use client";

import { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import { format } from "date-fns";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Calendar,
  Zap,
  Star,
  Gauge,
  LineChart,
  BarChart,
  PieChart,
  Plus,
  Save,
  X,
} from "lucide-react";

interface ClientProgressCardProps {
  clientId: string;
  clientName: string;
  timeRange?: "4" | "6" | "8" | "all";
}

export default function ClientProgressCard({
  clientId,
  clientName,
  timeRange = "4",
}: ClientProgressCardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "4" | "6" | "8" | "all"
  >(timeRange);

  // Form state for adding new progress entries
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    skill: "speed",
    value: "",
    date: format(new Date(), "yyyy-MM-dd"),
  });

  // Fetch client data for pitching metrics
  const { data: client, isLoading: clientLoading } =
    trpc.clients.getById.useQuery({
      id: clientId,
    });

  // Fetch progress data using existing schema
  const { data: progressData, isLoading } =
    trpc.progress.getProgressData.useQuery({
      clientId,
      timeRange: selectedTimeRange,
    });

  const { data: insights } = trpc.progress.getProgressInsights.useQuery({
    clientId,
    timeRange: selectedTimeRange,
  });

  const { data: workoutHistory } = trpc.progress.getWorkoutHistory.useQuery({
    clientId,
    timeRange: selectedTimeRange,
  });

  // Get real historical data from progress entries
  const { data: historicalData } = trpc.progress.getHistoricalData.useQuery({
    clientId,
    timeRange: selectedTimeRange,
  });

  // Mutation for adding new progress entries
  const addProgressMutation = trpc.progress.updateProgress.useMutation({
    onSuccess: data => {
      console.log("Progress added successfully:", data);
      alert("Progress entry added successfully!");
      // Refetch data to update the charts
      window.location.reload(); // Simple refresh for now
      setShowAddForm(false);
      setNewEntry({
        skill: "speed",
        value: "",
        date: format(new Date(), "yyyy-MM-dd"),
      });
    },
    onError: error => {
      console.error("Error adding progress:", error);
      alert("Error adding progress: " + error.message);
    },
  });

  if (isLoading || clientLoading) {
    return (
      <div
        className="rounded-2xl shadow-xl border p-6"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
      >
        <div className="animate-pulse">
          <div className="h-4 bg-gray-600 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-600 rounded"></div>
            <div className="h-4 bg-gray-600 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div
        className="rounded-2xl shadow-xl border p-6"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
      >
        <div className="text-center py-8">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Client Not Found
          </h3>
          <p className="text-gray-300">Unable to load client information.</p>
        </div>
      </div>
    );
  }

  // Process real data for visualization
  const processHistoricalData = (data: any[], metric: string) => {
    if (!data || data.length === 0) return [];

    return data
      .filter(entry => entry.skill === metric)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(entry => ({
        date: format(new Date(entry.date), "MMM dd"),
        value: entry.progress,
        fullDate: new Date(entry.date),
        id: entry.id,
      }));
  };

  const speedData = processHistoricalData(historicalData || [], "speed");
  const dropSpinData = processHistoricalData(historicalData || [], "dropSpin");
  const changeupSpinData = processHistoricalData(
    historicalData || [],
    "changeupSpin"
  );
  const riseSpinData = processHistoricalData(historicalData || [], "riseSpin");
  const curveSpinData = processHistoricalData(
    historicalData || [],
    "curveSpin"
  );

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous)
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (current < previous)
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return "text-green-600";
    if (current < previous) return "text-red-600";
    return "text-gray-600";
  };

  const getChangePercentage = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const handleAddProgress = () => {
    if (!newEntry.value || !newEntry.date) return;

    console.log("Submitting progress:", {
      clientId,
      skill: newEntry.skill,
      progress: parseFloat(newEntry.value),
      date: newEntry.date,
    });

    // Ensure we have a valid client ID
    if (!clientId) {
      alert("Error: No client ID found");
      return;
    }

    addProgressMutation.mutate({
      clientId,
      workoutId: "manual-entry", // We'll use a placeholder for manual entries
      progress: Math.round(parseFloat(newEntry.value)), // Round to integer for database
      notes: `Manual entry for ${newEntry.skill}`,
      skill: newEntry.skill,
      date: newEntry.date,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="rounded-2xl shadow-xl border p-6"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Pitching Progress</h2>
            <p className="text-gray-300">
              Track {clientName}'s pitching development
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-opacity-80"
              style={{ backgroundColor: "#4A5A70" }}
            >
              <Plus className="h-4 w-4" />
              Add Progress
            </button>
            <Gauge className="h-6 w-6 text-blue-400" />
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm font-medium text-gray-300">
            Time Period:
          </span>
          {["4", "6", "8", "all"].map(period => (
            <button
              key={period}
              onClick={() =>
                setSelectedTimeRange(period as "4" | "6" | "8" | "all")
              }
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedTimeRange === period
                  ? "text-white"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              style={{
                backgroundColor:
                  selectedTimeRange === period ? "#4A5A70" : "transparent",
              }}
            >
              {period === "all" ? "All Time" : `${period} weeks`}
            </button>
          ))}
        </div>

        {/* Add Progress Form */}
        {showAddForm && (
          <div
            className="rounded-lg p-4 mb-6"
            style={{ backgroundColor: "#2A2F2F" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Add Progress Entry
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-1 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Metric
                </label>
                <select
                  value={newEntry.skill}
                  onChange={e =>
                    setNewEntry({ ...newEntry, skill: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg text-sm bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="speed">Speed (mph)</option>
                  <option value="dropSpin">Drop Spin (rpm)</option>
                  <option value="changeupSpin">Changeup Spin (rpm)</option>
                  <option value="riseSpin">Rise Spin (rpm)</option>
                  <option value="curveSpin">Curve Spin (rpm)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Value
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newEntry.value}
                  onChange={e =>
                    setNewEntry({ ...newEntry, value: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg text-sm bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="Enter value"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={newEntry.date}
                  onChange={e =>
                    setNewEntry({ ...newEntry, date: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg text-sm bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleAddProgress}
                  disabled={
                    !newEntry.value ||
                    !newEntry.date ||
                    addProgressMutation.isPending
                  }
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#10B981" }}
                >
                  {addProgressMutation.isPending ? (
                    <Activity className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {addProgressMutation.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Current Metrics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div
            className="rounded-lg p-4"
            style={{ backgroundColor: "#2A2F2F" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-400">
                  Average Speed
                </p>
                <p className="text-2xl font-bold text-white">
                  {client.averageSpeed || 0} mph
                </p>
              </div>
              <Zap className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div
            className="rounded-lg p-4"
            style={{ backgroundColor: "#2A2F2F" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-400">Top Speed</p>
                <p className="text-2xl font-bold text-white">
                  {client.topSpeed || 0} mph
                </p>
              </div>
              <Target className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div
            className="rounded-lg p-4"
            style={{ backgroundColor: "#2A2F2F" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-400">Drop Spin</p>
                <p className="text-2xl font-bold text-white">
                  {client.dropSpinRate || 0} rpm
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-400" />
            </div>
          </div>

          <div
            className="rounded-lg p-4"
            style={{ backgroundColor: "#2A2F2F" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-400">Rise Spin</p>
                <p className="text-2xl font-bold text-white">
                  {client.riseSpinRate || 0} rpm
                </p>
              </div>
              <Star className="h-8 w-8 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Speed Progress Chart */}
      <div
        className="rounded-2xl shadow-xl border p-6"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Speed Progress</h3>
          <div className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-blue-400" />
            <span className="text-sm text-gray-300">
              Average Speed Over Time
            </span>
          </div>
        </div>

        {/* Line Graph */}
        <div className="h-64 relative">
          {speedData.length > 0 ? (
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="overflow-visible"
            >
              {/* Grid lines */}
              <defs>
                <pattern
                  id="grid"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="#606364"
                    strokeWidth="0.5"
                    opacity="0.3"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Line path - simplified approach */}
              {speedData.length > 1 &&
                (() => {
                  const maxValue = Math.max(...speedData.map(d => d.value));
                  const minValue = Math.min(...speedData.map(d => d.value));
                  const range = maxValue - minValue || 1;

                  const pathData = speedData
                    .map((point, index) => {
                      const x = (index / (speedData.length - 1)) * 100;
                      const y = 100 - ((point.value - minValue) / range) * 80;
                      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
                    })
                    .join(" ");

                  return (
                    <path
                      d={pathData}
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="1"
                    />
                  );
                })()}

              {/* Fallback: Simple line for 2 points */}
              {speedData.length === 2 &&
                (() => {
                  const maxValue = Math.max(...speedData.map(d => d.value));
                  const minValue = Math.min(...speedData.map(d => d.value));
                  const range = maxValue - minValue || 1;

                  const y1 =
                    100 - ((speedData[0].value - minValue) / range) * 80;
                  const y2 =
                    100 - ((speedData[1].value - minValue) / range) * 80;

                  return (
                    <line
                      x1="10"
                      y1={y1}
                      x2="90"
                      y2={y2}
                      stroke="#3B82F6"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  );
                })()}

              {/* Gradient fill temporarily disabled - was causing weird triangular shape */}

              {/* Data points */}
              {speedData.map((point, index) => {
                const x = (index / (speedData.length - 1)) * 100;
                const maxValue = Math.max(...speedData.map(d => d.value));
                const minValue = Math.min(...speedData.map(d => d.value));
                const range = maxValue - minValue || 1;
                const y = 100 - ((point.value - minValue) / range) * 80;
                return (
                  <g key={point.id || index}>
                    <circle
                      cx={x}
                      cy={y}
                      r="5"
                      fill="#3B82F6"
                      stroke="#1E40AF"
                      strokeWidth="2"
                      className="hover:r-7 transition-all duration-200 cursor-pointer"
                    />
                    <text
                      x={x}
                      y={y - 15}
                      textAnchor="middle"
                      className="text-xs fill-white font-medium"
                      style={{ fontSize: "10px" }}
                    >
                      {point.value}
                    </text>
                    <text
                      x={x}
                      y={y + 20}
                      textAnchor="middle"
                      className="text-xs fill-gray-400"
                      style={{ fontSize: "9px" }}
                    >
                      {point.date}
                    </text>
                  </g>
                );
              })}
            </svg>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No speed data available</p>
                <p className="text-sm text-gray-500 mt-1">
                  Speed progress will appear here once data is recorded
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-300">
          <span>Start: {speedData[0]?.value} mph</span>
          <span>Current: {speedData[speedData.length - 1]?.value} mph</span>
          <span className="flex items-center gap-1">
            {getTrendIcon(
              speedData[speedData.length - 1]?.value || 0,
              speedData[0]?.value || 0
            )}
            {getChangePercentage(
              speedData[speedData.length - 1]?.value || 0,
              speedData[0]?.value || 0
            )}
            %
          </span>
        </div>
      </div>

      {/* Spin Rates Comparison */}
      <div
        className="rounded-2xl shadow-xl border p-6"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
      >
        <h3 className="text-lg font-semibold text-white mb-4">
          Spin Rates Comparison
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Drop Spin Chart */}
          <div>
            <h4 className="text-md font-medium text-gray-300 mb-3">
              Drop Spin Rate
            </h4>
            <div className="h-48 relative">
              {dropSpinData.length > 0 ? (
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="overflow-visible"
                >
                  <defs>
                    <pattern
                      id="grid-drop"
                      width="40"
                      height="40"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 40 0 L 0 0 0 40"
                        fill="none"
                        stroke="#606364"
                        strokeWidth="0.5"
                        opacity="0.3"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid-drop)" />

                  {dropSpinData.length > 1 && (
                    <path
                      d={dropSpinData
                        .map((point, index) => {
                          const x = (index / (dropSpinData.length - 1)) * 100;
                          const maxValue = Math.max(
                            ...dropSpinData.map(d => d.value)
                          );
                          const minValue = Math.min(
                            ...dropSpinData.map(d => d.value)
                          );
                          const range = maxValue - minValue || 1;
                          const y =
                            100 - ((point.value - minValue) / range) * 80;
                          return `${index === 0 ? "M" : "L"} ${x} ${y}`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke="#A855F7"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.9"
                    />
                  )}

                  {dropSpinData.map((point, index) => {
                    const x = (index / (dropSpinData.length - 1)) * 100;
                    const maxValue = Math.max(
                      ...dropSpinData.map(d => d.value)
                    );
                    const minValue = Math.min(
                      ...dropSpinData.map(d => d.value)
                    );
                    const range = maxValue - minValue || 1;
                    const y = 100 - ((point.value - minValue) / range) * 80;
                    return (
                      <g key={point.id || index}>
                        <circle
                          cx={x}
                          cy={y}
                          r="4"
                          fill="#A855F7"
                          stroke="#7C3AED"
                          strokeWidth="2"
                          className="hover:r-6 transition-all duration-200 cursor-pointer"
                        />
                        <text
                          x={x}
                          y={y - 12}
                          textAnchor="middle"
                          className="text-xs fill-white font-medium"
                          style={{ fontSize: "9px" }}
                        >
                          {point.value}
                        </text>
                        <text
                          x={x}
                          y={y + 18}
                          textAnchor="middle"
                          className="text-xs fill-gray-400"
                          style={{ fontSize: "8px" }}
                        >
                          {point.date}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No drop spin data</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rise Spin Chart */}
          <div>
            <h4 className="text-md font-medium text-gray-300 mb-3">
              Rise Spin Rate
            </h4>
            <div className="h-48 relative">
              {riseSpinData.length > 0 ? (
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="overflow-visible"
                >
                  <defs>
                    <pattern
                      id="grid-rise"
                      width="40"
                      height="40"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 40 0 L 0 0 0 40"
                        fill="none"
                        stroke="#606364"
                        strokeWidth="0.5"
                        opacity="0.3"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid-rise)" />

                  {riseSpinData.length > 1 && (
                    <path
                      d={riseSpinData
                        .map((point, index) => {
                          const x = (index / (riseSpinData.length - 1)) * 100;
                          const maxValue = Math.max(
                            ...riseSpinData.map(d => d.value)
                          );
                          const minValue = Math.min(
                            ...riseSpinData.map(d => d.value)
                          );
                          const range = maxValue - minValue || 1;
                          const y =
                            100 - ((point.value - minValue) / range) * 80;
                          return `${index === 0 ? "M" : "L"} ${x} ${y}`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke="#F97316"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.9"
                    />
                  )}

                  {riseSpinData.map((point, index) => {
                    const x = (index / (riseSpinData.length - 1)) * 100;
                    const maxValue = Math.max(
                      ...riseSpinData.map(d => d.value)
                    );
                    const minValue = Math.min(
                      ...riseSpinData.map(d => d.value)
                    );
                    const range = maxValue - minValue || 1;
                    const y = 100 - ((point.value - minValue) / range) * 80;
                    return (
                      <g key={point.id || index}>
                        <circle
                          cx={x}
                          cy={y}
                          r="4"
                          fill="#F97316"
                          stroke="#EA580C"
                          strokeWidth="2"
                          className="hover:r-6 transition-all duration-200 cursor-pointer"
                        />
                        <text
                          x={x}
                          y={y - 12}
                          textAnchor="middle"
                          className="text-xs fill-white font-medium"
                          style={{ fontSize: "9px" }}
                        >
                          {point.value}
                        </text>
                        <text
                          x={x}
                          y={y + 18}
                          textAnchor="middle"
                          className="text-xs fill-gray-400"
                          style={{ fontSize: "8px" }}
                        >
                          {point.date}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No rise spin data</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* All Spin Rates Overview */}
      <div
        className="rounded-2xl shadow-xl border p-6"
        style={{
          backgroundColor: "#353A3A",
          borderColor: "#606364",
        }}
      >
        <h3 className="text-lg font-semibold text-white mb-4">
          Current Spin Rates
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Drop", value: client.dropSpinRate || 0, color: "purple" },
            {
              name: "Changeup",
              value: client.changeupSpinRate || 0,
              color: "blue",
            },
            { name: "Rise", value: client.riseSpinRate || 0, color: "orange" },
            { name: "Curve", value: client.curveSpinRate || 0, color: "green" },
          ].map((spin, index) => (
            <div key={index} className="text-center">
              <div
                className="rounded-lg p-4"
                style={{ backgroundColor: "#2A2F2F" }}
              >
                <div className="text-2xl font-bold text-white mb-1">
                  {spin.value}
                </div>
                <div className="text-sm font-medium text-gray-300">
                  {spin.name} Spin
                </div>
                <div className="text-xs text-gray-400">rpm</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Insights */}
      {insights && insights.insights && insights.insights.length > 0 && (
        <div
          className="rounded-2xl shadow-xl border p-6"
          style={{
            backgroundColor: "#353A3A",
            borderColor: "#606364",
          }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Progress Insights
          </h3>
          <div className="space-y-3">
            {insights.insights
              .slice(0, 3)
              .map((insight: any, index: number) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    insight.type === "positive"
                      ? "border-green-500"
                      : insight.type === "warning"
                      ? "border-yellow-500"
                      : "border-blue-500"
                  }`}
                  style={{ backgroundColor: "#2A2F2F" }}
                >
                  <div className="flex items-start gap-3">
                    {insight.type === "positive" ? (
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                    ) : insight.type === "warning" ? (
                      <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                    ) : (
                      <Activity className="h-5 w-5 text-blue-400 mt-0.5" />
                    )}
                    <div>
                      <h4 className="font-medium text-white">
                        {insight.title}
                      </h4>
                      <p className="text-sm text-gray-300 mt-1">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {workoutHistory && workoutHistory.length > 0 && (
        <div
          className="rounded-2xl shadow-xl border p-6"
          style={{
            backgroundColor: "#353A3A",
            borderColor: "#606364",
          }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {workoutHistory.slice(0, 5).map((workout: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: "#2A2F2F" }}
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-white">{workout.title}</p>
                    <p className="text-sm text-gray-300">
                      {format(new Date(workout.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  {workout.completed ? "Completed" : "Pending"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
