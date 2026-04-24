import mongoose from "mongoose";

const questionAttemptSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    questionId: { type: String, default: "" },
    selectedOption: { type: String, enum: ["A", "B", "C", "D", ""], default: "" },
    correctOption: { type: String, enum: ["A", "B", "C", "D"], required: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false }
);

const classAssignmentSubmissionSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassAssignment",
      required: true,
      index: true,
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    answers: { type: [questionAttemptSchema], default: [] },
    score: { type: Number, required: true, min: 0 },
    totalQuestions: { type: Number, required: true, min: 0 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

classAssignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

export default mongoose.model("ClassAssignmentSubmission", classAssignmentSubmissionSchema);
