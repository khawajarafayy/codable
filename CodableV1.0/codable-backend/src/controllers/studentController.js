import StudentProfile from "../models/StudentProfile.js";
import User from "../models/User.js";

const ALLOWED_AVATAR_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const validateAvatarValue = (avatarValue) => {
  if (avatarValue === undefined || avatarValue === null || avatarValue === "") {
    return { valid: true, message: "" };
  }

  if (typeof avatarValue !== "string") {
    return { valid: false, message: "Avatar must be a string." };
  }

  if (/^https?:\/\//i.test(avatarValue)) {
    return { valid: true, message: "" };
  }

  const dataUrlMatch = avatarValue.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/i);
  if (!dataUrlMatch) {
    return {
      valid: false,
      message: "Avatar must be a valid image data URL (jpeg, png, webp) or a direct image URL."
    };
  }

  const mimeType = dataUrlMatch[1].toLowerCase();
  if (!ALLOWED_AVATAR_MIME_TYPES.has(mimeType)) {
    return { valid: false, message: "Unsupported avatar format. Use JPG, PNG, or WEBP." };
  }

  return { valid: true, message: "" };
};

const CHAPTER_TITLES = {
  1: "Introduction to Computers, Programs, and Java",
  2: "Elementary Programming",
  3: "Selections",
  4: "Mathematical Functions, Characters, and Strings",
  5: "Loops",
  6: "Methods",
  7: "Single-Dimensional Arrays",
  8: "Multidimensional Arrays",
  9: "Objects and Classes",
  10: "Thinking in Objects"
};

