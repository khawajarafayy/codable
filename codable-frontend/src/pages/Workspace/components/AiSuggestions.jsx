import React from "react";
import { Sparkles, Lightbulb, CheckCircle, Settings, Zap } from "lucide-react";

const AiSuggestions = () => {
  const suggestions = [
    {
      icon: <Lightbulb size={18} className="text-yellow-400" />,
      title: "Optimization Tip",
      description:
        "Consider optimizing your loop to reduce time complexity from O(n²) to O(n).",
    },
    {
      icon: <CheckCircle size={18} className="text-green-400" />,
      title: "Best Practice",
      description:
        "You can use a HashMap to improve lookup efficiency in your current implementation.",
    },
    {
      icon: <Settings size={18} className="text-blue-400" />,
      title: "Code Quality",
      description:
        "Try handling edge cases like empty input or null values to make your code more robust.",
    },
    {
      icon: <Zap size={18} className="text-purple-400" />,
      title: "Performance",
      description:
        "Use StringBuilder instead of string concatenation in loops for better performance.",
    },
  ];

  return (
    <div className="h-full bg-[#141622] rounded-lg border border-gray-800 backdrop-blur-sm bg-opacity-80 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          AI Suggestions
        </h2>
        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/30 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
          Live
        </span>
      </div>

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="bg-[#151724] border border-gray-700 rounded-md p-3 shadow-inner hover:shadow-lg hover:border-gray-600 transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                {suggestion.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-200 mb-1 group-hover:text-white transition-colors">
                  {suggestion.title}
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {suggestion.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AiSuggestions;
