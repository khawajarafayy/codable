import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Calendar, Mail, MapPin, Award } from "lucide-react";

export function ProfileHeader() {
  return (
    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-8">
      <Avatar className="h-24 w-24 border-4 border-border/50">
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl">
          R
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-white text-3xl">Khawaja Rafay</h1>
          <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
            <Award className="h-3 w-3 mr-1" />
            Pro Member
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Joined March 2024</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>rafay.khawaja@email.com</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>San Francisco, CA</span>
          </div>
        </div>
        
        <p className="text-muted-foreground max-w-2xl">
          Java developer passionate about building enterprise applications. Currently focusing on mastering Core Java, Spring Framework, and advanced OOP concepts.
        </p>
      </div>
    </div>
  );
}
