import InstructorProfile from "../models/InstructorProfile.js";
import User from "../../models/User.js";
import mongoose from "mongoose";

// ============= CREATE INSTRUCTOR PROFILE (On First Signup) =============
export const createInstructorProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      name,
      email,
      profilePicture,
      bio,
      highestDegree,
      fieldOfStudy,
      institutionName,
      graduationYear,
      yearsOfExperience,
      currentRole,
      currentCompany,
      javaTeachingExperience,
      preferredTeachingTopics,
    } = req.body;

    console.log("=== CREATE JAVA INSTRUCTOR PROFILE ===");
    console.log("userId:", userId);
    console.log("Body:", req.body);

    // Validate userId is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if profile already exists
    const existingProfile = await InstructorProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: "Instructor profile already exists",
      });
    }

    // Create new profile
    const instructorProfile = new InstructorProfile({
      userId: new mongoose.Types.ObjectId(userId),
      name,
      email,
      profilePicture: profilePicture || null,
      bio: bio || "",
      highestDegree,
      fieldOfStudy,
      institutionName,
      graduationYear: parseInt(graduationYear, 10),
      yearsOfExperience: parseInt(yearsOfExperience, 10),
      currentRole,
      currentCompany,
      javaTeachingExperience,
      preferredTeachingTopics: Array.isArray(preferredTeachingTopics) ? preferredTeachingTopics : [preferredTeachingTopics],
      totalClassesCreated: 0,
      totalStudentsTaught: 0,
      averageStudentPerformance: 0,
      pendingReviews: 0,
      assignmentsCreated: 0,
      isProfileComplete: false,
      profileLocked: false,
    });

    console.log("Profile object before save:", instructorProfile.toObject());

    const savedProfile = await instructorProfile.save();

    res.status(201).json({
      success: true,
      message: "Java Instructor profile created successfully",
      data: savedProfile,
    });
  } catch (error) {
    console.error("Error creating instructor profile:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    if (error.errors) {
      console.error("Validation errors:", error.errors);
    }
    
    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation error: " + messages.join(", "),
        errors: messages,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating instructor profile",
      error: error.message,
    });
  }
};

// ============= COMPLETE PROFILE (Lock immutable fields) =============
export const completeInstructorProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const instructorProfile = await InstructorProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });

    if (!instructorProfile) {
      return res.status(404).json({
        success: false,
        message: "Instructor profile not found",
      });
    }

    // Update profile completion status and lock
    instructorProfile.isProfileComplete = true;
    instructorProfile.profileLocked = true;
    await instructorProfile.save();

    res.status(200).json({
      success: true,
      message: "Instructor profile completed and locked successfully",
      data: instructorProfile,
    });
  } catch (error) {
    console.error("Error completing instructor profile:", error);
    res.status(500).json({
      success: false,
      message: "Error completing instructor profile",
      error: error.message,
    });
  }
};

// ============= GET INSTRUCTOR PROFILE =============
export const getInstructorProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const instructorProfile = await InstructorProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) }).populate(
      "userId",
      "name email role avatar"
    );

    if (!instructorProfile) {
      return res.status(404).json({
        success: false,
        message: "Instructor profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: instructorProfile,
    });
  } catch (error) {
    console.error("Error fetching instructor profile:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching instructor profile",
      error: error.message,
    });
  }
};

