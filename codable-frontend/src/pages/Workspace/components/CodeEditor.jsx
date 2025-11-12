import React from "react";
import Editor from "@monaco-editor/react";
import { Play, Save } from "lucide-react";

const CodeEditor = ({ code, setCode, handleRun, handleSave, selectedFile }) => {
  return (
    <div className="h-full bg-[#1b1e2d] rounded-lg border border-gray-800 shadow-2xl overflow-hidden flex flex-col">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#141622] border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-gray-300 text-sm font-medium">{selectedFile}</span>
          <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded border border-orange-500/30">
            Java
          </span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 text-gray-300 text-sm rounded transition-colors"
          >
            <Save size={16} />
            Save
          </button>
          <button
            onClick={handleRun}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
          >
            <Play size={16} />
            Run
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language="java"
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value)}
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16 },
            lineNumbers: "on",
            renderLineHighlight: "all",
            cursorBlinking: "smooth",
          }}
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#0f1117] border-t border-gray-800 text-xs text-gray-400">
        <div className="flex gap-4">
          <span>UTF-8</span>
          <span>Java</span>
          <span>Ln 1, Col 1</span>
        </div>
        <div className="flex gap-4">
          <span>Spaces: 4</span>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
