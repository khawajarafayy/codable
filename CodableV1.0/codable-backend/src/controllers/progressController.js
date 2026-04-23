import UserProgress from "../models/UserProgress.js";

// Get user's full progress data
export const getUserProgress = async (req, res) => {
  try {
    const userId = req.userId;
    const progress = await UserProgress.getOrCreate(userId);
    
    res.status(200).json({
      success: true,
      progress: progress
    });
  } catch (error) {
    console.error("Error getting user progress:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get user progress"
    });
  }
};

// Known total topics per chapter (from the RAG content)
const CHAPTER_TOTAL_TOPICS = {
  1: 10, 2: 16, 3: 11, 4: 5, 5: 8, 6: 8, 7: 8, 8: 5, 9: 9, 10: 8
};

// Get chapter progress for dashboard (locked/unlocked status)
export const getChaptersProgress = async (req, res) => {
  try {
    const userId = req.userId;
    const progress = await UserProgress.getOrCreate(userId);
    
    // Return simplified chapter data for dashboard
    const chaptersData = progress.chapters.map(chapter => ({
      chapterId: chapter.chapterId,
      status: chapter.status,
      completedTopics: chapter.topicsProgress.filter(t => t.completed).length,
      totalTopics: CHAPTER_TOTAL_TOPICS[chapter.chapterId] || chapter.topicsProgress.length,
    }));
    
    res.status(200).json({
      success: true,
      chapters: chaptersData,
      stats: progress.stats
    });
  } catch (error) {
    console.error("Error getting chapters progress:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get chapters progress"
    });
  }
};

// Start a chapter (mark as in-progress)
export const startChapter = async (req, res) => {
  try {
    const userId = req.userId;
    const { chapterId } = req.params;
    
    const progress = await UserProgress.getOrCreate(userId);
    const chapterIndex = progress.chapters.findIndex(c => c.chapterId === parseInt(chapterId));
    
    if (chapterIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Chapter not found"
      });
    }
    
    const chapter = progress.chapters[chapterIndex];
    
    // Check if chapter is locked
    if (chapter.status === "locked") {
      return res.status(403).json({
        success: false,
        error: "Chapter is locked. Complete previous chapters first."
      });
    }
    
    // Mark as in-progress if not started
    if (chapter.status === "not-started") {
      chapter.status = "in-progress";
      chapter.startedAt = new Date();
    }
    
    // Update last active date
    progress.stats.lastActiveDate = new Date();
    
    await progress.save();
    
    res.status(200).json({
      success: true,
      message: "Chapter started",
      chapter: chapter
    });
  } catch (error) {
    console.error("Error starting chapter:", error);
    res.status(500).json({
      success: false,
      error: "Failed to start chapter"
    });
  }
};

// Complete a topic within a chapter
export const completeTopic = async (req, res) => {
  try {
    const userId = req.userId;
    const { chapterId, topicId } = req.params;
    const { timeSpent } = req.body; // Optional time spent in seconds
    
    const progress = await UserProgress.getOrCreate(userId);
    const chapterIndex = progress.chapters.findIndex(c => c.chapterId === parseInt(chapterId));
    
    if (chapterIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Chapter not found"
      });
    }
    
    const chapter = progress.chapters[chapterIndex];
    
    // Find or create topic progress
    let topicProgress = chapter.topicsProgress.find(t => t.topicId === topicId);
    
    if (!topicProgress) {
      chapter.topicsProgress.push({
        topicId,
        completed: true,
        completedAt: new Date(),
        timeSpent: timeSpent || 0
      });
    } else if (!topicProgress.completed) {
      topicProgress.completed = true;
      topicProgress.completedAt = new Date();
      topicProgress.timeSpent = (topicProgress.timeSpent || 0) + (timeSpent || 0);
    }
    
    // Update stats
    progress.stats.totalTopicsCompleted = progress.chapters.reduce(
      (acc, ch) => acc + ch.topicsProgress.filter(t => t.completed).length, 
      0
    );
    progress.stats.totalTimeSpent += timeSpent || 0;
    progress.stats.lastActiveDate = new Date();
    
    await progress.save();
    
    res.status(200).json({
      success: true,
      message: "Topic completed",
      topicsCompleted: chapter.topicsProgress.filter(t => t.completed).length
    });
  } catch (error) {
    console.error("Error completing topic:", error);
    res.status(500).json({
      success: false,
      error: "Failed to complete topic"
    });
  }
};

// Complete a chapter (all topics done)
export const completeChapter = async (req, res) => {
  try {
    const userId = req.userId;
    const { chapterId } = req.params;
    
    const progress = await UserProgress.getOrCreate(userId);
    const chapterIndex = progress.chapters.findIndex(c => c.chapterId === parseInt(chapterId));
    
    if (chapterIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Chapter not found"
      });
    }
    
    const chapter = progress.chapters[chapterIndex];
    chapter.status = "completed";
    chapter.completedAt = new Date();
    
    // Unlock next chapter
    const nextChapterIndex = chapterIndex + 1;
    if (nextChapterIndex < progress.chapters.length) {
      const nextChapter = progress.chapters[nextChapterIndex];
      if (nextChapter.status === "locked") {
        nextChapter.status = "not-started";
      }
    }
    
    // Update stats
    progress.stats.totalChaptersCompleted = progress.chapters.filter(
      c => c.status === "completed"
    ).length;
    progress.stats.lastActiveDate = new Date();
    
    // Update streak
    updateStreak(progress);
    
    await progress.save();
    
    res.status(200).json({
      success: true,
      message: "Chapter completed",
      nextChapterUnlocked: nextChapterIndex < progress.chapters.length
    });
  } catch (error) {
    console.error("Error completing chapter:", error);
    res.status(500).json({
      success: false,
      error: "Failed to complete chapter"
    });
  }
};

// Helper function to update streak
function updateStreak(progress) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActive = progress.stats.lastActiveDate;
  
  if (!lastActive) {
    progress.stats.currentStreak = 1;
  } else {
    const lastActiveDay = new Date(lastActive);
    lastActiveDay.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((today - lastActiveDay) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Same day, streak unchanged
    } else if (diffDays === 1) {
      // Consecutive day, increment streak
      progress.stats.currentStreak += 1;
    } else {
      // Streak broken
      progress.stats.currentStreak = 1;
    }
  }
  
  // Update longest streak if needed
  if (progress.stats.currentStreak > progress.stats.longestStreak) {
    progress.stats.longestStreak = progress.stats.currentStreak;
  }
}

// Get topic progress for a specific chapter
export const getChapterTopicsProgress = async (req, res) => {
  try {
    const userId = req.userId;
    const { chapterId } = req.params;
    
    const progress = await UserProgress.getOrCreate(userId);
    const chapter = progress.chapters.find(c => c.chapterId === parseInt(chapterId));
    
    if (!chapter) {
      return res.status(404).json({
        success: false,
        error: "Chapter not found"
      });
    }
    
    res.status(200).json({
      success: true,
      chapterId: chapter.chapterId,
      status: chapter.status,
      topicsProgress: chapter.topicsProgress
    });
  } catch (error) {
    console.error("Error getting chapter topics progress:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get chapter topics progress"
    });
  }
};
