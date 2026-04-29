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

function inferTaskType(task = {}) {
  if (task?.type === "logic-based" || task?.type === "input-output") return task.type;
  const prompt = String(task.problemStatement || "").toLowerCase();
  const inputFormat = String(task.inputFormat || "").trim().toLowerCase();
  const noInputSignal =
    /\b(no|without)\s+(user\s+)?input\b|\binput\s+(is\s+)?not\s+required\b|\bno\s+stdin\b/.test(prompt) ||
    /\b(no|without)\s+input\b|\binput\s+(is\s+)?not\s+required\b/.test(inputFormat);
  if (noInputSignal) return "logic-based";
  const hasInput =
    (Boolean(inputFormat) && !/\b(no|without)\s+input\b|\binput\s+(is\s+)?not\s+required\b/.test(inputFormat)) ||
    /\bstdin|scanner|read\s+input|take\s+input|accept\s+input|for each test case\b/.test(prompt);
  const logicSignal = /\bprint|pattern|oop|class|method|constructor|inheritance|encapsulation\b/.test(prompt);
  if (logicSignal && !hasInput) return "logic-based";
  return hasInput ? "input-output" : "logic-based";
}

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
    chapterIds: row.chapterIds || [],
    difficulty: row.difficulty,
    assignmentType: row.assignmentType || "mcq",
    mcqs: row.mcqs || [],
    codingTasks: row.codingTasks || [],
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
  const [ragAssignmentType, setRagAssignmentType] = useState("mcq");
  const [numMcqs, setNumMcqs] = useState(5);
  const [numCodingTasks, setNumCodingTasks] = useState(3);
  const [codingInstructions, setCodingInstructions] = useState("");
  const [codingCreationMode, setCodingCreationMode] = useState("ai"); // ai | manual
  const [manualCodingTasks, setManualCodingTasks] = useState([]);
  const [editingAssignment, setEditingAssignment] = useState(null);
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
  const [previewingSubmission, setPreviewingSubmission] = useState(null);
  const [testCaseGenerationState, setTestCaseGenerationState] = useState({}); // { taskIdx: "generating"|"done"|"error" }
  const [testCaseGenerationError, setTestCaseGenerationError] = useState({}); // { taskIdx: error message }
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

  useEffect(() => {
    if (ragAssignmentType === "coding" && codingCreationMode === "manual") {
      ensureManualTasks(numCodingTasks);
    }
  }, [ragAssignmentType, codingCreationMode, numCodingTasks]);

  const toggleChapterId = (chapterNumericId) => {
    setSelectedChapterIds((prev) =>
      prev.includes(chapterNumericId)
        ? prev.filter((id) => id !== chapterNumericId)
        : [...prev, chapterNumericId]
    );
  };

  const ensureManualTasks = (count) => {
    const c = Math.max(1, Math.min(10, Number(count) || 1));
    setManualCodingTasks((prev) => {
      const next = Array.from({ length: c }, (_, idx) => {
        const old = prev[idx];
        return (
          old || {
            id: String(idx + 1),
            problemStatement: "",
            inputFormat: "",
            outputFormat: "",
            constraints: [],
            expectedConcepts: [],
            sampleTestCases: [],
            hiddenTestCases: [],
            referenceSolution: "",
          }
        );
      });
      return next;
    });
  };

  const resolveClassName = (classId, fallback) => {
    const c = instructorClasses.find((x) => x._id === classId);
    return c?.className || fallback || "Class";
  };

  const handleGenerateTestCasesForTask = async (taskIdx) => {
    const task = manualCodingTasks[taskIdx];
    if (inferTaskType(task) === "logic-based") {
      setTestCaseGenerationError((prev) => ({
        ...prev,
        [taskIdx]: "Test cases are only generated for input-output tasks.",
      }));
      return;
    }

    if (!task || !task.problemStatement.trim()) {
      setTestCaseGenerationError((prev) => ({
        ...prev,
        [taskIdx]: "Problem statement is required",
      }));
      return;
    }

    setTestCaseGenerationState((prev) => ({ ...prev, [taskIdx]: "generating" }));
    setTestCaseGenerationError((prev) => ({ ...prev, [taskIdx]: "" }));

    try {
      const res = await fetch(`${RAG_API_BASE}/api/generate-test-cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemStatement: task.problemStatement,
          inputFormat: task.inputFormat || "",
          outputFormat: task.outputFormat || "",
          constraints: task.constraints || [],
          expectedConcepts: task.expectedConcepts || [],
          difficulty: ragDifficulty || "M",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success || !data.data) {
        throw new Error(data.error || `Test case generation failed (${res.status})`);
      }

      const generatedTask = data.data;
      setManualCodingTasks((prev) =>
        prev.map((t, i) =>
          i === taskIdx
            ? {
                ...t,
                sampleTestCases: generatedTask.sampleTestCases || [],
                hiddenTestCases: generatedTask.hiddenTestCases || [],
                referenceSolution: generatedTask.referenceSolution || "",
                expectedConcepts: generatedTask.expectedConcepts || [],
                constraints: generatedTask.constraints || [],
              }
            : t
        )
      );

      setTestCaseGenerationState((prev) => ({ ...prev, [taskIdx]: "done" }));
    } catch (err) {
      setTestCaseGenerationError((prev) => ({
        ...prev,
        [taskIdx]: err.message || "Failed to generate test cases",
      }));
      setTestCaseGenerationState((prev) => ({ ...prev, [taskIdx]: "error" }));
    }
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
    const numTasks = Math.min(10, Math.max(1, Number(numCodingTasks) || 3));

    setRagGenerating(true);
    try {
      let generatedMcqs = [];
      let generatedCodingTasks = [];
      let meta = {};
      let chapterTitles = [];
      if (ragAssignmentType === "coding" && codingCreationMode === "manual") {
        const invalidTask = manualCodingTasks.find((t) => !String(t.problemStatement || "").trim());
        if (invalidTask) {
          setRagError("Each manual task must include a problem statement.");
          return;
        }
        chapterTitles = ragChapters
          .filter((ch) => selectedChapterIds.includes(ch.id))
          .map((ch) => ch.title);
        generatedCodingTasks = manualCodingTasks.map((t, idx) => ({
          id: String(idx + 1),
          type: inferTaskType(t),
          problemStatement: String(t.problemStatement || "").trim(),
          inputFormat: String(t.inputFormat || "").trim(),
          outputFormat: String(t.outputFormat || "").trim(),
          sampleTestCases: [],
          hiddenTestCases: [],
          expectedConcepts: [],
        }));
        meta = { source: "manual-instructor" };
      } else {
        const endpoint =
          ragAssignmentType === "coding"
            ? `${RAG_API_BASE}/api/generate-coding-assignment`
            : `${RAG_API_BASE}/api/generate-mcq-assignment`;
        const payload =
          ragAssignmentType === "coding"
            ? {
                num_tasks: numTasks,
                difficulty: ragDifficulty,
                topics: selectedChapterIds.map(String),
                topic_names: ragChapters
                  .filter((ch) => selectedChapterIds.includes(ch.id))
                  .map((ch) => ch.title),
                instructions: [
                  codingInstructions.trim(),
                  "STRICT REQUIREMENTS:",
                  "- Generate questions only from the selected topic names.",
                  "- Do not introduce advanced or future topics outside the selected scope.",
                  "- Difficulty must match the requested level.",
                  "- Each task must include type: \"input-output\" or \"logic-based\".",
                  "- Generate test cases only for input-output tasks.",
                ]
                  .filter(Boolean)
                  .join("\n"),
              }
            : {
                chapter_ids: selectedChapterIds,
                difficulty: ragDifficulty,
                num_questions: numQ,
              };
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        generatedMcqs = Array.isArray(data.mcqs) ? data.mcqs : [];
        generatedCodingTasks = Array.isArray(data.codingTasks)
          ? data.codingTasks.map((task) => ({
              ...task,
              type: inferTaskType(task),
              sampleTestCases: inferTaskType(task) === "logic-based" ? [] : (task.sampleTestCases || []),
              hiddenTestCases: inferTaskType(task) === "logic-based" ? [] : (task.hiddenTestCases || []),
            }))
          : [];
        const hasValid =
          ragAssignmentType === "coding" ? generatedCodingTasks.length > 0 : generatedMcqs.length > 0;
        if (!res.ok || !data.success || !hasValid) {
          setRagError(data.error || data.message || `Generation failed (${res.status})`);
          return;
        }
        chapterTitles = Array.isArray(data.chapter_titles) ? data.chapter_titles : [];
        meta = data.meta || {};
      }

      const titleBase = chapterTitles.slice(0, 2).join(", ");
      const titleSuffix = chapterTitles.length > 2 ? ` +${chapterTitles.length - 2}` : "";
      const title =
        ragAssignmentType === "coding"
          ? `Coding assignment — ${titleBase || "Java"}${titleSuffix}`
          : `MCQ quiz — ${titleBase}${titleSuffix}`;

      const endpoint = editingAssignment
        ? `/api/classes/${ragTargetClassId}/assignments/${editingAssignment.id}`
        : `/api/classes/${ragTargetClassId}/assignments`;
      const createRes = await request(endpoint, {
        method: editingAssignment ? "PATCH" : "POST",
        headers: { Authorization: `Bearer ${user.token}` },
        body: {
          title,
          deadline,
          status: "draft",
          difficulty: ragDifficulty,
          chapterIds: selectedChapterIds,
          topics: chapterTitles.length ? chapterTitles : selectedChapterIds.map(String),
          assignmentType: ragAssignmentType,
          mcqs: ragAssignmentType === "mcq" ? generatedMcqs : [],
          codingTasks: ragAssignmentType === "coding" ? generatedCodingTasks : [],
          ragMeta: meta,
          points: ragAssignmentType === "coding" ? generatedCodingTasks.length * 10 : generatedMcqs.length,
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
      setNumCodingTasks(3);
      setCodingInstructions("");
      setCodingCreationMode("ai");
      setManualCodingTasks([]);
      setEditingAssignment(null);
    } catch (err) {
      setRagError(err.message || "Request failed");
    } finally {
      setRagGenerating(false);
    }
  };

  const editAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setRagTargetClassId(assignment.classId || "");
    setSelectedChapterIds(Array.isArray(assignment.chapterIds) ? assignment.chapterIds : []);
    setRagDifficulty(assignment.difficulty || "M");
    setRagAssignmentType(assignment.assignmentType || "mcq");
    setNumMcqs(Math.max(1, assignment.mcqs?.length || 5));
    setNumCodingTasks(Math.max(1, assignment.codingTasks?.length || 3));
    setAssignmentDeadline(assignment.deadline || "");
    const isManual = assignment.assignmentType === "coding" && assignment.ragMeta?.source === "manual-instructor";
    setCodingCreationMode(isManual ? "manual" : "ai");
    setManualCodingTasks(
      (assignment.codingTasks || []).map((t, idx) => ({
        id: String(idx + 1),
        problemStatement: t.problemStatement || "",
        inputFormat: t.inputFormat || "",
        outputFormat: t.outputFormat || "",
      }))
    );
    setIsModalOpen(true);
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

  const acceptSubmission = async (submissionId) => {
    if (!reportModalAssignment?.classId) return;
    try {
      const res = await request(
        `/api/classes/${reportModalAssignment.classId}/assignments/${reportModalAssignment.id}/submissions/${submissionId}/accept`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${user.token}` }
        }
      );
      if (res.success) {
        setReportData(prev => ({
          ...prev,
          submissions: prev.submissions.map(sub => 
            sub.id === submissionId ? { ...sub, status: "accepted" } : sub
          )
        }));
        if (previewingSubmission?.id === submissionId) {
          setPreviewingSubmission(null);
        }
      }
    } catch (err) {
      console.error("Failed to accept submission", err);
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
                const codingCount = assignment.codingTasks?.length ?? 0;
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
                              {assignment.assignmentType === "mcq" && mcqCount > 0 && (
                                <span className="text-[#fdfdff]/45">
                                  {mcqCount} MCQ{mcqCount !== 1 ? "s" : ""}
                                  {assignment.difficulty ? ` · ${assignment.difficulty}` : ""}
                                </span>
                              )}
                              {assignment.assignmentType === "coding" && codingCount > 0 && (
                                <span className="text-[#fdfdff]/45">
                                  {codingCount} Coding task{codingCount !== 1 ? "s" : ""}
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

                        {(assignment.assignmentType === "mcq" && mcqCount > 0) ||
                        (assignment.assignmentType === "coding" && codingCount > 0) ? (
                          <button
                            type="button"
                            onClick={() => setExpandedAssignmentId(expanded ? null : assignment.id)}
                            className="flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200 mb-2"
                          >
                            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            {expanded
                              ? assignment.assignmentType === "coding"
                                ? "Hide tasks"
                                : "Hide questions"
                              : assignment.assignmentType === "coding"
                                ? "Preview tasks"
                                : "Preview questions"}
                          </button>
                        ) : null}

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
                        {expanded && assignment.assignmentType === "coding" && assignment.codingTasks?.length > 0 && (
                          <ol className="space-y-4 border-l border-blue-500/20 ml-2 pl-4 mb-3">
                            {assignment.codingTasks.map((task, ti) => (
                              <li key={task.id || ti} className="text-sm text-[#fdfdff]/85">
                                <p className="font-medium text-[#fdfdff] mb-2">
                                  {ti + 1}. {task.problemStatement}
                                </p>
                                <p className="text-xs text-[#fdfdff]/60">
                                  Input: {task.inputFormat || "—"} | Output: {task.outputFormat || "—"}
                                </p>
                              </li>
                            ))}
                          </ol>
                        )}
                        {expanded && isDraft && (
                          <button
                            type="button"
                            onClick={() => editAssignment(assignment)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-200"
                          >
                            Edit
                          </button>
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
                <h2 className="text-2xl font-bold text-[#fdfdff]">Generate assignment</h2>
                <p className="text-sm text-[#fdfdff]/50 mt-1">
                  Create MCQ or coding assignments for your class.
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
                  <label className="block text-sm font-medium text-[#fdfdff]/80 mb-2">Assignment Type</label>
                  <select
                    value={ragAssignmentType}
                    onChange={(e) => setRagAssignmentType(e.target.value)}
                    className="w-full px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[#fdfdff]"
                  >
                    <option value="mcq" className="bg-[#0A1428]">MCQ</option>
                    <option value="coding" className="bg-[#0A1428]">Coding Tasks</option>
                  </select>
                </div>
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
              </div>

              {ragAssignmentType === "mcq" ? (
                <div className="space-y-4 border border-purple-500/20 rounded-xl p-4">
                  <p className="text-sm text-purple-200 font-medium">MCQ Assignment Form</p>
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
              ) : (
                <div className="space-y-4 border border-blue-500/20 rounded-xl p-4">
                  <p className="text-sm text-blue-200 font-medium">Coding Assignment Form</p>
                  <div>
                    <label className="block text-sm font-medium text-[#fdfdff]/80 mb-2">Creation Mode</label>
                    <select
                      value={codingCreationMode}
                      onChange={(e) => setCodingCreationMode(e.target.value)}
                      className="w-full px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[#fdfdff]"
                    >
                      <option value="ai" className="bg-[#0A1428]">Generate with AI</option>
                      <option value="manual" className="bg-[#0A1428]">Manual Assignment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#fdfdff]/80 mb-2">Number of Coding Tasks</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={numCodingTasks}
                      onChange={(e) => {
                        setNumCodingTasks(e.target.value);
                        ensureManualTasks(e.target.value);
                      }}
                      className="w-full px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[#fdfdff] font-[JetBrains_Mono]"
                    />
                  </div>
                  {codingCreationMode === "ai" ? (
                    <div>
                      <label className="block text-sm font-medium text-[#fdfdff]/80 mb-2">Instructions</label>
                      <textarea
                        value={codingInstructions}
                        onChange={(e) => setCodingInstructions(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[#fdfdff]"
                        placeholder="Optional constraints for AI generation"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {manualCodingTasks.map((task, idx) => (
                        <div key={idx} className="p-3 rounded-lg border border-white/10 bg-black/20 space-y-2">
                          <p className="text-xs text-[#fdfdff]/60">Task {idx + 1}</p>
                          <textarea
                            rows={3}
                            placeholder="Problem statement"
                            value={task.problemStatement}
                            onChange={(e) =>
                              setManualCodingTasks((prev) =>
                                prev.map((x, i) => (i === idx ? { ...x, problemStatement: e.target.value } : x))
                              )
                            }
                            className="w-full px-3 py-2 rounded-lg bg-[#0b0d11] border border-white/10 text-[#fdfdff]"
                          />
                          <input
                            placeholder="Input format (optional)"
                            value={task.inputFormat}
                            onChange={(e) =>
                              setManualCodingTasks((prev) =>
                                prev.map((x, i) => (i === idx ? { ...x, inputFormat: e.target.value } : x))
                              )
                            }
                            className="w-full px-3 py-2 rounded-lg bg-[#0b0d11] border border-white/10 text-[#fdfdff]"
                          />
                          <input
                            placeholder="Output format (optional)"
                            value={task.outputFormat}
                            onChange={(e) =>
                              setManualCodingTasks((prev) =>
                                prev.map((x, i) => (i === idx ? { ...x, outputFormat: e.target.value } : x))
                              )
                            }
                            className="w-full px-3 py-2 rounded-lg bg-[#0b0d11] border border-white/10 text-[#fdfdff]"
                          />
                          
                          {/* Test case generation section */}
                          <div className="flex items-center gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => handleGenerateTestCasesForTask(idx)}
                              disabled={
                                testCaseGenerationState[idx] === "generating" ||
                                !task.problemStatement.trim()
                              }
                              className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-50 text-blue-200 rounded-lg border border-blue-500/30 text-sm font-medium"
                            >
                              {testCaseGenerationState[idx] === "generating" && (
                                <Loader className="w-4 h-4 animate-spin" />
                              )}
                              {testCaseGenerationState[idx] === "done" && (
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                              )}
                              {testCaseGenerationState[idx] !== "generating" &&
                                testCaseGenerationState[idx] !== "done" && (
                                  <Sparkles className="w-4 h-4" />
                                )}
                              {testCaseGenerationState[idx] === "generating"
                                ? "Generating..."
                                : testCaseGenerationState[idx] === "done"
                                ? "Test Cases Generated"
                                : "Generate Test Cases"}
                            </button>
                          </div>

                          {testCaseGenerationError[idx] && (
                            <div className="flex items-start gap-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200">
                              <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                              <span>{testCaseGenerationError[idx]}</span>
                            </div>
                          )}

                          {task.sampleTestCases && task.sampleTestCases.length > 0 && (
                            <div className="text-xs text-green-400 p-2 rounded-lg bg-green-500/10">
                              ✓ Generated: {task.sampleTestCases.length} sample cases, {task.hiddenTestCases?.length || 0} hidden cases
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

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
                      {editingAssignment ? "Save Changes" : `Generate ${ragAssignmentType === "coding" ? "Coding Tasks" : "MCQs"}`}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={ragGenerating}
                  onClick={() => {
                    setIsModalOpen(false);
                    setRagError(null);
                    setEditingAssignment(null);
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
                {reportData.summary?.coding && (
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-200">
                    Coding analytics: avg tests passed {reportData.summary.coding.averageTestCasesPassedPercent ?? 0}% · avg attempts{" "}
                    {reportData.summary.coding.averageAttempts ?? 0}
                  </div>
                )}

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
                        {Array.isArray(sub.codingSubmissions) && sub.codingSubmissions.length > 0 && (
                          <div className="mt-2 text-xs text-[#fdfdff]/75 border-t border-white/10 pt-2 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-[#fdfdff]/55">Coding analytics</p>
                              <div className="flex gap-2">
                                <span className={`px-2 py-1 rounded text-[10px] ${sub.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'}`}>
                                  {sub.status === 'accepted' ? 'Accepted' : 'Pending'}
                                </span>
                                <button
                                  onClick={() => setPreviewingSubmission(sub)}
                                  className="text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-500/10 px-2 py-1 rounded"
                                >
                                  <Eye className="w-3 h-3" /> Preview Submission
                                </button>
                                {sub.status !== 'accepted' && (
                                  <button
                                    onClick={() => acceptSubmission(sub.id)}
                                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded"
                                  >
                                    <CheckCircle2 className="w-3 h-3" /> Accept and Push
                                  </button>
                                )}
                              </div>
                            </div>
                            {sub.codingSubmissions.map((cs) => (
                              <p key={`${sub.id}-${cs.taskId}`}>
                                Task {cs.taskId}: {cs.testCasesPassed}/{cs.totalTestCases} tests · attempts {sub.attemptCount || 1}
                              </p>
                            ))}
                          </div>
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

      {previewingSubmission && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setPreviewingSubmission(null)}
          />
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-[#0A1428] border border-purple-500/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#fdfdff]">Submission Preview: {previewingSubmission.studentName}</h3>
              <button
                type="button"
                onClick={() => setPreviewingSubmission(null)}
                className="p-2 rounded-lg hover:bg-white/10 text-[#fdfdff]/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-6">
              {previewingSubmission.codingSubmissions.map((cs, idx) => (
                <div key={idx} className="bg-black/30 border border-white/10 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-purple-300 font-medium">Task {cs.taskId} Code</h4>
                    <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded">
                      Tests: {cs.testCasesPassed} / {cs.totalTestCases}
                    </span>
                  </div>
                  <pre className="text-sm font-[JetBrains_Mono] text-[#fdfdff] bg-[#0b0d11] p-4 rounded-lg overflow-x-auto">
                    {cs.codeSnippet || "// No code submitted"}
                  </pre>
                  {cs.aiCodeAnalysis?.score > 0 && (
                     <div className="mt-3 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-xs text-indigo-200">
                       <p className="font-semibold mb-1">AI Analysis Score: {cs.aiCodeAnalysis.score}/10</p>
                       <p><span className="opacity-70">Logic:</span> {cs.aiCodeAnalysis.logic}</p>
                       <p><span className="opacity-70">Quality:</span> {cs.aiCodeAnalysis.quality}</p>
                     </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setPreviewingSubmission(null)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#fdfdff]"
              >
                Close
              </button>
              {previewingSubmission.status !== "accepted" && (
                <button
                  onClick={() => acceptSubmission(previewingSubmission.id)}
                  className="px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Accept and Push
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
