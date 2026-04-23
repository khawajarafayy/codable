import { Card } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { BookOpen, Code, Video, ArrowRight } from "lucide-react";

export function AdaptiveRecommendations({ recommendations, loading }) {
  if (loading) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Adaptive Recommendations</h2>
        <div className="space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-700/50 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Adaptive Recommendations</h2>
        <div className="text-center py-8">
          <p className="text-gray-400">Great work! Keep practicing to get personalized recommendations.</p>
        </div>
      </Card>
    );
  }

  const getContentIcon = (type) => {
    switch(type) {
      case 'tutorial': return <BookOpen className="h-5 w-5" />;
      case 'practice': return <Code className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      default: return <Code className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (score) => {
    if (score >= 70) return "from-red-500 to-orange-500";
    if (score >= 50) return "from-orange-500 to-yellow-500";
    return "from-yellow-500 to-green-500";
  };

  return (
    <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
      <h2 className="text-2xl font-bold text-white mb-6">🎯 Adaptive Recommendations</h2>
      
      <div className="space-y-4">
        {recommendations.slice(0, 3).map((rec, index) => (
          <div 
            key={index}
            className="p-5 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-800/30 border border-gray-700/50 hover:border-gray-600/50 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${getPriorityColor(rec.priority_score)} flex items-center justify-center`}>
                  {getContentIcon(rec.recommended_content_type)}
                </div>
                <div>
                  <h3 className="text-white font-semibold group-hover:text-purple-400 transition">
                    {rec.topic_name}
                  </h3>
                  <p className="text-xs text-gray-400 capitalize">
                    {rec.recommended_content_type} · Priority: {rec.priority_score}
                  </p>
                </div>
              </div>
              
              <ArrowRight className="h-5 w-5 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
            
            <p className="text-sm text-gray-400 mb-3">{rec.reason}</p>
            
            <Badge variant="outline" className="text-xs">
              Recommended for you
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
