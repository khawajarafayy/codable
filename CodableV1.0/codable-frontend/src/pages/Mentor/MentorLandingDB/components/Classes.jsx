import { useState } from "react";
import { Link } from "react-router-dom";
import { Users, Plus, X, Copy, Trash2 } from "lucide-react";

export default function Classes() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [className, setClassName] = useState("");
  const [description, setDescription] = useState("");

  const [classes, setClasses] = useState([
    { id: 1, name: "React Fundamentals", students: 45, joinCode: "REACT2024", description: "Learn React from scratch" },
    { id: 2, name: "Python for Beginners", students: 38, joinCode: "PY101", description: "Introduction to Python programming" },
    { id: 3, name: "JavaScript Advanced", students: 32, joinCode: "JS2024", description: "Advanced JavaScript concepts" },
    { id: 4, name: "Data Structures", students: 41, joinCode: "DS2024", description: "Essential data structures and algorithms" },
    { id: 5, name: "Web Development", students: 52, joinCode: "WEB101", description: "Full-stack web development" },
    { id: 6, name: "Algorithm Design", students: 29, joinCode: "ALGO24", description: "Design and analysis of algorithms" },
  ]);

  const generateJoinCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateClass = () => {
    if (!className.trim()) return;

    const newClass = {
      id: classes.length + 1,
      name: className,
      students: 0,
      joinCode: generateJoinCode(),
      description: description || "No description",
    };

    setClasses([...classes, newClass]);
    setClassName("");
    setDescription("");
    setIsModalOpen(false);
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
  };

  const deleteClass = (id) => {
    setClasses(classes.filter((cls) => cls.id !== id));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#fdfdff] mb-2">Classes</h1>
          <p className="text-[#fdfdff]/60">
            Manage your teaching classes and student groups.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="group relative px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-2xl border border-blue-500/30 transition-all duration-300 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Create Class</span>
          <div className="absolute inset-0 rounded-2xl bg-blue-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
        </button>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-3 gap-6">
        {classes.map((cls, index) => (
          <div
            key={cls.id}
            className="group relative rounded-2xl"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <Link
              to={`/mentor/classes/${cls.id}`}
              className="block p-6 rounded-2xl backdrop-blur-sm bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/15 transition-all duration-300"
            >
              <h3 className="text-lg font-semibold text-[#fdfdff] mb-2">
                {cls.name}
              </h3>

              <p className="text-sm text-[#fdfdff]/50 mb-3">
                {cls.description}
              </p>

              <div className="flex items-center gap-2 text-[#fdfdff]/60">
                <Users className="w-4 h-4" />
                <span className="text-sm">{cls.students} students</span>
              </div>

              <div className="mt-4 pt-4 border-t border-blue-500/20 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#fdfdff]/50 mb-1">Join Code</p>
                  <code className="text-sm text-blue-400 font-semibold">
                    {cls.joinCode}
                  </code>
                </div>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    copyToClipboard(cls.joinCode);
                  }}
                  className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </Link>

            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteClass(cls.id);
              }}
              className="absolute top-4 right-4 p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative w-full max-w-lg p-8 rounded-2xl bg-[#0A1428] border border-blue-500/30">
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#fdfdff]">
                Create New Class
              </h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <div className="space-y-5">
              <input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Class Name"
                className="w-full px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-white"
              />

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                rows={3}
                className="w-full px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-white"
              />

              <div className="flex gap-3">
                <button
                  onClick={handleCreateClass}
                  className="flex-1 py-3 bg-blue-500/20 text-blue-400 rounded-xl"
                >
                  Create
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-white/5 text-white/70 rounded-xl"
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
