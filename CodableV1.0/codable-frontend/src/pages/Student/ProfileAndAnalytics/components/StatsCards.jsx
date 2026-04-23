import { Card } from "../../../../components/ui/card";
import { Clock, BookOpen, Flame } from "lucide-react";

const stats = [
  {
    icon: Clock,
    label: "Hours Coding",
    value: "47.5",
    trend: "+12% this week",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: BookOpen,
    label: "Lessons Completed",
    value: "23",
    trend: "5 this week",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Flame,
    label: "Day Streak",
    value: "12",
    trend: "Keep it up!",
    color: "from-orange-500 to-red-500",
  },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="bg-black/40 backdrop-blur-xl border-0 p-6 hover:bg-card/60 transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-3xl text-white">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.trend}</p>
            </div>
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
