import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  Plus,
  Mail,
  FileText,
  Calendar,
  Settings,
  Copy,
  Trash2,
  X,
  Loader,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Send,
  Eye,
  Bell,
  MessageSquare,
} from "lucide-react";
import { request } from "../../../../services/apiClient";
import { useAuth } from "../../../../context/AuthContext";
import ChatSection from "../../../../components/Chat/ChatSection";

/** Python RAG Flask app (`rag-main/rag/api.py`), default port 5001 */
const RAG_API_BASE = (import.meta.env.VITE_RAG_API_URL ?? "http://localhost:5001").replace(/\/$/, "");

function mapAssignmentRow(row, cid, studentCount) {
  const published = row.status === "published";
  return {
    id: String(row._id),
    classId: String(row.classId?._id ?? row.classId ?? cid),
    topic: row.title,
    deadline: row.deadline ? new Date(row.deadline).toISOString().split("T")[0] : "",
    status: published ? "active" : "draft",
    isDraft: row.status === "draft",
    submissions: row.submissions ?? 0,
    total: published ? studentCount : 0,
    topics: row.topics || [],
    chapterIds: row.chapterIds || [],
    difficulty: row.difficulty,
    assignmentType: row.assignmentType || "mcq",
    mcqs: row.mcqs || [],
    codingTasks: row.codingTasks || [],
    ragMeta: row.ragMeta,
  };
}

