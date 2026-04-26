import { useEffect, useMemo, useState } from "react";
import { Save, Loader2, UserCircle2, BellRing, Globe, Camera, Upload, ImagePlus, ArrowLeft, Clock, BookOpen, CheckCircle2, Activity } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../../services/apiClient";
import { useAuth } from "../../../context/AuthContext";
import {
  extractProfileImage,
  extractProfileImageFromStudentProfileResponse,
  fileToDataUrl,
  getInitialsFromName,
  getProfileImageValidationMessage,
  validateProfileImageFile
} from "../../../utils/profileImage";

const defaultSettings = {
  fullName: "",
  email: "",
  bio: "",
  city: "",
  country: "",
  github: "",
  linkedin: "",
  twitter: "",
  avatar: "",
  learningPath: "Java Programming",
  membershipTier: "free",
  notifications: {
    emailUpdates: true,
    classAlerts: true,
    assignmentReminders: true
  },
  preferences: {
    language: "en",
    timezone: "UTC"
  }
};

const mapFromStudentProfile = (profileResponse) => {
  const basic = profileResponse?.user_profile?.basic_info || {};
  return {
    ...defaultSettings,
    fullName: basic.full_name || "",
    email: basic.email || "",
    bio: basic.bio || "",
    city: basic.location?.city || "",
    country: basic.location?.country || "",
    github: basic.social_links?.github || "",
    linkedin: basic.social_links?.linkedin || "",
    twitter: basic.social_links?.twitter || "",
    avatar: extractProfileImage(basic),
    learningPath: basic.learning_path || "Java Programming",
    membershipTier: basic.membership_tier || "free"
  };
};

const mapFromAccountSettings = (settingsResponse) => {
  const raw =
    settingsResponse?.account_settings ||
    settingsResponse?.settings ||
    settingsResponse?.data ||
    settingsResponse ||
    {};

  const profile = raw.profile || raw.basic_info || raw;
  const notifications = raw.notifications || {};
  const preferences = raw.preferences || {};

  return {
    ...defaultSettings,
    fullName: profile.fullName || profile.full_name || "",
    email: profile.email || "",
    bio: profile.bio || "",
    city: profile.city || profile.location?.city || "",
    country: profile.country || profile.location?.country || "",
    github: profile.github || profile.social_links?.github || "",
    linkedin: profile.linkedin || profile.social_links?.linkedin || "",
    twitter: profile.twitter || profile.social_links?.twitter || "",
    avatar: extractProfileImage(profile),
    learningPath: profile.learningPath || profile.learning_path || "Java Programming",
    membershipTier: profile.membershipTier || profile.membership_tier || "free",
    notifications: {
      emailUpdates: notifications.emailUpdates ?? notifications.email_updates ?? true,
      classAlerts: notifications.classAlerts ?? notifications.class_alerts ?? true,
      assignmentReminders: notifications.assignmentReminders ?? notifications.assignment_reminders ?? true
    },
    preferences: {
      language: preferences.language || "en",
      timezone: preferences.timezone || "UTC"
    }
  };
};

