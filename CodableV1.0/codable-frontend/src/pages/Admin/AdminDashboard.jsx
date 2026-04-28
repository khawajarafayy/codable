import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  GraduationCap,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  AlertCircle,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { api } from "../../services/apiClient";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.getAdminMetrics()
      .then((res) => {
        if (mounted && res?.success) setData(res.data);
      })
      .catch((err) => console.warn("Failed to load admin metrics", err))
      .finally(() => mounted && setLoading(false));

    return () => (mounted = false);
  }, []);

  // Fallback to safe defaults when data not yet loaded
  const kpiData = (data?.kpiData)
    ? [
        { title: "Total Students", value: String(data.kpiData.totalStudents || 0), change: "", trend: "up", icon: Users, color: "blue" },
        { title: "Active Students", value: String(data.kpiData.activeStudents || 0), subtitle: "This week", change: "", trend: "up", icon: UserCheck, color: "emerald" },
        { title: "Total Instructors", value: String(data.kpiData.totalInstructors || 0), change: "", trend: "up", icon: GraduationCap, color: "purple" },
        { title: "Active Instructors", value: String(data.kpiData.activityLast7Days || 0), change: "", trend: "up", icon: GraduationCap, color: "violet" },
        { title: "Total Classes", value: String(data.kpiData.totalClasses || 0), change: "", trend: "up", icon: BookOpen, color: "indigo" },
        { title: "New Users", subtitle: "This month", value: String(data.kpiData.newUsersThisMonth || 0), change: "", trend: "up", icon: TrendingUp, color: "cyan" },
      ]
    : [];

  const learningModuleData = data?.learningModuleData || { coursesStarted: 0, coursesCompleted: 0, avgProgress: 0, dropOffRate: 0, avgTimePerStudent: '0h' };
  const classroomModuleData = data?.classroomModuleData || { enrolled: 0, notEnrolled: 0, assignmentCompletionRate: 0, avgAssignmentsPerStudent: 0, pendingRequests: 0 };
  const difficultTopics = data?.difficultTopics || [];
  const topInstructors = data?.topInstructors || [];
  const instructorStats = data?.instructorStats || { withClasses: 0, withoutClasses: 0, avgStudentsPerInstructor: 0, pendingApprovals: 0, activityLast7Days: 0 };
  const associationMetrics = data?.associationMetrics || { totalAssociated: 0, instructorCoverage: 0, minStudentsPerInstructor: 0, avgStudentsPerInstructor: 0, maxStudentsPerInstructor: 0 };
  const studentsPerInstructorData = data?.studentsPerInstructorData || [];
  const enrollmentDistribution = data?.enrollmentDistribution || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#fdfdff] mb-1">Analytics Overview</h1>
        <p className="text-sm text-[#fdfdff]/50">Platform insights and key metrics</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-3 gap-4">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          const isPositive = kpi.trend === "up";

          return (
            <div
              key={kpi.title}
              className="group relative p-5 rounded-xl bg-[#0F1419] border border-white/5 hover:border-white/10 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-lg bg-${kpi.color}-500/10`}>
                  <Icon className={`w-5 h-5 text-${kpi.color}-400`} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                  {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span>{kpi.change}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-[#fdfdff]/40 mb-1">
                  {kpi.title}
                  {kpi.subtitle && <span className="ml-1">· {kpi.subtitle}</span>}
                </p>
                <p className="text-2xl font-bold text-[#fdfdff]">{kpi.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Student Insights Section */}
      <div>
        <h2 className="text-lg font-semibold text-[#fdfdff] mb-4">Student Insights</h2>
        <div className="grid grid-cols-2 gap-4">
          {/* Learning Module Metrics */}
          <div className="p-5 rounded-xl bg-[#0F1419] border border-white/5">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <BookOpen className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="text-sm font-semibold text-[#fdfdff]">Learning Module Metrics</h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <p className="text-xs text-[#fdfdff]/40 mb-1">Courses Started</p>
                  <p className="text-xl font-bold text-[#fdfdff]">{learningModuleData.coursesStarted.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-xs text-[#fdfdff]/40 mb-1">Completed</p>
                  <p className="text-xl font-bold text-emerald-400">{learningModuleData.coursesCompleted.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-[#fdfdff]/40 mb-1">Avg Progress</p>
                  <p className="text-lg font-bold text-blue-400">{learningModuleData.avgProgress}%</p>
                </div>
                <div>
                  <p className="text-xs text-[#fdfdff]/40 mb-1">Drop-off Rate</p>
                  <p className="text-lg font-bold text-rose-400">{learningModuleData.dropOffRate}%</p>
                </div>
                <div>
                  <p className="text-xs text-[#fdfdff]/40 mb-1">Avg Time</p>
                  <p className="text-lg font-bold text-[#fdfdff]">{learningModuleData.avgTimePerStudent}</p>
                </div>
              </div>

              {/* Difficult Topics */}
              <div className="pt-3 border-t border-white/5">
                <p className="text-xs text-[#fdfdff]/40 mb-3 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Most Difficult Topics (AI-detected)
                </p>
                <div className="space-y-2">
                  {difficultTopics.slice(0, 3).map((topic) => (
                    <div key={topic.topic}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[#fdfdff]/60">{topic.topic}</span>
                        <span className="text-rose-400 font-medium">{topic.difficulty}%</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full"
                          style={{ width: `${topic.difficulty}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Classroom Module Metrics */}
          <div className="p-5 rounded-xl bg-[#0F1419] border border-white/5">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="text-sm font-semibold text-[#fdfdff]">Classroom Module Metrics</h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                  <p className="text-xs text-[#fdfdff]/40 mb-1">Enrolled</p>
                  <p className="text-xl font-bold text-purple-400">{classroomModuleData.enrolled.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                  <p className="text-xs text-[#fdfdff]/40 mb-1">Not Enrolled</p>
                  <p className="text-xl font-bold text-yellow-400">{classroomModuleData.notEnrolled.toLocaleString()}</p>
                </div>
              </div>

              {/* Enrollment Pie Chart */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={enrollmentDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {enrollmentDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0F1419",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-[#fdfdff]/40 mb-1">Assignment Rate</p>
                  <p className="text-lg font-bold text-emerald-400">{classroomModuleData.assignmentCompletionRate}%</p>
                </div>
                <div>
                  <p className="text-xs text-[#fdfdff]/40 mb-1">Pending Requests</p>
                  <p className="text-lg font-bold text-yellow-400">{classroomModuleData.pendingRequests}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructor Insights */}
      <div>
        <h2 className="text-lg font-semibold text-[#fdfdff] mb-4">Instructor Insights</h2>
        <div className="grid grid-cols-2 gap-4">
          {/* Top Instructors */}
          <div className="p-5 rounded-xl bg-[#0F1419] border border-white/5">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-sm font-semibold text-[#fdfdff]">Top 5 Instructors by Student Count</h3>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topInstructors} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" stroke="#fdfdff" opacity={0.3} fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="#fdfdff" opacity={0.5} fontSize={11} width={120} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0F1419",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="students" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Instructor Stats */}
          <div className="p-5 rounded-xl bg-[#0F1419] border border-white/5">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-lg bg-indigo-500/10">
                <GraduationCap className="w-4 h-4 text-indigo-400" />
              </div>
              <h3 className="text-sm font-semibold text-[#fdfdff]">Instructor Overview</h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-xs text-[#fdfdff]/40 mb-1">With Classes</p>
                  <p className="text-2xl font-bold text-emerald-400">{instructorStats.withClasses}</p>
                </div>
                <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/10">
                  <p className="text-xs text-[#fdfdff]/40 mb-1">Without Classes</p>
                  <p className="text-2xl font-bold text-rose-400">{instructorStats.withoutClasses}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <p className="text-xs text-[#fdfdff]/40 mb-1">Avg Students</p>
                  <p className="text-xl font-bold text-blue-400">{instructorStats.avgStudentsPerInstructor}</p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                  <p className="text-xs text-[#fdfdff]/40 mb-1">Pending Approvals</p>
                  <p className="text-xl font-bold text-yellow-400">{instructorStats.pendingApprovals}</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#fdfdff]/40 mb-1">Active Last 7 Days</p>
                    <p className="text-xl font-bold text-purple-400">{instructorStats.activityLast7Days}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-purple-500/10">
                    <Clock className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Association Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-[#fdfdff] mb-4">Association Metrics</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-[#0F1419] border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <Target className="w-4 h-4 text-cyan-400" />
              </div>
              <h3 className="text-sm font-semibold text-[#fdfdff]">Total Associated</h3>
            </div>
            <p className="text-3xl font-bold text-[#fdfdff] mb-1">{associationMetrics.totalAssociated}</p>
            <p className="text-xs text-[#fdfdff]/40">Students with instructors</p>
          </div>

          <div className="p-5 rounded-xl bg-[#0F1419] border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-sm font-semibold text-[#fdfdff]">Instructor Coverage</h3>
            </div>
            <p className="text-3xl font-bold text-emerald-400 mb-1">{associationMetrics.instructorCoverage}%</p>
            <p className="text-xs text-[#fdfdff]/40">Instructors with students</p>
          </div>

          <div className="p-5 rounded-xl bg-[#0F1419] border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-indigo-500/10">
                <Users className="w-4 h-4 text-indigo-400" />
              </div>
              <h3 className="text-sm font-semibold text-[#fdfdff]">Students/Instructor</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-bold text-[#fdfdff]">{associationMetrics.minStudentsPerInstructor}</p>
              <span className="text-xs text-[#fdfdff]/40">min</span>
              <p className="text-xl font-bold text-indigo-400">{associationMetrics.avgStudentsPerInstructor}</p>
              <span className="text-xs text-[#fdfdff]/40">avg</span>
              <p className="text-xl font-bold text-[#fdfdff]">{associationMetrics.maxStudentsPerInstructor}</p>
              <span className="text-xs text-[#fdfdff]/40">max</span>
            </div>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="mt-4 p-5 rounded-xl bg-[#0F1419] border border-white/5">
          <h3 className="text-sm font-semibold text-[#fdfdff] mb-4">Students per Instructor Distribution</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studentsPerInstructorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="range" stroke="#fdfdff" opacity={0.5} fontSize={11} />
                <YAxis stroke="#fdfdff" opacity={0.3} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F1419",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
