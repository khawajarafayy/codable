import StudentProfile from "../models/StudentProfile.js";
import User from "../models/User.js";

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
    
    // 4. Recent Growth Rate
    let recentGrowthRate = 0;
    const history = profile.performanceHistory || [];
    if (history.length >= 2) {
      const recent = history.slice(-7); // last 7 entries
      const older = history.slice(-14, -7);
      const recentAvg = recent.reduce((sum, h) => sum + h.avgScore, 0) / recent.length || 0;
      const olderAvg = older.length > 0 ? older.reduce((sum, h) => sum + h.avgScore, 0) / older.length : 0;
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
    
    // 6. Error Profile
    const totalErrors = profile.errorStats.totalErrors || 1; // avoid division by zero
    const errorProfile = {
      syntax_error_rate: Math.round((profile.errorStats.syntaxErrors / totalErrors) * 100) || 0,
      logic_error_rate: Math.round((profile.errorStats.logicErrors / totalErrors) * 100) || 0,
      runtime_error_rate: Math.round((profile.errorStats.runtimeErrors / totalErrors) * 100) || 0,
      edge_case_failure_rate: Math.round((profile.errorStats.edgeCaseFailures / totalErrors) * 100) || 0,
      common_patterns: profile.errorStats.commonPatterns || []
    };
    
    // 7. Learning Behavior
    const avgAttemptsPerProblem = totalAttempts > 0 ? (totalAttempts / (profile.behaviorMetrics.totalProblemsAttempted || 1)).toFixed(1) : 0;
    const hintDependency = totalAttempts > 0 ? ((profile.behaviorMetrics.totalHintsUsed / totalAttempts) * 100).toFixed(1) : 0;
    
    // Persistence score (inversely related to hints and attempts)
    const persistenceScore = Math.max(0, 100 - (hintDependency * 0.5) - (avgAttemptsPerProblem * 5));
    
    // Improvement velocity (growth over time)
    const improvementVelocity = recentGrowthRate > 0 ? 'increasing' : recentGrowthRate < 0 ? 'decreasing' : 'stable';
    
    const learningBehavior = {
      avg_attempts_per_problem: parseFloat(avgAttemptsPerProblem),
      hint_dependency_ratio: parseFloat(hintDependency),
      problem_solving_persistence_score: Math.round(persistenceScore),
      consistency_score: profile.behaviorMetrics.consistencyScore || 0,
      improvement_velocity: improvementVelocity
    };
    
    // 8. Performance Trends
    const last7Days = history.slice(-7);
    const last30Days = history.slice(-30);
    
    const last7DaysAvg = last7Days.length > 0 ? Math.round(last7Days.reduce((sum, h) => sum + h.avgScore, 0) / last7Days.length) : 0;
    const last30DaysAvg = last30Days.length > 0 ? Math.round(last30Days.reduce((sum, h) => sum + h.avgScore, 0) / last30Days.length) : 0;
    
    // Performance stability (low variance = high stability)
    let performanceStability = 0;
    if (last30Days.length > 0) {
      const mean = last30DaysAvg;
      const variance = last30Days.reduce((sum, h) => sum + Math.pow(h.avgScore - mean, 2), 0) / last30Days.length;
      performanceStability = Math.max(0, 100 - Math.sqrt(variance));
    }
    
    const performanceTrends = {
      last_7_days_avg_score: last7DaysAvg,
      last_30_days_avg_score: last30DaysAvg,
      performance_stability_index: Math.round(performanceStability),
      growth_trend: recentGrowthRate > 0 ? 'improving' : recentGrowthRate < 0 ? 'declining' : 'stable'
    };
    
    // 9. Adaptive Recommendations
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

export default {
  getStudentProfile,
  createStudentProfile,
  updateStudentProfile,
  deleteStudentProfile,
  upgradeMembership
};