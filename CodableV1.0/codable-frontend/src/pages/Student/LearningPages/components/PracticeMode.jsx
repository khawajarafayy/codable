import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { PracticeTaskPanel } from './PracticeTaskPanel';
import { PracticeEditor } from './PracticeEditor';
import { FeedbackPanel } from './FeedbackPanel';
import learningApi from '../../../../services/learningApi';

export function PracticeMode({ onBackToLearning, chapterId, topicTitle, onChapterComplete }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [viewMode, setViewMode] = useState('editor');
  const [metrics, setMetrics] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [difficulty, setDifficulty] = useState('easy');
  const [code, setCode] = useState('');
  const [lastOutput, setLastOutput] = useState('');
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);

  // Fetch questions when component mounts or difficulty changes
  useEffect(() => {
    fetchQuestions();
  }, [chapterId, difficulty]);

  // Reset code when question changes - start with empty editor
  useEffect(() => {
    // Start with empty code - user writes from scratch
    setCode('');
  }, [currentQuestionIndex, questions]);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch chapter-level practice questions (5 questions covering the chapter)
      const response = await learningApi.getChapterPracticeQuestions(chapterId, difficulty, 5);
      if (response.success && response.questions?.length > 0) {
        setQuestions(response.questions);
        setCode(''); // Start with empty editor
      } else {
        setError('No questions available for this chapter');
        setQuestions(getDefaultQuestions());
      }
    } catch (err) {
      console.error('Error fetching chapter practice questions:', err);
      setError('Failed to load questions');
      setQuestions(getDefaultQuestions());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultStarterCode = () => {
    return `public class Solution {
    public static void main(String[] args) {
        // Write your code here
        
    }
}`;
  };

  const getDefaultQuestions = () => {
    return [
      {
        id: 1,
        title: 'Practice Exercise',
        difficulty: difficulty,
        description: 'Write a Java program to practice the concepts you learned.',
        constraints: ['Your code must compile without errors'],
        examples: [{ input: 'N/A', output: 'Your output' }],
        hints: ['Start with the basic structure', 'Test your code'],
        starterCode: getDefaultStarterCode(),
        expectedOutput: '',
        testCases: [],
        solutionKeywords: [],
        mustContain: ['public class', 'main'],
        mustNotContain: []
      }
    ];
  };

  const currentQuestion = questions[currentQuestionIndex] || getDefaultQuestions()[0];

  const handleCodeChange = (newCode) => {
    setCode(newCode);
  };

  const handleRunComplete = (output) => {
    setLastOutput(output);
  };

  const handleSubmit = async (submittedMetrics) => {
    setMetrics(submittedMetrics);
    
    // Validate the solution using embedding-based comparison for chapter practice
    // This uses semantic similarity to handle minor differences in output
    let finalValidationResult = {
      isCorrect: false,
      score: submittedMetrics?.score || 0,
      feedback: ['Unable to validate solution'],
      suggestions: ['Please try again']
    };

    try {
      const validation = await learningApi.validateChapterPractice(
        code,
        currentQuestion,
        submittedMetrics.output || lastOutput,
        0.92 // similarity threshold
      );
      
      if (validation.success) {
        // Include similarity score in the result for user feedback
        finalValidationResult = {
          ...validation.validation,
          similarityScore: validation.validation.similarityScore
        };
        setValidationResult(finalValidationResult);
      } else {
        setValidationResult(finalValidationResult);
      }
    } catch (err) {
      console.error('Validation error:', err);
      finalValidationResult = {
        isCorrect: false,
        score: submittedMetrics.score || 0,
        feedback: ['Validation service unavailable'],
        suggestions: ['Your code ran successfully. Manual review may be needed.']
      };
      setValidationResult(finalValidationResult);
    }

    // Emit analytics with chapter + feedback aware payload
    learningApi.emitAnalyticsEvent('practice_submission', {
      chapterId: chapterId,
      chapterName: topicTitle,
      totalQuestionsInSet: questions.length,
      questionId: `${chapterId}-${currentQuestion?.id}`,
      questionTitle: currentQuestion?.title || 'Practice Question',
      topicId: `${chapterId}-${currentQuestion?.id}`,
      topicName: currentQuestion?.title || currentQuestion?.name || 'Chapter Practice',
      attempts: submittedMetrics?.attempts || 1,
      score: finalValidationResult?.score ?? submittedMetrics?.score ?? 0,
      isCorrect: Boolean(finalValidationResult?.isCorrect),
      feedback: finalValidationResult?.feedback || [],
      suggestions: finalValidationResult?.suggestions || [],
      syntaxErrorCount: submittedMetrics?.syntaxErrors || 0,
      logicErrorCount: submittedMetrics?.codeAnalysis?.missingRequired?.length || 0,
      runtimeErrorCount: 0,
      edgeCaseFailureCount: 0,
      outputMatched: Boolean(submittedMetrics?.outputMatches)
    }).catch(err => console.error('Analytics event failed:', err));
    
    setViewMode('feedback');
  };

  const handleTryAgain = () => {
    setViewMode('editor');
    setValidationResult(null);
  };

  const handleNextQuestion = () => {
    // Count this as a correct answer if validation result is correct
    if (validationResult?.isCorrect) {
      const newCorrectCount = correctAnswersCount + 1;
      setCorrectAnswersCount(newCorrectCount);
      
      // If all questions are answered correctly, complete the chapter
      if (newCorrectCount === questions.length && onChapterComplete) {
        onChapterComplete();
        return;
      }
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setViewMode('editor');
      setValidationResult(null);
      setMetrics(null);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setViewMode('editor');
      setValidationResult(null);
      setMetrics(null);
    }
  };

  const handleDifficultyChange = (newDifficulty) => {
    setDifficulty(newDifficulty);
    setCurrentQuestionIndex(0);
  };

  const handleChapterComplete = () => {
    if (onChapterComplete) {
      onChapterComplete();
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-[#0B0B1A]">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#6C63FF] animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading practice questions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0B0B1A]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBackToLearning}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-white">Practice: {topicTitle || 'Java Programming'}</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Difficulty Selector */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Difficulty:</span>
            <div className="flex gap-1">
              {['easy', 'medium', 'hard'].map((d) => (
                <Button
                  key={d}
                  variant={difficulty === d ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDifficultyChange(d)}
                  className={`capitalize ${
                    difficulty === d
                      ? 'bg-[#6C63FF] text-white'
                      : 'text-gray-400 border-gray-600 hover:text-white'
                  }`}
                >
                  {d}
                </Button>
              ))}
            </div>
          </div>
          <span className="text-gray-400">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>
      </div>

      {error && (
        <div className="px-6 py-2 bg-yellow-900/20 border-b border-yellow-600/30">
          <p className="text-yellow-400 text-sm">{error}</p>
        </div>
      )}

      {/* Split Screen Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Panel - Task Description */}
        <PracticeTaskPanel
          question={currentQuestion}
          currentIndex={currentQuestionIndex}
          totalQuestions={questions.length}
          onPrevious={handlePreviousQuestion}
          onNext={handleNextQuestion}
        />

        {/* Right Panel - Editor or Feedback */}
        <div className="flex-1 flex flex-col">
          {viewMode === 'editor' ? (
            <PracticeEditor
              code={code}
              onChange={handleCodeChange}
              onSubmit={handleSubmit}
              onRunComplete={handleRunComplete}
              question={currentQuestion}
            />
          ) : (
            <FeedbackPanel
              onTryAgain={handleTryAgain}
              onNextQuestion={handleNextQuestion}
              metrics={metrics}
              validationResult={validationResult}
              question={currentQuestion}
              isLastQuestion={currentQuestionIndex >= questions.length - 1}
              onChapterComplete={handleChapterComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
