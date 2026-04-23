import { ArrowLeft, BookOpen, AlertTriangle, Lightbulb, ChevronRight, Loader2, CheckCircle, Code, List } from 'lucide-react';
import { Button } from '../../../../components/ui/button';

/**
 * Converts ANY value (string, object, array, number) to a plain readable string.
 * The LLM sometimes returns section.content as a nested object instead of a string.
 */
function toText(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) {
    return val.map(item => toText(item)).filter(Boolean).join('\n\n');
  }
  if (typeof val === 'object') {
    // Prefer known text field names first
    for (const k of ['content', 'text', 'explanation', 'description', 'body']) {
      if (typeof val[k] === 'string' && val[k].trim()) return val[k];
    }
    return Object.values(val).map(v => toText(v)).filter(Boolean).join('\n\n');
  }
  return '';
}

/**
 * Normalize the full content prop into { sections, summary, quickCheck }.
 * Handles the NEW structure: whatWentWrong, conceptExplanation, conceptComparison, example, keyPoints
 * Also handles legacy field names and sections array format.
 */
function normalizeContent(raw) {
  if (!raw) return { sections: [], summary: '', quickCheck: null };

  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); }
    catch { return { sections: [{ title: 'Review Material', content: raw }], summary: '', quickCheck: null }; }
  }

  if (typeof raw !== 'object') {
    return { sections: [{ title: 'Review Material', content: toText(raw) }], summary: '', quickCheck: null };
  }

  // NEW STRUCTURE: whatWentWrong, conceptExplanation, conceptComparison, example, keyPoints
  // Also supports legacy names: mistakeExplanation, conceptRefresher
  const whatWentWrong = raw.whatWentWrong || raw.mistakeExplanation;
  const conceptExplanation = raw.conceptExplanation || raw.conceptRefresher;
  
  if (whatWentWrong || conceptExplanation || raw.keyPoints) {
    const sections = [];

    if (whatWentWrong) {
      sections.push({
        title: 'What Went Wrong',
        type: 'mistake',
        content: toText(whatWentWrong)
      });
    }

    if (conceptExplanation) {
      sections.push({
        title: 'Concept Explanation',
        type: 'explanation',
        content: toText(conceptExplanation)
      });
    }

    if (raw.conceptComparison) {
      sections.push({
        title: 'Understanding the Difference',
        type: 'comparison',
        content: toText(raw.conceptComparison)
      });
    }

    if (raw.example) {
      sections.push({
        title: 'Example',
        type: 'example',
        content: toText(raw.example)
      });
    }

    if (raw.keyPoints && Array.isArray(raw.keyPoints)) {
      sections.push({
        title: 'Key Points',
        type: 'keypoints',
        content: raw.keyPoints.map(p => `• ${toText(p)}`).join('\n')
      });
    }

    return {
      sections,
      summary: '',
      quickCheck: raw.quickCheck || null
    };
  }

  // LEGACY STRUCTURE: sections array
  if (Array.isArray(raw.sections)) {
    return {
      sections: raw.sections.map(s => ({
        ...s,
        content: toText(s?.content),
        examples: Array.isArray(s?.examples)
          ? s.examples.map(e => (typeof e === 'string' ? e : toText(e)))
          : [],
        points: Array.isArray(s?.points) ? s.points : [],
        commonPitfall: toText(s?.commonPitfall),
        keyTakeaway: toText(s?.keyTakeaway),
      })),
      summary: toText(raw.summary),
      quickCheck: raw.quickCheck || null
    };
  }

  // No sections field — treat object values as sections
  const sections = Object.entries(raw)
    .filter(([k, v]) => v && k !== 'quickCheck')
    .map(([k, v]) => ({ title: k, content: toText(v) }));
  return { sections, summary: '', quickCheck: raw.quickCheck || null };
}

/** Apply inline markdown — identical to LearningContent.jsx */
function applyInline(str) {
  return (str || '')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-gray-300">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-gray-800 px-1.5 py-0.5 rounded text-emerald-400 text-xs font-mono">$1</code>');
}

/**
 * Render a text string using the exact same paragraph-split approach as LearningContent.jsx.
 * Split on double-newlines, then detect each paragraph's type.
 */