const getStudentProfile = async (req, res) => {
  try {
    const userId = req.userId; 

    let profile = await StudentProfile.findOne({ userId })
      .populate('userId', 'email createdAt role');

    // If profile doesn't exist, create one automatically
    if (!profile) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      // Create a new profile for this user
      profile = await StudentProfile.createForUser(userId, { 
        name: user.name, 
        email: user.email 
      });

      // Populate the userId field
      profile = await StudentProfile.findById(profile._id)
        .populate('userId', 'email createdAt role');

      console.log("Auto-created profile for user:", userId);
    }

    // === COMPUTE ADAPTIVE METRICS ===
    
    // 1. Compute Overall Skill Rating
    const totalAttempts = profile.behaviorMetrics.totalProblemsAttempted || 0;
    let overallCorrectness = 0;
    let avgMastery = 0;
    
    console.log("Computing skill rating - topicMastery count:", profile.topicMastery.length);
    
    if (profile.topicMastery.length > 0) {
      const totalCorrect = profile.topicMastery.reduce((sum, t) => sum + t.correctAttempts, 0);
      const totalTopicAttempts = profile.topicMastery.reduce((sum, t) => sum + t.totalAttempts, 0);
      overallCorrectness = totalTopicAttempts > 0 ? (totalCorrect / totalTopicAttempts) * 100 : 0;
      
      // Average mastery across topics
      avgMastery = profile.topicMastery.reduce((sum, t) => {
        const mastery = t.totalAttempts > 0 ? (t.correctAttempts / t.totalAttempts) * 100 : 0;
        return sum + mastery;
      }, 0) / profile.topicMastery.length;
    }
    
    const overallSkillRating = Math.round(avgMastery);
    
    // 2. Determine Proficiency Level
    let proficiencyLevel = 'beginner';
    if (overallSkillRating >= 80) proficiencyLevel = 'expert';
    else if (overallSkillRating >= 60) proficiencyLevel = 'advanced';
    else if (overallSkillRating >= 40) proficiencyLevel = 'intermediate';
    
    // 3. Confidence Score (based on first-attempt success rate)
    let confidenceScore = 0;
    if (profile.topicMastery.length > 0) {
      const totalFirstAttempts = profile.topicMastery.reduce((sum, t) => sum + t.firstAttemptSuccesses, 0);
      const totalProblems = profile.topicMastery.reduce((sum, t) => sum + t.totalProblems, 0);
      confidenceScore = totalProblems > 0 ? Math.round((totalFirstAttempts / totalProblems) * 100) : 0;
    }
    
    console.log("Calculated metrics - Rating:", overallSkillRating, "Confidence:", confidenceScore, "Level:", proficiencyLevel);
    
    // 4. Recent Growth Rate (with proper date windowing)
    let recentGrowthRate = 0;
    const history = profile.performanceHistory || [];
    
    // Helper function to filter history by date range
    const filterHistoryByDays = (historyArray, days) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      return historyArray.filter(h => h.date && new Date(h.date) >= cutoffDate);
    };
    
    if (history.length >= 1) {
      const last7Days = filterHistoryByDays(history, 7);
      const days8to14 = filterHistoryByDays(history, 14).filter(h => {
        const cutoff7 = new Date();
        cutoff7.setDate(cutoff7.getDate() - 7);
        return new Date(h.date) < cutoff7;
      });
      
      const recentAvg = last7Days.length > 0 ? last7Days.reduce((sum, h) => sum + h.avgScore, 0) / last7Days.length : 0;
      const olderAvg = days8to14.length > 0 ? days8to14.reduce((sum, h) => sum + h.avgScore, 0) / days8to14.length : 0;
      recentGrowthRate = olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : 0;
    }
    
    // 5. Compute Topic Mastery Details
    const topicMasteryData = profile.topicMastery.map(topic => {
      const masteryScore = topic.totalAttempts > 0 ? Math.round((topic.correctAttempts / topic.totalAttempts) * 100) : 0;
      const correctnessScore = topic.totalAttempts > 0 ? Math.round((topic.correctAttempts / topic.totalAttempts) * 100) : 0;
      const firstAttemptRate = topic.totalProblems > 0 ? Math.round((topic.firstAttemptSuccesses / topic.totalProblems) * 100) : 0;
      const avgCodeQuality = topic.codeQualityScores.length > 0 
        ? Math.round(topic.codeQualityScores.reduce((a, b) => a + b, 0) / topic.codeQualityScores.length) 
        : 0;
      
      // Retention score (based on last practiced date)
      const daysSinceLastPractice = topic.lastPracticed 
        ? Math.floor((Date.now() - new Date(topic.lastPracticed).getTime()) / (1000 * 60 * 60 * 24)) 
        : 999;
      const retentionScore = Math.max(0, 100 - (daysSinceLastPractice * 5));
      
      // Recommended action
      let recommendedAction = 'practice';
      if (masteryScore >= 80) recommendedAction = 'advance';
      else if (masteryScore < 40) recommendedAction = 'review';
      
      return {
        topic_id: topic.topicId,
        topic_name: topic.topicName,
        mastery_score: masteryScore,
        correctness_score: correctnessScore,
        first_attempt_success_rate: firstAttemptRate,
        code_quality_score: avgCodeQuality,
        retention_score: retentionScore,
        difficulty_unlocked: topic.difficultyLevel,
        recommended_action: recommendedAction
      };
    });
    
    // 6. Chapter Mastery (from chapter practice questions + submission feedback)
    const chapterAttempts = profile.chapterPracticeAttempts || [];
    const chapterMasteryData = Object.values(
      chapterAttempts.reduce((acc, attempt) => {
        if (!attempt?.chapterId || !attempt?.questionId) return acc;

        const chapterKey = String(attempt.chapterId);
        if (!acc[chapterKey]) {
          acc[chapterKey] = {
            chapter_id: attempt.chapterId,
            chapter_name: attempt.chapterName || CHAPTER_TITLES[attempt.chapterId] || `Chapter ${attempt.chapterId}`,
            _questionStats: new Map(),
            _feedbackCounts: new Map(),
            _scoreSum: 0,
            _correctCount: 0,
            _maxQuestionSetSize: 0,
            total_attempts: 0
          };
        }

        const chapter = acc[chapterKey];
        chapter.total_attempts += 1;
        chapter._scoreSum += attempt.score || 0;
        if (attempt.isCorrect) chapter._correctCount += 1;
        if ((attempt.totalQuestionsInSet || 0) > chapter._maxQuestionSetSize) {
          chapter._maxQuestionSetSize = attempt.totalQuestionsInSet || 0;
        }

        const qid = String(attempt.questionId);
        const prevAttemptsForQuestion = chapter._questionStats.get(qid) || 0;
        chapter._questionStats.set(qid, prevAttemptsForQuestion + 1);

        (attempt.feedback || []).forEach((item) => {
          if (!item) return;
          const key = item.trim();
          if (!key) return;
          chapter._feedbackCounts.set(key, (chapter._feedbackCounts.get(key) || 0) + 1);
        });

        return acc;
      }, {})
    ).map((chapter) => {
      const uniqueQuestions = chapter._questionStats.size;
      const totalQuestions = Math.max(uniqueQuestions, chapter._maxQuestionSetSize || 0);
      const avgAttemptsPerQuestion = uniqueQuestions > 0
        ? chapter.total_attempts / uniqueQuestions
        : 0;
      const avgScore = chapter.total_attempts > 0
        ? chapter._scoreSum / chapter.total_attempts
        : 0;
      const successRate = chapter.total_attempts > 0
        ? (chapter._correctCount / chapter.total_attempts) * 100
        : 0;

      const mostCommonFeedback = Array.from(chapter._feedbackCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([message, count]) => ({ message, count }));

      return {
        chapter_id: chapter.chapter_id,
        chapter_name: chapter.chapter_name,
        total_questions: totalQuestions,
        total_attempts: chapter.total_attempts,
        avg_attempts_per_question: Number(avgAttemptsPerQuestion.toFixed(2)),
        avg_score: Math.round(avgScore),
        success_rate: Math.round(successRate),
        most_common_feedback: mostCommonFeedback
      };
    }).sort((a, b) => a.chapter_id - b.chapter_id);

    // 7. Error Profile with Chapter Breakdown and Recommendations
    // Ensure errorStats exists with proper initialization
    if (!profile.errorStats) {
      profile.errorStats = {
        syntaxErrors: 0,
        logicErrors: 0,
        runtimeErrors: 0,
        edgeCaseFailures: 0,
        totalErrors: 0,
        commonPatterns: [],
        byChapter: [],
        recent7Days: {
          syntaxErrors: 0,
          logicErrors: 0,
          runtimeErrors: 0,
          edgeCaseFailures: 0,
          totalErrors: 0
        }
      };
    }
    
    // Calculate overall error rates
    const totalErrors = profile.errorStats.totalErrors || 1;
    const recentTotalErrors = profile.errorStats.recent7Days.totalErrors || 1;
    
    // Compute chapter-level error data
    const chapterErrorData = (profile.errorStats.byChapter || []).map(ch => {
      const total = ch.totalErrors || 1;
      return {
        chapterId: ch.chapterId,
        syntaxErrorRate: total > 0 ? Math.round((ch.syntaxErrors / total) * 100) : 0,
        logicErrorRate: total > 0 ? Math.round((ch.logicErrors / total) * 100) : 0,
        runtimeErrorRate: total > 0 ? Math.round((ch.runtimeErrors / total) * 100) : 0,
        edgeCaseFailureRate: total > 0 ? Math.round((ch.edgeCaseFailures / total) * 100) : 0,
        totalErrorsInChapter: ch.totalErrors,
        averageScore: ch.averageScore,
        firstAttemptSuccessRate: ch.firstAttemptSuccessRate,
        errorPatterns: (ch.errorPatterns || []).sort((a, b) => b.frequency - a.frequency).slice(0, 5),
        lastPracticed: ch.lastPracticed
      };
    }).sort((a, b) => b.chapterId - a.chapterId);
    
    // Detect improvement/regression trends
    const errorTrend = {
      recentErrors: recentTotalErrors,
      totalErrors: totalErrors,
      trend: recentTotalErrors > totalErrors * 0.3 ? 'increasing' : recentTotalErrors < totalErrors * 0.1 ? 'decreasing' : 'stable'
    };
    
    // Generate actionable recommendations
    const errorRecommendations = [];
    
    // Check for high error rates
    const syntaxRate = totalErrors > 0 ? Math.round((profile.errorStats.syntaxErrors / totalErrors) * 100) : 0;
    const logicRate = totalErrors > 0 ? Math.round((profile.errorStats.logicErrors / totalErrors) * 100) : 0;
    const runtimeRate = totalErrors > 0 ? Math.round((profile.errorStats.runtimeErrors / totalErrors) * 100) : 0;
    const edgeCaseRate = totalErrors > 0 ? Math.round((profile.errorStats.edgeCaseFailures / totalErrors) * 100) : 0;
    
    if (syntaxRate > 40) {
      errorRecommendations.push({
        type: 'syntax_errors',
        message: 'Your syntax error rate is high. Review Java syntax rules and IDE error messages.',
        priority: 'high'
      });
    }
    
    if (logicRate > 40) {
      errorRecommendations.push({
        type: 'logic_errors',
        message: 'Focus on algorithm design. Practice breaking problems into smaller steps.',
        priority: 'high'
      });
    }
    
    if (edgeCaseRate > 30) {
      errorRecommendations.push({
        type: 'edge_cases',
        message: 'Test edge cases thoroughly. Consider boundary conditions in your code.',
        priority: 'high'
      });
    }
    
    // Check if error rate is increasing in recent attempts
    if (errorTrend.trend === 'increasing') {
      errorRecommendations.push({
        type: 'error_trend',
        message: 'Your error rate is increasing. Slow down and review fundamentals.',
        priority: 'medium'
      });
    }
    
    // Find chapters with highest error rates
    const problematicChapters = chapterErrorData
      .filter(ch => ch.totalErrorsInChapter > 5)
      .sort((a, b) => {
        const aRate = a.syntaxErrorRate + a.logicErrorRate;
        const bRate = b.syntaxErrorRate + b.logicErrorRate;
        return bRate - aRate;
      })
      .slice(0, 2);
    
    if (problematicChapters.length > 0) {
      problematicChapters.forEach(ch => {
        errorRecommendations.push({
          type: 'chapter_focus',
          chapterId: ch.chapterId,
          message: `Chapter ${ch.chapterId} has high error rate. Review concepts before proceeding.`,
          priority: 'medium'
        });
      });
    }
    
    const errorProfile = {
      // Overall rates
      syntax_error_rate: syntaxRate,
      logic_error_rate: logicRate,
      runtime_error_rate: runtimeRate,
      edge_case_failure_rate: edgeCaseRate,
      common_patterns: profile.errorStats.commonPatterns || [],
      
      // Chapter breakdown
      chapter_breakdown: chapterErrorData,
      
      // Recent vs all-time
      recent_7_days: {
        total_errors: recentTotalErrors,
        syntax_error_rate: recentTotalErrors > 0 ? Math.round((profile.errorStats.recent7Days.syntaxErrors / recentTotalErrors) * 100) : 0,
        logic_error_rate: recentTotalErrors > 0 ? Math.round((profile.errorStats.recent7Days.logicErrors / recentTotalErrors) * 100) : 0,
        runtime_error_rate: recentTotalErrors > 0 ? Math.round((profile.errorStats.recent7Days.runtimeErrors / recentTotalErrors) * 100) : 0,
        edge_case_failure_rate: recentTotalErrors > 0 ? Math.round((profile.errorStats.recent7Days.edgeCaseFailures / recentTotalErrors) * 100) : 0
      },
      
      // Trend analysis
      error_trend: errorTrend.trend,
      error_recommendations: errorRecommendations,
      
      // Total stats
      total_errors_recorded: totalErrors
    };

    
    // 8. Learning Behavior (with corrected formulas)
    const totalProblemsAttempted = profile.behaviorMetrics.totalProblemsAttempted || 1;
    const totalAttemptsMade = profile.behaviorMetrics.totalAttemptsMade || 0;
    const totalHintsUsed = profile.behaviorMetrics.totalHintsUsed || 0;
    
    // Avg attempts per problem: total attempts divided by total unique problems
    const avgAttemptsPerProblem = totalProblemsAttempted > 0 ? (totalAttemptsMade / totalProblemsAttempted).toFixed(1) : 0;
    
    // Hint dependency: how many hints per attempt (total hints / total attempts)
    const hintDependency = totalAttemptsMade > 0 ? ((totalHintsUsed / totalAttemptsMade) * 100).toFixed(1) : 0;
    
    // Persistence score (inversely related to hints and attempts)
    const persistenceScore = Math.max(0, 100 - (parseFloat(hintDependency) * 0.5) - (parseFloat(avgAttemptsPerProblem) * 5));
    
    // Improvement velocity (growth over time)
    const improvementVelocity = recentGrowthRate > 0 ? 'increasing' : recentGrowthRate < 0 ? 'decreasing' : 'stable';
    
    // Consistency score: calculate from active dates in last 30 days
    let consistencyScore = 0;
    if (profile.behaviorMetrics.activeDates && profile.behaviorMetrics.activeDates.length > 0) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeDatesLast30 = profile.behaviorMetrics.activeDates.filter(d => new Date(d) >= thirtyDaysAgo);
      consistencyScore = Math.round((activeDatesLast30.length / 30) * 100);
    }
    
    const learningBehavior = {
      avg_attempts_per_problem: parseFloat(avgAttemptsPerProblem),
      hint_dependency_ratio: parseFloat(hintDependency),
      problem_solving_persistence_score: Math.round(persistenceScore),
      consistency_score: consistencyScore,
      improvement_velocity: improvementVelocity
    };
    
    // 9. Performance Trends (with date-windowed data)
    const last7Days = filterHistoryByDays(history, 7);
    const last30Days = filterHistoryByDays(history, 30);
    
    const last7DaysAvg = last7Days.length > 0 ? Math.round(last7Days.reduce((sum, h) => sum + h.avgScore, 0) / last7Days.length) : 0;
    const last30DaysAvg = last30Days.length > 0 ? Math.round(last30Days.reduce((sum, h) => sum + h.avgScore, 0) / last30Days.length) : 0;
    
    // Performance stability (low variance = high stability)
    let performanceStability = 0;
    if (last30Days.length > 1) {
      const mean = last30DaysAvg;
      const variance = last30Days.reduce((sum, h) => sum + Math.pow(h.avgScore - mean, 2), 0) / last30Days.length;
      const stdDev = Math.sqrt(variance);
      performanceStability = Math.max(0, Math.min(100, 100 - (stdDev * 2))); // normalize std dev to 0-100 scale
    } else if (last30Days.length === 1) {
      performanceStability = 100; // perfect stability with single data point
    }
    
    const performanceTrends = {
      last_7_days_avg_score: last7DaysAvg,
      last_30_days_avg_score: last30DaysAvg,
      performance_stability_index: Math.round(performanceStability),
      growth_trend: recentGrowthRate > 0 ? 'improving' : recentGrowthRate < 0 ? 'declining' : 'stable'
    };
    
    // 10. Adaptive Recommendations
    const weakTopics = topicMasteryData
      .filter(t => t.mastery_score < 60)
      .sort((a, b) => a.mastery_score - b.mastery_score)
      .slice(0, 3)
      .map(t => ({
        topic_id: t.topic_id,
        topic_name: t.topic_name,
        priority_score: Math.round(100 - t.mastery_score),
        reason: t.mastery_score < 40 
          ? 'Fundamental gaps detected' 
          : 'Needs reinforcement',
        recommended_content_type: t.mastery_score < 40 ? 'tutorial' : 'practice'
      }));
    
    // === BUILD RESPONSE ===
    console.log("Building response with skill_overview:", {
      overall_skill_rating: overallSkillRating,
      proficiency_level: proficiencyLevel,
      confidence_score: confidenceScore,
      recent_growth_rate: recentGrowthRate
    });
    
    res.status(200).json({
      success: true,
      user_profile: {
        basic_info: {
          user_id: profile.userId._id,
          full_name: profile.fullName,
          email: profile.userId.email,
          join_date: profile.userId.createdAt,
          learning_path: profile.learningPath || 'Java Programming',
          avatar: profile.avatar,
          bio: profile.bio,
          location: profile.location,
          membership_tier: profile.membershipTier,
          social_links: profile.socialLinks
        },
        skill_overview: {
          overall_skill_rating: overallSkillRating,
          proficiency_level: proficiencyLevel,
          confidence_score: confidenceScore,
          recent_growth_rate: recentGrowthRate
        },
        topic_mastery: topicMasteryData,
        chapter_mastery: chapterMasteryData,
        error_profile: errorProfile,
        learning_behavior: learningBehavior,
        performance_trends: performanceTrends,
        adaptive_recommendations: weakTopics
      }
    });
  } catch (error) {
    console.error("Error fetching student profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Create student profile (called during signup)
const createStudentProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { fullName, avatar, bio, location, socialLinks } = req.body;

    const avatarValidation = validateAvatarValue(avatar);
    if (!avatarValidation.valid) {
      return res.status(400).json({
        success: false,
        message: avatarValidation.message
      });
    }

    // Check if profile already exists
    const existingProfile = await StudentProfile.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: "Profile already exists for this user"
      });
    }

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Create new profile
    const profile = new StudentProfile({
      userId,
      fullName: fullName || user.name || user.email.split('@')[0],
      avatar: avatar || null,
      bio: bio || '',
      location: location || { city: '', country: '' },
      membershipTier: 'free',
      socialLinks: socialLinks || { github: '', linkedin: '', twitter: '' }
    });

    await profile.save();

    res.status(201).json({
      success: true,
      message: "Student profile created successfully",
      data: {
        _id: profile._id,
        fullName: profile.fullName,
        avatar: profile.avatar,
        bio: profile.bio,
        location: profile.location,
        membershipTier: profile.membershipTier,
        socialLinks: profile.socialLinks,
        initials: profile.getInitials()
      }
    });
  } catch (error) {
    console.error("Error creating student profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Update student profile
const updateStudentProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { fullName, avatar, bio, location, socialLinks } = req.body;

    const avatarValidation = validateAvatarValue(avatar);
    if (!avatarValidation.valid) {
      return res.status(400).json({
        success: false,
        message: avatarValidation.message
      });
    }

    // Find profile
    const profile = await StudentProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found"
      });
    }

    // Update fields if provided
    if (fullName !== undefined) profile.fullName = fullName;
    if (avatar !== undefined) profile.avatar = avatar;
    if (bio !== undefined) profile.bio = bio;

    if (location) {
      if (location.city !== undefined) profile.location.city = location.city;
      if (location.country !== undefined) profile.location.country = location.country;
    }

    if (socialLinks) {
      if (socialLinks.github !== undefined) profile.socialLinks.github = socialLinks.github;
      if (socialLinks.linkedin !== undefined) profile.socialLinks.linkedin = socialLinks.linkedin;
      if (socialLinks.twitter !== undefined) profile.socialLinks.twitter = socialLinks.twitter;
    }

    await profile.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        _id: profile._id,
        fullName: profile.fullName,
        avatar: profile.avatar,
        bio: profile.bio,
        location: profile.location,
        fullLocation: profile.fullLocation,
        membershipTier: profile.membershipTier,
        socialLinks: profile.socialLinks,
        initials: profile.getInitials(),
        updatedAt: profile.updatedAt
      }
    });
  } catch (error) {
    console.error("Error updating student profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Delete student profile
const deleteStudentProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const profile = await StudentProfile.findOneAndDelete({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Student profile deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting student profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const upgradeMembership = async (req, res) => {
  try {
    const userId = req.userId;
    const { tier } = req.body; // 'pro' or 'premium'

    if (!['pro', 'premium'].includes(tier)) {
      return res.status(400).json({
        success: false,
        message: "Invalid membership tier. Use 'pro' or 'premium'"
      });
    }

    const profile = await StudentProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found"
      });
    }

    profile.membershipTier = tier;
    await profile.save();

    res.status(200).json({
      success: true,
      message: `Membership upgraded to ${tier} successfully`,
      data: {
        membershipTier: profile.membershipTier
      }
    });
  } catch (error) {
    console.error("Error upgrading membership:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Handle analytics events from frontend (practice submissions, quiz answers, hint usage)
const updateStudentAnalytics = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      eventType,
      topicId,
      topicName,
      attempts,
      score,
      syntaxErrorCount,
      logicErrorCount,
      runtimeErrorCount,
      edgeCaseFailureCount,
      outputMatched,
      responses,
      total,
      isRemediation,
      hintIndex,
      chapterId,
      chapterName,
      questionId,
      questionTitle,
      isCorrect,
      feedback,
      suggestions,
      totalQuestionsInSet
    } = req.body;
    
    // Get or create student profile
    let profile = await StudentProfile.findOne({ userId });
    if (!profile) {
      profile = new StudentProfile({ userId });
    }
    
    // Update last active date and add to active dates for consistency tracking
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    profile.behaviorMetrics.lastActiveDate = new Date();
    
    // Track active date for consistency (keep only last 30 days)
    if (!profile.behaviorMetrics.activeDates) {
      profile.behaviorMetrics.activeDates = [];
    }
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    profile.behaviorMetrics.activeDates = profile.behaviorMetrics.activeDates.filter(d => new Date(d) >= thirtyDaysAgo);
    
    // Add today's date if not already present
    const todayExists = profile.behaviorMetrics.activeDates.some(d => {
      const date = new Date(d);
      return date.toDateString() === today.toDateString();
    });
    if (!todayExists) {
      profile.behaviorMetrics.activeDates.push(today);
    }
    
    // Handle different event types
    if (eventType === 'practice_submission') {
      // Record chapter-level attempts from end-of-chapter practice submissions
      if (chapterId && questionId) {
        if (!profile.chapterPracticeAttempts) {
          profile.chapterPracticeAttempts = [];
        }
        profile.chapterPracticeAttempts.push({
          chapterId: Number(chapterId),
          chapterName: chapterName || CHAPTER_TITLES[Number(chapterId)] || '',
          questionId: String(questionId),
          questionTitle: questionTitle || '',
          totalQuestionsInSet: Number(totalQuestionsInSet) || 0,
          score: score || 0,
          isCorrect: Boolean(isCorrect),
          feedback: Array.isArray(feedback) ? feedback.slice(0, 10) : [],
          suggestions: Array.isArray(suggestions) ? suggestions.slice(0, 10) : [],
          submittedAt: new Date()
        });
      }

      // Update topic mastery
      if (topicId && topicName) {
        let topicData = profile.topicMastery.find(t => t.topicId === topicId);
        if (!topicData) {
          topicData = {
            topicId,
            topicName,
            totalAttempts: 0,
            correctAttempts: 0,
            firstAttemptSuccesses: 0,
            totalProblems: 0,
            hintsUsed: 0,
            codeQualityScores: [],
            lastPracticed: null,
            difficultyLevel: 'beginner'
          };
          profile.topicMastery.push(topicData);
        }
        
        // Increment counters
        topicData.totalAttempts += attempts || 1;
        topicData.totalProblems = Math.max(topicData.totalProblems, topicData.totalAttempts); // at least as many as attempts
        if (score >= 80) topicData.correctAttempts += 1;
        if (attempts === 1 && score >= 80) topicData.firstAttemptSuccesses += 1;
        if (outputMatched) topicData.codeQualityScores.push(Math.min(100, score));
        topicData.lastPracticed = new Date();
      }
      
      // Update error statistics
      if (!profile.errorStats) {
        profile.errorStats = {
          syntaxErrors: 0,
          logicErrors: 0,
          runtimeErrors: 0,
          edgeCaseFailures: 0,
          totalErrors: 0,
          commonPatterns: [],
          byChapter: [],
          recent7Days: {
            syntaxErrors: 0,
            logicErrors: 0,
            runtimeErrors: 0,
            edgeCaseFailures: 0,
            totalErrors: 0
          }
        };
      }
      
      // Global error tracking
      profile.errorStats.syntaxErrors += syntaxErrorCount || 0;
      profile.errorStats.logicErrors += logicErrorCount || 0;
      profile.errorStats.runtimeErrors += runtimeErrorCount || 0;
      profile.errorStats.edgeCaseFailures += edgeCaseFailureCount || 0;
      profile.errorStats.totalErrors = profile.errorStats.syntaxErrors + profile.errorStats.logicErrors + profile.errorStats.runtimeErrors + profile.errorStats.edgeCaseFailures;
      
      // Track recent 7 days for trend analysis
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      if (new Date() >= sevenDaysAgo) {
        profile.errorStats.recent7Days.syntaxErrors += syntaxErrorCount || 0;
        profile.errorStats.recent7Days.logicErrors += logicErrorCount || 0;
        profile.errorStats.recent7Days.runtimeErrors += runtimeErrorCount || 0;
        profile.errorStats.recent7Days.edgeCaseFailures += edgeCaseFailureCount || 0;
        profile.errorStats.recent7Days.totalErrors += (syntaxErrorCount || 0) + (logicErrorCount || 0) + (runtimeErrorCount || 0) + (edgeCaseFailureCount || 0);
      }
      
      // Chapter-level error tracking (extract chapter from topicId like "1-1", "2-5", etc.)
      if (topicId) {
        const chapterMatch = topicId.match(/^(\d+)/);
        const chapterId = chapterMatch ? parseInt(chapterMatch[1]) : null;
        
        if (chapterId) {
          let chapterStats = profile.errorStats.byChapter.find(c => c.chapterId === chapterId);
          if (!chapterStats) {
            chapterStats = {
              chapterId,
              syntaxErrors: 0,
              logicErrors: 0,
              runtimeErrors: 0,
              edgeCaseFailures: 0,
              totalErrors: 0,
              commonPatterns: [],
              errorPatterns: [],
              averageScore: 0,
              firstAttemptSuccessRate: 0,
              lastPracticed: new Date()
            };
            profile.errorStats.byChapter.push(chapterStats);
          }
          
          // Update chapter-level stats
          chapterStats.syntaxErrors += syntaxErrorCount || 0;
          chapterStats.logicErrors += logicErrorCount || 0;
          chapterStats.runtimeErrors += runtimeErrorCount || 0;
          chapterStats.edgeCaseFailures += edgeCaseFailureCount || 0;
          chapterStats.totalErrors = chapterStats.syntaxErrors + chapterStats.logicErrors + chapterStats.runtimeErrors + chapterStats.edgeCaseFailures;
          chapterStats.lastPracticed = new Date();
          
          // Track error patterns
          if (logicErrorCount > 0) {
            const patterns = ['Missing loop condition', 'Incorrect variable scope', 'Off-by-one error', 'Infinite loop', 'Logic error in nested structures'];
            const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
            let existingPattern = chapterStats.errorPatterns.find(p => p.pattern === randomPattern);
            if (existingPattern) {
              existingPattern.frequency += 1;
              existingPattern.lastOccurred = new Date();
            } else {
              chapterStats.errorPatterns.push({
                pattern: randomPattern,
                frequency: 1,
                lastOccurred: new Date()
              });
            }
          }
        }
      }
      
      // Update behavior metrics
      profile.behaviorMetrics.totalProblemsAttempted += 1;
      profile.behaviorMetrics.totalAttemptsMade += attempts || 1;
      
      // Update performance history (one entry per day per topic)
      if (!profile.performanceHistory) {
        profile.performanceHistory = [];
      }
      const today_str = today.toISOString();
      let todayEntry = profile.performanceHistory.find(h => h.date && new Date(h.date).toDateString() === today.toDateString());
      if (!todayEntry) {
        todayEntry = {
          date: today,
          problemsSolved: 0,
          avgScore: 0,
          timeSpent: 0
        };
        profile.performanceHistory.push(todayEntry);
      }
      // Update daily aggregate
      const existingCount = todayEntry.problemsSolved || 0;
      todayEntry.avgScore = ((todayEntry.avgScore * existingCount) + score) / (existingCount + 1);
      todayEntry.problemsSolved = existingCount + 1;
      
    } else if (eventType === 'quiz_complete') {
      // Track quiz attempt
      if (!profile.quizAttempts) {
        profile.quizAttempts = [];
      }
      
      profile.quizAttempts.push({
        attemptedAt: new Date(),
        totalQuestions: total || 0,
        correctAnswers: responses ? responses.filter(r => r.is_correct).length : 0,
        score: score || 0,
        isRemediation: isRemediation || false,
        detailedResponses: responses || []
      });
      
      // Update topic mastery from quiz responses
      if (responses && Array.isArray(responses)) {
        responses.forEach(response => {
          const conceptTags = response.concept_tags || [];
          conceptTags.forEach(concept => {
            let topicData = profile.topicMastery.find(t => t.topicId === concept);
            if (!topicData) {
              topicData = {
                topicId: concept,
                topicName: concept,
                totalAttempts: 0,
                correctAttempts: 0,
                firstAttemptSuccesses: 0,
                totalProblems: 0,
                hintsUsed: 0,
                codeQualityScores: [],
                lastPracticed: new Date(),
                difficultyLevel: 'beginner'
              };
              profile.topicMastery.push(topicData);
            }
            topicData.totalAttempts += 1;
            if (response.is_correct) topicData.correctAttempts += 1;
          });
        });
      }
      
      profile.behaviorMetrics.totalProblemsAttempted += 1;
      
    } else if (eventType === 'hint_used') {
      // Track hint usage
      profile.behaviorMetrics.totalHintsUsed += 1;
      
      // Update topic mastery hint count
      if (topicId) {
        let topicData = profile.topicMastery.find(t => t.topicId === topicId);
        if (topicData) {
          topicData.hintsUsed += 1;
        }
      }
    }
    
    // Save updated profile
    await profile.save();
    
    // Return the updated metrics
    res.status(200).json({
      success: true,
      message: `Analytics event '${eventType}' recorded successfully`,
      profile: {
        userId: profile.userId,
        totalProblemsAttempted: profile.behaviorMetrics.totalProblemsAttempted,
        totalHintsUsed: profile.behaviorMetrics.totalHintsUsed,
        topicCount: profile.topicMastery.length
      }
    });
    
  } catch (error) {
    console.error("Error updating student analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record analytics event",
      error: error.message
    });
  }
};

export default {
  getStudentProfile,
  createStudentProfile,
  updateStudentProfile,
  deleteStudentProfile,
  upgradeMembership,
  updateStudentAnalytics
};