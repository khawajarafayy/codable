import mongoose from "mongoose";

// Track individual chapter/topic progress
const topicProgressSchema = new mongoose.Schema({
  topicId: { type: String, required: true }, // e.g., "1-1", "1-2"
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  timeSpent: { type: Number, default: 0 }, // in seconds
});

const chapterProgressSchema = new mongoose.Schema({
  chapterId: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ["locked", "not-started", "in-progress", "completed"], 
    default: "locked" 
  },
  topicsProgress: [topicProgressSchema],
  completedAt: { type: Date },
  startedAt: { type: Date },
});

const userProgressSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "user", 
    required: true,
    unique: true 
  },
  chapters: [chapterProgressSchema],
  
  // Aggregated stats
  stats: {
    totalChaptersCompleted: { type: Number, default: 0 },
    totalTopicsCompleted: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 }, // in seconds
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date },
  }
}, { timestamps: true });

// Initialize default chapter progress for a new user
userProgressSchema.statics.initializeForUser = async function(userId) {
  // First 7 chapters unlocked by default structure (chapter 1 unlocked, rest locked)
  const defaultChapters = [];
  
  for (let i = 1; i <= 10; i++) {
    defaultChapters.push({
      chapterId: i,
      status: i === 1 ? "not-started" : "locked",
      topicsProgress: [],
      startedAt: null,
      completedAt: null,
    });
  }
  
  const progress = new this({
    userId,
    chapters: defaultChapters,
    stats: {
      totalChaptersCompleted: 0,
      totalTopicsCompleted: 0,
      totalTimeSpent: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
    }
  });
  
  return progress.save();
};

// Get or create progress for a user
userProgressSchema.statics.getOrCreate = async function(userId) {
  let progress = await this.findOne({ userId });
  
  if (!progress) {
    progress = await this.initializeForUser(userId);
  }
  
  return progress;
};

const UserProgress = mongoose.models.UserProgress || mongoose.model("UserProgress", userProgressSchema);

export default UserProgress;
