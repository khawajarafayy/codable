import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, Plus, Copy, Trash2, AlertCircle, Loader, UserCheck } from "lucide-react";
import CreateClassModal from "./CreateClassModal.jsx";
import StudentApprovalModal from "./StudentApprovalModal.jsx";
import { request } from "../../../../services/apiClient.js";
import { useAuth } from "../../../../context/AuthContext.jsx";

export default function Classes() {
  const { user, isLoading: authLoading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classes, setClasses] = useState([]);
  const [pendingCounts, setPendingCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch classes when user is loaded
  useEffect(() => {
    if (authLoading) {
      // Still loading auth, don't fetch yet
      return;
    }
    
    if (!user || !user.token) {
      console.warn("No user or token available");
      setError("Please log in to view classes");
      setLoading(false);
      return;
    }
    
    fetchClasses();
  }, [user, authLoading]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate token exists
      if (!user || !user.token) {
        console.error("No token found. User:", user);
        setError("Authentication token missing. Please log in again.");
        setLoading(false);
        return;
      }

      console.log("Fetching classes with user:", { userId: user._id, role: user.role });
      console.log("Authorization header:", `Bearer ${user.token ? "TOKEN_EXISTS" : "NO_TOKEN"}`);

      const response = await request(
        "/api/classes/instructor",
        {
          method: "GET",
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      console.log("Fetch classes response:", response);

      if (response.success) {
        setClasses(response.data || []);
        // Fetch pending request counts for each class
        fetchPendingRequestsCounts(response.data || []);
      } else {
        console.error("Server returned success: false", response);
        setError(response.message || "Failed to fetch classes");
      }
    } catch (err) {
      console.error("Error fetching classes:", err);
      console.error("Error status:", err.status);
      console.error("Error payload:", err.payload);
      
      let errorMessage = "Error loading classes";
      if (err.payload && err.payload.message) {
        errorMessage = err.payload.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      if (err.status === 401) {
        errorMessage = "Session expired. Please log in again.";
      } else if (err.status === 403) {
        errorMessage = "You don't have permission to view classes.";
      }
      
      setError(errorMessage);
      setClasses([]); // Clear classes on error
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequestsCounts = async (classList) => {
    try {
      const counts = {};
      for (const cls of classList) {
        try {
          const response = await request(
            `/api/instructor/class-requests/${cls._id}?status=pending`,
            {
              method: "GET",
              headers: { Authorization: `Bearer ${user.token}` },
            }
          );
          counts[cls._id] = response.success ? (response.data || []).length : 0;
        } catch (err) {
          console.error(`Error fetching pending requests for class ${cls._id}:`, err);
          counts[cls._id] = 0;
        }
      }
      setPendingCounts(counts);
    } catch (err) {
      console.error("Error fetching pending counts:", err);
    }
  };

  const openApprovalModal = (cls, e) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedClass(cls);
    setIsApprovalModalOpen(true);
  };

  const handleApprovalModalClose = () => {
    setIsApprovalModalOpen(false);
    setSelectedClass(null);
  };

  const handleApprovalUpdate = () => {
    // Refresh pending counts after approval/rejection
    if (selectedClass) {
      fetchPendingRequestsCounts([selectedClass]);
    }
    // Also refresh classes to update student count
    fetchClasses();
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
          {classes.map((cls, index) => {
            const pendingCount = pendingCounts[cls._id] || 0;
            return (
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

                <div className="mt-4 pt-4 border-t border-blue-500/20 flex items-center justify-between">
                  <button
                    onClick={(e) => openApprovalModal(cls, e)}
                    className="px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Manage Requests</span>
                  </button>

                  {pendingCount > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/25 text-amber-200 text-xs font-semibold">
                      {pendingCount} pending
                    </span>
                  )}
                </div>
              </Link>

              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={(e) => deleteClass(cls._id, e)}
                  className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Create Class Modal */}
      <CreateClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onClassCreated={handleClassCreated}
      />

      {/* Student Approval Modal */}
      {selectedClass && (
        <StudentApprovalModal
          classId={selectedClass._id}
          className={selectedClass.className}
          isOpen={isApprovalModalOpen}
          onClose={handleApprovalModalClose}
          onUpdate={handleApprovalUpdate}
          userToken={user?.token}
        />
      )}
    </div>
  );
}

