import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LearningContent } from './components/LearningContent';
import { PracticeMode } from './components/PracticeMode';
import { TopicPractice } from './components/TopicPractice';
import learningApi from '../../../services/learningApi';

export default function LearningPage() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState('learning');
  const [chapterId, setChapterId] = useState(null);
  const [topicId, setTopicId] = useState(null);
  const [topicTitle, setTopicTitle] = useState('');
  const [topicQuestions, setTopicQuestions] = useState([]);
  const [topicIndex, setTopicIndex] = useState(0);

  useEffect(() => {
    // Get chapter and topic from URL query params
    const chapterParam = searchParams.get('chapter');
    const topicParam = searchParams.get('topic');

    if (chapterParam) {
      setChapterId(parseInt(chapterParam, 10));
    } else if (topicParam) {
      // Extract chapter from topic ID (format: "1-1" or "java-001-intro")
      const match = topicParam.match(/(\d+)/);
      if (match) {
        setChapterId(parseInt(match[1], 10));
      }
      setTopicId(topicParam);
    } else {
      // Default to chapter 1
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

    // Fetch questions from the topic content
    try {
      const response = await learningApi.getTopicContent(selectedTopicId || topicId);
      if (response.success && response.questions && response.questions.length > 0) {
        setTopicQuestions(response.questions);
        setMode('topicPractice');
      } else {
        // No questions available, skip to next topic
        handleTopicPracticeComplete();
      }
    } catch (err) {
      console.error('Error fetching topic questions:', err);
      handleTopicPracticeComplete();
    }
  };

  const handleTopicPracticeComplete = () => {
    // Advance to next topic index, then go back to learning mode
    setTopicIndex(prev => prev + 1);
    setMode('learning');
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
