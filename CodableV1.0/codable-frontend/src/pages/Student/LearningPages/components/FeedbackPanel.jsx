import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ArrowRight, 
  RotateCcw, 
  Trophy, 
  Clock, 
  Target, 
  Zap,
  Code,
  FileText,
  Activity
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';

export function FeedbackPanel({ 
  onTryAgain, 
  onNextQuestion, 
  metrics, 
  validationResult,
  question,
  isLastQuestion,
  onChapterComplete 
}) {
  const isCorrect = validationResult?.isCorrect || false;
  const score = validationResult?.score || metrics?.score || 0;
  const feedback = validationResult?.feedback || [];
  const suggestions = validationResult?.suggestions || [];
  const testsTotal = validationResult?.testCasesTotal ?? metrics?.testCasesTotal ?? 0;
  const testsPassed = validationResult?.testCasesPassed ?? metrics?.testCasesPassed ?? 0;
  const taskType = validationResult?.taskType || metrics?.taskType;
  const gradedByTests = testsTotal > 0;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-500/20 border-green-500/50';
    if (score >= 50) return 'bg-yellow-500/20 border-yellow-500/50';
    return 'bg-red-500/20 border-red-500/50';
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#1a1a2e] p-6 overflow-auto">
      {/* Result Header */}
      <div className={`flex items-center gap-4 p-6 rounded-lg border ${getScoreBg(score)} mb-6`}>
        {isCorrect ? (
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
        ) : score >= 50 ? (
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-yellow-400" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
        )}
        <div>
          <h2 className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {isCorrect ? 'Correct!' : score >= 50 ? 'Almost There!' : 'Not Quite Right'}
          </h2>
          <p className="text-gray-400">
            {isCorrect 
              ? 'Great job! Your solution is correct.' 
              : score >= 50 
                ? 'Your solution is partially correct. Check the feedback below.'
                : 'Review the feedback and try again.'}
          </p>
        </div>
        <div className="ml-auto text-right">
          <div className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}%</div>
          <div className="text-gray-400 text-sm">Score</div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#0d0d1a] rounded-lg p-4 border border-gray-800">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Time</span>
          </div>
          <div className="text-xl font-semibold text-white">
            {formatTime(metrics?.solutionTime)}
          </div>
        </div>
        <div className="bg-[#0d0d1a] rounded-lg p-4 border border-gray-800">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Target className="w-4 h-4" />
            <span className="text-sm">Attempts</span>
          </div>
          <div className="text-xl font-semibold text-white">
            {metrics?.attempts || 1}
          </div>
        </div>
        <div className="bg-[#0d0d1a] rounded-lg p-4 border border-gray-800">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Zap className="w-4 h-4" />
            <span className="text-sm">Execution</span>
          </div>
          <div className="text-xl font-semibold text-white">
            {metrics?.executionMetrics?.executionTime || 0}ms
          </div>
        </div>
        <div className="bg-[#0d0d1a] rounded-lg p-4 border border-gray-800">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Trophy className="w-4 h-4" />
            <span className="text-sm">{gradedByTests ? 'Tests passed' : 'Result'}</span>
          </div>
          <div
            className={`text-xl font-semibold ${
              gradedByTests
                ? testsPassed === testsTotal
                  ? 'text-green-400'
                  : 'text-yellow-400'
                : isCorrect
                  ? 'text-green-400'
                  : 'text-red-400'
            }`}
          >
            {gradedByTests ? `${testsPassed} / ${testsTotal}` : isCorrect ? 'Pass' : 'Review'}
          </div>
        </div>
      </div>

      {/* Feedback Section */}
      {feedback.length > 0 && (
        <div className="bg-[#0d0d1a] rounded-lg p-4 border border-gray-800 mb-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Feedback
          </h3>
          <ul className="space-y-2">
            {feedback.map((item, index) => (
              <li key={index} className="text-gray-300 flex items-start gap-2">
                <span className="text-[#6C63FF]">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions Section */}
      {suggestions.length > 0 && (
        <div className="bg-[#0d0d1a] rounded-lg p-4 border border-yellow-500/30 mb-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            Suggestions
          </h3>
          <ul className="space-y-2">
            {suggestions.map((item, index) => (
              <li key={index} className="text-gray-300 flex items-start gap-2">
                <span className="text-yellow-400">→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Code Analysis */}
      {Array.isArray(validationResult?.testCaseResults) && validationResult.testCaseResults.length > 0 && (
        <div className="bg-[#0d0d1a] rounded-lg p-4 border border-gray-800 mb-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            Test cases (submit)
          </h3>
          <ul className="space-y-2 text-sm text-gray-300 max-h-48 overflow-y-auto">
            {validationResult.testCaseResults.map((t) => (
              <li
                key={t.index}
                className={`p-2 rounded border ${
                  t.passed ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-rose-500/40 bg-rose-500/10'
                }`}
              >
                <span className="font-mono text-xs text-gray-400">Case {t.index + 1}</span>
                {t.input ? (
                  <pre className="text-xs mt-1 whitespace-pre-wrap">In: {t.input}</pre>
                ) : null}
                <pre className="text-xs mt-1 whitespace-pre-wrap text-gray-400">
                  Expected: {String(t.expectedOutput || '').slice(0, 200)}
                  {String(t.expectedOutput || '').length > 200 ? '…' : ''}
                </pre>
                <pre className="text-xs mt-1 whitespace-pre-wrap">
                  Yours: {String(t.actualOutput || '').slice(0, 200)}
                  {String(t.actualOutput || '').length > 200 ? '…' : ''}
                </pre>
                {t.error ? <p className="text-xs text-rose-300 mt-1">{t.error}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      {metrics?.codeAnalysis && (
        <div className="bg-[#0d0d1a] rounded-lg p-4 border border-gray-800 mb-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Code className="w-4 h-4 text-[#6C63FF]" />
            Code Analysis
          </h3>
          {(metrics.codeAnalysis.quality || metrics.codeAnalysis.logic) && (
            <div className="mb-4 text-sm text-gray-300 space-y-1">
              {metrics.codeAnalysis.quality?.logic != null && (
                <p>
                  <span className="text-purple-300">Structure / logic: </span>
                  {metrics.codeAnalysis.quality.logic}
                </p>
              )}
              {metrics.codeAnalysis.quality?.quality != null && (
                <p>
                  <span className="text-purple-300">Quality: </span>
                  {metrics.codeAnalysis.quality.quality}
                </p>
              )}
              {metrics.codeAnalysis.quality?.structure != null && (
                <p>
                  <span className="text-purple-300">Structure: </span>
                  {metrics.codeAnalysis.quality.structure}
                </p>
              )}
              {metrics.codeAnalysis.logic?.logic != null && (
                <p>
                  <span className="text-purple-300">Prompt alignment: </span>
                  {metrics.codeAnalysis.logic.logic}
                </p>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {metrics.codeAnalysis.containsRequired?.length > 0 && (
              <div>
                <p className="text-green-400 text-sm mb-2">✓ Required Patterns Found:</p>
                <ul className="text-gray-400 text-sm">
                  {metrics.codeAnalysis.containsRequired.map((p, i) => (
                    <li key={i} className="font-mono">{p}</li>
                  ))}
                </ul>
              </div>
            )}
            {metrics.codeAnalysis.missingRequired?.length > 0 && (
              <div>
                <p className="text-red-400 text-sm mb-2">✗ Missing Patterns:</p>
                <ul className="text-gray-400 text-sm">
                  {metrics.codeAnalysis.missingRequired.map((p, i) => (
                    <li key={i} className="font-mono">{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Complexity Analysis */}
      {metrics?.complexity && (
        <div className="bg-[#0d0d1a] rounded-lg p-4 border border-purple-500/30 mb-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            Complexity Analysis
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Time Complexity:</p>
              <p className="text-purple-400 font-mono text-lg">{metrics.complexity.timeComplexity || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Space Complexity:</p>
              <p className="text-purple-400 font-mono text-lg">{metrics.complexity.spaceComplexity || 'N/A'}</p>
            </div>
            {metrics.complexity.analysis && (
              <div className="col-span-2 mt-2">
                <p className="text-gray-400 text-sm mb-2">Analysis Details:</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {metrics.complexity.analysis.maxLoopDepth !== undefined && (
                    <div className="bg-[#1a1a2e] p-2 rounded">
                      <span className="text-gray-500">Max Loop Depth:</span>
                      <span className="text-purple-300 ml-2">{metrics.complexity.analysis.maxLoopDepth}</span>
                    </div>
                  )}
                  {metrics.complexity.analysis.hasRecursion !== undefined && (
                    <div className="bg-[#1a1a2e] p-2 rounded">
                      <span className="text-gray-500">Recursion:</span>
                      <span className={`ml-2 ${metrics.complexity.analysis.hasRecursion ? 'text-yellow-400' : 'text-gray-400'}`}>
                        {metrics.complexity.analysis.hasRecursion ? 'Yes' : 'No'}
                      </span>
                    </div>
                  )}
                  {metrics.complexity.analysis.arrayAllocations !== undefined && (
                    <div className="bg-[#1a1a2e] p-2 rounded">
                      <span className="text-gray-500">Arrays:</span>
                      <span className="text-purple-300 ml-2">{metrics.complexity.analysis.arrayAllocations}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Question & Output Comparison */}
      {question && (
        <div className="bg-[#0d0d1a] rounded-lg p-4 border border-gray-800 mb-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            Question: {question.title}
          </h3>
          <p className="text-gray-400 text-sm mb-4">{question.description}</p>

          {gradedByTests ? (
            <p className="text-sm text-gray-400 mb-2">
              Grading used <span className="text-cyan-300 font-medium">{testsTotal}</span> official test case
              {testsTotal !== 1 ? 's' : ''} (normalized line output). Your Run console is not used for scoring.
            </p>
          ) : (
            <p className="text-sm text-gray-400 mb-2">
              This task is graded as <span className="text-cyan-300 font-medium">{taskType || 'logic-based'}</span> using
              structure and logic heuristics (no single-string output match).
            </p>
          )}

          <div className="bg-[#1a1a2e] rounded-lg p-3 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm font-medium">Your last Run output (reference only)</span>
            </div>
            <pre className="text-gray-300 text-sm font-mono whitespace-pre-wrap bg-[#0a0a15] p-2 rounded max-h-40 overflow-y-auto">
              {metrics?.output || '—'}
            </pre>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 mt-auto pt-6">
        {!isCorrect && (
          <Button
            onClick={onTryAgain}
            variant="outline"
            className="gap-2 border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </Button>
        )}
        {!isLastQuestion && isCorrect && (
          <Button
            onClick={onNextQuestion}
            className="gap-2 bg-[#6C63FF] hover:bg-[#5a52d5]"
          >
            Next Question
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
        {isLastQuestion && isCorrect && (
          <div className="text-center">
            <div className="text-green-400 text-xl font-semibold mb-2">
              🎉 Congratulations! You've completed all questions!
            </div>
            <Button
              onClick={onChapterComplete}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              Continue to Next Chapter
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}