import { Card } from "../../../../components/ui/card";
import { Brain, Lightbulb, Target, TrendingUp } from "lucide-react";

export function LearningBehavior({ behaviorData, loading }) {
  if (loading) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Learning Behavior</h2>
        <div className="space-y-4 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-700/50 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (!behaviorData) return null;

  const metrics = [
    {
      icon: Target,
      label: "Average Attempts per Problem",
      value: behaviorData.avg_attempts_per_problem || 0,
      color: "from-blue-500 to-cyan-500",
      interpretation: behaviorData.avg_attempts_per_problem < 2 
        ? "Excellent problem-solving" 
        : behaviorData.avg_attempts_per_problem < 3 
        ? "Good performance" 
        : "Needs improvement"
    },
    {
      icon: Lightbulb,
      label: "Hint Dependency Ratio",
      value: `${behaviorData.hint_dependency_ratio || 0}%`,
      color: "from-yellow-500 to-orange-500",
      interpretation: behaviorData.hint_dependency_ratio < 20 
        ? "Independent learner" 
        : behaviorData.hint_dependency_ratio < 40 
        ? "Moderate dependency" 
        : "High dependency"
    },
    {
      icon: Brain,
      label: "Problem Solving Persistence",
      value: `${behaviorData.problem_solving_persistence_score || 0}`,
      color: "from-purple-500 to-pink-500",
      interpretation: behaviorData.problem_solving_persistence_score >= 70 
        ? "Highly persistent" 
        : behaviorData.problem_solving_persistence_score >= 40 
        ? "Moderately persistent" 
        : "Needs encouragement"
    },
    {
      icon: TrendingUp,
      label: "Consistency Score",
      value: `${behaviorData.consistency_score || 0}%`,
      color: "from-green-500 to-emerald-500",
      interpretation: behaviorData.consistency_score >= 70 
        ? "Very consistent" 
        : behaviorData.consistency_score >= 40 
        ? "Fairly consistent" 
        : "Irregular practice"
    },
  ];

  return (
    <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Learning Behavior Insights</h2>
      
      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-gray-800/40 hover:bg-gray-800/60 transition">
            <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${metric.color} flex items-center justify-center flex-shrink-0`}>
              <metric.icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-gray-400 text-sm mb-1">{metric.label}</p>
              <p className="text-white text-2xl font-bold mb-1">{metric.value}</p>
              <p className="text-gray-500 text-xs">{metric.interpretation}</p>
            </div>
          </div>
        ))}
        
        <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
          <p className="text-sm text-gray-300">
            <span className="font-semibold text-white">Improvement Velocity: </span>
            <span className="capitalize">{behaviorData.improvement_velocity || 'stable'}</span>
          </p>
        </div>
      </div>
    </Card>
  );
}