export default function ClassDetail() {
  const { classId } = useParams();
  const { user } = useAuth();

  // State Management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentClass, setCurrentClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [classAssignments, setClassAssignments] = useState([]);
  const [instructorClasses, setInstructorClasses] = useState([]);
  const [expandedAssignmentId, setExpandedAssignmentId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" or "chat"

  // Modal States — RAG MCQ assignment builder
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [ragTargetClassId, setRagTargetClassId] = useState("");
  const [ragChapters, setRagChapters] = useState([]);
  const [ragChaptersLoading, setRagChaptersLoading] = useState(false);
  const [selectedChapterIds, setSelectedChapterIds] = useState([]);
  const [ragDifficulty, setRagDifficulty] = useState("M");
  const [ragAssignmentType, setRagAssignmentType] = useState("mcq");
  const [numMcqs, setNumMcqs] = useState(5);
  const [numCodingTasks, setNumCodingTasks] = useState(3);
  const [codingInstructions, setCodingInstructions] = useState("");
  const [codingCreationMode, setCodingCreationMode] = useState("ai");
  const [manualCodingTasks, setManualCodingTasks] = useState([]);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [assignmentDeadline, setAssignmentDeadline] = useState("");
  const [ragGenerating, setRagGenerating] = useState(false);
  const [ragError, setRagError] = useState(null);
  const [reportModalAssignment, setReportModalAssignment] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [submissionToast, setSubmissionToast] = useState("");
  const currentClassRef = useRef(null);

  // Fetch class data on component mount
  useEffect(() => {
    if (user && user.token && classId) {
      fetchClassData();
    }
  }, [classId, user]);

  useEffect(() => {
    if (user?.token && classId) {
      fetchInstructorClasses();
    }
  }, [user?.token, classId]);

  const loadAssignmentsFromApi = useCallback(
    async (cid, studentCount) => {
      if (!user?.token || !cid) return;
      try {
        const response = await request(`/api/classes/${cid}/assignments`, {
          method: "GET",
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (response.success && Array.isArray(response.data)) {
          setClassAssignments(response.data.map((row) => mapAssignmentRow(row, cid, studentCount)));
        } else {
          setClassAssignments([]);
        }
      } catch {
        setClassAssignments([]);
      }
    },
    [user?.token]
  );

  useEffect(() => {
    currentClassRef.current = currentClass;
  }, [currentClass]);

  useEffect(() => {
    if (!user?.token || !classId) return undefined;

    const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");
    const wsUrl = apiBase.replace(/^http/, "ws");
    const ws = new WebSocket(`${wsUrl}/ws/notifications?token=${encodeURIComponent(user.token)}`);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type !== "assignment_submission" || !msg.data) return;
        if (String(msg.data.classId) !== String(classId)) return;

        const sc = currentClassRef.current?.students ?? 0;
        loadAssignmentsFromApi(classId, sc);
        setSubmissionToast(
          `${msg.data.studentName || "A student"} submitted "${msg.data.assignmentTitle || "Assignment"}" — ${msg.data.score}/${msg.data.totalQuestions} (${msg.data.percentage}%)`
        );
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
  }, [user?.token, classId, loadAssignmentsFromApi]);

  const viewSubmissionReport = async (assignment) => {
    if (!assignment?.classId) return;
    setReportModalAssignment(assignment);
    setReportLoading(true);
    setReportError(null);
    setReportData(null);
    try {
      const response = await request(
        `/api/classes/${assignment.classId}/assignments/${assignment.id}/submissions`,
        { method: "GET", headers: { Authorization: `Bearer ${user.token}` } }
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

  const fetchClassData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching class data for:", classId);

      const response = await request(`/api/classes/${classId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${user.token}` },
      });

      console.log("Class data response:", response);

      if (response.success && response.data) {
        const classData = response.data;
        const studentCount = classData.students?.length || 0;
        setCurrentClass({
          _id: classData._id,
          name: classData.className,
          description: classData.description,
          joinCode: classData.joinCode,
          category: classData.category,
          students: studentCount,
          avgPerformance: 75, // Placeholder - calculate from student progress data
          startDate: classData.startDate,
          endDate: classData.endDate,
          autoApproveStudents: classData.autoApproveStudents,
          allowLateSubmissions: classData.allowLateSubmissions,
        });

        // Transform students data
        if (classData.students && Array.isArray(classData.students)) {
          const transformedStudents = classData.students.map((student, index) => ({
            id: student._id || index,
            name: student.name || "Unknown",
            email: student.email || "",
            progress: Math.floor(Math.random() * 100), // Placeholder
            status: Math.floor(Math.random() * 100) > 80 ? "excellent" : Math.floor(Math.random() * 100) > 60 ? "good" : "average",
          }));
          setStudents(transformedStudents);
        }

        await loadAssignmentsFromApi(classId, studentCount);
      } else {
        setError(response.message || "Failed to fetch class data");
      }
    } catch (err) {
      console.error("Error fetching class:", err);
      let errorMessage = "Failed to load class";
      
      if (err.status === 404) {
        errorMessage = "Class not found";
      } else if (err.status === 403) {
        errorMessage = "You don't have permission to view this class";
      } else if (err.payload?.message) {
        errorMessage = err.payload.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "excellent":
        return { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" };
      case "good":
        return { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" };
      default:
        return { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30" };
    }
  };

  const getStatCardClasses = (color) => {
    const colorMap = {
      blue: "bg-blue-500/10 border-blue-500/30",
      purple: "bg-purple-500/10 border-purple-500/30",
      emerald: "bg-emerald-500/10 border-emerald-500/30",
      rose: "bg-rose-500/10 border-rose-500/30",
    };
    return colorMap[color] || colorMap.blue;
  };

  const getStatIconClasses = (color) => {
    const colorMap = {
      blue: "text-blue-400",
      purple: "text-purple-400",
      emerald: "text-emerald-400",
      rose: "text-rose-400",
    };
    return colorMap[color] || colorMap.blue;
  };

  const getStatIconBgClasses = (color) => {
    const colorMap = {
      blue: "bg-blue-500/20",
      purple: "bg-purple-500/20",
      emerald: "bg-emerald-500/20",
      rose: "bg-rose-500/20",
    };
    return colorMap[color] || colorMap.blue;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const fetchInstructorClasses = async () => {
    if (!user?.token) return;
    try {
      const response = await request("/api/classes/instructor", {
        method: "GET",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (response.success && Array.isArray(response.data)) {
        setInstructorClasses(response.data);
      }
    } catch (e) {
      console.error("Failed to load instructor classes", e);
    }
  };

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
        `Cannot reach RAG API at ${RAG_API_BASE}. Run the Flask app from rag-main/rag (port 5001), or set VITE_RAG_API_URL.`
      );
    } finally {
      setRagChaptersLoading(false);
    }
  };

  useEffect(() => {
    if (isAssignmentModalOpen && user?.token) {
      fetchInstructorClasses();
      setRagTargetClassId((prev) => prev || classId || "");
      setRagError(null);
      fetchRagChapters();
      setSelectedChapterIds([]);
    }
  }, [isAssignmentModalOpen, user?.token, classId]);

  const toggleChapterId = (chapterNumericId) => {
    setSelectedChapterIds((prev) =>
      prev.includes(chapterNumericId)
        ? prev.filter((id) => id !== chapterNumericId)
        : [...prev, chapterNumericId]
    );
  };

  const ensureManualTasks = (count) => {
    const c = Math.max(1, Math.min(10, Number(count) || 1));
    setManualCodingTasks((prev) =>
      Array.from({ length: c }, (_, idx) =>
        prev[idx] || { id: String(idx + 1), problemStatement: "", inputFormat: "", outputFormat: "" }
      )
    );
  };

  const defaultDeadline = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  };

  const handleGenerateRagAssignment = async () => {
    setRagError(null);
    if (!ragTargetClassId) {
      setRagError("Select the class this assignment is for.");
      return;
    }
    if (selectedChapterIds.length === 0) {
      setRagError("Select at least one chapter (same catalog as the student RAG curriculum).");
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
      let chapterTitleList = [];
      if (ragAssignmentType === "coding" && codingCreationMode === "manual") {
        const invalidTask = manualCodingTasks.find((t) => !String(t.problemStatement || "").trim());
        if (invalidTask) {
          setRagError("Each manual task must include a problem statement.");
          return;
        }
        chapterTitleList = ragChapters
          .filter((ch) => selectedChapterIds.includes(ch.id))
          .map((ch) => ch.title);
        generatedCodingTasks = manualCodingTasks.map((t, idx) => ({
          id: String(idx + 1),
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
                instructions: codingInstructions.trim(),
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
        generatedCodingTasks = Array.isArray(data.codingTasks) ? data.codingTasks : [];
        const hasValid =
          ragAssignmentType === "coding" ? generatedCodingTasks.length > 0 : generatedMcqs.length > 0;

        if (!res.ok || !data.success || !hasValid) {
          setRagError(data.error || data.message || `Generation failed (${res.status})`);
          return;
        }
        chapterTitleList = Array.isArray(data.chapter_titles) ? data.chapter_titles : [];
        meta = data.meta || {};
      }

      const titleBase = chapterTitleList.slice(0, 2).join(", ");
      const titleSuffix = chapterTitleList.length > 2 ? ` +${chapterTitleList.length - 2}` : "";
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
          topics: chapterTitleList.length ? chapterTitleList : selectedChapterIds.map(String),
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

      if (String(ragTargetClassId) === String(classId)) {
        await loadAssignmentsFromApi(classId, currentClass?.students ?? 0);
      }
      setIsAssignmentModalOpen(false);
      setSelectedChapterIds([]);
      setAssignmentDeadline("");
      setNumMcqs(5);
      setNumCodingTasks(3);
      setCodingInstructions("");
      setCodingCreationMode("ai");
      setManualCodingTasks([]);
      setEditingAssignment(null);
    } catch (err) {
      setRagError(err.payload?.message || err.message || "Request failed");
    } finally {
      setRagGenerating(false);
    }
  };

  useEffect(() => {
    if (ragAssignmentType === "coding" && codingCreationMode === "manual") {
      ensureManualTasks(numCodingTasks);
    }
  }, [ragAssignmentType, codingCreationMode, numCodingTasks]);

  const editAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setRagTargetClassId(assignment.classId || classId);
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
    setIsAssignmentModalOpen(true);
  };

  const pushAssignmentToClass = async (assignment) => {
    const aid = assignment.classId || assignment.targetClassId;
    try {
      await request(`/api/classes/${aid}/assignments/${assignment.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${user.token}` },
        body: { status: "published" },
      });
      if (String(aid) === String(classId)) {
        await loadAssignmentsFromApi(classId, currentClass?.students ?? 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAssignment = async (id) => {
    const a = classAssignments.find((x) => x.id === id);
    if (!a?.classId) return;
    try {
      await request(`/api/classes/${a.classId}/assignments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      await loadAssignmentsFromApi(classId, currentClass?.students ?? 0);
    } catch (err) {
      console.error(err);
    }
  };

  const visibleAssignments = classAssignments.filter(
    (a) => String(a.classId ?? "") === String(classId)
  );
  const activeAssignments = visibleAssignments.filter((a) => a.status === "active").length;
  const completionRate =
    visibleAssignments.length > 0
      ? Math.round(
          (visibleAssignments.reduce((sum, a) => sum + a.submissions, 0) /
            (visibleAssignments.length * (currentClass?.students || 1))) *
            100
        )
      : 0;

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader className="w-12 h-12 text-blue-400 animate-spin" />
        <p className="text-[#fdfdff]/60">Loading class details...</p>
      </div>
    );
  }

  // Error State
  if (error || !currentClass) {
    return (
      <div className="space-y-8">
        <Link
          to="/mentor/classes"
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Classes</span>
        </Link>

        <div className="flex items-center gap-4 p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30">
          <AlertCircle className="w-6 h-6 text-rose-400 flex-shrink-0" />
          <div>
            <p className="text-lg font-semibold text-rose-300 mb-1">Failed to Load Class</p>
            <p className="text-sm text-rose-300/80">{error || "Class not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header with Back Button */}
      <div>
        <Link
          to="/mentor/classes"
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Classes</span>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#fdfdff] mb-2">{currentClass.name}</h1>
            {currentClass.description && (
              <p className="text-[#fdfdff]/60 mb-4 max-w-2xl">{currentClass.description}</p>
            )}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-[#fdfdff]/60">
                <Users className="w-4 h-4" />
                <span>{currentClass.students} students</span>
              </div>
              <div className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-medium">
                {currentClass.category}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#fdfdff]/50">Join Code:</span>
                <code className="font-[JetBrains_Mono] text-sm text-blue-400 font-semibold">
                  {currentClass.joinCode}
                </code>
                <button
                  onClick={() => copyToClipboard(currentClass.joinCode)}
                  className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors duration-200"
                  title="Copy join code"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-[#fdfdff]/70 hover:text-[#fdfdff] transition-all duration-200"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-all duration-200 border-b-2 ${
            activeTab === "overview"
              ? "text-blue-400 border-blue-400"
              : "text-[#fdfdff]/60 hover:text-[#fdfdff] border-transparent hover:border-white/20"
          }`}
        >
          <FileText className="w-4 h-4" />
          Overview
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
          <ChatSection classId={classId} className={currentClass.name} />
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          {submissionToast && (
            <div className="flex items-start justify-between gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-200">
              <div className="flex items-start gap-2 min-w-0">
                <Bell className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="min-w-0">{submissionToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setSubmissionToast("")}
                className="text-emerald-200/80 hover:text-emerald-100 shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

      {/* Class Overview Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: "Total Students", value: currentClass.students.toString(), icon: Users, color: "blue" },
          { title: "Avg Performance", value: `${currentClass.avgPerformance}%`, icon: TrendingUp, color: "purple" },
          { title: "Completion Rate", value: `${completionRate}%`, icon: CheckCircle2, color: "emerald" },
          { title: "Active Assignments", value: activeAssignments.toString(), icon: Clock, color: "rose" },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className={`relative p-6 rounded-2xl backdrop-blur-sm ${getStatCardClasses(stat.color)} border hover:scale-105 transition-transform duration-300`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className={`p-3 rounded-xl ${getStatIconBgClasses(stat.color)} w-fit mb-4`}>
                <Icon className={`w-6 h-6 ${getStatIconClasses(stat.color)}`} />
              </div>
              <p className="text-[#fdfdff]/60 text-sm mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-[#fdfdff]">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Enrolled Students Section */}
      {students.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-2xl font-semibold text-[#fdfdff]">Enrolled Students</h2>
            </div>
            <span className="text-sm text-[#fdfdff]/60">{students.length} total</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {students.map((student, index) => {
            const statusColors = getStatusColor(student.status);
            return (
              <div
                key={student.id}
                className="p-5 rounded-2xl backdrop-blur-sm bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/15 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#fdfdff] mb-1">{student.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-[#fdfdff]/60 mb-3">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{student.email}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-[#fdfdff]/50 mb-1">Progress</p>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-blue-500/20 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                              style={{ width: `${student.progress}%` }}
                            />
                          </div>
                          <span className="font-[JetBrains_Mono] text-xs text-blue-400 font-semibold">
                            {student.progress}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`px-3 py-1.5 rounded-lg ${statusColors.bg} ${statusColors.border} border`}>
                    <span className={`text-xs font-medium ${statusColors.text} capitalize`}>
                      {student.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      )}

      {/* Assignments Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <FileText className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-2xl font-semibold text-[#fdfdff]">Assignments</h2>
          </div>
          <button
            onClick={() => setIsAssignmentModalOpen(true)}
            className="group relative px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-2xl border border-purple-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Assign New Task</span>
            <div className="absolute inset-0 rounded-2xl bg-purple-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
          </button>
        </div>

        <div className="space-y-4">
          {visibleAssignments.map((assignment, index) => {
            const isDraft = assignment.isDraft === true;
            const isCompleted = assignment.status === "completed";
            const progress =
              assignment.total > 0 ? Math.round((assignment.submissions / assignment.total) * 100) : 0;
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
                      ? "bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/15"
                      : "bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/15 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                }`}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
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
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-[#fdfdff]">{assignment.topic}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                          <div className="flex items-center gap-1.5 text-sm text-[#fdfdff]/60">
                            <Calendar className="w-4 h-4 shrink-0" />
                            <span>Due: {new Date(assignment.deadline).toLocaleDateString()}</span>
                          </div>
                          {assignment.assignmentType === "mcq" && mcqCount > 0 && (
                            <span className="text-sm text-[#fdfdff]/50">
                              {mcqCount} MCQ{mcqCount !== 1 ? "s" : ""}
                              {assignment.difficulty ? ` · ${assignment.difficulty}` : ""}
                            </span>
                          )}
                          {assignment.assignmentType === "coding" && codingCount > 0 && (
                            <span className="text-sm text-[#fdfdff]/50">
                              {codingCount} Coding task{codingCount !== 1 ? "s" : ""}
                              {assignment.difficulty ? ` · ${assignment.difficulty}` : ""}
                            </span>
                          )}
                          {!isCompleted && !isDraft && (
                            <div className="flex items-center gap-1.5 text-sm text-[#fdfdff]/60">
                              <Clock className="w-4 h-4 shrink-0" />
                              <span>
                                {assignment.submissions}/{assignment.total} submitted
                              </span>
                            </div>
                          )}
                        </div>
                        {assignment.topics?.length > 0 && (
                          <p className="text-xs text-[#fdfdff]/45 mt-2 line-clamp-2">
                            Topics: {assignment.topics.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>

                    {(assignment.assignmentType === "mcq" && mcqCount > 0) ||
                    (assignment.assignmentType === "coding" && codingCount > 0) ? (
                      <button
                        type="button"
                        onClick={() => setExpandedAssignmentId(expanded ? null : assignment.id)}
                        className="flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200 mb-3"
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
                      <ol className="space-y-4 border-l border-purple-500/20 ml-2 pl-4 mb-4">
                        {assignment.mcqs.map((q, qi) => (
                          <li key={q.id || qi} className="text-sm text-[#fdfdff]/85">
                            <p className="font-medium text-[#fdfdff] mb-2">
                              {qi + 1}. {q.question}
                            </p>
                            <ul className="space-y-1 font-[JetBrains_Mono] text-xs text-[#fdfdff]/70">
                              {["A", "B", "C", "D"].map((key) => (
                                <li key={key}>
                                  <span className={q.correct === key ? "text-emerald-400 font-semibold" : ""}>
                                    {key}) {q.options?.[key] ?? "—"}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ol>
                    )}
                    {expanded && assignment.assignmentType === "coding" && assignment.codingTasks?.length > 0 && (
                      <ol className="space-y-4 border-l border-blue-500/20 ml-2 pl-4 mb-4">
                        {assignment.codingTasks.map((task, ti) => (
                          <li key={task.id || ti} className="text-sm text-[#fdfdff]/85 space-y-2">
                            <p className="font-medium text-[#fdfdff] mb-1">
                              {ti + 1}. {task.problemStatement}
                            </p>
                            <p className="text-xs text-[#fdfdff]/60">
                              Input: {task.inputFormat || "—"} | Output: {task.outputFormat || "—"}
                            </p>
                            
                            {/* Constraints */}
                            {task.constraints && task.constraints.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-[#fdfdff]/70 mb-1">Constraints:</p>
                                <ul className="list-disc list-inside space-y-0.5 text-xs text-[#fdfdff]/60">
                                  {task.constraints.map((constraint, ci) => (
                                    <li key={ci}>{constraint}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Sample Test Cases */}
                            {task.sampleTestCases && task.sampleTestCases.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-green-400 mb-1">
                                  Sample Test Cases ({task.sampleTestCases.length}):
                                </p>
                                <div className="space-y-1 bg-black/30 rounded-lg p-2">
                                  {task.sampleTestCases.map((tc, tci) => (
                                    <div key={tci} className="text-xs font-[JetBrains_Mono] text-[#fdfdff]/60">
                                      <span className="text-green-400/70">Input:</span> <span className="text-[#fdfdff]/80">{tc.input || "(empty)"}</span>
                                      <span className="text-green-400/70 ml-2">→ Output:</span> <span className="text-[#fdfdff]/80">{tc.output}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Hidden Test Cases Count */}
                            {task.hiddenTestCases && task.hiddenTestCases.length > 0 && (
                              <div className="mt-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <p className="text-xs font-medium text-blue-400">
                                  🔒 Hidden Test Cases: {task.hiddenTestCases.length}
                                </p>
                              </div>
                            )}
                            
                            {/* Reference Solution (collapsed by default) */}
                            {task.referenceSolution && (
                              <details className="mt-2 text-xs">
                                <summary className="cursor-pointer text-purple-400 hover:text-purple-300 font-medium">
                                  ✓ View Reference Solution
                                </summary>
                                <pre className="mt-2 p-2 rounded-lg bg-black/50 border border-purple-500/20 text-xs text-[#fdfdff]/70 overflow-x-auto max-h-48">
                                  {task.referenceSolution}
                                </pre>
                              </details>
                            )}
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
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm text-[#fdfdff]/60 mb-2">
                          <span>Submission Progress</span>
                          <span className="font-[JetBrains_Mono]">{progress}%</span>
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
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-medium border border-emerald-500/30 transition-colors"
                        title={`Publish to ${
                          instructorClasses.find((c) => String(c._id) === String(assignment.classId))?.className ||
                          "class"
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        Push to class
                      </button>
                    )}
                    {!isCompleted && (
                      <div className="flex flex-col items-end gap-2">
                        {!isDraft && (
                          <button
                            type="button"
                            onClick={() => viewSubmissionReport(assignment)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-medium border border-blue-500/30 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Reports
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteAssignment(assignment.id)}
                          className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 transition-colors duration-200"
                          title="Delete assignment"
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
          {visibleAssignments.length === 0 && (
            <div className="text-center py-12 text-[#fdfdff]/60">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No assignments for this class yet. Generate an MCQ set to get started.</p>
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {/* RAG MCQ assignment builder (rag-main API) */}
      {isAssignmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setIsAssignmentModalOpen(false);
              setRagError(null);
            }}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 rounded-2xl bg-[#0A1428] border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.3)] animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#fdfdff]">Generate assignment</h2>
                <p className="text-sm text-[#fdfdff]/50 mt-1">
                  Create MCQ or coding assignments for this class.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAssignmentModalOpen(false);
                  setRagError(null);
                }}
                className="p-2 rounded-lg hover:bg-white/10 text-[#fdfdff]/60 hover:text-[#fdfdff] transition-colors duration-200"
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
                  className="w-full px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[#fdfdff] focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
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
                  Chapters (multi-select, student RAG catalog)
                </label>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-purple-500/30 bg-purple-500/5 p-3 space-y-2">
                  {ragChaptersLoading && (
                    <div className="flex items-center gap-2 text-sm text-[#fdfdff]/50 py-4 justify-center">
                      <Loader className="w-4 h-4 animate-spin" />
                      Loading chapters…
                    </div>
                  )}
                  {!ragChaptersLoading &&
                    ragChapters.map((ch) => (
                      <label
                        key={ch.id}
                        className="flex items-start gap-3 cursor-pointer rounded-lg p-2 hover:bg-white/5"
                      >
                        <input
                          type="checkbox"
                          checked={selectedChapterIds.includes(ch.id)}
                          onChange={() => toggleChapterId(ch.id)}
                          className="mt-1 rounded border-purple-500/50 text-purple-500 focus:ring-purple-500/30"
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
                    className="w-full px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[#fdfdff] focus:outline-none focus:border-purple-500/50"
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
                    className="w-full px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[#fdfdff] focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="L" className="bg-[#0A1428]">L — Low</option>
                    <option value="M" className="bg-[#0A1428]">M — Medium</option>
                    <option value="H" className="bg-[#0A1428]">H — High</option>
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
                      className="w-full px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[#fdfdff] font-[JetBrains_Mono] focus:outline-none focus:border-purple-500/50"
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
                      className="w-full px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[#fdfdff] font-[JetBrains_Mono] focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                  {codingCreationMode === "ai" ? (
                    <div>
                      <label className="block text-sm font-medium text-[#fdfdff]/80 mb-2">Instructions</label>
                      <textarea
                        rows={3}
                        value={codingInstructions}
                        onChange={(e) => setCodingInstructions(e.target.value)}
                        placeholder="Optional constraints for AI generation"
                        className="w-full px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[#fdfdff] focus:outline-none focus:border-purple-500/50"
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
                  className="w-full px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[#fdfdff] font-[JetBrains_Mono] focus:outline-none focus:border-purple-500/50"
                />
                <p className="text-xs text-[#fdfdff]/40 mt-1">Defaults to one week from today if empty.</p>
              </div>

              {ragError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-sm text-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{ragError}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={ragGenerating}
                  onClick={handleGenerateRagAssignment}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-500/25 hover:bg-purple-500/35 disabled:opacity-50 text-purple-200 rounded-xl border border-purple-500/40 font-medium transition-all duration-300 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
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
                    setIsAssignmentModalOpen(false);
                    setRagError(null);
                    setEditingAssignment(null);
                  }}
                  className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-[#fdfdff]/70 hover:text-[#fdfdff] rounded-xl font-medium transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportModalAssignment && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
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
          <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-[#0A1428] border border-blue-500/30">
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
            <h3 className="text-2xl font-bold text-[#fdfdff] mb-2">Submission report</h3>
            <p className="text-[#fdfdff]/60 mb-5">{reportModalAssignment.topic}</p>
            {reportLoading ? (
              <div className="py-10 text-center text-[#fdfdff]/60">
                <Loader className="w-7 h-7 animate-spin mx-auto mb-3" />
                Loading submissions…
              </div>
            ) : reportError ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm">{reportError}</div>
            ) : reportData ? (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                    <p className="text-xs text-[#fdfdff]/55">Students</p>
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
                    <p className="text-xs text-[#fdfdff]/55">Avg score</p>
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
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <div>
                            <p className="text-[#fdfdff] font-medium">{sub.studentName}</p>
                            <p className="text-xs text-[#fdfdff]/55">{sub.studentEmail || "—"}</p>
                          </div>
                          <div className="text-sm text-[#fdfdff]/70">
                            <span className="text-emerald-300 font-medium mr-2">
                              {sub.score}/{sub.totalQuestions} ({sub.percentage}%)
                            </span>
                            {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : ""}
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
                          <div className="mt-2 text-xs text-[#fdfdff]/75 border-t border-white/10 pt-2 space-y-2">
                            <p className="text-[#fdfdff]/55 font-medium">Coding analytics</p>
                            {sub.codingSubmissions.map((cs) => (
                              <div key={`${sub.id}-${cs.taskId}`} className="bg-black/30 rounded-lg p-2 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-[#fdfdff]">Task {cs.taskId}</span>
                                  <span className="font-[JetBrains_Mono]">
                                    {cs.testCasesPassed}/{cs.totalTestCases} passed
                                  </span>
                                </div>
                                
                                {/* Test Case Results Breakdown */}
                                {Array.isArray(cs.testCaseResults) && cs.testCaseResults.length > 0 && (
                                  <div className="mt-1 space-y-0.5 text-xs">
                                    {cs.testCaseResults.map((tcr, tcIdx) => (
                                      <div key={tcIdx} className="flex items-start gap-2">
                                        <span className={tcr.passed ? "text-emerald-400" : "text-rose-400"}>
                                          {tcr.passed ? "✓" : "✗"}
                                        </span>
                                        <div className="flex-1 font-[JetBrains_Mono] text-[#fdfdff]/60">
                                          <div>Case {tcIdx + 1}: <span className="text-[#fdfdff]/80">{tcr.input || "(empty)"}</span></div>
                                          {!tcr.passed && (
                                            <div className="ml-4 text-rose-400/80">
                                              Expected: <span className="text-[#fdfdff]/70">{tcr.expectedOutput}</span>
                                            </div>
                                          )}
                                          {!tcr.passed && (
                                            <div className="ml-4 text-rose-400/80">
                                              Got: <span className="text-[#fdfdff]/70">{tcr.actualOutput || tcr.error || "(no output)"}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                <p className="text-[#fdfdff]/50 pt-1">Attempts: {sub.attemptCount || 1}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-[#fdfdff]/60 text-sm text-center">
                    No submissions yet.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSettingsOpen(false)}
          />
          <div className="relative w-full max-w-lg p-8 rounded-2xl bg-[#0A1428] border border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.3)] animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#fdfdff]">Class Settings</h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-[#fdfdff]/60 hover:text-[#fdfdff] transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#fdfdff]/80 mb-2">Class Name</label>
                <input
                  type="text"
                  defaultValue={currentClass.name}
                  className="w-full px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-[#fdfdff] focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#fdfdff]/80 mb-2">Join Code</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={currentClass.joinCode}
                    readOnly
                    className="flex-1 px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-[#fdfdff] font-[JetBrains_Mono] font-semibold focus:outline-none"
                  />
                  <button className="px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl border border-blue-500/30 transition-colors duration-200">
                    Regenerate
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                <button className="w-full px-6 py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-xl border border-rose-500/30 font-medium transition-all duration-300 hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Class</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}