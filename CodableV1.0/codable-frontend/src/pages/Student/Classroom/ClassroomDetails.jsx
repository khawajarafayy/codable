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
} from "lucide-react";
import { request } from "../../../services/apiClient";

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
      <div className="min-h-screen bg-gradient-to-br from-[#0A1428] via-[#0F1B2D] to-[#040B1D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center h-96">
          <div className="text-center">
            <Loader className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
            <p className="text-[#fdfdff]/60">Loading class details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !currentClass) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1428] via-[#0F1B2D] to-[#040B1D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
            <p className="text-[#fdfdff]/60">{error || "Class not found"}</p>
            <Link
              to="/classroom"
              className="mt-4 inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Classroom
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pendingCount = assignments.filter((a) => !a.hasSubmitted).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1428] via-[#0F1B2D] to-[#040B1D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-500">
        <div>
          <Link
            to="/classroom"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Classroom</span>
          </Link>

          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-bold text-[#fdfdff] mb-2">{currentClass.className}</h1>
              {currentClass.description && (
                <p className="text-[#fdfdff]/60 max-w-2xl">{currentClass.description}</p>
              )}
              {currentClass.category && (
                <span className="inline-block mt-3 px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-medium">
                  {currentClass.category}
                </span>
              )}
            </div>

            <div className="p-6 rounded-2xl backdrop-blur-sm bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-[#fdfdff]">Instructor</h2>
              </div>
              <p className="text-xl font-medium text-[#fdfdff]">{currentClass.instructorName}</p>
              {currentClass.instructorEmail && (
                <div className="mt-2 flex items-center gap-2 text-sm text-[#fdfdff]/65">
                  <Mail className="w-4 h-4 shrink-0 text-blue-400/80" />
                  <span>{currentClass.instructorEmail}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="relative p-6 rounded-2xl backdrop-blur-sm bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/15 transition-transform duration-300">
            <div className="p-3 rounded-xl bg-purple-500/20 w-fit mb-4">
              <FileText className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-[#fdfdff]/60 text-sm mb-1">Open assignments</p>
            <p className="text-3xl font-bold text-[#fdfdff]">{pendingCount}</p>
            <p className="text-xs text-[#fdfdff]/45 mt-2">Published work from your instructor</p>
          </div>
          <div className="relative p-6 rounded-2xl backdrop-blur-sm bg-emerald-500/10 border border-emerald-500/30">
            <div className="p-3 rounded-xl bg-emerald-500/20 w-fit mb-4">
              <BookOpen className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-[#fdfdff]/60 text-sm mb-1">Classmates</p>
            <p className="text-3xl font-bold text-[#fdfdff]">{currentClass.enrolledStudents ?? "—"}</p>
            <p className="text-xs text-[#fdfdff]/45 mt-2">Enrolled in this class</p>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-2xl font-semibold text-[#fdfdff]">Pending assignments</h2>
          </div>

          {assignments.length === 0 ? (
            <div className="p-8 rounded-2xl backdrop-blur-sm bg-purple-500/5 border border-purple-500/20 text-center">
              <p className="text-[#fdfdff]/60">No open assignments right now. Check back later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((assignment, index) => {
                const overdue = isOverdue(assignment.deadline);
                return (
                  <button
                    type="button"
                    key={assignment.id}
                    onClick={() => openAssignment(assignment.id)}
                    className="w-full text-left cursor-pointer p-6 rounded-2xl backdrop-blur-sm bg-amber-500/10 border border-amber-500/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:border-amber-400/50 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-[#fdfdff] leading-snug">{assignment.title}</h3>
                        {assignment.description ? (
                          <p className="text-sm text-[#fdfdff]/55 mt-1 line-clamp-2">{assignment.description}</p>
                        ) : null}
                      </div>
                      <span
                        className={`shrink-0 px-3 py-1 rounded-lg text-xs font-medium border ${
                          assignment.hasSubmitted
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/35"
                            : "bg-amber-500/25 text-amber-300 border-amber-500/35"
                        }`}
                      >
                        {assignment.hasSubmitted ? "Submitted" : "Pending"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#fdfdff]/60">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span>
                          Due:{" "}
                          {assignment.deadline
                            ? new Date(assignment.deadline).toLocaleDateString()
                            : "—"}
                        </span>
                        {overdue && (
                          <span className="ml-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-xs font-medium">
                            Overdue
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Target className="w-4 h-4 shrink-0" />
                        <span>{assignment.points} pts</span>
                      </div>
                      {assignment.difficulty && (
                        <span className="text-xs text-[#fdfdff]/45">Difficulty: {assignment.difficulty}</span>
                      )}
                    </div>

                    {assignment.mcqCount > 0 && (
                      <p className="text-xs text-[#fdfdff]/45 mt-3">
                        {assignment.mcqCount} multiple-choice question{assignment.mcqCount !== 1 ? "s" : ""}
                      </p>
                    )}
                    {assignment.topics.length > 0 && (
                      <p className="text-xs text-purple-300/70 mt-2 line-clamp-2">
                        Topics: {assignment.topics.join(", ")}
                      </p>
                    )}
                    <p className="text-xs text-blue-300/75 mt-3">Click to view and attempt assignment</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedAssignmentId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <button
            type="button"
            onClick={closeAssignmentModal}
            className="absolute inset-0 z-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close assignment modal"
          />

          <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-blue-500/35 bg-[#071326] p-6 sm:p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)] pointer-events-auto">
            <button
              type="button"
              onClick={closeAssignmentModal}
              className="absolute right-4 top-4 p-2 rounded-lg text-[#fdfdff]/70 hover:bg-white/10"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {detailLoading ? (
              <div className="py-20 text-center">
                <Loader className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
                <p className="text-[#fdfdff]/60">Loading assignment...</p>
              </div>
            ) : detailError ? (
              <div className="py-8 text-center">
                <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
                <p className="text-[#fdfdff]/70">{detailError}</p>
              </div>
            ) : assignmentDetail ? (
              <div>
                <h2 className="text-2xl font-bold text-[#fdfdff] mb-2">{assignmentDetail.title}</h2>
                {assignmentDetail.description && (
                  <p className="text-[#fdfdff]/70 mb-4">{assignmentDetail.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-sm text-[#fdfdff]/65 mb-6">
                  <span>
                    Due: {assignmentDetail.deadline ? new Date(assignmentDetail.deadline).toLocaleString() : "—"}
                  </span>
                  <span>Questions: {assignmentDetail.mcqs?.length || 0}</span>
                  {(submitResult || assignmentDetail.submissionSummary) && (
                    <span className="text-emerald-300">
                      Score:{" "}
                      {(submitResult?.score ?? assignmentDetail.submissionSummary?.score) ?? "—"}/
                      {(submitResult?.totalQuestions ?? assignmentDetail.submissionSummary?.totalQuestions) ?? "—"} (
                      {(submitResult?.percentage ?? assignmentDetail.submissionSummary?.percentage) ?? "—"}%)
                    </span>
                  )}
                </div>

                {detailError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-sm text-rose-200">
                    {detailError}
                  </div>
                )}

                {!quizStarted ? (
                  <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5">
                    {submitResult || assignmentDetail.hasSubmitted ? (
                      <div className="text-center py-4">
                        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                        <p className="text-[#fdfdff] font-medium">Assignment submitted</p>
                        <p className="text-[#fdfdff]/65 text-sm mt-1">
                          Submitted on{" "}
                          {new Date(
                            submitResult?.submittedAt ||
                              assignmentDetail.submissionSummary?.submittedAt ||
                              Date.now()
                          ).toLocaleString()}
                        </p>
                        {(submitResult?.score != null || assignmentDetail.submissionSummary?.score != null) && (
                          <p className="text-emerald-300 font-semibold mt-3 text-lg">
                            Your score: {submitResult?.score ?? assignmentDetail.submissionSummary?.score}/
                            {submitResult?.totalQuestions ?? assignmentDetail.submissionSummary?.totalQuestions} (
                            {submitResult?.percentage ?? assignmentDetail.submissionSummary?.percentage}%)
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-3">
                        <p className="text-[#fdfdff]/80 mb-4">
                          Start when you are ready. You can submit this assignment once.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setDetailError(null);
                            setQuizStarted(true);
                          }}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500/25 hover:bg-blue-500/35 text-blue-200 border border-blue-500/40"
                        >
                          <PlayCircle className="w-4 h-4" />
                          Start assignment
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(assignmentDetail.mcqs || []).map((question, qIndex) => (
                      <div key={question.id || qIndex} className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-[#fdfdff] font-medium mb-3">
                          {qIndex + 1}. {question.question}
                        </p>
                        <div className="space-y-2">
                          {["A", "B", "C", "D"].map((optionKey) => (
                            <label
                              key={optionKey}
                              className="flex items-center gap-3 text-sm text-[#fdfdff]/80 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name={`question-${qIndex}`}
                                value={optionKey}
                                checked={answers[qIndex] === optionKey}
                                onChange={() => selectAnswer(qIndex, optionKey)}
                                className="accent-blue-500"
                              />
                              <span>
                                {optionKey}) {question.options?.[optionKey] || "—"}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => setQuizStarted(false)}
                        disabled={submitting}
                        className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-[#fdfdff]/85"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={submitAssignment}
                        disabled={submitting}
                        className="px-5 py-2.5 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/35 disabled:opacity-60 text-emerald-200 border border-emerald-500/40"
                      >
                        {submitting ? "Submitting..." : "Submit assignment"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
