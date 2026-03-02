import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, BookOpen, Code, CheckCircle, Lightbulb, AlertCircle, GraduationCap, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import learningApi from '../../../../services/learningApi';

export function LearningContent({ onStartPractice, chapterId }) {
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [chapterTitle, setChapterTitle] = useState('');
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedTopics, setCompletedTopics] = useState(new Set());

  // Check if all topics are completed
  const allTopicsCompleted = topics.length > 0 && completedTopics.size >= topics.length;

  // Check if a topic is accessible (completed or next in sequence)
  const isTopicAccessible = (index) => {
    if (index === 0) return true; // First topic always accessible
    return completedTopics.has(index - 1); // Previous topic must be completed
  };

  // Load topics for chapter
  useEffect(() => {
    const loadTopics = async () => {
      if (!chapterId) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await learningApi.getChapterTopics(chapterId);
        
        if (response.success) {
          setTopics(response.topics);
          setChapterTitle(response.chapter_title);
        } else {
          setError(response.error || 'Failed to load topics');
        }
      } catch (err) {
        console.error('Error loading topics:', err);
        setError('Failed to load topics. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadTopics();
  }, [chapterId]);

  // Load content for current topic
  useEffect(() => {
    const loadContent = async () => {
      if (topics.length === 0) return;
      
      const currentTopic = topics[currentTopicIndex];
      if (!currentTopic) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await learningApi.getTopicContent(currentTopic.id);
        
        if (response.success) {
          setContent(response);
          setCurrentSectionIndex(0); // Reset to first section
        } else {
          setError(response.error || 'Failed to load content');
        }
      } catch (err) {
        console.error('Error loading content:', err);
        setError('Failed to load content. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [currentTopicIndex, topics]);

  const currentTopic = topics[currentTopicIndex];
  const sections = content?.sections || [];
  const currentSection = sections[currentSectionIndex];
  const totalSections = sections.length;

  const handleNextSection = () => {
    if (currentSectionIndex < totalSections - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    } else {
      // Mark current topic as completed when finishing last section
      setCompletedTopics(prev => new Set([...prev, currentTopicIndex]));
      
      if (currentTopicIndex < topics.length - 1) {
        // Move to next topic
        setCurrentTopicIndex(currentTopicIndex + 1);
        setCurrentSectionIndex(0);
      }
    }
  };

  const handlePreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    } else if (currentTopicIndex > 0) {
      // Move to previous topic's last section
      setCurrentTopicIndex(currentTopicIndex - 1);
      // Will load content and we set to last section in useEffect
    }
  };

  const handleTopicClick = (index) => {
    if (!isTopicAccessible(index)) return; // Don't allow jumping to locked topics
    setCurrentTopicIndex(index);
    setCurrentSectionIndex(0);
  };

  // Section type configurations
  const sectionConfig = {
    introduction: {
      icon: <BookOpen className="w-6 h-6" />,
      gradient: 'from-[#6C63FF]/20 to-[#22D3EE]/10',
      borderColor: 'border-[#6C63FF]/40',
      iconBg: 'bg-[#6C63FF]/20',
      iconColor: 'text-[#6C63FF]',
      label: 'Introduction'
    },
    explanation: {
      icon: <Lightbulb className="w-6 h-6" />,
      gradient: 'from-amber-500/10 to-orange-500/5',
      borderColor: 'border-amber-500/30',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-400',
      label: 'Core Concepts'
    },
    code: {
      icon: <Code className="w-6 h-6" />,
      gradient: 'from-emerald-500/10 to-green-500/5',
      borderColor: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
      label: 'Code Examples'
    },
    details: {
      icon: <AlertCircle className="w-6 h-6" />,
      gradient: 'from-rose-500/10 to-pink-500/5',
      borderColor: 'border-rose-500/30',
      iconBg: 'bg-rose-500/20',
      iconColor: 'text-rose-400',
      label: 'Important Notes'
    },
    summary: {
      icon: <GraduationCap className="w-6 h-6" />,
      gradient: 'from-cyan-500/10 to-blue-500/5',
      borderColor: 'border-cyan-500/30',
      iconBg: 'bg-cyan-500/20',
      iconColor: 'text-cyan-400',
      label: 'Summary'
    }
  };

  const getSectionStyle = (type) => {
    return sectionConfig[type] || sectionConfig.explanation;
  };

  if (loading && topics.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading chapter content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-[#6C63FF]">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950">
      {/* Header */}
      <div className="bg-[#13132B]/80 border-b border-gray-800/50 px-6 py-4 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/student')}
                variant="ghost"
                className="text-gray-400 hover:text-white hover:bg-gray-800/50 p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <p className="text-[#6C63FF] text-sm mb-1">Chapter {chapterId}</p>
                <h1 className="text-2xl text-white mb-1">{chapterTitle}</h1>
                <p className="text-gray-400">
                  Topic {currentTopicIndex + 1} of {topics.length} • 
                  Section {currentSectionIndex + 1} of {totalSections}
                </p>
              </div>
            </div>
            <div className="relative group">
              <Button
                onClick={() => onStartPractice(currentTopic?.id, currentTopic?.title)}
                disabled={!allTopicsCompleted}
                className={`${allTopicsCompleted 
                  ? 'bg-gradient-to-r from-[#6C63FF] to-[#22D3EE] hover:from-[#5B52EE] hover:to-[#11C2DD]' 
                  : 'bg-gray-700 cursor-not-allowed opacity-60'}`}
              >
                {!allTopicsCompleted && <Lock className="w-4 h-4 mr-2" />}
                {allTopicsCompleted && <Code className="w-4 h-4 mr-2" />}
                Start Practice
              </Button>
              {!allTopicsCompleted && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 border border-amber-500/50 rounded-lg text-amber-400 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" />
                    Complete all topics first to unlock practice
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-amber-500/50"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Topic Navigation Bar */}
      <div className="bg-[#0B0B1A]/80 border-b border-gray-800/50 sticky top-[89px] z-10">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {topics.map((topic, index) => {
              const accessible = isTopicAccessible(index);
              const isCompleted = completedTopics.has(index);
              const isCurrent = index === currentTopicIndex;
              
              return (
                <div key={topic.id} className="relative group flex-shrink-0">
                  <button
                    onClick={() => handleTopicClick(index)}
                    disabled={!accessible}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      isCurrent
                        ? 'bg-[#6C63FF] text-white'
                        : isCompleted
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-pointer'
                        : accessible
                        ? 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 cursor-pointer'
                        : 'bg-gray-900/50 text-gray-600 cursor-not-allowed opacity-60'
                    }`}
                  >
                    {!accessible && <Lock className="w-3 h-3 inline mr-1" />}
                    {isCompleted && <CheckCircle className="w-3 h-3 inline mr-1" />}
                    {topic.title}
                  </button>
                  {!accessible && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 border border-amber-500/50 rounded-lg text-amber-400 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" />
                        Complete previous topics first
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-amber-500/50"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="bg-[#13132B]/50 rounded-xl border border-gray-800/50 p-8 text-center">
            <div className="w-8 h-8 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading content...</p>
          </div>
        ) : (
          <>
            {/* Current Topic Header */}
            <div className="mb-6">
              <h2 className="text-2xl text-white mb-2">{currentTopic?.title}</h2>
              <p className="text-gray-400">{currentTopic?.description}</p>
            </div>

            {/* Section Content */}
            {currentSection && (
              <div className={`bg-gradient-to-br ${getSectionStyle(currentSection.type).gradient} rounded-2xl border ${getSectionStyle(currentSection.type).borderColor} p-8 mb-6 shadow-lg`}>
                {/* Section Header */}
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-700/50">
                  <div className={`p-3 rounded-xl ${getSectionStyle(currentSection.type).iconBg}`}>
                    <span className={getSectionStyle(currentSection.type).iconColor}>
                      {getSectionStyle(currentSection.type).icon}
                    </span>
                  </div>
                  <div>
                    <span className={`text-xs font-medium uppercase tracking-wider ${getSectionStyle(currentSection.type).iconColor}`}>
                      {getSectionStyle(currentSection.type).label}
                    </span>
                    <h3 className="text-2xl font-semibold text-white">{currentSection.title}</h3>
                  </div>
                </div>

                {/* Section Content */}
                <div className="prose prose-invert max-w-none">
                  {currentSection.content && (
                    <div className="text-gray-200 leading-relaxed text-lg space-y-4">
                      {currentSection.content.split('\n\n').map((paragraph, idx) => (
                        <p key={idx} className="text-gray-200">{paragraph}</p>
                      ))}
                    </div>
                  )}

                  {/* Code Examples - Enhanced */}
                  {currentSection.examples && currentSection.examples.length > 0 && (
                    <div className="mt-8 space-y-6">
                      {currentSection.examples.map((code, index) => (
                        <div key={index} className="relative group">
                          <div className="absolute top-0 left-0 right-0 h-10 bg-gray-900 rounded-t-xl flex items-center px-4 border-b border-gray-700">
                            <div className="flex gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500/60"></div>
                              <div className="w-3 h-3 rounded-full bg-yellow-500/60"></div>
                              <div className="w-3 h-3 rounded-full bg-green-500/60"></div>
                            </div>
                            <span className="ml-4 text-xs text-gray-400 font-mono">Example {index + 1}.java</span>
                          </div>
                          <pre className="bg-[#0D1117] pt-14 pb-6 px-6 rounded-xl overflow-x-auto border border-gray-700 shadow-xl">
                            <code className="text-emerald-400 text-sm font-mono leading-relaxed">{code}</code>
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Key Points - Enhanced */}
                  {currentSection.points && currentSection.points.length > 0 && (
                    <div className="mt-8 grid gap-4">
                      {currentSection.points.map((point, index) => (
                        <div 
                          key={index} 
                          className="flex items-start gap-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/5 border border-cyan-500/30 rounded-xl p-5 hover:border-cyan-400/50 transition-all"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                            <span className="text-cyan-400 font-bold text-sm">{index + 1}</span>
                          </div>
                          <p className="text-gray-200 leading-relaxed flex-1">{point}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section Progress Dots */}
            <div className="flex justify-center gap-2 mb-6">
              {sections.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSectionIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentSectionIndex
                      ? 'bg-[#6C63FF] w-8'
                      : index < currentSectionIndex
                      ? 'bg-green-500'
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                onClick={handlePreviousSection}
                disabled={currentTopicIndex === 0 && currentSectionIndex === 0}
                variant="outline"
                className="border-gray-700 text-gray-300 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="text-gray-400 text-sm">
                Section {currentSectionIndex + 1} of {totalSections}
              </div>

              {currentTopicIndex === topics.length - 1 && currentSectionIndex === totalSections - 1 ? (
                <Button
                  onClick={() => {
                    // Mark final topic as completed before starting practice
                    setCompletedTopics(prev => new Set([...prev, currentTopicIndex]));
                    onStartPractice(currentTopic?.id, currentTopic?.title);
                  }}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  Complete & Practice
                  <CheckCircle className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleNextSection}
                  className="bg-gradient-to-r from-[#6C63FF] to-[#22D3EE]"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}