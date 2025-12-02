import StudentProfile from "../models/StudentProfile.js";
import User from "../models/User.js";

// Get student profile
const getStudentProfile = async (req, res) => {
  try {
    const userId = req.userId; // from auth middleware

    // Find profile and populate user data
    let profile = await StudentProfile.findOne({ userId })
      .populate('userId', 'email createdAt role');

    // If profile doesn't exist, create one automatically
    if (!profile) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      // Create a new profile for this user
      profile = await StudentProfile.createForUser(userId, { 
        name: user.name, 
        email: user.email 
      });

      // Populate the userId field
      profile = await StudentProfile.findById(profile._id)
        .populate('userId', 'email createdAt role');

      console.log("Auto-created profile for user:", userId);
    }

    res.status(200).json({
      success: true,
      data: {
        _id: profile._id,
        userId: profile.userId._id,
        email: profile.userId.email,
        joinDate: profile.userId.createdAt,
        role: profile.userId.role,
        fullName: profile.fullName,
        avatar: profile.avatar,
        bio: profile.bio,
        location: profile.location,
        fullLocation: profile.fullLocation,
        membershipTier: profile.membershipTier,
        socialLinks: profile.socialLinks,
        initials: profile.getInitials(),
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt
      }
    });
  } catch (error) {
    console.error("Error fetching student profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Create student profile (called during signup)
const createStudentProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { fullName, avatar, bio, location, socialLinks } = req.body;

    // Check if profile already exists
    const existingProfile = await StudentProfile.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: "Profile already exists for this user"
      });
    }

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Create new profile
    const profile = new StudentProfile({
      userId,
      fullName: fullName || user.name || user.email.split('@')[0],
      avatar: avatar || null,
      bio: bio || '',
      location: location || { city: '', country: '' },
      membershipTier: 'free',
      socialLinks: socialLinks || { github: '', linkedin: '', twitter: '' }
    });

    await profile.save();

    res.status(201).json({
      success: true,
      message: "Student profile created successfully",
      data: {
        _id: profile._id,
        fullName: profile.fullName,
        avatar: profile.avatar,
        bio: profile.bio,
        location: profile.location,
        membershipTier: profile.membershipTier,
        socialLinks: profile.socialLinks,
        initials: profile.getInitials()
      }
    });
  } catch (error) {
    console.error("Error creating student profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Update student profile
const updateStudentProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { fullName, avatar, bio, location, socialLinks } = req.body;

    // Find profile
    const profile = await StudentProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found"
      });
    }

    // Update fields if provided
    if (fullName !== undefined) profile.fullName = fullName;
    if (avatar !== undefined) profile.avatar = avatar;
    if (bio !== undefined) profile.bio = bio;

    if (location) {
      if (location.city !== undefined) profile.location.city = location.city;
      if (location.country !== undefined) profile.location.country = location.country;
    }

    if (socialLinks) {
      if (socialLinks.github !== undefined) profile.socialLinks.github = socialLinks.github;
      if (socialLinks.linkedin !== undefined) profile.socialLinks.linkedin = socialLinks.linkedin;
      if (socialLinks.twitter !== undefined) profile.socialLinks.twitter = socialLinks.twitter;
    }

    await profile.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        _id: profile._id,
        fullName: profile.fullName,
        avatar: profile.avatar,
        bio: profile.bio,
        location: profile.location,
        fullLocation: profile.fullLocation,
        membershipTier: profile.membershipTier,
        socialLinks: profile.socialLinks,
        initials: profile.getInitials(),
        updatedAt: profile.updatedAt
      }
    });
  } catch (error) {
    console.error("Error updating student profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Delete student profile
const deleteStudentProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const profile = await StudentProfile.findOneAndDelete({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Student profile deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting student profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Upgrade membership tier
const upgradeMembership = async (req, res) => {
  try {
    const userId = req.userId;
    const { tier } = req.body; // 'pro' or 'premium'

    if (!['pro', 'premium'].includes(tier)) {
      return res.status(400).json({
        success: false,
        message: "Invalid membership tier. Use 'pro' or 'premium'"
      });
    }

    const profile = await StudentProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found"
      });
    }

    profile.membershipTier = tier;
    await profile.save();

    res.status(200).json({
      success: true,
      message: `Membership upgraded to ${tier} successfully`,
      data: {
        membershipTier: profile.membershipTier
      }
    });
  } catch (error) {
    console.error("Error upgrading membership:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export default {
  getStudentProfile,
  createStudentProfile,
  updateStudentProfile,
  deleteStudentProfile,
  upgradeMembership
};