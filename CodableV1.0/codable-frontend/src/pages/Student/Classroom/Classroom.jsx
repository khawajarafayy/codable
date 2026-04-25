import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Clock, CheckCircle2, AlertCircle, FileText, TrendingUp, Sparkles, User, GraduationCap, ChevronRight } from "lucide-react";
import { api } from "../../../services/apiClient";

export default function Classroom() {
  const [joinCode, setJoinCode] = useState("");
  const [feedback, setFeedback] = useState({ type: null, message: "" });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [joinedClasses, setJoinedClasses] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setFeedback({ type: "error", message: "Please log in to view classes" });
          return;
        }

        // Fetch User Profile
        try {
          const profileRes = await api.getStudentProfile();
          if (profileRes && profileRes.data) {
            setProfile(profileRes.data);
          }
        } catch (err) {
          console.error("Failed to fetch profile", err);
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
        setFeedback({ type: "error", message: "Failed to load classes" });
        setLoading(false);
      }
    };

    fetchClassData();

    // WebSocket setup
    const setupWebSocket = () => {
      const token = localStorage.getItem("token");
      const wsUrl = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/^http/, "ws");
      const ws = new WebSocket(`${wsUrl}/ws/notifications?token=${token}`);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "CLASS_APPROVED") {
          setPendingRequests((prev) => prev.filter((req) => req.id !== data.classRequestId));
          setJoinedClasses((prev) => [...prev, data.classData]);
          setFeedback({ type: "success", message: `You've been approved to join ${data.classData.className}!` });
          setTimeout(() => setFeedback({ type: null, message: "" }), 5000);
        }
        if (data.type === "CLASS_REJECTED") {
          setPendingRequests((prev) => prev.filter((req) => req.id !== data.classRequestId));
          setFeedback({ type: "error", message: `Your request to join ${data.className} was rejected` });
          setTimeout(() => setFeedback({ type: null, message: "" }), 5000);
        }
      };
      return ws;
    };

    const ws = setupWebSocket();
    return () => { if (ws) ws.close(); };
  }, []);

  const handleJoinClass = async () => {
    if (!joinCode.trim()) {
      setFeedback({ type: "error", message: "Please enter a join code" });
      setTimeout(() => setFeedback({ type: null, message: "" }), 3000);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setFeedback({ type: "error", message: "Please log in first" });
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/api/student-class/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ joinCode: joinCode.toUpperCase() }),
      });

      let data = null;
      try { data = await response.json(); } catch { data = null; }

      if (response.ok && data) {
        const newRequest = {
          id: data.classRequestId || Date.now(),
          classId: data.classId,
          className: data.className,
          instructor: data.instructorName,
          requestedAt: new Date().toISOString().split("T")[0],
        };

        setPendingRequests([...pendingRequests, newRequest]);
        setFeedback({ type: "success", message: "Request sent for approval! Waiting for instructor approval..." });
        setJoinCode("");
        setTimeout(() => setFeedback({ type: null, message: "" }), 5000);
      } else {
        setFeedback({ type: "error", message: data?.message || "Invalid join code or code not found" });
        setTimeout(() => setFeedback({ type: null, message: "" }), 3000);
      }
    } catch (error) {
      setFeedback({ type: "error", message: "Cannot connect to server." });
      setTimeout(() => setFeedback({ type: null, message: "" }), 5000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05050A] flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full animate-spin"></div>
          <div className="w-16 h-16 border-4 border-t-blue-500 rounded-full animate-spin absolute top-0 left-0" style={{ animationDuration: '1s' }}></div>
        </div>
      </div>
    );
  }

  const getInitials = () => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    }
    return (profile?.firstName?.[0] || profile?.name?.[0] || 'S').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#05050A] text-white overflow-hidden relative selection:bg-blue-500/30">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-12 animate-in fade-in duration-700">
        
        {/* Modern Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white/[0.02] border border-white/5 p-6 rounded-3xl backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                My Classroom
              </h1>
              <p className="text-sm text-gray-400 mt-1 font-medium">Your gateway to mastering new skills</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-black/40 p-2 pr-6 rounded-full border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
              <span className="text-white font-bold text-lg relative z-10 tracking-wider">
                {getInitials()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                {profile?.firstName || profile?.name || 'Student'} {profile?.lastName || ''}
              </span>
              <span className="text-xs text-purple-400 font-medium capitalize">
                {profile?.membershipTier || 'Free'} Member
              </span>
            </div>
          </div>
        </header>

        {/* Join Class Action Card */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
          <div className="relative p-8 sm:p-10 rounded-3xl bg-black/60 border border-white/10 backdrop-blur-xl flex flex-col md:flex-row items-center gap-8 justify-between overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <Sparkles className="w-64 h-64" />
            </div>
            
            <div className="flex-1 max-w-xl z-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Join a New Class</h2>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6">
                Got a join code from your instructor? Enter it below to unlock your course materials, assignments, and start learning immediately.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinClass()}
                  placeholder="e.g. REACT2024"
                  className="flex-1 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all uppercase tracking-widest font-mono text-lg"
                />
                <button
                  onClick={handleJoinClass}
                  className="px-8 py-4 bg-white text-black hover:bg-gray-200 font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Join Now
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {feedback.type && (
                <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 border ${feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'} animate-in slide-in-from-bottom-2`}>
                  {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                  <span className="text-sm font-medium">{feedback.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        {pendingRequests.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-white">Pending Approvals</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-xs font-bold border border-amber-500/20">
                {pendingRequests.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {pendingRequests.map((req, i) => (
                <div key={req.id} className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 blur-2xl rounded-full" />
                  <div className="absolute top-4 right-4">
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-md">Pending</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 pr-16">{req.className}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                    <User className="w-4 h-4" />
                    <span>{req.instructor}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 bg-black/40 w-fit px-3 py-1.5 rounded-lg border border-white/5">
                    <Clock className="w-3.5 h-3.5" />
                    Requested on {new Date(req.requestedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Classes */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <BookOpen className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-white">Enrolled Classes</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/20">
              {joinedClasses.length}
            </span>
          </div>

          {joinedClasses.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white/[0.02] border border-white/5 text-center border-dashed flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
                <BookOpen className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-white">No Classes Yet</h3>
              <p className="text-gray-400 max-w-sm">You haven't joined any classes yet. Use the join code provided by your instructor to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {joinedClasses.map((cls, i) => (
                <Link
                  key={cls.id || cls.classId}
                  to={`/classroom/${cls.classId}`}
                  className="group block p-1 rounded-3xl bg-gradient-to-b from-white/10 to-white/0 hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 hover:scale-[1.02] hover:-translate-y-1 shadow-xl hover:shadow-blue-500/20"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="h-full bg-[#0A0A10] p-6 rounded-[22px] border border-white/5 relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full group-hover:bg-blue-500/20 transition-colors" />
                    
                    <div className="flex-1 z-10 relative">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-white/5 text-gray-300 rounded-md border border-white/10">Active</span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-blue-300 transition-colors">{cls.className}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                        <User className="w-4 h-4" />
                        <span className="line-clamp-1">{cls.instructorName}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-black/30 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                          <span className="text-xs text-gray-500 font-medium">Assignments</span>
                          <div className="flex items-center gap-1.5 text-white font-bold">
                            <FileText className="w-3.5 h-3.5 text-blue-400" />
                            {cls.assignments || 0}
                          </div>
                        </div>
                        <div className="bg-black/30 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                          <span className="text-xs text-gray-500 font-medium">Completed</span>
                          <div className="flex items-center gap-1.5 text-white font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            {cls.completed || 0}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-5 border-t border-white/5 z-10 relative mt-auto">
                      <div className="flex justify-between items-center mb-2.5">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Progress</span>
                        <span className="text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/5">
                          {cls.progress || 0}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out group-hover:shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                          style={{ width: `${cls.progress || 0}%` }}
                        />
                      </div>
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
