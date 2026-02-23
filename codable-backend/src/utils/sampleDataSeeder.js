// Sample Data Seeder for Student Profile Testing
// This file helps populate a student profile with sample analytics data

import StudentProfile from "../models/StudentProfile.js";

/**
 * Seeds sample analytics data for a given user profile
 * This is useful for testing the adaptive profile features
 */
export const seedSampleData = async (userId) => {
  try {
    const profile = await StudentProfile.findOne({ userId });
    
    if (!profile) {
      throw new Error("Profile not found for user");
    }

    // Sample Topic Mastery Data
    const sampleTopics = [
      {
        topicId: 'java-intro-001',
        topicName: 'Introduction to Java',
        totalAttempts: 25,
        correctAttempts: 22,
        firstAttemptSuccesses: 18,
        totalProblems: 20,
        hintsUsed: 3,
        avgCompletionTime: 12.5,
        lastPracticed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        difficultyLevel: 'intermediate',
        codeQualityScores: [85, 90, 88, 92, 87]
      },
      {
        topicId: 'java-vars-002',
        topicName: 'Variables & Data Types',
        totalAttempts: 30,
        correctAttempts: 20,
        firstAttemptSuccesses: 15,
        totalProblems: 25,
        hintsUsed: 8,
        avgCompletionTime: 10.2,
        lastPracticed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        difficultyLevel: 'intermediate',
        codeQualityScores: [75, 78, 80, 82, 79]
      },
      {
        topicId: 'java-control-003',
        topicName: 'Control Flow Statements',
        totalAttempts: 18,
        correctAttempts: 10,
        firstAttemptSuccesses: 5,
        totalProblems: 15,
        hintsUsed: 12,
        avgCompletionTime: 15.8,
        lastPracticed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        difficultyLevel: 'beginner',
        codeQualityScores: [60, 58, 65, 62]
      },
      {
        topicId: 'java-loops-004',
        topicName: 'Loops (for/while/do)',
        totalAttempts: 35,
        correctAttempts: 30,
        firstAttemptSuccesses: 25,
        totalProblems: 30,
        hintsUsed: 2,
        avgCompletionTime: 8.5,
        lastPracticed: new Date(),
        difficultyLevel: 'advanced',
        codeQualityScores: [92, 95, 93, 90, 94, 91]
      },
      {
        topicId: 'java-oop-005',
        topicName: 'Object-Oriented Programming',
        totalAttempts: 22,
        correctAttempts: 12,
        firstAttemptSuccesses: 8,
        totalProblems: 18,
        hintsUsed: 15,
        avgCompletionTime: 18.3,
        lastPracticed: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        difficultyLevel: 'beginner',
        codeQualityScores: [55, 60, 58, 62, 59]
      }
    ];

    // Sample Error Statistics
    const sampleErrors = {
      syntaxErrors: 45,
      logicErrors: 30,
      runtimeErrors: 20,
      edgeCaseFailures: 15,
      totalErrors: 110,
      commonPatterns: [
        'Missing semicolon',
        'Incorrect variable declaration',
        'Off-by-one errors in loops',
        'Null pointer exceptions',
        'Type mismatch errors'
      ]
    };

    // Sample Performance History (last 30 days)
    const sampleHistory = [];
    for (let i = 30; i > 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Simulate improving trend with some variance
      const baseScore = 50 + (30 - i) * 1.2; // Gradual improvement
      const variance = (Math.random() - 0.5) * 15; // Random variance
      const avgScore = Math.min(95, Math.max(40, baseScore + variance));
      
      sampleHistory.push({
        date: date,
        problemsSolved: Math.floor(Math.random() * 5) + 2,
        avgScore: Math.round(avgScore),
        timeSpent: Math.floor(Math.random() * 60) + 30 // 30-90 minutes
      });
    }

    // Sample Behavior Metrics
    const sampleBehavior = {
      totalProblemsAttempted: 130,
      totalHintsUsed: 40,
      totalSessions: 45,
      avgSessionDuration: 35, // minutes
      consistencyScore: 72,
      lastActiveDate: new Date()
    };

    // Update profile with sample data
    profile.topicMastery = sampleTopics;
    profile.errorStats = sampleErrors;
    profile.performanceHistory = sampleHistory;
    profile.behaviorMetrics = sampleBehavior;
    profile.learningPath = 'Java Programming';

    await profile.save();

    console.log(`✅ Sample data seeded successfully for user ${userId}`);
    return {
      success: true,
      message: "Sample data seeded successfully"
    };

  } catch (error) {
    console.error("Error seeding sample data:", error);
    throw error;
  }
};

/**
 * Clears all analytics data from a profile
 */
export const clearAnalyticsData = async (userId) => {
  try {
    const profile = await StudentProfile.findOne({ userId });
    
    if (!profile) {
      throw new Error("Profile not found for user");
    }

    profile.topicMastery = [];
    profile.errorStats = {
      syntaxErrors: 0,
      logicErrors: 0,
      runtimeErrors: 0,
      edgeCaseFailures: 0,
      totalErrors: 0,
      commonPatterns: []
    };
    profile.performanceHistory = [];
    profile.behaviorMetrics = {
      totalProblemsAttempted: 0,
      totalHintsUsed: 0,
      totalSessions: 0,
      avgSessionDuration: 0,
      consistencyScore: 0,
      lastActiveDate: null
    };

    await profile.save();

    console.log(`✅ Analytics data cleared for user ${userId}`);
    return {
      success: true,
      message: "Analytics data cleared successfully"
    };

  } catch (error) {
    console.error("Error clearing analytics data:", error);
    throw error;
  }
};

export default { seedSampleData, clearAnalyticsData };
