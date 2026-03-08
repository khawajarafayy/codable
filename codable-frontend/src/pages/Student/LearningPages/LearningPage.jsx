import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LearningContent } from './components/LearningContent';
import { PracticeMode } from './components/PracticeMode';
import { TopicPractice } from './components/TopicPractice';
import { RemediationContent } from './components/RemediationContent';
import learningApi from '../../../services/learningApi';

export default function LearningPage() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState('learning');
  const [chapterId, setChapterId] = useState(null);
  const [topicId, setTopicId] = useState(null);
  const [topicTitle, setTopicTitle] = useState('');
  const [topicQuestions, setTopicQuestions] = useState([]);
  const [topicIndex, setTopicIndex] = useState(0);

  // Adaptive learning state
  const [conceptMastery, setConceptMastery] = useState({});
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [weakConcepts, setWeakConcepts] = useState([]);
  const [remediationPlan, setRemediationPlan] = useState(null);
  const [remediationContent, setRemediationContent] = useState(null);
  const [remediationQuestions, setRemediationQuestions] = useState([]);
  const [remediationLoading, setRemediationLoading] = useState(false);
  // Tracks result after remediation quiz evaluation: null | { passed: true, score, total }
  const [remediationEvalResult, setRemediationEvalResult] = useState(null);
  // True while the adaptive evaluation API call is in-flight after remediation quiz submission
  const [remediationEvaluating, setRemediationEvaluating] = useState(false);

  useEffect(() => {
    // Get chapter and topic from URL query params
    const chapterParam = searchParams.get('chapter');
    const topicParam = searchParams.get('topic');

    if (chapterParam) {
      setChapterId(parseInt(chapterParam, 10));
    } else if (topicParam) {
      const match = topicParam.match(/(\d+)/);
      if (match) {
        setChapterId(parseInt(match[1], 10));
      }
      setTopicId(topicParam);
    } else {
      setChapterId(1);
    }

    console.log('LearningPage - chapterParam:', chapterParam, 'topicParam:', topicParam);
  }, [searchParams]);

  const handleStartPractice = async (selectedTopicId, selectedTopicTitle, selectedTopicIndex) => {
    if (selectedTopicId) {
      setTopicId(selectedTopicId);
      setTopicTitle(selectedTopicTitle || '');
      setTopicIndex(selectedTopicIndex ?? 0);
    }

    // Reset adaptive state for new topic
    setAttemptNumber(1);
    setWeakConcepts([]);
    setRemediationPlan(null);
    setRemediationContent(null);

    // Fetch questions from the topic content
    try {
      const response = await learningApi.getTopicContent(selectedTopicId || topicId);
      if (response.success && response.questions && response.questions.length > 0) {
        setTopicQuestions(response.questions);
        setMode('topicPractice');
      } else {
        handleAdvanceToNextTopic();
      }
    } catch (err) {
      console.error('Error fetching topic questions:', err);
      handleAdvanceToNextTopic();
    }
  };

  const handleAdvanceToNextTopic = async () => {
    // Save topic completion to backend before advancing
    try {
      if (topicId && chapterId) {
        await learningApi.completeTopic(chapterId, topicId, 0);
      }
    } catch (err) {
      console.error('Error saving topic completion:', err);
    }

    setTopicIndex(prev => prev + 1);
    setAttemptNumber(1);
    setWeakConcepts([]);
    setRemediationPlan(null);
    setRemediationContent(null);
    setMode('learning');
  };

  const handleTopicPracticeComplete = async (quizResult) => {
    // If no detailed data (legacy/fallback), stay on same topic
    if (!quizResult || !quizResult.responses) {
      setMode('learning');
      return;
    }

    const currentTopicId = topicId;

    try {
      // Call adaptive evaluation endpoint
      const evaluation = await learningApi.evaluateQuiz(
        currentTopicId,
        quizResult.responses,
        conceptMastery,
        attemptNumber
      );

      if (!evaluation.success) {
        console.error('Quiz evaluation failed:', evaluation.error);
        // Stay on same topic so user can retry
        setMode('learning');
        return;
      }

      // Update concept mastery from the evaluation
      if (evaluation.updated_masteries) {
        setConceptMastery(prev => ({ ...prev, ...evaluation.updated_masteries }));
      }

      if (evaluation.action === 'advance') {
        // Student passed — advance to next topic
        handleAdvanceToNextTopic();
      } else {
        // Student needs remediation
        setWeakConcepts(evaluation.weak_concepts || []);
        setRemediationPlan(evaluation.remediation_plan || null);
        setAttemptNumber(prev => prev + 1);

        // Fetch remedial content
        setRemediationLoading(true);
        setMode('remediation');

        try {
          const mistakeDetails = (evaluation.remediation_plan?.error_summary) || 
            evaluation.weak_concepts?.map(wc => ({
              concept: wc.concept,
              user_said: wc.user_answer,
              correct_was: wc.correct_answer,
              what_went_wrong: wc.error_type,
              detail: wc.error_detail,
              question_text: wc.question_text,
            })) || [];

          const contentResult = await learningApi.getRemedialContent(
            currentTopicId,
            evaluation.weak_concepts || [],
            mistakeDetails,
            attemptNumber + 1,
            evaluation.updated_masteries || {}
          );

          if (contentResult.success) {
            setRemediationContent(contentResult.content);
          } else {
            setRemediationContent({
              sections: [{ title: 'Review Material', content: 'Please review the topic material and try again.' }],
              summary: 'Focus on the areas where you made mistakes.'
            });
          }
        } catch (err) {
          console.error('Error fetching remedial content:', err);
          setRemediationContent({
            sections: [{ title: 'Review Material', content: 'Please review the topic material and try again.' }],
            summary: 'Focus on the areas where you made mistakes.'
          });
        } finally {
          setRemediationLoading(false);
        }
      }
    } catch (err) {
      console.error('Error in adaptive evaluation:', err);
      // Stay on same topic so user can retry
      setMode('learning');
    }
  };

  const handleStartRemediationQuiz = async () => {
    setRemediationLoading(true);
    setMode('remediationQuiz');

    try {
      const mistakeDetails = remediationPlan?.error_summary ||
        weakConcepts.map(wc => ({
          concept: wc.concept,
          user_said: wc.user_answer,
          correct_was: wc.correct_answer,
          what_went_wrong: wc.error_type,
        }));

      const result = await learningApi.getRemedialQuestions(
        topicId,
        weakConcepts,
        mistakeDetails,
        attemptNumber,
        2
      );

      if (result.success && result.questions && result.questions.length > 0) {
        setRemediationQuestions(result.questions);
      } else if (topicQuestions && topicQuestions.length > 0) {
        // Fallback: reuse original topic questions for the remediation quiz
        console.warn('Remedial questions unavailable, falling back to topic questions');
        setRemediationQuestions(topicQuestions);
      } else {
        // Last resort: go back to learning mode
        console.error('No questions available for remediation quiz');
        setMode('learning');
      }
    } catch (err) {
      console.error('Error fetching remedial questions:', err);
      if (topicQuestions && topicQuestions.length > 0) {
        setRemediationQuestions(topicQuestions);
      } else {
        setMode('learning');
      }
    } finally {
      setRemediationLoading(false);
    }
  };

  const handleRemediationQuizComplete = async (quizResult) => {
    if (!quizResult || !quizResult.responses) {
      setMode('learning');
      return;
    }

    // Show evaluating spinner inside TopicPractice
    setRemediationEvaluating(true);
    setRemediationEvalResult(null);

    // Re-evaluate with the remediation quiz results
    try {
      const evaluation = await learningApi.evaluateQuiz(
        topicId,
        quizResult.responses,
        conceptMastery,
        attemptNumber
      );

      if (evaluation.success && evaluation.updated_masteries) {
        setConceptMastery(prev => ({ ...prev, ...evaluation.updated_masteries }));
      }

      if (evaluation.success && evaluation.action === 'advance') {
        // Passed — show success screen; user clicks "Continue to Next Topic" button
        setRemediationEvalResult({ passed: true, score: quizResult.score, total: quizResult.total });
      } else if (attemptNumber >= 3) {
        // After 3 attempts, advance anyway to avoid frustration
        handleAdvanceToNextTopic();
      } else {
        // Need more remediation — fetch new content based on latest mistakes and loop back
        setWeakConcepts(evaluation.weak_concepts || []);
        setRemediationPlan(evaluation.remediation_plan || null);
        setAttemptNumber(prev => prev + 1);

        setRemediationLoading(true);
        setMode('remediation');

        try {
          const mistakeDetails = evaluation.remediation_plan?.error_summary || 
            evaluation.weak_concepts?.map(wc => ({
              concept: wc.concept,
              user_said: wc.user_answer,
              correct_was: wc.correct_answer,
              what_went_wrong: wc.error_type,
              detail: wc.error_detail,
            })) || [];

          const contentResult = await learningApi.getRemedialContent(
            topicId,
            evaluation.weak_concepts || [],
            mistakeDetails,
            attemptNumber + 1,
            evaluation.updated_masteries || {}
          );

          setRemediationContent(contentResult.success ? contentResult.content : {
            sections: [{ title: 'Review Material', content: 'Please review your mistakes and try again.' }],
            summary: 'Keep practicing — you\'re getting closer!'
          });
        } catch {
          setRemediationContent({
            sections: [{ title: 'Review Material', content: 'Please review your mistakes and try again.' }],
            summary: 'Keep practicing!'
          });
        } finally {
          setRemediationLoading(false);
        }
      }
    } catch (err) {
      console.error('Error in remediation evaluation:', err);
      // Stay on same topic so user can retry
      setMode('learning');
    } finally {
      setRemediationEvaluating(false);
    }
  };

  // Called when user clicks "Continue to Next Topic" on the remediation success screen
  const handleContinueAfterRemediationPass = () => {
    setRemediationEvalResult(null);
    handleAdvanceToNextTopic();
  };

  const handleStartChapterPractice = (selectedTopicId, selectedTopicTitle) => {
    if (selectedTopicId) {
      setTopicId(selectedTopicId);
      setTopicTitle(selectedTopicTitle || '');
    } else if (!topicId && chapterId) {
      setTopicId(`${chapterId}-1`);
    }
    setMode('practice');
  };

  const handleBackToLearning = () => {
    setMode('learning');
  };

  // Don't render until we have a chapter ID
  if (!chapterId) {
    return (
      <div className="min-h-screen bg-[#0B0B1A] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B1A]">
      {mode === 'learning' && (
        <LearningContent
          onStartPractice={handleStartPractice}
          onStartChapterPractice={handleStartChapterPractice}
          chapterId={chapterId}
          initialTopicIndex={topicIndex}
        />
      )}
      {mode === 'topicPractice' && (
        <TopicPractice
          questions={topicQuestions}
          topicTitle={topicTitle}
          onComplete={handleTopicPracticeComplete}
          onBackToLearning={handleBackToLearning}
        />
      )}
      {mode === 'remediation' && (
        <RemediationContent
          content={remediationContent}
          topicTitle={topicTitle}
          weakConcepts={weakConcepts}
          onStartRemediationQuiz={handleStartRemediationQuiz}
          onBackToLearning={handleBackToLearning}
          loading={remediationLoading}
        />
      )}
      {mode === 'remediationQuiz' && !remediationLoading && remediationQuestions.length > 0 && (
        <TopicPractice
          questions={remediationQuestions}
          topicTitle={`${topicTitle} — Remediation`}
          onComplete={handleRemediationQuizComplete}
          onBackToLearning={handleBackToLearning}
          isRemediation
          evalResult={remediationEvalResult}
          isEvaluating={remediationEvaluating}
          onContinueToNextTopic={handleContinueAfterRemediationPass}
        />
      )}
      {mode === 'remediationQuiz' && remediationLoading && (
        <div className="min-h-screen bg-[#0B0B1A] flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Generating targeted questions...</p>
          </div>
        </div>
      )}
      {mode === 'practice' && (
        <PracticeMode
          onBackToLearning={handleBackToLearning}
          topicId={topicId || `${chapterId}-1`}
          topicTitle={topicTitle || `Chapter ${chapterId} Practice`}
        />
      )}
    </div>
  );
}
