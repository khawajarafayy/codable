import { Play, Send, Code2, Terminal, Square, AlertCircle, Timer } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { parse } from 'java-parser';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws/code';

export function PracticeEditor({ code, onChange, onSubmit, question }) {
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [syntaxErrors, setSyntaxErrors] = useState([]);
  const [executionMetrics, setExecutionMetrics] = useState(null);
  const [complexityData, setComplexityData] = useState(null);
  
  // Solution time tracking
  const [solutionStartTime, setSolutionStartTime] = useState(null);
  const [solutionTime, setSolutionTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const wsRef = useRef(null);
  const outputRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const submitResolveRef = useRef(null);

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Timer effect - updates every second
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setSolutionTime(Math.floor((Date.now() - solutionStartTime) / 1000));
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, solutionStartTime]);

  // Real-time Java syntax validation
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const validateJava = () => {
      try {
        parse(code);
        
        monacoRef.current.editor.setModelMarkers(
          editorRef.current.getModel(),
          'java-syntax',
          []
        );
        setSyntaxErrors([]);
      } catch (err) {
        const markers = [];
        
        if (err.name === 'MismatchedTokenException' || err.name === 'NoViableAltException') {
          const line = err.token?.startLine || 1;
          const column = err.token?.startColumn || 1;
          const endLine = err.token?.endLine || line;
          const endColumn = err.token?.endColumn || column + 1;
          
          markers.push({
            severity: monacoRef.current.MarkerSeverity.Error,
            message: err.message || 'Syntax error',
            startLineNumber: line,
            startColumn: column,
            endLineNumber: endLine,
            endColumn: endColumn,
          });
        } else if (err.previousToken) {
          const line = err.previousToken.endLine || 1;
          const column = err.previousToken.endColumn || 1;
          
          markers.push({
            severity: monacoRef.current.MarkerSeverity.Error,
            message: err.message || 'Unexpected token',
            startLineNumber: line,
            startColumn: column,
            endLineNumber: line,
            endColumn: column + 10,
          });
        } else {
          markers.push({
            severity: monacoRef.current.MarkerSeverity.Error,
            message: err.message || 'Syntax error detected',
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: 1,
            endColumn: 10,
          });
        }

        monacoRef.current.editor.setModelMarkers(
          editorRef.current.getModel(),
          'java-syntax',
          markers
        );
        setSyntaxErrors(markers);
      }
    };

    const timeoutId = setTimeout(validateJava, 300);
    return () => clearTimeout(timeoutId);
  }, [code]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    setTimeout(() => {
      if (code) {
        editor.getModel().onDidChangeContent(() => {});
      }
    }, 100);
  };

  const handleCodeChange = (newCode) => {
    // Start timer on first keystroke
    if (!solutionStartTime && newCode && newCode.trim().length > 0) {
      setSolutionStartTime(Date.now());
      setIsTimerRunning(true);
    }
    
    onChange(newCode || '');
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const runCodeAndGetMetrics = () => {
    return new Promise((resolve, reject) => {
      if (syntaxErrors.length > 0) {
        reject(new Error('Syntax errors present'));
        return;
      }

      setOutput('Running code to collect metrics...\n');
      setIsRunning(true);
      setExecutionMetrics(null);
      setComplexityData(null);

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      submitResolveRef.current = resolve;

      let tempMetrics = null;
      let tempComplexity = null;

      ws.onopen = () => {
        setOutput((prev) => prev + 'Compiling and analyzing...\n');
        ws.send(JSON.stringify({ type: 'run', code }));
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === 'output') {
          setOutput((prev) => prev + msg.data);
        }

        if (msg.type === 'error') {
          setOutput((prev) => prev + `[ERROR] ${msg.data}`);
        }

        if (msg.type === 'complexity') {
          tempComplexity = msg.data;
          setComplexityData(msg.data);
          console.log('✅ Complexity data received:', msg.data);
        }

        if (msg.type === 'metrics') {
          tempMetrics = msg.data;
          setExecutionMetrics(msg.data);
          console.log('✅ Execution metrics received:', msg.data);
          setOutput((prev) => prev + `\n[Execution Time: ${msg.data.execution_time_formatted}]`);
          setOutput((prev) => prev + `\n[Peak Memory: ${msg.data.peak_memory_formatted}]`);
        }

        if (msg.type === 'exit') {
          setOutput((prev) => prev + `\n[Analysis complete]`);
          setIsRunning(false);
          ws.close();
          
          // Resolve with collected metrics
          resolve({
            execution: tempMetrics,
            complexity: tempComplexity
          });
        }
      };

      ws.onerror = () => {
        setOutput((prev) => prev + '\n[ERROR] Connection failed');
        setIsRunning(false);
        reject(new Error('WebSocket connection failed'));
      };

      ws.onclose = () => {
        setIsRunning(false);
      };
    });
  };

  const handleRun = async () => {
    if (syntaxErrors.length > 0) {
      setOutput('[ERROR] Please fix syntax errors before running code:\n' + 
                syntaxErrors.map(e => `Line ${e.startLineNumber}: ${e.message}`).join('\n'));
      return;
    }

    try {
      await runCodeAndGetMetrics();
    } catch (error) {
      console.error('Run error:', error);
    }
  };

  const handleStop = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'stop' }));
      wsRef.current.close();
    }
    setOutput((prev) => prev + '\n[Execution stopped by user]');
    setIsRunning(false);
  };

  const handleInput = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !isRunning || !wsRef.current) return;

    wsRef.current.send(JSON.stringify({ type: 'input', data: inputValue }));
    setOutput((prev) => prev + inputValue + '\n');
    setInputValue('');
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setIsTimerRunning(false);
    
    // Calculate solution time
    const finalSolutionTime = solutionStartTime 
      ? Math.floor((Date.now() - solutionStartTime) / 1000)
      : 0;

    try {
      // If code hasn't been run yet, run it first to collect metrics
      if (!executionMetrics || !complexityData) {
        setOutput('⏳ Running code to collect performance metrics...\n');
        const { execution, complexity } = await runCodeAndGetMetrics();
        
        // Now we have fresh metrics
        const metricsToSubmit = {
          execution_time_ms: execution?.execution_time_ms || null,
          execution_time_formatted: execution?.execution_time_formatted || 'Not measured',
          peak_memory_kb: execution?.peak_memory_kb || null,
          peak_memory_formatted: execution?.peak_memory_formatted || 'Not measured',
          time_complexity: execution?.time_complexity || complexity?.timeComplexity || 'Not analyzed',
          space_complexity: execution?.space_complexity || complexity?.spaceComplexity || 'Not analyzed',
          solution_time_seconds: finalSolutionTime,
          solution_time_formatted: formatTime(finalSolutionTime)
        };
        
        console.log('✅ Submitting metrics (collected on submit):', metricsToSubmit);
        onSubmit(metricsToSubmit);
      } else {
        // Use existing metrics
        const metricsToSubmit = {
          execution_time_ms: executionMetrics?.execution_time_ms || null,
          execution_time_formatted: executionMetrics?.execution_time_formatted || 'Not measured',
          peak_memory_kb: executionMetrics?.peak_memory_kb || null,
          peak_memory_formatted: executionMetrics?.peak_memory_formatted || 'Not measured',
          time_complexity: executionMetrics?.time_complexity || complexityData?.timeComplexity || 'Not analyzed',
          space_complexity: executionMetrics?.space_complexity || complexityData?.spaceComplexity || 'Not analyzed',
          solution_time_seconds: finalSolutionTime,
          solution_time_formatted: formatTime(finalSolutionTime)
        };
        
        console.log('✅ Submitting metrics (from previous run):', metricsToSubmit);
        onSubmit(metricsToSubmit);
      }
    } catch (error) {
      console.error('❌ Submit error:', error);
      
      // Submit with partial data if analysis fails
      const metricsToSubmit = {
        execution_time_ms: null,
        execution_time_formatted: 'Analysis failed',
        peak_memory_kb: null,
        peak_memory_formatted: 'Analysis failed',
        time_complexity: 'Analysis failed',
        space_complexity: 'Analysis failed',
        solution_time_seconds: finalSolutionTime,
        solution_time_formatted: formatTime(finalSolutionTime)
      };
      
      onSubmit(metricsToSubmit);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Question Summary Bar */}
      <div className="bg-[#13132B]/50 border-b border-gray-800/50 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Code2 className="w-5 h-5 text-[#6C63FF]" />
          <div>
            <h3 className="text-white">{question.title}</h3>
            <p className="text-gray-400 text-sm">{question.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Timer Display */}
          {isTimerRunning && (
            <div className="flex items-center gap-2 bg-[#6C63FF]/10 border border-[#6C63FF]/30 rounded-lg px-3 py-1.5">
              <Timer className="w-4 h-4 text-[#6C63FF] animate-pulse" />
              <span className="text-[#6C63FF] font-mono text-sm">
                {formatTime(solutionTime)}
              </span>
            </div>
          )}
          {syntaxErrors.length > 0 && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{syntaxErrors.length} syntax error{syntaxErrors.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 relative">
          {/* Editor Header */}
          <div className="bg-[#13132B] px-4 py-2 flex items-center justify-between border-b border-gray-800/30">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-3 text-gray-400">Solution.java</span>
            </div>
            <div className="flex items-center gap-2">
              {isRunning ? (
                <Button
                  size="sm"
                  onClick={handleStop}
                  className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 h-8"
                >
                  <Square className="w-3.5 h-3.5 mr-1.5" />
                  Stop
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleRun}
                  disabled={syntaxErrors.length > 0 || isSubmitting}
                  className="bg-[#22D3EE]/20 text-[#22D3EE] hover:bg-[#22D3EE]/30 border border-[#22D3EE]/30 h-8 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                  Run Code
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={isSubmitting || syntaxErrors.length > 0}
                className="bg-gradient-to-r from-[#6C63FF] to-[#22D3EE] hover:from-[#5B52EE] hover:to-[#11C2DD] text-white h-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 mr-1.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="absolute inset-0 top-[42px]">
            <Editor
              height="100%"
              language="java"
              theme="vs-dark"
              value={code}
              onChange={handleCodeChange}
              onMount={handleEditorDidMount}
              options={{
                fontSize: 14,
                fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                automaticLayout: true,
                tabSize: 4,
                quickSuggestions: true,
                suggestOnTriggerCharacters: true,
              }}
            />
          </div>
        </div>

        {/* Output Console */}
        <div className="h-48 border-t border-gray-800/50 bg-[#0B0B1A] flex flex-col shrink-0">
          <div className="bg-[#13132B] px-4 py-2 flex items-center gap-2 border-b border-gray-800/30">
            <Terminal className="w-4 h-4 text-green-400" />
            <span className="text-gray-300">Console Output</span>
            {executionMetrics && (
              <span className="ml-auto text-gray-400 text-sm">
                ⚡ {executionMetrics.execution_time_formatted} | 💾 {executionMetrics.peak_memory_formatted}
              </span>
            )}
          </div>
          <div ref={outputRef} className="flex-1 overflow-auto">
            <pre className="p-4 text-gray-300 font-mono text-sm whitespace-pre-wrap">
              {output || 'Click "Run Code" to see output...'}
            </pre>
          </div>

          {/* Input Field */}
          {isRunning && (
            <form onSubmit={handleInput} className="border-t border-gray-800/30 bg-[#13132B] p-2 flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type input and press Enter..."
                className="flex-1 bg-[#0B0B1A] text-gray-300 font-mono px-3 py-2 rounded border border-gray-700 focus:outline-none focus:border-[#6C63FF]"
                autoFocus
              />
              <Button
                type="submit"
                size="sm"
                className="bg-[#6C63FF] hover:bg-[#5B52EE] text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}