import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Clock, CheckCircle2, AlertCircle, FileText, TrendingUp } from "lucide-react";
import { api } from "../../../services/apiClient";

export default function Classroom() {
  const [joinCode, setJoinCode] = useState("");
  const [feedback, setFeedback] = useState({
    type: null,
    message: "",
  });

  const [pendingRequests, setPendingRequests] = useState([]);
  const [joinedClasses, setJoinedClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch joined classes and pending requests
  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setFeedback({
            type: "error",
            message: "Please log in to view classes",
          });
          return;
        }

        // Fetch joined classes
        const classesResponse = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/student-class/classes`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (classesResponse.ok) {
          const classesData = await classesResponse.json();
          setJoinedClasses(classesData.data || []);
        }

        // Fetch pending join requests
        const requestsResponse = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/student-class/requests?status=pending`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (requestsResponse.ok) {
          const requestsData = await requestsResponse.json();
          setPendingRequests(requestsData.data || []);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching class data:", error);
        setFeedback({
          type: "error",
          message: "Failed to load classes",
        });
        setLoading(false);
      }
    };

    fetchClassData();

    // Set up WebSocket for real-time updates
    const setupWebSocket = () => {
      const token = localStorage.getItem("token");
      const wsUrl = (import.meta.env.VITE_API_URL || "http://localhost:3000")
        .replace(/^http/, "ws");
      const ws = new WebSocket(`${wsUrl}/ws/notifications?token=${token}`);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        // Handle class approval notification
        if (data.type === "CLASS_APPROVED") {
          setPendingRequests((prev) =>
            prev.filter((req) => req.id !== data.classRequestId)
          );
          setJoinedClasses((prev) => [...prev, data.classData]);
          setFeedback({
            type: "success",
            message: `You've been approved to join ${data.classData.className}!`,
          });
          setTimeout(
            () => setFeedback({ type: null, message: "" }),
            5000
          );
        }

        // Handle class rejection
        if (data.type === "CLASS_REJECTED") {
          setPendingRequests((prev) =>
            prev.filter((req) => req.id !== data.classRequestId)
          );
          setFeedback({
            type: "error",
            message: `Your request to join ${data.className} was rejected`,
          });
          setTimeout(
            () => setFeedback({ type: null, message: "" }),
            5000
          );
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      return ws;
    };

    const ws = setupWebSocket();

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleJoinClass = async () => {
    if (!joinCode.trim()) {
      setFeedback({
        type: "error",
        message: "Please enter a join code",
      });
      setTimeout(() => setFeedback({ type: null, message: "" }), 3000);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setFeedback({
          type: "error",
          message: "Please log in first",
        });
        return;
      }

      // Send join request to backend
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await fetch(
        `${apiUrl}/api/student-class/join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ joinCode: joinCode.toUpperCase() }),
        }
      );

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (response.ok && data) {
        // Add to pending requests locally
        const newRequest = {
          id: data.classRequestId || Date.now(),
          classId: data.classId,
          className: data.className,
          instructor: data.instructorName,
          requestedAt: new Date().toISOString().split("T")[0],
        };

        setPendingRequests([...pendingRequests, newRequest]);
        setFeedback({
          type: "success",
          message: "Request sent for approval! Waiting for instructor approval...",
        });
        setJoinCode("");
        setTimeout(
          () => setFeedback({ type: null, message: "" }),
          5000
        );
      } else if (response.status === 404) {
        setFeedback({
          type: "error",
          message: "Backend endpoint not yet implemented. Please wait for backend deployment.",
        });
        setTimeout(
          () => setFeedback({ type: null, message: "" }),
          5000
        );
      } else if (response.status === 500) {
        setFeedback({
          type: "error",
          message: "Server error. Make sure the backend is running.",
        });
        setTimeout(
          () => setFeedback({ type: null, message: "" }),
          5000
        );
      } else {
        setFeedback({
          type: "error",
          message: data?.message || "Invalid join code or code not found",
        });
        setTimeout(
          () => setFeedback({ type: null, message: "" }),
          3000
        );
      }
    } catch (error) {
      console.error("Error joining class:", error);
      setFeedback({
        type: "error",
        message: "Cannot connect to server. Make sure the backend is running at " + (import.meta.env.VITE_API_URL || "http://localhost:3000"),
      });
      setTimeout(
        () => setFeedback({ type: null, message: "" }),
        5000
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1428] via-[#0F1B2D] to-[#040B1D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full" />
            </div>
            <p className="mt-4 text-[#fdfdff]/60">Loading classes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1428] via-[#0F1B2D] to-[#040B1D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#fdfdff] mb-2">My Classroom</h1>
          <p className="text-[#fdfdff]/60">Join classes and track your learning progress.</p>
        </div>

      {/* Join Class Section */}
      <div className="relative p-8 rounded-2xl backdrop-blur-sm bg-blue-500/10 border border-blue-500/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <BookOpen className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-2xl font-semibold text-[#fdfdff]">Join a Class</h2>
        </div>

        <div className="max-w-2xl">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoinClass()}
                placeholder="Enter Join Code (e.g., REACT2024)"
                className="w-full px-5 py-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-[#fdfdff] placeholder:text-[#fdfdff]/30 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 font-mono text-lg"
              />
            </div>
            <button
              onClick={handleJoinClass}
              className="group relative px-8 py-4 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl border border-blue-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] font-medium"
            >
              Join Class
              <div className="absolute inset-0 rounded-xl bg-blue-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
            </button>
          </div>

          {/* Feedback Message */}
          {feedback.type && (
            <div
              className={`mt-4 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
                feedback.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/30"
                  : "bg-rose-500/10 border border-rose-500/30"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              )}
              <span
                className={`text-sm font-medium ${
                  feedback.type === "success"
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {feedback.message}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <h2 className="text-2xl font-semibold text-[#fdfdff]">
              Pending Approval
            </h2>
            <span className="px-3 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 text-sm font-medium">
              {pendingRequests.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingRequests.map((request, index) => (
              <div
                key={request.id}
                className="relative p-6 rounded-2xl backdrop-blur-sm bg-yellow-500/10 border border-yellow-500/30 opacity-75 cursor-not-allowed"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="absolute top-4 right-4">
                  <div className="px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs font-medium border border-yellow-500/30">
                    Pending
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-[#fdfdff] mb-2">
                    {request.className}
                  </h3>
                  <p className="text-sm text-[#fdfdff]/60 mb-1">
                    Instructor: {request.instructor}
                  </p>
                  <p className="text-xs text-[#fdfdff]/50">
                    Requested:{" "}
                    {new Date(request.requestedAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="pt-4 border-t border-yellow-500/20">
                  <div className="flex items-center gap-2 text-sm text-yellow-400">
                    <Clock className="w-4 h-4" />
                    <span>Waiting for instructor approval</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Joined Classes Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-semibold text-[#fdfdff]">My Classes</h2>
          <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium">
            {joinedClasses.length}
          </span>
        </div>

        {joinedClasses.length === 0 ? (
          <div className="p-8 rounded-2xl backdrop-blur-sm bg-purple-500/5 border border-purple-500/20 text-center">
            <p className="text-[#fdfdff]/60">
              No joined classes yet. Enter a join code above to get started!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {joinedClasses.map((cls, index) => (
              <Link
                key={cls.id || cls.classId}
                to={`/classroom/${cls.classId}`}
                className="group relative p-6 rounded-2xl backdrop-blur-sm bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/15 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] hover:scale-105"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-[#fdfdff] mb-2 group-hover:text-purple-300 transition-colors duration-200">
                    {cls.className}
                  </h3>
                  <p className="text-sm text-[#fdfdff]/60 mb-3">
                    Instructor: {cls.instructorName}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-[#fdfdff]/60">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      <span>{cls.assignments || 0} assignments</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{cls.completed || 0} completed</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-purple-500/20">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-[#fdfdff]/60">Progress</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <span className="font-mono text-purple-400 font-semibold">
                        {cls.progress || 0}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-purple-500/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-500"
                      style={{ width: `${cls.progress || 0}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
