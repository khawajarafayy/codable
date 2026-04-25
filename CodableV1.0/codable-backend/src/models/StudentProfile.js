import mongoose from "mongoose";

// Track mastery per concept using Bayesian Knowledge Tracing
const conceptMasterySchema = new mongoose.Schema({
  topicId: { type: String, required: true },
  conceptTag: { type: String, required: true },
  masteryScore: { type: Number, default: 0.3 },  // 0.0 to 1.0 (BKT probability)
  attempts: { type: Number, default: 0 },
  correctAttempts: { type: Number, default: 0 },
  lastAttempted: { type: Date, default: null },
});

// Track each quiz attempt with per-question detail
const quizAttemptSchema = new mongoose.Schema({
  topicId: { type: String, required: true },
  attemptNumber: { type: Number, default: 1 },
  questions: [{
    questionId: { type: String },
    questionText: { type: String },
    conceptTags: [{ type: String }],
    userAnswer: { type: String },
    correctAnswer: { type: String },
    isCorrect: { type: Boolean },
    errorType: { type: String, enum: ['conceptual', 'syntax', 'logic', 'careless', 'unknown'], default: 'unknown' },
    errorDetail: { type: String, default: '' },
    timeSpent: { type: Number, default: 0 },
  }],
  passed: { type: Boolean, default: false },
  score: { type: Number, default: 0 },
  isRemediation: { type: Boolean, default: false },
  completedAt: { type: Date, default: Date.now },
});

const studentProfileSchema = new mongoose.Schema({
  // Reference to User
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user', 
    required: true,
    unique: true 
  },

  // Profile Information
  fullName: { 
    type: String, 
    required: true,
    trim: true
  },
  
  avatar: { 
    type: String, 
    default: null // URL or base64
  },
  
  bio: { 
    type: String, 
    maxlength: 500,
    default: ''
  },
  
  location: {
    city: { type: String, default: '' },
    country: { type: String, default: '' }
  },
  
  membershipTier: {
    type: String,
    enum: ['free', 'pro', 'premium'],
    default: 'free'
  },
  
  socialLinks: {
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' }
  },
  
  // Learning Path
  learningPath: {
    type: String,
    default: 'Java Programming'
  },
  
  // Topic Mastery Tracking
  topicMastery: [{
    topicId: { type: String, required: true },
    topicName: { type: String, required: true },
    totalAttempts: { type: Number, default: 0 },
    correctAttempts: { type: Number, default: 0 },
    firstAttemptSuccesses: { type: Number, default: 0 },
    totalProblems: { type: Number, default: 0 },
    hintsUsed: { type: Number, default: 0 },
    avgCompletionTime: { type: Number, default: 0 },
    lastPracticed: { type: Date, default: null },
    difficultyLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    codeQualityScores: [{ type: Number }]
  }],
  
  // Error Tracking - Global
  errorStats: {
    syntaxErrors: { type: Number, default: 0 },
    logicErrors: { type: Number, default: 0 },
    runtimeErrors: { type: Number, default: 0 },
    edgeCaseFailures: { type: Number, default: 0 },
    totalErrors: { type: Number, default: 0 },
    commonPatterns: [{ type: String }],
    // Chapter-level error tracking
    byChapter: [{
      chapterId: { type: Number, required: true },
      syntaxErrors: { type: Number, default: 0 },
      logicErrors: { type: Number, default: 0 },
      runtimeErrors: { type: Number, default: 0 },
      edgeCaseFailures: { type: Number, default: 0 },
      totalErrors: { type: Number, default: 0 },
      commonPatterns: [{ type: String }],
      errorPatterns: [{
        pattern: { type: String },
        frequency: { type: Number, default: 1 },
        lastOccurred: { type: Date, default: Date.now }
      }],
      averageScore: { type: Number, default: 0 },
      firstAttemptSuccessRate: { type: Number, default: 0 },
      lastPracticed: { type: Date, default: null }
    }],
    // Time-windowed error tracking for recent vs historical
    recent7Days: {
      syntaxErrors: { type: Number, default: 0 },
      logicErrors: { type: Number, default: 0 },
      runtimeErrors: { type: Number, default: 0 },
      edgeCaseFailures: { type: Number, default: 0 },
      totalErrors: { type: Number, default: 0 }
    }
  },
  
  // Performance History
  performanceHistory: [{
    date: { type: Date, default: Date.now },
    problemsSolved: { type: Number, default: 0 },
    avgScore: { type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 }
  }],
  
  // Learning Behavior Metrics
  behaviorMetrics: {
    totalProblemsAttempted: { type: Number, default: 0 },
    totalAttemptsMade: { type: Number, default: 0 },
    totalHintsUsed: { type: Number, default: 0 },
    totalSessions: { type: Number, default: 0 },
    avgSessionDuration: { type: Number, default: 0 },
    consistencyScore: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null },
    activeDaysCount: { type: Number, default: 0 }, // Days active in last 30 days
    activeDates: [{ type: Date }] // Last 30 days active dates for consistency calc
  },

  // Adaptive Learning - Concept Mastery (BKT)
  conceptMastery: [conceptMasterySchema],

  // Adaptive Learning - Quiz Attempts History
  quizAttempts: [quizAttemptSchema],

  // Adaptive Learning - Current adaptive state per topic
  adaptiveState: [{
    topicId: { type: String, required: true },
    status: { type: String, enum: ['not-started', 'learning', 'quiz', 'remediation', 'mastered'], default: 'not-started' },
    remediationCount: { type: Number, default: 0 },
    weakConcepts: [{ type: String }],
    lastUpdated: { type: Date, default: Date.now },
  }]

}, { timestamps: true });

// Virtual for full location
studentProfileSchema.virtual('fullLocation').get(function() {
  const { city, country } = this.location;
  return [city, country].filter(Boolean).join(', ') || 'Not specified';
});

// Method to get initials for avatar fallback
studentProfileSchema.methods.getInitials = function() {
  const name = this.fullName || 'User';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

// Static method to create profile for new user
studentProfileSchema.statics.createForUser = async function(userId, userData) {
  const profile = new this({
    userId,
    fullName: userData.name || userData.email.split('@')[0],
    avatar: null,
    bio: '',
    location: { city: '', country: '' },
    membershipTier: 'free',
    socialLinks: { github: '', linkedin: '', twitter: '' }
  });
  
  return await profile.save();
};

// Static method to get or create profile for a user
studentProfileSchema.statics.getOrCreateForUser = async function(userId, userData = {}) {
  let profile = await this.findOne({ userId });
  
  if (!profile) {
    profile = await this.createForUser(userId, userData);
  }
  
  return profile;
};

// Ensure virtuals are included in JSON
studentProfileSchema.set('toJSON', { virtuals: true });
studentProfileSchema.set('toObject', { virtuals: true });

const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);

export default StudentProfile;