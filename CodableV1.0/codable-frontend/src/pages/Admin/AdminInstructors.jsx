import { useState, useEffect } from "react";
import {
  GraduationCap,
  Search,
  ChevronDown,
  X,
  Mail,
  Users,
  BookOpen,
  TrendingUp,
  CheckCircle2,
  Clock,
  Target,
  AlertCircle,
  Award,
} from "lucide-react";
import { api } from "../../services/apiClient";

export default function AdminInstructors() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [instructors, setInstructors] = useState([]);

  useEffect(() => {
    let mounted = true;
    api.getAdminInstructors()
      .then(res => {
        if (mounted && res?.success) setInstructors(res.data || []);
      })
      .catch(err => console.warn("Failed to load instructors", err))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  const filteredInstructors = instructors.filter((instructor) => {
    if (activeTab !== "all" && instructor.status !== activeTab) return false;
    if (
      searchQuery &&
      !instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !instructor.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const tabs = [
    { id: "all", label: "All Instructors", count: instructors.length },
    { id: "active", label: "Active", count: instructors.filter((i) => i.status === "active").length },
    { id: "inactive", label: "Inactive", count: instructors.filter((i) => i.status === "inactive").length },
    { id: "pending", label: "Pending Approvals", count: instructors.filter((i) => i.status === "pending").length },
  ];

  const getPerformanceColor = (performance) => {
    if (performance >= 85) return "text-emerald-400";
    if (performance >= 75) return "text-blue-400";
    if (performance >= 65) return "text-yellow-400";
    return "text-rose-400";
  };

  const getEngagementColor = (level) => {
    switch (level) {
      case "high":
        return { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" };
      case "medium":
        return { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" };
      default:
        return { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#fdfdff] mb-1">Instructors Management</h1>
          <p className="text-sm text-[#fdfdff]/50">Manage and monitor instructor activity and performance</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-sm text-[#fdfdff]/60">Loading instructors...</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-[#0F1419] border border-white/5 rounded-lg w-fit">
        {tabs.map((tab) => (
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
        ))}
      </div>

      {/* Search */}
      <div className="max-w-md">
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

      {/* Instructors Table */}
      <div className="rounded-xl bg-[#0F1419] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-4 text-xs font-semibold text-[#fdfdff]/40 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-center px-5 py-4 text-xs font-semibold text-[#fdfdff]/40 uppercase tracking-wider">
                  Classes
                </th>
                <th className="text-center px-5 py-4 text-xs font-semibold text-[#fdfdff]/40 uppercase tracking-wider">
                  Students
                </th>
                <th className="text-center px-5 py-4 text-xs font-semibold text-[#fdfdff]/40 uppercase tracking-wider">
                  Avg Performance
                </th>
                <th className="text-center px-5 py-4 text-xs font-semibold text-[#fdfdff]/40 uppercase tracking-wider">
                  Engagement
                </th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-[#fdfdff]/40 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-[#fdfdff]/40 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredInstructors.map((instructor) => {
                const engagementColors = getEngagementColor(instructor.engagementLevel);

                return (
                  <tr
                    key={instructor.id}
                    onClick={() => setSelectedInstructor(instructor)}
                    className="hover:bg-white/5 transition-colors duration-150 cursor-pointer"
                  >
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-medium text-[#fdfdff]">{instructor.name}</p>
                        <p className="text-xs text-[#fdfdff]/40 mt-0.5">{instructor.email}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-sm font-medium text-[#fdfdff]">{instructor.classesCreated}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-sm font-medium text-[#fdfdff]">{instructor.totalStudents}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {instructor.avgPerformance > 0 ? (
                        <span className={`text-sm font-semibold ${getPerformanceColor(instructor.avgPerformance)}`}>
                          {instructor.avgPerformance}%
                        </span>
                      ) : (
                        <span className="text-sm text-[#fdfdff]/30">N/A</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${engagementColors.bg} ${engagementColors.text} border ${engagementColors.border} capitalize`}
                        >
                          {instructor.engagementLevel}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-[#fdfdff]/60">{instructor.lastActive}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            instructor.status === "active"
                              ? "bg-emerald-400"
                              : instructor.status === "pending"
                              ? "bg-yellow-400"
                              : "bg-gray-500"
                          }`}
                        />
                        <span
                          className={`text-sm capitalize ${
                            instructor.status === "active"
                              ? "text-emerald-400"
                              : instructor.status === "pending"
                              ? "text-yellow-400"
                              : "text-gray-400"
                          }`}
                        >
                          {instructor.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredInstructors.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-white/5 mb-4">
              <GraduationCap className="w-8 h-8 text-[#fdfdff]/20" />
            </div>
            <p className="text-sm font-medium text-[#fdfdff]/60 mb-1">No instructors found</p>
            <p className="text-xs text-[#fdfdff]/40">Try adjusting your search</p>
          </div>
        )}
      </div>

      {/* Instructor Detail Drawer */}
      {selectedInstructor && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedInstructor(null)} />
          <div className="relative w-full max-w-2xl h-full bg-[#0A0D14] border-l border-white/5 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-white/5 sticky top-0 bg-[#0A0D14] z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#fdfdff] mb-1">{selectedInstructor.name}</h2>
                  <p className="text-sm text-[#fdfdff]/50">{selectedInstructor.email}</p>
                </div>
                <button
                  onClick={() => setSelectedInstructor(null)}
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
                        className={`w-2 h-2 rounded-full ${
                          selectedInstructor.status === "active"
                            ? "bg-emerald-400"
                            : selectedInstructor.status === "pending"
                            ? "bg-yellow-400"
                            : "bg-gray-500"
                        }`}
                      />
                      <span className="text-sm font-medium text-[#fdfdff] capitalize">{selectedInstructor.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#fdfdff]/50">Last Active</span>
                    <span className="text-sm font-medium text-[#fdfdff]">{selectedInstructor.lastActive}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#fdfdff]/50">Engagement Level</span>
                    {(() => {
                      const colors = getEngagementColor(selectedInstructor.engagementLevel);
                      return (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text} border ${colors.border} capitalize`}
                        >
                          {selectedInstructor.engagementLevel}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Overview Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-[#0F1419] border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-xs text-[#fdfdff]/50">Classes Created</span>
                  </div>
                  <p className="text-3xl font-bold text-[#fdfdff]">{selectedInstructor.classesCreated}</p>
                </div>

                <div className="p-5 rounded-xl bg-[#0F1419] border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Users className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-xs text-[#fdfdff]/50">Total Students</span>
                  </div>
                  <p className="text-3xl font-bold text-purple-400">{selectedInstructor.totalStudents}</p>
                </div>
              </div>

              {/* Performance */}
              {selectedInstructor.avgPerformance > 0 && (
                <div className="p-5 rounded-xl bg-[#0F1419] border border-white/5">
                  <h3 className="text-sm font-semibold text-[#fdfdff] mb-4">Performance Insights</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-[#fdfdff]/50">Avg Student Performance</span>
                        <span className={`text-2xl font-bold ${getPerformanceColor(selectedInstructor.avgPerformance)}`}>
                          {selectedInstructor.avgPerformance}%
                        </span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                          style={{ width: `${selectedInstructor.avgPerformance}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Classes List */}
              {selectedInstructor.classesCreated > 0 && (
                <div className="p-5 rounded-xl bg-[#0F1419] border border-white/5">
                  <h3 className="text-sm font-semibold text-[#fdfdff] mb-4">Classes Overview</h3>
                  <div className="space-y-3">
                    {[
                      { name: "React Fundamentals", students: 45, assignments: 8 },
                      { name: "Python for Beginners", students: 38, assignments: 10 },
                      { name: "JavaScript Advanced", students: 32, assignments: 7 },
                    ]
                      .slice(0, selectedInstructor.classesCreated)
                      .map((cls, idx) => (
                        <div key={idx} className="p-4 rounded-lg bg-white/5 border border-white/5">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-[#fdfdff]">{cls.name}</h4>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-[#fdfdff]/50">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5" />
                              <span>{cls.students} students</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5" />
                              <span>{cls.assignments} assignments</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Assignment Stats */}
              {selectedInstructor.classesCreated > 0 && (
                <div className="p-5 rounded-xl bg-[#0F1419] border border-white/5">
                  <h3 className="text-sm font-semibold text-[#fdfdff] mb-4">Assignment Statistics</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                      <p className="text-xs text-[#fdfdff]/40 mb-1">Total Assigned</p>
                      <p className="text-2xl font-bold text-emerald-400">47</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                      <p className="text-xs text-[#fdfdff]/40 mb-1">Pending Reviews</p>
                      <p className="text-2xl font-bold text-blue-400">12</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Pending Approval Notice */}
              {selectedInstructor.status === "pending" && (
                <div className="p-5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-yellow-400 mb-2">Pending Approval</h3>
                      <p className="text-sm text-[#fdfdff]/60 mb-4">
                        This instructor is waiting for admin approval before they can create classes and manage students.
                      </p>
                      <div className="flex items-center gap-2">
                        <button className="px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-sm font-medium transition-colors">
                          Approve
                        </button>
                        <button className="px-4 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-sm font-medium transition-colors">
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
