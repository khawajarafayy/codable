import React, { useState, useEffect, useRef } from "react";
import { RotateCw, X, Send } from "lucide-react";

const OutputConsole = ({ output, setOutput, onInput, resetTerminal, isRunning }) => {
  const [inputValue, setInputValue] = useState("");
  const consoleRef = useRef(null);

  // Auto-scroll console
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [output]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !isRunning) return;
    onInput(inputValue);
    setInputValue("");
  };

  return (
    <div className="h-full bg-[#0f1117] rounded-t-lg border border-gray-800 overflow-hidden flex flex-col">
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#141622] border-b border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Console
        </h3>
        <div className="flex gap-2">
          <button
            onClick={resetTerminal}
            className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-gray-200"
            title="Reset"
          >
            <RotateCw size={14} />
          </button>
          <button
            onClick={() => setOutput("")}
            className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-gray-200"
            title="Clear"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Console Output */}
      <div ref={consoleRef} className="flex-1 overflow-y-auto p-4 font-mono text-sm bg-[#0b0d11]">
        {output ? (
          <pre className="text-green-400 whitespace-pre-wrap">{output}</pre>
        ) : (
          <p className="text-gray-500 italic">
            No output yet. Run your code to see results.
          </p>
        )}
      </div>

      {/* Input Area (only show when running) */}
      {isRunning && (
        <form onSubmit={handleSubmit} className="px-3 py-2 border-t border-gray-800 bg-[#0b0d11] flex items-center gap-2">
          <span className="text-green-400 font-mono">{">"}</span>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type input and press Enter..."
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-500 focus:outline-none font-mono"
            autoFocus
          />
          <button
            type="submit"
            className="p-1 hover:bg-gray-700 rounded transition-colors text-blue-400 hover:text-blue-300"
          >
            <Send size={14} />
          </button>
        </form>
      )}
    </div>
  );
};

export default OutputConsole;
