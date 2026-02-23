import { Card } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";

export function TopicMasteryTable({ topicMastery, loading }) {
  if (loading) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Topic Mastery</h2>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-700/50 rounded animate-pulse"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (!topicMastery || topicMastery.length === 0) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Topic Mastery</h2>
        <div className="text-center py-8">
          <p className="text-gray-400">No topic data available yet. Start practicing to see your progress!</p>
        </div>
      </Card>
    );
  }

  const getMasteryColor = (score) => {
    if (score >= 70) return "text-green-400 bg-green-400/10 border-green-400/20";
    if (score >= 40) return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    return "text-red-400 bg-red-400/10 border-red-400/20";
  };

  const getRecommendationIcon = (action) => {
    if (action === 'advance') return <TrendingUp className="h-4 w-4" />;
    if (action === 'review') return <AlertCircle className="h-4 w-4" />;
    return <CheckCircle2 className="h-4 w-4" />;
  };

  return (
    <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Topic Mastery Analysis</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Topic</th>
              <th className="text-center py-3 px-4 text-gray-400 font-medium">Mastery</th>
              <th className="text-center py-3 px-4 text-gray-400 font-medium">First Attempt</th>
              <th className="text-center py-3 px-4 text-gray-400 font-medium">Code Quality</th>
              <th className="text-center py-3 px-4 text-gray-400 font-medium">Retention</th>
              <th className="text-center py-3 px-4 text-gray-400 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {topicMastery.map((topic, index) => (
              <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/30 transition">
                <td className="py-4 px-4">
                  <div>
                    <p className="text-white font-medium">{topic.topic_name}</p>
                    <p className="text-xs text-gray-400 capitalize">{topic.difficulty_unlocked}</p>
                  </div>
                </td>
                <td className="text-center py-4 px-4">
                  <Badge className={`${getMasteryColor(topic.mastery_score)} border font-semibold`}>
                    {topic.mastery_score}%
                  </Badge>
                </td>
                <td className="text-center py-4 px-4 text-gray-300">
                  {topic.first_attempt_success_rate}%
                </td>
                <td className="text-center py-4 px-4 text-gray-300">
                  {topic.code_quality_score}/100
                </td>
                <td className="text-center py-4 px-4">
                  <Badge className={`${getMasteryColor(topic.retention_score)} border`}>
                    {topic.retention_score}%
                  </Badge>
                </td>
                <td className="text-center py-4 px-4">
                  <Badge variant="outline" className="capitalize gap-1">
                    {getRecommendationIcon(topic.recommended_action)}
                    {topic.recommended_action}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
