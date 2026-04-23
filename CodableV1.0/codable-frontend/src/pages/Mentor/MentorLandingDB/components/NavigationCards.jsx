import { Card } from "./ui/card";
import { BookOpen, Target, Bot, Code } from "lucide-react";
import { Button } from "../../../../components/ui/button";

const navigationItems = [
  {
    icon: BookOpen,
    title: "Learn",
    description: "Continue your learning path",
    gradient: "from-blue-500 to-blue-600",
    action: "Continue Learning",
  },
  {
    icon: Target,
    title: "Practice",
    description: "Solve coding challenges",
    gradient: "from-purple-500 to-purple-600",
    action: "Start Practice",
  },
  {
    icon: Bot,
    title: "AI Tutor",
    description: "Get personalized help",
    gradient: "from-green-500 to-green-600",
    action: "Ask AI",
  },
  {
    icon: Code,
    title: "Code Workspace",
    description: "Write and test your code",
    gradient: "from-orange-500 to-orange-600",
    action: "Open Workspace",
  },
];

export function NavigationCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {navigationItems.map((item, index) => (
        <Card
          key={index}
          className="bg-card/50 backdrop-blur-xl border-border/50 p-6 hover:bg-card/60 transition-all group cursor-pointer"
        >
          <div className="space-y-4">
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <item.icon className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-1">
              <h3 className="text-white">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <Button
              variant="ghost"
              className="w-full text-sm text-muted-foreground hover:text-white justify-start px-0"
            >
              {item.action} →
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
