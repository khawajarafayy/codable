import { CheckCircle2, ChevronLeft, ChevronRight, Code2, AlertCircle, Lightbulb } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { ScrollArea } from '../../../../components/ui/scroll-area';

export function PracticeTaskPanel({ 
  question, 
  currentIndex, 
  totalQuestions,
  onPrevious,
  onNext 
}) {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'hard':
        return 'text-red-400 bg-red-400/10 border-red-400/30';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  return (
    <div className="w-[480px] border-r border-gray-800/50 flex flex-col bg-[#0B0B1A] h-full">
      {/* Task Header */}
      <div className="bg-[#13132B]/50 border-b border-gray-800/50 px-6 py-4 shrink-0">
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-white">{question.title}</h2>
          <span className={`px-3 py-1 rounded-full border text-sm ${getDifficultyColor(question.difficulty)}`}>
            {question.difficulty}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Code2 className="w-4 h-4" />
          <span>Java Programming</span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-6 space-y-6">
          {/* Description */}
          <section>
            <h3 className="text-white mb-3">Description</h3>
            <p className="text-gray-300 leading-relaxed">
              {question.description}
            </p>
          </section>

          {/* Examples */}
          <section>
            <h3 className="text-white mb-3">Examples</h3>
            <div className="space-y-3">
              {question.examples.map((example, index) => (
                <div 
                  key={index}
                  className="bg-[#13132B]/50 rounded-lg p-4 border border-gray-800/50 space-y-2"
                >
                  <div>
                    <span className="text-gray-400">Input:</span>
                    <pre className="text-[#22D3EE] font-mono mt-1">{example.input}</pre>
                  </div>
                  <div>
                    <span className="text-gray-400">Output:</span>
                    <pre className="text-green-400 font-mono mt-1">{example.output}</pre>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Constraints */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-[#6C63FF]" />
              <h3 className="text-white">Constraints</h3>
            </div>
            <ul className="space-y-2">
              {question.constraints.map((constraint, index) => (
                <li key={index} className="flex gap-2 text-gray-300">
                  <CheckCircle2 className="w-5 h-5 text-[#6C63FF] shrink-0 mt-0.5" />
                  <span>{constraint}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Hints */}
          <section className="bg-gradient-to-br from-[#6C63FF]/10 to-[#22D3EE]/10 rounded-xl p-5 border border-[#6C63FF]/30">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-[#22D3EE]" />
              <h3 className="text-[#22D3EE]">Hints</h3>
            </div>
            <ul className="space-y-2">
              {question.hints.map((hint, index) => (
                <li key={index} className="flex gap-2 text-gray-300">
                  <span className="text-[#6C63FF]">{index + 1}.</span>
                  <span>{hint}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-[#13132B]/50 border-t border-gray-800/50 px-6 py-4 flex items-center justify-between shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="border-gray-700 text-gray-300 hover:bg-gray-800/50 hover:text-white disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        <span className="text-gray-400 text-sm">
          {currentIndex + 1} / {totalQuestions}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={currentIndex === totalQuestions - 1}
          className="border-gray-700 text-gray-300 hover:bg-gray-800/50 hover:text-white disabled:opacity-30"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
