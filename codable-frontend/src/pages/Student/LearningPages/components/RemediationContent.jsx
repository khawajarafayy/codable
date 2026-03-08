import { useState } from 'react';
import { ArrowLeft, BookOpen, AlertTriangle, Lightbulb, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';

export function RemediationContent({ content, topicTitle, weakConcepts, onStartRemediationQuiz, onBackToLearning, loading }) {
  const [expandedSection, setExpandedSection] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg font-medium">Generating personalized review material...</p>
          <p className="text-gray-400 text-sm mt-2">Analyzing your mistakes to create targeted content</p>
        </div>
      </div>
    );
  }

  const sections = content?.sections || [];
  const summary = content?.summary || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-amber-950/30">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/80 backdrop-blur-md border-b border-amber-800/30">
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
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <h1 className="text-white font-semibold">Review & Strengthen</h1>
              </div>
              <p className="text-gray-400 text-sm">{topicTitle}</p>
            </div>
          </div>
          <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
            <span className="text-amber-400 text-sm font-medium">Remediation</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Focus Areas Banner */}
        {weakConcepts && weakConcepts.length > 0 && (
          <div className="mb-6 p-4 bg-amber-500/5 rounded-xl border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">Areas to strengthen</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {weakConcepts.map((wc, idx) => (
                <span key={idx} className="px-3 py-1 bg-amber-500/10 rounded-full text-amber-300 text-xs">
                  {wc.concept || wc}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Content Sections */}
        <div className="space-y-6">
          {sections.map((section, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 rounded-xl border border-gray-800/50 overflow-hidden"
            >
              <button
                onClick={() => setExpandedSection(expandedSection === idx ? -1 : idx)}
                className="w-full text-left p-6 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                  </span>
                  <div>
                    <h3 className="text-white font-medium">{section.title}</h3>
                    {section.targetConcept && (
                      <span className="text-amber-400/70 text-xs">{section.targetConcept}</span>
                    )}
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === idx ? 'rotate-90' : ''}`} />
              </button>

              {expandedSection === idx && (
                <div className="px-6 pb-6">
                  {/* Main Content */}
                  <div className="prose prose-invert max-w-none mb-4">
                    <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {section.content}
                    </div>
                  </div>

                  {/* Code Examples */}
                  {section.examples && section.examples.length > 0 && (
                    <div className="space-y-3 mb-4">
                      <h4 className="text-gray-400 text-xs font-medium uppercase tracking-wider">Examples</h4>
                      {section.examples.map((example, exIdx) => (
                        <pre key={exIdx} className="p-4 bg-gray-950 rounded-lg border border-gray-800 overflow-x-auto">
                          <code className="text-green-400 text-sm">{example}</code>
                        </pre>
                      ))}
                    </div>
                  )}

                  {/* Common Pitfall */}
                  {section.commonPitfall && (
                    <div className="p-3 bg-red-500/5 rounded-lg border border-red-500/20 mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        <span className="text-red-400 text-xs font-medium">Common Pitfall</span>
                      </div>
                      <p className="text-gray-300 text-sm">{section.commonPitfall}</p>
                    </div>
                  )}

                  {/* Key Takeaway */}
                  {section.keyTakeaway && (
                    <div className="p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                      <span className="text-green-400 text-xs font-medium">Key Takeaway: </span>
                      <span className="text-gray-300 text-sm">{section.keyTakeaway}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        {summary && (
          <div className="mt-6 p-4 bg-[#6C63FF]/5 rounded-xl border border-[#6C63FF]/20">
            <p className="text-gray-300 text-sm">{summary}</p>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-8 text-center">
          <Button
            onClick={onStartRemediationQuiz}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 px-8 py-3 text-base"
          >
            Ready to Try Again
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-gray-500 text-xs mt-2">You'll get questions focused on your weak areas</p>
        </div>
      </div>
    </div>
  );
}
