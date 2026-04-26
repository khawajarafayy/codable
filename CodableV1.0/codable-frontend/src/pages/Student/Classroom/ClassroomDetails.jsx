import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  FileText,
  AlertCircle,
  Loader,
  User,
  Mail,
  Target,
  PlayCircle,
  X,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  GraduationCap,
  MessageSquare
} from "lucide-react";
import { request, api } from "../../../services/apiClient";
import ChatSection from "../../../components/Chat/ChatSection";

function mapStudentAssignment(row) {
  return {
    id: String(row._id),
    title: row.title || "Assignment",
    description: row.description || "",
    deadline: row.deadline,
    points: typeof row.points === "number" ? row.points : row.mcqs?.length ?? 0,
    difficulty: row.difficulty,
    topics: Array.isArray(row.topics) ? row.topics : [],
    mcqCount: Array.isArray(row.mcqs) ? row.mcqs.length : 0,
    hasSubmitted: Boolean(row.hasSubmitted),
    submissionSummary: row.submissionSummary || null,
  };
}

export default function ClassroomDetails() {
  const { classId } = useParams();

  const [currentClass, setCurrentClass] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [assignmentDetail, setAssignmentDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [activeTab, setActiveTab] = useState("assignments"); // "assignments" or "chat"

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please log in to view class details");
          setLoading(false);
          return;
        }

        const authHeaders = { Authorization: `Bearer ${token}` };

        // Fetch User Profile
        try {
          const profileRes = await api.getStudentProfile();
          if (profileRes && profileRes.data && !cancelled) {
            setProfile(profileRes.data);
          }
        } catch (err) {
          console.error("Failed to fetch profile", err);
        }

        const classRes = await request(`/api/student-class/classes/${classId}`, {
          method: "GET",
          headers: authHeaders,
        });

        if (!classRes.success || !classRes.data) {
          throw new Error(classRes.message || "Failed to load class details");
        }

        if (cancelled) return;
        setCurrentClass(classRes.data);

        let list = [];
        try {
          const asgRes = await request(`/api/student-class/classes/${classId}/assignments`, {
            method: "GET",
            headers: authHeaders,
          });
          if (asgRes.success && Array.isArray(asgRes.data)) {
            list = asgRes.data.map(mapStudentAssignment);
          }
        } catch {
          list = [];
        }

        if (!cancelled) setAssignments(list);
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching class data:", err);
          setError(err.payload?.message || err.message || "Failed to load class details");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    setError(null);
    fetchData();

    return () => {
      cancelled = true;
    };
  }, [classId]);

  const isOverdue = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const closeAssignmentModal = () => {
    setSelectedAssignmentId(null);
    setAssignmentDetail(null);
    setDetailError(null);
    setQuizStarted(false);
    setAnswers({});
    setSubmitting(false);
    setSubmitResult(null);
  };

  const openAssignment = async (assignmentId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setSelectedAssignmentId(assignmentId);
    setAssignmentDetail(null);
    setDetailLoading(true);
    setDetailError(null);
    setQuizStarted(false);
    setAnswers({});
    setSubmitResult(null);

    try {
      const res = await request(`/api/student-class/classes/${classId}/assignments/${assignmentId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load assignment");
      }
      setAssignmentDetail(res.data);
    } catch (err) {
      setDetailError(err.payload?.message || err.message || "Failed to load assignment");
    } finally {
      setDetailLoading(false);
    }
  };

  const selectAnswer = (questionIndex, option) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: option }));
  };

  const submitAssignment = async () => {
    if (!selectedAssignmentId || !assignmentDetail) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const mcqs = assignmentDetail.mcqs || [];
    const missing = mcqs.filter((_, i) => {
      const v = answers[i];
      return !v || !["A", "B", "C", "D"].includes(String(v).trim().toUpperCase());
    });
    if (missing.length > 0) {
      setDetailError(`Please answer all ${mcqs.length} questions before submitting.`);
      return;
    }

    setSubmitting(true);
    setDetailError(null);
    try {
      const res = await request(
        `/api/student-class/classes/${classId}/assignments/${selectedAssignmentId}/submit`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: { answers },
        }
      );

      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to submit assignment");
      }

      setSubmitResult(res.data);
      setQuizStarted(false);
      setAssignmentDetail((prev) =>
        prev
          ? {
              ...prev,
              hasSubmitted: true,
              submissionSummary: {
                score: res.data.score,
                totalQuestions: res.data.totalQuestions,
                percentage: res.data.percentage,
                submittedAt: res.data.submittedAt,
              },
            }
          : prev
      );
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === selectedAssignmentId
            ? {
                ...a,
                hasSubmitted: true,
                submissionSummary: {
                  score: res.data.score,
                  totalQuestions: res.data.totalQuestions,
                  percentage: res.data.percentage,
                  submittedAt: res.data.submittedAt,
                },
              }
            : a
        )
      );
    } catch (err) {
      setDetailError(err.payload?.message || err.message || "Failed to submit assignment");
    } finally {
      setSubmitting(false);
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

  if (error || !currentClass) {
    return (
      <div className="min-h-screen bg-[#05050A] flex items-center justify-center">
        <div className="text-center p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <p className="text-gray-300 text-lg mb-6">{error || "Class not found"}</p>
          <Link
            to="/classroom"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Classroom
          </Link>
        </div>
      </div>
    );
  }

  const pendingCount = assignments.filter((a) => !a.hasSubmitted).length;

  const getInitials = () => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    }
    return (profile?.firstName?.[0] || profile?.name?.[0] || 'S').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#05050A] text-white overflow-hidden relative selection:bg-blue-500/30 pb-20">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-10 animate-in fade-in duration-700">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white/[0.02] border border-white/5 p-6 rounded-3xl backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col">
            <Link
              to="/classroom"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4 transition-colors w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-semibold">Back to Classes</span>
            </Link>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-2">
                  {currentClass.className}
                </h1>
                {currentClass.category && (
                  <span className="inline-block px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold uppercase tracking-wider">
                    {currentClass.category}
                  </span>
                )}
              </div>
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
        </div>

        {/* Info & Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Instructor Card */}
          <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full group-hover:bg-blue-500/20 transition-colors" />
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <User className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-300">Instructor</h2>
            </div>
            <p className="text-2xl font-bold text-white mb-2 relative z-10">{currentClass.instructorName}</p>
            {currentClass.instructorEmail && (
              <div className="flex items-center gap-2 text-sm text-gray-400 relative z-10 bg-black/30 w-fit px-4 py-2 rounded-xl border border-white/5">
                <Mail className="w-4 h-4 text-blue-400" />
                <span>{currentClass.instructorEmail}</span>
              </div>
            )}
            {currentClass.description && (
              <p className="mt-6 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4 relative z-10">
                {currentClass.description}
              </p>
            )}
          </div>

          {/* Pending Assignments Stat */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:opacity-20 transition-opacity">
              <FileText className="w-48 h-48 text-purple-500" />
            </div>
            <div className="p-3 rounded-xl bg-purple-500/20 w-fit mb-6 relative z-10 border border-purple-500/30">
              <FileText className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2 relative z-10">Open Assignments</p>
            <p className="text-5xl font-extrabold text-white mb-3 relative z-10 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">{pendingCount}</p>
            <p className="text-sm text-purple-200/60 relative z-10">Published work waiting to be completed</p>
          </div>

          {/* Classmates Stat */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:opacity-20 transition-opacity">
              <User className="w-48 h-48 text-emerald-500" />
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/20 w-fit mb-6 relative z-10 border border-emerald-500/30">
              <User className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2 relative z-10">Classmates</p>
            <p className="text-5xl font-extrabold text-white mb-3 relative z-10 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">{currentClass.enrolledStudents ?? "—"}</p>
            <p className="text-sm text-emerald-200/60 relative z-10">Students enrolled in this class</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-white/10">
          <button
            onClick={() => setActiveTab("assignments")}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-all duration-200 border-b-2 ${
              activeTab === "assignments"
                ? "text-amber-400 border-amber-400"
                : "text-[#fdfdff]/60 hover:text-[#fdfdff] border-transparent hover:border-white/20"
            }`}
          >
            <Target className="w-4 h-4" />
            Assignments
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-all duration-200 border-b-2 ${
              activeTab === "chat"
                ? "text-purple-400 border-purple-400"
                : "text-[#fdfdff]/60 hover:text-[#fdfdff] border-transparent hover:border-white/20"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>
        </div>

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <div className="min-h-[600px]">
            <ChatSection classId={classId} className={currentClass.className} />
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === "assignments" && (
          <div className="pt-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Target className="w-6 h-6 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">Course Assignments</h2>
          </div>

          {assignments.length === 0 ? (
            <div className="p-16 rounded-3xl bg-white/[0.02] border border-white/5 border-dashed flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Assignments Yet</h3>
              <p className="text-gray-400 max-w-sm">Your instructor hasn't published any assignments for this class. Check back later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {assignments.map((assignment, index) => {
                const overdue = isOverdue(assignment.deadline);
                const isCompleted = assignment.hasSubmitted;
                
                return (
                  <button
                    type="button"
                    key={assignment.id}
                    onClick={() => openAssignment(assignment.id)}
                    className={`group text-left p-1 rounded-3xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 hover:-translate-y-1 shadow-xl relative overflow-hidden ${
                      isCompleted 
                        ? 'bg-gradient-to-b from-emerald-500/20 to-transparent hover:from-emerald-500/40 hover:shadow-emerald-500/20' 
                        : 'bg-gradient-to-b from-amber-500/20 to-transparent hover:from-amber-500/40 hover:shadow-amber-500/20'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="h-full bg-[#0A0A10] p-6 sm:p-8 rounded-[22px] border border-white/5 relative z-10 flex flex-col">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <h3 className={`text-xl font-bold mb-2 group-hover:text-white transition-colors ${isCompleted ? 'text-emerald-50' : 'text-amber-50'}`}>
                            {assignment.title}
                          </h3>
                          {assignment.description && (
                            <p className="text-sm text-gray-400 line-clamp-2">{assignment.description}</p>
                          )}
                        </div>
                        <span className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                            isCompleted
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {isCompleted ? "Completed" : "Pending"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mt-auto pt-6">
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                          <Calendar className="w-4 h-4 text-blue-400" />
                          <span className={overdue && !isCompleted ? "text-rose-400 font-semibold" : ""}>
                            {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}) : "No due date"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                          <Target className="w-4 h-4 text-purple-400" />
                          <span className="font-semibold text-gray-300">{assignment.points} pts</span>
                        </div>
                        {assignment.mcqCount > 0 && (
                          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                            <FileText className="w-4 h-4 text-emerald-400" />
                            <span className="font-semibold text-gray-300">{assignment.mcqCount} Qs</span>
                          </div>
                        )}
                      </div>
                      
                      {assignment.topics.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                          <p className="text-xs text-gray-500 font-medium line-clamp-1">
                            <span className="text-gray-400 mr-2">Topics:</span>
                            {assignment.topics.join(", ")}
                          </p>
                        </div>
                      )}
                      
                      <div className="absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full transition-colors pointer-events-none -z-10 group-hover:opacity-50 opacity-20 bg-blue-500" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Assignment Detail & Quiz Modal */}
      {selectedAssignmentId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300 backdrop-blur-md bg-black/60">
          <div className="absolute inset-0 z-0" onClick={closeAssignmentModal} />

          <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-3xl border border-white/10 bg-[#0A0A10] shadow-[0_0_50px_rgba(0,0,0,0.8)] pointer-events-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 sm:p-8 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30 text-blue-400">
                  <FileText className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-white pr-4">
                  {assignmentDetail ? assignmentDetail.title : 'Loading...'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeAssignmentModal}
                className="p-3 rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
              {detailLoading ? (
                <div className="py-32 flex flex-col items-center justify-center">
                  <Loader className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                  <p className="text-gray-400 font-medium">Fetching assignment details...</p>
                </div>
              ) : detailError ? (
                <div className="py-20 text-center bg-rose-500/5 rounded-3xl border border-rose-500/20">
                  <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                  <p className="text-rose-200 text-lg">{detailError}</p>
                </div>
              ) : assignmentDetail ? (
                <div className="space-y-8">
                  {assignmentDetail.description && (
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                      <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{assignmentDetail.description}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-semibold text-blue-200">
                        Due: {assignmentDetail.deadline ? new Date(assignmentDetail.deadline).toLocaleString() : "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-xl">
                      <Target className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-semibold text-purple-200">
                        Questions: {assignmentDetail.mcqs?.length || 0}
                      </span>
                    </div>
                    {(submitResult || assignmentDetail.submissionSummary) && (
                      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-bold text-emerald-400">
                          Score: {(submitResult?.score ?? assignmentDetail.submissionSummary?.score) ?? "0"}/
                          {(submitResult?.totalQuestions ?? assignmentDetail.submissionSummary?.totalQuestions) ?? "0"} 
                          ({(submitResult?.percentage ?? assignmentDetail.submissionSummary?.percentage) ?? "0"}%)
                        </span>
                      </div>
                    )}
                  </div>

                  {!quizStarted ? (
                    <div className="mt-8">
                      {submitResult || assignmentDetail.hasSubmitted ? (
                        <div className="text-center py-12 bg-gradient-to-b from-emerald-500/10 to-transparent rounded-3xl border border-emerald-500/20">
                          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2">Assignment Completed</h3>
                          <p className="text-gray-400 mb-6">
                            Submitted on {new Date(submitResult?.submittedAt || assignmentDetail.submissionSummary?.submittedAt || Date.now()).toLocaleString()}
                          </p>
                          {(submitResult?.score != null || assignmentDetail.submissionSummary?.score != null) && (
                            <div className="inline-block px-8 py-4 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl">
                              <p className="text-emerald-400 font-extrabold text-2xl">
                                Score: {submitResult?.score ?? assignmentDetail.submissionSummary?.score} / {submitResult?.totalQuestions ?? assignmentDetail.submissionSummary?.totalQuestions}
                              </p>
                              <p className="text-emerald-300/80 font-semibold mt-1">
                                {submitResult?.percentage ?? assignmentDetail.submissionSummary?.percentage}% Accuracy
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-white/[0.02] rounded-3xl border border-white/5">
                          <h3 className="text-xl font-bold text-white mb-3">Ready to begin?</h3>
                          <p className="text-gray-400 max-w-md mx-auto mb-8">
                            Make sure you have enough time to complete this assignment. You can only submit your answers once.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setDetailError(null);
                              setQuizStarted(true);
                            }}
                            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-black font-bold hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <PlayCircle className="w-6 h-6" />
                            Start Assignment
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6 mt-8">
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-200 text-sm font-medium flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        Please answer all questions before submitting. Unanswered questions will be marked wrong.
                      </div>
                      
                      {(assignmentDetail.mcqs || []).map((question, qIndex) => (
                        <div key={question.id || qIndex} className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-white/20 transition-colors">
                          <p className="text-lg font-semibold text-white mb-6">
                            <span className="text-blue-400 mr-2">Q{qIndex + 1}.</span> {question.question}
                          </p>
                          <div className="space-y-3">
                            {["A", "B", "C", "D"].map((optionKey) => (
                              <label
                                key={optionKey}
                                className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border ${
                                  answers[qIndex] === optionKey
                                    ? "bg-blue-500/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                                    : "bg-black/40 border-white/10 hover:bg-white/10 hover:border-white/20"
                                }`}
                              >
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                  answers[qIndex] === optionKey ? 'border-blue-400' : 'border-gray-500'
                                }`}>
                                  {answers[qIndex] === optionKey && <div className="w-3 h-3 bg-blue-400 rounded-full" />}
                                </div>
                                <input
                                  type="radio"
                                  name={`question-${qIndex}`}
                                  value={optionKey}
                                  checked={answers[qIndex] === optionKey}
                                  onChange={() => selectAnswer(qIndex, optionKey)}
                                  className="hidden"
                                />
                                <span className={`font-medium ${answers[qIndex] === optionKey ? 'text-blue-100' : 'text-gray-300'}`}>
                                  <span className="font-bold text-gray-500 mr-2">{optionKey})</span> 
                                  {question.options?.[optionKey] || "—"}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Sticky Action Footer */}
                      <div className="sticky bottom-0 mt-8 p-4 sm:p-6 bg-[#0A0A10]/90 backdrop-blur-xl border-t border-white/10 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <span className="text-gray-400 font-medium">
                          Answered: {Object.keys(answers).length} / {assignmentDetail.mcqs?.length || 0}
                        </span>
                        <div className="flex gap-3 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => setQuizStarted(false)}
                            disabled={submitting}
                            className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={submitAssignment}
                            disabled={submitting}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                          >
                            {submitting ? "Submitting..." : "Submit Answers"}
                            {!submitting && <ChevronRight className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}} />
    </div>
  </div>
  );
}
