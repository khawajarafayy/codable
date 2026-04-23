import { Card } from "../../../../components/ui/card";
import { CheckCircle2, Trophy, Code2, BookOpen } from "lucide-react";
import { Badge } from "../../../../components/ui/badge";

const activities = [
  {
    icon: CheckCircle2,
    title: "Completed: Arrays & Hashing",
    description: "Finished all 15 problems",
    time: "2 hours ago",
    type: "completed",
  },
  {
    icon: Trophy,
    title: "Achievement Unlocked",
    description: "Earned 'Problem Solver' badge",
    time: "5 hours ago",
    type: "achievement",
  },
  {
    icon: Code2,
    title: "Started: Two Pointers",
    description: "New learning module",
    time: "Yesterday",
    type: "started",
  },
  {
    icon: BookOpen,
    title: "Read: Big O Notation Guide",
    description: "Time complexity tutorial",
    time: "2 days ago",
    type: "read",
  },
];

const typeColors = {
  completed: "from-green-500 to-emerald-500",
  achievement: "from-yellow-500 to-orange-500",
  started: "from-blue-500 to-cyan-500",
  read: "from-purple-500 to-pink-500",
};

export function RecentActivity() {
  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border/50 p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white mb-1">Recent Activity</h3>
            <p className="text-sm text-muted-foreground">Your latest achievements and progress</p>
          </div>
          <Badge variant="secondary" className="bg-secondary/50">
            View All
          </Badge>
        </div>
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent/20 transition-colors"
            >
              <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${typeColors[activity.type]} flex items-center justify-center flex-shrink-0`}>
                <activity.icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white mb-0.5">{activity.title}</p>
                <p className="text-xs text-muted-foreground">{activity.description}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {activity.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
