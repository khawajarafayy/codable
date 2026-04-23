import { ChevronLeft, ChevronRight, Lightbulb, Target, BookOpen } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { useState } from 'react';

export function PracticeTaskPanel({ question, currentIndex, totalQuestions, onPrevious, onNext }) {
  const [showHints, setShowHints] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'hard':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const showNextHint = () => {
    if (currentHintIndex < (question?.hints?.length || 0) - 1) {
      setCurrentHintIndex(currentHintIndex + 1);
    }
  };

  return (
    <div className="w-[450px] border-r border-gray-800 flex flex-col bg-[#0d0d1a]">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Question {currentIndex + 1}/{totalQuestions}</span>
            <span className={`px-2 py-0.5 rounded text-xs border ${getDifficultyColor(question?.difficulty)}`}>
              {question?.difficulty || 'Unknown'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrevious}
              disabled={currentIndex === 0}
              className="h-8 w-8 text-gray-400 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onNext}
              disabled={currentIndex === totalQuestions - 1}
              className="h-8 w-8 text-gray-400 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-white">{question?.title || 'Loading...'}</h2>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Description */}
        <div>
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <BookOpen className="h-4 w-4" />
            <span className="text-sm font-medium">Description</span>
          </div>
          <p className="text-gray-300 leading-relaxed">
            {question?.description || 'No description available'}
          </p>
        </div>

        {/* Constraints */}
        {question?.constraints?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Target className="h-4 w-4" />
              <span className="text-sm font-medium">Constraints</span>
            </div>
            <ul className="space-y-1">
              {question.constraints.map((constraint, index) => (
                <li key={index} className="text-gray-400 text-sm flex items-start gap-2">
                  <span className="text-[#6C63FF] mt-1">•</span>
                  <span>{constraint}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Examples */}
        {question?.examples?.length > 0 && (
          <div>
            <h3 className="text-gray-400 text-sm font-medium mb-2">Examples</h3>
            {question.examples.map((example, index) => (
              <div key={index} className="bg-[#1a1a2e] rounded-lg p-3 mb-2 border border-gray-800">
                {example.input && (
                  <div className="mb-2">
                    <span className="text-gray-500 text-xs">Input:</span>
                    <pre className="text-gray-300 text-sm font-mono mt-1 whitespace-pre-wrap">
                      {example.input}
                    </pre>
                  </div>
                )}
                <div>
                  <span className="text-gray-500 text-xs">Output:</span>
                  <pre className="text-green-400 text-sm font-mono mt-1 whitespace-pre-wrap">
                    {example.output}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Expected Output */}
        {question?.expectedOutput && (
          <div>
            <h3 className="text-gray-400 text-sm font-medium mb-2">Expected Output</h3>
            <div className="bg-[#1a1a2e] rounded-lg p-3 border border-green-500/30">
              <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                {question.expectedOutput}
              </pre>
            </div>
          </div>
        )}

        {/* Hints Section */}
        {question?.hints?.length > 0 && (
          <div>
            <Button
              variant="ghost"
              onClick={() => setShowHints(!showHints)}
              className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 p-0 h-auto"
            >
              <Lightbulb className="h-4 w-4" />
              <span className="text-sm">
                {showHints ? 'Hide Hints' : `Show Hints (${question.hints.length} available)`}
              </span>
            </Button>
            
            {showHints && (
              <div className="mt-3 space-y-2">
                {question.hints.slice(0, currentHintIndex + 1).map((hint, index) => (
                  <div
                    key={index}
                    className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2 text-yellow-400 text-xs mb-1">
                      <Lightbulb className="h-3 w-3" />
                      Hint {index + 1}
                    </div>
                    <p className="text-gray-300 text-sm">{hint}</p>
                  </div>
                ))}
                {currentHintIndex < question.hints.length - 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={showNextHint}
                    className="text-yellow-400 text-xs hover:text-yellow-300"
                  >
                    Show next hint →
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
