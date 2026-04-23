import { useState, useMemo } from "react";
import { Card } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Edit2, Github, Linkedin, Twitter, Loader2 } from "lucide-react";
import { EditProfileDialog } from "./EditProfileDialog";

// Chapter names for skills display
const CHAPTER_SKILL_NAMES = {
  1: "Java Fundamentals",
  2: "Variables & Data Types",
  3: "Operators & Expressions",
  4: "Control Flow",
  5: "Loops & Iteration",
  6: "Methods & Functions",
  7: "Arrays",
  8: "Object-Oriented Programming",
  9: "Classes & Objects",
  10: "Exception Handling",
  11: "File I/O",
  12: "Collections Framework"
};

// Total topics per chapter (for calculating skill level)
const CHAPTER_TOTAL_TOPICS = {
  1: 10, 2: 16, 3: 11, 4: 5, 5: 8, 6: 8, 7: 8, 8: 5, 9: 9, 10: 8, 11: 6, 12: 8
};

// Color palette for skill bars
const SKILL_COLORS = [
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-purple-500",
  "bg-cyan-500"
];

// Generate dynamic achievements based on progress
const generateAchievements = (stats, chapters) => {
  const achievements = [];
  const completedChapters = chapters?.filter(c => c.status === 'completed').length || 0;
  const totalTopicsCompleted = stats?.totalTopicsCompleted || 0;
  const currentStreak = stats?.currentStreak || 0;
  const longestStreak = stats?.longestStreak || 0;
  const totalTimeHours = (stats?.totalTimeSpent || 0) / 3600;

  // First Steps
  if (totalTopicsCompleted >= 1) {
    achievements.push({
      title: "First Steps",
      description: "Completed your first topic",
      icon: "🎯",
      earned: true
    });
  }

  // Chapter Champion
  if (completedChapters >= 1) {
    achievements.push({
      title: "Chapter Champion",
      description: `Completed ${completedChapters} chapter${completedChapters > 1 ? 's' : ''}`,
      icon: "📚",
      earned: true
    });
  }

  // Topic Explorer
  if (totalTopicsCompleted >= 10) {
    achievements.push({
      title: "Topic Explorer",
      description: "Completed 10+ topics",
      icon: "🔍",
      earned: true
    });
  }

  // Dedicated Learner
  if (totalTimeHours >= 5) {
    achievements.push({
      title: "Dedicated Learner",
      description: `${Math.floor(totalTimeHours)}+ hours of learning`,
      icon: "⏰",
      earned: true
    });
  }

  // Streak achievements
  if (currentStreak >= 3) {
    achievements.push({
      title: "On Fire",
      description: `${currentStreak} day streak!`,
      icon: "🔥",
      earned: true
    });
  }

  if (currentStreak >= 7) {
    achievements.push({
      title: "Week Warrior",
      description: "7+ day learning streak",
      icon: "⚡",
      earned: true
    });
  }

  // Java Master - completed many topics
  if (totalTopicsCompleted >= 25) {
    achievements.push({
      title: "Java Apprentice",
      description: "Completed 25+ topics",
      icon: "☕",
      earned: true
    });
  }

  // If no achievements earned yet, show upcoming ones
  if (achievements.length === 0) {
    achievements.push(
      { title: "First Steps", description: "Complete your first topic", icon: "🎯", earned: false },
      { title: "Chapter Champion", description: "Complete a chapter", icon: "📚", earned: false },
      { title: "On Fire", description: "Maintain a 3-day streak", icon: "🔥", earned: false },
      { title: "Topic Explorer", description: "Complete 10 topics", icon: "🔍", earned: false }
    );
  }

  return achievements.slice(0, 4); // Show max 4 achievements
};

