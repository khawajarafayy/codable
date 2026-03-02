import { Play, Send, Code2, Terminal, Square, AlertCircle, Timer, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { parse } from 'java-parser';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws/code';

export function PracticeEditor({ code, onChange, onSubmit, onRunComplete, question }) {
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [syntaxErrors, setSyntaxErrors] = useState([]);
  const [executionMetrics, setExecutionMetrics] = useState(null);
  const [complexityData, setComplexityData] = useState(null);
  const [outputMatch, setOutputMatch] = useState(null);
  
  // Solution time tracking - timer starts on first keystroke
  const [timerStarted, setTimerStarted] = useState(false);
  const [solutionStartTime, setSolutionStartTime] = useState(null);
  const [solutionTime, setSolutionTime] = useState(0);
  const [attempts, setAttempts] = useState(0);
  
  const wsRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Reset timer when question changes (timer starts on first keystroke)
  useEffect(() => {
    // Reset everything for new question
    setTimerStarted(false);
    setSolutionStartTime(null);
    startTimeRef.current = null;
    setAttempts(0);
    setOutput('');
    setOutputMatch(null);
    setSolutionTime(0);
    
    // Clear any existing timer
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

  // Start timer on first keystroke
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

  // Check syntax errors in real-time and show red underlines
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

  // Clear Monaco editor error markers
  const clearEditorMarkers = () => {
    if (monacoRef.current && editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelMarkers(model, 'java-syntax', []);
      }
    }
  };

  // Show red underline markers in Monaco editor
  const showEditorMarkers = (error) => {
    if (!monacoRef.current || !editorRef.current) return;
    
    const model = editorRef.current.getModel();
    if (!model) return;

    // Try to extract line number from error message
    let lineNumber = 1;
    let startColumn = 1;
    let endColumn = 1000;
    
    // Common patterns: "line X", "Line X", "at line X", "(X:Y)"
    const lineMatch = error.message.match(/line\s*(\d+)/i) || 
                      error.message.match(/\((\d+):\d+\)/) ||
                      error.message.match(/at\s*(\d+)/);
    if (lineMatch) {
      lineNumber = parseInt(lineMatch[1], 10);
    }
    
    // Column pattern: "column X" or "(line:column)"
    const colMatch = error.message.match(/column\s*(\d+)/i) ||
                     error.message.match(/\(\d+:(\d+)\)/);
    if (colMatch) {
      startColumn = parseInt(colMatch[1], 10);
      endColumn = startColumn + 10;
    }

    // Ensure line number is valid
    const totalLines = model.getLineCount();
    if (lineNumber > totalLines) lineNumber = totalLines;
    if (lineNumber < 1) lineNumber = 1;

    const markers = [{
      severity: monacoRef.current.MarkerSeverity.Error,
      startLineNumber: lineNumber,
      startColumn: startColumn,
      endLineNumber: lineNumber,
      endColumn: endColumn,
      message: error.message
    }];

    monacoRef.current.editor.setModelMarkers(model, 'java-syntax', markers);
  };

  // Check if output matches expected
  useEffect(() => {
    if (output && question?.expectedOutput) {
      const normalizedOutput = output.trim().toLowerCase();
      const normalizedExpected = question.expectedOutput.trim().toLowerCase();
      const matches = normalizedOutput.includes(normalizedExpected) || 
                      normalizedExpected.includes(normalizedOutput) ||
                      normalizedOutput === normalizedExpected;
      setOutputMatch(matches);
    }
  }, [output, question?.expectedOutput]);

  const connectWebSocket = () => {
    return new Promise((resolve, reject) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        resolve(wsRef.current);
        return;
      }

      wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
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

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
      };
    });
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'output':
        setOutput((prev) => prev + data.data);
        break;
      case 'error':
        setOutput((prev) => prev + `\nError: ${data.data}`);
        break;
      case 'exit':
        setIsRunning(false);
        setExecutionMetrics({
          executionTime: data.executionTime,
          memoryUsed: data.memoryUsed
        });
        if (onRunComplete) {
          onRunComplete(output);
        }
        break;
      case 'complexity':
        setComplexityData(data.data);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const handleRun = async () => {
    if (syntaxErrors.length > 0) {
      setOutput('⚠️ Please fix syntax errors before running:\n' + syntaxErrors.join('\n'));
      return;
    }

    setIsRunning(true);
    setOutput('');
    setOutputMatch(null);
    setAttempts(prev => prev + 1);

    try {
      const ws = await connectWebSocket();
      ws.send(JSON.stringify({
        type: 'run',
        code: code,
        input: inputValue,
        questionId: question?.id
      }));
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
    
    // Run the code first if not already run
    if (!output) {
      await handleRun();
      // Wait for execution to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Calculate total time (use current solutionTime if timer was started, otherwise 0)
    const totalTime = timerStarted && startTimeRef.current 
      ? Math.floor((Date.now() - startTimeRef.current) / 1000) 
      : 0;
    
    // Check code against question requirements
    const codeAnalysis = analyzeCode(code, question);
    
    const metrics = {
      solutionTime: totalTime,
      attempts: attempts,
      syntaxErrors: syntaxErrors.length,
      output: output,
      executionMetrics: executionMetrics,
      complexity: complexityData,
      codeAnalysis: codeAnalysis,
      outputMatches: outputMatch,
      score: calculateScore(codeAnalysis, outputMatch, attempts, totalTime)
    };

    setIsSubmitting(false);
    onSubmit(metrics);
  };

  const analyzeCode = (code, question) => {
    const analysis = {
      containsRequired: [],
      missingRequired: [],
      containsForbidden: [],
      keywordsFound: []
    };

    if (!question) return analysis;

    // Check mustContain patterns
    (question.mustContain || []).forEach(pattern => {
      if (code.toLowerCase().includes(pattern.toLowerCase())) {
        analysis.containsRequired.push(pattern);
      } else {
        analysis.missingRequired.push(pattern);
      }
    });

    // Check mustNotContain patterns
    (question.mustNotContain || []).forEach(pattern => {
      if (code.toLowerCase().includes(pattern.toLowerCase())) {
        analysis.containsForbidden.push(pattern);
      }
    });

    // Check solution keywords
    (question.solutionKeywords || []).forEach(keyword => {
      if (code.toLowerCase().includes(keyword.toLowerCase())) {
        analysis.keywordsFound.push(keyword);
      }
    });

    return analysis;
  };

  const calculateScore = (analysis, outputMatches, attempts, time) => {
    let score = 0;

    // Output match: 50 points
    if (outputMatches) score += 50;

    // Required patterns: 30 points
    const requiredTotal = analysis.containsRequired.length + analysis.missingRequired.length;
    if (requiredTotal > 0) {
      score += Math.round((analysis.containsRequired.length / requiredTotal) * 30);
    } else {
      score += 30;
    }

    // No forbidden patterns: 10 points
    if (analysis.containsForbidden.length === 0) score += 10;

    // Bonus for fewer attempts: up to 5 points
    if (attempts === 1) score += 5;
    else if (attempts === 2) score += 3;
    else if (attempts <= 4) score += 1;

    // Bonus for quick solution: up to 5 points
    if (time < 60) score += 5;
    else if (time < 120) score += 3;
    else if (time < 300) score += 1;

    return Math.min(100, score);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#1a1a2e]">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0d0d1a] border-b border-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-400">
            <Code2 className="h-4 w-4" />
            <span className="text-sm">Solution.java</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Timer className="h-4 w-4" />
            <span className="text-sm">
              {timerStarted ? formatTime(solutionTime) : 'Start typing...'}
            </span>
          </div>
          {attempts > 0 && (
            <span className="text-sm text-gray-500">
              Attempts: {attempts}
            </span>
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
            <Button
              onClick={handleStop}
              variant="destructive"
              size="sm"
              className="gap-2"
            >
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

      {/* Code Editor */}
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
            glyphMargin: true
          }}
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            monacoRef.current = monaco;
          }}
        />
      </div>

      {/* Output Panel */}
      <div className="h-48 border-t border-gray-800 flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 bg-[#0d0d1a] border-b border-gray-800">
          <div className="flex items-center gap-2 text-gray-400">
            <Terminal className="h-4 w-4" />
            <span className="text-sm">Output</span>
          </div>
          {outputMatch !== null && (
            <div className={`flex items-center gap-2 ${outputMatch ? 'text-green-400' : 'text-yellow-400'}`}>
              {outputMatch ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Output matches expected!</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm">Output doesn't match expected</span>
                </>
              )}
            </div>
          )}
          {executionMetrics && (
            <div className="text-xs text-gray-500">
              Time: {executionMetrics.executionTime}ms | Memory: {executionMetrics.memoryUsed}MB
            </div>
          )}
        </div>
        <div className="flex-1 p-4 overflow-auto bg-[#0a0a15]">
          {isRunning && !output && (
            <div className="text-gray-400 animate-pulse">Running...</div>
          )}
          <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
            {output || 'Output will appear here...'}
          </pre>
          {question?.expectedOutput && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500 mb-1">Expected Output:</p>
              <pre className="text-sm text-gray-400 font-mono">{question.expectedOutput}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}