export default function ClassroomProfile() {
  const { setProfileImage } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [profileImageDataUrl, setProfileImageDataUrl] = useState("");
  const [profileImageError, setProfileImageError] = useState("");
  const [recentActivity, setRecentActivity] = useState(null);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.getAccountSettings();
        const mappedSettings = mapFromAccountSettings(response);
        setSettings(mappedSettings);
        setProfileImagePreview(mappedSettings.avatar || "");
        setProfileImageDataUrl("");
        if (mappedSettings.avatar) {
          setProfileImage(mappedSettings.avatar);
        }
      } catch (accountSettingsError) {
        try {
          const profileResponse = await api.getStudentProfile();
          const mappedProfile = mapFromStudentProfile(profileResponse);
          const avatarFromProfile = extractProfileImageFromStudentProfileResponse(profileResponse);
          setSettings({ ...mappedProfile, avatar: avatarFromProfile || mappedProfile.avatar });
          setProfileImagePreview(avatarFromProfile || "");
          setProfileImageDataUrl("");
          if (avatarFromProfile) {
            setProfileImage(avatarFromProfile);
          }
        } catch {
          setError("Unable to load account settings.");
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchRecentActivity = async () => {
      try {
        const res = await api.getStudentRecentActivity();
        if (res?.data) {
          setRecentActivity(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch recent activity", err);
      } finally {
        setLoadingActivity(false);
      }
    };

    fetchSettings();
    fetchRecentActivity();
  }, []);

  const profileFields = useMemo(
    () => [
      { key: "fullName", label: "Full Name", type: "text" },
      { key: "email", label: "Email", type: "email", disabled: true },
      { key: "bio", label: "Bio", type: "textarea" },
      { key: "city", label: "City", type: "text" },
      { key: "country", label: "Country", type: "text" },
      { key: "learningPath", label: "Learning Path", type: "text", disabled: true },
      { key: "membershipTier", label: "Membership Tier", type: "text", disabled: true }
    ],
    []
  );

  const updateField = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSuccess("");
  };

  const updateNotification = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
    setSuccess("");
  };

  const updatePreference = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }));
    setSuccess("");
  };

  const handleProfileImageChange = async (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setProfileImageError("");
    setError("");
    setSuccess("");

    const validation = await validateProfileImageFile(selectedFile);
    if (!validation.valid) {
      setProfileImageError(validation.message);
      return;
    }

    try {
      const imageDataUrl = await fileToDataUrl(selectedFile);
      setProfileImageDataUrl(imageDataUrl);
      setProfileImagePreview(imageDataUrl);
      setSettings((prev) => ({ ...prev, avatar: imageDataUrl }));
    } catch (readError) {
      setProfileImageError(readError.message || "Failed to process selected image.");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    const accountPayload = {
      profile: {
        fullName: settings.fullName,
        email: settings.email,
        bio: settings.bio,
        location: {
          city: settings.city,
          country: settings.country
        },
        social_links: {
          github: settings.github,
          linkedin: settings.linkedin,
          twitter: settings.twitter
        },
        avatar: profileImageDataUrl || settings.avatar || "",
        learningPath: settings.learningPath,
        membershipTier: settings.membershipTier
      },
      notifications: settings.notifications,
      preferences: settings.preferences
    };

    const profilePayload = {
      fullName: settings.fullName,
      bio: settings.bio,
      location: {
        city: settings.city,
        country: settings.country
      },
      socialLinks: {
        github: settings.github,
        linkedin: settings.linkedin,
        twitter: settings.twitter
      },
      avatar: profileImageDataUrl || settings.avatar || ""
    };

    try {
      await api.updateAccountSettings(accountPayload);
      if (profileImageDataUrl || settings.avatar) {
        const latestAvatar = profileImageDataUrl || settings.avatar;
        setProfileImage(latestAvatar);
        setSettings((prev) => ({ ...prev, avatar: latestAvatar }));
      }
      setProfileImageDataUrl("");
      setSuccess("Settings saved successfully.");
    } catch {
      try {
        const profileResponse = await api.updateStudentProfile(profilePayload);
        const updatedAvatar =
          extractProfileImage(profileResponse?.data || {}) ||
          profileImageDataUrl ||
          settings.avatar ||
          "";

        if (updatedAvatar) {
          setProfileImage(updatedAvatar);
          setSettings((prev) => ({ ...prev, avatar: updatedAvatar }));
          setProfileImagePreview(updatedAvatar);
        }
        setProfileImageDataUrl("");
        setSuccess("Profile settings saved successfully.");
      } catch (saveError) {
        setError(saveError?.message || "Failed to save settings.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05050A] text-white">
      {/* Background Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#05050A]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/classroom')}
              className="p-2 hover:bg-white/5 rounded-xl transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            </button>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Classroom Profile Settings
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 lg:p-8 space-y-6 relative z-10">
        <div className="bg-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/5 p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white">Your Profile</h2>
          <p className="text-gray-400 mt-2">
            Manage your classroom profile, preferences, and notifications.
          </p>
        </div>

        <section className="bg-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/5 p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <Camera className="h-5 w-5 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Profile Picture</h3>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="relative h-28 w-28 rounded-full overflow-hidden border-2 border-white/10 bg-black/50 flex items-center justify-center shadow-xl">
              {profileImagePreview ? (
                <img
                  src={profileImagePreview}
                  alt="Profile preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-white text-3xl font-bold tracking-wider">
                  {getInitialsFromName(settings.fullName)}
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 py-1.5 text-center text-[10px] uppercase font-bold tracking-wider bg-black/60 text-gray-300 backdrop-blur-sm">
                {profileImagePreview ? "Preview" : "No image"}
              </div>
            </div>

            <div className="space-y-3">
              <label
                htmlFor="profile-image-upload"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-bold cursor-pointer transition-all shadow-lg hover:shadow-cyan-500/20 hover:-translate-y-0.5"
              >
                <Upload className="h-4 w-4" />
                Upload New Picture
              </label>
              <input
                id="profile-image-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleProfileImageChange}
              />

              <div className="flex items-start gap-2 text-xs text-gray-400">
                <ImagePlus className="h-4 w-4 mt-0.5 text-gray-500" />
                <p>{getProfileImageValidationMessage()}</p>
              </div>
            </div>
          </div>

          {profileImageError && (
            <div className="mt-6 p-4 text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
              {profileImageError}
            </div>
          )}
        </section>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-medium">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/5 p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <UserCircle2 className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Basic Information</h3>
            </div>
            
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-5">
                {profileFields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">{field.label}</label>
                    {field.type === "textarea" ? (
                      <textarea
                        className="w-full rounded-xl bg-black/40 border border-white/10 text-white px-4 py-3 min-h-[100px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        value={settings[field.key]}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        disabled={field.disabled}
                      />
                    ) : (
                      <input
                        type={field.type}
                        className="w-full rounded-xl bg-black/40 border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        value={settings[field.key]}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        disabled={field.disabled}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-6">
            <div className="bg-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/5 p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <Globe className="h-5 w-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Social & Preferences</h3>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">GitHub</label>
                  <input
                    className="w-full rounded-xl bg-black/40 border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                    value={settings.github}
                    onChange={(e) => updateField("github", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">LinkedIn</label>
                  <input
                    className="w-full rounded-xl bg-black/40 border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                    value={settings.linkedin}
                    onChange={(e) => updateField("linkedin", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Twitter/X</label>
                  <input
                    className="w-full rounded-xl bg-black/40 border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                    value={settings.twitter}
                    onChange={(e) => updateField("twitter", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Language</label>
                    <select
                      className="w-full rounded-xl bg-black/40 border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all appearance-none"
                      value={settings.preferences.language}
                      onChange={(e) => updatePreference("language", e.target.value)}
                    >
                      <option value="en">English</option>
                      <option value="ur">Urdu</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Timezone</label>
                    <input
                      className="w-full rounded-xl bg-black/40 border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                      value={settings.preferences.timezone}
                      onChange={(e) => updatePreference("timezone", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/5 p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
                  <Activity className="h-5 w-5 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
              </div>
              
              {loadingActivity ? (
                <div className="space-y-4">
                  <div className="h-20 rounded-xl bg-white/5 animate-pulse" />
                  <div className="h-20 rounded-xl bg-white/5 animate-pulse" />
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity?.lastSubmittedAssignment ? (
                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          <span className="text-sm font-semibold text-white">Last Submitted</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(recentActivity.lastSubmittedAssignment.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 font-medium mb-1">
                        {recentActivity.lastSubmittedAssignment.title}
                      </p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{recentActivity.lastSubmittedAssignment.className}</span>
                        <span className="text-green-400 font-bold">{recentActivity.lastSubmittedAssignment.percentage}% Score</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center">
                      <p className="text-sm text-gray-500">No recent submissions</p>
                    </div>
                  )}

                  {recentActivity?.lastJoinedClass ? (
                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-blue-400" />
                          <span className="text-sm font-semibold text-white">Last Joined Class</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(recentActivity.lastJoinedClass.joinedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 font-medium mb-1">
                        {recentActivity.lastJoinedClass.className}
                      </p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Instructor: {recentActivity.lastJoinedClass.instructorName}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center">
                      <p className="text-sm text-gray-500">No recently joined classes</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="flex justify-end pt-4 pb-12">
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-all shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {saving ? "Saving Changes..." : "Save All Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