function renderTextContent(text) {
  if (!text) return null;
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, idx) => {
        const trimmed = paragraph.trim();

        // Fenced code block
        const fenceMatch = trimmed.match(/^```(?:[a-zA-Z]*)?\n?([\s\S]*?)```$/);
        if (fenceMatch) {
          return (
            <div key={idx}>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-t-xl border border-gray-700 border-b-0">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                </div>
                <span className="text-xs text-gray-400 font-mono">Example.java</span>
              </div>
              <pre className="bg-[#0D1117] p-4 rounded-b-xl overflow-x-auto border border-gray-700 shadow-xl">
                <code className="text-emerald-400 text-sm font-mono leading-relaxed">{fenceMatch[1].trimEnd()}</code>
              </pre>
            </div>
          );
        }

        // Bullet list (all non-empty lines start with -, *, or •)
        const lines = trimmed.split('\n');
        const bulletItems = lines.filter(l => l.trim().match(/^[-*•]\s+/));
        if (bulletItems.length > 0 && bulletItems.length === lines.filter(l => l.trim()).length) {
          return (
            <ul key={idx} className="space-y-2 pl-1">
              {bulletItems.map((item, ii) => (
                <li key={ii} className="flex items-start gap-2 text-sm">
                  <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>
                  <span className="text-gray-300 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: applyInline(item.trim().replace(/^[-*•]\s+/, '')) }} />
                </li>
              ))}
            </ul>
          );
        }

        // Numbered list
        const numberedItems = lines.filter(l => l.trim().match(/^\d+\.\s+/));
        if (numberedItems.length > 0 && numberedItems.length === lines.filter(l => l.trim()).length) {
          return (
            <ol key={idx} className="space-y-2 pl-1">
              {numberedItems.map((item, ii) => (
                <li key={ii} className="flex items-start gap-2 text-sm">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs mt-0.5">{ii + 1}</span>
                  <span className="text-gray-300 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: applyInline(item.trim().replace(/^\d+\.\s+/, '')) }} />
                </li>
              ))}
            </ol>
          );
        }

        if (trimmed.startsWith('### ')) return <h4 key={idx} className="text-white font-semibold text-sm mt-2">{trimmed.slice(4)}</h4>;
        if (trimmed.startsWith('## ')) return <h3 key={idx} className="text-white font-semibold mt-2">{trimmed.slice(3)}</h3>;

        // Default paragraph — exactly like LearningContent.jsx
        return (
          <p key={idx} className="text-gray-200 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: applyInline(trimmed) }} />
        );
      })}
    </div>
  );
}

/** Get icon and color based on section type */
function getSectionStyle(type) {
  switch (type) {
    case 'mistake':
      return { 
        Icon: AlertTriangle, 
        iconColor: 'text-red-400', 
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30',
        gradientFrom: 'from-red-500/10',
        gradientTo: 'to-orange-500/5'
      };
    case 'explanation':
      return { 
        Icon: BookOpen, 
        iconColor: 'text-blue-400', 
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/30',
        gradientFrom: 'from-blue-500/10',
        gradientTo: 'to-cyan-500/5'
      };
    case 'comparison':
      return { 
        Icon: List, 
        iconColor: 'text-purple-400', 
        bgColor: 'bg-purple-500/20',
        borderColor: 'border-purple-500/30',
        gradientFrom: 'from-purple-500/10',
        gradientTo: 'to-indigo-500/5'
      };
    case 'example':
      return { 
        Icon: Code, 
        iconColor: 'text-emerald-400', 
        bgColor: 'bg-emerald-500/20',
        borderColor: 'border-emerald-500/30',
        gradientFrom: 'from-emerald-500/10',
        gradientTo: 'to-green-500/5'
      };
    case 'keypoints':
      return { 
        Icon: CheckCircle, 
        iconColor: 'text-amber-400', 
        bgColor: 'bg-amber-500/20',
        borderColor: 'border-amber-500/30',
        gradientFrom: 'from-amber-500/10',
        gradientTo: 'to-yellow-500/5'
      };
    default:
      return { 
        Icon: Lightbulb, 
        iconColor: 'text-amber-400', 
        bgColor: 'bg-amber-500/20',
        borderColor: 'border-amber-500/30',
        gradientFrom: 'from-amber-500/10',
        gradientTo: 'to-orange-500/5'
      };
  }
}