// ============= UPDATE INSTRUCTOR PROFILE (With Security) =============
export const updateInstructorProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { bio, javaTeachingExperience, preferredTeachingTopics } = req.body;

    const instructorProfile = await InstructorProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });

    if (!instructorProfile) {
      return res.status(404).json({
        success: false,
        message: "Instructor profile not found",
      });
    }

    // If profile is locked, only allow editing of bio, javaTeachingExperience, and preferredTeachingTopics
    if (instructorProfile.profileLocked) {
      instructorProfile.bio = bio !== undefined ? bio : instructorProfile.bio;
      instructorProfile.javaTeachingExperience = javaTeachingExperience !== undefined ? javaTeachingExperience : instructorProfile.javaTeachingExperience;
      if (preferredTeachingTopics) {
        instructorProfile.preferredTeachingTopics = Array.isArray(preferredTeachingTopics) ? preferredTeachingTopics : [preferredTeachingTopics];
      }

      const updatedProfile = await instructorProfile.save();

      return res.status(200).json({
        success: true,
        message: "Instructor profile updated (only bio and teaching experience can be changed after profile completion)",
        data: updatedProfile,
      });
    } else {
      // If profile is not locked, allow all fields to be updated
      const {
        name,
        email,
        profilePicture,
        bio,
        highestDegree,
        fieldOfStudy,
        institutionName,
        graduationYear,
        yearsOfExperience,
        currentRole,
        currentCompany,
        javaTeachingExperience,
        preferredTeachingTopics,
      } = req.body;

      instructorProfile.name = name || instructorProfile.name;
      instructorProfile.email = email || instructorProfile.email;
      if (profilePicture !== undefined) instructorProfile.profilePicture = profilePicture;
      instructorProfile.bio = bio || instructorProfile.bio;
      instructorProfile.highestDegree = highestDegree || instructorProfile.highestDegree;
      instructorProfile.fieldOfStudy = fieldOfStudy || instructorProfile.fieldOfStudy;
      instructorProfile.institutionName = institutionName || instructorProfile.institutionName;
      if (graduationYear !== undefined) instructorProfile.graduationYear = parseInt(graduationYear, 10);
      if (yearsOfExperience !== undefined) instructorProfile.yearsOfExperience = parseInt(yearsOfExperience, 10);
      instructorProfile.currentRole = currentRole || instructorProfile.currentRole;
      instructorProfile.currentCompany = currentCompany || instructorProfile.currentCompany;
      instructorProfile.javaTeachingExperience = javaTeachingExperience || instructorProfile.javaTeachingExperience;
      if (preferredTeachingTopics) {
        instructorProfile.preferredTeachingTopics = Array.isArray(preferredTeachingTopics) ? preferredTeachingTopics : [preferredTeachingTopics];
      }

      const updatedProfile = await instructorProfile.save();

      return res.status(200).json({
        success: true,
        message: "Instructor profile updated",
        data: updatedProfile,
      });
    }
  } catch (error) {
    console.error("Error updating instructor profile:", error);
    res.status(500).json({
      success: false,
      message: "Error updating instructor profile",
      error: error.message,
    });
  }
};

// ============= GET INSTRUCTOR PROFILE STATUS =============
export const getProfileStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const instructorProfile = await InstructorProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });

    if (!instructorProfile) {
      return res.status(404).json({
        success: false,
        message: "Instructor profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        isProfileComplete: instructorProfile.isProfileComplete,
        profileLocked: instructorProfile.profileLocked,
        profile: instructorProfile,
      },
    });
  } catch (error) {
    console.error("Error fetching profile status:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching profile status",
      error: error.message,
    });
  }
};

// ============= UPDATE STATISTICS (Auto-update by system) =============
export const updateInstructorStatistics = async (req, res) => {
  try {
    const { userId } = req.params;
    const { totalClasses, totalStudents, totalAssignments, rating, reviewCount } = req.body;

    const instructorProfile = await InstructorProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });

    if (!instructorProfile) {
      return res.status(404).json({
        success: false,
        message: "Instructor profile not found",
      });
    }

    if (totalClasses !== undefined) instructorProfile.totalClasses = totalClasses;
    if (totalStudents !== undefined) instructorProfile.totalStudents = totalStudents;
    if (totalAssignments !== undefined) instructorProfile.totalAssignments = totalAssignments;
    if (rating !== undefined) instructorProfile.rating = rating;
    if (reviewCount !== undefined) instructorProfile.reviewCount = reviewCount;

    const updatedProfile = await instructorProfile.save();

    res.status(200).json({
      success: true,
      message: "Instructor statistics updated",
      data: updatedProfile,
    });
  } catch (error) {
    console.error("Error updating statistics:", error);
    res.status(500).json({
      success: false,
      message: "Error updating instructor statistics",
      error: error.message,
    });
  }
};

// ============= GET ALL INSTRUCTORS (For admin/listing) =============
export const getAllInstructors = async (req, res) => {
  try {
    const instructors = await InstructorProfile.find({
      isProfileComplete: true,
    }).populate("userId", "name email avatar");

    res.status(200).json({
      success: true,
      data: instructors,
    });
  } catch (error) {
    console.error("Error fetching instructors:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching instructors",
      error: error.message,
    });
  }
};
