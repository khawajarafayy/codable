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
    <div className="dark min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
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
