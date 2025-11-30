import { Card } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { Trophy, Award, Target, Zap, Star, Code, Coffee, Rocket } from "lucide-react";

const achievements = [
  {
    icon: Coffee,
    title: "Java Fundamentals Master",
    description: "Completed all Core Java basics",
    date: "Unlocked 2 days ago",
    rarity: "gold",
    color: "from-yellow-500 to-orange-500"
  },
  {
    icon: Trophy,
    title: "100 Problems Solved",
    description: "Solved 100+ coding challenges",
    date: "Unlocked 1 week ago",
    rarity: "gold",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Zap,
    title: "Speed Demon",
    description: "Solved 10 problems under 5 minutes",
    date: "Unlocked 3 days ago",
    rarity: "silver",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Rocket,
    title: "28-Day Streak",
    description: "Maintained longest coding streak",
    date: "Unlocked 1 month ago",
    rarity: "gold",
    color: "from-orange-500 to-red-500"
  },
  {
    icon: Star,
    title: "OOP Expert",
    description: "Mastered all OOP concepts",
    date: "Unlocked 5 days ago",
    rarity: "silver",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: Target,
    title: "Perfect Score",
    description: "Got 100% on 5 assessments",
    date: "Unlocked 1 week ago",
    rarity: "silver",
    color: "from-indigo-500 to-purple-500"
  },
  {
    icon: Code,
    title: "Collections Pro",
    description: "Completed all Collections Framework tasks",
    date: "Unlocked 4 days ago",
    rarity: "bronze",
    color: "from-amber-600 to-orange-600"
  },
  {
    icon: Award,
    title: "Early Bird",
    description: "Coded before 8 AM for 7 days",
    date: "Unlocked 2 weeks ago",
    rarity: "bronze",
    color: "from-sky-500 to-blue-500"
  }
];

const getRarityBadge = (rarity) => {
  switch (rarity) {
    case "gold":
      return (
        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 text-xs">
          Gold
        </Badge>
      );
    case "silver":
      return (
        <Badge className="bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0 text-xs">
          Silver
        </Badge>
      );
    case "bronze":
      return (
        <Badge className="bg-gradient-to-r from-amber-600 to-orange-700 text-white border-0 text-xs">
          Bronze
        </Badge>
      );
    default:
      return null;
  }
};

export function AchievementBadges() {
  return (
    <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white mb-1">Achievement Badges</h3>
          <p className="text-sm text-muted-foreground">8 of 25 badges unlocked</p>
        </div>
        <Badge variant="secondary" className="bg-secondary/50">
          View All
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {achievements.map((achievement, index) => {
          const Icon = achievement.icon;
          return (
            <div
              key={index}
              className="p-4 rounded-xl bg-accent/10 border border-border/30 hover:bg-accent/20 transition-all hover:scale-105"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`h-12 w-12 rounded-xl bg-gradient-to-br ${achievement.color} flex items-center justify-center`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                {getRarityBadge(achievement.rarity)}
              </div>

              <h4 className="text-white text-sm mb-1">{achievement.title}</h4>
              <p className="text-xs text-muted-foreground mb-2">
                {achievement.description}
              </p>
              <p className="text-xs text-muted-foreground/70">
                {achievement.date}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
