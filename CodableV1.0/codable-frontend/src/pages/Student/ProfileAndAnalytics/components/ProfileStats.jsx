import { Card } from "../../../../components/ui/card";
import { Clock, CheckCircle2, TrendingUp, Target } from "lucide-react";

const stats = [
  {
    icon: Clock,
    label: "Total Coding Time",
    value: "247",
    unit: "hours",
    trend: "+18% from last month",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: CheckCircle2,
    label: "Completed Tasks",
    value: "156",
    unit: "tasks",
    trend: "89% completion rate",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: TrendingUp,
    label: "Average Score",
    value: "87",
    unit: "%",
    trend: "+5% improvement",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Target,
    label: "Current Streak",
    value: "12",
    unit: "days",
    trend: "Personal best!",
    color: "from-orange-500 to-red-500",
  },
];

export function ProfileStats() {
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
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl text-white">{stat.value}</p>
              <span className="text-sm text-muted-foreground">{stat.unit}</span>
            </div>
            <p className="text-xs text-muted-foreground/70">{stat.trend}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
