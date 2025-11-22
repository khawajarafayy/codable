import { Card } from "../../../../components/ui/card";
import { Clock, Timer, Zap, TrendingUp } from "lucide-react";

const timeStats = [
  {
    icon: Clock,
    label: "Average Time Per Task",
    value: "18.5",
    unit: "minutes",
    trend: "-12% faster",
    trendPositive: true,
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Timer,
    label: "Total Coding Time",
    value: "247",
    unit: "hours",
    trend: "+18% this month",
    trendPositive: true,
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Zap,
    label: "Fastest Solve Time",
    value: "4.2",
    unit: "minutes",
    trend: "Personal best!",
    trendPositive: true,
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: TrendingUp,
    label: "Efficiency Score",
    value: "8.4",
    unit: "/ 10",
    trend: "+0.3 from last week",
    trendPositive: true,
    color: "from-orange-500 to-red-500",
  },
];

const timeBreakdown = [
  { category: "Easy Tasks", avgTime: "8 min", count: 45, color: "bg-green-500" },
  { category: "Medium Tasks", avgTime: "18 min", count: 82, color: "bg-yellow-500" },
  { category: "Hard Tasks", avgTime: "32 min", count: 29, color: "bg-red-500" },
];

export function TimeMetrics() {
  return (
    <div className="space-y-6">
      {/* Time Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {timeStats.map((stat, index) => (
          <Card
            key={index}
            className="bg-card/50 backdrop-blur-xl border-border/50 p-6 hover:bg-card/60 transition-all"
          >
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-1 mb-2">
              <p className="text-3xl text-white">{stat.value}</p>
              <span className="text-sm text-muted-foreground">{stat.unit}</span>
            </div>
            <p className={`text-xs ${stat.trendPositive ? 'text-green-400' : 'text-red-400'}`}>
              {stat.trend}
            </p>
          </Card>
        ))}
      </div>

      {/* Time Breakdown */}
      <Card className="bg-card/50 backdrop-blur-xl border-border/50 p-6">
        <h3 className="text-white mb-6">Time Breakdown by Difficulty</h3>
        <div className="space-y-4">
          {timeBreakdown.map((item, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className={`h-3 w-3 rounded-full ${item.color}`}></div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white">{item.category}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{item.count} tasks</span>
                    <span className="text-sm text-white">{item.avgTime}</span>
                  </div>
                </div>
                <div className="h-2 bg-accent/30 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color}`}
                    style={{ width: `${(item.count / 156) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
