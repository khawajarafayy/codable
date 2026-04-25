import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { Play, Save, Square } from "lucide-react";
import { parse } from "java-parser";

const CodeEditor = ({ code, setCode, handleRun, handleStop, handleSave, selectedFile, isRunning }) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [syntaxErrors, setSyntaxErrors] = useState([]);

  const clearEditorMarkers = () => {
    if (!monacoRef.current || !editorRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;
    monacoRef.current.editor.setModelMarkers(model, "java-syntax", []);
  };

  const showEditorMarkers = (error) => {
    if (!monacoRef.current || !editorRef.current) return;

    const model = editorRef.current.getModel();
    if (!model) return;

    let lineNumber = 1;
    let startColumn = 1;
    let endColumn = 1000;

    // Extract line/column from parser error message when available.
    const lineMatch =
      error.message.match(/line\s*(\d+)/i) ||
      error.message.match(/\((\d+):\d+\)/) ||
      error.message.match(/at\s*(\d+)/);
    if (lineMatch) {
      lineNumber = parseInt(lineMatch[1], 10);
    }

    const colMatch =
      error.message.match(/column\s*(\d+)/i) ||
      error.message.match(/\(\d+:(\d+)\)/);
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

    monacoRef.current.editor.setModelMarkers(model, "java-syntax", markers);
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

    const debounce = setTimeout(checkSyntax, 250);
    return () => clearTimeout(debounce);
  }, [code]);

  return (
    <div className="h-full bg-[#0f1117] rounded-lg border border-gray-800 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#141622] border-b border-gray-800">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            {selectedFile}
          </h3>
          {syntaxErrors.length > 0 && (
            <span className="text-xs text-red-400">Syntax error detected</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
          >
            <Save size={14} />
            Save
          </button>
          {isRunning ? (
            <button
              onClick={handleStop}
              className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
            >
              <Square size={14} />
              Stop
            </button>
          ) : (
            <button
              onClick={handleRun}
              className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
            >
              <Play size={14} />
              Run
            </button>
          )}
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language="java"
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value || "")}
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            monacoRef.current = monaco;
          }}
          options={{
            fontSize: 14,
            fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            automaticLayout: true,
            tabSize: 4,
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
