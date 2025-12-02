import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../../components/ui/dialog";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import { api } from "../../../../services/apiClient";
import { Loader2 } from "lucide-react";

export function EditProfileDialog({ open, onOpenChange, profileData, onProfileUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    bio: "",
    city: "",
    country: "",
    github: "",
    linkedin: "",
    twitter: "",
  });

  // Initialize form data when dialog opens or profileData changes
  useEffect(() => {
    if (profileData) {
      setFormData({
        fullName: profileData.fullName || "",
        bio: profileData.bio || "",
        city: profileData.location?.city || "",
        country: profileData.location?.country || "",
        github: profileData.socialLinks?.github || "",
        linkedin: profileData.socialLinks?.linkedin || "",
        twitter: profileData.socialLinks?.twitter || "",
      });
    }
  }, [profileData, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Prepare the data in the format expected by the backend
      const updateData = {
        fullName: formData.fullName,
        bio: formData.bio,
        location: {
          city: formData.city,
          country: formData.country,
        },
        socialLinks: {
          github: formData.github,
          linkedin: formData.linkedin,
          twitter: formData.twitter,
        },
      };

      const response = await api.updateStudentProfile(updateData);

      if (response.success) {
        // Call the callback to refresh profile data
        if (onProfileUpdate) {
          onProfileUpdate(response.data);
        }
        onOpenChange(false);
      }
    } catch (err) {
      setError(err.payload?.message || err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0F1419] border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Edit Profile</DialogTitle>
          <DialogDescription className="text-gray-400">
            Update your personal information and social links
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* Full Name */}
            <div className="grid gap-2">
              <Label htmlFor="fullName" className="text-gray-300">
                Full Name
              </Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="bg-[#1b1e2d] border-gray-700 text-white focus:border-cyan-500"
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Bio */}
            <div className="grid gap-2">
              <Label htmlFor="bio" className="text-gray-300">
                Bio
              </Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="bg-[#1b1e2d] border-gray-700 text-white focus:border-cyan-500 min-h-[100px]"
                placeholder="Tell us about yourself..."
                maxLength={500}
              />
              <p className="text-xs text-gray-500">
                {formData.bio.length}/500 characters
              </p>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city" className="text-gray-300">
                  City
                </Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="bg-[#1b1e2d] border-gray-700 text-white focus:border-cyan-500"
                  placeholder="San Francisco"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="country" className="text-gray-300">
                  Country
                </Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="bg-[#1b1e2d] border-gray-700 text-white focus:border-cyan-500"
                  placeholder="United States"
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-300">Social Links</h4>

              <div className="grid gap-2">
                <Label htmlFor="github" className="text-gray-400 text-sm">
                  GitHub
                </Label>
                <Input
                  id="github"
                  name="github"
                  value={formData.github}
                  onChange={handleChange}
                  className="bg-[#1b1e2d] border-gray-700 text-white focus:border-cyan-500"
                  placeholder="https://github.com/username"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="linkedin" className="text-gray-400 text-sm">
                  LinkedIn
                </Label>
                <Input
                  id="linkedin"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleChange}
                  className="bg-[#1b1e2d] border-gray-700 text-white focus:border-cyan-500"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="twitter" className="text-gray-400 text-sm">
                  Twitter
                </Label>
                <Input
                  id="twitter"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleChange}
                  className="bg-[#1b1e2d] border-gray-700 text-white focus:border-cyan-500"
                  placeholder="https://twitter.com/username"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
