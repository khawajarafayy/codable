import { Card } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { BookOpen, BarChart3, MessageSquareText } from "lucide-react";

export function ChapterMasteryTable({ chapterMastery, loading }) {
  if (loading) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Chapter Mastery</h2>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-700/50 rounded animate-pulse"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (!chapterMastery || chapterMastery.length === 0) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Chapter Mastery</h2>
        <div className="text-center py-8">
          <p className="text-gray-400">
            No chapter-practice data available yet. Complete chapter practice tasks to see your progress.
          </p>
        </div>
      </Card>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 70) return "text-green-400 bg-green-400/10 border-green-400/20";
    if (score >= 40) return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    return "text-red-400 bg-red-400/10 border-red-400/20";
  };

  return (
    <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Chapter Mastery Analysis</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Chapter</th>
              <th className="text-center py-3 px-4 text-gray-400 font-medium">Questions</th>
              <th className="text-center py-3 px-4 text-gray-400 font-medium">Total Attempts</th>
              <th className="text-center py-3 px-4 text-gray-400 font-medium">Avg Attempts / Question</th>
              <th className="text-center py-3 px-4 text-gray-400 font-medium">Avg Score</th>
              <th className="text-center py-3 px-4 text-gray-400 font-medium">Success Rate</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Feedback Signals</th>
            </tr>
          </thead>
          <tbody>
            {chapterMastery.map((chapter, index) => (
              <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/30 transition">
                <td className="py-4 px-4">
                  <div className="flex items-start gap-2">
                    <BookOpen className="h-4 w-4 text-blue-300 mt-1" />
                    <div>
                      <p className="text-white font-medium">{chapter.chapter_name}</p>
                      <p className="text-xs text-gray-400">Chapter {chapter.chapter_id}</p>
                    </div>
                  </div>
                </td>
                <td className="text-center py-4 px-4 text-gray-300">
                  {chapter.total_questions}
                </td>
                <td className="text-center py-4 px-4 text-gray-300">
                  {chapter.total_attempts}
                </td>
                <td className="text-center py-4 px-4 text-gray-300">
                  {chapter.avg_attempts_per_question}
                </td>
                <td className="text-center py-4 px-4">
                  <Badge className={`${getScoreColor(chapter.avg_score)} border font-semibold`}>
                    <BarChart3 className="h-3 w-3 mr-1" />
                    {chapter.avg_score}%
                  </Badge>
                </td>
                <td className="text-center py-4 px-4">
                  <Badge className={`${getScoreColor(chapter.success_rate)} border`}>
                    {chapter.success_rate}%
                  </Badge>
                </td>
                <td className="py-4 px-4 text-gray-300 text-sm">
                  {chapter.most_common_feedback?.length > 0 ? (
                    <div className="space-y-1">
                      {chapter.most_common_feedback.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <MessageSquareText className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-gray-300 truncate max-w-[260px]" title={item.message}>
                            {item.message}
                          </span>
                          <Badge variant="outline" className="text-xs border-gray-600">
                            {item.count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-500">No feedback yet</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
