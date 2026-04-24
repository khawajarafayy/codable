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
    mcqs: { type: [mcqSchema], default: [] },
    points: { type: Number, default: 0 },
    ragMeta: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

classAssignmentSchema.pre("save", function () {
  if (this.mcqs?.length && (!this.points || this.points === 0)) {
    this.points = this.mcqs.length;
  }
});

export default mongoose.model("ClassAssignment", classAssignmentSchema);
