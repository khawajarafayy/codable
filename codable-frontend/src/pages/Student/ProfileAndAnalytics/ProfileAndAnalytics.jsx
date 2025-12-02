import { useState, useEffect } from "react";
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
import { api } from "../../../services/apiClient";

export default function ProfileAndAnalytics() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const response = await api.getStudentProfile();
      if (response.success) {
        setProfileData(response.data);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = (updatedData) => {
    setProfileData((prev) => ({ ...prev, ...updatedData }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
      ></div>

      <Navbar />
      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto p-6 lg:p-8">
        
        {/* Profile Header */}
        <ProfileHeader profileData={profileData} />

        {/* Profile Stats */}
        <ProfileStats />

        {/* Tabbed Content */}
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="mb-8 bg-black/50 backdrop-blur-xl border-0">
            <TabsTrigger value="analytics"
            className="data-[state=active]:bg-gray-700/80 data-[state=active]:text-white rounded-xl transition-all">Analytics</TabsTrigger>
            <TabsTrigger value="profile"
            className="data-[state=active]:bg-gray-700/80 data-[state=active]:text-white rounded-xl transition-all"
            >Profile Info</TabsTrigger>
            <TabsTrigger value="performance"
            className="data-[state=active]:bg-gray-700/80 data-[state=active]:text-white rounded-xl transition-all"
            >Performance</TabsTrigger>
            <TabsTrigger value="weak-areas"
            className="data-[state=active]:bg-gray-700/80 data-[state=active]:text-white rounded-xl transition-all"
            >Weak Areas</TabsTrigger>
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
            <ProfileInfo 
              profileData={profileData} 
              loading={loading}
              onProfileUpdate={handleProfileUpdate}
            />
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
