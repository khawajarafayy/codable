import { Card } from "../../../../components/ui/card";
import { Flame, Calendar, TrendingUp, Award } from "lucide-react";

const streakData = {
  current: 12,
  longest: 28,
  total: 156,
  thisWeek: 7,
};

const weekActivity = [
  { day: "Mon", active: true, tasks: 3 },
  { day: "Tue", active: true, tasks: 5 },
  { day: "Wed", active: true, tasks: 4 },
  { day: "Thu", active: true, tasks: 6 },
  { day: "Fri", active: true, tasks: 4 },
  { day: "Sat", active: true, tasks: 2 },
  { day: "Sun", active: true, tasks: 3 },
];

export function CodingStreaks() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Streak Stats */}
      <Card className="bg-card/50 backdrop-blur-xl border-border/50 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Flame className="h-5 w-5 text-orange-400" />
          <h3 className="text-white">Coding Streaks</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
            <p className="text-sm text-muted-foreground mb-1">Current Streak</p>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl text-orange-400">{streakData.current}</p>
              <span className="text-sm text-muted-foreground">days</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">🔥 Keep it going!</p>
          </div>
          
          <div className="p-4 rounded-lg bg-accent/20 border border-border/30">
            <p className="text-sm text-muted-foreground mb-1">Longest Streak</p>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl text-white">{streakData.longest}</p>
              <span className="text-sm text-muted-foreground">days</span>
            </div>
            <p className="text-xs text-green-400 mt-1">Personal Best</p>
          </div>
          
          <div className="p-4 rounded-lg bg-accent/20 border border-border/30">
            <p className="text-sm text-muted-foreground mb-1">Total Days</p>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl text-white">{streakData.total}</p>
              <span className="text-sm text-muted-foreground">days</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Since joining</p>
          </div>
          
          <div className="p-4 rounded-lg bg-accent/20 border border-border/30">
            <p className="text-sm text-muted-foreground mb-1">This Week</p>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl text-white">{streakData.thisWeek}</p>
              <span className="text-sm text-muted-foreground">days</span>
            </div>
            <p className="text-xs text-blue-400 mt-1">Perfect week!</p>
          </div>
        </div>
      </Card>

      {/* Weekly Activity */}
      <Card className="bg-card/50 backdrop-blur-xl border-border/50 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="h-5 w-5 text-blue-400" />
          <h3 className="text-white">This Week's Activity</h3>
        </div>
        
        <div className="space-y-3">
          {weekActivity.map((day, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-12">{day.day}</span>
              <div className="flex-1 flex gap-1">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-8 flex-1 rounded ${
                      i < day.tasks
                        ? "bg-gradient-to-r from-blue-500 to-purple-600"
                        : "bg-accent/30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-white w-8">{day.tasks}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <p className="text-sm text-white mb-1">Great consistency!</p>
              <p className="text-xs text-muted-foreground">
                You've completed tasks every day this week. Keep up the momentum!
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
