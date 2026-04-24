import { Card } from "../../../../components/ui/card";
import { TrendingUp, Award, Target, Activity } from "lucide-react";

export function SkillOverview({ skillOverview, loading }) {
  console.log("SkillOverview received skillOverview:", skillOverview);
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-black/40 backdrop-blur-xl border-0 p-6 animate-pulse">
            <div className="h-24 bg-gray-700/50 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (!skillOverview) {
    console.warn("No skillOverview data available");
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-black/40 backdrop-blur-xl border-0 p-6">
            <p className="text-gray-400 text-sm">Loading data...</p>
          </Card>
        ))}
      </div>
    );
  }

  const capitalizeLevel = (level) => {
    if (!level) return "Beginner";
    return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
  };

  const stats = [
    {
      icon: Award,
      label: "Overall Skill Rating",
      value: skillOverview.overall_skill_rating !== undefined ? skillOverview.overall_skill_rating : 0,
      unit: "",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Target,
      label: "Proficiency Level",
      value: capitalizeLevel(skillOverview.proficiency_level),
      unit: "",
      color: "from-blue-500 to-cyan-500",
      isText: true
    },
    {
      icon: Activity,
      label: "Confidence Score",
      value: skillOverview.confidence_score !== undefined ? skillOverview.confidence_score : 0,
      unit: "%",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: TrendingUp,
      label: "Recent Growth Rate",
      value: skillOverview.recent_growth_rate !== undefined ? skillOverview.recent_growth_rate : 0,
      unit: "%",
      color: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="bg-black/40 backdrop-blur-xl border-0 p-6 hover:bg-card/60 transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white">
                {stat.isText ? stat.value : stat.value}
              </span>
              {!stat.isText && <span className="text-lg text-gray-400">{stat.unit}</span>}
            </div>
            <p className="text-sm text-gray-400">{stat.label}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
