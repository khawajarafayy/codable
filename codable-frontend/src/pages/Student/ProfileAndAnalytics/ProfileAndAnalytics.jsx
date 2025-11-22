import { DashboardHeader } from "./components/DashboardHeader";
import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileStats } from "./components/ProfileStats";
import { ProfileInfo } from "./components/ProfileInfo";
import { Performance } from "./components/Performance";
import { WeakAreas } from "./components/WeakAreas";
import { TopicProgress } from "./components/TopicProgress";
import { CodingStreaks } from "./components/CodingStreaks";
import { AchievementBadges } from "./components/AchievementBadges";
import { IdentifiedWeakAreas } from "./components/IdentifiedWeakAreas";
import { TimeMetrics } from "./components/TimeMetrics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Navbar } from "../LandingDashboard/components/Navbar";

export default function ProfileAndAnalytics() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
      ></div>

      <Navbar />
      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto p-6 lg:p-8">
        
        {/* Profile Header */}
        <ProfileHeader />

        {/* Profile Stats */}
        <ProfileStats />

        {/* Tabbed Content */}
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="mb-8 bg-card/50 backdrop-blur-xl border border-border/50">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="profile">Profile Info</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="weak-areas">Weak Areas</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            {/* Time Metrics */}
            <TimeMetrics />
            
            {/* Coding Streaks */}
            <CodingStreaks />
            
            {/* Topic Progress and Identified Weak Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TopicProgress />
              <IdentifiedWeakAreas />
            </div>
            
            {/* Achievement Badges */}
            <AchievementBadges />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileInfo />
          </TabsContent>

          <TabsContent value="performance">
            <Performance />
          </TabsContent>

          <TabsContent value="weak-areas">
            <WeakAreas />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
