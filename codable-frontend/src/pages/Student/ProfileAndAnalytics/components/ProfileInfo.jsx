import { useState } from "react";
import { Card } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Edit2, Github, Linkedin, Twitter, Loader2 } from "lucide-react";
import { Progress } from "../../../../components/ui/progress";
import { EditProfileDialog } from "./EditProfileDialog";

const languages = [
  { name: "Core Java", level: 92, color: "bg-red-500" },
  { name: "Spring Framework", level: 78, color: "bg-green-500" },
  { name: "Hibernate/JPA", level: 72, color: "bg-orange-500" },
  { name: "SQL & JDBC", level: 85, color: "bg-blue-500" },
];

const achievements = [
  { title: "Java Master", description: "Completed 100+ Java challenges", icon: "☕" },
  { title: "OOP Expert", description: "Mastered all OOP principles", icon: "🏆" },
  { title: "Spring Developer", description: "Built 10+ Spring Boot apps", icon: "🌱" },
  { title: "Consistency King", description: "30-day coding streak", icon: "👑" },
];

export function ProfileInfo({ profileData, loading, onProfileUpdate }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
              <Edit2 className="h-4 w-4 mr-2" />
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
          <h3 className="text-white mb-6">Java Skills Proficiency</h3>
          <div className="space-y-5">
            {languages.map((lang, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white">{lang.name}</span>
                  <span className="text-muted-foreground">{lang.level}%</span>
                </div>
                <Progress value={lang.level} className="h-2" />
              </div>
            ))}
          </div>
        </Card>

        {/* Achievements */}
        <Card className="bg-black/40 backdrop-blur-xl border-0  p-6 lg:col-span-2">
          <h3 className="text-white mb-6">Achievements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-accent/20 border border-border/30 hover:bg-accent/30 transition-colors"
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <h4 className="text-white text-sm mb-1">{achievement.title}</h4>
                <p className="text-xs text-muted-foreground">{achievement.description}</p>
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
