import { useState } from 'react';
import { ArrowLeft, ChevronRight, CheckCircle, XCircle, HelpCircle, Loader2, Trophy } from 'lucide-react';
import { Button } from '../../../../components/ui/button';

export function TopicPractice({
  questions,
  topicTitle,
  onComplete,
  onBackToLearning,
  isRemediation = false,
  evalResult = null,
  isEvaluating = false,
  onContinueToNextTopic = null,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showExplanation, setShowExplanation] = useState({});
  const allAnswered = Object.keys(selectedAnswers).length === questions.length;

  const currentQuestion = questions[currentIndex];

  const handleSelect = (questionId, optionIndex) => {
    if (selectedAnswers[questionId] !== undefined) return; // Already answered
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    setShowExplanation(prev => ({ ...prev, [questionId]: true }));
  };

  const isCorrect = (questionId) => {
    const q = questions.find(q => q.id === questionId);
    return selectedAnswers[questionId] === q?.correctAnswer;
  };

  const getOptionStyle = (questionId, optionIndex) => {
    const answered = selectedAnswers[questionId] !== undefined;
    if (!answered) {
      return 'border-gray-700 hover:border-[#6C63FF]/60 hover:bg-[#6C63FF]/5 cursor-pointer';
    }
    const q = questions.find(q => q.id === questionId);
    if (optionIndex === q.correctAnswer) {
      return 'border-green-500/60 bg-green-500/10';
    }
    if (optionIndex === selectedAnswers[questionId] && optionIndex !== q.correctAnswer) {
      return 'border-red-500/60 bg-red-500/10';
    }
    return 'border-gray-700/50 opacity-50';
  };

  const score = questions.filter(q => isCorrect(q.id)).length;

  // ── Evaluating spinner (shown while adaptive API call is running) ──────────
  if (isRemediation && isEvaluating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-amber-950/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg font-medium">Evaluating your answers…</p>
          <p className="text-gray-400 text-sm mt-2">Checking your understanding of the concepts</p>
        </div>
      </div>
    );
  }

  // ── Remediation passed — show success screen with explicit "Continue" button ──
  if (isRemediation && evalResult?.passed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-green-950/20 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          {/* Trophy icon */}
          <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10 text-green-400" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Well done!</h2>
          <p className="text-gray-400 mb-1">You've strengthened your understanding.</p>
          <p className="text-gray-500 text-sm mb-8">
            Score: <span className="text-green-400 font-semibold">{evalResult.score}</span>
            {' '}/ {evalResult.total}
          </p>

          {/* Positive score bar */}
          <div className="w-full bg-gray-800 rounded-full h-2 mb-8">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full transition-all"
              style={{ width: `${Math.round(((evalResult.score ?? 0) / (evalResult.total || 1)) * 100)}%` }}
            />
          </div>

          <Button
            onClick={onContinueToNextTopic}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 py-3 text-base font-medium"
          >
            Continue to Next Topic
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-gray-600 text-xs mt-3">Your progress has been saved</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBackToLearning}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-white font-semibold">{isRemediation ? 'Remediation Quiz' : 'Practice Questions'}</h1>
              <p className="text-gray-400 text-sm">{topicTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Question {currentIndex + 1} of {questions.length}</span>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 rounded-xl border border-gray-800/50 p-8 shadow-lg">
          {/* Question Number & Text */}
          <div className="flex items-start gap-3 mb-8">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#6C63FF]/20 flex items-center justify-center">
              <span className="text-[#6C63FF] font-bold text-sm">{currentIndex + 1}</span>
            </span>
            <h2 className="text-white text-lg font-medium leading-relaxed">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {currentQuestion.options.map((option, idx) => {
              const answered = selectedAnswers[currentQuestion.id] !== undefined;
              const isSelected = selectedAnswers[currentQuestion.id] === idx;
              const isCorrectOption = idx === currentQuestion.correctAnswer;

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(currentQuestion.id, idx)}
                  disabled={answered}
                  className={`w-full text-left p-4 rounded-lg border transition-all duration-200 flex items-center gap-3 ${getOptionStyle(currentQuestion.id, idx)}`}
                >
                  <span className={`flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-sm font-medium ${
                    answered && isCorrectOption
                      ? 'border-green-500 text-green-400 bg-green-500/10'
                      : answered && isSelected && !isCorrectOption
                        ? 'border-red-500 text-red-400 bg-red-500/10'
                        : 'border-gray-600 text-gray-400'
                  }`}>
                    {answered && isCorrectOption ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : answered && isSelected && !isCorrectOption ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      String.fromCharCode(65 + idx)
                    )}
                  </span>
                  <span className={`${answered && isCorrectOption ? 'text-green-300' : answered && isSelected && !isCorrectOption ? 'text-red-300' : 'text-gray-200'}`}>
                    {option}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplanation[currentQuestion.id] && (
            <div className={`p-4 rounded-lg border ${
              isCorrect(currentQuestion.id) 
                ? 'bg-green-500/5 border-green-500/30' 
                : 'bg-amber-500/5 border-amber-500/30'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className={`w-4 h-4 ${isCorrect(currentQuestion.id) ? 'text-green-400' : 'text-amber-400'}`} />
                <span className={`text-sm font-medium ${isCorrect(currentQuestion.id) ? 'text-green-400' : 'text-amber-400'}`}>
                  {isCorrect(currentQuestion.id) ? 'Correct!' : 'Not quite right'}
                </span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                {currentQuestion.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            onClick={() => setCurrentIndex(prev => prev - 1)}
            disabled={currentIndex === 0}
            variant="outline"
            className="border-gray-700 text-gray-300 disabled:opacity-50"
          >
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-3 h-3 rounded-full transition-all ${
                  idx === currentIndex
                    ? 'bg-[#6C63FF] scale-125'
                    : selectedAnswers[questions[idx].id] !== undefined
                      ? isCorrect(questions[idx].id)
                        ? 'bg-green-500/60'
                        : 'bg-red-500/60'
                      : 'bg-gray-600'
                }`}
              />
            ))}
          </div>

          {currentIndex < questions.length - 1 ? (
            <Button
              onClick={() => setCurrentIndex(prev => prev + 1)}
              className="bg-gradient-to-r from-[#6C63FF] to-[#22D3EE]"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : allAnswered ? (
            <Button
              onClick={() => {
                // Build detailed response data for adaptive evaluation
                const detailedResponses = questions.map(q => ({
                  question_text: q.question,
                  user_answer: q.options[selectedAnswers[q.id]] || '',
                  correct_answer: q.options[q.correctAnswer] || '',
                  is_correct: selectedAnswers[q.id] === q.correctAnswer,
                  concept_tags: q.concept_tags || [],
                }));
                onComplete({ responses: detailedResponses, score, total: questions.length });
              }}
              className={`bg-gradient-to-r ${isRemediation ? 'from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' : 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'}`}
            >
              {isRemediation ? 'Submit Answers' : 'Next Topic'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              disabled
              variant="outline"
              className="border-gray-700 text-gray-400 opacity-50"
            >
              Answer all to continue
            </Button>
          )}
        </div>

        {/* Score Summary (shown when all answered) */}
        {allAnswered && (
          <div className={`mt-6 p-4 rounded-xl border text-center ${
            isRemediation
              ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30'
              : 'bg-gradient-to-r from-[#6C63FF]/10 to-[#22D3EE]/10 border-[#6C63FF]/30'
          }`}>
            <p className="text-white font-medium">
              You scored {score} out of {questions.length}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {score === questions.length
                ? 'Perfect score! Great understanding of this topic.'
                : isRemediation
                  ? 'Hit "Submit Answers" to see if you\'ve mastered the concept — or get new material tailored to your mistakes.'
                  : 'Review the explanations above to strengthen your understanding.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
