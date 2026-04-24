import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  FileText,
  Calendar,
  Plus,
  X,
  Clock,
  CheckCircle2,
  Loader,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Send,
  Trash2,
  Eye,
  Bell,
} from "lucide-react";
import { request } from "../../../../services/apiClient";
import { useAuth } from "../../../../context/AuthContext";

const RAG_API_BASE = (import.meta.env.VITE_RAG_API_URL ?? "http://localhost:5001").replace(/\/$/, "");

function mapAssignmentFromApi(row, classesById) {
  const cid = String(row.classId?._id ?? row.classId ?? "");
  const cls = classesById[cid];
  const totalStudents = cls?.students?.length ?? 0;
  const published = row.status === "published";
  return {
    id: String(row._id),
    classId: cid,
    className: row.className || cls?.className || "",
    topic: row.title,
    deadline: row.deadline ? new Date(row.deadline).toISOString().split("T")[0] : "",
    status: published ? "active" : row.status === "draft" ? "draft" : row.status || "draft",
    isDraft: row.status === "draft",
    submissions: row.submissions ?? 0,
    total: published ? totalStudents : 0,
    topics: row.topics || [],
    difficulty: row.difficulty,
    mcqs: row.mcqs || [],
    ragMeta: row.ragMeta,
  };
}

function defaultDeadline() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}