// Generate dynamic skills based on chapter progress
const generateSkills = (chapters) => {
  if (!chapters || chapters.length === 0) {
    return [
      { name: "Java Fundamentals", level: 0, color: "bg-red-500" },
      { name: "Variables & Data Types", level: 0, color: "bg-blue-500" },
      { name: "Control Flow", level: 0, color: "bg-green-500" },
      { name: "Object-Oriented Programming", level: 0, color: "bg-orange-500" }
    ];
  }

  // Filter chapters that have some progress and sort by progress
  const chaptersWithProgress = chapters
    .filter(ch => ch.status !== 'locked')
    .map(ch => {
      const totalTopics = CHAPTER_TOTAL_TOPICS[ch.chapterId] || 10;
      const completedTopics = ch.completedTopics || 0;
      const level = Math.round((completedTopics / totalTopics) * 100);
      return {
        name: CHAPTER_SKILL_NAMES[ch.chapterId] || `Chapter ${ch.chapterId}`,
        level: Math.min(level, 100),
        color: SKILL_COLORS[(ch.chapterId - 1) % SKILL_COLORS.length],
        chapterId: ch.chapterId
      };
    })
    .sort((a, b) => b.level - a.level); // Sort by progress level descending

  // Return top 4 skills
  return chaptersWithProgress.slice(0, 4);
};

export function ProfileInfo({ profileData, progressData = { chapters: [], stats: {} }, loading, onProfileUpdate }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Generate dynamic skills and achievements
  const skills = useMemo(() => generateSkills(progressData.chapters), [progressData.chapters]);
  const achievements = useMemo(() => generateAchievements(progressData.stats, progressData.chapters), [progressData.stats, progressData.chapters]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white">Personal Information</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-white"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit2 className="h-4 w-4 mr-2 cursor-pointer" />
              Edit
            </Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Full Name</p>
              <p className="text-white">{profileData?.fullName || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              <p className="text-white">{profileData?.email || "Not available"}</p>
            </div>
            {profileData?.bio && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Bio</p>
                <p className="text-white text-sm">{profileData.bio}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Location</p>
              <p className="text-white">{profileData?.fullLocation || "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Member Since</p>
              <p className="text-white">{formatDate(profileData?.joinDate)}</p>
            </div>
            
            <div className="pt-4">
              <p className="text-sm text-muted-foreground mb-3">Social Links</p>
              <div className="flex gap-2">
                {profileData?.socialLinks?.github ? (
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-card/50 border-border/50"
                    onClick={() => window.open(profileData.socialLinks.github, "_blank")}
                  >
                    <Github className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="outline" size="icon" className="bg-card/50 border-border/50 opacity-50" disabled>
                    <Github className="h-4 w-4" />
                  </Button>
                )}
                {profileData?.socialLinks?.linkedin ? (
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-card/50 border-border/50"
                    onClick={() => window.open(profileData.socialLinks.linkedin, "_blank")}
                  >
                    <Linkedin className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="outline" size="icon" className="bg-card/50 border-border/50 opacity-50" disabled>
                    <Linkedin className="h-4 w-4" />
                  </Button>
                )}
                {profileData?.socialLinks?.twitter ? (
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-card/50 border-border/50"
                    onClick={() => window.open(profileData.socialLinks.twitter, "_blank")}
                  >
                    <Twitter className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="outline" size="icon" className="bg-card/50 border-border/50 opacity-50" disabled>
                    <Twitter className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Java Skills Proficiency */}
        <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
          <h3 className="text-white mb-6">Learning Progress</h3>
          <div className="space-y-5">
            {skills.length > 0 ? (
              skills.map((skill, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white">{skill.name}</span>
                    <span className="text-muted-foreground">{skill.level}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div 
                      className={`${skill.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Start learning to track your progress!
              </p>
            )}
          </div>
        </Card>

        {/* Achievements */}
        <Card className="bg-black/40 backdrop-blur-xl border-0  p-6 lg:col-span-2">
          <h3 className="text-white mb-6">Achievements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border transition-colors ${
                  achievement.earned 
                    ? 'bg-accent/20 border-border/30 hover:bg-accent/30' 
                    : 'bg-gray-900/30 border-gray-700/30 opacity-60'
                }`}
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <h4 className="text-white text-sm mb-1">{achievement.title}</h4>
                <p className="text-xs text-muted-foreground">{achievement.description}</p>
                {!achievement.earned && (
                  <span className="text-xs text-gray-500 mt-2 inline-block">🔒 Locked</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        profileData={profileData}
        onProfileUpdate={onProfileUpdate}
      />
    </>
  );
}
