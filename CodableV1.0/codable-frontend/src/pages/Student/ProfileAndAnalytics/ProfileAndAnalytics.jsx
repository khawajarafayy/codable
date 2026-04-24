import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { ProfileHeader } from "./components/ProfileHeader";
import { SkillOverview } from "./components/SkillOverview";
import { TopicMasteryTable } from "./components/TopicMasteryTable";
import { ErrorIntelligence } from "./components/ErrorIntelligence";
import { LearningBehavior } from "./components/LearningBehavior";
import { PerformanceTrends } from "./components/PerformanceTrends";
import { AdaptiveRecommendations } from "./components/AdaptiveRecommendations";
import { ProfileInfo } from "./components/ProfileInfo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Navbar } from "../LandingDashboard/components/Navbar";
import { api } from "../../../services/apiClient";
import learningApi from "../../../services/learningApi";
import { useRefresh } from "../../../context/RefreshContext";

export default function ProfileAndAnalytics() {
  const [profileData, setProfileData] = useState(null);
  const [progressData, setProgressData] = useState({ chapters: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { refreshTrigger } = useRefresh();

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    // Auto-refresh when refreshTrigger changes (topic completed elsewhere)
    if (refreshTrigger > 0) {
      console.log('Auto-refreshing metrics due to progress update');
      refreshMetrics();
    }
  }, [refreshTrigger]);

  const refreshMetrics = async () => {
    console.log("Starting metrics refresh...");
    setIsRefreshing(true);
    try {
      await fetchAllData();
      console.log("Metrics refresh completed successfully");
    } catch (err) {
      console.error("Error during metrics refresh:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch both profile and progress data in parallel
      const [profileResponse, progressResponse] = await Promise.all([
        api.getStudentProfile(),
        learningApi.getChaptersProgress().catch(() => ({ chapters: [], stats: {} }))
      ]);

      console.log("Profile Response:", profileResponse);
      console.log("Profile Data received:", profileResponse.user_profile);
      
      if (profileResponse && (profileResponse.success || profileResponse.user_profile)) {
        const userData = profileResponse.user_profile;
        console.log("Setting profileData with error_profile:", userData?.error_profile);
        setProfileData(userData);
      } else {
        setError("Failed to load profile data");
        console.error("Unexpected response structure:", profileResponse);
      }

      if (progressResponse.success && progressResponse.chapters) {
        setProgressData({
          chapters: progressResponse.chapters,
          stats: progressResponse.stats || {}
        });
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = (updatedData) => {
    setProfileData((prev) => ({
      ...prev,
      basic_info: { ...prev.basic_info, ...updatedData }
    }));
  };

  // Helper to get initials for avatar
  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Transform data for ProfileHeader compatibility
  const headerData = profileData ? {
    fullName: profileData.basic_info?.full_name,
    email: profileData.basic_info?.email,
    joinDate: profileData.basic_info?.join_date,
    membershipTier: profileData.basic_info?.membership_tier,
    bio: profileData.basic_info?.bio,
    location: profileData.basic_info?.location,
    fullLocation: profileData.basic_info?.location 
      ? [profileData.basic_info.location.city, profileData.basic_info.location.country]
          .filter(Boolean).join(', ') || 'Not specified'
      : 'Not specified',
    initials: getInitials(profileData.basic_info?.full_name)
  } : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]"></div>

      <Navbar />
      
      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto p-6 lg:p-8">
        
        {/* Refresh Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={refreshMetrics}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600/80 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Metrics'}
          </button>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Profile Header */}
        <ProfileHeader profileData={headerData} />

        {/* Skill Overview Cards */}
        <SkillOverview 
          skillOverview={profileData?.skill_overview} 
          loading={loading}
          key={`skill-${refreshTrigger}-${profileData?.skill_overview?.overall_skill_rating}`}
        />

        {/* Tabbed Content */}
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="mb-8 bg-black/50 backdrop-blur-xl border-0">
            <TabsTrigger 
              value="analytics"
              className="data-[state=active]:bg-gray-700/80 data-[state=active]:text-white rounded-xl transition-all"
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="profile"
              className="data-[state=active]:bg-gray-700/80 data-[state=active]:text-white rounded-xl transition-all"
            >
              Profile Info
            </TabsTrigger>
            <TabsTrigger 
              value="mastery"
              className="data-[state=active]:bg-gray-700/80 data-[state=active]:text-white rounded-xl transition-all"
            >
              Topic Mastery
            </TabsTrigger>
            <TabsTrigger 
              value="behavior"
              className="data-[state=active]:bg-gray-700/80 data-[state=active]:text-white rounded-xl transition-all"
            >
              Learning Behavior
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            {/* Performance Trends */}
            <PerformanceTrends trendsData={profileData?.performance_trends} loading={loading} key={`trends-${refreshTrigger}`} />
            
            {/* Error Intelligence and Adaptive Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ErrorIntelligence errorProfile={profileData?.error_profile} loading={loading} key={`error-${refreshTrigger}-${profileData?.error_profile?.syntax_error_rate}`} />
              <AdaptiveRecommendations recommendations={profileData?.adaptive_recommendations} loading={loading} key={`adaptive-${refreshTrigger}`} />
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <ProfileInfo 
              profileData={headerData} 
              progressData={progressData}
              loading={loading}
              onProfileUpdate={handleProfileUpdate}
            />
          </TabsContent>

          <TabsContent value="mastery">
            <TopicMasteryTable topicMastery={profileData?.topic_mastery} loading={loading} />
          </TabsContent>

          <TabsContent value="behavior">
            <LearningBehavior behaviorData={profileData?.learning_behavior} loading={loading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
