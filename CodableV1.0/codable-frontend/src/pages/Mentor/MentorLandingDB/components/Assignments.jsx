import { useState } from "react";
import { FileText, Calendar, Plus, X, Clock, CheckCircle2 } from "lucide-react";

export default function Assignments() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [deadline, setDeadline] = useState("");
  const [rubric, setRubric] = useState("");

  const classes = [
    "React Fundamentals",
    "Python for Beginners",
    "JavaScript Advanced",
    "Data Structures",
  ];

  const [assignments, setAssignments] = useState([
    {
      id: 1,
      class: "React Fundamentals",
      topic: "Build a Todo App",
      deadline: "2026-04-30",
      status: "active",
      submissions: 32,
      total: 45,
    },
    {
      id: 2,
      class: "React Fundamentals",
      topic: "Component Composition",
      deadline: "2026-04-25",
      status: "active",
      submissions: 41,
      total: 45,
    },
    {
      id: 3,
      class: "Python for Beginners",
      topic: "Data Analysis with Pandas",
      deadline: "2026-04-28",
      status: "active",
      submissions: 28,
      total: 38,
    },
    {
      id: 4,
      class: "JavaScript Advanced",
      topic: "Async/Await Patterns",
      deadline: "2026-04-15",
      status: "completed",
      submissions: 32,
      total: 32,
    },
    {
      id: 5,
      class: "Data Structures",
      topic: "Binary Search Trees",
      deadline: "2026-04-26",
      status: "active",
      submissions: 35,
      total: 41,
    },
  ]);

  const handleCreateAssignment = () => {
    if (!topic.trim() || !selectedClass || !deadline) return;

    const newAssignment = {
      id: assignments.length + 1,
      class: selectedClass,
      topic,
      deadline,
      status: "active",
      submissions: 0,
      total: 0,
    };

    setAssignments([newAssignment, ...assignments]);
    setTopic("");
    setSelectedClass("");
    setDeadline("");
    setRubric("");
    setIsModalOpen(false);
  };

  const groupedAssignments = assignments.reduce((acc, assignment) => {
    if (!acc[assignment.class]) {
      acc[assignment.class] = [];
    }
    acc[assignment.class].push(assignment);
    return acc;
  }, {});

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#fdfdff] mb-2">Assignments</h1>
          <p className="text-[#fdfdff]/60">
            Create and manage assignments for your classes.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="group relative px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-2xl border border-purple-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Create Assignment</span>
        </button>
      </div>

      {/* Assignments by Class */}
      <div className="space-y-8">
        {Object.entries(groupedAssignments).map(([className, classAssignments]) => (
          <div key={className}>
            <h2 className="text-xl font-semibold text-[#fdfdff] mb-4">
              {className}
            </h2>

            <div className="space-y-4">
              {classAssignments.map((assignment, index) => {
                const isCompleted = assignment.status === "completed";

                const progress =
                  assignment.total > 0
                    ? Math.round(
                        (assignment.submissions / assignment.total) * 100
                      )
                    : 0;

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
                            className={`p-2 rounded-lg ${
                              isCompleted
                                ? "bg-emerald-500/20"
                                : "bg-purple-500/20"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <FileText className="w-5 h-5 text-purple-400" />
                            )}
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold text-[#fdfdff]">
                              {assignment.topic}
                            </h3>

                            <div className="flex items-center gap-4 mt-1">
                              <div className="flex items-center gap-1.5 text-sm text-[#fdfdff]/60">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  Due:{" "}
                                  {new Date(
                                    assignment.deadline
                                  ).toLocaleDateString()}
                                </span>
                              </div>

                              {!isCompleted && (
                                <div className="flex items-center gap-1.5 text-sm text-[#fdfdff]/60">
                                  <Clock className="w-4 h-4" />
                                  <span>
                                    {assignment.submissions}/
                                    {assignment.total} submitted
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Progress */}
                        {!isCompleted && assignment.total > 0 && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-sm text-[#fdfdff]/60 mb-2">
                              <span>Submission Progress</span>
                              <span className="font-[JetBrains_Mono]">
                                {progress}%
                              </span>
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

                      <div
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                          isCompleted
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-purple-500/20 text-purple-400"
                        }`}
                      >
                        {isCompleted ? "Completed" : "Active"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative w-full max-w-lg p-8 rounded-2xl bg-[#0A1428] border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.3)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#fdfdff]">
                Create Assignment
              </h2>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-[#fdfdff]/60 hover:text-[#fdfdff]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#fdfdff]/80 mb-2">
                  Class
                </label>

                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[#fdfdff]"
                >
                  <option value="">Select a class</option>
                  {classes.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#fdfdff]/80 mb-2">
                  Topic
                </label>

                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[#fdfdff]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#fdfdff]/80 mb-2">
                  Deadline
                </label>

                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[#fdfdff]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#fdfdff]/80 mb-2">
                  Rubric
                </label>

                <textarea
                  value={rubric}
                  onChange={(e) => setRubric(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[#fdfdff]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateAssignment}
                  className="flex-1 px-6 py-3 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30"
                >
                  Create
                </button>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-white/5 text-[#fdfdff]/70 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