export function RemediationContent({ content, topicTitle, weakConcepts, onStartRemediationQuiz, onBackToLearning, loading }) {
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

  const { sections, summary, quickCheck } = normalizeContent(content);

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

        {/* Content Sections — same card style + same text rendering as LearningContent.jsx */}
        <div className="space-y-6">
          {sections.map((section, idx) => {
            const style = getSectionStyle(section.type);
            const { Icon } = style;
            
            return (
            <div
              key={idx}
              className={`bg-gradient-to-br ${style.gradientFrom} ${style.gradientTo} rounded-2xl border ${style.borderColor} p-6 shadow-lg`}
            >
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-700/50">
                <div className={`p-2 rounded-lg ${style.bgColor}`}>
                  <Icon className={`w-5 h-5 ${style.iconColor}`} />
                </div>
                <div>
                  {section.targetConcept && (
                    <span className={`text-xs font-medium uppercase tracking-wider ${style.iconColor} block`}>
                      {section.targetConcept}
                    </span>
                  )}
                  <h3 className="text-xl font-semibold text-white">{section.title}</h3>
                </div>
              </div>

              {/* Main text content — paragraphs rendered like LearningContent.jsx */}
              <div className="prose prose-invert max-w-none">
                {renderTextContent(section.content)}
              </div>

              {/* Points array (for keypoints type sections) */}
              {section.points && section.points.length > 0 && (
                <ul className="space-y-2 mt-4">
                  {section.points.map((point, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-2 text-sm">
                      <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>
                      <span className="text-gray-300 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: applyInline(toText(point)) }} />
                    </li>
                  ))}
                </ul>
              )}

              {/* Code Examples (from examples array) — identical Mac-style blocks */}
              {section.examples && section.examples.length > 0 && (
                <div className="mt-6 space-y-4">
                  {section.examples.map((code, exIdx) => (
                    <div key={exIdx} className="relative group">
                      <div className="absolute top-0 left-0 right-0 h-9 bg-gray-900 rounded-t-xl flex items-center px-4 border-b border-gray-700">
                        <div className="flex gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                        </div>
                        <span className="ml-3 text-xs text-gray-400 font-mono">
                          Example{section.examples.length > 1 ? ` ${exIdx + 1}` : ''}.java
                        </span>
                      </div>
                      <pre className="bg-[#0D1117] pt-12 pb-4 px-4 rounded-xl overflow-x-auto border border-gray-700 shadow-xl">
                        <code className="text-emerald-400 text-sm font-mono leading-relaxed whitespace-pre-wrap">{code}</code>
                      </pre>
                    </div>
                  ))}
                </div>
              )}

              {/* Common Pitfall */}
              {section.commonPitfall && (
                <div className="mt-4 p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-red-400 text-xs font-medium uppercase tracking-wider">Common Pitfall</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{section.commonPitfall}</p>
                </div>
              )}

              {/* Key Takeaway */}
              {section.keyTakeaway && (
                <div className="mt-3 p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                  <span className="text-green-400 text-xs font-semibold">💡 Key Takeaway: </span>
                  <span className="text-gray-300 text-sm">{section.keyTakeaway}</span>
                </div>
              )}
            </div>
          );
          })}
        </div>

        {/* Summary */}
        {summary && (
          <div className="mt-6 p-4 bg-[#6C63FF]/5 rounded-xl border border-[#6C63FF]/20">
            <p className="text-gray-300 text-sm">{summary}</p>
          </div>
        )}

        {/* Quick Check Question */}
        {quickCheck && quickCheck.question && (
          <div className="mt-6 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 rounded-2xl border border-purple-500/30 p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-700/50">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Lightbulb className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Quick Check</h3>
            </div>
            <p className="text-gray-200 mb-4">{quickCheck.question}</p>
            {quickCheck.options && (
              <div className="space-y-2">
                {quickCheck.options.map((option, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-300 text-sm hover:border-purple-500/50 transition-colors cursor-pointer"
                  >
                    <span className="text-purple-400 font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                    {option}
                  </div>
                ))}
              </div>
            )}
            {quickCheck.correctAnswer && (
              <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                <span className="text-green-400 text-sm font-medium">✓ Correct Answer: </span>
                <span className="text-gray-300 text-sm">{quickCheck.correctAnswer}</span>
              </div>
            )}
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
