import { useState } from 'react';
import { LearningContent } from './components/LearningContent';
import { PracticeMode } from './components/PracticeMode';

export default function LearningPage() {
  const [mode, setMode] = useState('learning');
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);

  const handleStartPractice = () => {
    setMode('practice');
  };

  const handleBackToLearning = () => {
    setMode('learning');
  };

  return (
    <div className="min-h-screen bg-[#0B0B1A]">
      {mode === 'learning' && (
        <LearningContent
          onStartPractice={handleStartPractice}
          topicIndex={currentTopicIndex}
        />
      )}

      {mode === 'practice' && (
        <PracticeMode
          onBackToLearning={handleBackToLearning}
          topicIndex={currentTopicIndex}
        />
      )}
    </div>
  );
}
