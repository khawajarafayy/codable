import { Avatar, AvatarFallback } from "../../../../components/ui/avatar";
import { Badge } from "../../../../components/ui/badge";
import { Calendar, Mail, MapPin, Award } from "lucide-react";

export function ProfileHeader({ profileData }) {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  };

  const getMembershipBadge = (tier) => {
    const badges = {
      free: { label: "Free Member", gradient: "from-gray-500 to-gray-600" },
      pro: { label: "Pro Member", gradient: "from-blue-500 to-purple-600" },
      premium: { label: "Premium Member", gradient: "from-yellow-500 to-orange-600" },
    };
    return badges[tier] || badges.free;
  };

  const membershipInfo = getMembershipBadge(profileData?.membershipTier);

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-8">
      <Avatar className="h-24 w-24 border-0">
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl">
          {profileData?.initials || "U"}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-white text-3xl">{profileData?.fullName || "User"}</h1>
          <Badge className={`bg-gradient-to-r ${membershipInfo.gradient} text-white border-0`}>
            <Award className="h-3 w-3 mr-1" />
            {membershipInfo.label}
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Joined {formatDate(profileData?.joinDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>{profileData?.email || "Not available"}</span>
          </div>
          {profileData?.fullLocation && profileData.fullLocation !== "Not specified" && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{profileData.fullLocation}</span>
            </div>
          )}
        </div>
        
        {profileData?.bio && (
          <p className="text-muted-foreground max-w-2xl">
            {profileData.bio}
          </p>
        )}
      </div>
    </div>
  );
}
