import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap, 
  Code2, 
  Lightbulb, 
  TrendingUp,
  RotateCcw,
  ChevronRight,
  Trophy,
  Target,
  Timer
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { ScrollArea } from '../../../../components/ui/scroll-area';

export function FeedbackPanel({ onTryAgain, onNextQuestion, hasNextQuestion, metrics }) {
  // Simulated feedback data - in real app this would come from backend
  const feedback = {
    passed: true,
    score: 95,
    testCases: {
      total: 3,
      passed: 3,
      failed: 0
    },
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    solutionTime: metrics?.solution_time_formatted || '0s',
    codeQuality: {
      score: 90,
      issues: [
        'Good use of proper naming conventions',
        'Code is well-structured and readable'
      ],
      suggestions: [
        'Consider adding comments to explain your logic',
        'You could add error handling for edge cases'
      ]
    },
    hints: [
      'Great job! Your solution is correct.',
      'Try to think about how this could be optimized further',
      'Practice more complex variations of this problem'
    ]
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0B1A]">
      {/* Header */}
      <div className={`${
        feedback.passed 
          ? 'bg-gradient-to-r from-green-600/20 to-green-500/20 border-green-500/30' 
          : 'bg-gradient-to-r from-red-600/20 to-red-500/20 border-red-500/30'
      } border-b px-6 py-6 shrink-0`}>
        <div className="flex items-center gap-4">
          {feedback.passed ? (
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          )}
          <div>
            <h2 className="text-white text-2xl mb-1">
              {feedback.passed ? 'Accepted!' : 'Not Quite Right'}
            </h2>
            <p className="text-gray-300">
              {feedback.passed 
                ? 'Your solution passed all test cases' 
                : 'Some test cases failed. Review the feedback below.'}
            </p>
          </div>
        </div>

        {/* Score */}
        <div className="mt-6 flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <div>
              <div className="text-3xl text-white">{feedback.score}%</div>
              <div className="text-gray-400 text-sm">Score</div>
            </div>
          </div>
          <div className="w-px h-12 bg-gray-700" />
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-[#6C63FF]" />
            <div>
              <div className="text-2xl text-white">
                {feedback.testCases.passed}/{feedback.testCases.total}
              </div>
              <div className="text-gray-400 text-sm">Test Cases Passed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Feedback */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-6 space-y-6">
          {/* Performance Metrics */}
          <section className="bg-[#13132B]/50 rounded-xl p-6 border border-gray-800/50 space-y-4">
            <h3 className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#22D3EE]" />
              Performance Metrics
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#0B0B1A]/50 rounded-lg p-4 border border-gray-800/30">
                <div className="flex items-center gap-2 mb-2">
                  <Timer className="w-4 h-4 text-[#6C63FF]" />
                  <span className="text-gray-400 text-sm">Solution Time</span>
                </div>
                <div className="text-white text-xl font-mono">{feedback.solutionTime}</div>
                <div className="text-gray-500 text-xs mt-1">Time to write code</div>
              </div>

              <div className="bg-[#0B0B1A]/50 rounded-lg p-4 border border-gray-800/30">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-400 text-sm">Time Complexity</span>
                </div>
                <div className="text-white text-xl font-mono">{feedback.timeComplexity}</div>
              </div>

              <div className="bg-[#0B0B1A]/50 rounded-lg p-4 border border-gray-800/30">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-green-400" />
                  <span className="text-gray-400 text-sm">Space Complexity</span>
                </div>
                <div className="text-white text-xl font-mono">{feedback.spaceComplexity}</div>
              </div>
            </div>
          </section>

          {/* Code Quality */}
          <section className="bg-[#13132B]/50 rounded-xl p-6 border border-gray-800/50 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white flex items-center gap-2">
                <Code2 className="w-5 h-5 text-[#6C63FF]" />
                Code Quality
              </h3>
              <div className="flex items-center gap-2">
                <div className="text-2xl text-white">{feedback.codeQuality.score}</div>
                <div className="text-gray-400">/100</div>
              </div>
            </div>

            {/* Quality Bar */}
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#6C63FF] to-[#22D3EE] transition-all duration-500"
                style={{ width: `${feedback.codeQuality.score}%` }}
              />
            </div>

            <div className="space-y-3 mt-4">
              <div>
                <h4 className="text-green-400 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  What You Did Well
                </h4>
                <ul className="space-y-2 ml-6">
                  {feedback.codeQuality.issues.map((issue, index) => (
                    <li key={index} className="text-gray-300 text-sm flex gap-2">
                      <span className="text-green-400">•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-yellow-400 mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Suggestions for Improvement
                </h4>
                <ul className="space-y-2 ml-6">
                  {feedback.codeQuality.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-gray-300 text-sm flex gap-2">
                      <span className="text-yellow-400">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Learning Points */}
          <section className="bg-gradient-to-br from-[#6C63FF]/10 to-[#22D3EE]/10 rounded-xl p-6 border border-[#6C63FF]/30 space-y-4">
            <h3 className="text-[#22D3EE] flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Key Learning Points
            </h3>
            <ul className="space-y-3">
              {feedback.hints.map((hint, index) => (
                <li key={index} className="flex gap-3 text-gray-300">
                  <div className="w-6 h-6 bg-[#6C63FF]/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[#6C63FF] text-sm">{index + 1}</span>
                  </div>
                  <span>{hint}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Test Cases Details */}
          <section className="bg-[#13132B]/50 rounded-xl p-6 border border-gray-800/50 space-y-4">
            <h3 className="text-white">Test Cases</h3>
            
            <div className="space-y-3">
              {[1, 2, 3].map((testNum) => (
                <div 
                  key={testNum}
                  className="bg-[#0B0B1A]/50 rounded-lg p-4 border border-green-500/30 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Test Case {testNum}</span>
                  </div>
                  <span className="text-green-400">Passed</span>
                </div>
              ))}
            </div>
          </section>

          {/* Spacer */}
          <div className="h-8" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-[#13132B] border-t border-gray-800/50 px-6 py-4 flex items-center justify-between shrink-0">
        <Button
          onClick={onTryAgain}
          variant="outline"
          className="border-gray-700 text-gray-300 hover:bg-gray-800/50 hover:text-white"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Try Again
        </Button>

        {hasNextQuestion && (
          <Button
            onClick={onNextQuestion}
            className="bg-gradient-to-r from-[#6C63FF] to-[#22D3EE] hover:from-[#5B52EE] hover:to-[#11C2DD] text-white"
          >
            Next Question
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}

        {!hasNextQuestion && (
          <Button
            onClick={onTryAgain}
            className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Complete Practice
          </Button>
        )}
      </div>
    </div>
  );
};