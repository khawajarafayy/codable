import { Code2, Bell, User } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Avatar, AvatarFallback } from "../../../../components/ui/avatar";

export function DashboardHeader() {
  return (
    <header className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Code2 className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-white text-2xl">Codable</h1>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-white">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-blue-500 rounded-full"></span>
        </Button>
        <Avatar className="h-9 w-9 border-2 border-border/50">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            R
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
