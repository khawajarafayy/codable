import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, BookOpen, Code, CheckCircle, Lightbulb, AlertCircle, GraduationCap, Lock, ArrowLeft, Zap, Target, FlameIcon } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import learningApi from '../../../../services/learningApi';

export function LearningContent({ onStartPractice, chapterId }) {
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [chapterTitle, setChapterTitle] = useState('');
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedTopics, setCompletedTopics] = useState(new Set());
  const [topicStartTime, setTopicStartTime] = useState(Date.now());

  // Check if all topics are completed
  const allTopicsCompleted = topics.length > 0 && completedTopics.size >= topics.length;

  // Check if a topic is accessible (completed or next in sequence)
  const isTopicAccessible = (index) => {
    if (index === 0) return true; // First topic always accessible
    return completedTopics.has(index - 1); // Previous topic must be completed
  };

  // Load existing progress when chapter loads
  useEffect(() => {
    const loadProgress = async () => {
      if (!chapterId) return;
      
      try {
        const response = await learningApi.getChapterTopicsProgress(chapterId);
        
        if (response.success && response.topicsProgress) {
          // Restore completed topics from backend
          const completed = new Set();
          response.topicsProgress.forEach((tp, index) => {
            if (tp.completed) {
              // Find index by topicId
              const topicIndex = topics.findIndex(t => t.id === tp.topicId);
              if (topicIndex !== -1) {
                completed.add(topicIndex);
              }
            }
          });
          
          if (completed.size > 0) {
            setCompletedTopics(completed);
          }
        }
      } catch (err) {
        console.error('Error loading progress:', err);
        // Continue without saved progress
      }
    };

    if (topics.length > 0) {
      loadProgress();
    }
  }, [chapterId, topics.length]);

  // Track time when topic changes
  useEffect(() => {
    setTopicStartTime(Date.now());
  }, [currentTopicIndex]);

  // Save topic completion to backend
  const saveTopicCompletion = async (topicIndex) => {
    const topic = topics[topicIndex];
    if (!topic) return;
    
    const timeSpent = Math.floor((Date.now() - topicStartTime) / 1000);
    
    try {
      await learningApi.completeTopic(chapterId, topic.id, timeSpent);
      console.log(`Topic ${topic.id} marked as completed`);
    } catch (err) {
      console.error('Error saving topic completion:', err);
    }
  };

  // Save chapter completion to backend
  const saveChapterCompletion = async () => {
    try {
      await learningApi.completeChapter(chapterId);
      console.log(`Chapter ${chapterId} marked as completed`);
    } catch (err) {
      console.error('Error saving chapter completion:', err);
    }
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
          // Scroll to top when loading new topic
          window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleTopicClick = (index) => {
    if (!isTopicAccessible(index)) return; // Don't allow jumping to locked topics
    setCurrentTopicIndex(index);
  };

  // Section type configurations
  const sectionConfig = {
    introduction: {
      icon: <BookOpen className="w-5 h-5" />,
      gradient: 'from-[#6C63FF]/20 to-[#22D3EE]/10',
      borderColor: 'border-[#6C63FF]/40',
      iconBg: 'bg-[#6C63FF]/20',
      iconColor: 'text-[#6C63FF]',
      label: 'Introduction'
    },
    explanation: {
      icon: <Lightbulb className="w-5 h-5" />,
      gradient: 'from-amber-500/10 to-orange-500/5',
      borderColor: 'border-amber-500/30',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-400',
      label: 'Core Concepts'
    },
    code: {
      icon: <Code className="w-5 h-5" />,
      gradient: 'from-emerald-500/10 to-green-500/5',
      borderColor: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
      label: 'Code Examples'
    },
    details: {
      icon: <AlertCircle className="w-5 h-5" />,
      gradient: 'from-rose-500/10 to-pink-500/5',
      borderColor: 'border-rose-500/30',
      iconBg: 'bg-rose-500/20',
      iconColor: 'text-rose-400',
      label: 'Important Notes'
    },
    tips: {
      icon: <FlameIcon className="w-5 h-5" />,
      gradient: 'from-orange-500/15 to-red-500/10',
      borderColor: 'border-orange-500/40',
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-400',
      label: 'Pro Tips'
    },
    keypoints: {
      icon: <Zap className="w-5 h-5" />,
      gradient: 'from-yellow-500/15 to-amber-500/10',
      borderColor: 'border-yellow-500/40',
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-400',
      label: 'Key Points'
    },
    practice: {
      icon: <Target className="w-5 h-5" />,
      gradient: 'from-purple-500/15 to-pink-500/10',
      borderColor: 'border-purple-500/40',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
      label: 'Practice'
    },
    summary: {
      icon: <GraduationCap className="w-5 h-5" />,
      gradient: 'from-cyan-500/10 to-blue-500/5',
      borderColor: 'border-cyan-500/30',
      iconBg: 'bg-cyan-500/20',
      iconColor: 'text-cyan-400',
      label: 'Summary'
    }
  };

  // Separate sections into main content and sidebar
  const mainSectionTypes = ['introduction', 'explanation', 'code', 'details'];
  const sidebarSectionTypes = ['keypoints', 'tips', 'practice', 'summary'];
  
  const mainSections = sections.filter(s => mainSectionTypes.includes(s.type));
  const sidebarSections = sections.filter(s => sidebarSectionTypes.includes(s.type));

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
                  Topic {currentTopicIndex + 1} of {topics.length}
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
        <div className="max-w-7xl mx-auto px-6 py-3">
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

      {/* Main Content - Two Column Layout */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="bg-[#13132B]/50 rounded-xl border border-gray-800/50 p-8 text-center">
            <div className="w-8 h-8 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading content...</p>
          </div>
        ) : (
          <>
            {/* Current Topic Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">{currentTopic?.title}</h2>
              <p className="text-gray-400 text-lg">{currentTopic?.description}</p>
            </div>

            {/* Two Column Layout */}
            <div className="flex gap-6">
              {/* Main Content Column */}
              <div className="flex-1 space-y-6 min-w-0">
                {mainSections.map((section, index) => (
                  <div 
                    key={index}
                    className={`bg-gradient-to-br ${getSectionStyle(section.type).gradient} rounded-2xl border ${getSectionStyle(section.type).borderColor} p-6 shadow-lg`}
                  >
                    {/* Section Header */}
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-700/50">
                      <div className={`p-2 rounded-lg ${getSectionStyle(section.type).iconBg}`}>
                        <span className={getSectionStyle(section.type).iconColor}>
                          {getSectionStyle(section.type).icon}
                        </span>
                      </div>
                      <div>
                        <span className={`text-xs font-medium uppercase tracking-wider ${getSectionStyle(section.type).iconColor}`}>
                          {getSectionStyle(section.type).label}
                        </span>
                        <h3 className="text-xl font-semibold text-white">{section.title}</h3>
                      </div>
                    </div>

                    {/* Section Content */}
                    <div className="prose prose-invert max-w-none">
                      {section.content && (
                        <div className="text-gray-200 leading-relaxed space-y-3">
                          {section.content.split('\n\n').map((paragraph, idx) => (
                            <p key={idx} className="text-gray-200" dangerouslySetInnerHTML={{
                              __html: paragraph
                                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                                .replace(/\*(.*?)\*/g, '<em class="text-gray-300">$1</em>')
                            }} />
                          ))}
                        </div>
                      )}

                      {/* Code Examples */}
                      {section.examples && section.examples.length > 0 && (
                        <div className="mt-6 space-y-4">
                          {section.examples.map((code, codeIdx) => (
                            <div key={codeIdx} className="relative group">
                              <div className="absolute top-0 left-0 right-0 h-9 bg-gray-900 rounded-t-xl flex items-center px-4 border-b border-gray-700">
                                <div className="flex gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60"></div>
                                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60"></div>
                                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60"></div>
                                </div>
                                <span className="ml-3 text-xs text-gray-400 font-mono">Example{section.examples.length > 1 ? ` ${codeIdx + 1}` : ''}.java</span>
                              </div>
                              <pre className="bg-[#0D1117] pt-12 pb-4 px-4 rounded-xl overflow-x-auto border border-gray-700 shadow-xl">
                                <code className="text-emerald-400 text-sm font-mono leading-relaxed whitespace-pre-wrap">{code}</code>
                              </pre>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Points if in main section */}
                      {section.points && section.points.length > 0 && (
                        <div className="mt-6 space-y-3">
                          {section.points.map((point, pointIdx) => (
                            <div 
                              key={pointIdx} 
                              className="flex items-start gap-3 bg-gray-800/30 rounded-lg p-3"
                            >
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center mt-0.5">
                                <span className="text-cyan-400 font-bold text-xs">{pointIdx + 1}</span>
                              </div>
                              <p className="text-gray-200 leading-relaxed flex-1 text-sm" dangerouslySetInnerHTML={{
                                __html: point
                                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                                  .replace(/\*(.*?)\*/g, '<em class="text-gray-300">$1</em>')
                              }} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Navigation at Bottom */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-800/50">
                  <Button
                    onClick={() => {
                      if (currentTopicIndex > 0) {
                        setCurrentTopicIndex(currentTopicIndex - 1);
                      }
                    }}
                    disabled={currentTopicIndex === 0}
                    variant="outline"
                    className="border-gray-700 text-gray-300 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous Topic
                  </Button>

                  <div className="text-gray-400 text-sm">
                    Topic {currentTopicIndex + 1} of {topics.length}
                  </div>

                  {currentTopicIndex === topics.length - 1 ? (
                    <Button
                      onClick={() => {
                        setCompletedTopics(prev => new Set([...prev, currentTopicIndex]));
                        saveTopicCompletion(currentTopicIndex);
                        saveChapterCompletion();
                        onStartPractice(currentTopic?.id, currentTopic?.title);
                      }}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      Complete & Practice
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setCompletedTopics(prev => new Set([...prev, currentTopicIndex]));
                        saveTopicCompletion(currentTopicIndex);
                        setCurrentTopicIndex(currentTopicIndex + 1);
                      }}
                      className="bg-gradient-to-r from-[#6C63FF] to-[#22D3EE]"
                    >
                      Next Topic
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Sidebar - Key Points, Tips, Summary */}
              {sidebarSections.length > 0 && (
                <div className="w-80 flex-shrink-0 space-y-4 sticky top-[180px] self-start max-h-[calc(100vh-220px)] overflow-y-auto">
                  {sidebarSections.map((section, index) => (
                    <div 
                      key={index}
                      className={`bg-gradient-to-br ${getSectionStyle(section.type).gradient} rounded-xl border ${getSectionStyle(section.type).borderColor} p-4 shadow-lg`}
                    >
                      {/* Sidebar Section Header */}
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700/50">
                        <div className={`p-1.5 rounded-lg ${getSectionStyle(section.type).iconBg}`}>
                          <span className={getSectionStyle(section.type).iconColor}>
                            {getSectionStyle(section.type).icon}
                          </span>
                        </div>
                        <h4 className={`text-sm font-semibold ${getSectionStyle(section.type).iconColor}`}>
                          {section.title}
                        </h4>
                      </div>

                      {/* Sidebar Content */}
                      {section.content && (
                        <div className="text-gray-300 text-sm leading-relaxed mb-3" dangerouslySetInnerHTML={{
                          __html: section.content
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em class="text-gray-300">$1</em>')
                            .replace(/\\n/g, '<br/>')
                        }} />
                      )}

                      {/* Sidebar Points */}
                      {section.points && section.points.length > 0 && (
                        <div className="space-y-2">
                          {section.points.map((point, pointIdx) => (
                            <div 
                              key={pointIdx} 
                              className="flex items-start gap-2 text-sm"
                            >
                              <span className={`flex-shrink-0 w-5 h-5 rounded-full ${getSectionStyle(section.type).iconBg} flex items-center justify-center`}>
                                <span className={`${getSectionStyle(section.type).iconColor} font-bold text-xs`}>{pointIdx + 1}</span>
                              </span>
                              <p className="text-gray-300 leading-relaxed flex-1" dangerouslySetInnerHTML={{
                                __html: point
                                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                                  .replace(/\*(.*?)\*/g, '<em class="text-gray-300">$1</em>')
                              }} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}