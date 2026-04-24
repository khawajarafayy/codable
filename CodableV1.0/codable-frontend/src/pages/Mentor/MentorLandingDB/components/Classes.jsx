import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, Plus, Copy, Trash2, AlertCircle, Loader } from "lucide-react";
import CreateClassModal from "./CreateClassModal.jsx";
import { request } from "../../../../services/apiClient.js";
import { useAuth } from "../../../../context/AuthContext.jsx";

export default function Classes() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch classes on component mount
  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await request(
        "/api/classes/instructor",
        {
          method: "GET",
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      if (response.success) {
        setClasses(response.data || []);
      } else {
        setError(response.message || "Failed to fetch classes");
      }
    } catch (err) {
      console.error("Error fetching classes:", err);
      setError("Error loading classes");
    } finally {
      setLoading(false);
    }
  };

  const handleClassCreated = (newClass) => {
    // Add new class to the beginning of the list
    setClasses([newClass, ...classes]);
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
  };

  const deleteClass = async (classId, e) => {
    e.stopPropagation();
    
    if (!window.confirm("Are you sure you want to delete this class?")) {
      return;
    }

    try {
      const response = await request(
        `/api/classes/${classId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      if (response.success) {
        setClasses(classes.filter(cls => cls._id !== classId));
      } else {
        setError(response.message || "Failed to delete class");
      }
    } catch (err) {
      console.error("Error deleting class:", err);
      setError("Error deleting class");
    }
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

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#fdfdff]/60 mb-4">No classes yet</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Create your first class
          </button>
        </div>
      ) : (
        /* Classes Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls, index) => (
            <div
              key={cls._id}
              className="group relative rounded-2xl"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <Link
                to={`/mentor/classes/${cls._id}`}
                className="block p-6 rounded-2xl backdrop-blur-sm bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/15 transition-all duration-300"
              >
                <h3 className="text-lg font-semibold text-[#fdfdff] mb-2">
                  {cls.className}
                </h3>

                <p className="text-sm text-[#fdfdff]/50 mb-3 line-clamp-2">
                  {cls.description || "No description"}
                </p>

                <div className="flex items-center gap-4 text-[#fdfdff]/60 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{cls.students?.length || 0} students</span>
                  </div>
                  <div className="text-sm px-2 py-1 rounded bg-blue-500/20 text-blue-300">
                    {cls.category}
                  </div>
                </div>

                <div className="pt-4 border-t border-blue-500/20 flex items-center justify-between">
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
                    className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </Link>

              <button
                onClick={(e) => deleteClass(cls._id, e)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Class Modal */}
      <CreateClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onClassCreated={handleClassCreated}
      />
    </div>
  );
}

