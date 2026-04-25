import { Card } from "../../../../components/ui/card";
import { Progress } from "../../../../components/ui/progress";
import { AlertTriangle, Bug, Code, Zap, TrendingUp, TrendingDown, Minus, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

export function ErrorIntelligence({ errorProfile, loading }) {
  const [timePeriod, setTimePeriod] = useState('all'); // 'all' or 'recent'
  const [selectedChapter, setSelectedChapter] = useState(null);

  if (loading) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Error Intelligence</h2>
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-700/50 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  console.log("ErrorIntelligence received errorProfile:", errorProfile);

  if (!errorProfile || (errorProfile.total_errors_recorded === 0 && !errorProfile.chapter_breakdown?.length)) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Error Intelligence Panel</h2>
        <p className="text-gray-400">No error data available yet. Complete some topics to see error patterns.</p>
      </Card>
    );
  }

  // Select error rates based on time period
  const displayData = timePeriod === 'recent' && errorProfile.recent_7_days
    ? errorProfile.recent_7_days
    : {
        syntax_error_rate: errorProfile.syntax_error_rate,
        logic_error_rate: errorProfile.logic_error_rate,
        runtime_error_rate: errorProfile.runtime_error_rate,
        edge_case_failure_rate: errorProfile.edge_case_failure_rate,
        total_errors: errorProfile.total_errors_recorded
      };

  const errorTypes = [
    {
      icon: Code,
      label: "Syntax Errors",
      rate: displayData.syntax_error_rate || 0,
      color: "from-red-500 to-pink-500",
      description: "Violations of Java syntax rules"
    },
    {
      icon: Bug,
      label: "Logic Errors",
      rate: displayData.logic_error_rate || 0,
      color: "from-orange-500 to-yellow-500",
      description: "Incorrect algorithm or program flow"
    },
    {
      icon: Zap,
      label: "Runtime Errors",
      rate: displayData.runtime_error_rate || 0,
      color: "from-purple-500 to-indigo-500",
      description: "Crashes during code execution"
    },
    {
      icon: AlertTriangle,
      label: "Edge Case Failures",
      rate: displayData.edge_case_failure_rate || 0,
      color: "from-blue-500 to-cyan-500",
      description: "Boundary condition issues"
    },
  ];

  // Get trend indicator
  const getTrendIcon = () => {
    if (!errorProfile.error_trend) return null;
    if (errorProfile.error_trend === 'increasing') {
      return <TrendingUp className="w-5 h-5 text-red-400" />;
    } else if (errorProfile.error_trend === 'decreasing') {
      return <TrendingDown className="w-5 h-5 text-green-400" />;
    }
    return <Minus className="w-5 h-5 text-yellow-400" />;
  };

  const getTrendLabel = () => {
    if (!errorProfile.error_trend) return '';
    return errorProfile.error_trend.charAt(0).toUpperCase() + errorProfile.error_trend.slice(1);
  };

  // Chapter-specific view
  const currentChapterData = useMemo(() => {
    if (!selectedChapter || !errorProfile.chapter_breakdown) return null;
    return errorProfile.chapter_breakdown.find(ch => ch.chapterId === selectedChapter);
  }, [selectedChapter, errorProfile.chapter_breakdown]);

  return (
    <div className="space-y-6">
      {/* Main Error Panel */}
      <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Error Intelligence Panel</h2>
            <p className="text-gray-400 text-sm mt-1">Track and improve your coding patterns</p>
          </div>
          
          {/* Trend Indicator */}
          {errorProfile.error_trend && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700">
              {getTrendIcon()}
              <span className="text-sm font-medium text-white">{getTrendLabel()}</span>
            </div>
          )}
        </div>

        {/* Time Period Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTimePeriod('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              timePeriod === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setTimePeriod('recent')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              timePeriod === 'recent'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Last 7 Days
          </button>
        </div>

        {/* Error Rate Cards */}
        <div className="space-y-6 mb-6">
          {errorTypes.map((error, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${error.color} flex items-center justify-center`}>
                    <error.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="text-white font-medium block">{error.label}</span>
                    <span className="text-xs text-gray-400">{error.description}</span>
                  </div>
                </div>
                <span className="text-white font-bold text-lg">{error.rate}%</span>
              </div>
              <Progress value={error.rate} className="h-2" />
            </div>
          ))}
        </div>

        {/* Common Error Patterns */}
        {errorProfile.common_patterns && errorProfile.common_patterns.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3">Common Error Patterns</h3>
            <div className="space-y-2">
              {errorProfile.common_patterns.map((pattern, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-400"></div>
                  {pattern}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Chapter Breakdown Section */}
      {errorProfile.chapter_breakdown && errorProfile.chapter_breakdown.length > 0 && (
        <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Performance by Chapter</h3>
          
          <div className="space-y-3">
            {errorProfile.chapter_breakdown.map((chapter) => {
              const isSelected = selectedChapter === chapter.chapterId;
              const highestError = Math.max(
                chapter.syntaxErrorRate,
                chapter.logicErrorRate,
                chapter.runtimeErrorRate,
                chapter.edgeCaseFailureRate
              );
              
              return (
                <div
                  key={chapter.chapterId}
                  onClick={() => setSelectedChapter(isSelected ? null : chapter.chapterId)}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-500/20 border-blue-500/50'
                      : 'bg-gray-800/30 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold">Chapter {chapter.chapterId}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{chapter.totalErrorsInChapter} errors</span>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                  
                  {/* Quick error rate preview */}
                  <div className="flex gap-2 mb-2">
                    {highestError > 0 && (
                      <div className="text-xs text-gray-300">
                        {chapter.logicErrorRate > 0 && <span>Logic: {chapter.logicErrorRate}% </span>}
                        {chapter.syntaxErrorRate > 0 && <span>Syntax: {chapter.syntaxErrorRate}% </span>}
                        {chapter.edgeCaseFailureRate > 0 && <span>Edge Cases: {chapter.edgeCaseFailureRate}%</span>}
                      </div>
                    )}
                  </div>
                  
                  <Progress value={Math.min(100, highestError)} className="h-1" />
                </div>
              );
            })}
          </div>

          {/* Chapter Details */}
          {currentChapterData && (
            <div className="mt-6 pt-6 border-t border-gray-700 space-y-4">
              <h4 className="text-white font-semibold">Chapter {currentChapterData.chapterId} Details</h4>
              
              {/* Error patterns for this chapter */}
              {currentChapterData.errorPatterns && currentChapterData.errorPatterns.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Top Error Patterns</p>
                  <div className="space-y-2">
                    {currentChapterData.errorPatterns.map((pattern, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">{pattern.pattern}</span>
                        <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">
                          {pattern.frequency}x
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Chapter statistics */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-800/50 rounded p-2">
                  <p className="text-xs text-gray-400">Avg Score</p>
                  <p className="text-lg font-semibold text-white">{Math.round(currentChapterData.averageScore)}%</p>
                </div>
                <div className="bg-gray-800/50 rounded p-2">
                  <p className="text-xs text-gray-400">First Attempt Success</p>
                  <p className="text-lg font-semibold text-white">{Math.round(currentChapterData.firstAttemptSuccessRate)}%</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Recommendations Section */}
      {errorProfile.error_recommendations && errorProfile.error_recommendations.length > 0 && (
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-xl border border-amber-500/30 p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Recommendations
          </h3>
          
          <div className="space-y-3">
            {errorProfile.error_recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 ${
                  rec.priority === 'high'
                    ? 'border-l-red-500 bg-red-500/10'
                    : 'border-l-yellow-500 bg-yellow-500/10'
                }`}
              >
                <p className="text-sm text-gray-200">{rec.message}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
