import mongoose from "mongoose";

const classRequestSchema = new mongoose.Schema(
  {
    // References
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "Student ID is required"],
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class ID is required"],
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "Instructor ID is required"],
    },

    // Status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // Timestamps
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: {
      type: Date,
      default: null,
    },

    // Optional notes from instructor
    instructorNotes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate pending requests for same student-class combo
classRequestSchema.index({ studentId: 1, classId: 1, status: 1 }, { unique: true, sparse: true, partialFilterExpression: { status: "pending" } });

export default mongoose.model("ClassRequest", classRequestSchema);
