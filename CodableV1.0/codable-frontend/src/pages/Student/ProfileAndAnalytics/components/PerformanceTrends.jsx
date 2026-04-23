import { Card } from "../../../../components/ui/card";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";

export function PerformanceTrends({ trendsData, loading }) {
  if (loading) {
    return (
      <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Performance Trends</h2>
        <div className="space-y-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-700/50 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (!trendsData) return null;

  const getTrendIcon = (trend) => {
    if (trend === 'improving') return <TrendingUp className="h-5 w-5 text-green-400" />;
    if (trend === 'declining') return <TrendingDown className="h-5 w-5 text-red-400" />;
    return <Minus className="h-5 w-5 text-gray-400" />;
  };

  const getTrendColor = (trend) => {
    if (trend === 'improving') return 'text-green-400';
    if (trend === 'declining') return 'text-red-400';
    return 'text-gray-400';
  };

  const metrics = [
    {
      label: "Last 7 Days Average",
      value: `${trendsData.last_7_days_avg_score || 0}%`,
      color: "from-blue-500 to-cyan-500"
    },
    {
      label: "Last 30 Days Average",
      value: `${trendsData.last_30_days_avg_score || 0}%`,
      color: "from-purple-500 to-pink-500"
    },
    {
      label: "Performance Stability",
      value: `${trendsData.performance_stability_index || 0}%`,
      color: "from-green-500 to-emerald-500"
    }
  ];

  return (
    <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Performance Trends</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <div key={index} className="p-4 rounded-lg bg-gray-800/40">
            <p className="text-gray-400 text-sm mb-2">{metric.label}</p>
            <div className={`text-3xl font-bold bg-gradient-to-r ${metric.color} bg-clip-text text-transparent`}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      <div className="p-5 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-800/30 border border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-gray-700/50 flex items-center justify-center">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Overall Growth Trend</p>
              <div className="flex items-center gap-2 mt-1">
                {getTrendIcon(trendsData.growth_trend)}
                <span className={`text-xl font-bold capitalize ${getTrendColor(trendsData.growth_trend)}`}>
                  {trendsData.growth_trend || 'stable'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
