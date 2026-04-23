import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  getUserProgress,
  getChaptersProgress,
  startChapter,
  completeTopic,
  completeChapter,
  getChapterTopicsProgress,
} from "../controllers/progressController.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.userAuth);

// Get full progress data
router.get("/", getUserProgress);

// Get chapters progress for dashboard
router.get("/chapters", getChaptersProgress);

// Get topics progress for a specific chapter
router.get("/chapters/:chapterId/topics", getChapterTopicsProgress);

// Start a chapter
router.post("/chapters/:chapterId/start", startChapter);

// Complete a topic
router.post("/chapters/:chapterId/topics/:topicId/complete", completeTopic);

// Complete a chapter
router.post("/chapters/:chapterId/complete", completeChapter);

export default router;
