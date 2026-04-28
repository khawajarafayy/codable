import { useState, useEffect } from "react";
import {
  Users,
  BookOpen,
  GraduationCap,
  Filter,
  Search,
  ChevronDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
  Mail,
  Calendar,
} from "lucide-react";
import { api } from "../../services/apiClient";

export default function AdminStudents() {
  const [activeTab, setActiveTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [enrollmentFilter, setEnrollmentFilter] = useState("all");
  const [atRiskFilter, setAtRiskFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    let mounted = true;
    api.getAdminStudents()
      .then(res => {
        if (mounted && res?.success) setStudents(res.data || []);
      })
      .catch(err => console.warn("Failed to load students", err))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  const filteredStudents = students.filter((student) => {
    if (statusFilter !== "all" && student.status !== statusFilter) return false;
    if (enrollmentFilter === "enrolled" && student.enrolledClasses === 0) return false;
    if (enrollmentFilter === "not-enrolled" && student.enrolledClasses > 0) return false;
    if (atRiskFilter && !student.isAtRisk) return false;
    if (searchQuery && !student.name.toLowerCase().includes(searchQuery.toLowerCase()) && !student.email.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    if (activeTab === "learning" && student.coursesCompleted === 0) return false;
    if (activeTab === "classroom" && student.enrolledClasses === 0) return false;

    return true;
  });

  const tabs = [
    { id: "all", label: "All Students", count: students.length, icon: Users },
    {
      id: "learning",
      label: "Learning Module",
      count: students.filter((s) => s.coursesCompleted > 0).length,
      icon: BookOpen,
    },
    {
      id: "classroom",
      label: "Classroom Module",
      count: students.filter((s) => s.enrolledClasses > 0).length,
      icon: GraduationCap,
    },
  ];

  const getProgressColor = (progress) => {
    if (progress >= 80) return "text-emerald-400";
    if (progress >= 60) return "text-blue-400";
    if (progress >= 40) return "text-yellow-400";
    return "text-rose-400";
  };

  const getProgressBg = (progress) => {
    if (progress >= 80) return "from-emerald-500 to-emerald-400";
    if (progress >= 60) return "from-blue-500 to-blue-400";
    if (progress >= 40) return "from-yellow-500 to-yellow-400";
    return "from-rose-500 to-rose-400";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#fdfdff] mb-1">Students Management</h1>
          <p className="text-sm text-[#fdfdff]/50">Manage and monitor student activity and progress</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-sm text-[#fdfdff]/60">Loading students...</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-[#0F1419] border border-white/5 rounded-lg w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-md transition-all duration-200
                ${
                  activeTab === tab.id
                    ? "bg-blue-500/10 text-blue-400 shadow-sm"
                    : "text-[#fdfdff]/60 hover:text-[#fdfdff] hover:bg-white/5"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
              <span
                className={`
                  px-2 py-0.5 rounded text-xs font-semibold
                  ${activeTab === tab.id ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-[#fdfdff]/40"}
                `}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fdfdff]/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#0F1419] border border-white/10 rounded-lg text-sm text-[#fdfdff] placeholder:text-[#fdfdff]/30 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-[#0F1419] border border-white/10 rounded-lg text-sm text-[#fdfdff] focus:outline-none focus:border-blue-500/50 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fdfdff]/40 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={enrollmentFilter}
              onChange={(e) => setEnrollmentFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-[#0F1419] border border-white/10 rounded-lg text-sm text-[#fdfdff] focus:outline-none focus:border-blue-500/50 cursor-pointer"
            >
              <option value="all">All Enrollment</option>
              <option value="enrolled">Enrolled</option>
              <option value="not-enrolled">Not Enrolled</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fdfdff]/40 pointer-events-none" />
          </div>

          <button
            onClick={() => setAtRiskFilter(!atRiskFilter)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200
              ${
                atRiskFilter
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                  : "bg-[#0F1419] border-white/10 text-[#fdfdff]/60 hover:text-[#fdfdff]"
              }
            `}
          >
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">At Risk</span>
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="rounded-xl bg-[#0F1419] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-4 text-xs font-semibold text-[#fdfdff]/40 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-[#fdfdff]/40 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-[#fdfdff]/40 uppercase tracking-wider">
                  Learning Progress
                </th>
                <th className="text-center px-5 py-4 text-xs font-semibold text-[#fdfdff]/40 uppercase tracking-wider">
                  Courses
                </th>
                <th className="text-center px-5 py-4 text-xs font-semibold text-[#fdfdff]/40 uppercase tracking-wider">
                  Classes
                </th>
                <th className="text-center px-5 py-4 text-xs font-semibold text-[#fdfdff]/40 uppercase tracking-wider">
                  Assignments
                </th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-[#fdfdff]/40 uppercase tracking-wider">
                  Last Active
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className="hover:bg-white/5 transition-colors duration-150 cursor-pointer"
                >
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-[#fdfdff] flex items-center gap-2">
                        {student.name}
                        {student.isAtRisk && (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            At Risk
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-[#fdfdff]/40 mt-0.5">{student.email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${student.status === "active" ? "bg-emerald-400" : "bg-gray-500"}`}
                      />
                      <span
                        className={`text-sm capitalize ${student.status === "active" ? "text-emerald-400" : "text-gray-400"}`}
                      >
                        {student.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${getProgressBg(student.learningProgress)} rounded-full`}
                          style={{ width: `${student.learningProgress}%` }}
                        />
                      </div>
                      <span className={`text-sm font-semibold ${getProgressColor(student.learningProgress)} min-w-[45px] text-right`}>
                        {student.learningProgress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-sm font-medium text-[#fdfdff]">{student.coursesCompleted}</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-sm font-medium text-[#fdfdff]">{student.enrolledClasses}</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-sm font-medium text-[#fdfdff]">{student.assignmentsCompleted}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-[#fdfdff]/60">{student.lastActive}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-white/5 mb-4">
              <Users className="w-8 h-8 text-[#fdfdff]/20" />
            </div>
            <p className="text-sm font-medium text-[#fdfdff]/60 mb-1">No students found</p>
            <p className="text-xs text-[#fdfdff]/40">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Student Detail Drawer */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedStudent(null)} />
          <div className="relative w-full max-w-2xl h-full bg-[#0A0D14] border-l border-white/5 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-white/5 sticky top-0 bg-[#0A0D14] z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#fdfdff] mb-1">{selectedStudent.name}</h2>
                  <p className="text-sm text-[#fdfdff]/50">{selectedStudent.email}</p>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-2 rounded-lg hover:bg-white/10 text-[#fdfdff]/60 hover:text-[#fdfdff] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Info */}
              <div className="p-5 rounded-xl bg-[#0F1419] border border-white/5">
                <h3 className="text-sm font-semibold text-[#fdfdff] mb-4">Profile Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#fdfdff]/50">Status</span>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${selectedStudent.status === "active" ? "bg-emerald-400" : "bg-gray-500"}`}
                      />
                      <span className="text-sm font-medium text-[#fdfdff] capitalize">{selectedStudent.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#fdfdff]/50">Last Active</span>
                    <span className="text-sm font-medium text-[#fdfdff]">{selectedStudent.lastActive}</span>
                  </div>
                  {selectedStudent.isAtRisk && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <span className="text-sm font-medium text-rose-400">Student at risk - requires attention</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Learning Module Progress */}
              <div className="p-5 rounded-xl bg-[#0F1419] border border-white/5">
                <h3 className="text-sm font-semibold text-[#fdfdff] mb-4">Learning Module Progress</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#fdfdff]/50">Overall Progress</span>
                      <span className={`text-lg font-bold ${getProgressColor(selectedStudent.learningProgress)}`}>
                        {selectedStudent.learningProgress}%
                      </span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${getProgressBg(selectedStudent.learningProgress)} rounded-full`}
                        style={{ width: `${selectedStudent.learningProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                      <p className="text-xs text-[#fdfdff]/40 mb-1">Courses Completed</p>
                      <p className="text-2xl font-bold text-blue-400">{selectedStudent.coursesCompleted}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                      <p className="text-xs text-[#fdfdff]/40 mb-1">In Progress</p>
                      <p className="text-2xl font-bold text-purple-400">3</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Classroom Activity */}
              <div className="p-5 rounded-xl bg-[#0F1419] border border-white/5">
                <h3 className="text-sm font-semibold text-[#fdfdff] mb-4">Classroom Activity</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                      <p className="text-xs text-[#fdfdff]/40 mb-1">Enrolled Classes</p>
                      <p className="text-2xl font-bold text-emerald-400">{selectedStudent.enrolledClasses}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                      <p className="text-xs text-[#fdfdff]/40 mb-1">Assignments Done</p>
                      <p className="text-2xl font-bold text-cyan-400">{selectedStudent.assignmentsCompleted}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="p-5 rounded-xl bg-[#0F1419] border border-white/5">
                <h3 className="text-sm font-semibold text-[#fdfdff] mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {[
                    { type: "completed", text: "Completed assignment: React Hooks", time: "2 hours ago" },
                    { type: "enrolled", text: "Enrolled in JavaScript Advanced", time: "1 day ago" },
                    { type: "completed", text: "Completed course: Python Basics", time: "3 days ago" },
                  ].map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div
                        className={`p-1.5 rounded-lg ${
                          activity.type === "completed" ? "bg-emerald-500/10" : "bg-blue-500/10"
                        }`}
                      >
                        {activity.type === "completed" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-[#fdfdff]">{activity.text}</p>
                        <p className="text-xs text-[#fdfdff]/40 mt-0.5">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
