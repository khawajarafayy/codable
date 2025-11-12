import React from "react";
import { RotateCw, X } from "lucide-react";

const OutputConsole = ({ output, setOutput }) => {
  const clearConsole = () => setOutput("");

  return (
    <div className="h-full bg-[#0f1117] rounded-t-lg border border-gray-800 overflow-hidden flex flex-col">
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#141622] border-b border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Console
        </h3>
        <div className="flex gap-2">
          <button
            onClick={clearConsole}
            className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-gray-200"
          >
            <RotateCw size={14} />
          </button>
          <button
            onClick={clearConsole}
            className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-gray-200"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Console Output */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
        {output ? (
          <pre className="text-green-400 whitespace-pre-wrap">{output}</pre>
        ) : (
          <p className="text-gray-500 italic">
            No output yet. Run your code to see results.
          </p>
        )}
      </div>
    </div>
  );
};

export default OutputConsole;