export default function Assignments() {
  const { user, isLoading: authLoading } = useAuth();
  const [instructorClasses, setInstructorClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [classesError, setClassesError] = useState(null);
  const [assignments, setAssignments] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ragTargetClassId, setRagTargetClassId] = useState("");
  const [ragChapters, setRagChapters] = useState([]);
  const [ragChaptersLoading, setRagChaptersLoading] = useState(false);
  const [selectedChapterIds, setSelectedChapterIds] = useState([]);
  const [ragDifficulty, setRagDifficulty] = useState("M");
  const [numMcqs, setNumMcqs] = useState(5);
  const [assignmentDeadline, setAssignmentDeadline] = useState("");
  const [ragGenerating, setRagGenerating] = useState(false);
  const [ragError, setRagError] = useState(null);
  const [expandedAssignmentId, setExpandedAssignmentId] = useState(null);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [reportModalAssignment, setReportModalAssignment] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [submissionNotice, setSubmissionNotice] = useState("");
  const previousSubmissionCountsRef = useRef({});

  const fetchAssignmentsFromApi = useCallback(async () => {
    if (!user?.token) return;
    setAssignmentsLoading(true);
    try {
      const res = await request("/api/classes/assignments/all", {
        method: "GET",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!res.success || !Array.isArray(res.data)) {
        setAssignments([]);
        return;
      }
      const byId = Object.fromEntries((instructorClasses || []).map((c) => [String(c._id), c]));
      const mapped = res.data.map((row) => mapAssignmentFromApi(row, byId));

      const previous = previousSubmissionCountsRef.current;
      let detectedNotice = "";
      const nextCounts = {};
      mapped.forEach((assignment) => {
        nextCounts[assignment.id] = assignment.submissions;
        if ((previous[assignment.id] ?? 0) < assignment.submissions) {
          const delta = assignment.submissions - (previous[assignment.id] ?? 0);
          detectedNotice = `${assignment.topic}: ${delta} new submission${delta > 1 ? "s" : ""}`;
        }
      });

      previousSubmissionCountsRef.current = nextCounts;
      if (detectedNotice) {
        setSubmissionNotice(detectedNotice);
      }

      setAssignments(mapped);
    } catch {
      setAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  }, [user?.token, instructorClasses]);

  useEffect(() => {
    if (!user?.token) return undefined;

    const intervalId = setInterval(() => {
      fetchAssignmentsFromApi();
    }, 20000);

    return () => clearInterval(intervalId);
  }, [user?.token, fetchAssignmentsFromApi]);

  useEffect(() => {
    if (!user?.token) return undefined;

    const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");
    const wsUrl = apiBase.replace(/^http/, "ws");
    const ws = new WebSocket(`${wsUrl}/ws/notifications?token=${encodeURIComponent(user.token)}`);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "assignment_submission" && msg.data) {
          setSubmissionNotice(
            `${msg.data.studentName || "A student"} submitted "${msg.data.assignmentTitle || "Assignment"}" — ${msg.data.score}/${msg.data.totalQuestions} (${msg.data.percentage}%)`
          );
          fetchAssignmentsFromApi();
        }
      } catch {
        /* ignore */
      }
    };

    ws.onerror = () => {};
    return () => {
      try {
        ws.close();
      } catch {
        /* ignore */
      }
    };
  }, [user?.token, fetchAssignmentsFromApi]);

  useEffect(() => {
    if (authLoading || !user?.token || classesLoading) return;
    fetchAssignmentsFromApi();
  }, [authLoading, user?.token, classesLoading, fetchAssignmentsFromApi]);

  const fetchInstructorClasses = useCallback(async () => {
    if (!user?.token) {
      setClassesLoading(false);
      return;
    }
    setClassesLoading(true);
    setClassesError(null);
    try {
      const response = await request("/api/classes/instructor", {
        method: "GET",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (response.success && Array.isArray(response.data)) {
        setInstructorClasses(response.data);
      } else {
        setClassesError(response.message || "Failed to load classes");
        setInstructorClasses([]);
      }
    } catch (err) {
      setClassesError(err.payload?.message || err.message || "Failed to load classes");
      setInstructorClasses([]);
    } finally {
      setClassesLoading(false);
    }
  }, [user?.token]);

  useEffect(() => {
    if (authLoading) return;
    if (user?.token) {
      fetchInstructorClasses();
    } else {
      setClassesLoading(false);
    }
  }, [authLoading, user?.token, fetchInstructorClasses]);

  const fetchRagChapters = async () => {
    setRagChaptersLoading(true);
    try {
      const res = await fetch(`${RAG_API_BASE}/api/chapters`);
      const data = await res.json();
      if (data.success && Array.isArray(data.chapters)) {
        setRagChapters([...data.chapters].sort((a, b) => a.id - b.id));
      } else {
        setRagChapters([]);
        setRagError(data.error || "Could not load chapters from the RAG service.");
      }
    } catch (e) {
      console.error(e);
      setRagChapters([]);
      setRagError(
        `Cannot reach RAG API at ${RAG_API_BASE}. Start Flask from rag-main/rag, or set VITE_RAG_API_URL.`
      );
    } finally {
      setRagChaptersLoading(false);
    }
  };

  useEffect(() => {
    if (!isModalOpen) return;
    setRagError(null);
    fetchRagChapters();
    setSelectedChapterIds([]);
    if (instructorClasses.length === 1) {
      setRagTargetClassId(instructorClasses[0]._id);
    }
  }, [isModalOpen, instructorClasses.length]);

  const toggleChapterId = (chapterNumericId) => {
    setSelectedChapterIds((prev) =>
      prev.includes(chapterNumericId)
        ? prev.filter((id) => id !== chapterNumericId)
        : [...prev, chapterNumericId]
    );
  };

  const resolveClassName = (classId, fallback) => {
    const c = instructorClasses.find((x) => x._id === classId);
    return c?.className || fallback || "Class";
  };

  const handleGenerateRagAssignment = async () => {
    setRagError(null);
    if (!ragTargetClassId) {
      setRagError("Select a class for this assignment.");
      return;
    }
    if (selectedChapterIds.length === 0) {
      setRagError("Select at least one chapter from the RAG curriculum.");
      return;
    }
    const deadline = assignmentDeadline.trim() || defaultDeadline();
    const numQ = Math.min(50, Math.max(1, Number(numMcqs) || 5));

    setRagGenerating(true);
    try {
      const res = await fetch(`${RAG_API_BASE}/api/generate-mcq-assignment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapter_ids: selectedChapterIds,
          difficulty: ragDifficulty,
          num_questions: numQ,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success || !Array.isArray(data.mcqs) || data.mcqs.length === 0) {
        setRagError(data.error || data.message || `Generation failed (${res.status})`);
        return;
      }

      const chapterTitles = Array.isArray(data.chapter_titles) ? data.chapter_titles : [];
      const title = `MCQ quiz — ${chapterTitles.slice(0, 2).join(", ")}${
        chapterTitles.length > 2 ? ` +${chapterTitles.length - 2}` : ""
      }`;

      const createRes = await request(`/api/classes/${ragTargetClassId}/assignments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}` },
        body: {
          title,
          deadline,
          status: "draft",
          difficulty: ragDifficulty,
          chapterIds: selectedChapterIds,
          topics: chapterTitles.length ? chapterTitles : selectedChapterIds.map(String),
          mcqs: data.mcqs,
          ragMeta: data.meta,
          points: data.mcqs.length,
        },
      });

      if (!createRes.success) {
        setRagError(createRes.message || "Failed to save assignment");
        return;
      }

      await fetchAssignmentsFromApi();
      setIsModalOpen(false);
      setSelectedChapterIds([]);
      setAssignmentDeadline("");
      setNumMcqs(5);
    } catch (err) {
      setRagError(err.message || "Request failed");
    } finally {
      setRagGenerating(false);
    }
  };

  const pushAssignmentToClass = async (assignment) => {
    const cid = assignment.classId || assignment.targetClassId;
    try {
      await request(`/api/classes/${cid}/assignments/${assignment.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${user.token}` },
        body: { status: "published" },
      });
      await fetchAssignmentsFromApi();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAssignment = async (id) => {
    const a = assignments.find((x) => x.id === id);
    if (!a?.classId) return;
    try {
      await request(`/api/classes/${a.classId}/assignments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      await fetchAssignmentsFromApi();
    } catch (err) {
      console.error(err);
    }
  };

  const viewSubmissionReport = async (assignment) => {
    if (!assignment?.classId) return;
    setReportModalAssignment(assignment);
    setReportLoading(true);
    setReportError(null);
    setReportData(null);

    try {
      const response = await request(
        `/api/classes/${assignment.classId}/assignments/${assignment.id}/submissions`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to load report");
      }

      setReportData(response.data);
    } catch (err) {
      setReportError(err.payload?.message || err.message || "Failed to load report");
    } finally {
      setReportLoading(false);
    }
  };

  const grouped = useMemo(() => {
    const map = new Map();
    for (const a of assignments) {
      const key = a.classId || a.className || "unknown";
      const label = resolveClassName(a.classId, a.className);
      if (!map.has(key)) map.set(key, { label, items: [] });
      map.get(key).items.push(a);
    }
    return Array.from(map.entries()).map(([key, v]) => ({ key, ...v }));
  }, [assignments, instructorClasses]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <Loader className="w-10 h-10 text-purple-400 animate-spin" />
        <p className="text-[#fdfdff]/60">Loading…</p>
      </div>
    );
  }

  if (!user?.token) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm">
        Sign in as an instructor to manage assignments.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#fdfdff] mb-2">Assignments</h1>
          <p className="text-[#fdfdff]/60">
            Create MCQ sets with the RAG service, then push them to a class. Lists your real classes from the
            server.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setRagError(null);
            setIsModalOpen(true);
          }}
          disabled={classesLoading || instructorClasses.length === 0}
          className="group relative px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-40 text-purple-400 rounded-2xl border border-purple-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] flex items-center gap-2 shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Create with RAG</span>
        </button>
      </div>

      {classesError && (
        <div className="flex items-start gap-2 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-sm text-rose-200">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{classesError}</span>
        </div>
      )}

      {classesLoading && (
        <div className="flex items-center gap-2 text-[#fdfdff]/60 text-sm">
          <Loader className="w-4 h-4 animate-spin" />
          Loading your classes…
        </div>
      )}

      {submissionNotice && (
        <div className="flex items-start justify-between gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-200">
          <div className="flex items-start gap-2">
            <Bell className="w-5 h-5 shrink-0 mt-0.5" />
            <span>New assignment submission received: {submissionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSubmissionNotice("")}
            className="text-emerald-200/80 hover:text-emerald-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {assignmentsLoading && !classesLoading && (
        <div className="flex items-center gap-2 text-[#fdfdff]/60 text-sm">
          <Loader className="w-4 h-4 animate-spin" />
          Syncing assignments…
        </div>
      )}

      {!classesLoading && instructorClasses.length === 0 && !classesError && (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-[#fdfdff]/60 text-sm">
          No classes yet. Create a class under Classes, then generate assignments here.
        </div>
      )}

      <div className="space-y-8">
        {grouped.length === 0 && !classesLoading && instructorClasses.length > 0 && (
          <div className="text-center py-16 text-[#fdfdff]/50">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>No assignments yet. Use Create with RAG to add an MCQ set.</p>
          </div>
        )}

        {grouped.map(({ key, label, items }) => (
          <div key={key}>
            <h2 className="text-xl font-semibold text-[#fdfdff] mb-4">{label}</h2>
            <div className="space-y-4">
              {items.map((assignment, index) => {
                const isDraft = assignment.isDraft === true;
                const isCompleted = assignment.status === "completed";
                const progress =
                  assignment.total > 0
                    ? Math.round((assignment.submissions / assignment.total) * 100)
                    : 0;
                const mcqCount = assignment.mcqs?.length ?? 0;
                const expanded = expandedAssignmentId === assignment.id;

                return (
                  <div
                    key={assignment.id}
                    className={`p-6 rounded-2xl backdrop-blur-sm transition-all duration-300 ${
                      isCompleted
                        ? "bg-emerald-500/10 border border-emerald-500/30"
                        : isDraft
                          ? "bg-amber-500/10 border border-amber-500/30"
                          : "bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/15"
                    }`}
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className={`p-2 rounded-lg shrink-0 ${
                              isCompleted ? "bg-emerald-500/20" : isDraft ? "bg-amber-500/20" : "bg-purple-500/20"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <FileText className={`w-5 h-5 ${isDraft ? "text-amber-400" : "text-purple-400"}`} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-lg font-semibold text-[#fdfdff] truncate">{assignment.topic}</h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-[#fdfdff]/60">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 shrink-0" />
                                Due: {new Date(assignment.deadline).toLocaleDateString()}
                              </span>
                              {mcqCount > 0 && (
                                <span className="text-[#fdfdff]/45">
                                  {mcqCount} MCQ{mcqCount !== 1 ? "s" : ""}
                                  {assignment.difficulty ? ` · ${assignment.difficulty}` : ""}
                                </span>
                              )}
                              {!isCompleted && !isDraft && (
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-4 h-4 shrink-0" />
                                  {assignment.submissions}/{assignment.total} submitted
                                </span>
                              )}
                            </div>
                            {assignment.topics?.length > 0 && (
                              <p className="text-xs text-[#fdfdff]/45 mt-2 line-clamp-2">
                                Chapters: {assignment.topics.join(", ")}
                              </p>
                            )}
                          </div>
                        </div>

                        {mcqCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setExpandedAssignmentId(expanded ? null : assignment.id)}
                            className="flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200 mb-2"
                          >
                            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            {expanded ? "Hide questions" : "Preview questions"}
                          </button>
                        )}

                        {expanded && assignment.mcqs?.length > 0 && (
                          <ol className="space-y-4 border-l border-purple-500/20 ml-2 pl-4 mb-3">
                            {assignment.mcqs.map((q, qi) => (
                              <li key={q.id || qi} className="text-sm text-[#fdfdff]/85">
                                <p className="font-medium text-[#fdfdff] mb-2">
                                  {qi + 1}. {q.question}
                                </p>
                                <ul className="space-y-1 font-[JetBrains_Mono] text-xs text-[#fdfdff]/70">
                                  {["A", "B", "C", "D"].map((letter) => (
                                    <li key={letter}>
                                      <span className={q.correct === letter ? "text-emerald-400 font-semibold" : ""}>
                                        {letter}) {q.options?.[letter] ?? "—"}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </li>
                            ))}
                          </ol>
                        )}

                        {!isCompleted && !isDraft && assignment.total > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-sm text-[#fdfdff]/60 mb-1">
                              <span>Submission progress</span>
                              <span className="font-[JetBrains_Mono]">{progress}%</span>
                            </div>
                            <div className="h-2 bg-purple-500/20 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                            isCompleted
                              ? "bg-emerald-500/20 text-emerald-400"
                              : isDraft
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-purple-500/20 text-purple-400"
                          }`}
                        >
                          {isCompleted ? "Completed" : isDraft ? "Draft" : "Active"}
                        </div>
                        {isDraft && (
                          <button
                            type="button"
                            onClick={() => pushAssignmentToClass(assignment)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-medium border border-emerald-500/30"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Push to class
                          </button>
                        )}
                        {!isCompleted && (
                          <div className="flex items-center gap-2">
                            {!isDraft && (
                              <button
                                type="button"
                                onClick={() => viewSubmissionReport(assignment)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-medium border border-blue-500/30"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Reports
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => deleteAssignment(assignment.id)}
                              className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setIsModalOpen(false);
              setRagError(null);
            }}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 rounded-2xl bg-[#0A1428] border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.3)]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#fdfdff]">Generate MCQ assignment</h2>
                <p className="text-sm text-[#fdfdff]/50 mt-1">
                  RAG: <code className="text-purple-300/90">{RAG_API_BASE}</code>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setRagError(null);
                }}
                className="p-2 rounded-lg hover:bg-white/10 text-[#fdfdff]/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#fdfdff]/80 mb-2">Class</label>
                <select
                  value={ragTargetClassId}
                  onChange={(e) => setRagTargetClassId(e.target.value)}
                  className="w-full px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[#fdfdff] focus:outline-none focus:border-purple-500/50"
                >
                  <option value="">Select class…</option>
                  {instructorClasses.map((c) => (
                    <option key={c._id} value={c._id} className="bg-[#0A1428]">
                      {c.className}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#fdfdff]/80 mb-2">
                  Chapters (multi-select)
                </label>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-purple-500/30 bg-purple-500/5 p-3 space-y-2">
                  {ragChaptersLoading && (
                    <div className="flex items-center justify-center gap-2 text-sm text-[#fdfdff]/50 py-6">
                      <Loader className="w-4 h-4 animate-spin" />
                      Loading chapters…
                    </div>
                  )}
                  {!ragChaptersLoading &&
                    ragChapters.map((ch) => (
                      <label key={ch.id} className="flex items-start gap-3 cursor-pointer rounded-lg p-2 hover:bg-white/5">
                        <input
                          type="checkbox"
                          checked={selectedChapterIds.includes(ch.id)}
                          onChange={() => toggleChapterId(ch.id)}
                          className="mt-1 rounded border-purple-500/50 text-purple-500"
                        />
                        <span className="text-sm text-[#fdfdff]/85">
                          <span className="text-[#fdfdff]/45 text-xs mr-2">Ch.{ch.id}</span>
                          {ch.title}
                        </span>
                      </label>
                    ))}
                </div>
                {selectedChapterIds.length > 0 && (
                  <p className="text-xs text-purple-300/80 mt-2">
                    {selectedChapterIds.length} chapter{selectedChapterIds.length !== 1 ? "s" : ""} selected
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#fdfdff]/80 mb-2">Difficulty</label>
                  <select
                    value={ragDifficulty}
                    onChange={(e) => setRagDifficulty(e.target.value)}
                    className="w-full px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[#fdfdff]"
                  >
                    <option value="L" className="bg-[#0A1428]">
                      L — Low
                    </option>
                    <option value="M" className="bg-[#0A1428]">
                      M — Medium
                    </option>
                    <option value="H" className="bg-[#0A1428]">
                      H — High
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#fdfdff]/80 mb-2">Number of MCQs</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={numMcqs}
                    onChange={(e) => setNumMcqs(e.target.value)}
                    className="w-full px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[#fdfdff] font-[JetBrains_Mono]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#fdfdff]/80 mb-2">Due date (optional)</label>
                <input
                  type="date"
                  value={assignmentDeadline}
                  onChange={(e) => setAssignmentDeadline(e.target.value)}
                  className="w-full px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[#fdfdff] font-[JetBrains_Mono]"
                />
                <p className="text-xs text-[#fdfdff]/40 mt-1">Defaults to one week from today if empty.</p>
              </div>

              {ragError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-sm text-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{ragError}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  disabled={ragGenerating}
                  onClick={handleGenerateRagAssignment}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-500/25 hover:bg-purple-500/35 disabled:opacity-50 text-purple-200 rounded-xl border border-purple-500/40 font-medium"
                >
                  {ragGenerating ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={ragGenerating}
                  onClick={() => {
                    setIsModalOpen(false);
                    setRagError(null);
                  }}
                  className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-[#fdfdff]/70 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportModalAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <button
            type="button"
            onClick={() => {
              setReportModalAssignment(null);
              setReportData(null);
              setReportError(null);
            }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Close report"
          />

          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-[#0A1428] border border-blue-500/30">
            <button
              type="button"
              onClick={() => {
                setReportModalAssignment(null);
                setReportData(null);
                setReportError(null);
              }}
              className="absolute top-3 right-3 p-2 rounded-lg hover:bg-white/10 text-[#fdfdff]/70"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-bold text-[#fdfdff] mb-2">Submission Report</h3>
            <p className="text-[#fdfdff]/60 mb-5">{reportModalAssignment.topic}</p>

            {reportLoading ? (
              <div className="py-10 text-center text-[#fdfdff]/60">
                <Loader className="w-7 h-7 animate-spin mx-auto mb-3" />
                Loading submissions...
              </div>
            ) : reportError ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm">
                {reportError}
              </div>
            ) : reportData ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                    <p className="text-xs text-[#fdfdff]/55">Total Students</p>
                    <p className="text-2xl font-bold text-[#fdfdff]">{reportData.summary?.totalStudents ?? 0}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <p className="text-xs text-[#fdfdff]/55">Submitted</p>
                    <p className="text-2xl font-bold text-emerald-300">{reportData.summary?.submittedCount ?? 0}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <p className="text-xs text-[#fdfdff]/55">Pending</p>
                    <p className="text-2xl font-bold text-amber-300">{reportData.summary?.pendingCount ?? 0}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                    <p className="text-xs text-[#fdfdff]/55">Avg Score</p>
                    <p className="text-2xl font-bold text-blue-300">{reportData.summary?.avgPercentage ?? 0}%</p>
                  </div>
                </div>

                {Array.isArray(reportData.submissions) && reportData.submissions.length > 0 ? (
                  <div className="space-y-3">
                    {reportData.submissions.map((sub) => (
                      <div key={sub.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <p className="text-[#fdfdff] font-medium">{sub.studentName}</p>
                            <p className="text-xs text-[#fdfdff]/55">{sub.studentEmail || "No email"}</p>
                          </div>
                          <div className="text-sm text-[#fdfdff]/70">
                            <span className="text-emerald-300 font-medium mr-2">
                              {sub.score}/{sub.totalQuestions} ({sub.percentage}%)
                            </span>
                            {new Date(sub.submittedAt).toLocaleString()}
                          </div>
                        </div>
                        {Array.isArray(sub.answers) && sub.answers.length > 0 && (
                          <ul className="mt-2 text-xs font-[JetBrains_Mono] text-[#fdfdff]/70 space-y-1 border-t border-white/10 pt-2">
                            {sub.answers.map((a) => (
                              <li key={`${sub.id}-${a.questionIndex}`}>
                                Q{a.questionIndex + 1}: chose {a.selectedOption || "—"} · correct {a.correctOption}{" "}
                                <span className={a.isCorrect ? "text-emerald-400" : "text-rose-400"}>
                                  {a.isCorrect ? "✓" : "✗"}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-[#fdfdff]/60 text-sm text-center">
                    No submissions yet for this assignment.
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
