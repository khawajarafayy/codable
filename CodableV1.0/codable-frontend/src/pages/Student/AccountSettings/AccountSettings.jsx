import { useEffect, useMemo, useState } from "react";
import { Save, Loader2, UserCircle2, BellRing, Globe } from "lucide-react";
import { Navbar } from "../LandingDashboard/components/Navbar";
import { api } from "../../../services/apiClient";

const defaultSettings = {
  fullName: "",
  email: "",
  bio: "",
  city: "",
  country: "",
  github: "",
  linkedin: "",
  twitter: "",
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

export default function AccountSettings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.getAccountSettings();
        setSettings(mapFromAccountSettings(response));
      } catch (accountSettingsError) {
        try {
          const profileResponse = await api.getStudentProfile();
          setSettings(mapFromStudentProfile(profileResponse));
        } catch {
          setError("Unable to load account settings.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
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
      }
    };

    try {
      await api.updateAccountSettings(accountPayload);
      setSuccess("Settings saved successfully.");
    } catch {
      try {
        await api.updateStudentProfile(profilePayload);
        setSuccess("Profile settings saved successfully.");
      } catch (saveError) {
        setError(saveError?.message || "Failed to save settings.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6 lg:p-8 space-y-6">
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-gray-800/70 p-6">
          <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
          <p className="text-gray-400 mt-1">
            Manage your student profile, preferences, and notifications.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-black/40 backdrop-blur-xl rounded-2xl border border-gray-800/70 p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserCircle2 className="h-5 w-5 text-blue-300" />
              <h2 className="text-lg font-semibold text-white">Profile</h2>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 rounded bg-gray-800/60 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {profileFields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm text-gray-300 mb-1">{field.label}</label>
                    {field.type === "textarea" ? (
                      <textarea
                        className="w-full rounded-lg bg-gray-900/70 border border-gray-700 text-white px-3 py-2 min-h-[90px]"
                        value={settings[field.key]}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        disabled={field.disabled}
                      />
                    ) : (
                      <input
                        type={field.type}
                        className="w-full rounded-lg bg-gray-900/70 border border-gray-700 text-white px-3 py-2"
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
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-gray-800/70 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="h-5 w-5 text-purple-300" />
                <h2 className="text-lg font-semibold text-white">Social & Preferences</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">GitHub</label>
                  <input
                    className="w-full rounded-lg bg-gray-900/70 border border-gray-700 text-white px-3 py-2"
                    value={settings.github}
                    onChange={(e) => updateField("github", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">LinkedIn</label>
                  <input
                    className="w-full rounded-lg bg-gray-900/70 border border-gray-700 text-white px-3 py-2"
                    value={settings.linkedin}
                    onChange={(e) => updateField("linkedin", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Twitter/X</label>
                  <input
                    className="w-full rounded-lg bg-gray-900/70 border border-gray-700 text-white px-3 py-2"
                    value={settings.twitter}
                    onChange={(e) => updateField("twitter", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Language</label>
                    <select
                      className="w-full rounded-lg bg-gray-900/70 border border-gray-700 text-white px-3 py-2"
                      value={settings.preferences.language}
                      onChange={(e) => updatePreference("language", e.target.value)}
                    >
                      <option value="en">English</option>
                      <option value="ur">Urdu</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Timezone</label>
                    <input
                      className="w-full rounded-lg bg-gray-900/70 border border-gray-700 text-white px-3 py-2"
                      value={settings.preferences.timezone}
                      onChange={(e) => updatePreference("timezone", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-gray-800/70 p-6">
              <div className="flex items-center gap-2 mb-4">
                <BellRing className="h-5 w-5 text-amber-300" />
                <h2 className="text-lg font-semibold text-white">Notifications</h2>
              </div>
              <div className="space-y-3">
                {[
                  ["emailUpdates", "Email updates"],
                  ["classAlerts", "Class alerts"],
                  ["assignmentReminders", "Assignment reminders"]
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between text-gray-300">
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      checked={settings.notifications[key]}
                      onChange={(e) => updateNotification(key, e.target.checked)}
                      className="h-4 w-4"
                    />
                  </label>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium transition-colors"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
