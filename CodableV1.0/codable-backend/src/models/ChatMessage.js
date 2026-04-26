import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class ID is required"],
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "Sender ID is required"],
    },
    senderName: {
      type: String,
      required: [true, "Sender name is required"],
    },
    senderEmail: {
      type: String,
      default: "",
    },
    senderRole: {
      type: String,
      enum: ["instructor", "student"],
      required: true,
    },
    message: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
chatMessageSchema.index({ classId: 1, createdAt: -1 });
chatMessageSchema.index({ classId: 1, senderId: 1 });

export default mongoose.model("ChatMessage", chatMessageSchema);
