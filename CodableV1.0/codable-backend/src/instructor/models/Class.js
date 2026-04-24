import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    // Basic Information
    className: {
      type: String,
      required: [true, "Class name is required"],
      trim: true,
      maxlength: [100, "Class name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      default: "",
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    category: {
      type: String,
      enum: ["Core Java", "Advanced Java", "Frameworks", "Algorithms", "Other"],
      default: "Core Java",
    },

    // Instructor Reference
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "Instructor ID is required"],
    },

    // Join Code (Auto-generated, Unique)
    joinCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
    },

    // Class Configuration
    maxStudents: {
      type: Number,
      default: null,
      min: [1, "Max students must be at least 1"],
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },

    // Settings
    autoApproveStudents: {
      type: Boolean,
      default: false,
    },
    allowLateSubmissions: {
      type: Boolean,
      default: true,
    },

    // Students (Array of User IDs)
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique join code before saving
classSchema.pre("save", async function () {
  if (!this.joinCode) {
    let code = this.generateJoinCode();
    // Ensure uniqueness
    while (await mongoose.model("Class").findOne({ joinCode: code })) {
      code = this.generateJoinCode();
    }
    this.joinCode = code;
  }
});

// Helper method to generate join code
classSchema.methods.generateJoinCode = function () {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

// Static method to generate join code
classSchema.statics.generateJoinCode = function () {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

export default mongoose.model("Class", classSchema);
