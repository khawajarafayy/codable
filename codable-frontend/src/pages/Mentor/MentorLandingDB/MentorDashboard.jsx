import { useState } from "react";
import { ClassCreation } from "./components/ClassCreation";
import { InstructorDashboard } from "./components/InstructorDashboard";
import { InstructorSidebar } from "./components/InstructorSidebar";
import { Bell, GraduationCap, Coffee } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { Badge } from "../../../components/ui/badge";

export default function MentorDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const getPageTitle = () => {
    switch (activeTab) {
      case "dashboard":
        return { title: "Dashboard Overview", subtitle: "Monitor your classes and student performance" };
      case "classes":
        return { title: "Class Management", subtitle: "Create and manage your Java classes" };
      case "assignments":
        return { title: "Assignments", subtitle: "Manage tasks and track submissions" };
      case "reports":
        return { title: "Reports & Analytics", subtitle: "Detailed insights and performance reports" };
      default:
        return { title: "Dashboard", subtitle: "" };
    }
  };

  const pageInfo = getPageTitle();

  return (
    <div className="dark min-h-screen flex bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
      ></div>

      {/* Sidebar */}
      <InstructorSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          {/* Header */}
          <header className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-white text-3xl mb-1">{pageInfo.title}</h1>
              <p className="text-muted-foreground">{pageInfo.subtitle}</p>
            </div>

            <div className="flex items-center gap-3">
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 border">
                <Coffee className="h-3 w-3 mr-1" />
                Java
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 border">
                <GraduationCap className="h-3 w-3 mr-1" />
                Instructor
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-muted-foreground hover:text-white"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-orange-500 rounded-full"></span>
              </Button>
              <Avatar className="h-9 w-9 border-2 border-border/50">
                <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                  I
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* Dynamic Content Based on Active Tab */}
          {activeTab === "dashboard" && <InstructorDashboard />}
          {activeTab === "classes" && <ClassCreation />}
          {activeTab === "assignments" && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Assignments module coming soon...</p>
            </div>
          )}
          {activeTab === "reports" && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Reports module coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
