import React, { useState, useRef, useEffect } from "react";
import { RotateCw, X } from "lucide-react";

const OutputConsole = ({ output, setOutput, appendInput, resetTerminal }) => {
  const [currentInput, setCurrentInput] = useState("");
  const consoleRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (currentInput.trim() !== "") {
        // Append input visually to console
        setOutput((prev) => prev + "\n" + currentInput);

        // Store input for stdin
        appendInput(currentInput);

        setCurrentInput("");
      }
    }
  };

  // Auto-scroll console
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div className="h-full bg-[#0f1117] rounded-t-lg border border-gray-800 overflow-hidden flex flex-col">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#141622] border-b border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Console
        </h3>

        <div className="flex gap-2">
          <button
            onClick={resetTerminal}
            className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-gray-200"
          >
            <RotateCw size={14} />
          </button>
          <button
            onClick={resetTerminal}
            className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-gray-200"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Output */}
      <div
        ref={consoleRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm text-green-400 whitespace-pre-wrap"
      >
        {output || "Console ready..."}
      </div>

      {/* Input bar */}
      <div className="bg-[#1a1c26] border-t border-gray-800 p-2">
        <span className="text-green-400 font-mono">▶ </span>
        <input
          className="bg-transparent outline-none text-green-400 font-mono w-[90%]"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type input and press Enter..."
        />
      </div>
    </div>
  );
};

export default OutputConsole;
