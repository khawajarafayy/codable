import mongoose from "mongoose";

const instructorProfileSchema = new mongoose.Schema({
  // Link to User model
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },

  // ========== 1. BASIC INFORMATION ==========
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String, // URL to uploaded image
    default: null,
  },
  bio: {
    type: String,
    maxlength: 500,
    default: "",
  },

  // ========== 2. EDUCATION BACKGROUND ==========
  highestDegree: {
    type: String,
    enum: ["BS", "MS", "MPhil", "PhD", "Other"],
    required: true,
  },
  fieldOfStudy: {
    type: String,
    required: true,
  },
  institutionName: {
    type: String,
    required: true,
  },
  graduationYear: {
    type: Number,
    required: true,
  },

  // ========== 3. PROFESSIONAL EXPERIENCE ==========
  yearsOfExperience: {
    type: Number,
    required: true,
  },
  currentRole: {
    type: String,
    enum: ["Software Engineer", "Instructor", "Freelancer", "Other"],
    required: true,
  },
  currentCompany: {
    type: String,
    required: true,
  },
  javaTeachingExperience: {
    type: String,
    maxlength: 1000,
    required: true,
  },
  preferredTeachingTopics: {
    type: [String],
    enum: ["OOP Concepts", "DSA", "Backend Development", "Problem Solving", "Web Development with Java"],
    validate: {
      validator: function (v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: "At least one teaching topic is required",
    },
  },

  // ========== STATISTICS (Auto-updated by system) ==========
  totalClassesCreated: {
    type: Number,
    default: 0,
  },
  totalStudentsTaught: {
    type: Number,
    default: 0,
  },
  averageStudentPerformance: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  pendingReviews: {
    type: Number,
    default: 0,
  },
  assignmentsCreated: {
    type: Number,
    default: 0,
  },

  // ========== PROFILE STATUS & SECURITY ==========
  isProfileComplete: {
    type: Boolean,
    default: false,
  },
  profileLocked: {
    type: Boolean,
    default: false,
  },

  // ========== METADATA ==========
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update updatedAt before saving (using async syntax)
instructorProfileSchema.pre("save", async function () {
  this.updatedAt = Date.now();
});

export default mongoose.model("InstructorProfile", instructorProfileSchema);
