import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { AlertCircle, Loader, Play, Send, Square } from "lucide-react";
import OutputConsole from "../../../Workspace/components/OutputConsole";

const JAVA_TEMPLATE = `public class Main {
    public static void main(String[] args) {
        // Write your solution here
    }
}
`;

export default function CodingTaskEditor({ assignment, onSubmitCodingAssignment }) {
  const tasks = Array.isArray(assignment?.codingTasks) ? assignment.codingTasks : [];
  const [activeTaskIdx, setActiveTaskIdx] = useState(0);
  const [codeByTaskId, setCodeByTaskId] = useState(() =>
    Object.fromEntries(tasks.map((t) => [String(t.id), JAVA_TEMPLATE]))
  );
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [output, setOutput] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const wsRef = useRef(null);

  const activeTask = tasks[activeTaskIdx];
  const activeTaskId = String(activeTask?.id || "");
  const activeCode = codeByTaskId[activeTaskId] || JAVA_TEMPLATE;
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const sampleCases = useMemo(() => (Array.isArray(activeTask?.sampleTestCases) ? activeTask.sampleTestCases : []), [activeTask]);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timer = setTimeout(() => setToastMessage(""), 3200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleRun = () => {
    if (!activeTask) return;
    if (running) return;
    setOutput("Connecting to compiler...\n");
    setRunning(true);
    const wsBase = String(apiBase || "http://localhost:3000").replace(/\/$/, "").replace(/^http/, "ws");
    const ws = new WebSocket(`${wsBase}/ws/compiler`);
    wsRef.current = ws;

    ws.onopen = () => {
      setOutput("Compiling and running...\n");
      ws.send(JSON.stringify({ type: "run", code: activeCode }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "output") {
        setOutput((prev) => prev + String(msg.data || ""));
      }
      if (msg.type === "error") {
        setOutput((prev) => prev + `[ERROR] ${String(msg.data || "")}`);
      }
      if (msg.type === "exit") {
        setOutput((prev) => prev + `\n[Process exited with code ${msg.code}]`);
        setRunning(false);
        ws.close();
      }
    };

    ws.onerror = () => {
      setOutput((prev) => prev + "\n[ERROR] WebSocket connection failed. Ensure backend is running.");
      setRunning(false);
    };

    ws.onclose = () => {
      setRunning(false);
    };
  };

  const handleStop = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: "stop" }));
      wsRef.current.close();
    }
    setOutput((prev) => prev + "\n[Execution stopped by user]");
    setRunning(false);
  };

  const handleInput = (input) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "input", data: input }));
    }
  };

  const handleSubmit = async () => {
    const unsolvedTaskNumbers = tasks
      .map((task, idx) => {
        const code = String(codeByTaskId[String(task.id)] || "").trim();
        const isSolved = code.length > 0 && code !== JAVA_TEMPLATE.trim();
        return isSolved ? null : idx + 1;
      })
      .filter(Boolean);

    if (unsolvedTaskNumbers.length > 0) {
      const msg =
        unsolvedTaskNumbers.length === 1
          ? `Please solve Task ${unsolvedTaskNumbers[0]} before submitting.`
          : `Please solve all remaining tasks before submitting. Pending: ${unsolvedTaskNumbers
              .map((n) => `Task ${n}`)
              .join(", ")}`;
      setSubmitError(msg);
      setToastMessage(msg);
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const codingSubmissions = tasks.map((task) => ({
        taskId: String(task.id),
        codeSnippet: codeByTaskId[String(task.id)] || JAVA_TEMPLATE,
      }));
      await onSubmitCodingAssignment(codingSubmissions);
    } catch (e) {
      setSubmitError(e?.message || "Failed to submit coding assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!activeTask) {
    return (
      <div className="p-6 rounded-2xl border border-white/10 bg-white/5 text-[#fdfdff]/60">
        No coding tasks found for this assignment.
      </div>
    );
  }

  return (
    <div className="space-y-5 relative">
      {toastMessage && (
        <div className="absolute top-0 right-0 z-20 max-w-md p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-sm shadow-[0_0_20px_rgba(245,158,11,0.25)] animate-in fade-in slide-in-from-top-2 duration-200">
          {toastMessage}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {tasks.map((t, idx) => (
          <button
            key={t.id || idx}
            type="button"
            onClick={() => setActiveTaskIdx(idx)}
            className={`px-3 py-2 rounded-lg border text-sm ${
              idx === activeTaskIdx
                ? "bg-blue-500/20 border-blue-500/40 text-blue-200"
                : "bg-white/5 border-white/10 text-[#fdfdff]/70"
            }`}
          >
            Task {idx + 1}
          </button>
        ))}
      </div>

      <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
        <p className="text-white font-semibold mb-2">Problem Statement</p>
        <p className="text-[#fdfdff]/80 whitespace-pre-wrap">{activeTask.problemStatement}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm">
          <div className="p-3 rounded-lg bg-black/30 border border-white/10">
            <p className="text-[#fdfdff]/55 mb-1">Input Format</p>
            <p className="text-[#fdfdff]/80 whitespace-pre-wrap">{activeTask.inputFormat || "—"}</p>
          </div>
          <div className="p-3 rounded-lg bg-black/30 border border-white/10">
            <p className="text-[#fdfdff]/55 mb-1">Output Format</p>
            <p className="text-[#fdfdff]/80 whitespace-pre-wrap">{activeTask.outputFormat || "—"}</p>
          </div>
        </div>
      </div>

      <div className="h-[360px] rounded-2xl overflow-hidden border border-white/10">
        <Editor
          height="100%"
          language="java"
          theme="vs-dark"
          value={activeCode}
          onChange={(value) =>
            setCodeByTaskId((prev) => ({ ...prev, [activeTaskId]: value || JAVA_TEMPLATE }))
          }
          options={{ minimap: { enabled: false }, fontSize: 14, automaticLayout: true }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={running ? handleStop : handleRun}
          disabled={!running && !activeTask}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-white disabled:opacity-50"
        >
          {running ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {running ? "Stop" : "Run Code"}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white disabled:opacity-50"
        >
          {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Submit Assignment
        </button>
      </div>
      <div className="h-48">
        <OutputConsole
          output={output}
          setOutput={setOutput}
          onInput={handleInput}
          resetTerminal={() => setOutput("")}
          isRunning={running}
        />
      </div>

      {sampleCases.length > 0 && (
        <p className="text-xs text-[#fdfdff]/45">
          Sample test cases are shown above for reference. Use the console input bar after clicking Run.
        </p>
      )}
      {submitError && (
        <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-200 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {submitError}
        </div>
      )}
    </div>
  );
}
