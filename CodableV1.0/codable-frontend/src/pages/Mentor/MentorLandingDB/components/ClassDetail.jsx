import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  Plus,
  Mail,
  FileText,
  Calendar,
  Settings,
  Copy,
  Trash2,
  X,
} from "lucide-react";

export default function ClassDetail() {
  const { classId } = useParams();
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [assignmentTopic, setAssignmentTopic] = useState("");
  const [assignmentDeadline, setAssignmentDeadline] = useState("");
  const [assignmentRubric, setAssignmentRubric] = useState("");

  // Mock class data
  const classData = {
    1: { name: "React Fundamentals", joinCode: "REACT2024", students: 45, avgPerformance: 87 },
    2: { name: "Python for Beginners", joinCode: "PY101", students: 38, avgPerformance: 82 },
    3: { name: "JavaScript Advanced", joinCode: "JS2024", students: 32, avgPerformance: 85 },
    4: { name: "Data Structures", joinCode: "DS2024", students: 41, avgPerformance: 79 },
    5: { name: "Web Development", joinCode: "WEB101", students: 52, avgPerformance: 91 },
    6: { name: "Algorithm Design", joinCode: "ALGO24", students: 29, avgPerformance: 76 },
  };

  const currentClass = classData[classId];

  const [students, setStudents] = useState([
    { id: 1, name: "Sarah Chen", email: "sarah.chen@email.com", progress: 92, status: "excellent" },
    { id: 2, name: "Michael Torres", email: "m.torres@email.com", progress: 88, status: "excellent" },
    { id: 3, name: "Emily Rodriguez", email: "emily.r@email.com", progress: 85, status: "good" },
    { id: 4, name: "David Kim", email: "david.kim@email.com", progress: 78, status: "good" },
    { id: 5, name: "Jessica Lee", email: "jessica.lee@email.com", progress: 95, status: "excellent" },
    { id: 6, name: "Ryan Patel", email: "ryan.p@email.com", progress: 72, status: "average" },
    { id: 7, name: "Amanda Wu", email: "amanda.wu@email.com", progress: 89, status: "excellent" },
    { id: 8, name: "James Brown", email: "j.brown@email.com", progress: 81, status: "good" },
  ]);

  const [classAssignments, setClassAssignments] = useState([
    {
      id: 1,
      topic: "Build a Todo App",
      deadline: "2026-04-30",
      status: "active",
      submissions: 32,
      total: currentClass?.students || 45,
    },
    {
      id: 2,
      topic: "Component Composition",
      deadline: "2026-04-25",
      status: "active",
      submissions: 41,
      total: currentClass?.students || 45,
    },
    {
      id: 3,
      topic: "State Management Patterns",
      deadline: "2026-04-15",
      status: "completed",
      submissions: 45,
      total: currentClass?.students || 45,
    },
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case "excellent":
        return { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" };
      case "good":
        return { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" };
      default:
        return { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30" };
    }
  };

  const getStatCardClasses = (color) => {
    const colorMap = {
      blue: "bg-blue-500/10 border-blue-500/30",
      purple: "bg-purple-500/10 border-purple-500/30",
      emerald: "bg-emerald-500/10 border-emerald-500/30",
      rose: "bg-rose-500/10 border-rose-500/30",
    };
    return colorMap[color] || colorMap.blue;
  };

  const getStatIconClasses = (color) => {
    const colorMap = {
      blue: "text-blue-400",
      purple: "text-purple-400",
      emerald: "text-emerald-400",
      rose: "text-rose-400",
    };
    return colorMap[color] || colorMap.blue;
  };

  const getStatIconBgClasses = (color) => {
    const colorMap = {
      blue: "bg-blue-500/20",
      purple: "bg-purple-500/20",
      emerald: "bg-emerald-500/20",
      rose: "bg-rose-500/20",
    };
    return colorMap[color] || colorMap.blue;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleCreateAssignment = () => {
    if (!assignmentTopic.trim() || !assignmentDeadline) return;

    const newAssignment = {
      id: classAssignments.length + 1,
      topic: assignmentTopic,
      deadline: assignmentDeadline,
      status: "active",
      submissions: 0,
      total: currentClass?.students || 0,
    };

    setClassAssignments([newAssignment, ...classAssignments]);
    setAssignmentTopic("");
    setAssignmentDeadline("");
    setAssignmentRubric("");
    setIsAssignmentModalOpen(false);
  };

  const deleteAssignment = (id) => {
    setClassAssignments(classAssignments.filter((a) => a.id !== id));
  };

  const activeAssignments = classAssignments.filter((a) => a.status === "active").length;
  const completionRate = classAssignments.length > 0
    ? Math.round(
        (classAssignments.reduce((sum, a) => sum + a.submissions, 0) /
          (classAssignments.length * (currentClass?.students || 1))) *
          100
      )
    : 0;

  if (!currentClass) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-[#fdfdff]/60">Class not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header with Back Button */}
      <div>
        <Link
          to="/mentor/classes"
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Classes</span>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#fdfdff] mb-2">{currentClass.name}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-[#fdfdff]/60">
                <Users className="w-4 h-4" />
                <span>{currentClass.students} students</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#fdfdff]/50">Join Code:</span>
                <code className="font-[JetBrains_Mono] text-sm text-blue-400 font-semibold">
                  {currentClass.joinCode}
                </code>
                <button
                  onClick={() => copyToClipboard(currentClass.joinCode)}
                  className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors duration-200"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-[#fdfdff]/70 hover:text-[#fdfdff] transition-all duration-200"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Class Overview Analytics */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { title: "Total Students", value: currentClass.students.toString(), icon: Users, color: "blue" },
          { title: "Avg Performance", value: `${currentClass.avgPerformance}%`, icon: TrendingUp, color: "purple" },
          { title: "Completion Rate", value: `${completionRate}%`, icon: CheckCircle2, color: "emerald" },
          { title: "Active Assignments", value: activeAssignments.toString(), icon: Clock, color: "rose" },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className={`relative p-6 rounded-2xl backdrop-blur-sm ${getStatCardClasses(stat.color)} border hover:scale-105 transition-transform duration-300`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className={`p-3 rounded-xl ${getStatIconBgClasses(stat.color)} w-fit mb-4`}>
                <Icon className={`w-6 h-6 ${getStatIconClasses(stat.color)}`} />
              </div>
              <p className="text-[#fdfdff]/60 text-sm mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-[#fdfdff]">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Enrolled Students Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-2xl font-semibold text-[#fdfdff]">Enrolled Students</h2>
          </div>
          <span className="text-sm text-[#fdfdff]/60">{students.length} total</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {students.map((student, index) => {
            const statusColors = getStatusColor(student.status);
            return (
              <div
                key={student.id}
                className="p-5 rounded-2xl backdrop-blur-sm bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/15 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#fdfdff] mb-1">{student.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-[#fdfdff]/60 mb-3">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{student.email}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-[#fdfdff]/50 mb-1">Progress</p>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-blue-500/20 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                              style={{ width: `${student.progress}%` }}
                            />
                          </div>
                          <span className="font-[JetBrains_Mono] text-xs text-blue-400 font-semibold">
                            {student.progress}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`px-3 py-1.5 rounded-lg ${statusColors.bg} ${statusColors.border} border`}>
                    <span className={`text-xs font-medium ${statusColors.text} capitalize`}>
                      {student.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assignments Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <FileText className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-2xl font-semibold text-[#fdfdff]">Assignments</h2>
          </div>
          <button
            onClick={() => setIsAssignmentModalOpen(true)}
            className="group relative px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-2xl border border-purple-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Assign New Task</span>
            <div className="absolute inset-0 rounded-2xl bg-purple-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
          </button>
        </div>

        <div className="space-y-4">
          {classAssignments.map((assignment, index) => {
            const isCompleted = assignment.status === "completed";
            const progress =
              assignment.total > 0 ? Math.round((assignment.submissions / assignment.total) * 100) : 0;

            return (
              <div
                key={assignment.id}
                className={`p-6 rounded-2xl backdrop-blur-sm transition-all duration-300 ${
                  isCompleted
                    ? "bg-emerald-500/10 border border-emerald-500/30"
                    : "bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/15 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                }`}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`p-2 rounded-lg ${isCompleted ? "bg-emerald-500/20" : "bg-purple-500/20"}`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <FileText className="w-5 h-5 text-purple-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[#fdfdff]">{assignment.topic}</h3>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1.5 text-sm text-[#fdfdff]/60">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {new Date(assignment.deadline).toLocaleDateString()}</span>
                          </div>
                          {!isCompleted && (
                            <div className="flex items-center gap-1.5 text-sm text-[#fdfdff]/60">
                              <Clock className="w-4 h-4" />
                              <span>
                                {assignment.submissions}/{assignment.total} submitted
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {!isCompleted && assignment.total > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm text-[#fdfdff]/60 mb-2">
                          <span>Submission Progress</span>
                          <span className="font-[JetBrains_Mono]">{progress}%</span>
                        </div>
                        <div className="h-2 bg-purple-500/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        isCompleted
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-purple-500/20 text-purple-400"
                      }`}
                    >
                      {isCompleted ? "Completed" : "Active"}
                    </div>
                    {!isCompleted && (
                      <button
                        onClick={() => deleteAssignment(assignment.id)}
                        className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 transition-colors duration-200"
                        title="Delete assignment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Assignment Modal */}
      {isAssignmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsAssignmentModalOpen(false)}
          />
          <div className="relative w-full max-w-lg p-8 rounded-2xl bg-[#0A1428] border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.3)] animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#fdfdff]">Assign New Task</h2>
              <button
                onClick={() => setIsAssignmentModalOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-[#fdfdff]/60 hover:text-[#fdfdff] transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#fdfdff]/80 mb-2">Topic / Title</label>
                <input
                  type="text"
                  value={assignmentTopic}
                  onChange={(e) => setAssignmentTopic(e.target.value)}
                  placeholder="e.g., Build a REST API"
                  className="w-full px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[#fdfdff] placeholder:text-[#fdfdff]/30 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#fdfdff]/80 mb-2">Deadline</label>
                <input
                  type="date"
                  value={assignmentDeadline}
                  onChange={(e) => setAssignmentDeadline(e.target.value)}
                  className="w-full px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[#fdfdff] font-[JetBrains_Mono] focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#fdfdff]/80 mb-2">
                  Rubric / Requirements (Optional)
                </label>
                <textarea
                  value={assignmentRubric}
                  onChange={(e) => setAssignmentRubric(e.target.value)}
                  placeholder="Grading criteria and requirements..."
                  rows={4}
                  className="w-full px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[#fdfdff] placeholder:text-[#fdfdff]/30 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 resize-none font-[JetBrains_Mono] text-sm"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleCreateAssignment}
                  className="flex-1 px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-xl border border-purple-500/30 font-medium transition-all duration-300 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                >
                  Create Assignment
                </button>
                <button
                  onClick={() => setIsAssignmentModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-[#fdfdff]/70 hover:text-[#fdfdff] rounded-xl font-medium transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSettingsOpen(false)}
          />
          <div className="relative w-full max-w-lg p-8 rounded-2xl bg-[#0A1428] border border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.3)] animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#fdfdff]">Class Settings</h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-[#fdfdff]/60 hover:text-[#fdfdff] transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#fdfdff]/80 mb-2">Class Name</label>
                <input
                  type="text"
                  defaultValue={currentClass.name}
                  className="w-full px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-[#fdfdff] focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#fdfdff]/80 mb-2">Join Code</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={currentClass.joinCode}
                    readOnly
                    className="flex-1 px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-[#fdfdff] font-[JetBrains_Mono] font-semibold focus:outline-none"
                  />
                  <button className="px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl border border-blue-500/30 transition-colors duration-200">
                    Regenerate
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                <button className="w-full px-6 py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-xl border border-rose-500/30 font-medium transition-all duration-300 hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Class</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}