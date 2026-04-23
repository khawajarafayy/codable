import { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext.jsx";
import { ArrowLeft, Lock, Edit2, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { request } from "../../../../services/apiClient.js";

export default function InstructorProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form States
  const [formData, setFormData] = useState({
    // Basic Information
    name: "",
    email: "",
    profilePicture: "",
    bio: "",
    // Education Background
    highestDegree: "BS",
    fieldOfStudy: "",
    institutionName: "",
    graduationYear: new Date().getFullYear(),
    // Professional Experience
    yearsOfExperience: "",
    currentRole: "Software Engineer",
    currentCompany: "",
    javaTeachingExperience: "",
    preferredTeachingTopics: [],
  });

  const [profileData, setProfileData] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [profileLocked, setProfileLocked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Predefined options
  const degreeOptions = ["BS", "MS", "MPhil", "PhD", "Other"];
  const roleOptions = ["Software Engineer", "Instructor", "Freelancer", "Other"];
  const topicsOptions = ["OOP Concepts", "DSA", "Backend Development", "Problem Solving", "Web Development with Java"];

  useEffect(() => {
    // Pre-fill email from user data
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
    fetchProfileData();
  }, []);

  // ============= FETCH PROFILE =============
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const data = await request(
        `/api/instructor/${user._id}/status`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      if (data.success) {
        setProfileData(data.data.profile);
        setIsProfileComplete(data.data.isProfileComplete);
        setProfileLocked(data.data.profileLocked);
        setFormData(data.data.profile);
      }
    } catch (err) {
      // Profile doesn't exist yet, which is fine for first-time setup
      console.log("Profile does not exist yet");
    } finally {
      setLoading(false);
    }
  };

  // ============= CREATE PROFILE =============
  const handleCreateProfile = async (e) => {
    e.preventDefault();
    if (formData.preferredTeachingTopics.length === 0) {
      setError("Please select at least one teaching topic");
      return;
    }

    // Validate required fields
    const requiredFields = [
      "name", "bio", "highestDegree", "fieldOfStudy", 
      "institutionName", "graduationYear", "yearsOfExperience", 
      "currentRole", "currentCompany", "javaTeachingExperience"
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(", ")}`);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Convert numbers and prepare data
      const profilePayload = {
        ...formData,
        graduationYear: parseInt(formData.graduationYear, 10),
        yearsOfExperience: parseInt(formData.yearsOfExperience, 10),
        preferredTeachingTopics: Array.isArray(formData.preferredTeachingTopics) 
          ? formData.preferredTeachingTopics 
          : [formData.preferredTeachingTopics],
      };

      console.log("Sending profile data:", profilePayload);

      const data = await request(
        `/api/instructor/${user._id}/create`,
        {
          method: "POST",
          body: profilePayload,
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      if (data.success) {
        setSuccessMessage("Profile created successfully!");
        setProfileData(data.data);
        setIsProfileComplete(false);
        setProfileLocked(false);
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.payload?.message || "Error creating profile");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // ============= COMPLETE PROFILE =============
  const handleCompleteProfile = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const data = await request(
        `/api/instructor/${user._id}/complete`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      if (data.success) {
        setSuccessMessage("Profile completed and locked! You can only edit bio and teaching experience now.");
        setIsProfileComplete(true);
        setProfileLocked(true);
        setIsEditing(false);
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Error completing profile");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // ============= UPDATE PROFILE =============
  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      setError(null);

      const updatePayload = profileLocked
        ? {
            bio: formData.bio,
            javaTeachingExperience: formData.javaTeachingExperience,
            preferredTeachingTopics: formData.preferredTeachingTopics,
          }
        : formData;

      const data = await request(
        `/api/instructor/${user._id}/profile`,
        {
          method: "PUT",
          body: updatePayload,
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      if (data.success) {
        setSuccessMessage("Profile updated successfully!");
        setProfileData(data.data);
        setIsEditing(false);
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Error updating profile");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // ============= HANDLE INPUT CHANGE =============
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Check if field is locked
    const lockedFields = ["name", "email", "highestDegree", "fieldOfStudy", "institutionName", "graduationYear", "yearsOfExperience", "currentRole", "currentCompany"];
    if (profileLocked && lockedFields.includes(name)) {
      setError("This field is locked after profile completion.");
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // ============= TOGGLE TEACHING TOPIC =============
  const toggleTeachingTopic = (topic) => {
    if (profileLocked) {
      setError("Teaching topics are locked after profile completion.");
      return;
    }

    setFormData(prev => ({
      ...prev,
      preferredTeachingTopics: prev.preferredTeachingTopics.includes(topic)
        ? prev.preferredTeachingTopics.filter(t => t !== topic)
        : [...prev.preferredTeachingTopics, topic],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400" />
      </div>
    );
  }

  // ============= RENDER: CREATE MODE =============
  if (!profileData) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#fdfdff]" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[#fdfdff] mb-2">
              Create Your Java Instructor Profile
            </h1>
            <p className="text-[#fdfdff]/60">
              Complete your profile to start teaching Java
            </p>
          </div>
        </div>

        {/* Alert Message */}
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-[#fdfdff]">Important</p>
            <p className="text-sm text-[#fdfdff]/70 mt-1">
              After creating your profile, you cannot change your personal details, education, or experience information. You can only update your bio and teaching experience. Make sure all information is correct before completing your profile.
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-rose-300">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-emerald-300">{successMessage}</p>
          </div>
        )}

        {/* Create Profile Form */}
        <form onSubmit={handleCreateProfile} className="space-y-8">
          {/* ===== SECTION 1: BASIC INFORMATION ===== */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[#fdfdff]">📋 Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Full Name *"
                required
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#fdfdff] placeholder-[#fdfdff]/30 focus:outline-none focus:border-blue-500/50"
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#fdfdff]/50 placeholder-[#fdfdff]/30 cursor-not-allowed opacity-60"
              />
            </div>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Short Bio / Introduction *"
              required
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#fdfdff] placeholder-[#fdfdff]/30 focus:outline-none focus:border-blue-500/50 resize-none"
            />
          </div>

          {/* ===== SECTION 2: EDUCATION BACKGROUND ===== */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[#fdfdff]">🎓 Education Background</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                name="highestDegree"
                value={formData.highestDegree}
                onChange={handleInputChange}
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#fdfdff] focus:outline-none focus:border-blue-500/50"
              >
                {degreeOptions.map(degree => (
                  <option key={degree} value={degree}>{degree}</option>
                ))}
              </select>
              <input
                type="text"
                name="fieldOfStudy"
                value={formData.fieldOfStudy}
                onChange={handleInputChange}
                placeholder="Field of Study (e.g., Computer Science) *"
                required
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#fdfdff] placeholder-[#fdfdff]/30 focus:outline-none focus:border-blue-500/50"
              />
              <input
                type="text"
                name="institutionName"
                value={formData.institutionName}
                onChange={handleInputChange}
                placeholder="Institution Name *"
                required
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#fdfdff] placeholder-[#fdfdff]/30 focus:outline-none focus:border-blue-500/50"
              />
              <input
                type="number"
                name="graduationYear"
                value={formData.graduationYear}
                onChange={handleInputChange}
                placeholder="Graduation Year *"
                required
                min="1990"
                max={new Date().getFullYear()}
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#fdfdff] placeholder-[#fdfdff]/30 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          {/* ===== SECTION 3: PROFESSIONAL EXPERIENCE ===== */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[#fdfdff]">💼 Professional Experience</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="number"
                name="yearsOfExperience"
                value={formData.yearsOfExperience}
                onChange={handleInputChange}
                placeholder="Years of Experience *"
                required
                min="0"
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#fdfdff] placeholder-[#fdfdff]/30 focus:outline-none focus:border-blue-500/50"
              />
              <select
                name="currentRole"
                value={formData.currentRole}
                onChange={handleInputChange}
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#fdfdff] focus:outline-none focus:border-blue-500/50"
              >
                {roleOptions.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              <input
                type="text"
                name="currentCompany"
                value={formData.currentCompany}
                onChange={handleInputChange}
                placeholder="Current Company *"
                required
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#fdfdff] placeholder-[#fdfdff]/30 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <textarea
              name="javaTeachingExperience"
              value={formData.javaTeachingExperience}
              onChange={handleInputChange}
              placeholder="Java Teaching Experience & Achievements *"
              required
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#fdfdff] placeholder-[#fdfdff]/30 focus:outline-none focus:border-blue-500/50 resize-none"
            />

            {/* Preferred Teaching Topics */}
            <div>
              <label className="block text-sm font-medium text-[#fdfdff] mb-3">
                Preferred Teaching Topics * (Select at least one)
              </label>
              <div className="flex flex-wrap gap-2">
                {topicsOptions.map(topic => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTeachingTopic(topic)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      formData.preferredTeachingTopics.includes(topic)
                        ? "bg-blue-500 text-white"
                        : "bg-white/5 text-[#fdfdff]/70 hover:bg-white/10"
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium transition-all"
            >
              {isSaving ? "Creating..." : "Create Profile"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-[#fdfdff] font-medium transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ============= RENDER: VIEW/EDIT MODE =============
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#fdfdff]" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[#fdfdff] mb-2">Java Instructor Profile</h1>
            <p className="text-[#fdfdff]/60">
              {profileLocked ? "Profile Locked - Only bio and teaching experience can be edited" : "Complete your profile"}
            </p>
          </div>
        </div>

        {profileLocked ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-emerald-300">Profile Completed</span>
          </div>
        ) : (
          <button
            onClick={handleCompleteProfile}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium transition-all"
          >
            {isSaving ? "Completing..." : "Complete & Lock Profile"}
          </button>
        )}
      </div>

      {/* Error & Success Messages */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-emerald-300">{successMessage}</p>
        </div>
      )}

      {/* Profile Content */}
      {isEditing ? (
        <form onSubmit={handleUpdateProfile} className="space-y-8">
          {/* Edit Bio */}
          <div className="p-6 rounded-2xl backdrop-blur-sm bg-blue-500/10 border border-blue-500/30">
            <h2 className="text-xl font-semibold text-[#fdfdff] mb-4">Edit Bio</h2>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#fdfdff] placeholder-[#fdfdff]/30 focus:outline-none focus:border-blue-500/50 resize-none"
            />
          </div>

          {/* Edit Java Teaching Experience */}
          <div className="p-6 rounded-2xl backdrop-blur-sm bg-purple-500/10 border border-purple-500/30">
            <h2 className="text-xl font-semibold text-[#fdfdff] mb-4">Edit Java Teaching Experience</h2>
            <textarea
              name="javaTeachingExperience"
              value={formData.javaTeachingExperience}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[#fdfdff] placeholder-[#fdfdff]/30 focus:outline-none focus:border-blue-500/50 resize-none"
            />
          </div>

          {/* Edit Teaching Topics */}
          {!profileLocked && (
            <div className="p-6 rounded-2xl backdrop-blur-sm bg-emerald-500/10 border border-emerald-500/30">
              <h2 className="text-xl font-semibold text-[#fdfdff] mb-4">Edit Teaching Topics</h2>
              <div className="flex flex-wrap gap-2">
                {topicsOptions.map(topic => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTeachingTopic(topic)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      formData.preferredTeachingTopics.includes(topic)
                        ? "bg-emerald-500 text-white"
                        : "bg-white/5 text-[#fdfdff]/70 hover:bg-white/10"
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium transition-all"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#fdfdff] font-medium transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* Basic Information */}
          <div className="p-6 rounded-2xl backdrop-blur-sm bg-blue-500/10 border border-blue-500/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#fdfdff]">📋 Basic Information</h2>
              {!profileLocked && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-3 py-1 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-[#fdfdff]/60">Full Name</p>
                <p className="text-[#fdfdff] font-medium">{profileData.name}</p>
              </div>
              <div>
                <p className="text-sm text-[#fdfdff]/60">Email</p>
                <p className="text-[#fdfdff] font-medium">{profileData.email}</p>
              </div>
              <div>
                <p className="text-sm text-[#fdfdff]/60">Bio</p>
                <p className="text-[#fdfdff]">{profileData.bio || "No bio added"}</p>
              </div>
            </div>
          </div>

          {/* Education Background */}
          <div className="p-6 rounded-2xl backdrop-blur-sm bg-purple-500/10 border border-purple-500/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#fdfdff]">🎓 Education Background</h2>
              {profileLocked && <Lock className="w-5 h-5 text-purple-400" />}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#fdfdff]/60">Highest Degree</p>
                <p className="text-[#fdfdff] font-medium">{profileData.highestDegree}</p>
              </div>
              <div>
                <p className="text-sm text-[#fdfdff]/60">Field of Study</p>
                <p className="text-[#fdfdff] font-medium">{profileData.fieldOfStudy}</p>
              </div>
              <div>
                <p className="text-sm text-[#fdfdff]/60">Institution</p>
                <p className="text-[#fdfdff] font-medium">{profileData.institutionName}</p>
              </div>
              <div>
                <p className="text-sm text-[#fdfdff]/60">Graduation Year</p>
                <p className="text-[#fdfdff] font-medium">{profileData.graduationYear}</p>
              </div>
            </div>
          </div>

          {/* Professional Experience */}
          <div className="p-6 rounded-2xl backdrop-blur-sm bg-emerald-500/10 border border-emerald-500/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#fdfdff]">💼 Professional Experience</h2>
              {profileLocked && <Lock className="w-5 h-5 text-emerald-400" />}
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#fdfdff]/60">Years of Experience</p>
                  <p className="text-[#fdfdff] font-medium">{profileData.yearsOfExperience} years</p>
                </div>
                <div>
                  <p className="text-sm text-[#fdfdff]/60">Current Role</p>
                  <p className="text-[#fdfdff] font-medium">{profileData.currentRole}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-[#fdfdff]/60">Current Company</p>
                  <p className="text-[#fdfdff] font-medium">{profileData.currentCompany}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-[#fdfdff]/60">Java Teaching Experience</p>
                <p className="text-[#fdfdff]">{profileData.javaTeachingExperience}</p>
              </div>
              <div>
                <p className="text-sm text-[#fdfdff]/60 mb-2">Preferred Teaching Topics</p>
                <div className="flex flex-wrap gap-2">
                  {profileData.preferredTeachingTopics?.map(topic => (
                    <span
                      key={topic}
                      className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-medium"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm text-[#fdfdff]/60 mb-1">Classes Created</p>
              <p className="text-2xl font-bold text-[#fdfdff]">{profileData.totalClassesCreated}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm text-[#fdfdff]/60 mb-1">Students Taught</p>
              <p className="text-2xl font-bold text-[#fdfdff]">{profileData.totalStudentsTaught}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm text-[#fdfdff]/60 mb-1">Avg Performance</p>
              <p className="text-2xl font-bold text-[#fdfdff]">{profileData.averageStudentPerformance}%</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm text-[#fdfdff]/60 mb-1">Pending Reviews</p>
              <p className="text-2xl font-bold text-[#fdfdff]">{profileData.pendingReviews}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm text-[#fdfdff]/60 mb-1">Assignments</p>
              <p className="text-2xl font-bold text-[#fdfdff]">{profileData.assignmentsCreated}</p>
            </div>
          </div>

          {/* Edit Button */}
          {!profileLocked && (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all"
            >
              <Edit2 className="w-4 h-4 inline mr-2" />
              Edit Profile
            </button>
          )}
        </>
      )}
    </div>
  );
}
