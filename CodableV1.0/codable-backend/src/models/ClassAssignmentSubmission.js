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

const testCaseResultSchema = new mongoose.Schema(
  {
    index: { type: Number, required: true },
    input: { type: String, default: "" },
    expectedOutput: { type: String, default: "" },
    actualOutput: { type: String, default: "" },
    passed: { type: Boolean, default: false },
    error: { type: String, default: "" },
  },
  { _id: false }
);

const codingTaskSubmissionSchema = new mongoose.Schema(
  {
    taskId: { type: String, required: true },
    codeSnippet: { type: String, default: "" },
    testCasesPassed: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    testCaseResults: { type: [testCaseResultSchema], default: [] },
    aiCodeAnalysis: {
      logic: { type: String, default: "" },
      quality: { type: String, default: "" },
      structure: { type: String, default: "" },
      score: { type: Number, default: 0 }
    },
    complexityAnalysis: {
      timeComplexity: { type: String, default: "" },
      spaceComplexity: { type: String, default: "" }
    }
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
    assignmentType: {
      type: String,
      enum: ["mcq", "coding"],
      default: "mcq",
    },
    answers: { type: [questionAttemptSchema], default: [] },
    codingSubmissions: { type: [codingTaskSubmissionSchema], default: [] },
    score: { type: Number, required: true, min: 0 },
    totalQuestions: { type: Number, required: true, min: 0 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    attemptCount: { type: Number, default: 1 },
    timeTaken: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

classAssignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

export default mongoose.model("ClassAssignmentSubmission", classAssignmentSubmissionSchema);
