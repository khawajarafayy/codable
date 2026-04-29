import { Play, Send, Code2, Terminal, Square, AlertCircle, Timer } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { parse } from 'java-parser';
const DEFAULT_WS_URL = `${(import.meta.env.VITE_API_URL || 'http://localhost:3000')
  .replace(/^http/, 'ws')
  .replace(/\/$/, '')}/ws/compiler`;
const WS_URL = import.meta.env.VITE_WS_URL || DEFAULT_WS_URL;

export function PracticeEditor({ code, onChange, onSubmit, onRunComplete, question }) {
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stdinDraft, setStdinDraft] = useState('');
  const [syntaxErrors, setSyntaxErrors] = useState([]);
  const [executionMetrics, setExecutionMetrics] = useState(null);
  const [complexityData, setComplexityData] = useState(null);

  const outputBufferRef = useRef('');

  const [timerStarted, setTimerStarted] = useState(false);
  const [solutionStartTime, setSolutionStartTime] = useState(null);
  const [solutionTime, setSolutionTime] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const wsRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    setTimerStarted(false);
    setSolutionStartTime(null);
    startTimeRef.current = null;
    setAttempts(0);
    setOutput('');
    outputBufferRef.current = '';
    setSolutionTime(0);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [question?.id]);

  const startTimerIfNeeded = () => {
    if (!timerStarted) {
      const newStartTime = Date.now();
      setSolutionStartTime(newStartTime);
      startTimeRef.current = newStartTime;
      setTimerStarted(true);

      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setSolutionTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);
    }
  };

  useEffect(() => {
    const checkSyntax = () => {
      if (!code || code.trim().length === 0) {
        setSyntaxErrors([]);
        clearEditorMarkers();
        return;
      }

      try {
        parse(code);
        setSyntaxErrors([]);
        clearEditorMarkers();
      } catch (error) {
        if (error.message) {
          setSyntaxErrors([error.message]);
          showEditorMarkers(error);
        }
      }
    };

    const debounce = setTimeout(checkSyntax, 300);
    return () => clearTimeout(debounce);
  }, [code]);

  const clearEditorMarkers = () => {
    if (monacoRef.current && editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelMarkers(model, 'java-syntax', []);
      }
    }
  };

  const showEditorMarkers = (error) => {
    if (!monacoRef.current || !editorRef.current) return;

    const model = editorRef.current.getModel();
    if (!model) return;

    let lineNumber = 1;
    let startColumn = 1;
    let endColumn = 1000;

    const lineMatch =
      error.message.match(/line\s*(\d+)/i) ||
      error.message.match(/\((\d+):\d+\)/) ||
      error.message.match(/at\s*(\d+)/);
    if (lineMatch) {
      lineNumber = parseInt(lineMatch[1], 10);
    }

    const colMatch = error.message.match(/column\s*(\d+)/i) || error.message.match(/\(\d+:(\d+)\)/);
    if (colMatch) {
      startColumn = parseInt(colMatch[1], 10);
      endColumn = startColumn + 10;
    }

    const totalLines = model.getLineCount();
    if (lineNumber > totalLines) lineNumber = totalLines;
    if (lineNumber < 1) lineNumber = 1;

    const markers = [
      {
        severity: monacoRef.current.MarkerSeverity.Error,
        startLineNumber: lineNumber,
        startColumn,
        endLineNumber: lineNumber,
        endColumn,
        message: error.message,
      },
    ];

    monacoRef.current.editor.setModelMarkers(model, 'java-syntax', markers);
  };

  const connectWebSocket = () => {
    return new Promise((resolve, reject) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        resolve(wsRef.current);
        return;
      }

      wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onopen = () => {
        resolve(wsRef.current);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      wsRef.current.onclose = () => {};
    });
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'output':
        outputBufferRef.current += data.data;
        setOutput((prev) => prev + data.data);
        break;
      case 'error':
        outputBufferRef.current += `\nError: ${data.data}`;
        setOutput((prev) => prev + `\nError: ${data.data}`);
        break;
      case 'metrics':
        setExecutionMetrics((prev) => ({
          ...prev,
          execution_time_ms: data.data.execution_time_ms,
          peak_memory_kb: data.data.peak_memory_kb,
          time_complexity: data.data.time_complexity,
          space_complexity: data.data.space_complexity,
        }));
        break;
      case 'exit':
        setIsRunning(false);
        setExecutionMetrics((prev) => ({
          ...prev,
          executionTime: data.data?.executionTime ?? prev?.execution_time_ms,
          memoryUsed: data.data?.memoryUsed,
        }));
        if (onRunComplete) {
          onRunComplete(outputBufferRef.current);
        }
        break;
      case 'complexity':
        setComplexityData(data.data);
        break;
      default:
        break;
    }
  };

  const handleRun = async () => {
    if (syntaxErrors.length > 0) {
      setOutput('⚠️ Please fix syntax errors before running:\n' + syntaxErrors.join('\n'));
      return;
    }

    setIsRunning(true);
    setOutput('');
    outputBufferRef.current = '';
    setAttempts((prev) => prev + 1);

    try {
      const ws = await connectWebSocket();
      ws.send(
        JSON.stringify({
          type: 'run',
          code,
          input: stdinDraft,
          questionId: question?.id,
        })
      );
    } catch (error) {
      setOutput(`Failed to connect: ${error.message}`);
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stop' }));
    }
    setIsRunning(false);
  };

  const handleSubmit = async () => {
    if (syntaxErrors.length > 0) {
      setOutput('⚠️ Please fix syntax errors before submitting:\n' + syntaxErrors.join('\n'));
      return;
    }

    setIsSubmitting(true);

    const totalTime =
      timerStarted && startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;

    const metrics = {
      solutionTime: totalTime,
      attempts,
      syntaxErrors: syntaxErrors.length,
      output: outputBufferRef.current || output,
      executionMetrics: {
        executionTime: executionMetrics?.execution_time_ms ?? executionMetrics?.executionTime,
        memoryUsed: executionMetrics?.peak_memory_kb ?? executionMetrics?.memoryUsed,
        ...executionMetrics,
      },
      complexity: complexityData,
    };

    try {
      if (typeof onSubmit === 'function') {
        await onSubmit(metrics);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#1a1a2e]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#0d0d1a] border-b border-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-400">
            <Code2 className="h-4 w-4" />
            <span className="text-sm">Solution.java</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Timer className="h-4 w-4" />
            <span className="text-sm">{timerStarted ? formatTime(solutionTime) : 'Start typing...'}</span>
          </div>
          {attempts > 0 && (
            <span className="text-sm text-gray-500">Runs: {attempts}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {syntaxErrors.length > 0 && (
            <div className="flex items-center gap-1 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Syntax errors</span>
            </div>
          )}
          {isRunning ? (
            <Button onClick={handleStop} variant="destructive" size="sm" className="gap-2">
              <Square className="h-4 w-4" />
              Stop
            </Button>
          ) : (
            <Button
              onClick={handleRun}
              variant="outline"
              size="sm"
              className="gap-2 border-green-600 text-green-400 hover:bg-green-600/20"
            >
              <Play className="h-4 w-4" />
              Run
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            size="sm"
            className="gap-2 bg-[#6C63FF] hover:bg-[#5a52d5]"
            disabled={isSubmitting || isRunning}
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="java"
          value={code}
          onChange={(value) => {
            startTimerIfNeeded();
            onChange(value || '');
          }}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            wordWrap: 'on',
            glyphMargin: true,
          }}
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            monacoRef.current = monaco;
          }}
        />
      </div>

      <div className="h-48 border-t border-gray-800 flex flex-col">
        <div className="flex flex-col gap-2 px-4 py-2 bg-[#0d0d1a] border-b border-gray-800">
          <label className="text-[11px] text-gray-500">
            Optional stdin for Run (official tests use their own inputs on Submit)
            <input
              value={stdinDraft}
              onChange={(e) => setStdinDraft(e.target.value)}
              className="mt-1 w-full px-2 py-1 rounded bg-black/40 border border-gray-700 text-gray-200 text-xs font-mono"
              placeholder="e.g. 5"
            />
          </label>
        </div>
        <div className="flex items-center justify-between px-4 py-2 bg-[#0d0d1a] border-b border-gray-800 border-t-0">
          <div className="flex items-center gap-2 text-gray-400">
            <Terminal className="h-4 w-4" />
            <span className="text-sm">Console (Run only — not graded)</span>
          </div>
          {executionMetrics && (
            <div className="text-xs text-gray-500">
              {executionMetrics.time_complexity && (
                <span className="mr-2">T: {executionMetrics.time_complexity}</span>
              )}
              {executionMetrics.space_complexity && <span>S: {executionMetrics.space_complexity}</span>}
            </div>
          )}
        </div>
        <div className="flex-1 p-4 overflow-auto bg-[#0a0a15]">
          {isRunning && !output && <div className="text-gray-400 animate-pulse">Running...</div>}
          <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
            {output || 'Run your code to see output. Official tests run only when you click Submit.'}
          </pre>
          {Array.isArray(question?.examples) && question.examples.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500 mb-1">Sample I/O (illustration):</p>
              <pre className="text-sm text-gray-400 font-mono">
                {question.examples.map((ex, i) => (
                  <span key={i}>
                    {ex.input != null && String(ex.input).length > 0 ? `In: ${ex.input}\n` : ''}
                    {ex.output != null ? `Out: ${ex.output}\n` : ''}
                  </span>
                ))}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
