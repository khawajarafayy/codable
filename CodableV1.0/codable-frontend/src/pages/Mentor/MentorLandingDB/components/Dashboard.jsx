import { useState, useEffect } from "react";
import {
  Users,
  BookOpen,
  ClipboardCheck,
  TrendingUp,
  Plus,
  Copy,
  AlertCircle,
  Loader,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const POLLING_INTERVAL = 30000; // 30 seconds
const API_BASE = "http://localhost:3000";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [summaryMetrics, setSummaryMetrics] = useState({
    activeClasses: 0,
    totalStudents: 0,
    pendingReviews: 0,
    avgPerformance: 0,
  });
  const [performanceData, setPerformanceData] = useState([]);

  // Get auth token
  const getToken = () => localStorage.getItem("token");

  // Fetch instructor's classes with proper error handling
  const fetchClasses = async (token) => {
    try {
      console.log("Fetching classes...");
      const response = await fetch(`${API_BASE}/api/classes/instructor`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch classes: ${response.status}`);
      }

      const data = await response.json();
      console.log("Classes data:", data);

      // Handle both { data: [...] } and [...] response formats
      const classesArray = data.data || data || [];
      setClasses(classesArray);
      return classesArray;
    } catch (err) {
      console.error("Error fetching classes:", err);
      throw err;
    }
  };

  // Fetch all assignments for instructor
  const fetchAssignments = async (token) => {
    try {
      console.log("Fetching assignments...");
      const response = await fetch(
        `${API_BASE}/api/classes/assignments/all`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch assignments: ${response.status}`);
      }

      const data = await response.json();
      console.log("Assignments data:", data);

      const assignmentsArray = data.data || data || [];
      setAssignments(assignmentsArray);
      return assignmentsArray;
    } catch (err) {
      console.error("Error fetching assignments:", err);
      return [];
    }
  };

  // Calculate summary metrics from fetched data
  const calculateMetrics = (classesData, assignmentsData) => {
    try {
      // Count total students across all classes
      let totalStudents = 0;
      classesData.forEach((cls) => {
        if (Array.isArray(cls.students)) {
          totalStudents += cls.students.length;
        }
      });

      // Count pending reviews (assignments with pending submissions)
      const pendingReviews = assignmentsData.filter((assign) => {
        // Assuming there are submissions that need review
        return assign.submissions > 0;
      }).length;

      // Calculate average performance from assignments
      let avgPerformance = 0;
      const assignmentsWithScores = assignmentsData.filter(
        (a) => a.averageScore !== undefined && a.averageScore > 0
      );
      if (assignmentsWithScores.length > 0) {
        avgPerformance = Math.round(
          assignmentsWithScores.reduce((sum, a) => sum + a.averageScore, 0) /
            assignmentsWithScores.length
        );
      }

      const metrics = {
        activeClasses: classesData.length,
        totalStudents: totalStudents,
        pendingReviews: pendingReviews,
        avgPerformance: avgPerformance,
      };

      console.log("Calculated metrics:", metrics);
      setSummaryMetrics(metrics);
      return metrics;
    } catch (err) {
      console.error("Error calculating metrics:", err);
    }
  };

  // Generate performance trends from assignment data
  const generatePerformanceTrends = (assignmentsData) => {
    try {
      // Create weekly data structure
      const weeklyData = Array(6)
        .fill(0)
        .map((_, i) => ({
          week: `Week ${i + 1}`,
          score: 0,
          count: 0,
        }));

      // Distribute assignment scores across weeks
      assignmentsData.forEach((assign) => {
        if (assign.averageScore > 0 && assign.lastSubmittedAt) {
          const submissionDate = new Date(assign.lastSubmittedAt);
          const weeks = Math.floor(
            (Date.now() - submissionDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
          );

          if (weeks >= 0 && weeks < 6) {
            const weekIndex = 5 - weeks;
            weeklyData[weekIndex].score += assign.averageScore;
            weeklyData[weekIndex].count += 1;
          }
        }
      });

      // Calculate averages
      const finalData = weeklyData.map((week) => ({
        ...week,
        score:
          week.count > 0 ? Math.round(week.score / week.count) : 0,
      }));

      console.log("Performance trends:", finalData);
      setPerformanceData(finalData);
      return finalData;
    } catch (err) {
      console.error("Error generating performance trends:", err);
      return [];
    }
  };

  // Main data fetch function
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log("Starting dashboard data fetch...");

      // Fetch classes and assignments in parallel
      const [classesData, assignmentsData] = await Promise.all([
        fetchClasses(token),
        fetchAssignments(token),
      ]);

      // Calculate metrics and trends
      calculateMetrics(classesData, assignmentsData);
      generatePerformanceTrends(assignmentsData);

      setLoading(false);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message || "Failed to load dashboard data");
      setLoading(false);
    }
  };

  // Initial load and polling setup
  useEffect(() => {
    fetchAllData();

    // Set up polling for real-time updates
    const interval = setInterval(fetchAllData, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Summary card configuration
  const summaryCards = [
    {
      title: "Active Classes",
      value: summaryMetrics.activeClasses.toString(),
      icon: BookOpen,
      bgGlow: "bg-blue-500/10",
      borderGlow: "border-blue-500/30",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-400",
    },
    {
      title: "Total Students",
      value: summaryMetrics.totalStudents.toString(),
      icon: Users,
      bgGlow: "bg-purple-500/10",
      borderGlow: "border-purple-500/30",
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-400",
    },
    {
      title: "Pending Reviews",
      value: summaryMetrics.pendingReviews.toString(),
      icon: ClipboardCheck,
      bgGlow: "bg-rose-500/10",
      borderGlow: "border-rose-500/30",
      iconBg: "bg-rose-500/20",
      iconColor: "text-rose-400",
    },
    {
      title: "Avg Performance",
      value: `${summaryMetrics.avgPerformance}%`,
      icon: TrendingUp,
      bgGlow: "bg-emerald-500/10",
      borderGlow: "border-emerald-500/30",
      iconBg: "bg-emerald-500/20",
      iconColor: "text-emerald-400",
    },
  ];

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-[#fdfdff]/60">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <div>
            <p className="text-rose-400 font-semibold">Error Loading Dashboard</p>
            <p className="text-[#fdfdff]/60 text-sm">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchAllData}
          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg border border-blue-500/30 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#fdfdff] mb-2">Dashboard</h1>
          <p className="text-[#fdfdff]/60">
            Welcome back! You have {summaryMetrics.totalStudents} active student{summaryMetrics.totalStudents !== 1 ? 's' : ''} across {summaryMetrics.activeClasses} class{summaryMetrics.activeClasses !== 1 ? 'es' : ''}.
          </p>
        </div>

        <button className="group relative px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-2xl border border-blue-500/30 transition-all duration-300 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          <span className="font-medium">Create New Class</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className={`p-6 rounded-2xl backdrop-blur-sm ${card.bgGlow} border ${card.borderGlow} hover:scale-105 transition-transform duration-300`}
            >
              <div className={`p-3 rounded-xl ${card.iconBg} w-fit mb-4`}>
                <Icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>

              <p className="text-[#fdfdff]/60 text-sm mb-1">{card.title}</p>
              <p className="text-3xl font-bold text-[#fdfdff]">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Performance Chart */}
      <div className="p-6 rounded-2xl backdrop-blur-sm bg-blue-500/10 border border-blue-500/30">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#fdfdff]">
            Performance Trends
          </h2>
          <span className="text-xs text-[#fdfdff]/40 bg-blue-500/10 px-3 py-1 rounded-full">
            Last 6 weeks (from assignments)
          </span>
        </div>

        <div className="h-80">
          {performanceData.some((week) => week.score > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                  opacity={0.3}
                />

                <XAxis dataKey="week" stroke="#fdfdff" opacity={0.6} />
                <YAxis stroke="#fdfdff" opacity={0.6} domain={[0, 100]} />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0A1428",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                    borderRadius: "12px",
                    color: "#fdfdff",
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#3b82f6" }}
                  activeDot={{ r: 7, fill: "#60a5fa" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-[#fdfdff]/40">
                No assignment data available yet. Create an assignment and have students submit it to see performance trends.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Classes */}
      <div>
        <h2 className="text-2xl font-semibold text-[#fdfdff] mb-6">
          Class Overview
        </h2>

        {classes.length > 0 ? (
          <div className="grid grid-cols-3 gap-6">
            {classes.map((cls) => {
              const studentCount = Array.isArray(cls.students)
                ? cls.students.length
                : cls.studentCount || 0;

              return (
                <div
                  key={cls._id}
                  className="p-6 rounded-2xl backdrop-blur-sm bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/15 transition-all duration-300"
                >
                  <h3 className="text-lg font-semibold text-[#fdfdff] mb-2">
                    {cls.className}
                  </h3>

                  <p className="text-[#fdfdff]/60 text-sm mb-4">
                    {studentCount} student{studentCount !== 1 ? 's' : ''}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-purple-500/20">
                    <code className="text-purple-400 font-semibold text-sm">
                      ID: {cls._id.substring(cls._id.length - 6).toUpperCase()}
                    </code>

                    <button
                      onClick={() =>
                        copyToClipboard(
                          `${window.location.origin}/join/${cls._id}`
                        )
                      }
                      className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-2xl backdrop-blur-sm bg-purple-500/10 border border-purple-500/30 text-center">
            <BookOpen className="w-12 h-12 text-purple-400/50 mx-auto mb-3" />
            <p className="text-[#fdfdff]/60">No classes created yet</p>
          </div>
        )}
      </div>

      {/* Assignments Section */}
      <div>
        <h2 className="text-2xl font-semibold text-[#fdfdff] mb-6">
          Recent Assignments
        </h2>

        {assignments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-[#fdfdff]/60 font-semibold">
                    Assignment
                  </th>
                  <th className="text-left py-3 px-4 text-[#fdfdff]/60 font-semibold">
                    Class
                  </th>
                  <th className="text-center py-3 px-4 text-[#fdfdff]/60 font-semibold">
                    Submissions
                  </th>
                  <th className="text-center py-3 px-4 text-[#fdfdff]/60 font-semibold">
                    Avg Score
                  </th>
                  <th className="text-left py-3 px-4 text-[#fdfdff]/60 font-semibold">
                    Last Submitted
                  </th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assign) => (
                  <tr
                    key={assign._id}
                    className="border-b border-slate-700/50 hover:bg-slate-700/10 transition-colors"
                  >
                    <td className="py-3 px-4 text-[#fdfdff]">
                      {assign.title || "Untitled Assignment"}
                    </td>
                    <td className="py-3 px-4 text-[#fdfdff]/80">
                      {assign.className || "Unknown"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold">
                        {assign.submissions || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          assign.averageScore >= 80
                            ? "bg-emerald-500/20 text-emerald-400"
                            : assign.averageScore >= 60
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-rose-500/20 text-rose-400"
                        }`}
                      >
                        {assign.averageScore ? `${assign.averageScore}%` : "N/A"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#fdfdff]/60 text-xs">
                      {assign.lastSubmittedAt
                        ? new Date(assign.lastSubmittedAt).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 rounded-2xl backdrop-blur-sm bg-blue-500/10 border border-blue-500/30 text-center">
            <ClipboardCheck className="w-12 h-12 text-blue-400/50 mx-auto mb-3" />
            <p className="text-[#fdfdff]/60">
              No assignments yet. Create an assignment to get started.
            </p>
          </div>
        )}
      </div>

      {/* Last Updated Info */}
      <div className="flex justify-end items-center gap-2 text-xs text-[#fdfdff]/40">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        <span>Data updates every {POLLING_INTERVAL / 1000} seconds</span>
      </div>
    </div>
  );
}
