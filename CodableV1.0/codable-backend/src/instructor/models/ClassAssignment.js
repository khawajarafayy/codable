import mongoose from "mongoose";

const mcqOptionSchema = new mongoose.Schema(
  {
    A: { type: String, default: "" },
    B: { type: String, default: "" },
    C: { type: String, default: "" },
    D: { type: String, default: "" },
  },
  { _id: false }
);

const mcqSchema = new mongoose.Schema(
  {
    id: { type: String, default: "" },
    question: { type: String, required: true },
    options: { type: mcqOptionSchema, default: () => ({}) },
    correct: { type: String, enum: ["A", "B", "C", "D"], default: "A" },
  },
  { _id: false }
);

const codingTestCaseSchema = new mongoose.Schema(
  {
    input: { type: String, default: "" },
    output: { type: String, default: "" },
  },
  { _id: false }
);

const codingTaskSchema = new mongoose.Schema(
  {
    id: { type: String, default: "" },
    question: { type: String, default: "" },
    problemStatement: { type: String, required: true },
    constraints: { type: [String], default: [] },
    inputFormat: { type: String, default: "" },
    outputFormat: { type: String, default: "" },
    referenceSolution: { type: String, default: "" },
    sampleTestCases: { type: [codingTestCaseSchema], default: [] },
    hiddenTestCases: { type: [codingTestCaseSchema], default: [] },
    expectedConcepts: { type: [String], default: [] },
  },
  { _id: false }
);

const classAssignmentSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 500 },
    description: { type: String, default: "", maxlength: 2000 },
    deadline: { type: Date, required: true },
    /** draft = visible only to instructor; published = visible to enrolled students */
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    difficulty: { type: String, enum: ["L", "M", "H"], default: "M" },
    chapterIds: [{ type: Number }],
    topics: [{ type: String }],
    assignmentType: { type: String, enum: ["mcq", "coding"], default: "mcq" },
    mcqs: { type: [mcqSchema], default: [] },
    codingTasks: { type: [codingTaskSchema], default: [] },
    points: { type: Number, default: 0 },
    ragMeta: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

classAssignmentSchema.pre("save", function() {
  // Set points based on task count if not already set
  if (!this.points || this.points === 0) {
    if (this.assignmentType === "coding" && this.codingTasks && this.codingTasks.length) {
      this.points = this.codingTasks.length * 10;
    } else if (this.mcqs && this.mcqs.length) {
      this.points = this.mcqs.length;
    }
  }
});

export default mongoose.model("ClassAssignment", classAssignmentSchema);
